import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Fetch Leads data
    const leadsData = await prisma.leads.findMany({
      where: {
        createdAt: {
          gte: new Date(fromDateOnly),
          lte: new Date(toDateOnly),
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        postalCode: true,
        company: true,
        customerType: true,
        conversationSummary: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        conversationId: true,
        workflowExecutionId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`[API] Leads records found: ${leadsData.length}`);

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

    // Aggregate customer_type from leads table
    const customerTypeCounts = leadsData.reduce((acc: Record<string, number>, item: any) => {
      if (item.customerType) {
        acc[item.customerType] = (acc[item.customerType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Log raw postal codes from leads table
    const rawPostalCodes = new Set<string>();
    for (const item of leadsData) {
      if (item.postalCode) {
        rawPostalCodes.add(String(item.postalCode));
      }
    }
    console.log(`[PLZ Debug] Raw postal codes from leads table: ${Array.from(rawPostalCodes).map(p => JSON.stringify(p)).join(', ')}`);

    // Aggregate postal codes from leads table - display postal codes (cleaned)
    const customerRegionCounts: Record<string, number> = {};
    
    for (const item of leadsData) {
      if (item.postalCode) {
        // Clean up postal code - remove all quotes and backslashes
        const cleanedPostalCode = String(item.postalCode)
          .replace(/[\\"'"]/g, '')
          .trim();
        if (cleanedPostalCode) {
          customerRegionCounts[cleanedPostalCode] = (customerRegionCounts[cleanedPostalCode] || 0) + 1;
        }
      }
    }
    
    console.log(`[PLZ Debug] Cleaned postal codes for PLZ chart: ${Object.keys(customerRegionCounts).map(p => JSON.stringify(p)).join(', ')}`);
    console.log(`[PLZ Debug] PLZ chart counts:`, customerRegionCounts);

    // Aggregate Vermarktungsregionen (marketing regions) by mapping postal codes from leads table to their "map" column
    const postalCodes = new Set<string>();
    for (const item of leadsData) {
      if (item.postalCode) {
        // Clean up postal code - remove all quotes (both single and double, including escaped ones), whitespace, and backslashes
        const cleanedPostalCode = String(item.postalCode)
          .replace(/[\\"'"]/g, '')
          .trim();
        // Only include valid 5-digit German postal codes
        if (cleanedPostalCode && /^\d{5}$/.test(cleanedPostalCode)) {
          postalCodes.add(cleanedPostalCode);
        }
      }
    }

    console.log(`[Vermarktungsregionen] Found ${postalCodes.size} unique postal codes: ${Array.from(postalCodes).join(', ')}`);

    // Get mapping from postal_mp table
    const postalMappings = await prisma.postalMP.findMany({
      where: {
        postalCode: {
          in: Array.from(postalCodes),
        },
      },
    });

    console.log(`[Vermarktungsregionen] Found ${postalMappings.length} mappings in postal_mp table`);
    postalMappings.forEach((mapping: any) => {
      console.log(`[Vermarktungsregionen] ✓ ${mapping.postalCode} → ${mapping.mp}`);
    });

    // Create postal code to region map
    const postalToMapRegion: Record<string, string> = {};
    for (const mapping of postalMappings) {
      postalToMapRegion[mapping.postalCode] = mapping.mp;
    }

    console.log(`[Vermarktungsregionen] Created mapping with ${Object.keys(postalToMapRegion).length} entries`);

    // Aggregate by map region - only include valid mapped postal codes (exclude test data)
    const vermarktungsregionenCounts: Record<string, number> = {};
    const mappedCount: Record<string, number> = { mapped: 0, unmapped: 0 };
    
    for (const item of leadsData) {
      if (item.postalCode) {
        // Clean up postal code - remove all quotes and backslashes
        const cleanedPostalCode = String(item.postalCode)
          .replace(/[\\"'"]/g, '')
          .trim();
        
        // Only process valid 5-digit German postal codes
        if (/^\d{5}$/.test(cleanedPostalCode)) {
          if (postalToMapRegion[cleanedPostalCode]) {
            const mapRegion = postalToMapRegion[cleanedPostalCode];
            // Exclude "test" region from results
            if (mapRegion !== 'test') {
              mappedCount.mapped++;
              console.log(`[Vermarktungsregionen] ✓ ${cleanedPostalCode} → ${mapRegion}`);
              vermarktungsregionenCounts[mapRegion] = (vermarktungsregionenCounts[mapRegion] || 0) + 1;
            } else {
              console.log(`[Vermarktungsregionen] ⊘ ${cleanedPostalCode} → test (skipped)`);
            }
          } else {
            // Valid postal code NOT found in mapping - skip it
            mappedCount.unmapped++;
            console.log(`[Vermarktungsregionen] ✗ ${cleanedPostalCode} → Not in mapping (skipped)`);
          }
        } else {
          // Invalid test postal code - skip it
          console.log(`[Vermarktungsregionen] ⊘ ${cleanedPostalCode} → Invalid format (skipped)`);
        }
      }
    }

    console.log(`[Vermarktungsregionen] Aggregation complete: ${mappedCount.mapped} mapped, ${mappedCount.unmapped} unmapped`);
    console.log(`[Vermarktungsregionen] Final regions:`, Object.entries(vermarktungsregionenCounts).map(([region, count]) => `${region} (${count})`).join(', '));

    // Aggregate Leads by date
    const leadsByDate: Record<string, {
      date: string;
      leadsCount: number;
    }> = leadsData.reduce((acc: Record<string, any>, item: any) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          leadsCount: 0,
        };
      }
      acc[dateKey].leadsCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // Count total leads as personal contact requests
    const personalContactRequested = leadsData.length;
    
    console.log(`[Leads] Total leads found: ${personalContactRequested}`);

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
      personalContactRequestedByDate: Object.values(leadsByDate).map((item: any) => ({
        date: item.date,
        personalContactRequested: item.leadsCount,
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
      vermarktungsregionenCounts,
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

