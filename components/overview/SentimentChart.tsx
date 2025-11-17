'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface SentimentChartProps {
  data: Record<string, number>;
}

export function SentimentChart({ data }: SentimentChartProps) {
  return <CategoryBarChart title="Sentiment Verteilung" data={data} color="#8b5cf6" />;
}

