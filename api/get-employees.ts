import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      // Fallback for local testing if env vars missing
      return res.status(200).json([]);
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI', serviceAccountAuth);
    await doc.loadInfo();

    // Access specific sheet by GID (277093410)
    const sheetId = 277093410;
    const sheet = doc.sheetsById[sheetId];

    if (!sheet) {
      return res.status(404).json({ error: 'Sheet "รายชื่อพนักงาน" not found' });
    }

    // Load cells A1 to A20 (Direct cell access is more robust than getRows for simple lists)
    await sheet.loadCells('A1:A20');

    const employees: string[] = [];
    
    // Iterate through first 20 rows
    for (let i = 0; i < 20; i++) {
      const cell = sheet.getCell(i, 0); // Column A, Row i
      const value = cell.value;

      if (value && typeof value === 'string') {
        const trimmed = value.trim();
        // Skip header if it exists
        if (trimmed === 'ชื่อ-สกุล' || trimmed === 'Name' || trimmed === 'รายชื่อพนักงาน') continue;
        if (trimmed.length > 0) {
          employees.push(trimmed);
        }
      }
    }

    res.status(200).json(employees);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}