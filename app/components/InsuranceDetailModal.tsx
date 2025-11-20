// Detail view modal for insurance contacts
'use client';

import { InsuranceContact } from '../types/insurance';

interface InsuranceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  insurance: InsuranceContact | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function InsuranceDetailModal({
  isOpen,
  onClose,
  insurance,
  onEdit,
  onDelete,
}: InsuranceDetailModalProps) {
  if (!isOpen || !insurance) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const getExpiryStatus = () => {
    if (!insurance.expiryDate) return null;
    const expiry = new Date(insurance.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { text: 'Expired', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: 'text-yellow-600',
      };
    }
    return { text: formatDate(insurance.expiryDate), color: 'text-gray-600' };
  };

  const expiryStatus = getExpiryStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Insurance Contact Details
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
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {insurance.company}
              </h3>
              {insurance.policyNumber && (
                <p className="text-sm text-gray-500">
                  Policy: {insurance.policyNumber}
                </p>
              )}
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[insurance.status]
                }`}
              >
                {insurance.status.charAt(0).toUpperCase() +
                  insurance.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Contact Information
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Contact Person:</span>
                <p className="font-medium text-gray-900">
                  {insurance.contactPerson}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium text-gray-900">{insurance.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium text-gray-900">{insurance.phone}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Coverage Type
              </label>
              <p className="mt-1 text-gray-900">{insurance.coverageType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Expiry Date
              </label>
              <p className={`mt-1 font-medium ${expiryStatus?.color || 'text-gray-900'}`}>
                {expiryStatus?.text || 'Not set'}
              </p>
            </div>

            {insurance.notes && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <p className="mt-1 text-gray-900">{insurance.notes}</p>
              </div>
            )}
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
