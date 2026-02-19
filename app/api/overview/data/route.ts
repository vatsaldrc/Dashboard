import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
      to = new Date(year, month - 1, day, 23, 59, 59, 999); // Set to end of day for inclusive filtering
    } else {
      to = new Date();
      to.setHours(23, 59, 59, 999);
    }

    // Convert to UTC dates for database comparison

    const fromDateOnly = from;
    const toDateOnly = to;
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
          gte: fromDateOnly,
          lte: toDateOnly,
        },
        // workflowExecutionId: {
        //   not: null, // ONLY fetch leads that came from a workflow
        // },
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

    // Count booking started from workflow_execution_logs table
    const bookingStartedCount = await prisma.workflowExecutionLog.count({
      where: {
        workflowId: 'wf-b493aa0010',
        startedAt: {
          gte: fromDateOnly,
          lte: toDateOnly,
        },
      },
    });

    // Fetch Leads data for all time (for postal code based charts)
    const leadsDataForPostalCodes = await prisma.leads.findMany({
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

    console.log(`[API] Leads records found (for date range): ${leadsData.length}`);
    console.log(`[API] All leads records found (for postal codes): ${leadsDataForPostalCodes.length}`);

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
      totalCharacters: number;      // NEW: sum of all characters
      totalMessages: number;         // NEW: sum of all messages
      avgMessageLength: number;
      personalContactRequested: number;
    }> = chatbotData.reduce((acc: Record<string, any>, item: any) => {
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

      // Key insight: avgMessageLength × totalMessages = total characters in conversation
      if (item.avgMessageLength && item.totalMessages) {
        const conversationTotalChars = item.avgMessageLength * item.totalMessages;
        acc[dateKey].totalCharacters += conversationTotalChars;
        acc[dateKey].totalMessages += item.totalMessages;
      }

      acc[dateKey].personalContactRequested += item.personalContactRequested;
      return acc;
    }, {} as Record<string, any>);

    // Now calculate the correct average per date
    Object.keys(chatbotByDate).forEach((date) => {
      if (chatbotByDate[date].totalMessages > 0) {
        chatbotByDate[date].avgMessageLength =
          chatbotByDate[date].totalCharacters / chatbotByDate[date].totalMessages;
      }
    });

    // Aggregate sentiment
    const sentimentCounts = chatbotData.reduce((acc: Record<string, number>, item: any) => {
      if (item.sentiment) {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Aggregate preferred contact channels from leads table (phone and email)
    // Count all available contact channels (not exclusive categories) - date-filtered
    const contactChannelCounts: Record<string, number> = { 'Telefon': 0, 'E-Mail': 0, 'Beides': 0 };
    for (const item of leadsData) {
      // Check if phone exists and is not null/empty
      const hasPhone = item.phone && String(item.phone).replace(/["\s]/g, '').trim().length > 0;
      // Check if email exists and is not null/empty
      const hasEmail = item.email && String(item.email).replace(/["\s]/g, '').trim().length > 0;
      
      if (hasPhone && hasEmail) {
        contactChannelCounts['Beides']++;
      } else if (hasPhone) {
        contactChannelCounts['Telefon']++;
      } else if (hasEmail) {
        contactChannelCounts['E-Mail']++;
      }
    }

    // Aggregate customer_type from leads table (date-filtered)
    // Normalize customer types: b2b = Geschäftskunden, b2c = Privatkunden
    const customerTypeCounts = leadsData.reduce((acc: Record<string, number>, item: any) => {
      if (item.customerType) {
        let normalizedType = item.customerType.toLowerCase().trim();
        
        // Normalize to standard categories
        if (normalizedType === 'b2b' || normalizedType === 'geschäftskunden') {
          normalizedType = 'Geschäftskunden';
        } else if (normalizedType === 'b2c' || normalizedType === 'privatkunden') {
          normalizedType = 'Privatkunden';
        } else if (normalizedType === 'private') {
          normalizedType = 'Privatkunden';
        }
        
        acc[normalizedType] = (acc[normalizedType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Log raw postal codes from leads table
    const rawPostalCodes = new Set<string>();
    for (const item of leadsDataForPostalCodes) {
      if (item.postalCode) {
        rawPostalCodes.add(String(item.postalCode));
      }
    }
    console.log(`[PLZ Debug] Raw postal codes from leads table: ${Array.from(rawPostalCodes).map(p => JSON.stringify(p)).join(', ')}`);

    // Aggregate postal codes from leads table - display postal codes (cleaned) - date-filtered
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

    // Aggregate Vermarktungsregionen (marketing regions) by mapping postal codes from leads table to their "map" column - date-filtered
    const postalCodes = new Set<string>();
    for (const item of leadsData) {
      if (item.postalCode) {
        // Clean up postal code - remove all quotes and backslashes
        const cleanedPostalCode = String(item.postalCode)
          .replace(/[\\"'"]/g, '')
          .trim();
        if (cleanedPostalCode) {
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

    // Aggregate by map region - include all postal codes (date-filtered)
    const vermarktungsregionenCounts: Record<string, number> = {};
    const mappedCount: Record<string, number> = { mapped: 0, unmapped: 0 };
    
    for (const item of leadsData) {
      if (item.postalCode) {
        // Clean up postal code - remove all quotes and backslashes
        const cleanedPostalCode = String(item.postalCode)
          .replace(/[\\"'"]/g, '')
          .trim();
        
        if (cleanedPostalCode) {
          if (postalToMapRegion[cleanedPostalCode]) {
            const mapRegion = postalToMapRegion[cleanedPostalCode];
            mappedCount.mapped++;
            console.log(`[Vermarktungsregionen] ✓ ${cleanedPostalCode} → ${mapRegion}`);
            vermarktungsregionenCounts[mapRegion] = (vermarktungsregionenCounts[mapRegion] || 0) + 1;
          } else {
            // Postal code NOT found in mapping - map to "National Sales"
            mappedCount.unmapped++;
            console.log(`[Vermarktungsregionen] ✗ ${cleanedPostalCode} → National Sales (not in mapping)`);
            vermarktungsregionenCounts['National Sales'] = (vermarktungsregionenCounts['National Sales'] || 0) + 1;
          }
        }
      }
    }

    console.log(`[Vermarktungsregionen] Aggregation complete: ${mappedCount.mapped} mapped, ${mappedCount.unmapped} unmapped`);
    console.log(`[Vermarktungsregionen] Final regions:`, Object.entries(vermarktungsregionenCounts).map(([region, count]) => `${region} (${count})`).join(', '));

    // Aggregate Leads by date (for ALL leads, regardless of date range - to show complete chart)
    const leadsByDate: Record<string, {
      date: string;
      leadsCount: number;
    }> = leadsData.reduce((acc: Record<string, any>, item: any) => {
      // const dateKey = item.createdAt.toISOString().split('T')[0];

      // Use createdAt for leads since date is a timestamp
      const dateKey = item.createdAt instanceof Date
        ? item.createdAt.toISOString().split('T')[0]
        : String(item.createdAt).split('T')[0];

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          leadsCount: 0,
        };
      }
      acc[dateKey].leadsCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // Count total leads as personal contact requests (all leads, regardless of date range)
    const personalContactRequested = leadsData.length;
    
    console.log(`[Leads] Total leads found: ${personalContactRequested}`);

    // Sum avg_message_length
    // let totalLength = 0;
    // let totalMessages = 0;

    // chatbotData.forEach((item: any) => {
    //   if (item.avgMessageLength && item.totalMessages) {
    //     totalLength += item.avgMessageLength * item.totalMessages;
    //     totalMessages += item.totalMessages;
    //   }
    // });

    // const totalAvgMessageLength = totalMessages > 0 ? totalLength / totalMessages : 0;

    let totalWords = 0;
    let totalMessages = 0;

    chatbotData.forEach((item: any) => {
      if (item.avgMessageLength && item.totalMessages) {
        // Estimate words from characters: average word length ~5 characters + 1 space
        const estimatedWords = (item.avgMessageLength / 6) * item.totalMessages;
        totalWords += estimatedWords;
        totalMessages += item.totalMessages;
      }
    });

    const avgWordsPerMessage = totalMessages > 0 ? totalWords / totalMessages : 0;

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

    const fromDateTime = new Date(fromDateOnly);
    fromDateTime.setHours(0, 0, 0, 0);

    const toDateTime = new Date(toDateOnly);
    toDateTime.setHours(23, 59, 59, 999);

//     const sankeyRawData = await prisma.$queryRaw<{ source: string; target: string; value: number }[]>`
// WITH BaseEvents AS (
//   SELECT 
//     execution_id,
//     conversation_id,
//     activity,
//     created_at,
//     CASE
//       WHEN LOWER(activity_data) IN ('telefon', 'phone') THEN 'contact_method_phone'
//       WHEN LOWER(activity_data) IN ('e-mail', 'email') THEN 'contact_method_email'
//       WHEN LOWER(activity_data) IN ('beides', 'both') THEN 'contact_method_both'
//       ELSE 'contact_method_other'
//     END AS contact_label,
//     CASE
//       WHEN LOWER(activity_data) IN ('b2b', 'business', 'geschäftskunde', 'geschäftskunde (b2b)') THEN 'customer_type_b2b'
//       WHEN LOWER(activity_data) IN ('b2c', 'private', 'privatkunde', 'privatkunden') THEN 'customer_type_b2c'
//       ELSE 'customer_type_other'
//     END AS type_label
//   FROM workflow_activity_logs
//   WHERE created_at BETWEEN ${fromDateTime} AND ${toDateTime}
// )

// -- 1. START -> CONTACT METHOD
// SELECT 'booking_started' AS source, contact_label AS target, COUNT(DISTINCT execution_id) AS value
// FROM BaseEvents WHERE activity = 'booking_contact_method_selected'
// GROUP BY contact_label

// UNION ALL

// -- 2. CONTACT METHOD -> DETAILS COLLECTED
// SELECT contact_label AS source, 'details_collected' AS target, COUNT(DISTINCT execution_id) AS value
// FROM BaseEvents be
// WHERE activity = 'booking_contact_method_selected'
// AND EXISTS (
//     SELECT 1 FROM workflow_activity_logs d 
//     WHERE d.execution_id = be.execution_id 
//     AND d.activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
// )
// GROUP BY contact_label

// UNION ALL

// -- 3. DETAILS COLLECTED -> CUSTOMER TYPE
// SELECT 'details_collected' AS source, type_label AS target, COUNT(DISTINCT execution_id) AS value
// FROM BaseEvents
// WHERE activity = 'customer_type_selected'
// GROUP BY type_label

// UNION ALL

// -- 4. CUSTOMER TYPE -> FINAL OUTCOME (Leads vs Dropped)
// -- Strictly enforce that a lead must exist WITH a matching workflow_execution_id
// SELECT 
//   be.type_label AS source,
//   CASE 
//     WHEN l.id IS NOT NULL AND l.workflow_execution_id IS NOT NULL THEN 'lead_created'
//     ELSE 'dropped'
//   END AS target,
//   COUNT(DISTINCT be.execution_id) AS value
// FROM BaseEvents be
// LEFT JOIN leads l ON be.execution_id = l.workflow_execution_id
// WHERE be.activity = 'customer_type_selected'
// GROUP BY be.type_label, target

// UNION ALL

// -- 5. DROP-OFF FROM CONTACT METHOD
// SELECT contact_label AS source, 'dropped' AS target, COUNT(DISTINCT execution_id) AS value
// FROM BaseEvents be
// WHERE activity = 'booking_contact_method_selected'
// AND NOT EXISTS (
//     SELECT 1 FROM workflow_activity_logs d 
//     WHERE d.execution_id = be.execution_id 
//     AND d.activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
// )
// GROUP BY contact_label

// UNION ALL

// -- 6. DROP-OFF FROM DETAILS
// SELECT 'details_collected' AS source, 'dropped' AS target, COUNT(DISTINCT execution_id) AS value
// FROM BaseEvents d
// WHERE activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
// AND NOT EXISTS (
//     SELECT 1 FROM BaseEvents ct 
//     WHERE ct.execution_id = d.execution_id AND ct.activity = 'customer_type_selected'
// )
// GROUP BY target;
// `;
    
    const sankeyRawData = await prisma.$queryRaw<{ source: string; target: string; value: number }[]>`
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

-- 1. START -> CONTACT METHOD
SELECT 'booking_started' AS source, contact_label AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents WHERE activity = 'booking_contact_method_selected'
GROUP BY contact_label

UNION ALL

-- 1b. START -> DROPPED (workflows that never selected contact method)
SELECT 'booking_started' AS source, 'dropped' AS target, COUNT(DISTINCT w.execution_id) AS value
FROM workflow_execution_logs w
WHERE w.workflow_id = 'wf-b493aa0010'
  AND w.started_at BETWEEN ${fromDateTime} AND ${toDateTime}
  AND NOT EXISTS (
    SELECT 1 FROM workflow_activity_logs a
    WHERE a.execution_id = w.execution_id
    AND a.activity = 'booking_contact_method_selected'
    AND a.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  )

UNION ALL

-- 2. CONTACT METHOD -> DETAILS COLLECTED
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

-- 3. DETAILS COLLECTED -> CUSTOMER TYPE
SELECT 'details_collected' AS source, type_label AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents
WHERE activity = 'customer_type_selected'
GROUP BY type_label

UNION ALL

-- 4. CUSTOMER TYPE -> FINAL OUTCOME (Leads vs Dropped)
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

-- 4b. LEADS WITH NO customer_type_selected ACTIVITY (workflow logging gap)
SELECT
  CASE
    WHEN LOWER(l.customer_type) IN ('b2b') THEN 'customer_type_b2b'
    WHEN LOWER(l.customer_type) IN ('b2c') THEN 'customer_type_b2c'
    ELSE 'customer_type_other'
  END AS source,
  'lead_created' AS target,
  COUNT(DISTINCT l.id) AS value -- FIX: Use l.id instead of workflow_execution_id
FROM leads l
WHERE l.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  AND NOT EXISTS (
    SELECT 1 FROM workflow_activity_logs wa
    WHERE (wa.execution_id = l.workflow_execution_id OR wa.conversation_id = l.conversation_id) -- Robust check
    AND wa.activity = 'customer_type_selected'
    AND wa.created_at BETWEEN ${fromDateTime} AND ${toDateTime}
  )
GROUP BY 1

UNION ALL

-- 5. DROP-OFF FROM CONTACT METHOD
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

-- 6. DROP-OFF FROM DETAILS
SELECT 'details_collected' AS source, 'dropped' AS target, COUNT(DISTINCT execution_id) AS value
FROM BaseEvents d
WHERE activity IN ('full_name_collected', 'phone_collected', 'email_collected', 'postal_code_collected')
AND NOT EXISTS (
    SELECT 1 FROM BaseEvents ct 
    WHERE ct.execution_id = d.execution_id AND ct.activity = 'customer_type_selected'
)
GROUP BY target;
`;
    console.log("RAW SANKEY DATA", sankeyRawData);

    const labels = Array.from(
      new Set(
        sankeyRawData.flatMap((row) => [row.source, row.target])
      )
    );

    const labelIndexMap: Record<string, number> = {};
    labels.forEach((label, index) => {
      labelIndexMap[label] = index;
    });

    const sankeyData = {
      nodes: Array.from(
        new Set(
          sankeyRawData.flatMap(row => [row.source, row.target])
        )
      ).map(id => ({ id })),
      links: sankeyRawData.map(row => ({
        source: row.source,
        target: row.target,
        value: Number(row.value),
      })),
    };

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
        avgWordsPerMessage: avgWordsPerMessage,
        personalContactRequested,
        bookingStartedCount,
      },
      sentimentCounts,
      contactChannelCounts,
      customerTypeCounts,
      customerRegionCounts,
      vermarktungsregionenCounts,
      wordCloudData,
      summaries,
      sankeyData
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}

