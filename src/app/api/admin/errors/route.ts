import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { mutateStore, readStore } from '@/lib/store';

export async function GET() {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json((await readStore()).errors, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error reports could not be loaded.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json() as { id?: string; status?: 'new' | 'investigating' | 'resolved' | 'ignored'; notes?: string };
    if (!body.id || !body.status) return NextResponse.json({ error: 'Report id and status are required.' }, { status: 400 });

    let found = false;
    await mutateStore((store) => {
      const item = store.errors.find((entry) => entry.id === body.id);
      if (item) {
        found = true;
        item.status = body.status!;
        item.notes = body.notes;
      }
    });

    if (!found) return NextResponse.json({ error: 'Error report not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error status could not be saved.' }, { status: 500 });
  }
}
