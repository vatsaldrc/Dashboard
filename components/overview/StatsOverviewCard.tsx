'use client';

import { CompactStatsCard } from './CompactStatsCard';

interface StatsOverviewCardProps {
  avgWordsPerMessage: number;
  personalContactRequested: number;
  bookingStartedCount: number;
}

export function StatsOverviewCard({ avgWordsPerMessage, personalContactRequested, bookingStartedCount }: StatsOverviewCardProps) {
  return (
    <CompactStatsCard
      stats={[
        {
          title: "Avg Anzahl Wörter pro Nachricht",
          value: avgWordsPerMessage.toFixed(1),
        },
        {
          title: "Anzahl Beratungsgesuche",
          value: bookingStartedCount,
        },
        {
          title: "Anzahl Leads",
          value: personalContactRequested,
        },
      ]}
    />
  );
}


