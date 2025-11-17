'use client';

import { BarChart } from './BarChart';

interface UserMessagesChartProps {
  total: number;
  dataByDate: Array<{ date: string; userMessages: number }>;
}

export function UserMessagesChart({ total, dataByDate }: UserMessagesChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.userMessages,
  }));

  return (
    <BarChart title="User Messages pro Tag" data={chartData} color="#ef4444" total={total} />
  );
}

