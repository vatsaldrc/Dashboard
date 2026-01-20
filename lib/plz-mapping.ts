import fs from 'fs';
import path from 'path';

interface PLZMapping {
  [postalCode: string]: string;
}

let plzCache: PLZMapping | null = null;

export function getPLZMapping(): PLZMapping {
  if (plzCache) {
    return plzCache;
  }

  const csvPath = path.join(process.cwd(), 'prisma', 'PLZ_Liste_20250801(PLZ-Gebiete).csv');
  
  try {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    plzCache = {};
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(col => col.trim());
      if (parts.length >= 2) {
        const postalCode = parts[0];
        const region = parts[1];
        if (postalCode && region) {
          plzCache[postalCode] = region;
        }
      }
    }
    
    console.log(`[PLZ Mapping] Loaded ${Object.keys(plzCache).length} postal code mappings`);
    return plzCache;
  } catch (error) {
    console.error('[PLZ Mapping] Error loading PLZ mapping:', error);
    return {};
  }
}

export function mapPostalCodeToRegion(postalCode: string | null): string {
  if (!postalCode) return 'Unknown';
  
  const mapping = getPLZMapping();
  const region = mapping[postalCode];
  
  if (region) {
    return region;
  }
  
  // If postal code not found, return it as is so we can see what's missing
  console.warn(`[PLZ Mapping] Postal code not found in mapping: ${postalCode}`);
  return postalCode;
}
