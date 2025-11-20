// Modal component for adding/editing insurance contacts
'use client';

import { useState, useEffect } from 'react';
import { InsuranceContact } from '../types/insurance';

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (insurance: Omit<InsuranceContact, 'id'>) => void;
  editingInsurance?: InsuranceContact | null;
}

export default function InsuranceModal({
  isOpen,
  onClose,
  onSave,
  editingInsurance,
}: InsuranceModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    policyNumber: '',
    coverageType: '',
    status: 'active' as InsuranceContact['status'],
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    if (editingInsurance) {
      setFormData({
        company: editingInsurance.company,
        contactPerson: editingInsurance.contactPerson,
        email: editingInsurance.email,
        phone: editingInsurance.phone,
        policyNumber: editingInsurance.policyNumber || '',
        coverageType: editingInsurance.coverageType,
        status: editingInsurance.status,
        expiryDate: editingInsurance.expiryDate || '',
        notes: editingInsurance.notes || '',
      });
    } else {
      setFormData({
        company: '',
        contactPerson: '',
        email: '',
        phone: '',
        policyNumber: '',
        coverageType: '',
        status: 'active',
        expiryDate: '',
        notes: '',
      });
    }
  }, [editingInsurance, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const insuranceData = {
      company: formData.company,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      policyNumber: formData.policyNumber || undefined,
      coverageType: formData.coverageType,
      status: formData.status,
      expiryDate: formData.expiryDate || undefined,
      notes: formData.notes || undefined,
    };

    if (
      !insuranceData.company ||
      !insuranceData.contactPerson ||
      !insuranceData.email ||
      !insuranceData.phone ||
      !insuranceData.coverageType
    ) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(insuranceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingInsurance ? 'Edit Insurance Contact' : 'Add New Insurance Contact'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Insurance Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Number
              </label>
              <input
                type="text"
                value={formData.policyNumber}
                onChange={(e) =>
                  setFormData({ ...formData, policyNumber: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Coverage Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.coverageType}
                onChange={(e) =>
                  setFormData({ ...formData, coverageType: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select Coverage Type</option>
                <option value="Professional Liability">Professional Liability</option>
                <option value="General Liability">General Liability</option>
                <option value="Cyber Liability">Cyber Liability</option>
                <option value="Errors & Omissions">Errors & Omissions</option>
                <option value="Workers Compensation">Workers Compensation</option>
                <option value="Property Insurance">Property Insurance</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as InsuranceContact['status'],
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Additional notes about this insurance contact..."
              />
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
              {editingInsurance ? 'Update Insurance' : 'Add Insurance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

