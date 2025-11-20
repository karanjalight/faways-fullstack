// Insurance contacts page with table
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import InsuranceModal from '../components/InsuranceModal';
import InsuranceDetailModal from '../components/InsuranceDetailModal';
import { InsuranceContact } from '../types/insurance';
import { mockInsurance } from '../data/mockInsurance';

export default function InsurancePage() {
  const router = useRouter();
  const [insurance, setInsurance] = useState<InsuranceContact[]>(mockInsurance);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceContact | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceContact | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

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
  const handleSave = (insuranceData: Omit<InsuranceContact, 'id'>) => {
    if (editingInsurance) {
      setInsurance(
        insurance.map((i) =>
          i.id === editingInsurance.id
            ? { ...insuranceData, id: editingInsurance.id }
            : i
        )
      );
      setEditingInsurance(null);
    } else {
      const newInsurance: InsuranceContact = {
        ...insuranceData,
        id: Date.now().toString(),
      };
      setInsurance([...insurance, newInsurance]);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedInsurance && confirm('Are you sure you want to delete this insurance contact?')) {
      setInsurance(insurance.filter((i) => i.id !== selectedInsurance.id));
      setIsDetailModalOpen(false);
      setSelectedInsurance(null);
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
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          View
        </button>
      ),
    },
  ];

  if (!isAuthenticated()) {
    return null;
  }

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
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Add Insurance Contact
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
          <DataTable
            data={filteredInsurance}
            columns={columns}
            searchable
            onSearch={setSearchQuery}
          />
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

