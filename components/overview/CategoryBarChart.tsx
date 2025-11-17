'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './BarChart.module.scss';

interface CategoryBarChartProps {
  title: string;
  data: Record<string, number>;
  color?: string;
}

export function CategoryBarChart({ title, data, color = '#3b82f6' }: CategoryBarChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.title}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            width={120}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}
            formatter={(value: number) => value.toLocaleString('de-DE')}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

