'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SignOutButton } from '@/components/ui/SignOutButton/SignOutButton';
import { ReturningUsersChart } from '@/components/overview/ReturningUsersChart';
import { NewUsersChart } from '@/components/overview/NewUsersChart';
import { SessionsChart } from '@/components/overview/SessionsChart';
// import { TotalMessagesChart } from '@/components/overview/TotalMessagesChart';
import { UserMessagesChart } from '@/components/overview/UserMessagesChart';
// import { BotMessagesChart } from '@/components/overview/BotMessagesChart';
import { PersonalContactRequestsChart } from '@/components/overview/PersonalContactRequestsChart';
import { StatsOverviewCard } from '@/components/overview/StatsOverviewCard';
import { SentimentChart } from '@/components/overview/SentimentChart';
import { ContactChannelChart } from '@/components/overview/ContactChannelChart';
import { CustomerTypeChart } from '@/components/overview/CustomerTypeChart';
import { CustomerRegionChart } from '@/components/overview/CustomerRegionChart';
import { WordCloud } from '@/components/overview/WordCloud';
import { SummaryList } from '@/components/overview/SummaryList';
import styles from './page.module.scss';

interface OverviewData {
  botpressByDate: Array<{
    date: string;
    returningUsers: number;
    newUsers: number;
    sessions: number;
    totalMessages: number;
    userMessages: number;
    botMessages: number;
  }>;
  chatbotByDate: Array<{
    date: string;
    avgMessageLength: number;
  }>;
  personalContactRequestedByDate: Array<{
    date: string;
    personalContactRequested: number;
  }>;
  totals: {
    returningUsers: number;
    newUsers: number;
    sessions: number;
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    avgMessageLength: number;
    personalContactRequested: number;
  };
  sentimentCounts: Record<string, number>;
  contactChannelCounts: Record<string, number>;
  customerTypeCounts: Record<string, number>;
  customerRegionCounts: Record<string, number>;
  wordCloudData: Array<{ text: string; value: number }>;
  summaries: Array<{
    conversationId: string;
    summary: string | null;
    createdAt: string;
  }>;
}

export default function OverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [toDate, setToDate] = useState<Date>(new Date());
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fromDate, toDate, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/overview/data?fromDate=${fromDateStr}&toDate=${toDateStr}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Lade Daten...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Keine Daten verfügbar</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Overview</h1>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{session.user?.email}</span>
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.datePickerContainer}>
            <div className={styles.datePickerGroup}>
              <label className={styles.label}>Von Datum:</label>
              <DatePicker
                selected={fromDate}
                onChange={(date: Date | null) => date && setFromDate(date)}
                selectsStart
                startDate={fromDate}
                endDate={toDate}
                dateFormat="dd.MM.yyyy"
                className={styles.datePicker}
              />
            </div>
            <div className={styles.datePickerGroup}>
              <label className={styles.label}>Bis Datum:</label>
              <DatePicker
                selected={toDate}
                onChange={(date: Date | null) => date && setToDate(date)}
                selectsEnd
                startDate={fromDate}
                endDate={toDate}
                minDate={fromDate}
                dateFormat="dd.MM.yyyy"
                className={styles.datePicker}
              />
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <NewUsersChart
              total={data.totals.newUsers}
              dataByDate={data.botpressByDate}
            />
            <SessionsChart
              total={data.totals.sessions}
              dataByDate={data.botpressByDate}
            />
            {/* <TotalMessagesChart
              total={data.totals.totalMessages}
              dataByDate={data.botpressByDate}
            /> */}
            <UserMessagesChart
              total={data.totals.userMessages}
              dataByDate={data.botpressByDate}
            />
            {/* <BotMessagesChart
              total={data.totals.botMessages}
              dataByDate={data.botpressByDate}
            /> */}
            <PersonalContactRequestsChart
              total={data.totals.personalContactRequested}
              dataByDate={data.personalContactRequestedByDate}
            />
            <StatsOverviewCard
              avgMessageLength={data.totals.avgMessageLength}
              personalContactRequested={data.totals.personalContactRequested}
            />
            <SentimentChart data={data.sentimentCounts} />
            <ContactChannelChart data={data.contactChannelCounts} />
            <CustomerTypeChart data={data.customerTypeCounts} />
            <CustomerRegionChart data={data.customerRegionCounts} />
            <WordCloud words={data.wordCloudData} />
            <SummaryList summaries={data.summaries} />
          </div>
        </div>
      </main>
    </div>
  );
}
