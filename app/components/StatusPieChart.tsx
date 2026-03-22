'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Debt } from '../types/debt';

interface StatusPieChartProps {
  debts: Debt[];
}

export default function StatusPieChart({ debts }: StatusPieChartProps) {
  // Aggregate status counts
  const statusData = debts.reduce<Record<string, number>>((acc, debt) => {
    acc[debt.status] = (acc[debt.status] || 0) + 1;
    return acc;
  }, {});

  // Prepare chart data
  const chartData = [
    {
      name: 'Pending',
      value: statusData.pending ?? 0,
      color: '#eab308',
    },
    {
      name: 'Paid',
      value: statusData.paid ?? 0,
      color: '#22c55e',
    },
    {
      name: 'Overdue',
      value: statusData.overdue ?? 0,
      color: '#ef4444',
    },
    {
      name: 'Negotiating',
      value: statusData.negotiating ?? 0,
      color: '#3b82f6',
    },
  ].filter((item) => item.value > 0);

  // Custom label renderer (fully type-safe)
  const renderLabel = (props: PieLabelRenderProps) => {
    const name = props.name ?? '';
    const value = props.value ?? 0;
    const percent = props.percent ?? 0;

    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
  };

  // Handle empty state
  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Debt Status Distribution
        </h3>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Debt Status Distribution
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: number, name: string) => [`${value}`, name]}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}