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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transform transition-all duration-200 ease-out scale-100">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingInsurance ? 'Edit Insurance Contact' : 'Add New Insurance Contact'}
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Capture key details about your insurance partner for quick access later.
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">
                  Insurance Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Global Insurance Group"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Full name"
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    placeholder="contact@insurer.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, policyNumber: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. POL-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-800">
                    Coverage Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.coverageType}
                    onChange={(e) =>
                      setFormData({ ...formData, coverageType: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select coverage type</option>
                    <option value="Professional Liability">Professional Liability</option>
                    <option value="General Liability">General Liability</option>
                    <option value="Cyber Liability">Cyber Liability</option>
                    <option value="Errors & Omissions">Errors & Omissions</option>
                    <option value="Workers Compensation">Workers Compensation</option>
                    <option value="Property Insurance">Property Insurance</option>
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
                        status: e.target.value as InsuranceContact['status'],
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used to surface expiring policies on the main insurance table.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">
                  Notes
                </label>
                <textarea
                  rows={5}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Add any specific coverage terms, escalation contacts, or renewal reminders..."
                />
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-600">
                  Tip: Keep one contact per policy so you always know who to call when
                  there is a claim or dispute.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row-reverse">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white sm:w-auto"
            >
              {editingInsurance ? 'Update Insurance' : 'Save Insurance Contact'}
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

