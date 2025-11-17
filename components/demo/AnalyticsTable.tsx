'use client';

import styles from './AnalyticsTable.module.scss';

interface AnalyticsTableProps {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

export function AnalyticsTable({ title, data, columns }: AnalyticsTableProps) {
  const formatDate = (date: string | Date, includeTime: boolean = true) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (includeTime) {
      return d.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return d.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
  };

  const formatJSON = (value: string | null) => {
    if (!value) return '-';
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Format object as key: value pairs
        return Object.entries(parsed)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
      }
      return value;
    } catch {
      return value;
    }
  };

  const formatSentiment = (sentiment: string | null) => {
    if (!sentiment) return '-';
    const colors: Record<string, string> = {
      positive: 'var(--color-success)',
      negative: 'var(--color-error)',
      neutral: 'var(--color-text-secondary)',
    };
    const color = colors[sentiment.toLowerCase()] || 'var(--color-text-primary)';
    return (
      <span style={{ color, fontWeight: 'var(--font-weight-medium)' }}>
        {sentiment}
      </span>
    );
  };

  const formatBoolean = (value: number | boolean | null) => {
    if (value === null || value === undefined) return '-';
    return value === 1 || value === true ? 'Ja' : 'Nein';
  };

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>
        {data.length} {data.length === 1 ? 'Eintrag' : 'Einträge'}
      </p>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  Keine Daten vorhanden
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    let displayValue: React.ReactNode = value;

                    if (value === null || value === undefined) {
                      displayValue = '-';
                    } else if (column.key === 'sentiment') {
                      displayValue = formatSentiment(value);
                    } else if (column.key === 'personalContactRequested' || (typeof value === 'number' && (value === 0 || value === 1))) {
                      displayValue = formatBoolean(value);
                    } else if (typeof value === 'boolean') {
                      displayValue = value ? 'Ja' : 'Nein';
                    } else if (column.key === 'date' || column.key === 'syncDate') {
                      // Format DATE fields without time
                      displayValue = formatDate(value, false);
                    } else if (column.key === 'eventTypes') {
                      // Format eventTypes as key: value pairs
                      displayValue = formatJSON(value);
                    } else if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
                      displayValue = formatDate(value);
                    } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                      displayValue = formatJSON(value);
                    } else if (typeof value === 'number' && column.key.includes('Cost')) {
                      displayValue = value.toFixed(2);
                    } else if (typeof value === 'number' && column.key.includes('Latency')) {
                      displayValue = value.toFixed(1);
                    } else if (typeof value === 'number' && column.key.includes('Length')) {
                      displayValue = value.toFixed(1);
                    }

                    return (
                      <td key={column.key} className={styles.cell}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

