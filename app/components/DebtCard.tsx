// Individual debt card component
'use client';

import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Debt, getRemainingAmount, isOverdue } from '../types/debt';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onStatusChange: (debtId: string, newStatus: Debt['status']) => void;
  onDelete?: (debtId: string) => void;
}

const statusVariantMap: Record<Debt['status'], ComponentProps<typeof Badge>['variant']> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  negotiating: 'secondary',
};

const priorityVariantMap: Record<Debt['priority'], ComponentProps<typeof Badge>['variant']> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
};

export default function DebtCard({
  debt,
  onEdit,
  onStatusChange,
  onDelete,
}: DebtCardProps) {
  const remaining = getRemainingAmount(debt);
  const overdue = isOverdue(debt);
  const progress = Math.min(100, (debt.paidAmount / debt.amount) * 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="group rounded-3xl border border-slate-600 bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {debt.clientType === 'hospital'
              ? 'Hospital'
              : debt.clientType === 'clinic'
                ? 'Clinic'
                : 'Specialty Practice'}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{debt.creditor}</h3>
          <p className="text-sm text-slate-500">
            Owner: <span className="font-medium text-slate-800">{debt.owner}</span>
          </p>
          <p className="text-sm text-slate-500">
            Stage:{' '}
            <span className="font-medium text-slate-800">
              {debt.stage.replace('-', ' ')}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusVariantMap[debt.status]}>
            {debt.status === 'negotiating' ? 'Negotiating' : debt.status}
          </Badge>
          <Badge variant={priorityVariantMap[debt.priority]}>
            {debt.priority} priority
          </Badge>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-slate-500">Patient</p>
            <p className="font-semibold text-slate-900">
              {debt.patientName} • {debt.patientId}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Service Line</p>
            <p className="font-semibold text-slate-900">{debt.serviceLine}</p>
          </div>
          <div>
            <p className="text-slate-500">Payer</p>
            <p className="font-semibold text-slate-900">{debt.payer}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-100 p-3">
          <p className="text-slate-500">Invoice</p>
          <p className="text-base font-semibold text-slate-900">
            {formatCurrency(debt.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 p-3">
          <p className="text-slate-500">Collected</p>
          <p className="text-base font-semibold text-emerald-600">
            {formatCurrency(debt.paidAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 p-3">
          <p className="text-slate-500">Balance</p>
          <p className="text-base font-semibold text-rose-600">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-wide text-slate-500">
          <span>Collection progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
        <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
          <span>Due {formatDate(debt.dueDate)}</span>
          {overdue && debt.status !== 'paid' && (
            <span className="font-semibold text-rose-600">Overdue</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" className="flex-1" onClick={() => onEdit(debt)}>
          Edit Case
        </Button>
        {debt.status !== 'paid' && (
          <select
            value={debt.status}
            onChange={(e) => onStatusChange(debt.id, e.target.value as Debt['status'])}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="negotiating">Negotiating</option>
            <option value="paid">Mark as Paid</option>
          </select>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(debt.id)}
            title="Delete debt"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

