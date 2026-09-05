# ⚡ NeonLedger — AI Finance Controller

> **Close the books faster. Trust the numbers more. Know what the AI couldn't resolve.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-NeonLedger-0ea5e9?style=for-the-badge)](https://ai-finance-controller-jade.vercel.app/)
[![94 Records](https://img.shields.io/badge/Synthetic_Batch-94_Records-111827?style=for-the-badge)](#-the-demo)
[![Verification First](https://img.shields.io/badge/Philosophy-Verification--First-7c3aed?style=for-the-badge)](#-why-verification-first)
[![Finance AI](https://img.shields.io/badge/AI-Finance_Ops-059669?style=for-the-badge)](#)

**NeonLedger** is a verification-first AI Finance Controller built to automate one complete finance-operations loop: **multi-source reconciliation**.

It connects invoices, bank transactions, settlement records, and tax lines; evaluates evidence; identifies discrepancies; measures batch-level performance; and surfaces unresolved exceptions instead of pretending every transaction can be safely matched.

---

## 🎬 See It In Action

### [▶ Launch the Live NeonLedger Controller](https://ai-finance-controller-jade.vercel.app/)

**The demo is intentionally designed around a simple question:**

> **Can an AI system automate the safe decisions while honestly showing the decisions it cannot safely make?**

Run the close loop → inspect matches → investigate exceptions → understand cash impact.

---

## 🎯 The Problem

Finance operations often require reconciling the same business transaction across multiple systems:

```text
                    ┌──────────────┐
                    │   INVOICE    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌──────────┐
        │   BANK   │ │ SETTLEMENT│ │   TAX    │
        │TRANSACTION│ │   RECORD  │ │   LINE   │
        └──────────┘ └───────────┘ └──────────┘
```

The records rarely line up perfectly.

References differ.  
Descriptions are messy.  
Fees change settlement amounts.  
Tax lines can be missing.  
Duplicates and chargebacks can distort cash.

A naïve automation tries to maximize matches.

**NeonLedger takes the opposite approach:**

> ### Match what can be verified. Escalate what cannot. Measure both.

---

# 💡 What It Solves

NeonLedger closes a finance-ops reconciliation loop across a multi-source synthetic batch.

It provides:

- 🔗 **Multi-source reconciliation**
- 🧠 **Evidence-based matching**
- 🎚️ **Confidence-based decisioning**
- 🚨 **Exception and anomaly detection**
- 💰 **Cash-position visibility**
- 🧾 **Settlement and tax discrepancy analysis**
- 💬 **Finance-oriented Q&A**
- 📊 **Batch-level performance measurement**
- 👤 **Human-in-the-loop exception review**

The objective is **not 100% automation**.

The objective is **trustworthy automation**.

---

# 📊 The Demo

The current demonstration uses **94 synthetic records**:

| Source | Records |
|---|---:|
| 🧾 Invoices | 24 |
| 🏦 Bank transactions | 24 |
| 💳 Settlement records | 24 |
| 🧮 Tax records | 22 |
| **Total** | **94** |

The dataset deliberately includes difficult cases such as:

- Missing invoices
- Duplicate deposits
- Chargeback reversals
- Unknown bank sweeps
- Settlement discrepancies
- Tax mismatches
- Missing tax lines

This matters because a reconciliation system that achieves 100% by forcing every record into a match is not necessarily trustworthy.

---

# 🧠 Verification-First Architecture

The central design principle is:

```text
              ┌────────────────────┐
              │   SOURCE SYSTEMS   │
              │ Invoice / Bank /   │
              │ Settlement / Tax   │
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │    NORMALIZE       │
              │ IDs / dates / $ /  │
              │ references / names │
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │ CANDIDATE MATCHING │
              │ amount / date /    │
              │ entity / reference │
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │    AI REASONING   │
              │ ambiguity / cause │
              │ / explanation     │
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │ DETERMINISTIC      │
              │ VERIFICATION       │
              │ arithmetic / tax / │
              │ tolerance / dupes  │
              └─────────┬──────────┘
                        │
                 ┌──────┴──────┐
                 ▼             ▼
          ┌────────────┐ ┌────────────┐
          │ AUTO-CLOSE │ │ EXCEPTION  │
          └─────┬──────┘ └──────┬─────┘
                ▼               ▼
          Cash position    Human review
          + audit trail    + explanation
```

## Why this hybrid approach?

LLMs are useful for **reasoning about ambiguity**.

They should not be the sole authority for **financial arithmetic**.

NeonLedger therefore separates:

### AI reasoning

Used for:

- Entity resolution
- Interpreting messy descriptions
- Ranking candidate matches
- Explaining discrepancies
- Classifying exception causes
- Generating investigation suggestions
- Natural-language finance Q&A

### Deterministic controls

Used for:

- Amount validation
- Currency checks
- Date tolerances
- Settlement calculations
- Tax calculations
- Duplicate detection
- Confidence thresholds
- Ledger consistency

> **AI proposes and explains. Deterministic controls verify.**

---

# 🔍 How A Match Is Evaluated

A transaction is not considered safe simply because two records look similar.

The system can combine evidence such as:

```text
                 CANDIDATE MATCH
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Amount           Date        Reference
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                Evidence Score
                       │
                       ▼
             Verification Rules
                       │
              ┌────────┴────────┐
              ▼                 ▼
          VERIFIED            EXCEPTION
```

A strong match might look like:

```text
Invoice
INV-6407
Amount: $4,182
      │
      ├── Bank: BNK-9107
      │   Amount: $4,182
      │
      ├── Settlement: SET-7307
      │   Net: $4,182
      │
      └── Tax: TAX-5207
          Expected tax: $342

             ↓

       Evidence consistent

             ↓

        VERIFIED MATCH
```

An inconsistent relationship is instead routed to an exception:

```text
Invoice
   │
   ▼
Candidate bank transaction
   │
   ├── Amount mismatch
   ├── Settlement discrepancy
   └── Tax inconsistency
             │
             ▼
         EXCEPTION
```

---

# 🚨 Exceptions Are A Feature

A finance controller should not hide uncertainty.

NeonLedger treats unresolved records as first-class outputs.

| Exception | Potential Risk |
|---|---|
| Missing invoice | Unallocated cash |
| Duplicate deposit | Double counting |
| Chargeback | Negative cash impact |
| Tax mismatch | Reporting / compliance risk |
| Settlement mismatch | Incorrect expected cash |
| Unknown bank sweep | Unexplained cash movement |

Instead of:

> ❌ "Everything matched."

the system aims to produce:

> ✅ "These records are verified. These records are uncertain. Here is why."

---

# 📈 What Gets Measured?

The challenge is not won by showing one successful match.

NeonLedger is designed for **batch-level evaluation**.

### Throughput

```text
records processed
─────────────────
processing time
```

### Match Rate

```text
successfully matched records
─────────────────────────────
eligible records
```

### Precision

```text
correct matches
────────────────
predicted matches
```

### Recall

```text
correct matches
────────────────
all valid matches
```

### Exception Quality

```text
correctly identified exceptions
───────────────────────────────
all flagged exceptions
```

### Cash Impact

Unresolved reconciliation issues are connected to their potential impact on cash visibility.

---

# 💬 Finance Q&A

NeonLedger is designed to turn reconciliation state into an interactive finance-control interface.

Example questions:

```text
"Why were these items unmatched?"

"What threatens cash this week?"

"Which settlements have discrepancies?"

"Which tax lines need review?"

"Show me the highest-risk exceptions."

"Why did this transaction fail reconciliation?"
```

A production implementation can ground these responses in structured finance tools and reconciliation records so the model explains **actual system evidence**, rather than inventing financial facts.

---

# 🛡️ The Safety Philosophy

Traditional automation asks:

> **How many records can we automatically close?**

NeonLedger asks:

> **How many records can we safely close?**

That difference is critical in finance.

```text
                 94 RECORDS
                      │
                      ▼
              ┌─────────────┐
              │ RECONCILE   │
              └──────┬──────┘
                     │
             ┌───────┴────────┐
             ▼                ▼
        VERIFIED          UNCERTAIN
             │                │
             ▼                ▼
        AUTO-CLOSE        HUMAN REVIEW
             │                │
             └───────┬────────┘
                     ▼
              HONEST REPORT
```

**An exception is safer than a confidently incorrect match.**

---

# 🧪 Synthetic Evaluation

The demonstration uses synthetic financial data so the complete workflow can be tested without exposing real financial information.

A production evaluation setup can maintain hidden ground truth:

```text
Generated Record
      │
      ├── Expected relationship
      ├── Expected decision
      └── Expected exception
               │
               ▼
         Agent Decision
               │
               ▼
           Evaluation
          /     |      \
         ▼      ▼       ▼
    Precision  Recall  Exceptions
```

This makes an important distinction:

> **"The system found a match."**

is not the same as:

> **"The system found the correct match."**

---

# 🏗️ Product Workflow

| Stage | What happens |
|---|---|
| **01 — Ingest** | Load the finance batch |
| **02 — Normalize** | Standardize IDs, dates, amounts and references |
| **03 — Retrieve** | Find plausible cross-source candidates |
| **04 — Reason** | Analyze ambiguity and discrepancies |
| **05 — Verify** | Apply deterministic financial controls |
| **06 — Close** | Auto-clear sufficiently verified records |
| **07 — Escalate** | Route uncertain records to exceptions |
| **08 — Report** | Measure quality, throughput and cash impact |

---

# 🖥️ Interface

The controller is designed around an operations workflow rather than a generic chatbot:

```text
┌──────────────────────────────────────────────────────────┐
│                 NEONLEDGER CONTROLLER                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  94 Records     Match Rate     Cash Impact    Exceptions │
│                                                          │
├───────────────────────┬──────────────────────────────────┤
│                       │                                  │
│   RECONCILIATION      │       EXCEPTION QUEUE           │
│                       │                                  │
│   Invoice → Bank      │   ⚠ Tax mismatch                │
│   Bank → Settlement   │   ⚠ Duplicate deposit           │
│   Settlement → Tax    │   ⚠ Chargeback                  │
│                       │                                  │
├───────────────────────┴──────────────────────────────────┤
│                                                          │
│                  FINANCE Q&A                             │
│                                                          │
│  "What threatens cash this week?"                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

# ⚙️ Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/ai-finance-controller.git

cd ai-finance-controller

npm install

npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🔐 Production Roadmap

The current demo establishes the reconciliation concept. The next production layer would add:

### AI Controller
- [ ] LLM-powered entity resolution
- [ ] Tool-based finance Q&A
- [ ] AI exception classification
- [ ] Explainable decision traces
- [ ] Ground-truth evaluation
- [ ] Precision / recall reporting

### Finance Controls
- [ ] Database-backed ledger state
- [ ] Immutable audit logs
- [ ] Role-based access control
- [ ] Human approval workflows
- [ ] Configurable financial tolerances

### Integrations
- [ ] ERP integrations
- [ ] Bank feeds
- [ ] Payment gateways
- [ ] Tax platforms
- [ ] Scheduled reconciliation
- [ ] Alerts and anomaly monitoring

---

# 🧩 Design Principles

### 01 — Verification over generation

Financial AI should optimize for correctness, not just fluent output.

### 02 — Exceptions are valuable

Uncertainty should be visible, not hidden.

### 03 — Evaluate the batch

One successful transaction proves almost nothing.

### 04 — Separate reasoning from arithmetic

Use AI for ambiguity. Use deterministic logic for exact financial calculations.

### 05 — Keep humans in the loop

The system should focus human attention on the transactions that genuinely require judgment.

---

# 🏆 Why NeonLedger?

Most AI demos optimize for:

> **"Look what the model can generate."**

NeonLedger focuses on:

> **"What financial decisions can the system safely verify?"**

The result is a finance-operations controller designed around four measurable outputs:

```text
         THROUGHPUT
             +
        MATCH QUALITY
             +
       CASH VISIBILITY
             +
     HONEST EXCEPTIONS
```

Not maximum automation.

**Trustworthy automation.**

---

# 📌 Project Objective

> **Build an AI Finance Controller that closes a complete finance-operations reconciliation loop across a 50+ record synthetic dataset, measuring throughput and match quality while explicitly reporting unresolved exceptions and their cash impact.**

---

# 🌐 Live Demo

## [🚀 Open NeonLedger](https://ai-finance-controller-jade.vercel.app/)

---

# 👨‍💻 Built With

- React
- JavaScript / TypeScript
- Modern web UI
- Deterministic reconciliation logic
- Synthetic financial datasets
- Confidence-based decisioning
- Exception-first workflow
- AI-agent architecture concepts

---

## ⭐ The idea in one sentence

> **NeonLedger is an AI Finance Controller that doesn't just automate reconciliation — it knows when it should stop and ask for human judgment.**
