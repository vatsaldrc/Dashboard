import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Parse dates or use defaults
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const to = toDate ? new Date(toDate) : new Date();

    // Ensure dates are at start/end of day and convert to Date-only format for comparison
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    
    // For date-only fields, we compare dates directly
    const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());

    // Fetch BotpressAnalytics data
    const botpressData = await prisma.botpressAnalytics.findMany({
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

    // Aggregate BotpressAnalytics by date
    const botpressByDate = botpressData.reduce((acc, item) => {
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
    const chatbotByDate = chatbotData.reduce((acc, item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          avgMessageLength: 0,
          count: 0,
        };
      }
      if (item.avgMessageLength) {
        acc[dateKey].avgMessageLength += item.avgMessageLength;
        acc[dateKey].count += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate average message length per date
    Object.keys(chatbotByDate).forEach((date) => {
      if (chatbotByDate[date].count > 0) {
        chatbotByDate[date].avgMessageLength = chatbotByDate[date].avgMessageLength / chatbotByDate[date].count;
      }
    });

    // Aggregate sentiment
    const sentimentCounts = chatbotData.reduce((acc, item) => {
      if (item.sentiment) {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate requested_contact_channel
    const contactChannelCounts = chatbotData.reduce((acc, item) => {
      if (item.requestedContactChannel) {
        acc[item.requestedContactChannel] = (acc[item.requestedContactChannel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate customer_type
    const customerTypeCounts = chatbotData.reduce((acc, item) => {
      if (item.customerType) {
        acc[item.customerType] = (acc[item.customerType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate customer_region
    const customerRegionCounts = chatbotData.reduce((acc, item) => {
      if (item.customerRegion) {
        acc[item.customerRegion] = (acc[item.customerRegion] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Sum personal_contact_requested
    const personalContactRequested = chatbotData.reduce((sum, item) => sum + item.personalContactRequested, 0);

    // Sum avg_message_length
    const totalAvgMessageLength = chatbotData.reduce((sum, item) => {
      return sum + (item.avgMessageLength || 0);
    }, 0);

    // Collect all keywords
    const allKeywords: string[] = [];
    chatbotData.forEach((item) => {
      if (item.keywords) {
        try {
          const keywords = typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords;
          if (Array.isArray(keywords)) {
            allKeywords.push(...keywords);
          } else if (typeof keywords === 'object') {
            Object.keys(keywords).forEach((key) => {
              allKeywords.push(key);
            });
          } else if (typeof keywords === 'string') {
            allKeywords.push(keywords);
          }
        } catch {
          // If not JSON, treat as comma-separated string
          const keywords = item.keywords.split(',').map((k) => k.trim()).filter((k) => k);
          allKeywords.push(...keywords);
        }
      }
    });

    // Count keyword frequencies
    const keywordCounts = allKeywords.reduce((acc, keyword) => {
      const lower = keyword.toLowerCase();
      acc[lower] = (acc[lower] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array for word cloud
    const wordCloudData = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100); // Limit to top 100

    // Get summaries with conversation_id and created_at
    const summaries = chatbotData
      .filter((item) => item.summary)
      .map((item) => ({
        conversationId: item.conversationId,
        summary: item.summary,
        createdAt: item.createdAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      botpressByDate: Object.values(botpressByDate),
      chatbotByDate: Object.values(chatbotByDate),
      totals: {
        returningUsers: botpressData.reduce((sum, item) => sum + item.returningUsers, 0),
        newUsers: botpressData.reduce((sum, item) => sum + item.newUsers, 0),
        sessions: botpressData.reduce((sum, item) => sum + item.sessions, 0),
        totalMessages: botpressData.reduce((sum, item) => sum + item.totalMessages, 0),
        userMessages: botpressData.reduce((sum, item) => sum + item.userMessages, 0),
        botMessages: botpressData.reduce((sum, item) => sum + item.botMessages, 0),
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

