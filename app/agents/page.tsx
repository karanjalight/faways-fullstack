// Agents management page with table
'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import AgentModal from '../components/AgentModal';
import AgentDetailModal from '../components/AgentDetailModal';
import { Agent } from '../types/agent';
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../../lib/agents';
import { Button } from '@/components/ui/button';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAgents();
        setAgents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  // Handle view details
  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Handle save
  const handleSave = async (agentData: Omit<Agent, 'id' | 'joinDate'>) => {
    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, agentData);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === editingAgent.id
              ? { ...agentData, id: editingAgent.id, joinDate: editingAgent.joinDate }
              : a
          )
        );
        setEditingAgent(null);
      } else {
        const created = await createAgent(agentData);
        setAgents((prev) => [created, ...prev]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedAgent) return;
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await deleteAgent(selectedAgent.id);
      setAgents((prev) => prev.filter((a) => a.id !== selectedAgent.id));
      setIsDetailModalOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error(error);
    }
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
    {
      header: 'Actions',
      accessor: (agent: Agent) => (
        <button
          onClick={() => handleViewDetails(agent)}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
              <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage debt collection agents and their performance
              </p>
            </div>
            <Button
              onClick={handleAddNew}
              className="rounded-2xl bg-blue-800 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-900"
            >
              + Add Agent
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading agents...</p>
          ) : (
            <DataTable
              data={filteredAgents}
              columns={columns}
              searchable
              onSearch={setSearchQuery}
            />
          )}
        </div>

        {/* Modals */}
        <AgentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAgent(null);
          }}
          onSave={handleSave}
          editingAgent={editingAgent}
        />

        <AgentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          onEdit={() => selectedAgent && handleEdit(selectedAgent)}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
