// Modal component for adding/editing clients
'use client';

import { useState, useEffect } from 'react';
import type { Client, RecoveryCommissionType } from '../types/client';
import { fetchAgents } from '../../lib/agents';
import type { Agent } from '../types/agent';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  editingClient?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  editingClient,
}: ClientModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    totalDebt: '',
    paidAmount: '',
    status: 'active' as Client['status'],
    assignedAgent: '',
    recoveryCommissionType: 'percent' as RecoveryCommissionType,
    recoveryCommissionPercent: '',
    recoveryCommissionFlat: '',
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone,
        company: editingClient.company || '',
        totalDebt: editingClient.totalDebt.toString(),
        paidAmount: editingClient.paidAmount.toString(),
        status: editingClient.status,
        assignedAgent: editingClient.assignedAgent || '',
        recoveryCommissionType: editingClient.recoveryCommissionType ?? 'percent',
        recoveryCommissionPercent:
          editingClient.recoveryCommissionPercent != null
            ? String(editingClient.recoveryCommissionPercent)
            : '',
        recoveryCommissionFlat:
          editingClient.recoveryCommissionFlat != null
            ? String(editingClient.recoveryCommissionFlat)
            : '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        totalDebt: '0',
        paidAmount: '0',
        status: 'active',
        assignedAgent: '',
        recoveryCommissionType: 'percent',
        recoveryCommissionPercent: '',
        recoveryCommissionFlat: '',
      });
    }
  }, [editingClient, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const data = await fetchAgents();
        setAgents(data.filter((agent) => agent.status === 'active'));
      } catch (error) {
        console.error(error);
        setAgents([]);
      } finally {
        setIsLoadingAgents(false);
      }
    };
    loadAgents();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pct =
      formData.recoveryCommissionType === 'percent'
        ? parseFloat(formData.recoveryCommissionPercent)
        : NaN;
    const flat =
      formData.recoveryCommissionType === 'flat'
        ? parseFloat(formData.recoveryCommissionFlat)
        : NaN;

    if (formData.recoveryCommissionType === 'percent' && formData.recoveryCommissionPercent.trim()) {
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        alert('Commission percent must be between 0 and 100.');
        return;
      }
    }
    if (formData.recoveryCommissionType === 'flat' && formData.recoveryCommissionFlat.trim()) {
      if (Number.isNaN(flat) || flat < 0) {
        alert('Flat commission must be zero or a positive amount.');
        return;
      }
    }

    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company || undefined,
      totalDebt: parseFloat(formData.totalDebt) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      remainingAmount:
        parseFloat(formData.totalDebt) - parseFloat(formData.paidAmount) || 0,
      status: formData.status,
      assignedAgent: formData.assignedAgent || undefined,
      lastContact: new Date().toISOString().split('T')[0],
      recoveryCommissionType: formData.recoveryCommissionType,
      recoveryCommissionPercent:
        formData.recoveryCommissionType === 'percent'
          ? formData.recoveryCommissionPercent.trim()
            ? pct
            : null
          : null,
      recoveryCommissionFlat:
        formData.recoveryCommissionType === 'flat'
          ? formData.recoveryCommissionFlat.trim()
            ? flat
            : null
          : null,
    };

    if (!clientData.name || !clientData.email || !clientData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (clientData.paidAmount > clientData.totalDebt) {
      alert('Paid amount cannot exceed total debt');
      return;
    }

    onSave(clientData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transform transition-all duration-200 ease-out scale-100">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Capture the client contact and exposure details for better portfolio tracking.
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
                placeholder="client@example.com"
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
                placeholder="+254 700 000 000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Company (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Company or facility name"
              />
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
                    status: e.target.value as Client['status'],
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Assigned Agent
              </label>
              <select
                value={formData.assignedAgent}
                onChange={(e) =>
                  setFormData({ ...formData, assignedAgent: e.target.value })
                }
                disabled={isLoadingAgents}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  {isLoadingAgents ? 'Loading agents...' : 'Unassigned'}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Recovery commission (all debts for this client)
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Applied to each recorded collection on debts linked to this client. Used on the
                Invoice page to track your fees.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Basis</label>
                  <select
                    value={formData.recoveryCommissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recoveryCommissionType: e.target.value as RecoveryCommissionType,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="percent">% of amount recovered</option>
                    <option value="flat">Flat per collection</option>
                  </select>
                </div>
                {formData.recoveryCommissionType === 'percent' ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Percent (0–100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={formData.recoveryCommissionPercent}
                      onChange={(e) =>
                        setFormData({ ...formData, recoveryCommissionPercent: e.target.value })
                      }
                      placeholder="e.g. 15"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Flat (KES per collection)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={formData.recoveryCommissionFlat}
                      onChange={(e) =>
                        setFormData({ ...formData, recoveryCommissionFlat: e.target.value })
                      }
                      placeholder="e.g. 2500"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Total Debt ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalDebt}
                onChange={(e) =>
                  setFormData({ ...formData, totalDebt: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Paid Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) =>
                  setFormData({ ...formData, paidAmount: e.target.value })
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
              {editingClient ? 'Update Client' : 'Save Client'}
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

