'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import StatusPieChart from '../components/StatusPieChart';
import DebtAmountBarChart from '../components/DebtAmountBarChart';
import PriorityBarChart from '../components/PriorityBarChart';
import { fetchDebts } from '../lib/debts';
import type { Debt } from '../types/debt';
import { getRemainingAmount, isOverdue } from '../types/debt';
import {
  buildAgingBuckets,
  buildMonthlyTrends,
  buildOwnerPerformance,
  buildPortfolioSummary,
  buildServiceLineMix,
} from '../lib/reportsMetrics';
import { formatKes, kesAxisTick } from '@/lib/format-kes';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RotateCw } from 'lucide-react';
import {
  commissionForRow,
  fetchCollectionsForInvoice,
  type CollectionInvoiceRow,
} from '../lib/commissions';
import { listCommissionInvoices } from '../lib/commissionInvoices';
import type { CommissionInvoiceSummary } from '../types/commissionInvoice';
import { fetchClients } from '../lib/clients';
import type { Client } from '../types/client';

const TAB_IDS = ['overview', 'trends', 'portfolio', 'risk', 'revenue'] as const;
type ReportTabId = (typeof TAB_IDS)[number];

function isReportTab(s: string | null): s is ReportTabId {
  return s !== null && TAB_IDS.includes(s as ReportTabId);
}

