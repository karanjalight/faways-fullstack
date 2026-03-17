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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transform transition-all duration-200 ease-out scale-100">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Insurance Contact Details
              </h2>
              <p className="mt-1 text-xs text-slate-200/80">
                Full snapshot of this insurer, ready for quick action.
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
          <div className="flex flex-col gap-4 pb-6 border-b border-slate-200 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 shadow-inner">
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  {insurance.company}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[insurance.status]
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {insurance.status.charAt(0).toUpperCase() +
                    insurance.status.slice(1)}
                </span>
              </div>
              {insurance.policyNumber && (
                <p className="mt-1 text-sm text-slate-500">
                  Policy <span className="font-medium text-slate-700">#{insurance.policyNumber}</span>
                </p>
              )}
              {expiryStatus && (
                <p className={`mt-2 text-xs font-medium ${expiryStatus.color}`}>
                  {expiryStatus.text}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Primary Contact
              </h4>
              <span className="text-[11px] font-medium text-slate-500">
                Used for escalations and claims
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <span className="text-xs text-slate-500">Contact Person</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {insurance.contactPerson}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Email</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900 break-all">
                  {insurance.email}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Phone</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {insurance.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Coverage
              </label>
              <p className="text-sm text-slate-900">{insurance.coverageType}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expiry
              </label>
              <p className={`text-sm font-medium ${expiryStatus?.color || 'text-slate-900'}`}>
                {expiryStatus?.text || 'Not set'}
              </p>
            </div>

            {insurance.notes && (
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Internal Notes
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-900 whitespace-pre-line">
                    {insurance.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
          <button
            onClick={onDelete}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 focus:ring-offset-white"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8l-1-2.5A2 2 0 0013.236 3H10.764a2 2 0 00-1.894 1.5L7 7"
              />
            </svg>
            Delete
          </button>
          <button
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white"
          >
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L13 14l-4 1 1-4 8.5-8.5z"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
