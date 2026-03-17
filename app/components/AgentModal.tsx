// Modal component for adding/editing agents
'use client';

import { useState, useEffect } from 'react';
import { Agent } from '../types/agent';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id' | 'joinDate'>) => void;
  editingAgent?: Agent | null;
}

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  editingAgent,
}: AgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    status: 'active' as Agent['status'],
    assignedDebts: '',
    totalCollected: '',
    performance: '',
  });

  useEffect(() => {
    if (editingAgent) {
      setFormData({
        name: editingAgent.name,
        email: editingAgent.email,
        phone: editingAgent.phone,
        department: editingAgent.department,
        status: editingAgent.status,
        assignedDebts: editingAgent.assignedDebts.toString(),
        totalCollected: editingAgent.totalCollected.toString(),
        performance: editingAgent.performance.toString(),
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        status: 'active',
        assignedDebts: '0',
        totalCollected: '0',
        performance: '0',
      });
    }
  }, [editingAgent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const agentData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      status: formData.status,
      assignedDebts: parseInt(formData.assignedDebts) || 0,
      totalCollected: parseFloat(formData.totalCollected) || 0,
      performance: parseFloat(formData.performance) || 0,
    };

    if (!agentData.name || !agentData.email || !agentData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(agentData);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transform transition-all duration-200 ease-out scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingAgent ? 'Edit Collection Agent' : 'Add New Collection Agent'}
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Define who owns follow-up on recoveries, including performance targets.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Department</option>
                <option value="Collections">Collections</option>
                <option value="Negotiations">Negotiations</option>
                <option value="Legal">Legal</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Agent['status'],
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Assigned Debts
              </label>
              <input
                type="number"
                min="0"
                value={formData.assignedDebts}
                onChange={(e) =>
                  setFormData({ ...formData, assignedDebts: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Total Collected ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalCollected}
                onChange={(e) =>
                  setFormData({ ...formData, totalCollected: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Performance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.performance}
                onChange={(e) =>
                  setFormData({ ...formData, performance: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row-reverse">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white sm:w-auto"
            >
              {editingAgent ? 'Update Agent' : 'Save Agent'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 focus:ring-offset-white sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

