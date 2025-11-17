'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface ContactChannelChartProps {
  data: Record<string, number>;
}

export function ContactChannelChart({ data }: ContactChannelChartProps) {
  return <CategoryBarChart title="Requested Contact Channel" data={data} color="#10b981" />;
}

