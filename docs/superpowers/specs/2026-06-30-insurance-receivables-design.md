# Insurance Receivables — Design Spec

**Date:** 2026-06-30
**Status:** Approved design, pending implementation plan
**Route:** `/receivables` · **Sidebar label:** "Insurances"

## 1. Goal

Give users a clear view of **how much each insurer still owes**, with a drill-down
to the patients (and, for admins, the clients) behind each amount.

Example: _"Jubilee — billed 300,000 · paid 90,000 · outstanding 210,000"_, expandable
to the individual patients that make up that balance.

- **Clients** see only their own receivables: **insurer → patients**.
- **Admins** see all clients: **insurer → client → patients**.

This is a **read-only analytics view** with drill-down and export. Debts continue to
be created/edited on the existing Debts page — nothing is edited here.

## 2. Data source (no new tables)

The view is a **pure rollup of the existing `debts` data**. Every debt already carries
the fields we need:

| Concept            | Source on the `Debt` object (`app/types/debt.ts`)                     |
| ------------------ | --------------------------------------------------------------------- |
| Insurer            | `debt.payer` (extracted from the `Insurance:` tag in `description`)    |
| Patient            | `debt.patientName` (`debtor_name`)                                     |
| Patient ID         | `debt.patientId`                                                       |
| Client / hospital  | `debt.clientId` + `debt.creditor` (`creditor_name`)                    |
| Billed             | `debt.amount`                                                          |
| Paid               | `debt.paidAmount`                                                      |
| Outstanding        | `debt.amount - debt.paidAmount` (via `getRemainingAmount`)            |
| Status / due date  | `debt.status`, `debt.dueDate`                                          |

**Role scoping is already handled.** `fetchDebts()` (`app/lib/debts.ts`) returns only
the logged-in client's debts when the role is `client`, and all debts for admins. The
page reuses it unchanged.

**Insurer name** comes from `debt.payer`. Debts with an empty payer are grouped under
**"No insurer specified."**

**Client name (admin only)** is resolved from `clientId` using `fetchClients()`
(`app/lib/clients.ts`), falling back to `debt.creditor`, then to `"Unassigned"`.

## 3. Aggregation logic (the testable core)

A **pure, Supabase-free** module so the math is unit-testable.

**File:** `app/lib/receivables.ts`

```ts
buildInsurerReceivables(
  debts: Debt[],
  role: 'admin' | 'client' | string,
  clientNameById: Map<string, string>, // only consulted for admin
): {
  insurers: InsurerReceivable[];   // sorted by outstanding desc, then billed desc
  totals: { billed: number; paid: number; outstanding: number; insurerCount: number };
}
```

Rules:

- Group debts by insurer (`payer`, or `"No insurer specified"` when empty).
- For each insurer, sum `billed`, `paid`, `outstanding` (`outstanding` clamped at `>= 0`).
- Build the breakdown:
  - **client role** → `patients: PatientReceivable[]`.
  - **admin role** → `clients: ClientReceivable[]`, each with its own `patients[]` and subtotals.
- Sort insurers by `outstanding` desc (fully-paid insurers fall to the bottom). Sort
  patients/clients within an insurer by `outstanding` desc.
- Fully-paid insurers are still listed (outstanding `0`).

## 4. Types

**File:** `app/types/receivable.ts`

```ts
export interface PatientReceivable {
  debtId: string;
  patientName: string;
  patientId?: string;
  clientName?: string; // populated in admin view for context
  billed: number;
  paid: number;
  outstanding: number;
  status: DebtStatus;
  dueDate: string;
}

export interface ClientReceivable {
  clientId: string;       // or creditor fallback key
  clientName: string;
  billed: number;
  paid: number;
  outstanding: number;
  patients: PatientReceivable[];
}

export interface InsurerReceivable {
  insurer: string;
  billed: number;
  paid: number;
  outstanding: number;
  patientCount: number;
  clients?: ClientReceivable[]; // admin only
  patients: PatientReceivable[]; // always present (flat list; client view uses this)
}
```

## 5. Page & components

All wrapped in `DashboardLayout`, matching the existing Dashboard look.

