// Debts list page
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Debt, DebtStatus } from '../types/debt';
import { mockDebts } from '../data/mockDebts';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import DebtList from '../components/DebtList';
import AddDebtModal from '../components/AddDebtModal';
import { Button } from '@/components/ui/button';
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
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [user] = useState(getCurrentUser());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

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

  const handleAddDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setDebts((prev) => [newDebt, ...prev]);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setIsModalOpen(true);
  };

  const handleSaveDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    if (editingDebt) {
      setDebts((prev) =>
        prev.map((debt) =>
          debt.id === editingDebt.id
            ? { ...debtData, id: editingDebt.id, createdAt: editingDebt.createdAt }
            : debt
        )
      );
      setEditingDebt(null);
    } else {
      handleAddDebt(debtData);
    }
  };

  const handleStatusChange = (debtId: string, newStatus: DebtStatus) => {
    setDebts((prev) =>
      prev.map((debt) =>
        debt.id === debtId
          ? {
              ...debt,
              status: newStatus,
              paidAmount: newStatus === 'paid' ? debt.amount : debt.paidAmount,
            }
          : debt
      )
    );
  };

  const handleDeleteDebt = (debtId: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      setDebts((prev) => prev.filter((debt) => debt.id !== debtId));
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

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
            <Button variant="secondary" className="rounded-2xl">
              Share Snapshot
            </Button>
            <Button
              className="rounded-2xl px-6"
              onClick={() => {
                setEditingDebt(null);
                setIsModalOpen(true);
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pipeline Intelligence</CardTitle>
                <CardDescription>Filter and action every client case.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={() => setIsModalOpen(true)}>
                Add Debt
              </Button>
            </CardHeader>
            <CardContent>
              <DebtList
                debts={debts}
                onEdit={handleEditDebt}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteDebt}
              />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Daily Worklist</CardTitle>
                <CardDescription>Owners with most cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeOwners.map(([owner, count]) => (
                  <div key={owner} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{owner}</p>
                      <p className="text-xs text-slate-500">Hospital & specialty cases</p>
                    </div>
                    <Badge variant="secondary">{count} cases</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Document Queue</CardTitle>
                <CardDescription>Fast track uploads that need review.</CardDescription>
              </CardHeader>
              <CardContent>
                {documentQueue.length === 0 ? (
                  <p className="text-sm text-slate-500">No documents pending.</p>
                ) : (
                  <div className="space-y-4">
                    {documentQueue.map((doc) => (
                      <div key={doc.id} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                          <Badge variant={doc.type === 'pdf' ? 'secondary' : 'default'}>
                            {doc.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {doc.client} • {doc.patient} • {doc.size}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Collections Outlook</CardTitle>
            <CardDescription>
              Group cases by stage to understand what hospitals expect this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="new">
              <TabsList className="flex-wrap">
                <TabsTrigger value="new">New Intakes</TabsTrigger>
                <TabsTrigger value="in-review">In Review</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
                <TabsTrigger value="legal">Legal</TabsTrigger>
              </TabsList>
              {(['new', 'in-review', 'escalated', 'legal'] as Debt['stage'][]).map((stage) => (
                <TabsContent key={stage} value={stage}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {debts
                      .filter((debt) => debt.stage === stage)
                      .map((debt) => (
                        <div key={debt.id} className="rounded-2xl border border-slate-100 p-4">
                          <p className="text-sm font-semibold text-slate-900">{debt.creditor}</p>
                          <p className="text-xs text-slate-500">
                            {debt.patientName} • {debt.serviceLine}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">
                              {debt.amount.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <Badge variant="secondary">{debt.owner}</Badge>
                          </div>
                        </div>
                      ))}
                    {debts.filter((debt) => debt.stage === stage).length === 0 && (
                      <p className="text-sm text-slate-500">No cases in this stage.</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AddDebtModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
      />
    </DashboardLayout>
  );
}

