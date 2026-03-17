// Debts list page
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Debt, DebtStatus } from '../types/debt';
import DashboardLayout from '../components/DashboardLayout';
import DebtList from '../components/DebtList';
import { Button } from '@/components/ui/button';
import { fetchDebts, updateDebt, deleteDebt as deleteDebtFromDb } from '../lib/debts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const loadDebts = async () => {
      try {
        const data = await fetchDebts();
        setDebts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDebts();
  }, []);

  const metrics = useMemo(() => {
    const total = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const collected = debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const overdue = debts.filter((debt) => debt.status === 'overdue');
    const highPriority = debts.filter((debt) => debt.priority === 'high');
    return {
      total,
      collected,
      remaining: total - collected,
      overdueCount: overdue.length,
      highPriority: highPriority.length,
    };
  }, [debts]);

  const documentQueue = useMemo(() => {
    return debts
      .flatMap((debt) =>
        (debt.documents ?? []).map((doc) => ({
          debtId: debt.id,
          client: debt.creditor,
          patient: debt.patientName,
          ...doc,
        }))
      )
      .slice(0, 4);
  }, [debts]);

  const activeOwners = useMemo(() => {
    const grouped = debts.reduce<Record<string, number>>((acc, debt) => {
      acc[debt.owner] = (acc[debt.owner] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [debts]);

  const handleStatusChange = async (debtId: string, newStatus: DebtStatus) => {
    const target = debts.find((d) => d.id === debtId);
    if (!target) return;

    const nextPaid =
      newStatus === 'paid' ? target.amount : target.paidAmount;

    // Optimistic update
    setDebts((prev) =>
      prev.map((debt) =>
        debt.id === debtId
          ? { ...debt, status: newStatus, paidAmount: nextPaid }
          : debt,
      ),
    );

    try {
      await updateDebt(debtId, {
        status: newStatus,
        paidAmount: nextPaid,
      });
    } catch (error) {
      console.error(error);
      // Ideally refetch here; keep simple and ignore for now
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;

    // Optimistic remove
    setDebts((prev) => prev.filter((debt) => debt.id !== debtId));

    try {
      await deleteDebtFromDb(debtId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 border border-transparent bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-6 rounded-3xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Client dashboard</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Debts & Care Collections
            </h1>
            <p className="text-sm text-slate-500">
              {debts.length} active hospital & doctor cases curated for {user?.name ?? 'you'}.
            </p>
          </div>
          <div className="flex gap-3">
            
            <Button
              className="rounded-2xl bg-blue-800 px-6"
              onClick={() => {
                router.push('/debts/new');
              }}
            >
              + Create Debt
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Total Exposure</CardDescription>
              <CardTitle className="text-2xl">
                {metrics.total.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Remaining Balance</CardDescription>
              <CardTitle className="text-2xl text-rose-600">
                {metrics.remaining.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>High Priority</CardDescription>
              <CardTitle className="text-2xl">{metrics.highPriority}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Overdue cases</CardDescription>
              <CardTitle className="text-2xl text-rose-600">{metrics.overdueCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="rounded-3xl border-none bg-white shadow-lg shadow-slate-100/70">
            
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading debts...</p>
              ) : (
                <DebtList
                  debts={debts}
                  onEdit={(debt) => router.push(`/debts/${debt.id}`)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteDebt}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

