'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { Debt, getRemainingAmount } from '../types/debt';
import { formatKes, kesAxisTick } from '@/lib/format-kes';

interface DebtAmountBarChartProps {
  debts: Debt[];
}

interface DebtChartDatum {
  name: string;
  fullName: string;
  Total: number;
  Paid: number;
  Remaining: number;
}

const formatCurrency = formatKes;

/**
 * ✅ FIXED TOOLTIP (Type-safe + build-safe)
 */
const DebtAmountTooltip = (
  props: TooltipProps<ValueType, NameType> & {
    active?: boolean;
    payload?: Array<{
      payload: DebtChartDatum;
      value?: number;
      name?: string;
      color?: string;
    }>;
  }
) => {
  const { active, payload } = props;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-gray-900">
        {datum.fullName}
      </p>

      {payload.map((entry, index) => (
        <p
          key={`${entry.name}-${index}`}
          className="text-sm"
          style={{ color: entry.color || '#000' }}
        >
          {entry.name}: {formatCurrency(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
};

export default function DebtAmountBarChart({
  debts,
}: DebtAmountBarChartProps) {
  /**
   * Aggregate debts by creditor
   */
  const creditorData = debts.reduce(
    (acc, debt) => {
      if (!acc[debt.creditor]) {
        acc[debt.creditor] = {
          creditor: debt.creditor,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        };
      }

      acc[debt.creditor].totalAmount += debt.amount;
      acc[debt.creditor].paidAmount += debt.paidAmount;
      acc[debt.creditor].remainingAmount += getRemainingAmount(debt);

      return acc;
    },
    {} as Record<
      string,
      {
        creditor: string;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
      }
    >
  );

  /**
   * Prepare chart data (Top 8 creditors)
   */
  const chartData: DebtChartDatum[] = Object.values(creditorData)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8)
    .map((item) => ({
      name:
        item.creditor.length > 15
          ? item.creditor.slice(0, 15) + '...'
          : item.creditor,
      fullName: item.creditor,
      Total: item.totalAmount,
      Paid: item.paidAmount,
      Remaining: item.remainingAmount,
    }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Debt Amounts by Creditor (Top 8)
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />

          <YAxis tickFormatter={(value: number) => kesAxisTick(value)} tick={{ fontSize: 12 }} />

          <Tooltip content={<DebtAmountTooltip />} />

          <Legend />

          <Bar
            dataKey="Total"
            fill="#3b82f6"
            name="Total Amount"
          />
          <Bar
            dataKey="Paid"
            fill="#22c55e"
            name="Paid Amount"
          />
          <Bar
            dataKey="Remaining"
            fill="#ef4444"
            name="Remaining Amount"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}