const state = {
  processed: 0,
  result: null,
  stepIndex: 0,
  memo: "",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const invoices = Array.from({ length: 24 }, (_, i) => {
  const base = 680 + ((i * 137) % 4200);
  const tax = Math.round(base * (i % 4 === 0 ? 0.18 : 0.09));
  return {
    id: `INV-${String(6401 + i).padStart(4, "0")}`,
    customer: ["Kite Labs", "UrbanCart", "OrbitPay", "Nova Retail", "Atlas Cloud", "Pine Foods"][i % 6],
    amount: base + tax,
    tax,
    dueDay: 2 + (i % 12),
    status: i % 11 === 0 ? "credit-note-risk" : "open",
  };
});

const bankLines = invoices.slice(0, 21).map((invoice, i) => ({
  id: `BNK-${9100 + i}`,
  memo: `${invoice.customer} settlement ${invoice.id}`,
  amount: invoice.amount - (i % 7 === 0 ? 12 : 0),
  day: invoice.dueDay + (i % 3),
  source: "bank",
}));

bankLines.push(
  { id: "BNK-9124", memo: "Unknown UPI aggregator sweep", amount: 2840, day: 13, source: "bank" },
  { id: "BNK-9125", memo: "Duplicate deposit OrbitPay INV-6414", amount: invoices[13].amount, day: 14, source: "bank" },
  { id: "BNK-9126", memo: "Chargeback reversal card network", amount: -1190, day: 15, source: "bank" }
);

const settlements = invoices.slice(0, 22).map((invoice, i) => ({
  id: `SET-${7300 + i}`,
  reference: invoice.id,
  gross: invoice.amount,
  fee: Math.round(invoice.amount * 0.018) + (i % 5),
  net: invoice.amount - Math.round(invoice.amount * 0.018) - (i % 5),
  day: invoice.dueDay + 1,
}));

settlements.push(
  { id: "SET-7323", reference: "INV-6499", gross: 3860, fee: 74, net: 3786, day: 11 },
  { id: "SET-7324", reference: "INV-6412", gross: invoices[11].amount, fee: 0, net: invoices[11].amount, day: 13 }
);

const taxLines = invoices.slice(0, 20).map((invoice, i) => ({
  id: `TAX-${5200 + i}`,
  invoiceId: invoice.id,
  expectedTax: invoice.tax,
  filedTax: invoice.tax + (i % 9 === 0 ? 17 : 0),
}));

taxLines.push(
  { id: "TAX-5220", invoiceId: "INV-6423", expectedTax: 0, filedTax: 212 },
  { id: "TAX-5221", invoiceId: "INV-6407", expectedTax: invoices[6].tax, filedTax: 0 }
);

const allRecords = [...invoices, ...bankLines, ...settlements, ...taxLines];

const steps = [
  ["Ingest", "Normalized invoices, bank memos, gateway settlements, and tax ledger rows."],
  ["Link", "Built candidate clusters using references, names, dates, amount bands, and net-of-fee tests."],
  ["Verify", "Applied confidence floor, duplicate checks, fee variance limits, and tax-line validation."],
  ["Close", "Posted verified matches into cash position and isolated unresolved exceptions."],
];

function reconcile() {
  const floor = Number(document.getElementById("confidence").value);
  const pressure = document.getElementById("pressure").value;
  const autoResolve = document.getElementById("autoResolve").checked;
  const matched = [];
  const exceptions = [];
  const matchedInvoiceIds = new Set();

  invoices.forEach((invoice) => {
    const bank = bankLines.find((line) => line.memo.includes(invoice.id));
    const settlement = settlements.find((line) => line.reference === invoice.id);
    const tax = taxLines.find((line) => line.invoiceId === invoice.id);

    let confidence = 58;
    const reasons = [];

    if (bank) {
      confidence += Math.abs(bank.amount - invoice.amount) <= 15 ? 17 : 8;
      reasons.push("bank reference");
    }
    if (settlement) {
      const expectedNet = settlement.gross - settlement.fee;
      confidence += Math.abs(expectedNet - settlement.net) <= 1 ? 12 : 3;
      reasons.push("settlement net");
    }
    if (tax) {
      confidence += tax.expectedTax === tax.filedTax ? 10 : -6;
      reasons.push("tax tie-out");
    }
    if (invoice.status === "credit-note-risk") confidence -= 9;
    if (pressure === "messy") confidence -= 5;
    if (pressure === "strict") confidence -= tax ? 2 : 7;

    const lowRiskAuto = autoResolve && confidence >= floor - 3 && bank && settlement;
    if (confidence >= floor || lowRiskAuto) {
      matched.push({ invoice, bank, settlement, tax, confidence: Math.min(confidence, 99), reasons });
      matchedInvoiceIds.add(invoice.id);
      return;
    }

    exceptions.push({
      id: invoice.id,
      severity: confidence < 70 ? "high" : "medium",
      amount: invoice.amount,
      reason: buildInvoiceException(invoice, bank, settlement, tax),
      next: "Request remittance evidence or approve manual write-off before posting.",
      confidence,
    });
  });

  const seenBankInvoice = new Set();
  bankLines.forEach((line) => {
    const invoiceId = (line.memo.match(/INV-\d+/) || [])[0];
    if (invoiceId && seenBankInvoice.has(invoiceId)) {
      exceptions.push({
        id: line.id,
        severity: "high",
        amount: line.amount,
        reason: `Possible duplicate bank credit for ${invoiceId}.`,
        next: "Hold settlement posting until gateway batch confirms one capture.",
        confidence: 51,
      });
    }
    if (invoiceId) seenBankInvoice.add(invoiceId);
    if (!invoiceId) {
      exceptions.push({
        id: line.id,
        severity: "medium",
        amount: line.amount,
        reason: "Bank memo has no invoice or settlement reference.",
        next: "Ask payment ops to identify counterparty and gateway report.",
        confidence: 44,
      });
    }
    if (line.amount < 0) {
      exceptions.push({
        id: line.id,
        severity: "high",
        amount: line.amount,
        reason: "Negative cash movement looks like a chargeback reversal.",
        next: "Route to disputes queue and reserve cash forecast.",
        confidence: 63,
      });
    }
  });

  settlements
    .filter((line) => !invoices.some((invoice) => invoice.id === line.reference))
    .forEach((line) => {
      exceptions.push({
        id: line.id,
        severity: "high",
        amount: line.net,
        reason: `Settlement references missing invoice ${line.reference}.`,
        next: "Block revenue recognition until source invoice is found.",
        confidence: 38,
      });
    });

  taxLines
    .filter((line) => line.expectedTax !== line.filedTax)
    .forEach((line) => {
      exceptions.push({
        id: line.id,
        severity: "medium",
        amount: Math.abs(line.filedTax - line.expectedTax),
        reason: `Tax mismatch on ${line.invoiceId}: expected ${money.format(line.expectedTax)}, filed ${money.format(line.filedTax)}.`,
        next: "Send to tax-line matcher for jurisdiction and rate review.",
        confidence: 69,
      });
    });

  const uniqueExceptions = [...new Map(exceptions.map((item) => [item.id + item.reason, item])).values()];
  const verifiedCash = matched.reduce((sum, item) => sum + (item.settlement ? item.settlement.net : item.invoice.amount), 0);
  const outflows = 18400 + (pressure === "messy" ? 2600 : 0);
  const netCash = verifiedCash - outflows;
  const matchRate = matched.length / invoices.length;

  return {
    matched,
    exceptions: uniqueExceptions,
    netCash,
    matchRate,
    throughput: allRecords.length,
    matchedInvoiceIds,
    forecast: buildForecast(netCash, uniqueExceptions),
  };
}

function buildInvoiceException(invoice, bank, settlement, tax) {
  if (!bank && !settlement) return "No bank credit or settlement report could support the invoice.";
  if (!bank) return "Gateway settlement exists, but cash has not landed in bank.";
  if (!settlement) return "Cash arrived, but gateway settlement evidence is missing.";
  if (!tax) return "Payment evidence exists, but the tax ledger has no corresponding line.";
  if (tax.expectedTax !== tax.filedTax) return "Payment evidence matches, but tax filing does not tie out.";
  return "Confidence stayed below policy floor after variance checks.";
}

function buildForecast(netCash, exceptions) {
  const reserve = exceptions.reduce((sum, item) => sum + Math.min(Math.abs(item.amount), 1800), 0);
  return Array.from({ length: 14 }, (_, day) => {
    const expectedCollections = day % 3 === 0 ? 2400 : day % 4 === 0 ? 1550 : 820;
    const scheduledOutflows = day % 5 === 0 ? 3100 : 1280;
    return Math.round(netCash + day * 370 + expectedCollections - scheduledOutflows - reserve * 0.08);
  });
}

function runAgent(full = true) {
  state.result = reconcile();
  state.processed = full ? allRecords.length : Math.min(allRecords.length, state.processed + 18);
  state.stepIndex = full ? steps.length : Math.min(steps.length, state.stepIndex + 1);
  renderAll();
}

function renderAll() {
  const hasRun = state.processed > 0 || state.stepIndex > 0;
  const result = state.result || reconcile();
  const visibleSteps = steps.slice(0, state.stepIndex || 0);
  const processed = state.processed || 0;

  document.getElementById("agentMode").textContent = processed ? "Close loop complete" : "Awaiting run";
  document.getElementById("loopStatus").textContent = processed === allRecords.length ? "Verified" : processed ? "Running" : "Idle";
  document.getElementById("throughput").textContent = `${processed} / ${allRecords.length}`;
  document.getElementById("throughputDetail").textContent = processed ? `${result.matched.length} invoice clusters posted` : "Ready to process";
  document.getElementById("matchRate").textContent = hasRun ? `${(result.matchRate * 100).toFixed(1)}%` : "0.0%";
  document.getElementById("matchDetail").textContent = hasRun ? `${result.matched.length} of ${invoices.length} invoices verified` : "Confidence gated";
  document.getElementById("cashPosition").textContent = hasRun ? money.format(result.netCash) : "$0";
  document.getElementById("cashDetail").textContent = hasRun ? (result.netCash >= 0 ? "Positive after reserves" : "Reserve breach") : "After matched settlements";
  document.getElementById("exceptionCount").textContent = hasRun ? String(result.exceptions.length) : "0";
  document.getElementById("exceptionDetail").textContent = hasRun ? `${result.exceptions.filter((e) => e.severity === "high").length} high risk` : "Honest unresolved list";
  document.getElementById("recordsScanned").textContent = `${processed} records`;
  document.getElementById("runwayLabel").textContent = hasRun ? `${result.forecast.filter((v) => v > 0).length}/14 days positive` : "Waiting";

  renderTrace(visibleSteps, result);
  renderExceptions(hasRun ? result.exceptions : []);
  renderGraph(hasRun ? result : { matched: [], matchedInvoiceIds: new Set() });
  renderCashChart(hasRun ? result.forecast : Array.from({ length: 14 }, () => 0));
}

function renderTrace(visibleSteps, result) {
  const rail = document.getElementById("traceRail");
  rail.innerHTML = "";
  if (!visibleSteps.length) {
    rail.innerHTML = `<div class="trace-step"><span class="step-dot">0</span><div><strong>Ready</strong><small>Press run to process the synthetic finance batch.</small></div><span class="status-chip">${allRecords.length} rows</span></div>`;
    return;
  }
  visibleSteps.forEach(([label, text], index) => {
    const item = document.createElement("div");
    const warn = index === 3 && result.exceptions.length > 0;
    item.className = `trace-step ${warn ? "warn" : "done"}`;
    item.innerHTML = `<span class="step-dot">${index + 1}</span><div><strong>${label}</strong><small>${text}</small></div><span class="status-chip">${warn ? `${result.exceptions.length} exceptions` : "passed"}</span>`;
    rail.appendChild(item);
  });
}

function renderExceptions(exceptions) {
  const box = document.getElementById("exceptions");
  box.innerHTML = "";
  if (!state.processed && !state.stepIndex) {
    box.innerHTML = '<div class="exception"><strong>Awaiting controller run</strong><span>Exceptions will appear only after the batch is scanned and confidence-gated.</span></div>';
    return;
  }
  exceptions.slice(0, 12).forEach((item) => {
    const row = document.createElement("div");
    row.className = `exception ${item.severity}`;
    row.innerHTML = `<strong>${item.id} · ${money.format(item.amount)}</strong><span>${item.reason}</span><small>${item.next} Confidence ${item.confidence}%.</small>`;
    box.appendChild(row);
  });
  if (!exceptions.length) {
    box.innerHTML = '<div class="exception"><strong>No unresolved exceptions</strong><span>All checked records cleared the policy floor.</span></div>';
  }
}

function renderGraph(result) {
  const svg = document.getElementById("matchGraph");
  const width = svg.clientWidth || 640;
  const height = svg.clientHeight || 320;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  const columns = [
    { name: "Invoices", x: width * 0.14, count: invoices.length, color: "var(--blue-2)" },
    { name: "Bank", x: width * 0.38, count: bankLines.length, color: "var(--green)" },
    { name: "Gateway", x: width * 0.62, count: settlements.length, color: "var(--violet)" },
    { name: "Tax", x: width * 0.86, count: taxLines.length, color: "var(--amber)" },
  ];

  columns.forEach((column) => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", column.x);
    label.setAttribute("y", 22);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#98a8bd");
    label.setAttribute("font-size", "12");
    label.textContent = `${column.name} (${column.count})`;
    svg.appendChild(label);
  });

  result.matched.slice(0, 18).forEach((match, i) => {
    const y = 52 + i * 13;
    drawEdge(svg, columns[0].x, y, columns[1].x, y + (i % 3) * 4, "rgba(110, 231, 255, 0.52)");
    drawEdge(svg, columns[1].x, y + (i % 3) * 4, columns[2].x, y, "rgba(33, 198, 122, 0.45)");
    if (match.tax) drawEdge(svg, columns[2].x, y, columns[3].x, y - (i % 2) * 4, "rgba(248, 193, 74, 0.38)");
  });

  columns.forEach((column, columnIndex) => {
    const total = Math.min(column.count, 22);
    for (let i = 0; i < total; i += 1) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "node");
      circle.setAttribute("cx", column.x);
      circle.setAttribute("cy", 52 + i * 11);
      circle.setAttribute("r", columnIndex === 0 && !result.matchedInvoiceIds.has(invoices[i]?.id) ? 4.8 : 3.5);
      circle.setAttribute("fill", columnIndex === 0 && !result.matchedInvoiceIds.has(invoices[i]?.id) ? "var(--red)" : column.color);
      circle.setAttribute("opacity", "0.88");
      svg.appendChild(circle);
    }
  });
}

