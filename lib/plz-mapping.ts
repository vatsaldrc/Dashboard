import { prisma } from './prisma';

interface PLZMapping {
  [postalCode: string]: string;
}

let plzCache: PLZMapping | null = null;

export async function getPLZMapping(): Promise<PLZMapping> {
  if (plzCache) {
    console.log(`[PLZ Mapping] Using cached mapping with ${Object.keys(plzCache).length} entries`);
    return plzCache;
  }

  try {
    console.log(`[PLZ Mapping] Loading from database...`);
    const postalMappings = await prisma.postalMP.findMany();
    
    console.log(`[PLZ Mapping] Found ${postalMappings.length} records in postal_mp table`);
    
    plzCache = {};
    for (const item of postalMappings) {
      plzCache[item.postalCode] = item.mp;
    }
    
    console.log(`[PLZ Mapping] Created mapping with ${Object.keys(plzCache).length} unique postal codes`);
    if (Object.keys(plzCache).length > 0) {
      const samples = Object.entries(plzCache).slice(0, 5);
      console.log(`[PLZ Mapping] Sample mappings:`, samples);
    } else {
      console.warn(`[PLZ Mapping] ⚠️  No mappings created!`);
    }
    return plzCache;
  } catch (error) {
    console.error('[PLZ Mapping] Error loading PLZ mapping from database:', error);
    return {};
  }
}

export async function mapPostalCodeToRegion(postalCode: string | null): Promise<string> {
  if (!postalCode) return 'Unknown';
  
  const mapping = await getPLZMapping();
  const region = mapping[postalCode];
  
  if (region) {
    return region;
  }
  
  // If postal code not found, return it as is so we can see what's missing
  console.warn(`[PLZ Mapping] Postal code not found in mapping: ${postalCode}`);
  return postalCode;
}

// Clear cache function for testing
export function clearPLZCache(): void {
  plzCache = null;
}
