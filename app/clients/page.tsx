// Clients management page with table
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { Client } from '../types/client';
import { mockClients } from '../data/mockClients';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.assignedAgent?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Status badge
  const StatusBadge = ({ status }: { status: Client['status'] }) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
      closed: 'bg-green-100 text-green-800',
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

  // Progress bar
  const ProgressBar = ({
    paid,
    total,
  }: {
    paid: number;
    total: number;
  }) => {
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    return (
      <div className="w-24">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{Math.round(percentage)}%</span>
      </div>
    );
  };

  const columns = [
    {
      header: 'Client',
      accessor: (client: Client) => (
        <div>
          <div className="font-medium text-gray-900">{client.name}</div>
          {client.company && (
            <div className="text-sm text-gray-500">{client.company}</div>
          )}
          <div className="text-xs text-gray-400">{client.email}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (client: Client) => (
        <div className="text-sm text-gray-700">{client.phone}</div>
      ),
    },
    {
      header: 'Total Debt',
      accessor: (client: Client) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(client.totalDebt)}
        </span>
      ),
    },
    {
      header: 'Paid / Remaining',
      accessor: (client: Client) => (
        <div>
          <div className="text-sm">
            <span className="font-medium text-green-600">
              {formatCurrency(client.paidAmount)}
            </span>
            {' / '}
            <span className="text-red-600">
              {formatCurrency(client.remainingAmount)}
            </span>
          </div>
          <ProgressBar paid={client.paidAmount} total={client.totalDebt} />
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (client: Client) => <StatusBadge status={client.status} />,
    },
    {
      header: 'Assigned Agent',
      accessor: (client: Client) => (
        <span className="text-sm text-gray-700">
          {client.assignedAgent || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Last Contact',
      accessor: (client: Client) => (
        <span className="text-sm text-gray-600">
          {formatDate(client.lastContact)}
        </span>
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
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage client relationships and debt information
              </p>
            </div>
            <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              + Add Client
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
          <DataTable
            data={filteredClients}
            columns={columns}
            searchable
            onSearch={setSearchQuery}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
