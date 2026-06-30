# Insurance Receivables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/receivables` page ("Insurances" in the sidebar) that rolls up existing debts by insurer, showing billed/paid/outstanding with patient (and, for admins, client) drill-down and PDF/Excel export.

**Architecture:** A pure aggregation module turns the role-scoped `Debt[]` (from the existing `fetchDebts()`) into an insurer tree. A client page wires that to KPI cards, a recharts bar chart, an expandable table, and export helpers. No new database tables — the insurer comes from `debt.payer` (already parsed from the debt description). Role scoping already lives in `fetchDebts()`.

**Tech Stack:** Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Tailwind v4, recharts, lucide-react, jsPDF + jspdf-autotable, xlsx, Supabase, vitest (added here).

## Global Constraints

- TypeScript strict; no `any` in new code (use the defined interfaces).
- Path alias: `@/*` → repo root (e.g. `@/lib/format-kes`, `@/lib/supabase-client`). Modules **inside `app/`** import sibling app modules with relative paths (e.g. `../types/debt`).
- Currency display uses `formatKes` from `@/lib/format-kes`; chart axis uses `kesAxisTick`.
- Do NOT add new DB tables or change how `payer` is stored.
- Role is read from Supabase `user.user_metadata.role`, lowercased; default `'client'`. Only `'admin'` gets the client-level drill-down and the "Client" export column.
- Tested modules (`app/lib/receivables.ts`, `app/lib/receivablesRows.ts`) must use **relative imports only** (no heavy browser libs), so vitest runs them in a node environment.
- Reuse existing components/helpers: `DashboardLayout`, `StatisticsCard`, `formatKes`/`kesAxisTick`, `fetchDebts`, `fetchClients`.
- Each task ends with a commit. Run commands from the repo root.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `app/types/receivable.ts` (create) | Shared types for the receivables tree |
| `app/lib/receivables.ts` (create) | **Pure** aggregation: `buildInsurerReceivables()` |
| `app/lib/receivables.test.ts` (create) | Unit tests for aggregation |
| `vitest.config.ts` (create) | vitest config (node env, `@` alias) |
| `package.json` (modify) | Add `vitest` dev dep + `test` scripts |
| `app/lib/receivablesRows.ts` (create) | **Pure** flatten-to-rows for exports |
| `app/lib/receivablesRows.test.ts` (create) | Unit tests for flatten |
| `app/lib/receivablesExport.ts` (create) | PDF + Excel export wrappers |
| `app/components/receivables/ReceivablesChart.tsx` (create) | Outstanding-by-insurer bar chart |
| `app/components/receivables/InsurerTable.tsx` (create) | Expandable drill-down table |
| `app/receivables/page.tsx` (create) | Page: fetch + role + aggregate + render |
| `app/components/Sidebar.tsx` (modify) | Add "Insurances" nav item + client allowlist |

---

## Task 1: Types, aggregation logic, and vitest setup

**Files:**
- Create: `app/types/receivable.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add dev dep + scripts)
- Create: `app/lib/receivables.ts`
- Test: `app/lib/receivables.test.ts`

**Interfaces:**
- Consumes: `Debt`, `getRemainingAmount` from `app/types/debt.ts`; `Client` from `app/types/client.ts`.
- Produces:
  - Types `PatientReceivable`, `ClientReceivable`, `InsurerReceivable`, `ReceivablesTotals`, `ReceivablesResult`.
  - `buildInsurerReceivables(debts: Debt[], role: string, clientNameById: Map<string, string>): ReceivablesResult` — insurers sorted by outstanding desc (ties by billed desc); `clients` populated only when `role === 'admin'`.

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`
Expected: vitest added to `devDependencies`; install completes without errors.

- [ ] **Step 2: Create the vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts', 'lib/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `"scripts"` block of `package.json`, add these two entries (keep the existing scripts):

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Create the types file**

Create `app/types/receivable.ts`:

```ts
import type { DebtStatus } from './debt';

export interface PatientReceivable {
  debtId: string;
  patientName: string;
  patientId?: string;
  /** Populated only in admin view, for context in the flat patient list. */
  clientName?: string;
  billed: number;
  paid: number;
  outstanding: number;
  status: DebtStatus;
  dueDate: string;
}

export interface ClientReceivable {
  /** clientId when present, otherwise the creditor name used as the grouping key. */
  clientId: string;
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
  /** Present only in admin view. */
  clients?: ClientReceivable[];
  /** Always present; flat list used by the client view and exports. */
  patients: PatientReceivable[];
}

export interface ReceivablesTotals {
  billed: number;
  paid: number;
  outstanding: number;
  insurerCount: number;
}

export interface ReceivablesResult {
  insurers: InsurerReceivable[];
  totals: ReceivablesTotals;
}
```

