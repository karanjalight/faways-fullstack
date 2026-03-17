// Agent add/edit form modal
'use client';

import { useState, useEffect } from 'react';
import { Agent } from '../types/agent';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id' | 'joinDate'>) => void;
  editingAgent?: Agent | null;
}

export default function AgentFormModal({
  isOpen,
  onClose,
  onSave,
  editingAgent,
}: AgentFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Collections',
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
        department: 'Collections',
        status: 'active',
        assignedDebts: '0',
        totalCollected: '0',
        performance: '0',
      });
    }
  }, [editingAgent, isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingAgent ? 'Edit Agent' : 'Add New Agent'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="Collections">Collections</option>
                  <option value="Negotiations">Negotiations</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Agent['status'] })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Assigned Debts
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.assignedDebts}
                  onChange={(e) => setFormData({ ...formData, assignedDebts: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total Collected
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalCollected}
                  onChange={(e) => setFormData({ ...formData, totalCollected: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Performance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.performance}
                  onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {editingAgent ? 'Update Agent' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

