import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';
import { Readable } from 'stream';

export const maxDuration = 30;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FOLDER_ID = '1qoE0Exyw1wgYWtwtGrQOVLpUyNppujm8';

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}';
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY ist kein gültiges JSON: ' + e.message);
  }

  if (!credentials.client_email) {
    throw new Error('Service Account JSON enthält keine client_email. Keys vorhanden: ' + Object.keys(credentials).join(', '));
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400, headers: corsHeaders }
      );
    }

    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Verify folder access first
    try {
      await drive.files.get({
        fileId: FOLDER_ID,
        fields: 'id, name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
    } catch (folderErr) {
      return NextResponse.json(
        { error: `Ordner-Zugriff fehlgeschlagen (${FOLDER_ID}): ${folderErr.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const driveFile = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    // Make file accessible via link
    await drive.permissions.create({
      fileId: driveFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });

    const downloadLink = `https://drive.google.com/uc?export=download&id=${driveFile.data.id}`;

    return NextResponse.json({
      id: driveFile.data.id,
      name: driveFile.data.name,
      link: downloadLink,
      viewLink: driveFile.data.webViewLink,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload fehlgeschlagen: ' + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
