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
