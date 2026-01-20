import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPLZMapping } from '@/lib/plz-mapping';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    console.log(`[API] Received dates: fromDate=${fromDate}, toDate=${toDate}`);

    // Parse dates as local dates (not UTC)
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

    // Convert to UTC dates for database comparison
    const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());

    console.log(`[API] Date Range: ${fromDateOnly.toISOString().split('T')[0]} to ${toDateOnly.toISOString().split('T')[0]}`);

    // Fetch Botpress API analytics data
    const botpressData = await prisma.botpressApiAnalytics.findMany({
      where: {
        date: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log(`[API] Botpress records found: ${botpressData.length}`);

    // Fetch ChatbotAnalytics data
    const chatbotData = await prisma.chatbotAnalytics.findMany({
      where: {
        date: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log(`[API] Chatbot records found: ${chatbotData.length}`);

    // Aggregate Botpress API analytics by date
    const botpressByDate: Record<string, {
      date: string;
      returningUsers: number;
      newUsers: number;
      sessions: number;
      totalMessages: number;
      userMessages: number;
      botMessages: number;
    }> = botpressData.reduce((acc: Record<string, any>, item: any) => {
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
    }, {} as Record<string, any>);

    // Aggregate ChatbotAnalytics
    const chatbotByDate: Record<string, {
      date: string;
      avgMessageLength: number;
      count: number;
      personalContactRequested: number;
    }> = chatbotData.reduce((acc: Record<string, any>, item: any) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          avgMessageLength: 0,
          count: 0,
          personalContactRequested: 0,
        };
      }
      if (item.avgMessageLength) {
        acc[dateKey].avgMessageLength += item.avgMessageLength;
        acc[dateKey].count += 1;
      }
      acc[dateKey].personalContactRequested += item.personalContactRequested;
      return acc;
    }, {} as Record<string, any>);

    // Calculate average message length per date
    Object.keys(chatbotByDate).forEach((date) => {
      if (chatbotByDate[date].count > 0) {
        chatbotByDate[date].avgMessageLength = chatbotByDate[date].avgMessageLength / chatbotByDate[date].count;
      }
    });

    // Aggregate sentiment
    const sentimentCounts = chatbotData.reduce((acc: Record<string, number>, item: any) => {
      if (item.sentiment) {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate requested_contact_channel
    const contactChannelCounts = chatbotData.reduce((acc: Record<string, number>, item: any) => {
      if (item.requestedContactChannel) {
        acc[item.requestedContactChannel] = (acc[item.requestedContactChannel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate customer_type
    const customerTypeCounts = chatbotData.reduce((acc: Record<string, number>, item: any) => {
      if (item.customerType) {
        acc[item.customerType] = (acc[item.customerType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate customer_region with postal code mapping
    const customerRegionCounts: Record<string, number> = {};
    const plzMapping = await getPLZMapping();
    
    console.log(`[API] PLZ Mapping size: ${Object.keys(plzMapping).length}`);
    console.log(`[API] Processing ${chatbotData.length} chatbot records`);
    
    const postalCodesToLookup = new Set<string>();
    for (const item of chatbotData) {
      if (item.customerRegion) {
        postalCodesToLookup.add(item.customerRegion);
      }
    }
    console.log(`[API] Unique postal codes in data: ${Array.from(postalCodesToLookup).join(', ')}`);
    
    for (const item of chatbotData) {
      if (item.customerRegion) {
        const regionName = plzMapping[item.customerRegion] || item.customerRegion;
        if (plzMapping[item.customerRegion]) {
          console.log(`[API] ✓ ${item.customerRegion} → ${regionName}`);
        } else {
          console.warn(`[API] ✗ ${item.customerRegion} not found in mapping`);
        }
        customerRegionCounts[regionName] = (customerRegionCounts[regionName] || 0) + 1;
      }
    }

    // Sum personal_contact_requested
    const personalContactRequested = chatbotData.reduce((sum: number, item: any) => sum + item.personalContactRequested, 0);

    // Sum avg_message_length
    const totalAvgMessageLength = chatbotData.reduce((sum: number, item: any) => {
      return sum + (item.avgMessageLength || 0);
    }, 0);

    // Collect all keywords
    const allKeywords: string[] = [];
    chatbotData.forEach((item: any) => {
      if (item.keywords) {
        try {
          const keywords = typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords;
          if (Array.isArray(keywords)) {
            allKeywords.push(...keywords);
          } else if (typeof keywords === 'object') {
            Object.keys(keywords as Record<string, unknown>).forEach((key: string) => {
              allKeywords.push(key);
            });
          } else if (typeof keywords === 'string') {
            allKeywords.push(keywords);
          }
        } catch {
          // If not JSON, treat as comma-separated string
          const fallbackKeywords = String(item.keywords)
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
          allKeywords.push(...fallbackKeywords);
        }
      }
    });

    // Count keyword frequencies
    const keywordCounts = allKeywords.reduce((acc: Record<string, number>, keyword: string) => {
      const lower = keyword.toLowerCase();
      acc[lower] = (acc[lower] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array for word cloud
    const wordCloudData = Object.entries(keywordCounts)
      .map(([text, value]: [string, number]) => ({ text, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 100); // Limit to top 100

    // Get summaries with conversation_id and created_at
    const summaries = chatbotData
      .filter((item: any) => item.summary)
      .map((item: any) => ({
        conversationId: item.conversationId,
        summary: item.summary,
        createdAt: item.syncDate,
      }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      botpressByDate: Object.values(botpressByDate),
      chatbotByDate: Object.values(chatbotByDate),
      personalContactRequestedByDate: Object.values(chatbotByDate).map((item: any) => ({
        date: item.date,
        personalContactRequested: item.personalContactRequested,
      })),
      totals: {
        returningUsers: botpressData.reduce((sum: number, item: any) => sum + item.returningUsers, 0),
        newUsers: botpressData.reduce((sum: number, item: any) => sum + item.newUsers, 0),
        sessions: botpressData.reduce((sum: number, item: any) => sum + item.sessions, 0),
        totalMessages: botpressData.reduce((sum: number, item: any) => sum + item.totalMessages, 0),
        userMessages: botpressData.reduce((sum: number, item: any) => sum + item.userMessages, 0),
        botMessages: botpressData.reduce((sum: number, item: any) => sum + item.botMessages, 0),
        avgMessageLength: totalAvgMessageLength,
        personalContactRequested,
      },
      sentimentCounts,
      contactChannelCounts,
      customerTypeCounts,
      customerRegionCounts,
      wordCloudData,
      summaries,
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}