- [ ] **Step 5: Write the failing tests**

Create `app/lib/receivables.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildInsurerReceivables } from './receivables';
import type { Debt } from '../types/debt';

const makeDebt = (overrides: Partial<Debt>): Debt => ({
  id: 'd1',
  clientId: 'c1',
  creditor: 'Aga Khan Hospital',
  clientType: 'hospital',
  patientName: 'John Doe',
  patientId: 'P-1',
  serviceLine: 'Outpatient',
  payer: 'Jubilee',
  owner: 'Owner',
  stage: 'new',
  amount: 1000,
  paidAmount: 0,
  dueDate: '2026-01-01',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  priority: 'medium',
  ...overrides,
});

const noClients = new Map<string, string>();

describe('buildInsurerReceivables', () => {
  it('groups by insurer and sums billed/paid/outstanding', () => {
    const debts = [
      makeDebt({ id: 'a', payer: 'Jubilee', amount: 1000, paidAmount: 200 }),
      makeDebt({ id: 'b', payer: 'Jubilee', amount: 500, paidAmount: 0 }),
      makeDebt({ id: 'c', payer: 'AAR', amount: 300, paidAmount: 100 }),
    ];
    const { insurers, totals } = buildInsurerReceivables(debts, 'client', noClients);
    const jubilee = insurers.find((i) => i.insurer === 'Jubilee')!;
    expect(jubilee.billed).toBe(1500);
    expect(jubilee.paid).toBe(200);
    expect(jubilee.outstanding).toBe(1300);
    expect(jubilee.patientCount).toBe(2);
    expect(totals).toEqual({ billed: 1800, paid: 300, outstanding: 1500, insurerCount: 2 });
  });

  it('clamps outstanding at zero for overpaid debts', () => {
    const debts = [makeDebt({ payer: 'Britam', amount: 100, paidAmount: 250 })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers[0].outstanding).toBe(0);
    expect(insurers[0].paid).toBe(250);
  });

  it('groups debts with no payer under "No insurer specified"', () => {
    const debts = [makeDebt({ id: 'a', payer: '' }), makeDebt({ id: 'b', payer: '   ' })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers).toHaveLength(1);
    expect(insurers[0].insurer).toBe('No insurer specified');
    expect(insurers[0].patientCount).toBe(2);
  });

  it('client view produces a flat patient list and no clients array', () => {
    const debts = [makeDebt({ payer: 'Jubilee' })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers[0].patients).toHaveLength(1);
    expect(insurers[0].clients).toBeUndefined();
    expect(insurers[0].patients[0].clientName).toBeUndefined();
  });

  it('admin view nests clients -> patients with resolved client names', () => {
    const clientNames = new Map([
      ['c1', 'Aga Khan Hospital'],
      ['c2', 'Nairobi Hospital'],
    ]);
    const debts = [
      makeDebt({ id: 'a', payer: 'Jubilee', clientId: 'c1', amount: 1000, paidAmount: 0 }),
      makeDebt({ id: 'b', payer: 'Jubilee', clientId: 'c2', amount: 400, paidAmount: 0 }),
    ];
    const { insurers } = buildInsurerReceivables(debts, 'admin', clientNames);
    const jubilee = insurers[0];
    expect(jubilee.clients).toBeDefined();
    expect(jubilee.clients!).toHaveLength(2);
    expect(jubilee.clients![0].clientName).toBe('Aga Khan Hospital'); // 1000 outstanding sorts first
    expect(jubilee.clients![0].outstanding).toBe(1000);
    expect(jubilee.clients![0].patients[0].clientName).toBe('Aga Khan Hospital');
  });

  it('sorts insurers by outstanding desc with fully-paid at the bottom', () => {
    const debts = [
      makeDebt({ id: 'a', payer: 'Small', amount: 100, paidAmount: 0 }),
      makeDebt({ id: 'b', payer: 'Big', amount: 5000, paidAmount: 0 }),
      makeDebt({ id: 'c', payer: 'PaidUp', amount: 800, paidAmount: 800 }),
    ];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers.map((i) => i.insurer)).toEqual(['Big', 'Small', 'PaidUp']);
    expect(insurers[2].outstanding).toBe(0);
  });

  it('returns an empty result for no debts', () => {
    const { insurers, totals } = buildInsurerReceivables([], 'client', noClients);
    expect(insurers).toEqual([]);
    expect(totals).toEqual({ billed: 0, paid: 0, outstanding: 0, insurerCount: 0 });
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `buildInsurerReceivables` cannot be imported (module `./receivables` not found).

- [ ] **Step 7: Implement the aggregation module**

Create `app/lib/receivables.ts`:

```ts
import type { Debt } from '../types/debt';
import { getRemainingAmount } from '../types/debt';
import type {
  InsurerReceivable,
  ClientReceivable,
  PatientReceivable,
  ReceivablesResult,
  ReceivablesTotals,
} from '../types/receivable';

