// Clients management page with table
"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import DataTable from "../components/DataTable";
import ClientModal from "../components/ClientModal";
import ClientDetailModal from "../components/ClientDetailModal";
import { Client } from "../types/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchClients, createClientApi, updateClientApi } from "../lib/clients";
import { fetchDebts } from "../lib/debts";
import { useRouter } from "next/navigation";
import type { Debt } from "../types/debt";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [creationCredentials, setCreationCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchClients();
        const debtData = await fetchDebts();
        setDebts(debtData);
        setClients(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const clientsWithLiveBalances = useMemo(() => {
    const totalsByClientId = debts.reduce<
      Record<string, { totalDebt: number; paidAmount: number }>
    >((acc, debt) => {
      if (!debt.clientId) return acc;
      if (!acc[debt.clientId]) {
        acc[debt.clientId] = { totalDebt: 0, paidAmount: 0 };
      }
      acc[debt.clientId].totalDebt += debt.amount;
      acc[debt.clientId].paidAmount += debt.paidAmount;
      return acc;
    }, {});

    return clients.map((client) => {
      const totals = totalsByClientId[client.id];
      if (!totals) {
        return {
          ...client,
          totalDebt: 0,
          paidAmount: 0,
          remainingAmount: 0,
        };
      }
      return {
        ...client,
        totalDebt: totals.totalDebt,
        paidAmount: totals.paidAmount,
        remainingAmount: totals.totalDebt - totals.paidAmount,
      };
    });
  }, [clients, debts]);

  // Authentication is handled globally in DashboardLayout via Supabase

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clientsWithLiveBalances;
    const query = searchQuery.toLowerCase();
    return clientsWithLiveBalances.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.assignedAgent?.toLowerCase().includes(query)
    );
  }, [clientsWithLiveBalances, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const metrics = useMemo(() => {
    const totalClients = clientsWithLiveBalances.length;
    const totalExposure = clientsWithLiveBalances.reduce(
      (sum, client) => sum + client.totalDebt,
      0,
    );
    const collected = clientsWithLiveBalances.reduce(
      (sum, client) => sum + client.paidAmount,
      0,
    );
    const remaining = clientsWithLiveBalances.reduce(
      (sum, client) => sum + client.remainingAmount,
      0,
    );
    const activeCount = clientsWithLiveBalances.filter(
      (client) => client.status === "active",
    ).length;
    const inactiveCount = clientsWithLiveBalances.filter(
      (client) => client.status === "inactive",
    ).length;

    return {
      totalClients,
      totalExposure,
      collected,
      remaining,
      activeCount,
      inactiveCount,
    };
  }, [clientsWithLiveBalances]);

  // Status badge
  const StatusBadge = ({ status }: { status: Client["status"] }) => {
    const styles = {
      active: "bg-blue-100 text-blue-800",
      inactive: "bg-gray-100 text-gray-800",
      closed: "bg-green-100 text-green-800",
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

  // Handle view details
  const handleViewDetails = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Handle save
  const handleSave = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      try {
        const updated = await updateClientApi(editingClient.id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          region: clientData.company,
          status: clientData.status,
          recoveryCommissionType: clientData.recoveryCommissionType,
          recoveryCommissionPercent: clientData.recoveryCommissionPercent,
          recoveryCommissionFlat: clientData.recoveryCommissionFlat,
        });
        const live = debts
          .filter((d) => d.clientId === editingClient.id)
          .reduce(
            (acc, d) => ({
              totalDebt: acc.totalDebt + d.amount,
              paidAmount: acc.paidAmount + d.paidAmount,
            }),
            { totalDebt: 0, paidAmount: 0 },
          );
        setClients((prev) =>
          prev.map((c) =>
            c.id === editingClient.id
              ? {
                  ...updated,
                  totalDebt: live.totalDebt,
                  paidAmount: live.paidAmount,
                  remainingAmount: live.totalDebt - live.paidAmount,
                }
              : c,
          ),
        );
        setEditingClient(null);
      } catch (error) {
        console.error(error);
        alert((error as Error).message);
      }
    } else {
      try {
        const { client, credentials } = await createClientApi({
          clientName: clientData.name,
          contactName: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          region: clientData.company,
          recoveryCommissionType: clientData.recoveryCommissionType,
          recoveryCommissionPercent: clientData.recoveryCommissionPercent,
          recoveryCommissionFlat: clientData.recoveryCommissionFlat,
        });
        setClients((prev) => [client, ...prev]);
        setCreationCredentials(credentials);
      } catch (error) {
        console.error(error);
        alert((error as Error).message);
      }
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedClient && confirm('Are you sure you want to delete this client?')) {
      // Local-only delete for now; can be wired to an API later
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setIsDetailModalOpen(false);
      setSelectedClient(null);
    }
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
    {
      header: 'Actions',
      accessor: (client: Client) => (
        <button
          onClick={() => handleViewDetails(client)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-transparent bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-900">
              Client dashboard
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Clients & Relationships
            </h1>
            <p className="text-sm text-blue-900">
              {metrics.totalClients} active client profiles curated for your
              debt collection workflows.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="rounded-2xl bg-blue-800 px-6"
              onClick={handleAddNew}
            >
              + Add Client
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Total Clients</CardDescription>
              <CardTitle className="text-2xl">
                {metrics.totalClients.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Total Exposure</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(metrics.totalExposure)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Remaining Balance</CardDescription>
              <CardTitle className="text-2xl text-rose-600">
                {formatCurrency(metrics.remaining)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardDescription>Active / Inactive</CardDescription>
              <CardTitle className="text-2xl">
                {metrics.activeCount}{' '}
                <span className="text-sm font-normal text-blue-900">
                  active
                </span>
                {'  '}· {metrics.inactiveCount}{' '}
                <span className="text-sm font-normal text-blue-900">
                  inactive
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="rounded-3xl border-none bg-white shadow-lg shadow-slate-100/70">
            <CardHeader>
              <CardTitle className="text-lg">Client Overview</CardTitle>
              <CardDescription>
                Search, filter and manage client accounts and their debt
                exposure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-blue-900">Loading clients...</p>
              ) : (
                <DataTable
                  data={filteredClients}
                  columns={columns}
                  searchable
                  onSearch={setSearchQuery}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <ClientModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSave}
          editingClient={editingClient}
        />

        {creationCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Client account created
                </h2>
                <p className="mt-1 text-xs text-slate-200/80">
                  Share these credentials securely with your client. They have been
                  provisioned with a <span className="font-semibold">client</span> role.
                </p>
              </div>
              <div className="space-y-4 px-6 py-5 text-sm">
                <div className="grid gap-3 sm:grid-cols-1">
                  <div>
                    <p className="text-blue-900">Login email</p>
                    <p className="break-all font-mono text-xs text-slate-900">
                      {creationCredentials.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-900">Temporary password</p>
                    <p className="font-mono text-xs text-slate-900">
                      {creationCredentials.password}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
                  Ask the client to log in and change this password on first access. The
                  password will only be shown once in this dialog.
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row-reverse">
                <button
                  className="inline-flex w-20 items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white sm:w-auto"
                  onClick={async () => {
                    const message = `Welcome to Faways portal.\n\nLogin email: ${creationCredentials.email}\nTemporary password: ${creationCredentials.password}\n\nPlease log in and update your password.`;
                    try {
                      await navigator.clipboard.writeText(message);
                      alert("Message copied to clipboard.");
                    } catch {
                      alert("Unable to copy. Please copy manually.");
                    }
                  }}
                >
                  Copy 
                </button>
                <button
                  className="inline-flex w-40 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 focus:ring-offset-white sm:w-auto"
                  onClick={() => {
                    if (!creationCredentials) return;
                    const content = `Client login credentials\n\nEmail: ${creationCredentials.email}\nTemporary password: ${creationCredentials.password}\n\nPlease change your password after first login.`;
                    try {
                      const blob = new Blob([content], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "client-credentials.txt";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch {
                      alert("Unable to start download. Please try again.");
                    }
                  }}
                >
                  Download
                </button>
                <button
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setCreationCredentials(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <ClientDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          onEdit={() => selectedClient && handleEdit(selectedClient)}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
