import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';
import { Readable } from 'stream';

export const maxDuration = 60;

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
    throw new Error('Service Account JSON enthält keine client_email');
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// Step 1: POST with just filename+type → returns resumable upload URL
// Step 2: POST with file body → direct upload (for small files)
export async function POST(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // If JSON request: create resumable upload session and return URL
    if (contentType.includes('application/json')) {
      const { filename, mimeType } = await request.json();
      if (!filename) {
        return NextResponse.json({ error: 'filename required' }, { status: 400, headers: corsHeaders });
      }

      const auth = getAuth();
      const authClient = await auth.getClient();
      const token = await authClient.getAccessToken();

      // Create resumable upload session directly via Google API
      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: filename,
            parents: [FOLDER_ID],
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google API error: ${res.status} ${errText}`);
      }

      const uploadUrl = res.headers.get('location');

      return NextResponse.json({
        uploadUrl,
        token: token.token,
      }, { headers: corsHeaders });
    }

    // Fallback: FormData upload for small files (< 4MB)
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

    // Try to set permissions (shared drives may inherit)
    try {
      await drive.permissions.create({
        fileId: driveFile.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });
    } catch (permErr) {
      console.log('Permission already inherited:', permErr.message);
    }

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
