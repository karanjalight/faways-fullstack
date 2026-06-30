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
import type { InsurerReceivable } from '../../types/receivable';
import { formatKes, kesAxisTick } from '@/lib/format-kes';

interface ReceivablesChartProps {
  insurers: InsurerReceivable[];
}

interface ChartDatum {
  name: string;
  fullName: string;
  Billed: number;
  Paid: number;
  Outstanding: number;
}

const ReceivablesTooltip = (
  props: TooltipProps<ValueType, NameType> & {
    active?: boolean;
    payload?: Array<{
      payload: ChartDatum;
      value?: number;
      name?: string;
      color?: string;
    }>;
  },
) => {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-gray-900">{datum.fullName}</p>
      {payload.map((entry, index) => (
        <p
          key={`${entry.name}-${index}`}
          className="text-sm"
          style={{ color: entry.color || '#000' }}
        >
          {entry.name}: {formatKes(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
};

export default function ReceivablesChart({ insurers }: ReceivablesChartProps) {
  const chartData: ChartDatum[] = insurers.slice(0, 8).map((item) => ({
    name:
      item.insurer.length > 15 ? item.insurer.slice(0, 15) + '...' : item.insurer,
    fullName: item.insurer,
    Billed: item.billed,
    Paid: item.paid,
    Outstanding: item.outstanding,
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Outstanding by Insurer (Top 8)
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value: number) => kesAxisTick(value)} tick={{ fontSize: 12 }} />
          <Tooltip content={<ReceivablesTooltip />} />
          <Legend />
          <Bar dataKey="Billed" fill="#3b82f6" name="Billed" />
          <Bar dataKey="Paid" fill="#22c55e" name="Paid" />
          <Bar dataKey="Outstanding" fill="#ef4444" name="Outstanding" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
