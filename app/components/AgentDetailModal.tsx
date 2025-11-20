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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Agent Details
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
                {agent.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{agent.name}</h3>
              <p className="text-gray-600">{agent.email}</p>
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
              <label className="text-sm font-medium text-gray-500">
                Phone Number
              </label>
              <p className="mt-1 text-gray-900">{agent.phone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Department
              </label>
              <p className="mt-1 text-gray-900">{agent.department}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Join Date
              </label>
              <p className="mt-1 text-gray-900">{formatDate(agent.joinDate)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Assigned Debts
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {agent.assignedDebts}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Collected
              </label>
              <p className="mt-1 text-lg font-semibold text-green-600">
                {formatCurrency(agent.totalCollected)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Performance
              </label>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${agent.performance}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {agent.performance}%
                  </span>
                </div>
              </div>
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
