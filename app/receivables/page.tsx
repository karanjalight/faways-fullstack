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
