'use client';

import styles from './SummaryList.module.scss';

interface SummaryItem {
  conversationId: string;
  summary: string | null;
  createdAt: Date | string;
}

interface SummaryListProps {
  summaries: SummaryItem[];
}

export function SummaryList({ summaries }: SummaryListProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!summaries || summaries.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Summaries</h3>
        <p className={styles.empty}>Keine Summaries vorhanden</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Summaries</h3>
      <div className={styles.list}>
        {summaries.map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.header}>
              <span className={styles.conversationId}>{item.conversationId}</span>
              <span className={styles.date}>{formatDate(item.createdAt)}</span>
            </div>
            <p className={styles.summary}>{item.summary || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