function MetricCard({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardDescription className="text-xs font-medium">{label}</CardDescription>
        <CardTitle className={['text-xl font-bold tabular-nums sm:text-2xl', valueClassName].filter(Boolean).join(' ')}>
          {value}
        </CardTitle>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6 px-1">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

function buildCollectionMonthlySeries(
  rows: CollectionInvoiceRow[],
  clientsById: Map<string, Client>,
  monthsBack = 6,
) {
  const now = new Date();
  const monthKeys: { key: string; label: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('en-KE', { month: 'short' });
    monthKeys.push({ key, label });
  }

  const agg: Record<string, { recovered: number; commission: number; count: number }> = {};
  rows.forEach((row) => {
    const key = row.collectionDate.slice(0, 7);
    if (!agg[key]) agg[key] = { recovered: 0, commission: 0, count: 0 };
    agg[key].recovered += row.amount;
    agg[key].commission += commissionForRow(row, clientsById);
    agg[key].count += 1;
  });

  return monthKeys.map(({ key, label }) => ({
    month: label,
    recovered: agg[key]?.recovered ?? 0,
    commission: agg[key]?.commission ?? 0,
    count: agg[key]?.count ?? 0,
  }));
}

function buildTopClientsByCommission(
  rows: CollectionInvoiceRow[],
  clientsById: Map<string, Client>,
  limit = 8,
) {
  const byClient: Record<string, { name: string; commission: number; recovered: number }> = {};
  rows.forEach((row) => {
    const id = row.clientId ?? '__none__';
    const name = row.clientId ? clientsById.get(row.clientId)?.name ?? 'Unknown client' : 'No client';
    if (!byClient[id]) byClient[id] = { name, commission: 0, recovered: 0 };
    byClient[id].commission += commissionForRow(row, clientsById);
    byClient[id].recovered += row.amount;
  });
  return Object.values(byClient)
    .sort((a, b) => b.commission - a.commission)
    .slice(0, limit);
}

function ReportsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab: ReportTabId = isReportTab(tabFromUrl) ? tabFromUrl : 'overview';

  const setTab = useCallback(
    (value: string) => {
      const v = isReportTab(value) ? value : 'overview';
      const params = new URLSearchParams(searchParams.toString());
      if (v === 'overview') params.delete('tab');
      else params.set('tab', v);
      const q = params.toString();
      router.replace(q ? `/reports?${q}` : '/reports', { scroll: false });
    },
    [router, searchParams],
  );

  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsError, setDebtsError] = useState<string | null>(null);
  const [collectionRows, setCollectionRows] = useState<CollectionInvoiceRow[]>([]);
  const [commissionInvoices, setCommissionInvoices] = useState<CommissionInvoiceSummary[]>([]);
  const [reportClients, setReportClients] = useState<Client[]>([]);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setDebtsError(null);
    setRevenueError(null);
    try {
      const d = await fetchDebts();
      setDebts(d);
    } catch (e) {
      console.error(e);
      setDebts([]);
      setDebtsError('Could not load the debt portfolio. Check your connection and Supabase access.');
    }
    try {
      const [cols, invs, cls] = await Promise.all([
        fetchCollectionsForInvoice(),
        listCommissionInvoices(),
        fetchClients(),
      ]);
      setCollectionRows(cols);
      setCommissionInvoices(invs);
      setReportClients(cls);
    } catch (e) {
      console.error(e);
      setCollectionRows([]);
      setCommissionInvoices([]);
      setReportClients([]);
      setRevenueError(
        'Commission and collection metrics could not be loaded. Ensure commission tables exist and RLS allows reads.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => buildPortfolioSummary(debts), [debts]);
  const monthlyTrends = useMemo(() => buildMonthlyTrends(debts, 6), [debts]);
  const agingData = useMemo(() => buildAgingBuckets(debts), [debts]);
  const ownerPerformance = useMemo(() => buildOwnerPerformance(debts, 8), [debts]);
  const serviceLineMix = useMemo(() => buildServiceLineMix(debts, 10), [debts]);

  const clientsById = useMemo(() => {
    const m = new Map<string, Client>();
    reportClients.forEach((c) => m.set(c.id, c));
    return m;
  }, [reportClients]);

  const collectionMonthly = useMemo(
    () => buildCollectionMonthlySeries(collectionRows, clientsById, 6),
    [collectionRows, clientsById],
  );

  const topClientsCommission = useMemo(
    () => buildTopClientsByCommission(collectionRows, clientsById, 8),
    [collectionRows, clientsById],
  );

  const revenueKpis = useMemo(() => {
    const totalRecovered = collectionRows.reduce((s, r) => s + r.amount, 0);
    const totalCommission = collectionRows.reduce(
      (s, r) => s + commissionForRow(r, clientsById),
      0,
    );
    const issued = commissionInvoices.filter((i) => i.status === 'issued');
    const paid = commissionInvoices.filter((i) => i.status === 'paid');
    const outstandingCommission = issued.reduce((s, i) => s + i.totalCommission, 0);
    const paidCommission = paid.reduce((s, i) => s + i.totalCommission, 0);
    return {
      totalRecovered,
      totalCommission,
      outstandingCommission,
      paidCommission,
      invoiceCount: commissionInvoices.length,
      collectionCount: collectionRows.length,
    };
  }, [collectionRows, clientsById, commissionInvoices]);

  const invoiceStatusChart = useMemo(() => {
    const issued = commissionInvoices.filter((i) => i.status === 'issued').length;
    const paid = commissionInvoices.filter((i) => i.status === 'paid').length;
    return [
      { name: 'Issued (unpaid)', value: issued, color: '#f59e0b' },
      { name: 'Paid', value: paid, color: '#22c55e' },
    ].filter((x) => x.value > 0);
  }, [commissionInvoices]);

  const overdueList = useMemo(() => {
    return debts
      .filter((d) => isOverdue(d) && d.status !== 'paid')
      .sort((a, b) => getRemainingAmount(b) - getRemainingAmount(a))
      .slice(0, 12);
  }, [debts]);

  const chartTooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Analytics
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reports
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Portfolio health, trends, risk, and commission performance—organized by topic. Amounts
              are shown in KES.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-lg border-slate-200"
            onClick={() => load()}
            disabled={loading}
          >
            <RotateCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} strokeWidth={2} />
            Refresh data
          </Button>
        </div>

        {debtsError && (
          <div
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
          >
            {debtsError}
          </div>
        )}

        {loading && debts.length === 0 && !debtsError ? (
          <ReportsSkeleton />
        ) : (
          <Tabs value={activeTab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-2 flex h-auto min-h-12 w-full flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1 sm:gap-2">
              <TabsTrigger value="overview" className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
                Overview
              </TabsTrigger>
              <TabsTrigger value="trends" className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
                Trends &amp; mix
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="risk" className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
                Risk &amp; operations
              </TabsTrigger>
              <TabsTrigger value="revenue" className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
                Commission &amp; revenue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6 focus-visible:outline-none">
              {!debtsError && debts.length === 0 && !loading ? (
                <Card className="rounded-xl border-slate-200">
                  <CardContent className="py-10 text-center text-sm text-slate-600">
                    No debts on file yet. Add cases to see portfolio metrics.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Total outstanding"
                      value={formatKes(summary.totalOutstanding)}
                      hint={`${summary.debtCount} debts`}
                    />
                    <MetricCard
                      label="Total collected (lifetime)"
                      value={formatKes(summary.totalCollected)}
                      hint="Across all cases"
                    />
                    <MetricCard
                      label="Avg. collection rate"
                      value={`${summary.avgCollectionRatePct.toFixed(1)}%`}
                      hint="Per-debt average"
                    />
                    <MetricCard
                      label="Overdue cases"
                      value={summary.overdueCount}
                      hint={formatKes(summary.overdueOutstanding)}
                      valueClassName="text-rose-600"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Active pipeline"
                      value={summary.activeCaseCount}
                      hint="Pending, negotiating, overdue"
                      valueClassName="text-blue-600"
                    />
                    <MetricCard
                      label="Paid off"
                      value={summary.paidCount}
                      hint="Closed cases"
                      valueClassName="text-emerald-600"
                    />
                    <MetricCard
                      label="Total principal booked"
                      value={formatKes(summary.totalPrincipal)}
                    />
                    <MetricCard
                      label="Commission & revenue tab"
                      value={revenueError ? '—' : formatKes(revenueKpis.totalCommission)}
                      hint={
                        revenueError
                          ? 'Revenue data unavailable'
                          : `${revenueKpis.collectionCount} collections tracked`
                      }
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="trends" className="mt-4 space-y-6 focus-visible:outline-none">
              {monthlyTrends.some((m) => m.total > 0 || m.collected > 0) ? (
                <>
                  <Card className="rounded-xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly debt activity</CardTitle>
                      <CardDescription>
                        Totals booked and collected by month of service or creation (last 6 months).
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={360}>
                        <AreaChart data={monthlyTrends}>
                          <defs>
                            <linearGradient id="repTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.75} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="repCol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.75} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={kesAxisTick} />
                          <Tooltip
                            formatter={(value: number) => formatKes(value)}
                            contentStyle={chartTooltipStyle}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            fillOpacity={1}
                            fill="url(#repTotal)"
                            name="Total booked"
                          />
                          <Area
                            type="monotone"
                            dataKey="collected"
                            stroke="#16a34a"
                            fillOpacity={1}
                            fill="url(#repCol)"
                            name="Collected"
                          />
                          <Area
                            type="monotone"
                            dataKey="remaining"
                            stroke="#dc2626"
                            fill="#fecaca"
                            fillOpacity={0.35}
                            name="Remaining"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Collection vs remaining</CardTitle>
                      <CardDescription>Same window as the area chart, line view.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={kesAxisTick} />
                          <Tooltip
                            formatter={(value: number) => formatKes(value)}
                            contentStyle={chartTooltipStyle}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="collected"
                            stroke="#22c55e"
                            strokeWidth={2}
                            name="Collected"
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="remaining"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="Remaining"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="rounded-xl border-slate-200">
                  <CardContent className="py-10 text-center text-sm text-slate-600">
                    Not enough dated debt rows to plot trends. Ensure service or creation dates are set.
                  </CardContent>
                </Card>
              )}

              {serviceLineMix.length > 0 && (
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Service line mix</CardTitle>
                    <CardDescription>Top lines by total principal (top 10).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={serviceLineMix}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="serviceLine"
                          angle={-35}
                          textAnchor="end"
                          height={90}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={kesAxisTick} />
                        <Tooltip
                          formatter={(value: number) => formatKes(value)}
                          contentStyle={chartTooltipStyle}
                        />
                        <Legend />
                        <Bar dataKey="total" fill="#0ea5e9" name="Total amount" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4 space-y-6 focus-visible:outline-none">
              {debts.length === 0 ? (
                <Card className="rounded-xl border-slate-200">
                  <CardContent className="py-10 text-center text-sm text-slate-600">
                    No portfolio data to chart.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <StatusPieChart debts={debts} />
                  <PriorityBarChart debts={debts} />
                </div>
              )}
              {debts.length > 0 && <DebtAmountBarChart debts={debts} />}
            </TabsContent>

            <TabsContent value="risk" className="mt-4 space-y-6 focus-visible:outline-none">
              <div className="grid gap-6 lg:grid-cols-2">
                {agingData.length > 0 ? (
                  <Card className="rounded-xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Aging (days past due)</CardTitle>
                      <CardDescription>
                        Open cases only. &quot;Current&quot; is not yet due.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={agingData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            tickFormatter={kesAxisTick}
                          />
                          <Tooltip
                            formatter={(value: number, name) =>
                              name === 'Count' ? value : formatKes(value)
                            }
                            contentStyle={chartTooltipStyle}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="Count"
                            fill="#8b5cf6"
                            name="Cases"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="Amount"
                            fill="#f97316"
                            name="Outstanding"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-xl border-slate-200">
                    <CardContent className="py-10 text-center text-sm text-slate-600">
                      No aging data for open debts.
                    </CardContent>
                  </Card>
                )}

                {ownerPerformance.length > 0 ? (
                  <Card className="rounded-xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Collector / owner (top 8)</CardTitle>
                      <CardDescription>Portfolio, collected, and remaining by owner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={ownerPerformance}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="owner"
                            angle={-30}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={kesAxisTick} />
                          <Tooltip
                            formatter={(value: number) => formatKes(value)}
                            contentStyle={chartTooltipStyle}
                          />
                          <Legend />
                          <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="remaining" fill="#ef4444" name="Remaining" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Largest overdue balances</CardTitle>
                  <CardDescription>Up to 12 cases, sorted by remaining balance.</CardDescription>
                </CardHeader>
                <CardContent>
                  {overdueList.length === 0 ? (
                    <p className="text-sm text-slate-500">No overdue cases right now.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="py-2 pr-3">Creditor</th>
                            <th className="py-2 pr-3">Patient</th>
                            <th className="py-2 pr-3">Owner</th>
                            <th className="py-2 pr-3">Due</th>
                            <th className="py-2 text-right">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {overdueList.map((d) => (
                            <tr key={d.id} className="text-slate-700">
                              <td className="py-2 pr-3 font-medium text-slate-900">{d.creditor}</td>
                              <td className="py-2 pr-3">{d.patientName}</td>
                              <td className="py-2 pr-3">{d.owner || '—'}</td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {new Date(d.dueDate).toLocaleDateString('en-KE')}
                              </td>
                              <td className="py-2 text-right tabular-nums font-medium">
                                {formatKes(getRemainingAmount(d))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="mt-4 space-y-6 focus-visible:outline-none">
              {revenueError && (
                <div
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  role="status"
                >
                  {revenueError}
                </div>
              )}

              {!revenueError && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Recoveries recorded"
                      value={formatKes(revenueKpis.totalRecovered)}
                      hint={`${revenueKpis.collectionCount} collection events`}
                    />
                    <MetricCard
                      label="Commission (all collections)"
                      value={formatKes(revenueKpis.totalCommission)}
                      hint="Using client commission rules"
                      valueClassName="text-emerald-700"
                    />
                    <MetricCard
                      label="Issued invoices (unpaid)"
                      value={formatKes(revenueKpis.outstandingCommission)}
                      hint="Commission on issued invoices"
                    />
                    <MetricCard
                      label="Paid commission (invoices)"
                      value={formatKes(revenueKpis.paidCommission)}
                      hint={`${revenueKpis.invoiceCount} saved invoices total`}
                      valueClassName="text-emerald-600"
                    />
                  </div>

                  {collectionMonthly.some((m) => m.count > 0) ? (
                    <Card className="rounded-xl border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Collections by month</CardTitle>
                        <CardDescription>Recorded recoveries and calculated commission.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={340}>
                          <BarChart data={collectionMonthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" tickFormatter={kesAxisTick} tick={{ fontSize: 12 }} />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 12 }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              formatter={(value: number, name) =>
                                name === 'Collections' ? value : formatKes(value)
                              }
                              contentStyle={chartTooltipStyle}
                            />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="recovered"
                              fill="#3b82f6"
                              name="Recovered"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="commission"
                              fill="#10b981"
                              name="Commission"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="count"
                              fill="#94a3b8"
                              name="Collections"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-xl border-slate-200">
                      <CardContent className="py-8 text-center text-sm text-slate-600">
                        No collection events in the selected window. Record collections on debt cases to
                        populate this chart.
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2">
                    {invoiceStatusChart.length > 0 ? (
                      <Card className="rounded-xl border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Saved invoice status</CardTitle>
                          <CardDescription>Count of formal commission invoices.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={invoiceStatusChart}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {invoiceStatusChart.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="rounded-xl border-slate-200">
                        <CardContent className="py-8 text-center text-sm text-slate-600">
                          No saved commission invoices yet.
                        </CardContent>
                      </Card>
                    )}

                    {topClientsCommission.length > 0 ? (
                      <Card className="rounded-xl border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Top clients by commission</CardTitle>
                          <CardDescription>From collection history (top 8).</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                              data={topClientsCommission.map((c) => ({
                                name:
                                  c.name.length > 14 ? `${c.name.slice(0, 14)}…` : c.name,
                                fullName: c.name,
                                commission: c.commission,
                              }))}
                              margin={{ bottom: 60, left: 8, right: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
                              <YAxis tick={{ fontSize: 12 }} tickFormatter={kesAxisTick} />
                              <Tooltip
                                formatter={(value: number) => formatKes(value)}
                                labelFormatter={(_, payload) =>
                                  (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ''
                                }
                                contentStyle={chartTooltipStyle}
                              />
                              <Bar dataKey="commission" fill="#059669" name="Commission" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="mx-auto max-w-[1600px] px-1 py-8">
            <ReportsSkeleton />
          </div>
        </DashboardLayout>
      }
    >
      <ReportsPageInner />
    </Suspense>
  );
}
