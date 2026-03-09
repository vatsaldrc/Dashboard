'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './WordCloud.module.scss';
import { WordCloudErrorBoundary } from './WordCloudErrorBoundary';

interface WordCloudProps {
  words: Array<{ text: string; value: number }>;
}

const ReactD3Cloud = dynamic(() => import("react-d3-cloud"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Lade Word Cloud...</div>,
}) as any;

function WordCloudContent({ words }: WordCloudProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validWords =
    words
      ?.filter((w) => w?.text && typeof w.value === "number" && w.value > 0)
      .map((w) => ({ text: w.text, value: w.value })) || [];

  if (!words || words.length === 0 || validWords.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Word Cloud</h3>
        <p className={styles.empty}>Keine Keywords vorhanden</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Word Cloud</h3>
        <div className={styles.wordCloudWrapper}>
          <div className={styles.loading}>Lade Word Cloud...</div>
        </div>
      </div>
    );
  }

  const fontSizeMapper = (word: { value: number }) =>
    Math.max(12, Math.min(60, Math.sqrt(word.value) * 8));

  const rotate = () => {
    const rotations = [-90, 0];
    return rotations[Math.floor(Math.random() * rotations.length)];
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Word Cloud</h3>
      <div className={styles.wordCloudWrapper}>
        <ReactD3Cloud
          words={validWords}
          width={500}
          height={300}
          font="var(--font-family-sans)"
          fontSize={fontSizeMapper}
          rotate={rotate}
          padding={5}
        />
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

