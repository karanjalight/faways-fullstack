// Debt list component with filtering and sorting
'use client';

import { useState } from 'react';
import { Debt, DebtStatus } from '../types/debt';
import DebtCard from './DebtCard';

interface DebtListProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onStatusChange: (debtId: string, newStatus: DebtStatus) => void;
  onDelete?: (debtId: string) => void;
}

export default function DebtList({
  debts,
  onEdit,
  onStatusChange,
  onDelete,
}: DebtListProps) {
  const [filter, setFilter] = useState<DebtStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'priority'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter debts based on status and search query
  const filteredDebts = debts
    .filter((debt) => {
      const matchesStatus = filter === 'all' || debt.status === filter;
      const matchesSearch =
        searchQuery === '' ||
        debt.creditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'date':
        default:
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by creditor or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Status filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DebtStatus | 'all')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="negotiating">Negotiating</option>
          <option value="paid">Paid</option>
        </select>

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'date' | 'amount' | 'priority')
          }
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="priority">Sort by Priority</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDebts.length} of {debts.length} debts
      </div>

      {/* Debt cards grid */}
      {filteredDebts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">No debts found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

