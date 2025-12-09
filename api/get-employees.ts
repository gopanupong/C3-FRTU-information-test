import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check for credentials
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Missing Google Credentials in Environment Variables');
      // If no credentials, return empty array or mock (for demo purposes if env not set)
      return res.status(200).json([]);
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Load Document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI', serviceAccountAuth);
    await doc.loadInfo();

    // Access specific sheet by GID (277093410)
    const sheetId = 277093410;
    const sheet = doc.sheetsById[sheetId];

    if (!sheet) {
      return res.status(404).json({ error: 'Sheet "รายชื่อพนักงาน" (GID: 277093410) not found' });
    }

    // Fetch rows
    const rows = await sheet.getRows();
    
    // Map data from "ชื่อ-สกุล" column
    const employees = rows
      .map((row: any) => row.get('ชื่อ-สกุล'))
      .filter((name: string) => name && name.trim() !== '');

    res.status(200).json(employees);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}