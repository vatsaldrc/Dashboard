'use client';

import { BarChart } from './BarChart';

interface ReturningUsersChartProps {
  total: number;
  dataByDate: Array<{ date: string; returningUsers: number }>;
}

export function ReturningUsersChart({ total, dataByDate }: ReturningUsersChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.returningUsers,
  }));

  return (
    <BarChart title="Returning Users pro Tag" data={chartData} color="#3b82f6" total={total} />
  );
}

