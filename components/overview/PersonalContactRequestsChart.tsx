'use client';

import { BarChart } from './BarChart';

interface PersonalContactRequestsChartProps {
  total: number;
  dataByDate: Array<{ date: string; personalContactRequested: number }>;
}

export function PersonalContactRequestsChart({ total, dataByDate }: PersonalContactRequestsChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.personalContactRequested,
  }));

  return (
    <BarChart title="Anzahl Leads" data={chartData} color="#ec4899" total={total} />
  );
}
