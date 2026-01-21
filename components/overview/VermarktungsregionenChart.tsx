'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface VermarktungsregionenChartProps {
  data: Record<string, number>;
}

export function VermarktungsregionenChart({ data }: VermarktungsregionenChartProps) {
  return <CategoryBarChart title="Vermarktungsregionen" data={data} color="#8b5cf6" />;
}
