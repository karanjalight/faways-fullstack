// Detail view modal for clients
'use client';

import { Client } from '../types/client';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ClientDetailModal({
  isOpen,
  onClose,
  client,
  onEdit,
  onDelete,
}: ClientDetailModalProps) {
  if (!isOpen || !client) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusStyles = {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    closed: 'bg-green-100 text-green-800',
  };

  const progress = client.totalDebt > 0 
    ? (client.paidAmount / client.totalDebt) * 100 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Client Details
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">
                {client.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{client.name}</h3>
              {client.company && (
                <p className="text-gray-600">{client.company}</p>
              )}
              <p className="text-sm text-gray-500">{client.email}</p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[client.status]
                }`}
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Debt Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Debt Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Debt:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(client.totalDebt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paid Amount:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(client.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(client.remainingAmount)}
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span>Payment Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Phone Number
              </label>
              <p className="mt-1 text-gray-900">{client.phone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Assigned Agent
              </label>
              <p className="mt-1 text-gray-900">
                {client.assignedAgent || 'Unassigned'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Contact
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(client.lastContact)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Account Created
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onDelete}
            className="flex-1 rounded-md border border-red-300 bg-white px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={onEdit}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
