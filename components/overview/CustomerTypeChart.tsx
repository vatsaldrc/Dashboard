'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface CustomerTypeChartProps {
  data: Record<string, number>;
}

export function CustomerTypeChart({ data }: CustomerTypeChartProps) {
  return <CategoryBarChart title="Customer Type" data={data} color="#f59e0b" />;
}

