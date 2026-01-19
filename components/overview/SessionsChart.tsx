'use client';

import { BarChart } from './BarChart';

interface SessionsChartProps {
  total: number;
  dataByDate: Array<{ date: string; sessions: number }>;
}

export function SessionsChart({ total, dataByDate }: SessionsChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.sessions,
  }));

  return (
    <BarChart title="Anzahl Konversationen" data={chartData} color="#8b5cf6" total={total} />
  );
}