const NO_INSURER = 'No insurer specified';
const UNASSIGNED_CLIENT = 'Unassigned';

const clampZero = (n: number): number => (n > 0 ? n : 0);

const insurerDisplay = (debt: Debt): string => {
  const trimmed = (debt.payer ?? '').trim();
  return trimmed || NO_INSURER;
};

const sumPatients = (patients: PatientReceivable[]) =>
  patients.reduce(
    (acc, p) => {
      acc.billed += p.billed;
      acc.paid += p.paid;
      acc.outstanding += p.outstanding;
      return acc;
    },
    { billed: 0, paid: 0, outstanding: 0 },
  );

const byOutstandingDesc = <T extends { outstanding: number; billed: number }>(
  a: T,
  b: T,
): number => {
  if (b.outstanding !== a.outstanding) return b.outstanding - a.outstanding;
  return b.billed - a.billed;
};

interface InsurerGroup {
  display: string;
  patients: PatientReceivable[];
  clientKeyByPatient: string[];
  clientNameByKey: Map<string, string>;
}

export function buildInsurerReceivables(
  debts: Debt[],
  role: string,
  clientNameById: Map<string, string>,
): ReceivablesResult {
  const isAdmin = role.toLowerCase() === 'admin';
  const groups = new Map<string, InsurerGroup>();

  for (const debt of debts) {
    const display = insurerDisplay(debt);
    const key = display.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, {
        display,
        patients: [],
        clientKeyByPatient: [],
        clientNameByKey: new Map(),
      });
    }
    const group = groups.get(key)!;

    const clientKey = (debt.clientId ?? debt.creditor ?? '').trim() || UNASSIGNED_CLIENT;
    const clientName =
      (debt.clientId ? clientNameById.get(debt.clientId) : undefined) ||
      (debt.creditor ?? '').trim() ||
      UNASSIGNED_CLIENT;
    group.clientNameByKey.set(clientKey, clientName);

    const patient: PatientReceivable = {
      debtId: debt.id,
      patientName: (debt.patientName ?? '').trim() || 'Unknown patient',
      patientId: (debt.patientId ?? '').trim() || undefined,
      clientName: isAdmin ? clientName : undefined,
      billed: debt.amount,
      paid: debt.paidAmount,
      outstanding: clampZero(getRemainingAmount(debt)),
      status: debt.status,
      dueDate: debt.dueDate,
    };
    group.patients.push(patient);
    group.clientKeyByPatient.push(clientKey);
  }

  const insurers: InsurerReceivable[] = [];

  for (const group of groups.values()) {
    const totals = sumPatients(group.patients);

    let clients: ClientReceivable[] | undefined;
    if (isAdmin) {
      const clientMap = new Map<string, PatientReceivable[]>();
      group.patients.forEach((p, i) => {
        const ck = group.clientKeyByPatient[i];
        if (!clientMap.has(ck)) clientMap.set(ck, []);
        clientMap.get(ck)!.push(p);
      });
      clients = [...clientMap.entries()]
        .map(([clientKey, patients]) => {
          const ct = sumPatients(patients);
          return {
            clientId: clientKey,
            clientName: group.clientNameByKey.get(clientKey) ?? UNASSIGNED_CLIENT,
            billed: ct.billed,
            paid: ct.paid,
            outstanding: ct.outstanding,
            patients: [...patients].sort(byOutstandingDesc),
          };
        })
        .sort(byOutstandingDesc);
    }

    insurers.push({
      insurer: group.display,
      billed: totals.billed,
      paid: totals.paid,
      outstanding: totals.outstanding,
      patientCount: group.patients.length,
      clients,
      patients: [...group.patients].sort(byOutstandingDesc),
    });
  }

  insurers.sort(byOutstandingDesc);

  const totals: ReceivablesTotals = insurers.reduce(
    (acc, ins) => {
      acc.billed += ins.billed;
      acc.paid += ins.paid;
      acc.outstanding += ins.outstanding;
      return acc;
    },
    { billed: 0, paid: 0, outstanding: 0, insurerCount: 0 },
  );
  totals.insurerCount = insurers.length;

  return { insurers, totals };
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 7 tests in `receivables.test.ts` green.

