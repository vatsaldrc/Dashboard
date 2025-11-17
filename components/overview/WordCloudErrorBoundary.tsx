'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './WordCloud.module.scss';

interface Props {
  children: ReactNode;
  words?: Array<{ text: string; value: number }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WordCloudErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WordCloud error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Fallback: Simple tag cloud visualization
      const words = this.props.words || [];
      const sortedWords = [...words].sort((a, b) => b.value - a.value).slice(0, 50);
      const maxValue = sortedWords[0]?.value || 1;

      // Shuffle array for random positioning
      const shuffledWords = [...sortedWords].sort(() => Math.random() - 0.5);

      // Color palette for words
      const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f97316', // orange
        '#6366f1', // indigo
      ];

      return (
        <div className={styles.container}>
          <h3 className={styles.title}>Keywords Word Cloud</h3>
          <div className={styles.wordCloudWrapper}>
            <div className={styles.fallbackCloud}>
              {shuffledWords.map((word, index) => {
                const fontSize = Math.max(12, Math.min(32, (word.value / maxValue) * 32));
                const color = colors[Math.floor(Math.random() * colors.length)];
                const rotation = (Math.random() - 0.5) * 15; // Random rotation between -15 and 15 degrees
                
                return (
                  <span
                    key={index}
                    className={styles.fallbackWord}
                    style={{ 
                      fontSize: `${fontSize}px`,
                      color: color,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

