import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBotpressAnalytics() {
  console.log('🌱 Starte BotpressAnalytics Seed-Prozess...');

  // Lösche vorhandene Analytics-Daten
  // @ts-ignore - Model könnte noch nicht im generierten Client sein
  await prisma.botpressAnalytics.deleteMany({});
  console.log('✅ Vorhandene BotpressAnalytics-Daten gelöscht');

  // Berechne Datumswerte
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Erstelle Demodaten für verschiedene Zeiträume
  const analyticsData = [
    {
      rangeLabel: 'last_24_hours',
      startDatetimeUtc: last24Hours,
      endDatetimeUtc: now,
      returningUsers: 50,
      newUsers: 10,
      sessions: 60,
      totalMessages: 200,
      userMessages: 120,
      botMessages: 80,
      events: 15,
      eventTypes: JSON.stringify(['click', 'input']),
      llmCalls: 25,
      llmErrors: 2,
      llmInputTokens: 15000,
      llmOutputTokens: 14000,
      llmLatencyMean: 200.0,
      llmCostSum: 0.75,
      llmCostMean: 0.03,
    },
    {
      rangeLabel: 'last_7_days',
      startDatetimeUtc: last7Days,
      endDatetimeUtc: now,
      returningUsers: 300,
      newUsers: 70,
      sessions: 370,
      totalMessages: 1200,
      userMessages: 700,
      botMessages: 500,
      events: 90,
      eventTypes: JSON.stringify(['click', 'input', 'navigation']),
      llmCalls: 120,
      llmErrors: 10,
      llmInputTokens: 75000,
      llmOutputTokens: 70000,
      llmLatencyMean: 210.0,
      llmCostSum: 3.5,
      llmCostMean: 0.03,
    },
    {
      rangeLabel: 'last_30_days',
      startDatetimeUtc: last30Days,
      endDatetimeUtc: now,
      returningUsers: 1200,
      newUsers: 350,
      sessions: 1550,
      totalMessages: 5000,
      userMessages: 3000,
      botMessages: 2000,
      events: 420,
      eventTypes: JSON.stringify(['click', 'input', 'navigation', 'survey']),
      llmCalls: 480,
      llmErrors: 25,
      llmInputTokens: 300000,
      llmOutputTokens: 280000,
      llmLatencyMean: 220.0,
      llmCostSum: 14.0,
      llmCostMean: 0.029,
    },
  ];

  // Füge Daten zur Datenbank hinzu
  for (const data of analyticsData) {
    // @ts-ignore - Model könnte noch nicht im generierten Client sein
    await prisma.botpressAnalytics.create({
      data,
    });
    console.log(`✅ ${data.rangeLabel} Daten erstellt`);
  }

  console.log('🎉 Seed-Prozess abgeschlossen!');
}

async function seedChatbotAnalytics() {
  console.log('🌱 Starte ChatbotAnalytics Seed-Prozess...');

  // Lösche vorhandene ChatbotAnalytics-Daten
  // @ts-ignore
  await prisma.chatbotAnalytics.deleteMany({});
  console.log('✅ Vorhandene ChatbotAnalytics-Daten gelöscht');

  // Erstelle Demodaten für Konversationen
  const now = new Date();
  const conversationsData = [
    {
      botId: 1,
      conversationId: 'conv_001',
      date: new Date('2025-11-10'),
      integration: 'Webchat',
      totalMessages: 12,
      userMessages: 6,
      botMessages: 6,
      avgMessageLength: 45.3,
      sentiment: 'positive',
      keywords: JSON.stringify(['angebot', 'support', 'kontakt']),
      tags: JSON.stringify(['sales', 'lead']),
      summary: 'User asked for product pricing and contact info',
      personalContactRequested: 1,
      requestedContactChannel: 'Telefon',
      customerType: 'Geschäftskunden',
      customerRegion: '80331',
      createdAt: new Date('2025-11-10T14:22:00'),
    },
    {
      botId: 2,
      conversationId: 'conv_002',
      date: new Date('2025-11-09'),
      integration: 'WhatsApp',
      totalMessages: 8,
      userMessages: 5,
      botMessages: 3,
      avgMessageLength: 38.5,
      sentiment: 'neutral',
      keywords: JSON.stringify(['hilfe', 'konto', 'login']),
      tags: JSON.stringify(['support', 'authentication']),
      summary: 'User requested help with login issue',
      personalContactRequested: 0,
      requestedContactChannel: null,
      customerType: 'Privatkunden',
      customerRegion: '10115',
      createdAt: new Date('2025-11-09T09:05:00'),
    },
    {
      botId: 3,
      conversationId: 'conv_003',
      date: new Date('2025-11-11'),
      integration: 'Slack',
      totalMessages: 15,
      userMessages: 7,
      botMessages: 8,
      avgMessageLength: 52.7,
      sentiment: 'positive',
      keywords: JSON.stringify(['termin', 'beratung', 'angebot']),
      tags: JSON.stringify(['consulting', 'lead']),
      summary: 'Conversation about scheduling a consultation',
      personalContactRequested: 1,
      requestedContactChannel: 'E-Mail',
      customerType: 'Geschäftskunden',
      customerRegion: '20095',
      createdAt: new Date('2025-11-11T11:45:00'),
    },
    {
      botId: 4,
      conversationId: 'conv_004',
      date: new Date('2025-11-08'),
      integration: 'Webchat',
      totalMessages: 10,
      userMessages: 5,
      botMessages: 5,
      avgMessageLength: 30.9,
      sentiment: 'negative',
      keywords: JSON.stringify(['problem', 'lieferung', 'beschwerde']),
      tags: JSON.stringify(['complaint']),
      summary: 'User expressed dissatisfaction about delivery delay',
      personalContactRequested: 0,
      requestedContactChannel: null,
      customerType: 'Privatkunden',
      customerRegion: '50667',
      createdAt: new Date('2025-11-08T17:20:00'),
    },
    {
      botId: 5,
      conversationId: 'conv_005',
      date: new Date('2025-11-11'),
      integration: 'E-Mail',
      totalMessages: 6,
      userMessages: 3,
      botMessages: 3,
      avgMessageLength: 40.1,
      sentiment: 'neutral',
      keywords: JSON.stringify(['rechnung', 'status', 'zahlung']),
      tags: JSON.stringify(['billing', 'info-request']),
      summary: 'User asked for invoice payment status',
      personalContactRequested: 1,
      requestedContactChannel: 'Beides',
      customerType: 'Geschäftskunden',
      customerRegion: '70173',
      createdAt: new Date('2025-11-11T10:10:00'),
    },
  ];

  // Füge Daten zur Datenbank hinzu
  for (const data of conversationsData) {
    // @ts-ignore
    await prisma.chatbotAnalytics.create({
      data,
    });
    console.log(`✅ ${data.conversationId} Daten erstellt`);
  }

  console.log('🎉 ChatbotAnalytics Seed-Prozess abgeschlossen!');
}

async function main() {
  await seedBotpressAnalytics();
  await seedChatbotAnalytics();
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seed-Prozess:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

