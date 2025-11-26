// Dashboard page for Debt Management System
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Debt, DebtStatus, getRemainingAmount, isOverdue } from '../types/debt';
import { mockDebts } from '../data/mockDebts';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import StatisticsCard from '../components/StatisticsCard';
import DebtList from '../components/DebtList';
import AddDebtModal from '../components/AddDebtModal';
import StatusPieChart from '../components/StatusPieChart';
import DebtAmountBarChart from '../components/DebtAmountBarChart';
import PriorityBarChart from '../components/PriorityBarChart';

export default function DashboardPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [user, setUser] = useState(getCurrentUser());

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setUser(getCurrentUser());
    }
  }, [router]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalRemaining = debts.reduce(
      (sum, debt) => sum + getRemainingAmount(debt),
      0
    );
    const paidDebts = debts.filter((d) => d.status === 'paid').length;
    const overdueDebts = debts.filter(
      (d) => isOverdue(d) && d.status !== 'paid'
    ).length;
    const pendingDebts = debts.filter((d) => d.status === 'pending').length;

    return {
      totalDebt,
      totalPaid,
      totalRemaining,
      paidDebts,
      overdueDebts,
      pendingDebts,
      totalDebts: debts.length,
    };
  }, [debts]);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'Ksh',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle adding new debt
  const handleAddDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setDebts([...debts, newDebt]);
  };

  // Handle editing debt
  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setIsModalOpen(true);
  };

  // Handle saving edited debt
  const handleSaveDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    if (editingDebt) {
      setDebts(
        debts.map((d) =>
          d.id === editingDebt.id
            ? { ...debtData, id: editingDebt.id, createdAt: editingDebt.createdAt }
            : d
        )
      );
      setEditingDebt(null);
    } else {
      handleAddDebt(debtData);
    }
  };

  // Handle status change
  const handleStatusChange = (debtId: string, newStatus: DebtStatus) => {
    setDebts(
      debts.map((d) =>
        d.id === debtId
          ? {
              ...d,
              status: newStatus,
              // Auto-update paid amount if marked as paid
              paidAmount:
                newStatus === 'paid' ? d.amount : d.paidAmount,
            }
          : d
      )
    );
  };

  // Handle delete debt
  const handleDeleteDebt = (debtId: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      setDebts(debts.filter((d) => d.id !== debtId));
    }
  };

  // Don't render if not authenticated
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
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.name || 'User'} • Overview of your debt management
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsModalOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Add New Debt
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticsCard
            title="Total Debt"
            value={formatCurrency(statistics.totalDebt)}
            subtitle={`${statistics.totalDebts} debts`}
            icon={
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatisticsCard
            title="Total Remaining"
            value={formatCurrency(statistics.totalRemaining)}
            subtitle={`${formatCurrency(statistics.totalPaid)} paid`}
            icon={
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatisticsCard
            title="Pending Debts"
            value={statistics.pendingDebts}
            subtitle="Requires attention"
            icon={
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatisticsCard
            title="Overdue"
            value={statistics.overdueDebts}
            subtitle="Action needed"
            className={statistics.overdueDebts > 0 ? 'border-red-300' : ''}
            icon={
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pie Chart - Status Distribution */}
          <StatusPieChart debts={debts} />

          {/* Bar Chart - Priority */}
          <PriorityBarChart debts={debts} />
        </div>

        {/* Bar Chart - Debt Amounts by Creditor (Full Width) */}
        <div className="mb-8">
          <DebtAmountBarChart debts={debts} />
        </div>

        {/* Debt List */}
        <DebtList
          debts={debts}
          onEdit={handleEditDebt}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteDebt}
        />
        </div>

        {/* Add/Edit Debt Modal */}
        <AddDebtModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDebt(null);
          }}
          onSave={handleSaveDebt}
          editingDebt={editingDebt}
        />
      </div>
    </DashboardLayout>
  );
}

