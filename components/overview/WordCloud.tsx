'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './WordCloud.module.scss';
import { WordCloudErrorBoundary } from './WordCloudErrorBoundary';

interface WordCloudProps {
  words: Array<{ text: string; value: number }>;
}

// Dynamically import react-wordcloud with no SSR
const ReactWordcloud = dynamic(
  () => import('react-wordcloud').then((mod) => {
    // Handle default export
    const Component = mod.default || mod;
    return Component;
  }),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Lade Word Cloud...</div>,
  }
) as React.ComponentType<{ words: Array<{ text: string; value: number }>; options: any }>;

function WordCloudContent({ words }: WordCloudProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate and format words
  const validWords = words?.filter(
    (word) => word && typeof word === 'object' && word.text && typeof word.value === 'number' && word.value > 0
  ) || [];

  if (!words || words.length === 0 || validWords.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Keywords Word Cloud</h3>
        <p className={styles.empty}>Keine Keywords vorhanden</p>
      </div>
    );
  }

  const options = {
    rotations: 2,
    rotationSteps: 2,
    fontSizes: [12, 60] as [number, number],
    fontFamily: 'var(--font-family-sans)',
    padding: 5,
    scale: 'sqrt' as const,
    transitionDuration: 1000,
  };

  if (!mounted) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Keywords Word Cloud</h3>
        <div className={styles.wordCloudWrapper}>
          <div className={styles.loading}>Lade Word Cloud...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Keywords Word Cloud</h3>
      <div className={styles.wordCloudWrapper}>
        <ReactWordcloud words={validWords} options={options} />
      </div>
    </div>
  );
}

export function WordCloud({ words }: WordCloudProps) {
  return (
    <WordCloudErrorBoundary words={words}>
      <WordCloudContent words={words} />
    </WordCloudErrorBoundary>
  );
}

