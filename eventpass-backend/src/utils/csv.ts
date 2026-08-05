import { parse } from 'fast-csv';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';

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
  'guest name': 'fullName',
  email: 'email',
  phone: 'phone',
  category: 'category',
  notes: 'notes',
};

function mapRow(raw: Record<string, string>, rowNum: number): ParsedGuestRow {
  const mapped: ParsedGuestRow = { row: rowNum };
  for (const [header, value] of Object.entries(raw)) {
    const field = HEADER_MAP[header];
    if (field && value !== undefined && value !== null && String(value).trim() !== '') {
      (mapped as any)[field] = String(value).trim();
    }
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
