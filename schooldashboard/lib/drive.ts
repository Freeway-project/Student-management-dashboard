import { google, drive_v3 } from 'googleapis';
import fs from 'node:fs';

let cached: drive_v3.Drive | null = null;

function getCreds() {
  if (process.env.GOOGLE_SA_JSON_BASE64) {
    const json = Buffer.from(process.env.GOOGLE_SA_JSON_BASE64, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  if (process.env.GOOGLE_SA_JSON_PATH) {
    return JSON.parse(fs.readFileSync(process.env.GOOGLE_SA_JSON_PATH, 'utf8'));
  }
  throw new Error('Service account credentials not provided');
}

export function getDrive(): drive_v3.Drive {
  if (cached) return cached;
  const auth = new google.auth.GoogleAuth({
    credentials: getCreds(),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  cached = google.drive({ version: 'v3', auth });
  return cached;
}

export const SHARED_DRIVE_ID = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || undefined;
export const DEFAULT_PARENT = process.env.GOOGLE_DRIVE_DEFAULT_PARENT_FOLDER_ID || undefined;