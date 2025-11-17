'use client';

import { StatCard } from './StatCard';

interface AvgMessageLengthCardProps {
  total: number;
}

export function AvgMessageLengthCard({ total }: AvgMessageLengthCardProps) {
  return <StatCard title="Summe Avg. Message Length" value={total.toFixed(2)} />;
}

