import { NextResponse } from 'next/server';
import { checkAuth, unauthorizedResponse } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// POST - Login prüfen (keine Daten werden geschrieben)
export async function POST(request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ authenticated: true }, { headers: corsHeaders });
}
