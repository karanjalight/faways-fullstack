import type { Debt } from '../types/debt';
import { getRemainingAmount, isOverdue } from '../types/debt';

export type MonthlyTrendPoint = {
  month: string;
  total: number;
  collected: number;
  remaining: number;
};

/**
 * Bucket debt amounts by calendar month of service/created date (last N months window).
 */
export function buildMonthlyTrends(debts: Debt[], monthsBack = 6): MonthlyTrendPoint[] {
  if (debts.length === 0) return [];

  const now = new Date();
  const monthKeys: { key: string; label: string }[] = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('en-KE', { month: 'short' });
    monthKeys.push({ key, label });
  }

  const aggregates: Record<string, { total: number; collected: number }> = {};

  debts.forEach((debt) => {
    const baseDate = debt.serviceDate ?? debt.createdAt ?? debt.dueDate;
    if (!baseDate) return;

    const d = new Date(baseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

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
}

export type AgingBucketRow = {
  bucket: string;
  Count: number;
  Amount: number;
};

/**
 * Days past due for open debts. "Current" = not yet due (due date in the future).
 */
export function buildAgingBuckets(debts: Debt[]): AgingBucketRow[] {
  const buckets: Record<string, { count: number; amount: number }> = {
    Current: { count: 0, amount: 0 },
    '0-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 },
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  debts.forEach((debt) => {
    if (debt.status === 'paid') return;
    const due = new Date(debt.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffInDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    let key: string;
    if (diffInDays < 0) {
      key = 'Current';
    } else if (diffInDays <= 30) key = '0-30';
    else if (diffInDays <= 60) key = '31-60';
    else if (diffInDays <= 90) key = '61-90';
    else key = '90+';

    buckets[key].count += 1;
    buckets[key].amount += getRemainingAmount(debt);
  });

  return (Object.entries(buckets) as [string, { count: number; amount: number }][])
    .map(([bucket, info]) => ({
      bucket,
      Count: info.count,
      Amount: info.amount,
    }))
    .filter((b) => b.Count > 0 || b.Amount > 0);
}

export type OwnerPerformanceRow = {
  owner: string;
  total: number;
  collected: number;
  remaining: number;
};

export function buildOwnerPerformance(debts: Debt[], limit = 8): OwnerPerformanceRow[] {
  const grouped: Record<string, OwnerPerformanceRow> = {};

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
    .slice(0, limit);
}

export type ServiceLineRow = {
  serviceLine: string;
  total: number;
  count: number;
};

export function buildServiceLineMix(debts: Debt[], limit = 10): ServiceLineRow[] {
  const grouped: Record<string, ServiceLineRow> = {};

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
    .slice(0, limit);
}

export type PortfolioSummary = {
  debtCount: number;
  totalPrincipal: number;
  totalCollected: number;
  totalOutstanding: number;
  avgCollectionRatePct: number;
  overdueCount: number;
  overdueOutstanding: number;
  activeCaseCount: number;
  paidCount: number;
  statusBreakdown: Record<string, number>;
};

export function buildPortfolioSummary(debts: Debt[]): PortfolioSummary {
  let totalPrincipal = 0;
  let totalCollected = 0;
  const statusBreakdown: Record<string, number> = {};
  let overdueCount = 0;
  let overdueOutstanding = 0;
  let rateSum = 0;
  let rateN = 0;

  debts.forEach((d) => {
    totalPrincipal += d.amount;
    totalCollected += d.paidAmount;
    statusBreakdown[d.status] = (statusBreakdown[d.status] || 0) + 1;
    if (isOverdue(d) && d.status !== 'paid') {
      overdueCount += 1;
      overdueOutstanding += getRemainingAmount(d);
    }
    if (d.amount > 0) {
      rateSum += (d.paidAmount / d.amount) * 100;
      rateN += 1;
    }
  });

  const totalOutstanding = debts.reduce((s, d) => s + getRemainingAmount(d), 0);
  const activeCaseCount =
    (statusBreakdown.pending || 0) + (statusBreakdown.negotiating || 0) + (statusBreakdown.overdue || 0);

  return {
    debtCount: debts.length,
    totalPrincipal,
    totalCollected,
    totalOutstanding,
    avgCollectionRatePct: rateN > 0 ? rateSum / rateN : 0,
    overdueCount,
    overdueOutstanding,
    activeCaseCount,
    paidCount: statusBreakdown.paid || 0,
    statusBreakdown,
  };
}
