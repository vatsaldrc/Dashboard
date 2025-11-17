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

      return (
        <div className={styles.container}>
          <h3 className={styles.title}>Keywords Word Cloud</h3>
          <div className={styles.wordCloudWrapper}>
            <div className={styles.fallbackCloud}>
              {sortedWords.map((word, index) => {
                const fontSize = Math.max(12, Math.min(32, (word.value / maxValue) * 32));
                return (
                  <span
                    key={index}
                    className={styles.fallbackWord}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {word.text} ({word.value})
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

