// Detail view modal for clients
"use client";

import { Client } from "../types/client";

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusStyles = {
    active: "bg-blue-100 text-blue-800",
    inactive: "bg-gray-100 text-gray-800",
    closed: "bg-green-100 text-green-800",
  };

  const progress = client.totalDebt > 0 
    ? (client.paidAmount / client.totalDebt) * 100 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Client Details
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Full snapshot of this client account and their exposure.
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
            >
              <span className="sr-only">Close</span>
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 shadow-inner">
              <span className="text-2xl font-bold text-blue-600">
                {client.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900">{client.name}</h3>
              {client.company && (
                <p className="text-slate-600">{client.company}</p>
              )}
              <p className="text-sm text-slate-500">{client.email}</p>
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
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-700">
              Debt Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Debt:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(client.totalDebt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Paid Amount:</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(client.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Remaining:</span>
                <span className="font-semibold text-rose-600">
                  {formatCurrency(client.remainingAmount)}
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>Payment Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-500">
                Phone Number
              </label>
              <p className="mt-1 text-slate-900">{client.phone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Assigned Agent
              </label>
              <p className="mt-1 text-slate-900">
                {client.assignedAgent || "Unassigned"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Last Contact
              </label>
              <p className="mt-1 text-slate-900">
                {formatDate(client.lastContact)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Account Created
              </label>
              <p className="mt-1 text-slate-900">
                {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onDelete}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 focus:ring-offset-white"
          >
            Delete
          </button>
          <button
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
