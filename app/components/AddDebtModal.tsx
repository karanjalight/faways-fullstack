// Modal component for adding/editing debts
'use client';

import { useState, useEffect } from 'react';
import { Debt, DebtStatus } from '../types/debt';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  editingDebt?: Debt | null;
}

export default function AddDebtModal({
  isOpen,
  onClose,
  onSave,
  editingDebt,
}: AddDebtModalProps) {
  const [formData, setFormData] = useState({
    creditor: '',
    amount: '',
    paidAmount: '',
    dueDate: '',
    status: 'pending' as DebtStatus,
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Populate form when editing
  useEffect(() => {
    if (editingDebt) {
      setFormData({
        creditor: editingDebt.creditor,
        amount: editingDebt.amount.toString(),
        paidAmount: editingDebt.paidAmount.toString(),
        dueDate: editingDebt.dueDate,
        status: editingDebt.status,
        description: editingDebt.description || '',
        priority: editingDebt.priority,
      });
    } else {
      // Reset form for new debt
      setFormData({
        creditor: '',
        amount: '',
        paidAmount: '',
        dueDate: '',
        status: 'pending',
        description: '',
        priority: 'medium',
      });
    }
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const debtData = {
      creditor: formData.creditor,
      amount: parseFloat(formData.amount),
      paidAmount: parseFloat(formData.paidAmount) || 0,
      dueDate: formData.dueDate,
      status: formData.status,
      description: formData.description,
      priority: formData.priority,
    };

    // Validation
    if (!debtData.creditor || !debtData.amount || !debtData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (debtData.paidAmount > debtData.amount) {
      alert('Paid amount cannot exceed total amount');
      return;
    }

    onSave(debtData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingDebt ? 'Edit Debt' : 'Add New Debt'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Creditor */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Creditor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.creditor}
                onChange={(e) =>
                  setFormData({ ...formData, creditor: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., Credit Card Company"
              />
            </div>

            {/* Amount and Paid Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Paid Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paidAmount: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as DebtStatus,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Add any notes about this debt..."
              />
            </div>
          </div>

          {/* Actions */}
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
              {editingDebt ? 'Update Debt' : 'Add Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

