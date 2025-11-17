'use client';

import { CompactStatsCard } from './CompactStatsCard';

interface StatsOverviewCardProps {
  avgMessageLength: number;
  personalContactRequested: number;
}

export function StatsOverviewCard({ avgMessageLength, personalContactRequested }: StatsOverviewCardProps) {
  return (
    <CompactStatsCard
      stats={[
        {
          title: 'Summe Avg. Message Length',
          value: avgMessageLength.toFixed(2),
        },
        {
          title: 'Personal Contact Requested',
          value: personalContactRequested,
        },
      ]}
    />
  );
}

