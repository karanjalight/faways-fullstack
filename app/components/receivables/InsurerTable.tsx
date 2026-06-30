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
