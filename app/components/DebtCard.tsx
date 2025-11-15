// Individual debt card component
'use client';

import { Debt, getRemainingAmount, isOverdue } from '../types/debt';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onStatusChange: (debtId: string, newStatus: Debt['status']) => void;
  onDelete?: (debtId: string) => void;
}

export default function DebtCard({ debt, onEdit, onStatusChange, onDelete }: DebtCardProps) {
  const remaining = getRemainingAmount(debt);
  const overdue = isOverdue(debt);
  const progress = (debt.paidAmount / debt.amount) * 100;

  // Status badge styling
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    negotiating: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  // Priority badge styling
  const priorityStyles = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`group rounded-lg border-2 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        overdue && debt.status !== 'paid'
          ? 'border-red-300 bg-red-50/30'
          : 'border-gray-200'
      }`}
    >
      {/* Header with creditor name and status */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {debt.creditor}
          </h3>
          {debt.description && (
            <p className="mt-1 text-sm text-gray-600">{debt.description}</p>
          )}
        </div>
        <div className="ml-4 flex flex-col gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
              statusStyles[debt.status]
            }`}
          >
            {debt.status.charAt(0).toUpperCase() + debt.status.slice(1)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              priorityStyles[debt.priority]
            }`}
          >
            {debt.priority} priority
          </span>
        </div>
      </div>

      {/* Amount information */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(debt.amount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Paid:</span>
          <span className="font-semibold text-green-600">
            {formatCurrency(debt.paidAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining:</span>
          <span className="font-semibold text-red-600">
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {debt.status !== 'paid' && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Due date */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">Due Date:</span>
        <span
          className={`font-medium ${
            overdue && debt.status !== 'paid'
              ? 'text-red-600'
              : 'text-gray-900'
          }`}
        >
          {formatDate(debt.dueDate)}
          {overdue && debt.status !== 'paid' && (
            <span className="ml-2 text-red-600">⚠ Overdue</span>
          )}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 border-t border-gray-100 pt-4">
        <button
          onClick={() => onEdit(debt)}
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Edit
        </button>
        {debt.status !== 'paid' && (
          <select
            value={debt.status}
            onChange={(e) =>
              onStatusChange(debt.id, e.target.value as Debt['status'])
            }
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <option value="pending">Pending</option>
            <option value="negotiating">Negotiating</option>
            <option value="paid">Mark as Paid</option>
          </select>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(debt.id)}
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            title="Delete debt"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

