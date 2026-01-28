import { NextResponse } from 'next/server';
import { getVertraege, saveVertraege, generateId, VALID_CATEGORIES } from '@/lib/data';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_NAME_LENGTH = 200;
const MAX_LINK_LENGTH = 500;
const DRIVE_LINK_PATTERN = /^https:\/\/drive\.google\.com\//;

function validateCategory(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    return 'Ungültige Kategorie';
  }
  return null;
}

// OPTIONS - CORS Preflight
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// GET - Öffentlich: Verträge einer Kategorie abrufen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'vertragsvorlagen';

    const catError = validateCategory(category);
    if (catError) {
      return NextResponse.json({ error: catError }, { status: 400, headers: corsHeaders });
    }

    const vertraege = await getVertraege(category);
    return NextResponse.json(vertraege, { headers: corsHeaders });
  } catch (error) {
    console.error('GET /api/vertraege error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Verträge' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Auth Required: Neuen Vertrag hinzufügen
export async function POST(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, driveLink, category } = body;
    const cat = category || 'vertragsvorlagen';

    const catError = validateCategory(cat);
    if (catError) {
      return NextResponse.json({ error: catError }, { status: 400, headers: corsHeaders });
    }

    if (!name || !driveLink) {
      return NextResponse.json(
        { error: 'Name und Link sind erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }

    const trimmedName = name.trim();
    const trimmedLink = driveLink.trim();

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name darf maximal ${MAX_NAME_LENGTH} Zeichen lang sein` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (trimmedLink.length > MAX_LINK_LENGTH) {
      return NextResponse.json(
        { error: `Link darf maximal ${MAX_LINK_LENGTH} Zeichen lang sein` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!DRIVE_LINK_PATTERN.test(trimmedLink)) {
      return NextResponse.json(
        { error: 'Nur Google Drive Links sind erlaubt' },
        { status: 400, headers: corsHeaders }
      );
    }

    const vertraege = await getVertraege(cat);
    const newVertrag = {
      id: generateId(),
      name: trimmedName,
      driveLink: trimmedLink,
      createdAt: new Date().toISOString()
    };

    vertraege.push(newVertrag);
    await saveVertraege(vertraege, cat);

    return NextResponse.json(newVertrag, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST /api/vertraege error:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Erstellen' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Auth Required: Vertrag löschen
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category') || 'vertragsvorlagen';

    const catError = validateCategory(category);
    if (catError) {
      return NextResponse.json({ error: catError }, { status: 400, headers: corsHeaders });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }

    let vertraege = await getVertraege(category);
    const initialLength = vertraege.length;
    vertraege = vertraege.filter(v => v.id !== id);

    if (vertraege.length === initialLength) {
      return NextResponse.json(
        { error: 'Vertrag nicht gefunden' },
        { status: 404, headers: corsHeaders }
      );
    }

    await saveVertraege(vertraege, category);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('DELETE /api/vertraege error:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Löschen' },
      { status: 500, headers: corsHeaders }
    );
  }
}