### `app/receivables/page.tsx`
- `'use client'`.
- On mount: `fetchDebts()`; read role via `supabase.auth.getUser()`
  (`user_metadata.role`, lowercased, default `client`); if admin, also `fetchClients()`
  to build `clientNameById`.
- `useMemo` → `buildInsurerReceivables(...)`.
- Renders: header + export buttons → KPI cards → chart → insurer table.
- Loading and empty states.

### KPI cards
Reuse `StatisticsCard` (`app/components/StatisticsCard.tsx`): **Total Billed**,
**Total Paid**, **Total Outstanding**, **# Insurers**. Currency via `formatKes`.

### `app/components/receivables/ReceivablesChart.tsx`
- recharts `BarChart`, modeled on `DebtAmountBarChart.tsx`.
- One bar group per insurer (top ~8 by outstanding): Billed / Paid / Outstanding.
- `formatKes` in tooltip, `kesAxisTick` on the Y axis (`@/lib/format-kes`).

### `app/components/receivables/InsurerTable.tsx`
- Expandable list. Each insurer row: name · billed · paid · outstanding · patient count · chevron.
- Expanded:
  - **client view** → patient rows (name, patient ID, billed, paid, outstanding, status, due date).
  - **admin view** → client rows (name + subtotals) that themselves expand to patient rows.
- Expansion is local component state (`Set` of expanded ids). Pure presentational —
  receives `InsurerReceivable[]` + `role`.

### `app/lib/receivablesExport.ts`
- `exportReceivablesPdf(insurers, totals, role)` — `jsPDF` + `autoTable`
  (same imports as `app/invoice/page.tsx`): summary line + one table (insurer, client
  for admin, patient, billed, paid, outstanding). `doc.save('faways-receivables-<date>.pdf')`.
- `exportReceivablesExcel(insurers, totals, role)` — `XLSX.utils.json_to_sheet` →
  `XLSX.writeFile('faways-receivables-<date>.xlsx')`. Flattened rows.

### Reused, unchanged
`DashboardLayout`, `StatisticsCard`, `formatKes`/`kesAxisTick`, `fetchDebts`, `fetchClients`.

## 6. Sidebar

In `app/components/Sidebar.tsx`:
- Add a nav item: `{ name: 'Insurances', href: '/receivables', icon: <shield/health icon> }`.
- Add `'insurances'` to the `client` allowlist filter (currently
  `['dashboard','debts','agents','reports','settings']`) so both clients and admins see it.
- Placement: directly after **Debts**.
- Route is `/receivables` (not `/insurance`) to avoid the existing "Contacts" item
  (`/insurance`) matching via `pathname.startsWith`.

## 7. Edge cases

- **No payer** on a debt → "No insurer specified" group.
- **Outstanding < 0** (overpaid) → clamped to `0`.
- **No debts** → friendly empty state ("No receivables to show yet").
- **Loading** → spinner/skeleton, consistent with Dashboard.
- **Admin, debt with no `clientId`** → client key falls back to `creditor`, then "Unassigned".
- **Duplicate insurer names with different casing** → normalize on trimmed value for the
  group key; display the first-seen original casing.

## 8. Testing

The repo currently has **no test framework**. We add a lightweight **vitest** setup
scoped to the pure aggregation module only:

- Add `vitest` dev dependency + a `test` script + minimal config.
- `app/lib/receivables.test.ts` covering:
  - grouping by insurer and summing billed/paid/outstanding;
  - outstanding clamped at `0` for overpaid debts;
  - empty-payer debts grouped under "No insurer specified";
  - client view produces flat `patients`; admin view nests `clients → patients`;
  - sort order (insurers by outstanding desc; fully-paid at bottom);
  - totals object correctness.

UI components are not unit-tested (no infra for it); they stay thin and delegate all
math to the tested module.

## 9. Out of scope (YAGNI)

- No editing/marking-paid from this page (Debts page owns that).
- No new database tables or manual insurer-balance entry.
- No date-range filtering or per-insurer historical trends (can be a later iteration).
- No changes to how `payer` is stored (stays in the `Insurance:` description tag).
