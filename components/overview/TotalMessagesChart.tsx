'use client';

import { BarChart } from './BarChart';

interface TotalMessagesChartProps {
  total: number;
  dataByDate: Array<{ date: string; totalMessages: number }>;
}

export function TotalMessagesChart({ total, dataByDate }: TotalMessagesChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.totalMessages,
  }));

  return (
    <BarChart title="Total Messages pro Tag" data={chartData} color="#f59e0b" total={total} />
  );
}

