import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SignOutButton } from '@/components/ui/SignOutButton/SignOutButton';
import { AnalyticsTable } from '@/components/demo/AnalyticsTable';
import { prisma } from '@/lib/prisma';
import styles from './page.module.scss';

export default async function DemoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Lade BotpressAnalytics Daten
  const botpressAnalytics = await prisma.botpressAnalytics.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Lade ChatbotAnalytics Daten
  const chatbotAnalytics = await prisma.chatbotAnalytics.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Spalten für BotpressAnalytics
  const botpressColumns = [
    { key: 'id', label: 'ID' },
    { key: 'botId', label: 'Bot ID' },
    { key: 'date', label: 'Datum' },
    { key: 'syncDate', label: 'Sync Datum' },
    { key: 'returningUsers', label: 'Returning Users' },
    { key: 'newUsers', label: 'New Users' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'totalMessages', label: 'Total Messages' },
    { key: 'userMessages', label: 'User Messages' },
    { key: 'botMessages', label: 'Bot Messages' },
    { key: 'events', label: 'Events' },
    { key: 'eventTypes', label: 'Event Types' },
    { key: 'llmCalls', label: 'LLM Calls' },
    { key: 'llmErrors', label: 'LLM Errors' },
    { key: 'llmInputTokens', label: 'LLM Input Tokens' },
    { key: 'llmOutputTokens', label: 'LLM Output Tokens' },
    { key: 'llmLatencyMean', label: 'LLM Latency (ms)' },
    { key: 'llmCostSum', label: 'LLM Cost Sum' },
    { key: 'llmCostMean', label: 'LLM Cost Mean' },
    { key: 'hourlyRecordsCount', label: 'Hourly Records' },
    { key: 'createdAt', label: 'Erstellt am' },
  ];

  // Spalten für ChatbotAnalytics
  const chatbotColumns = [
    { key: 'botId', label: 'Bot ID' },
    { key: 'conversationId', label: 'Conversation ID' },
    { key: 'date', label: 'Datum' },
    { key: 'integration', label: 'Integration' },
    { key: 'totalMessages', label: 'Total Messages' },
    { key: 'userMessages', label: 'User Messages' },
    { key: 'botMessages', label: 'Bot Messages' },
    { key: 'avgMessageLength', label: 'Avg. Message Length' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'tags', label: 'Tags' },
    { key: 'summary', label: 'Summary' },
    { key: 'personalContactRequested', label: 'Contact Requested' },
    { key: 'requestedContactChannel', label: 'Contact Channel' },
    { key: 'customerType', label: 'Customer Type' },
    { key: 'customerRegion', label: 'Customer Region' },
    { key: 'createdAt', label: 'Erstellt am' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Demo</h1>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{session.user.email}</span>
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <AnalyticsTable
            title="Botpress Analytics"
            data={botpressAnalytics}
            columns={botpressColumns}
          />

          <AnalyticsTable
            title="Chatbot Analytics"
            data={chatbotAnalytics}
            columns={chatbotColumns}
          />
        </div>
      </main>
    </div>
  );
}

