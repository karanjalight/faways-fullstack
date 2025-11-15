// Bar chart component for debts by priority
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
import { Debt } from '../types/debt';

interface PriorityBarChartProps {
  debts: Debt[];
}

export default function PriorityBarChart({ debts }: PriorityBarChartProps) {
  // Calculate total amounts by priority
  const priorityData = debts.reduce(
    (acc, debt) => {
      if (!acc[debt.priority]) {
        acc[debt.priority] = {
          count: 0,
          totalAmount: 0,
          paidAmount: 0,
        };
      }
      acc[debt.priority].count += 1;
      acc[debt.priority].totalAmount += debt.amount;
      acc[debt.priority].paidAmount += debt.paidAmount;
      return acc;
    },
    {} as Record<
      string,
      { count: number; totalAmount: number; paidAmount: number }
    >
  );

  const chartData = [
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-semibold text-gray-900">
            {payload[0].payload.priority} Priority
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'Count'
                ? `${entry.name}: ${entry.value} debts`
                : `${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            tickFormatter={(value) => value.toString()}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
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

