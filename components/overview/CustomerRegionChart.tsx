'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface CustomerRegionChartProps {
  data: Record<string, number>;
}

export function CustomerRegionChart({ data }: CustomerRegionChartProps) {
  return <CategoryBarChart title="Customer Region" data={data} color="#ef4444" />;
}

