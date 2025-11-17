import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBotpressAnalytics() {
  console.log('🌱 Starte BotpressAnalytics Seed-Prozess...');

  // Lösche vorhandene Analytics-Daten
  // @ts-ignore - Model könnte noch nicht im generierten Client sein
  await prisma.botpressAnalytics.deleteMany({});
  console.log('✅ Vorhandene BotpressAnalytics-Daten gelöscht');

  // Erstelle Demodaten basierend auf dem Schema
  const analyticsData = [
    {
      botId: 'bot_001',
      date: new Date('2025-11-10'),
      returningUsers: 5,
      newUsers: 2,
      sessions: 7,
      totalMessages: 85,
      userMessages: 48,
      botMessages: 37,
      events: 3,
      eventTypes: JSON.stringify({ session_start: 3 }),
      llmCalls: 55,
      llmErrors: 1,
      llmInputTokens: 120500,
      llmOutputTokens: 4500,
      llmLatencyMean: 2100.4,
      llmCostSum: 0.52011,
      llmCostMean: 0.00946,
      hourlyRecordsCount: 3,
      createdAt: new Date('2025-11-10T23:59:00'),
      syncDate: new Date('2025-11-10'),
    },
    {
      botId: 'bot_001',
      date: new Date('2025-11-09'),
      returningUsers: 3,
      newUsers: 1,
      sessions: 4,
      totalMessages: 42,
      userMessages: 20,
      botMessages: 22,
      events: 1,
      eventTypes: JSON.stringify({ state_expired: 1 }),
      llmCalls: 22,
      llmErrors: 0,
      llmInputTokens: 50220,
      llmOutputTokens: 2100,
      llmLatencyMean: 1850.2,
      llmCostSum: 0.19920,
      llmCostMean: 0.00905,
      hourlyRecordsCount: 1,
      createdAt: new Date('2025-11-09T23:50:00'),
      syncDate: new Date('2025-11-09'),
    },
    {
      botId: 'bot_002',
      date: new Date('2025-11-11'),
      returningUsers: 7,
      newUsers: 3,
      sessions: 10,
      totalMessages: 110,
      userMessages: 60,
      botMessages: 50,
      events: 4,
      eventTypes: JSON.stringify({ button_click: 2, flow_end: 2 }),
      llmCalls: 70,
      llmErrors: 2,
      llmInputTokens: 180340,
      llmOutputTokens: 6020,
      llmLatencyMean: 2540.8,
      llmCostSum: 0.64055,
      llmCostMean: 0.00915,
      hourlyRecordsCount: 4,
      createdAt: new Date('2025-11-11T20:20:00'),
      syncDate: new Date('2025-11-11'),
    },
    {
      botId: 'bot_003',
      date: new Date('2025-11-08'),
      returningUsers: 2,
      newUsers: 0,
      sessions: 2,
      totalMessages: 18,
      userMessages: 9,
      botMessages: 9,
      events: 1,
      eventTypes: JSON.stringify({ unknown_intent: 1 }),
      llmCalls: 12,
      llmErrors: 0,
      llmInputTokens: 14000,
      llmOutputTokens: 900,
      llmLatencyMean: 1750.6,
      llmCostSum: 0.08810,
      llmCostMean: 0.00734,
      hourlyRecordsCount: 1,
      createdAt: new Date('2025-11-08T18:10:00'),
      syncDate: new Date('2025-11-08'),
    },
    {
      botId: 'bot_003',
      date: new Date('2025-11-12'),
      returningUsers: 4,
      newUsers: 1,
      sessions: 5,
      totalMessages: 51,
      userMessages: 25,
      botMessages: 26,
      events: 2,
      eventTypes: JSON.stringify({ flow_start: 1, flow_end: 1 }),
      llmCalls: 30,
      llmErrors: 1,
      llmInputTokens: 72000,
      llmOutputTokens: 2800,
      llmLatencyMean: 1980.5,
      llmCostSum: 0.21095,
      llmCostMean: 0.00703,
      hourlyRecordsCount: 2,
      createdAt: new Date('2025-11-12T21:05:00'),
      syncDate: new Date('2025-11-12'),
    },
  ];

  // Füge Daten zur Datenbank hinzu
  for (const data of analyticsData) {
    // @ts-ignore - Model könnte noch nicht im generierten Client sein
    await prisma.botpressAnalytics.create({
      data,
    });
    console.log(`✅ Bot ${data.botId} - ${data.date.toISOString().split('T')[0]} Daten erstellt`);
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
  const conversationsData = [
    {
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

