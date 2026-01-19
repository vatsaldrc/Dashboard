'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface CustomerRegionChartProps {
  data: Record<string, number>;
}

export function CustomerRegionChart({ data }: CustomerRegionChartProps) {
  return <CategoryBarChart title="PLZ Verteilung (B2B)" data={data} color="#ef4444" />;
}


