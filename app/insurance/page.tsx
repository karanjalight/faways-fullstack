// Insurance contacts page with table
'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import InsuranceModal from '../components/InsuranceModal';
import InsuranceDetailModal from '../components/InsuranceDetailModal';
import { InsuranceContact } from '../types/insurance';
import { mockInsurance } from '../data/mockInsurance';
import {
  fetchInsuranceContacts,
  createInsuranceContact,
  updateInsuranceContact,
  deleteInsuranceContact,
} from '../lib/insurance';

export default function InsurancePage() {
  const [insurance, setInsurance] = useState<InsuranceContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceContact | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initial load from Supabase, with mock fallback if table is empty
  useEffect(() => {
    const load = async () => {
      try {
        setLoadError(null);
        const data = await fetchInsuranceContacts();
        if (data.length === 0) {
          // Seed UI with mock data when no records exist in DB yet
          setInsurance(mockInsurance);
        } else {
          setInsurance(data);
        }
      } catch (err) {
        console.error(err);
        setLoadError('Failed to load insurance contacts.');
        // Keep showing mock data so the page is still usable
        setInsurance(mockInsurance);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Authentication is handled globally in DashboardLayout via Supabase

  // Filter insurance based on search
  const filteredInsurance = useMemo(() => {
    if (!searchQuery) return insurance;
    const query = searchQuery.toLowerCase();
    return insurance.filter(
      (item) =>
        item.company.toLowerCase().includes(query) ||
        item.contactPerson.toLowerCase().includes(query) ||
        item.coverageType.toLowerCase().includes(query) ||
        item.policyNumber?.toLowerCase().includes(query)
    );
  }, [insurance, searchQuery]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Status badge
  const StatusBadge = ({ status }: { status: InsuranceContact['status'] }) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          styles[status]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Check if expired or expiring soon
  const getExpiryStatus = (expiryDate?: string, status?: string) => {
    if (!expiryDate || status === 'expired') return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return <span className="text-xs text-red-600">Expired</span>;
    } else if (daysUntilExpiry <= 30) {
      return (
        <span className="text-xs text-yellow-600">
          Expires in {daysUntilExpiry} days
        </span>
      );
    }
    return <span className="text-xs text-gray-500">{formatDate(expiryDate)}</span>;
  };

  // Handle view details
  const handleViewDetails = (item: InsuranceContact) => {
    setSelectedInsurance(item);
    setIsDetailModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingInsurance(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (item: InsuranceContact) => {
    setEditingInsurance(item);
    setIsModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Handle save
  const handleSave = async (insuranceData: Omit<InsuranceContact, 'id'>) => {
    try {
      if (editingInsurance) {
        const updated = await updateInsuranceContact(
          editingInsurance.id,
          insuranceData,
        );
        setInsurance((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i)),
        );
        setEditingInsurance(null);
      } else {
        const created = await createInsuranceContact(insuranceData);
        setInsurance((prev) => [...prev, created]);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save insurance contact. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (
      selectedInsurance &&
      confirm('Are you sure you want to delete this insurance contact?')
    ) {
      const toDelete = selectedInsurance;
      setInsurance((current) =>
        current.filter((i) => i.id !== toDelete.id),
      );
      setIsDetailModalOpen(false);
      setSelectedInsurance(null);

      deleteInsuranceContact(toDelete.id).catch((error) => {
        console.error(error);
        alert('Failed to delete insurance contact from the server.');
        // Best-effort: re-load from server to resync
        fetchInsuranceContacts()
          .then((data) => setInsurance(data))
          .catch((err) => console.error(err));
      });
    }
  };

  const columns = [
    {
      header: 'Insurance Company',
      accessor: (item: InsuranceContact) => (
        <div>
          <div className="font-medium text-gray-900">{item.company}</div>
          {item.policyNumber && (
            <div className="text-xs text-gray-500">Policy: {item.policyNumber}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (item: InsuranceContact) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.contactPerson}
          </div>
          <div className="text-xs text-gray-500">{item.email}</div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (item: InsuranceContact) => (
        <div className="text-sm text-gray-700">{item.phone}</div>
      ),
    },
    {
      header: 'Coverage Type',
      accessor: (item: InsuranceContact) => (
        <span className="text-sm text-gray-700">{item.coverageType}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: InsuranceContact) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Expiry Date',
      accessor: (item: InsuranceContact) => (
        <div>
          {getExpiryStatus(item.expiryDate, item.status) || (
            <span className="text-sm text-gray-500">N/A</span>
          )}
        </div>
      ),
    },
    {
      header: 'Notes',
      accessor: (item: InsuranceContact) => (
        <div className="max-w-xs text-xs text-gray-600">
          {item.notes || '-'}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (item: InsuranceContact) => (
        <button
          onClick={() => handleViewDetails(item)}
          className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
        {/* Page Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insurance</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage insurance contacts and policy information
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Add Insurance Contact
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading insurance contacts...</p>
          ) : (
            <>
              {loadError && (
                <p className="mb-4 text-sm text-red-600">{loadError}</p>
              )}
              <DataTable
                data={filteredInsurance}
                columns={columns}
                searchable
                onSearch={setSearchQuery}
              />
            </>
          )}
        </div>

        {/* Modals */}
        <InsuranceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingInsurance(null);
          }}
          onSave={handleSave}
          editingInsurance={editingInsurance}
        />

        <InsuranceDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInsurance(null);
          }}
          insurance={selectedInsurance}
          onEdit={() => selectedInsurance && handleEdit(selectedInsurance)}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}

