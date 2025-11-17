'use client';

import { BarChart } from './BarChart';

interface NewUsersChartProps {
  total: number;
  dataByDate: Array<{ date: string; newUsers: number }>;
}

export function NewUsersChart({ total, dataByDate }: NewUsersChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.newUsers,
  }));

  return (
    <BarChart title="New Users pro Tag" data={chartData} color="#10b981" total={total} />
  );
}