function drawEdge(svg, x1, y1, x2, y2, color) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const mid = (x1 + x2) / 2;
  path.setAttribute("d", `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("pathLength", "1");
  path.setAttribute("class", "edge");
  svg.appendChild(path);
}

function renderCashChart(values) {
  const canvas = document.getElementById("cashChart");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.round(270 * ratio);
  ctx.scale(ratio, ratio);
  const width = rect.width;
  const height = 270;
  ctx.clearRect(0, 0, width, height);

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1000);
  const x = (i) => 28 + (i * (width - 56)) / (values.length - 1);
  const y = (v) => 226 - ((v - min) / (max - min || 1)) * 176;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const yy = 50 + i * 44;
    ctx.beginPath();
    ctx.moveTo(24, yy);
    ctx.lineTo(width - 20, yy);
    ctx.stroke();
  }

  const zeroY = y(0);
  ctx.strokeStyle = "rgba(255, 95, 109, 0.45)";
  ctx.beginPath();
  ctx.moveTo(24, zeroY);
  ctx.lineTo(width - 20, zeroY);
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, 40, 0, 230);
  gradient.addColorStop(0, "rgba(79, 140, 255, 0.38)");
  gradient.addColorStop(1, "rgba(33, 198, 122, 0.02)");
  ctx.beginPath();
  values.forEach((value, i) => {
    const px = x(i);
    const py = y(value);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.lineTo(x(values.length - 1), 230);
  ctx.lineTo(x(0), 230);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  values.forEach((value, i) => {
    const px = x(i);
    const py = y(value);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = "#6ee7ff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#eff6ff";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(`Day 1 ${money.format(values[0])}`, 28, 248);
  const finalLabel = `Day 14 ${money.format(values[values.length - 1])}`;
  ctx.fillText(finalLabel, Math.max(28, width - 126), 248);
}

function answerQuestion(kind) {
  const result = state.result || reconcile();
  const high = result.exceptions.filter((item) => item.severity === "high");
  const tax = result.exceptions.filter((item) => item.reason.toLowerCase().includes("tax"));
  const lowest = result.forecast.reduce((min, value) => Math.min(min, value), Infinity);
  const responses = {
    why_unmatched: `${result.exceptions.length} exceptions remain because the agent could not verify evidence across all sources. The main blockers are missing invoice references, duplicate bank credits, chargeback movement, and tax mismatches. It posts ${result.matched.length} invoice clusters and refuses the rest.`,
    cash_risk: `Lowest projected cash balance over the next 14 days is ${money.format(lowest)}. The forecast reserves cash for ${high.length} high-risk exceptions, especially duplicate credits and chargeback reversal exposure.`,
    tax_gap: `${tax.length} tax-related items need review. The controller found filed-tax variance or absent tax lines, so those invoices are withheld from clean close until rate, jurisdiction, or filing evidence is corrected.`,
  };
  document.getElementById("answerBox").textContent = responses[kind];
}

function copyMemo() {
  const result = state.result || reconcile();
  const lines = [
    "NeonLedger close memo",
    `Records processed: ${allRecords.length}`,
    `Verified invoice match rate: ${(result.matchRate * 100).toFixed(1)}%`,
    `Net cash position: ${money.format(result.netCash)}`,
    `Open exceptions: ${result.exceptions.length}`,
    ...result.exceptions.slice(0, 8).map((item) => `- ${item.id}: ${item.reason}`),
  ];
  state.memo = lines.join("\n");
  navigator.clipboard?.writeText(state.memo);
  document.getElementById("qaStatus").textContent = "Memo copied";
  document.getElementById("answerBox").textContent = state.memo;
}

document.getElementById("runAgent").addEventListener("click", () => {
  state.stepIndex = steps.length;
  runAgent(true);
});

document.getElementById("stepAgent").addEventListener("click", () => runAgent(false));
document.getElementById("confidence").addEventListener("input", (event) => {
  document.getElementById("confidenceLabel").textContent = `${event.target.value}%`;
  state.result = reconcile();
  renderAll();
});
document.getElementById("pressure").addEventListener("change", () => {
  state.result = reconcile();
  renderAll();
});
document.getElementById("autoResolve").addEventListener("change", () => {
  state.result = reconcile();
  renderAll();
});
document.getElementById("exportMemo").addEventListener("click", copyMemo);
document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => answerQuestion(button.dataset.question));
});
window.addEventListener("resize", () => renderAll());

renderAll();
