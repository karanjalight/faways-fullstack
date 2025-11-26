'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { mockDebts } from '../data/mockDebts';
import { Debt } from '../types/debt';
import { isAuthenticated } from '../lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const stageLabels: Record<Debt['stage'], string> = {
  new: 'New Intakes',
  'in-review': 'In Review',
  escalated: 'Escalated',
  legal: 'Legal & Settlements',
};

export default function CollectionsPage() {
  const router = useRouter();
  const [debts] = useState<Debt[]>(mockDebts);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const groupedByStage = useMemo(() => {
    return debts.reduce<Record<Debt['stage'], Debt[]>>(
      (acc, debt) => {
        acc[debt.stage].push(debt);
        return acc;
      },
      { new: [], 'in-review': [], escalated: [], legal: [] }
    );
  }, [debts]);

  const totalProjected = debts.reduce((sum, debt) => sum + (debt.amount - debt.paidAmount), 0);
  const escalatedCount = groupedByStage.escalated.length + groupedByStage.legal.length;

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="rounded-3xl border border-transparent bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Collections control</p>
              <h1 className="text-3xl font-semibold text-slate-900">Care Collections Board</h1>
              <p className="text-sm text-slate-500">
                Coordinate hospital & doctor recoveries with stage-based swim-lanes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="rounded-2xl">
                Sync to CRM
              </Button>
              <Button className="rounded-2xl px-6">Schedule Outreach</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Projected Recoveries</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">
                {totalProjected.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Escalated matters</CardDescription>
              <CardTitle className="text-2xl text-rose-600">{escalatedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Average age</CardDescription>
              <CardTitle className="text-2xl">48 days</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Docs ready for payers</CardDescription>
              <CardTitle className="text-2xl">{debts.filter((d) => (d.documents ?? []).length > 0).length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {(Object.keys(stageLabels) as Debt['stage'][]).map((stage) => (
            <Card key={stage} className="rounded-3xl border-none bg-white shadow-lg shadow-slate-100/70">
              <CardHeader>
                <CardTitle>{stageLabels[stage]}</CardTitle>
                <CardDescription>{groupedByStage[stage].length} in flight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedByStage[stage].map((debt) => (
                  <div
                    key={debt.id}
                    className="space-y-2 rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{debt.creditor}</p>
                      <Badge variant="secondary">{debt.priority} priority</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {debt.patientName} • {debt.serviceLine}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">
                        {debt.amount.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-xs text-slate-500">{debt.owner}</span>
                    </div>
                  </div>
                ))}
                {groupedByStage[stage].length === 0 && (
                  <p className="text-sm text-slate-400">No cases here yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}




