// Debts list page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Debt, DebtStatus } from '../types/debt';
import { mockDebts } from '../data/mockDebts';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import DebtList from '../components/DebtList';
import AddDebtModal from '../components/AddDebtModal';

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [user] = useState(getCurrentUser());

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

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
              paidAmount: newStatus === 'paid' ? d.amount : d.paidAmount,
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
              <h1 className="text-3xl font-bold text-gray-900">All Debts</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track all your debts
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

