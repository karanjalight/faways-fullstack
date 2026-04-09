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
import { Debt } from '../types/debt';
import { formatKes, kesAxisTick } from '@/lib/format-kes';

interface PriorityBarChartProps {
  debts: Debt[];
}

interface PriorityChartDatum {
  priority: string;
  Count: number;
  'Total Amount': number;
  'Paid Amount': number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/**
 * ✅ FIXED TOOLTIP (same fix as previous chart)
 */
const PriorityTooltip = (
  props: TooltipProps<ValueType, NameType> & {
    active?: boolean;
    payload?: Array<{
      payload: PriorityChartDatum;
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
        {datum.priority} Priority
      </p>

      {payload.map((entry, index) => {
        const value = Number(entry.value ?? 0);

        const label =
          entry.name === 'Count'
            ? `${entry.name}: ${value} debts`
            : `${entry.name}: ${formatCurrency(value)}`;

        return (
          <p
            key={`${entry.name}-${index}`}
            className="text-sm"
            style={{ color: entry.color || '#000' }}
          >
            {label}
          </p>
        );
      })}
    </div>
  );
};

export default function PriorityBarChart({
  debts,
}: PriorityBarChartProps) {
  /**
   * Aggregate data by priority
   */
  const priorityData = debts.reduce(
    (acc, debt) => {
      const key = debt.priority.toLowerCase(); // normalize

      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalAmount: 0,
          paidAmount: 0,
        };
      }

      acc[key].count += 1;
      acc[key].totalAmount += debt.amount;
      acc[key].paidAmount += debt.paidAmount;

      return acc;
    },
    {} as Record<
      string,
      { count: number; totalAmount: number; paidAmount: number }
    >
  );

  /**
   * Prepare chart data
   */
  const chartData: PriorityChartDatum[] = [
    {
      priority: 'High',
      Count: priorityData.high?.count || 0,
      'Total Amount': priorityData.high?.totalAmount || 0,
      'Paid Amount': priorityData.high?.paidAmount || 0,
    },
    {
      priority: 'Medium',
      Count: priorityData.medium?.count || 0,
      'Total Amount': priorityData.medium?.totalAmount || 0,
      'Paid Amount': priorityData.medium?.paidAmount || 0,
    },
    {
      priority: 'Low',
      Count: priorityData.low?.count || 0,
      'Total Amount': priorityData.low?.totalAmount || 0,
      'Paid Amount': priorityData.low?.paidAmount || 0,
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Debts by Priority Level
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis dataKey="priority" tick={{ fontSize: 12 }} />

          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => value.toString()}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => kesAxisTick(value)}
          />

          <Tooltip content={<PriorityTooltip />} />

          <Legend />

          <Bar
            yAxisId="left"
            dataKey="Count"
            fill="#8b5cf6"
            name="Number of Debts"
            radius={[8, 8, 0, 0]}
          />

          <Bar
            yAxisId="right"
            dataKey="Total Amount"
            fill="#3b82f6"
            name="Total Amount"
            radius={[8, 8, 0, 0]}
          />

          <Bar
            yAxisId="right"
            dataKey="Paid Amount"
            fill="#22c55e"
            name="Paid Amount"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}