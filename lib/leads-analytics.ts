import { prisma } from '@/lib/prisma';

type LeadItem = {
    phone?: string | null;
    email?: string | null;
    customerType?: string | null;
    postalCode?: string | null;
};

// ── Contact channel ──────────────────────────────────────────────
export function buildContactChannelCounts(
    leads: LeadItem[]
): Record<string, number> {
    const counts: Record<string, number> = { Telefon: 0, 'E-Mail': 0, Beides: 0 };

    for (const item of leads) {
        const hasPhone = item.phone && String(item.phone).replace(/["\s]/g, '').trim().length > 0;
        const hasEmail = item.email && String(item.email).replace(/["\s]/g, '').trim().length > 0;

        if (hasPhone && hasEmail) counts['Beides']++;
        else if (hasPhone) counts['Telefon']++;
        else if (hasEmail) counts['E-Mail']++;
    }

    return counts;
}

// ── Customer type ────────────────────────────────────────────────
export function buildCustomerTypeCounts(
    leads: LeadItem[]
): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of leads) {
        if (!item.customerType) continue;

        let normalized = item.customerType.toLowerCase().trim();

        if (['b2b', 'geschäftskunden'].includes(normalized)) normalized = 'Geschäftskunden';
        else if (['b2c', 'privatkunden', 'private'].includes(normalized)) normalized = 'Privatkunden';

        counts[normalized] = (counts[normalized] ?? 0) + 1;
    }

    return counts;
}

// ── Vermarktungsregionen (requires DB lookup) ────────────────────
export async function buildVermarktungsregionen(
    leads: LeadItem[]
): Promise<Record<string, number>> {
    // 1. Collect and clean postal codes from the leads slice passed in
    const postalCodes = new Set<string>();
    for (const item of leads) {
        if (!item.postalCode) continue;
        const cleaned = String(item.postalCode).replace(/[\\"'"]/g, '').trim();
        if (cleaned) postalCodes.add(cleaned);
    }

    // 2. Fetch mappings from DB in one query
    const mappings = await prisma.postalMP.findMany({
        where: { postalCode: { in: Array.from(postalCodes) } },
    });

    const postalToRegion: Record<string, string> = {};
    for (const m of mappings) {
        postalToRegion[m.postalCode] = m.mp;
    }

    // 3. Aggregate
    const counts: Record<string, number> = {};
    for (const item of leads) {
        if (!item.postalCode) continue;
        const cleaned = String(item.postalCode).replace(/[\\"'"]/g, '').trim();
        if (!cleaned) continue;

        const region = postalToRegion[cleaned] ?? 'National Sales';
        counts[region] = (counts[region] ?? 0) + 1;
    }

    return counts;
}