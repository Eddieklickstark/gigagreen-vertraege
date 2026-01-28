import { NextResponse } from 'next/server';
import { getVertraege, saveVertraege, generateId } from '@/lib/data';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS - CORS Preflight
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// GET - Öffentlich: Verträge einer Kategorie abrufen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'vertragsvorlagen';

    const vertraege = await getVertraege(category);
    return NextResponse.json(vertraege, { headers: corsHeaders });
  } catch (error) {
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

    if (!name || !driveLink) {
      return NextResponse.json(
        { error: 'Name und Link sind erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }

    const vertraege = await getVertraege(cat);
    const newVertrag = {
      id: generateId(),
      name: name.trim(),
      driveLink: driveLink.trim(),
      createdAt: new Date().toISOString()
    };

    vertraege.push(newVertrag);
    await saveVertraege(vertraege, cat);

    return NextResponse.json(newVertrag, { status: 201, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Erstellen' },
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
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500, headers: corsHeaders }
    );
  }
}
