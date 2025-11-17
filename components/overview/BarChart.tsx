'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './BarChart.module.scss';

interface BarChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  dataKey?: string;
  color?: string;
  total?: number;
}

export function BarChart({ title, data, dataKey = 'value', color = '#3b82f6', total }: BarChartProps) {
  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {total !== undefined && (
          <div className={styles.total}>
            Gesamt: <span className={styles.totalValue}>{total.toLocaleString('de-DE')}</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}
            formatter={(value: number) => value.toLocaleString('de-DE')}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

