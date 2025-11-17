'use client';

import { BarChart } from './BarChart';

interface BotMessagesChartProps {
  total: number;
  dataByDate: Array<{ date: string; botMessages: number }>;
}

export function BotMessagesChart({ total, dataByDate }: BotMessagesChartProps) {
  const chartData = dataByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: item.botMessages,
  }));

  return (
    <BarChart title="Bot Messages pro Tag" data={chartData} color="#06b6d4" total={total} />
  );
}

