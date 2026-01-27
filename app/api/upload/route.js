import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';

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

export async function POST(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { filename, mimeType } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400, headers: corsHeaders });
    }

    const auth = getAuth();
    const authClient = await auth.getClient();
    const token = await authClient.getAccessToken();

    const origin = request.headers.get('origin') || 'https://gigagreen-vertraege.vercel.app';

    // Create resumable upload session with origin param for CORS
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
          'Origin': origin,
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

    // Extract file ID from response if available, otherwise client gets it after upload
    let fileId = null;
    try {
      const body = await res.json();
      fileId = body.id;
    } catch {
      // Resumable session may not return a body
    }

    return NextResponse.json({ uploadUrl, fileId }, { headers: corsHeaders });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload fehlgeschlagen: ' + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
