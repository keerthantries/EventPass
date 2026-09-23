import { parse } from 'fast-csv';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';

export interface ParsedGuestRow {
  row: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  category?: string;
  partyId?: string;
  partyName?: string;
  side?: string;
  isVip?: boolean;
  isImmediateFamily?: boolean;
  notes?: string;
}

const HEADER_MAP: Record<string, keyof Omit<ParsedGuestRow, 'row'>> = {
  'full name': 'fullName',
  name: 'fullName',
  'guest name': 'fullName',
  'first name': 'firstName',
  'last name': 'lastName',
  email: 'email',
  phone: 'phone',
  category: 'category',
  'party/family id': 'partyId',
  'party/family name': 'partyName',
  'party id': 'partyId',
  'party name': 'partyName',
  party: 'partyName',
  family: 'partyName',
  'family name': 'partyName',
  "bride's family": 'side',
  "groom's family": 'side',
  bride: 'side',
  groom: 'side',
  side: 'side',
  vip: 'isVip',
  'immediate family': 'isImmediateFamily',
  notes: 'notes',
};

const SIDE_MAP: Record<string, string> = {
  "bride's family": 'Bride',
  bride: 'Bride',
  "groom's family": 'Groom',
  groom: 'Groom',
};

const TRUTHY_VALUES = new Set(['yes', 'true', '1', 'x', '✓', 'y']);

function mapRow(raw: Record<string, string>, rowNum: number): ParsedGuestRow {
  const mapped: ParsedGuestRow = { row: rowNum };
  for (const [header, value] of Object.entries(raw)) {
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const field = HEADER_MAP[header];
    if (!field) continue;

    const trimmed = String(value).trim();

    if (field === 'isVip' || field === 'isImmediateFamily') {
      (mapped as any)[field] = TRUTHY_VALUES.has(trimmed.toLowerCase());
    } else if (field === 'side') {
      (mapped as any)[field] = SIDE_MAP[trimmed.toLowerCase()] ?? trimmed;
    } else {
      (mapped as any)[field] = trimmed;
    }
  }

  if (!mapped.fullName && mapped.firstName) {
    mapped.fullName = [mapped.firstName, mapped.lastName].filter(Boolean).join(' ');
  }

  return mapped;
}

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
        rows.push(mapRow(raw, rowNum));
      })
      .on('end', () => resolve(rows));
  });
}

/**
 * Parses an XLSX buffer (first worksheet) into normalized guest rows using the
 * same header mapping as CSV. Non-string cells are stringified so numeric phones
 * or dates survive the import.
 */
export async function parseGuestXlsx(buffer: Buffer): Promise<ParsedGuestRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: ParsedGuestRow[] = [];
  const headerRow = sheet.getRow(1);
  if (!headerRow || headerRow.cellCount === 0) return rows;

  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim().toLowerCase();
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (!header) return;
      const cell = row.getCell(i + 1);
      let value = cell.value;
      if (value !== null && value !== undefined) {
        if (value instanceof Date) {
          value = value.toISOString().slice(0, 10);
        } else if (typeof value === 'object' && 'text' in (value as any)) {
          value = (value as any).text ?? (value as any).result ?? '';
        } else {
          value = String(value);
        }
        raw[header] = String(value);
      }
    });
    rows.push(mapRow(raw, rowNumber - 1));
  });

  return rows;
}

/** Dispatches to the right parser based on file extension / MIME type. */
export function parseGuestFile(buffer: Buffer, filename = ''): Promise<ParsedGuestRow[]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return parseGuestXlsx(buffer);
  return parseGuestCsv(buffer);
}