- [ ] **Step 9: Commit**

```bash
git add app/types/receivable.ts app/lib/receivables.ts app/lib/receivables.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(receivables): add insurer aggregation logic with vitest"
```

---

## Task 2: Export helpers (rows + PDF + Excel)

**Files:**
- Create: `app/lib/receivablesRows.ts`
- Test: `app/lib/receivablesRows.test.ts`
- Create: `app/lib/receivablesExport.ts`

**Interfaces:**
- Consumes: `InsurerReceivable`, `ReceivablesTotals` from `app/types/receivable.ts`; `formatKes` from `@/lib/format-kes`; `jsPDF`, `autoTable`, `XLSX`.
- Produces:
  - `ReceivableRow` interface and `flattenReceivablesRows(insurers: InsurerReceivable[], isAdmin: boolean): ReceivableRow[]`.
  - `exportReceivablesPdf(insurers, totals, isAdmin): void` and `exportReceivablesExcel(insurers, totals, isAdmin): void`.

- [ ] **Step 1: Write the failing test for the row flattener**

Create `app/lib/receivablesRows.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { flattenReceivablesRows } from './receivablesRows';
import type { InsurerReceivable } from '../types/receivable';

const insurer: InsurerReceivable = {
  insurer: 'Jubilee',
  billed: 1000,
  paid: 200,
  outstanding: 800,
  patientCount: 1,
  patients: [
    {
      debtId: 'd1',
      patientName: 'John Doe',
      patientId: 'P-1',
      clientName: 'Aga Khan Hospital',
      billed: 1000,
      paid: 200,
      outstanding: 800,
      status: 'pending',
      dueDate: '2026-01-01',
    },
  ],
};

describe('flattenReceivablesRows', () => {
  it('emits one row per patient with insurer context', () => {
    const rows = flattenReceivablesRows([insurer], false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Insurer: 'Jubilee',
      Patient: 'John Doe',
      'Patient ID': 'P-1',
      Billed: 1000,
      Paid: 200,
      Outstanding: 800,
    });
  });

  it('leaves the Client column blank for non-admin and fills it for admin', () => {
    expect(flattenReceivablesRows([insurer], false)[0].Client).toBe('');
    expect(flattenReceivablesRows([insurer], true)[0].Client).toBe('Aga Khan Hospital');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — module `./receivablesRows` not found.

- [ ] **Step 3: Implement the pure row flattener**

Create `app/lib/receivablesRows.ts`:

```ts
import type { InsurerReceivable } from '../types/receivable';

export interface ReceivableRow {
  Insurer: string;
  Client: string;
  Patient: string;
  'Patient ID': string;
  Status: string;
  'Due date': string;
  Billed: number;
  Paid: number;
  Outstanding: number;
}

