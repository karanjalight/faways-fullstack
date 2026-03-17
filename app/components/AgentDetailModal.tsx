// Detail view modal for agents
'use client';

import { Agent } from '../types/agent';

interface AgentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AgentDetailModal({
  isOpen,
  onClose,
  agent,
  onEdit,
  onDelete,
}: AgentDetailModalProps) {
  if (!isOpen || !agent) return null;

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
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    'on-leave': 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transform transition-all duration-200 ease-out scale-100">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Agent Details
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Full snapshot of this collection agent, ready for quick action.
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
                {agent.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900">{agent.name}</h3>
              <p className="text-slate-600">{agent.email}</p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[agent.status]
                }`}
              >
                {agent.status.charAt(0).toUpperCase() +
                  agent.status.slice(1).replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-500">
                Phone Number
              </label>
              <p className="mt-1 text-slate-900">{agent.phone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Department
              </label>
              <p className="mt-1 text-slate-900">{agent.department}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Join Date
              </label>
              <p className="mt-1 text-slate-900">{formatDate(agent.joinDate)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Assigned Debts
              </label>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {agent.assignedDebts}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Total Collected
              </label>
              <p className="mt-1 text-lg font-semibold text-green-600">
                {formatCurrency(agent.totalCollected)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">
                Performance
              </label>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${agent.performance}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {agent.performance}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
          <button
            onClick={onDelete}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 focus:ring-offset-white"
          >
            Delete
          </button>
          <button
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
