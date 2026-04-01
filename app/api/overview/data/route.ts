import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientConfig } from '@/lib/clientConfig';
import {
  buildContactChannelCounts,
  buildCustomerTypeCounts,
  buildVermarktungsregionen,
} from '@/lib/leads-analytics';

export async function GET(request: NextRequest) {
  try {
    const config = getClientConfig();
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    console.log(`[API] Client: ${config.clientId} | Received dates: fromDate=${fromDate}, toDate=${toDate}`);

    let from: Date;
    let to: Date;

    if (fromDate) {
      const [year, month, day] = fromDate.split('-').map(Number);
      from = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      const [year, month, day] = toDate.split('-').map(Number);
      to = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      to = new Date();
      to.setHours(23, 59, 59, 999);
    }

    const fromDateOnly = from;
    const toDateOnly = to;
    console.log(`[API] Date Range: ${fromDateOnly.toISOString().split('T')[0]} to ${toDateOnly.toISOString().split('T')[0]}`);

    // ── Botpress API analytics ──────────────────────────────────────
    const botpressData = await prisma.botpressApiAnalytics.findMany({
      where: {
        date: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      orderBy: { date: 'asc' },
    });
    console.log(`[API] Botpress records found: ${botpressData.length}`);

    // ── Chatbot analytics ───────────────────────────────────────────
    const chatbotData = await prisma.chatbotAnalytics.findMany({
      where: {
        date: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      orderBy: { date: 'asc' },
    });
    console.log(`[API] Chatbot records found: ${chatbotData.length}`);

    // ── Leads (date-filtered) ───────────────────────────────────────
    const leadsData = await prisma.leads.findMany({
      where: {
        createdAt: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        conversationSummary: true,
        status: true,
        createdAt: true,
        conversationId: true,
        workflowExecutionId: true,
        // VRM-only fields — null on RYZE (column absent), Prisma returns undefined
        phone: config.leads.hasPhone ? true : false,
        postalCode: config.leads.hasPostalCode ? true : false,
        customerType: config.leads.hasCustomerType ? true : false,
        // RYZE-only fields
        position: config.leads.hasPosition ? true : false,
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`[API] Leads records found (date range): ${leadsData.length}`);

    // ── Booking started count ───────────────────────────────────────
    const workflowId = process.env.WORKFLOW_ID || 'wf-b493aa0010';
    const bookingStartedCount = await prisma.workflowExecutionLog.count({
      where: {
        workflowId,
        startedAt: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
    });

    // ── Avg words per message (incoming messages) ───────────────────
    const incomingMessages = await prisma.messages.findMany({
      where: {
        direction: 'incoming',
        createdAt: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      select: { payload: true },
    });

    let totalWords = 0;
    let totalParsedMessages = incomingMessages.length;

    incomingMessages.forEach((message: any) => {
      if (message.payload) {
        try {
          const payload =
            typeof message.payload === 'string'
              ? JSON.parse(message.payload)
              : message.payload;
          const text = payload.text || '';
          const wordCount = text
            .trim()
            .split(/\s+/)
            .filter((word: string) => word.length > 0).length;
          totalWords += wordCount;
        } catch {
          totalParsedMessages--;
        }
      } else {
        totalParsedMessages--;
      }
    });

    const avgWordsPerMessage =
      totalParsedMessages > 0 ? totalWords / totalParsedMessages : 0;

    // ── Aggregate: Botpress by date ─────────────────────────────────
    const botpressByDate: Record<string, any> = botpressData.reduce(
      (acc: Record<string, any>, item: any) => {
        const dateKey = item.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            returningUsers: 0,
            newUsers: 0,
            sessions: 0,
            totalMessages: 0,
            userMessages: 0,
            botMessages: 0,
          };
        }
        acc[dateKey].returningUsers += item.returningUsers;
        acc[dateKey].newUsers += item.newUsers;
        acc[dateKey].sessions += item.sessions;
        acc[dateKey].totalMessages += item.totalMessages;
        acc[dateKey].userMessages += item.userMessages;
        acc[dateKey].botMessages += item.botMessages;
        return acc;
      },
      {}
    );

    // ── Aggregate: Chatbot by date ──────────────────────────────────
    const chatbotByDate: Record<string, any> = chatbotData.reduce(
      (acc: Record<string, any>, item: any) => {
        const dateKey = item.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            totalCharacters: 0,
            totalMessages: 0,
            avgMessageLength: 0,
            personalContactRequested: 0,
          };
        }
        if (item.avgMessageLength && item.totalMessages) {
          acc[dateKey].totalCharacters +=
            item.avgMessageLength * item.totalMessages;
          acc[dateKey].totalMessages += item.totalMessages;
        }
        acc[dateKey].personalContactRequested += item.personalContactRequested;
        return acc;
      },
      {}
    );

    Object.keys(chatbotByDate).forEach((date) => {
      if (chatbotByDate[date].totalMessages > 0) {
        chatbotByDate[date].avgMessageLength =
          chatbotByDate[date].totalCharacters /
          chatbotByDate[date].totalMessages;
      }
    });

    // ── Aggregate: Sentiment ────────────────────────────────────────
    const sentimentCounts = chatbotData.reduce(
      (acc: Record<string, number>, item: any) => {
        if (item.sentiment) {
          acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // ── Aggregate: Leads by date ────────────────────────────────────
    const leadsByDate: Record<string, any> = leadsData.reduce(
      (acc: Record<string, any>, item: any) => {
        const dateKey =
          item.createdAt instanceof Date
            ? item.createdAt.toISOString().split('T')[0]
            : String(item.createdAt).split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, leadsCount: 0 };
        }
        acc[dateKey].leadsCount += 1;
        return acc;
      },
      {}
    );

    const personalContactRequested = leadsData.length;
    console.log(`[Leads] Total leads found: ${personalContactRequested}`);

    // ── Keywords & word cloud ───────────────────────────────────────
    const allKeywords: string[] = [];
    chatbotData.forEach((item: any) => {
      if (item.keywords) {
        try {
          const keywords =
            typeof item.keywords === 'string'
              ? JSON.parse(item.keywords)
              : item.keywords;
          if (Array.isArray(keywords)) {
            allKeywords.push(...keywords);
          } else if (typeof keywords === 'object') {
            Object.keys(keywords as Record<string, unknown>).forEach((key) =>
              allKeywords.push(key)
            );
          } else if (typeof keywords === 'string') {
            allKeywords.push(keywords);
          }
        } catch {
          const fallback = String(item.keywords)
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
          allKeywords.push(...fallback);
        }
      }
    });

    const keywordCounts = allKeywords.reduce(
      (acc: Record<string, number>, keyword: string) => {
        const lower = keyword.toLowerCase();
        acc[lower] = (acc[lower] || 0) + 1;
        return acc;
      },
      {}
    );

    const wordCloudData = Object.entries(keywordCounts)
      .map(([text, value]: [string, number]) => ({ text, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 100);

    // ── Summaries ───────────────────────────────────────────────────
    const summaries = chatbotData
      .filter((item: any) => item.summary)
      .map((item: any) => ({
        conversationId: item.conversationId,
        summary: item.summary,
        createdAt: item.syncDate,
      }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    // ── Client-gated aggregations ───────────────────────────────────
    const contactChannelCounts = config.charts.showContactChannelChart
      ? buildContactChannelCounts(leadsData)
      : null;

    const customerTypeCounts = config.charts.showCustomerTypeChart
      ? buildCustomerTypeCounts(leadsData)
      : null;

    const vermarktungsregionenCounts = config.charts.showVermarktungsregionen
      ? await buildVermarktungsregionen(leadsData)
      : null;

    // Customer region (postal code display) — VRM only
    const customerRegionCounts: Record<string, number> | null =
      config.leads.hasPostalCode
        ? leadsData.reduce((acc: Record<string, number>, item: any) => {
          if (item.postalCode) {
            const cleaned = String(item.postalCode)
              .replace(/[\\"'"]/g, '')
              .trim();
            if (cleaned) acc[cleaned] = (acc[cleaned] || 0) + 1;
          }
          return acc;
        }, {})
        : null;

    // ── Sankey (workflow funnel) ─────────────────────────────────────
    const fromDateTime = new Date(fromDateOnly);
    fromDateTime.setHours(0, 0, 0, 0);
    const toDateTime = new Date(toDateOnly);
    toDateTime.setHours(23, 59, 59, 999);

    let sankeyRawData: any[] = [];
    let sankeyData: any = null;
    if (config.charts.showSankeyChart) {
      sankeyRawData = await prisma.$queryRaw<
        { source: string; target: string; value: number }[]
      >`
WITH BaseEvents AS (
  SELECT 
    execution_id,
    conversation_id,
    activity,
    created_at,
    CASE
      WHEN LOWER(activity_data) IN ('telefon', 'phone') THEN 'contact_method_phone'
      WHEN LOWER(activity_data) IN ('e-mail', 'email') THEN 'contact_method_email'
      WHEN LOWER(activity_data) IN ('beides', 'both') THEN 'contact_method_both'
      ELSE 'contact_method_other'
    END AS contact_label,
    CASE
      WHEN LOWER(activity_data) IN ('b2b', 'business', 'geschäftskunde', 'geschäftskunde (b2b)') THEN 'customer_type_b2b'
      WHEN LOWER(activity_data) IN ('b2c', 'private', 'privatkunde', 'privatkunden') THEN 'customer_type_b2c'
      ELSE 'customer_type_other'
    END AS type_label
  FROM workflow_activity_logs
  WHERE created_at BETWEEN ${fromDateTime} AND ${toDateTime}
)

SELECT 'booking_started' AS source, contact_label AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents WHERE activity = 'booking_contact_method_selected'
GROUP BY contact_label

UNION ALL

SELECT 'booking_started' AS source, 'dropped' AS target, COUNT(DISTINCT w.execution_id) AS value
FROM workflow_execution_logs w
WHERE w.workflow_id = ${workflowId}
  AND w.started_at BETWEEN ${fromDateTime} AND ${toDateTime}
  AND NOT EXISTS (
    SELECT 1 FROM workflow_activity_logs a
    WHERE a.execution_id = w.execution_id
    AND a.activity = 'booking_contact_method_selected'
    AND a.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  )

UNION ALL

SELECT contact_label AS source, 'details_collected' AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents be
WHERE activity = 'booking_contact_method_selected'
AND EXISTS (
    SELECT 1 FROM workflow_activity_logs d 
    WHERE d.execution_id = be.execution_id 
    AND d.activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
)
GROUP BY contact_label

UNION ALL

SELECT 'details_collected' AS source, type_label AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents
WHERE activity = 'customer_type_selected'
GROUP BY type_label

UNION ALL

SELECT 
  be.type_label AS source,
  CASE 
    WHEN l.id IS NOT NULL THEN 'lead_created'
    ELSE 'dropped'
  END AS target,
  COUNT(DISTINCT be.execution_id) AS value
FROM BaseEvents be
LEFT JOIN leads l 
ON be.execution_id = l.workflow_execution_id
   OR be.conversation_id = l.conversation_id
WHERE be.activity = 'customer_type_selected'
GROUP BY be.type_label, target

UNION ALL

SELECT
  CASE
    WHEN LOWER(l.customer_type) IN ('b2b') THEN 'customer_type_b2b'
    WHEN LOWER(l.customer_type) IN ('b2c') THEN 'customer_type_b2c'
    ELSE 'customer_type_other'
  END AS source,
  'lead_created' AS target,
  COUNT(DISTINCT l.id) AS value
FROM leads l
WHERE l.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  AND NOT EXISTS (
    SELECT 1 FROM workflow_activity_logs wa
    WHERE (wa.execution_id = l.workflow_execution_id OR wa.conversation_id = l.conversation_id)
    AND wa.activity = 'customer_type_selected'
    AND wa.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  )
GROUP BY 1

UNION ALL

SELECT contact_label AS source, 'dropped' AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents be
WHERE activity = 'booking_contact_method_selected'
AND NOT EXISTS (
    SELECT 1 FROM workflow_activity_logs d 
    WHERE d.execution_id = be.execution_id 
    AND d.activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
)
GROUP BY contact_label

UNION ALL

SELECT 'details_collected' AS source, 'dropped' AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents d
WHERE activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
AND NOT EXISTS (
    SELECT 1 FROM BaseEvents ct 
    WHERE ct.execution_id = d.execution_id AND ct.activity = 'customer_type_selected'
)
GROUP BY target;
`;
    }
    if (config.charts.showSankeyChart) {
      sankeyData = {
        nodes: Array.from(
          new Set(sankeyRawData.flatMap((row) => [row.source, row.target]))
        ).map((id) => ({ id })),
        links: sankeyRawData.map((row) => ({
          source: row.source,
          target: row.target,
          value: Number(row.value),
        })),
      };
    }
      

    // ── Response ────────────────────────────────────────────────────
    return NextResponse.json({
      botpressByDate: Object.values(botpressByDate),
      chatbotByDate: Object.values(chatbotByDate),
      personalContactRequestedByDate: Object.values(leadsByDate).map(
        (item: any) => ({
          date: item.date,
          personalContactRequested: item.leadsCount,
        })
      ),
      totals: {
        returningUsers: botpressData.reduce(
          (sum: number, item: any) => sum + item.returningUsers,
          0
        ),
        newUsers: botpressData.reduce(
          (sum: number, item: any) => sum + item.newUsers,
          0
        ),
        sessions: botpressData.reduce(
          (sum: number, item: any) => sum + item.sessions,
          0
        ),
        totalMessages: botpressData.reduce(
          (sum: number, item: any) => sum + item.totalMessages,
          0
        ),
        userMessages: botpressData.reduce(
          (sum: number, item: any) => sum + item.userMessages,
          0
        ),
        botMessages: botpressData.reduce(
          (sum: number, item: any) => sum + item.botMessages,
          0
        ),
        avgWordsPerMessage,
        personalContactRequested,
        bookingStartedCount,
      },
      sentimentCounts,
      // null when not applicable for this client — frontend checks before rendering
      contactChannelCounts,
      customerTypeCounts,
      customerRegionCounts,
      vermarktungsregionenCounts,
      wordCloudData,
      summaries,
      sankeyData,
      // Let the frontend know which charts to render without it needing to import clientConfig
      clientFeatures: config.charts,
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}