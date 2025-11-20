// Debt list component with filtering and sorting
'use client';

import { useState } from 'react';
import { Debt, DebtStatus } from '../types/debt';
import DebtCard from './DebtCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [serviceLine, setServiceLine] = useState<'all' | string>('all');

  const uniqueServiceLines = Array.from(new Set(debts.map((debt) => debt.serviceLine)));

  const filteredDebts = debts
    .filter((debt) => {
      const matchesStatus = filter === 'all' || debt.status === filter;
      const matchesService =
        serviceLine === 'all' || debt.serviceLine.toLowerCase() === serviceLine.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        debt.creditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.payer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesService && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'date':
        default:
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search client, patient ID, payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 lg:flex lg:flex-1">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as DebtStatus | 'all')}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="negotiating">Negotiating</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={serviceLine}
            onChange={(e) => setServiceLine(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Service Lines</option>
            {uniqueServiceLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'priority')}
            className="col-span-2 h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="priority">Sort by Priority</option>
          </select>
          <Button
            variant="secondary"
            className="col-span-2 h-12 rounded-2xl text-sm font-semibold"
            onClick={() => {
              setFilter('all');
              setSortBy('date');
              setSearchQuery('');
              setServiceLine('all');
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-900">{filteredDebts.length}</span> of{' '}
        {debts.length} open cases
      </div>

      {filteredDebts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
          <p className="text-sm text-slate-500">No cases match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

