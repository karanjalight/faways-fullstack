// Bar chart component for debt amounts by creditor
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
import { Debt, getRemainingAmount } from '../types/debt';

interface DebtAmountBarChartProps {
  debts: Debt[];
}

export default function DebtAmountBarChart({ debts }: DebtAmountBarChartProps) {
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data - show top 8 creditors by total amount
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

  // Convert to array, sort by total amount, and take top 8
  const chartData = Object.values(creditorData)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8)
    .map((item) => ({
      name: item.creditor.length > 15 
        ? item.creditor.substring(0, 15) + '...' 
        : item.creditor,
      fullName: item.creditor,
      Total: item.totalAmount,
      Paid: item.paidAmount,
      Remaining: item.remainingAmount,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-semibold text-gray-900">
            {payload[0].payload.fullName}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
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
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Total" fill="#3b82f6" name="Total Amount" />
          <Bar dataKey="Paid" fill="#22c55e" name="Paid Amount" />
          <Bar dataKey="Remaining" fill="#ef4444" name="Remaining Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

