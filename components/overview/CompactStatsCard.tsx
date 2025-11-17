import styles from './CompactStatsCard.module.scss';

interface CompactStatProps {
  title: string;
  value: number | string;
}

interface CompactStatsCardProps {
  stats: CompactStatProps[];
}

export function CompactStatsCard({ stats }: CompactStatsCardProps) {
  return (
    <div className={styles.card}>
      {stats.map((stat, index) => (
        <div key={index} className={styles.statItem}>
          <div className={styles.title}>{stat.title}</div>
          <div className={styles.value}>
            {typeof stat.value === 'number' ? stat.value.toLocaleString('de-DE') : stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}


