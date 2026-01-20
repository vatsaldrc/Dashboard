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
      const [postalCode, region] = lines[i].split(',').map(col => col.trim());
      if (postalCode && region) {
        plzCache[postalCode] = region;
      }
    }
    
    return plzCache;
  } catch (error) {
    console.error('Error loading PLZ mapping:', error);
    return {};
  }
}

export function mapPostalCodeToRegion(postalCode: string | null): string {
  if (!postalCode) return 'Unknown';
  
  const mapping = getPLZMapping();
  return mapping[postalCode] || postalCode;
}
