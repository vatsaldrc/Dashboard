'use client';

import { StatCard } from './StatCard';

interface PersonalContactChartProps {
  total: number;
}

export function PersonalContactChart({ total }: PersonalContactChartProps) {
  return <StatCard title="Personal Contact Requested" value={total} />;
}