export function flattenReceivablesRows(
  insurers: InsurerReceivable[],
  isAdmin: boolean,
): ReceivableRow[] {
  const rows: ReceivableRow[] = [];
  for (const insurer of insurers) {
    for (const patient of insurer.patients) {
      rows.push({
        Insurer: insurer.insurer,
        Client: isAdmin ? patient.clientName ?? '' : '',
        Patient: patient.patientName,
        'Patient ID': patient.patientId ?? '',
        Status: patient.status,
        'Due date': patient.dueDate,
        Billed: patient.billed,
        Paid: patient.paid,
        Outstanding: patient.outstanding,
      });
    }
  }
  return rows;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — both `receivablesRows.test.ts` tests green (plus the Task 1 tests still pass).

- [ ] **Step 5: Implement the export wrappers**

Create `app/lib/receivablesExport.ts`:

```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatKes } from '@/lib/format-kes';
import { flattenReceivablesRows } from './receivablesRows';
import type { InsurerReceivable, ReceivablesTotals } from '../types/receivable';

const dateStamp = (): string => new Date().toISOString().slice(0, 10);

export function exportReceivablesExcel(
  insurers: InsurerReceivable[],
  totals: ReceivablesTotals,
  isAdmin: boolean,
): void {
  const rows = flattenReceivablesRows(insurers, isAdmin);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Receivables');

  const summary = [
    { Metric: 'Total billed', Amount: totals.billed },
    { Metric: 'Total paid', Amount: totals.paid },
    { Metric: 'Total outstanding', Amount: totals.outstanding },
    { Metric: 'Insurers', Amount: totals.insurerCount },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary');

  XLSX.writeFile(wb, `faways-receivables-${dateStamp()}.xlsx`);
}

export function exportReceivablesPdf(
  insurers: InsurerReceivable[],
  totals: ReceivablesTotals,
  isAdmin: boolean,
): void {
  const rows = flattenReceivablesRows(insurers, isAdmin);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.text('Insurance Receivables', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Total billed: ${formatKes(totals.billed)}   Paid: ${formatKes(totals.paid)}   Outstanding: ${formatKes(totals.outstanding)}   Insurers: ${totals.insurerCount}`,
    40,
    60,
  );

  const head = isAdmin
    ? [['Insurer', 'Client', 'Patient', 'Patient ID', 'Status', 'Due date', 'Billed', 'Paid', 'Outstanding']]
    : [['Insurer', 'Patient', 'Patient ID', 'Status', 'Due date', 'Billed', 'Paid', 'Outstanding']];

  const body = rows.map((r) =>
    isAdmin
      ? [r.Insurer, r.Client, r.Patient, r['Patient ID'], r.Status, r['Due date'], formatKes(r.Billed), formatKes(r.Paid), formatKes(r.Outstanding)]
      : [r.Insurer, r.Patient, r['Patient ID'], r.Status, r['Due date'], formatKes(r.Billed), formatKes(r.Paid), formatKes(r.Outstanding)],
  );

  autoTable(doc, {
    head,
    body,
    startY: 80,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  doc.save(`faways-receivables-${dateStamp()}.pdf`);
}
```

- [ ] **Step 6: Typecheck the new files**

Run: `npx tsc --noEmit 2>&1 | grep -E "receivablesExport|receivablesRows" || echo "OK: no type errors in export files"`
Expected: `OK: no type errors in export files`

- [ ] **Step 7: Commit**

```bash
git add app/lib/receivablesRows.ts app/lib/receivablesRows.test.ts app/lib/receivablesExport.ts
git commit -m "feat(receivables): add PDF/Excel export helpers"
```

---

## Task 3: Outstanding-by-insurer bar chart

**Files:**
- Create: `app/components/receivables/ReceivablesChart.tsx`

**Interfaces:**
- Consumes: `InsurerReceivable` from `app/types/receivable.ts`; `formatKes`, `kesAxisTick` from `@/lib/format-kes`; recharts.
- Produces: default export `ReceivablesChart({ insurers }: { insurers: InsurerReceivable[] })`. Renders nothing (returns `null`) when `insurers` is empty.

- [ ] **Step 1: Create the chart component**

Create `app/components/receivables/ReceivablesChart.tsx`:

```tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { InsurerReceivable } from '../../types/receivable';
import { formatKes, kesAxisTick } from '@/lib/format-kes';

interface ReceivablesChartProps {
  insurers: InsurerReceivable[];
}

interface ChartDatum {
  name: string;
  fullName: string;
  Billed: number;
  Paid: number;
  Outstanding: number;
}

const ReceivablesTooltip = (
  props: TooltipProps<ValueType, NameType> & {
    active?: boolean;
    payload?: Array<{
      payload: ChartDatum;
      value?: number;
      name?: string;
      color?: string;
    }>;
  },
) => {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-gray-900">{datum.fullName}</p>
      {payload.map((entry, index) => (
        <p
          key={`${entry.name}-${index}`}
          className="text-sm"
          style={{ color: entry.color || '#000' }}
        >
          {entry.name}: {formatKes(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
};

export default function ReceivablesChart({ insurers }: ReceivablesChartProps) {
  const chartData: ChartDatum[] = insurers.slice(0, 8).map((item) => ({
    name:
      item.insurer.length > 15 ? item.insurer.slice(0, 15) + '...' : item.insurer,
    fullName: item.insurer,
    Billed: item.billed,
    Paid: item.paid,
    Outstanding: item.outstanding,
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Outstanding by Insurer (Top 8)
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value: number) => kesAxisTick(value)} tick={{ fontSize: 12 }} />
          <Tooltip content={<ReceivablesTooltip />} />
          <Legend />
          <Bar dataKey="Billed" fill="#3b82f6" name="Billed" />
          <Bar dataKey="Paid" fill="#22c55e" name="Paid" />
          <Bar dataKey="Outstanding" fill="#ef4444" name="Outstanding" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit 2>&1 | grep "ReceivablesChart" || echo "OK: no type errors in chart"`
Expected: `OK: no type errors in chart`

- [ ] **Step 3: Commit**

```bash
git add app/components/receivables/ReceivablesChart.tsx
git commit -m "feat(receivables): add outstanding-by-insurer bar chart"
```

---

## Task 4: Expandable insurer drill-down table

**Files:**
- Create: `app/components/receivables/InsurerTable.tsx`

**Interfaces:**
- Consumes: `InsurerReceivable`, `PatientReceivable` from `app/types/receivable.ts`; `formatKes` from `@/lib/format-kes`; `ChevronDown`, `ChevronRight` from `lucide-react`.
- Produces: default export `InsurerTable({ insurers, isAdmin }: { insurers: InsurerReceivable[]; isAdmin: boolean })`. Shows an empty-state message when `insurers` is empty. Client view: insurer row → patient table. Admin view: insurer row → client rows → patient table.

- [ ] **Step 1: Create the table component**

Create `app/components/receivables/InsurerTable.tsx`:

```tsx
'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatKes } from '@/lib/format-kes';
import type { InsurerReceivable, PatientReceivable } from '../../types/receivable';

interface InsurerTableProps {
  insurers: InsurerReceivable[];
  isAdmin: boolean;
}

const statusBadge = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'overdue':
      return 'bg-red-100 text-red-700';
    case 'negotiating':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

function PatientRows({
  patients,
  showClient,
}: {
  patients: PatientReceivable[];
  showClient: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="px-3 py-2 font-medium">Patient</th>
          {showClient && <th className="px-3 py-2 font-medium">Client</th>}
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Due date</th>
          <th className="px-3 py-2 text-right font-medium">Billed</th>
          <th className="px-3 py-2 text-right font-medium">Paid</th>
          <th className="px-3 py-2 text-right font-medium">Outstanding</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr key={p.debtId} className="border-t border-slate-100">
            <td className="px-3 py-2">
              <div className="font-medium text-slate-800">{p.patientName}</div>
              {p.patientId && (
                <div className="text-xs text-slate-400">{p.patientId}</div>
              )}
            </td>
            {showClient && (
              <td className="px-3 py-2 text-slate-600">{p.clientName}</td>
            )}
            <td className="px-3 py-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(p.status)}`}
              >
                {p.status}
              </span>
            </td>
            <td className="px-3 py-2 text-slate-600">{p.dueDate}</td>
            <td className="px-3 py-2 text-right text-slate-700">{formatKes(p.billed)}</td>
            <td className="px-3 py-2 text-right text-slate-700">{formatKes(p.paid)}</td>
            <td className="px-3 py-2 text-right font-semibold text-slate-900">
              {formatKes(p.outstanding)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function InsurerTable({ insurers, isAdmin }: InsurerTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const toggle = (
    set: Set<string>,
    setSet: (s: Set<string>) => void,
    id: string,
  ) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  };

  if (insurers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate-500">
        No receivables to show yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Insurer</th>
            <th className="px-4 py-3 text-right font-medium">Billed</th>
            <th className="px-4 py-3 text-right font-medium">Paid</th>
            <th className="px-4 py-3 text-right font-medium">Outstanding</th>
            <th className="px-4 py-3 text-right font-medium">Patients</th>
          </tr>
        </thead>
        <tbody>
          {insurers.map((insurer) => {
            const isOpen = expanded.has(insurer.insurer);
            return (
              <Fragment key={insurer.insurer}>
                <tr
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => toggle(expanded, setExpanded, insurer.insurer)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {insurer.insurer}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatKes(insurer.billed)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatKes(insurer.paid)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatKes(insurer.outstanding)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{insurer.patientCount}</td>
                </tr>
                {isOpen && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="px-4 py-3">
                      {isAdmin && insurer.clients ? (
                        <div className="space-y-2">
                          {insurer.clients.map((client) => {
                            const clientId = `${insurer.insurer}::${client.clientId}`;
                            const clientOpen = expandedClients.has(clientId);
                            return (
                              <div
                                key={clientId}
                                className="rounded-md border border-slate-200 bg-white"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggle(expandedClients, setExpandedClients, clientId)
                                  }
                                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                                >
                                  <span className="flex items-center gap-2 font-medium text-slate-800">
                                    {clientOpen ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    {client.clientName}
                                  </span>
                                  <span className="text-sm text-slate-600">
                                    Outstanding {formatKes(client.outstanding)}
                                  </span>
                                </button>
                                {clientOpen && (
                                  <div className="border-t border-slate-100 px-3 py-2">
                                    <PatientRows patients={client.patients} showClient={false} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <PatientRows patients={insurer.patients} showClient={false} />
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit 2>&1 | grep "InsurerTable" || echo "OK: no type errors in table"`
Expected: `OK: no type errors in table`

- [ ] **Step 3: Commit**

```bash
git add app/components/receivables/InsurerTable.tsx
git commit -m "feat(receivables): add expandable insurer drill-down table"
```

---

## Task 5: Receivables page

**Files:**
- Create: `app/receivables/page.tsx`

**Interfaces:**
- Consumes: `DashboardLayout`, `StatisticsCard`, `ReceivablesChart`, `InsurerTable`; `fetchDebts` (`app/lib/debts.ts`), `fetchClients` (`app/lib/clients.ts`), `buildInsurerReceivables` (`app/lib/receivables.ts`), `exportReceivablesPdf`/`exportReceivablesExcel` (`app/lib/receivablesExport.ts`); `formatKes` (`@/lib/format-kes`); `supabase` (`@/lib/supabase-client`); `Debt` type.
- Produces: default export `ReceivablesPage` (route `/receivables`).

- [ ] **Step 1: Create the page**

Create `app/receivables/page.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatisticsCard from '../components/StatisticsCard';
import ReceivablesChart from '../components/receivables/ReceivablesChart';
import InsurerTable from '../components/receivables/InsurerTable';
import { fetchDebts } from '../lib/debts';
import { fetchClients } from '../lib/clients';
import { buildInsurerReceivables } from '../lib/receivables';
import {
  exportReceivablesPdf,
  exportReceivablesExcel,
} from '../lib/receivablesExport';
import { formatKes } from '@/lib/format-kes';
import { supabase } from '@/lib/supabase-client';
import type { Debt } from '../types/debt';

export default function ReceivablesPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [clientNameById, setClientNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [role, setRole] = useState<string>('client');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userRole =
          (user?.user_metadata?.role as string | undefined)?.toLowerCase() ||
          'client';
        setRole(userRole);

        const debtData = await fetchDebts();
        setDebts(debtData);

        if (userRole === 'admin') {
          try {
            const clients = await fetchClients();
            setClientNameById(new Map(clients.map((c) => [c.id, c.name])));
          } catch (e) {
            console.error('Error loading clients for receivables', e);
          }
        }
      } catch (error) {
        console.error('Error loading receivables', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isAdmin = role === 'admin';

  const { insurers, totals } = useMemo(
    () => buildInsurerReceivables(debts, role, clientNameById),
    [debts, role, clientNameById],
  );

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insurances</h1>
              <p className="mt-1 text-sm text-gray-600">
                {isAdmin
                  ? 'What every insurer owes across all clients'
                  : 'What each insurer owes you'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportReceivablesPdf(insurers, totals, isAdmin)}
                disabled={insurers.length === 0}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Export PDF
              </button>
              <button
                onClick={() => exportReceivablesExcel(insurers, totals, isAdmin)}
                disabled={insurers.length === 0}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading receivables...</p>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                  title="Total Billed"
                  value={formatKes(totals.billed)}
                  subtitle={`${totals.insurerCount} insurers`}
                />
                <StatisticsCard title="Total Paid" value={formatKes(totals.paid)} />
                <StatisticsCard
                  title="Total Outstanding"
                  value={formatKes(totals.outstanding)}
                  subtitle="Still owed"
                />
                <StatisticsCard title="Insurers" value={totals.insurerCount} />
              </div>

              <div className="mb-8">
                <ReceivablesChart insurers={insurers} />
              </div>

              <InsurerTable insurers={insurers} isAdmin={isAdmin} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit 2>&1 | grep "receivables/page" || echo "OK: no type errors in page"`
Expected: `OK: no type errors in page`

- [ ] **Step 3: Manually verify the page renders**

Run: `npm run dev`, then open `http://localhost:3000/receivables` while logged in.
Expected: KPI cards, the bar chart, and the insurer table render. Expanding an insurer row shows patient rows (admin: client rows that expand to patients). Export PDF/Excel download files. No console errors.

- [ ] **Step 4: Commit**

```bash
git add app/receivables/page.tsx
git commit -m "feat(receivables): add insurances page wiring KPIs, chart, table, export"
```

---

## Task 6: Sidebar navigation entry

**Files:**
- Modify: `app/components/Sidebar.tsx`

**Interfaces:**
- Consumes: existing `navItems` array and the `client` allowlist filter in `Sidebar.tsx`.
- Produces: an "Insurances" nav item (`href: '/receivables'`) visible to both admins and clients.

- [ ] **Step 1: Add the nav item after "Debts"**

In `app/components/Sidebar.tsx`, find the end of the Debts nav-item object (the one with `name: 'Debts'`, `href: '/debts'`). Immediately after its closing `},` insert:

```tsx
    {
      name: 'Insurances',
      href: '/receivables',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
```

- [ ] **Step 2: Add "insurances" to the client allowlist**

In `app/components/Sidebar.tsx`, find:

```tsx
      ? navItems.filter((item) =>
          ['dashboard', 'debts', 'agents', 'reports', 'settings'].includes(
            item.name.toLowerCase(),
          ),
        )
```

Replace the array literal with:

```tsx
          ['dashboard', 'debts', 'insurances', 'agents', 'reports', 'settings'].includes(
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "Sidebar" || echo "OK: no type errors in Sidebar"`
Expected: `OK: no type errors in Sidebar`

- [ ] **Step 4: Manually verify the sidebar**

Run: `npm run dev` (if not already running). As an admin and as a client, confirm the **Insurances** item appears in the sidebar between Debts and Agents, links to `/receivables`, and the existing "Contacts" item (`/insurance`) does NOT highlight when on `/receivables`.
Expected: both behaviors correct.

- [ ] **Step 5: Final test run + commit**

```bash
npm test
git add app/components/Sidebar.tsx
git commit -m "feat(receivables): add Insurances sidebar entry for clients and admins"
```
Expected: `npm test` passes (Task 1 + Task 2 suites green).

---

## Self-Review

**Spec coverage:**
- Read-only rollup of existing debts by insurer → Tasks 1, 5. ✓
- Billed/paid/outstanding ("show both") → Task 1 types/aggregation + Task 5 KPIs + Task 4 table. ✓
- Client = insurer→patients; Admin = insurer→client→patients → Task 1 (`isAdmin` branch) + Task 4 (rendering). ✓
- Role scoping (client sees own, admin sees all) → reuses `fetchDebts()`; role read in Task 5. ✓
- "No insurer specified" + outstanding clamp + empty/loading states → Task 1 + Tasks 4/5. ✓
- KPI cards + recharts chart + expandable table → Tasks 5, 3, 4. ✓
- PDF + Excel export → Task 2 + buttons in Task 5. ✓
- Sidebar "Insurances" entry, route `/receivables`, in client allowlist → Task 6. ✓
- vitest for aggregation only → Tasks 1 & 2. ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code. ✓

**Type consistency:** `buildInsurerReceivables(debts, role, clientNameById)` signature identical across Tasks 1/5. `InsurerReceivable.patients`/`.clients`/`.insurer`/`.outstanding`/`.billed`/`.paid`/`.patientCount` used consistently in Tasks 3/4/5. `flattenReceivablesRows(insurers, isAdmin)` and `ReceivableRow` consistent across Task 2. `exportReceivablesPdf/Excel(insurers, totals, isAdmin)` consistent between Tasks 2 and 5. ✓
