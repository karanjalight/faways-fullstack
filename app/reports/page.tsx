// Comprehensive Reports page with multiple charts and analytics
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import DashboardLayout from '../components/DashboardLayout';
import StatusPieChart from '../components/StatusPieChart';
import DebtAmountBarChart from '../components/DebtAmountBarChart';
import PriorityBarChart from '../components/PriorityBarChart';
import { mockDebts } from '../data/mockDebts';
import { Debt, getRemainingAmount, isOverdue } from '../types/debt';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const router = useRouter();
  const [debts] = useState<Debt[]>(mockDebts);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate monthly debt trends (last 6 months)
  const monthlyTrends = [
    { month: 'Aug', total: 45000, collected: 12000, remaining: 33000 },
    { month: 'Sep', total: 48000, collected: 15000, remaining: 33000 },
    { month: 'Oct', total: 52000, collected: 18000, remaining: 34000 },
    { month: 'Nov', total: 50000, collected: 20000, remaining: 30000 },
    { month: 'Dec', total: 51000, collected: 22000, remaining: 29000 },
    { month: 'Jan', total: 52000, collected: 25000, remaining: 27000 },
  ];

  // Calculate collection rate by status
  const collectionRate = debts.reduce(
    (acc, debt) => {
      const rate = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0;
      acc.total += rate;
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );
  const avgCollectionRate = collectionRate.count > 0 
    ? collectionRate.total / collectionRate.count 
    : 0;

  // Calculate overdue analysis
  const overdueAnalysis = debts.filter(
    (d) => isOverdue(d) && d.status !== 'paid'
  );
  const overdueTotal = overdueAnalysis.reduce(
    (sum, debt) => sum + getRemainingAmount(debt),
    0
  );

  // Calculate status breakdown
  const statusBreakdown = debts.reduce(
    (acc, debt) => {
      acc[debt.status] = (acc[debt.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
        {/* Page Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive insights into your debt management operations
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-600">
                Average Collection Rate
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {avgCollectionRate.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-600">
                Overdue Debts
              </div>
              <div className="mt-2 text-3xl font-bold text-red-600">
                {overdueAnalysis.length}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {formatCurrency(overdueTotal)} total
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-600">
                Active Debts
              </div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {(statusBreakdown.pending || 0) + (statusBreakdown.negotiating || 0)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-600">
                Paid Off
              </div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {statusBreakdown.paid || 0}
              </div>
            </div>
          </div>

          {/* Monthly Trends Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Monthly Debt Trends (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Debt"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  name="Collected"
                />
                <Area
                  type="monotone"
                  dataKey="remaining"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Remaining"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status and Priority Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatusPieChart debts={debts} />
            <PriorityBarChart debts={debts} />
          </div>

          {/* Debt Amounts by Creditor */}
          <DebtAmountBarChart debts={debts} />

          {/* Collection Performance Over Time */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Collection Performance Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Collected"
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Remaining"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
