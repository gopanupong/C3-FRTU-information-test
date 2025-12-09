import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Check Credentials
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: Missing Google Credentials' });
    }

    // 2. Authenticate
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 3. Load Document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI', serviceAccountAuth);
    await doc.loadInfo();

    // 4. Get Sheet (Try 'database' first, then fallback to first sheet/GID 0)
    let sheet = doc.sheetsByTitle['database'];
    if (!sheet) {
      sheet = doc.sheetsByIndex[0];
    }

    const body = req.body;
    const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    // 5. Add Row
    // Mapping keys to match standard columns expected in the sheet
    await sheet.addRow({
      'Timestamp': timestamp,
      'Officer': body.officerName || '-',
      'Remote Unit Name': body.frtuSerial || '-',
      'Action': body.action || '-',
      'System Details': body.details || '-',
      'Event Details': body.eventDetails || '-',
      'PHOS Data': body.phosData || '-',
      'PHBO Data': body.phboData || '-',
      'Status': body.status || '-'
    });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Sheet Logging Error:', error);
    return res.status(500).json({ error: error.message });
  }
}