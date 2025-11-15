// Agents management page with table
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { Agent } from '../types/agent';
import { mockAgents } from '../data/mockAgents';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [searchQuery, setSearchQuery] = useState('');

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        agent.department.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

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
  const StatusBadge = ({ status }: { status: Agent['status'] }) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          styles[status]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  // Performance badge
  const PerformanceBadge = ({ performance }: { performance: number }) => {
    const color =
      performance >= 90
        ? 'text-green-600'
        : performance >= 75
        ? 'text-blue-600'
        : 'text-orange-600';
    return (
      <span className={`font-semibold ${color}`}>{performance}%</span>
    );
  };

  const columns = [
    {
      header: 'Name',
      accessor: (agent: Agent) => (
        <div>
          <div className="font-medium text-gray-900">{agent.name}</div>
          <div className="text-sm text-gray-500">{agent.email}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (agent: Agent) => (
        <div className="text-sm">{agent.phone}</div>
      ),
    },
    {
      header: 'Department',
      accessor: (agent: Agent) => (
        <span className="text-sm text-gray-700">{agent.department}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (agent: Agent) => <StatusBadge status={agent.status} />,
    },
    {
      header: 'Assigned Debts',
      accessor: (agent: Agent) => (
        <span className="font-medium">{agent.assignedDebts}</span>
      ),
    },
    {
      header: 'Total Collected',
      accessor: (agent: Agent) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(agent.totalCollected)}
        </span>
      ),
    },
    {
      header: 'Performance',
      accessor: (agent: Agent) => (
        <PerformanceBadge performance={agent.performance} />
      ),
    },
    {
      header: 'Join Date',
      accessor: (agent: Agent) => (
        <span className="text-sm text-gray-600">
          {formatDate(agent.joinDate)}
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
              <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage debt collection agents and their performance
              </p>
            </div>
            <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              + Add Agent
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
          <DataTable
            data={filteredAgents}
            columns={columns}
            searchable
            onSearch={setSearchQuery}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
