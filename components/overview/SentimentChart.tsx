'use client';

import { CategoryBarChart } from './CategoryBarChart';

interface SentimentChartProps {
  data: Record<string, number>;
}

export function SentimentChart({ data }: SentimentChartProps) {
  // Sort sentiment data: positive first, then neutral, then others
  const sentimentOrder = ['positive', 'neutral', 'negative'];
  const sortedData = Object.entries(data)
    .sort(([keyA], [keyB]) => {
      const indexA = sentimentOrder.indexOf(keyA.toLowerCase());
      const indexB = sentimentOrder.indexOf(keyB.toLowerCase());
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, number>);

  return <CategoryBarChart title="Sentiment Verteilung" data={sortedData} color="#8b5cf6" />;
}


