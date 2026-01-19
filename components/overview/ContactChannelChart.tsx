'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface ContactChannelChartProps {
  data: Record<string, number>;
}

export function ContactChannelChart({ data }: ContactChannelChartProps) {
  return <CategoryBarChart title="Präferierte Kontaktkanäle" data={data} color="#10b981" />;
}


