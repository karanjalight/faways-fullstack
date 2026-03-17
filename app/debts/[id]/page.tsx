'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { Debt, DebtStatus } from '../../types/debt';
import { getCurrentUser } from '../../lib/auth';
import { fetchDebtById, updateDebt, deleteDebt } from '../../lib/debts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DebtDetailPageProps {
  params: { id: string };
}

export default function DebtDetailPage({ params }: DebtDetailPageProps) {
  const router = useRouter();
  const user = getCurrentUser();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDebtById(params.id);
        setDebt(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id, router]);

  const handleFieldChange = <K extends keyof Debt>(key: K, value: Debt[K]) => {
    if (!debt) return;
    setDebt({ ...debt, [key]: value });
  };

  const handleSave = async () => {
    if (!debt) return;
    setIsSaving(true);
    try {
      await updateDebt(debt.id, {
        creditor: debt.creditor,
        patientName: debt.patientName,
        serviceLine: debt.serviceLine,
        owner: debt.owner,
        amount: debt.amount,
        paidAmount: debt.paidAmount,
        dueDate: debt.dueDate,
        status: debt.status,
        priority: debt.priority,
        description: debt.description,
      });
      router.push('/debts');
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!debt) return;
    if (!confirm('Are you sure you want to delete this debt?')) return;
    try {
      await deleteDebt(debt.id);
      router.push('/debts');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Debt detail
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                {debt ? debt.patientName : 'Loading debt...'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review and update this case in one view.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-slate-500">Owner</span>
              <span className="text-sm font-semibold text-slate-900">
                {debt?.owner ?? 'Unassigned'}
              </span>
              <span className="text-[11px] text-slate-500">
                Signed in as {user?.name ?? 'Client user'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {isLoading || !debt ? (
            <p className="text-sm text-slate-500">Loading debt details...</p>
          ) : (
            <div className="mx-auto max-w-5xl space-y-8">
              <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Client & patient
                    </h2>
                    <p className="text-xs text-slate-500">
                      Adjust who and where this outstanding balance belongs.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Healthcare Client</Label>
                    <Input
                      value={debt.creditor}
                      onChange={(e) =>
                        handleFieldChange('creditor', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Name</Label>
                    <Input
                      value={debt.patientName}
                      onChange={(e) =>
                        handleFieldChange('patientName', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Line</Label>
                    <Input
                      value={debt.serviceLine}
                      onChange={(e) =>
                        handleFieldChange('serviceLine', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Collection Owner</Label>
                    <Input
                      value={debt.owner}
                      onChange={(e) =>
                        handleFieldChange('owner', e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Financial & status
                    </h2>
                    <p className="text-xs text-slate-500">
                      Keep exposure, timing and routing accurate.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Invoice Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={debt.amount}
                      onChange={(e) =>
                        handleFieldChange('amount', Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Collected to Date</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={debt.paidAmount}
                      onChange={(e) =>
                        handleFieldChange(
                          'paidAmount',
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={debt.dueDate}
                      onChange={(e) =>
                        handleFieldChange('dueDate', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={debt.status}
                      onChange={(e) =>
                        handleFieldChange(
                          'status',
                          e.target.value as DebtStatus,
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="negotiating">Negotiating</option>
                      <option value="overdue">Overdue</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select
                      value={debt.priority}
                      onChange={(e) =>
                        handleFieldChange(
                          'priority',
                          e.target.value as Debt['priority'],
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={debt.description ?? ''}
                      onChange={(e) =>
                        handleFieldChange('description', e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/debts')}
                >
                  Back to list
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl text-rose-600 hover:bg-rose-50"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    className="rounded-2xl px-6"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

