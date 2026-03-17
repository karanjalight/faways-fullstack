// Pie chart component for debt status distribution
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Debt } from '../types/debt';

interface StatusPieChartProps {
  debts: Debt[];
}

export default function StatusPieChart({ debts }: StatusPieChartProps) {
  // Calculate status distribution
  const statusData = debts.reduce(
    (acc, debt) => {
      acc[debt.status] = (acc[debt.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Format data for chart
  const chartData = [
    {
      name: 'Pending',
      value: statusData.pending || 0,
      color: '#eab308', // yellow
    },
    {
      name: 'Paid',
      value: statusData.paid || 0,
      color: '#22c55e', // green
    },
    {
      name: 'Overdue',
      value: statusData.overdue || 0,
      color: '#ef4444', // red
    },
    {
      name: 'Negotiating',
      value: statusData.negotiating || 0,
      color: '#3b82f6', // blue
    },
  ].filter((item) => item.value > 0);

  const COLORS = chartData.map((item) => item.color);

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
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

