import styles from './StatCard.module.scss';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
}

export function StatCard({ title, value, unit }: StatCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.value}>
        {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  );
}


