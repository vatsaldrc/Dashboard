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
    const postalMappings = await prisma.postalMP.findMany();
    
    plzCache = {};
    for (const item of postalMappings) {
      // Prisma converts snake_case DB column names to camelCase, so 'Postal Code' becomes 'postalCode'
      const postalCode = (item as any).postalCode || (item as any)['Postal Code'];
      if (postalCode && item.mp) {
        plzCache[postalCode] = item.mp;
      }
    }
    
    console.log(`[PLZ Mapping] Loaded ${Object.keys(plzCache).length} postal code mappings from database`);
    if (Object.keys(plzCache).length > 0) {
      const samples = Object.entries(plzCache).slice(0, 5);
      console.log(`[PLZ Mapping] Sample mappings:`, samples);
    } else {
      console.warn(`[PLZ Mapping] ⚠️  postal_mp table is EMPTY!`);
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
