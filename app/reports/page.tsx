// Comprehensive Reports page with multiple charts and analytics
'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatusPieChart from '../components/StatusPieChart';
import DebtAmountBarChart from '../components/DebtAmountBarChart';
import PriorityBarChart from '../components/PriorityBarChart';
import { fetchDebts } from '../lib/debts';
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
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

type MonthlyTrendPoint = {
  month: string;
  total: number;
  collected: number;
  remaining: number;
};

type AgingBucketKey = '0-30' | '31-60' | '61-90' | '90+';

export default function ReportsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDebts();
        setDebts(data);
      } catch (error) {
        console.error('Error loading reports data', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate monthly debt trends (last 6 months) based on real data
  const monthlyTrends: MonthlyTrendPoint[] = useMemo(() => {
    if (debts.length === 0) return [];

    const now = new Date();
    const monthKeys: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      monthKeys.push({ key, label });
    }

    const aggregates: Record<string, { total: number; collected: number }> = {};

    debts.forEach((debt) => {
      const baseDate = debt.serviceDate ?? debt.createdAt ?? debt.dueDate;
      if (!baseDate) return;

      const d = new Date(baseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;

      if (!aggregates[key]) {
        aggregates[key] = { total: 0, collected: 0 };
      }

      aggregates[key].total += debt.amount;
      aggregates[key].collected += debt.paidAmount;
    });

    return monthKeys.map(({ key, label }) => {
      const agg = aggregates[key] ?? { total: 0, collected: 0 };
      const remaining = agg.total - agg.collected;
      return {
        month: label,
        total: agg.total,
        collected: agg.collected,
        remaining: remaining < 0 ? 0 : remaining,
      };
    });
  }, [debts]);

  // Calculate collection rate by status
  const avgCollectionRate = useMemo(() => {
    if (debts.length === 0) return 0;

    const collectionRate = debts.reduce(
      (acc, debt) => {
        const rate = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0;
        acc.total += rate;
        acc.count += 1;
        return acc;
      },
      { total: 0, count: 0 },
    );

    return collectionRate.count > 0 ? collectionRate.total / collectionRate.count : 0;
  }, [debts]);

  // Calculate overdue analysis
  const { overdueAnalysis, overdueTotal } = useMemo(() => {
    const overdue = debts.filter((d) => isOverdue(d) && d.status !== 'paid');
    const total = overdue.reduce((sum, debt) => sum + getRemainingAmount(debt), 0);
    return { overdueAnalysis: overdue, overdueTotal: total };
  }, [debts]);

  // Calculate status breakdown
  const statusBreakdown = useMemo(
    () =>
      debts.reduce(
        (acc, debt) => {
          acc[debt.status] = (acc[debt.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [debts],
  );

  // Aging analysis (only for open / non-paid debts)
  const agingData = useMemo(() => {
    const buckets: Record<AgingBucketKey, { count: number; amount: number }> = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    const today = new Date();

    debts.forEach((debt) => {
      if (debt.status === 'paid') return;
      const due = new Date(debt.dueDate);
      const diffInMs = today.getTime() - due.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      let key: AgingBucketKey;
      if (diffInDays <= 30) key = '0-30';
      else if (diffInDays <= 60) key = '31-60';
      else if (diffInDays <= 90) key = '61-90';
      else key = '90+';

      buckets[key].count += 1;
      buckets[key].amount += getRemainingAmount(debt);
    });

    return (Object.entries(buckets) as [AgingBucketKey, { count: number; amount: number }][])
      .map(([bucket, info]) => ({
        bucket,
        Count: info.count,
        Amount: info.amount,
      }))
      .filter((b) => b.Count > 0 || b.Amount > 0);
  }, [debts]);

  // Owner performance (portfolio by collector/owner)
  const ownerPerformance = useMemo(() => {
    const grouped: Record<
      string,
      { owner: string; total: number; collected: number; remaining: number }
    > = {};

    debts.forEach((debt) => {
      const owner = debt.owner || 'Unassigned';
      if (!grouped[owner]) {
        grouped[owner] = { owner, total: 0, collected: 0, remaining: 0 };
      }

      grouped[owner].total += debt.amount;
      grouped[owner].collected += debt.paidAmount;
      grouped[owner].remaining += getRemainingAmount(debt);
    });

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [debts]);

  // Service line mix
  const serviceLineMix = useMemo(() => {
    const grouped: Record<
      string,
      { serviceLine: string; total: number; count: number }
    > = {};

    debts.forEach((debt) => {
      const key = debt.serviceLine || 'Unspecified';
      if (!grouped[key]) {
        grouped[key] = { serviceLine: key, total: 0, count: 0 };
      }
      grouped[key].total += debt.amount;
      grouped[key].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [debts]);

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
          {isLoading && debts.length === 0 ? (
            <p className="text-sm text-gray-500">Loading reports...</p>
          ) : null}

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
          {monthlyTrends.length > 0 && (
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
          )}

          {/* Status and Priority Charts */}
          {debts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <StatusPieChart debts={debts} />
              <PriorityBarChart debts={debts} />
            </div>
          )}

          {/* Debt Amounts by Creditor */}
          {debts.length > 0 && <DebtAmountBarChart debts={debts} />}

          {/* Collection Performance Over Time */}
          {monthlyTrends.length > 0 && (
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
          )}

          {/* Aging analysis and owner performance */}
          {debts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {agingData.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Aging Analysis (Days Past Due)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number, name) =>
                          name === 'Count' ? value : formatCurrency(value)
                        }
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="Count"
                        fill="#8b5cf6"
                        name="Number of Debts"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="Amount"
                        fill="#f97316"
                        name="Outstanding Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {ownerPerformance.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Collector / Owner Performance (Top 8)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={ownerPerformance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="owner"
                        angle={-30}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar
                        dataKey="total"
                        fill="#3b82f6"
                        name="Total Portfolio"
                      />
                      <Bar
                        dataKey="collected"
                        fill="#22c55e"
                        name="Collected"
                      />
                      <Bar
                        dataKey="remaining"
                        fill="#ef4444"
                        name="Remaining"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Service line mix */}
          {serviceLineMix.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Service Line Mix
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={serviceLineMix}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="serviceLine"
                    angle={-45}
                    textAnchor="end"
                    height={90}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#0ea5e9" name="Total Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
