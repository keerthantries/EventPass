import { parse } from 'fast-csv';
import { Readable } from 'stream';

export interface ParsedGuestRow {
  row: number;
  fullName?: string;
  email?: string;
  phone?: string;
  category?: string;
  notes?: string;
}

const HEADER_MAP: Record<string, keyof Omit<ParsedGuestRow, 'row'>> = {
  'full name': 'fullName',
  name: 'fullName',
  email: 'email',
  phone: 'phone',
  category: 'category',
  notes: 'notes',
};

/**
 * Parses a CSV buffer into normalized guest rows per the import spec (API §1.6):
 * case-insensitive / order-independent headers, unrecognized columns ignored,
 * row numbers preserved for error reporting (1-indexed, header excluded).
 */
export function parseGuestCsv(buffer: Buffer): Promise<ParsedGuestRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ParsedGuestRow[] = [];
    let rowNum = 0;

    Readable.from(buffer)
      .pipe(parse({ headers: (headers) => headers.map((h) => (h ?? '').toString().trim().toLowerCase()) }))
      .on('error', reject)
      .on('data', (raw: Record<string, string>) => {
        rowNum += 1;
        const mapped: ParsedGuestRow = { row: rowNum };
        for (const [header, value] of Object.entries(raw)) {
          const field = HEADER_MAP[header];
          if (field && value !== undefined && value !== null && String(value).trim() !== '') {
            (mapped as any)[field] = String(value).trim();
          }
        }
        rows.push(mapped);
      })
      .on('end', () => resolve(rows));
  });
}
