import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { createId, mutateStore, readStore, type ToolOverride } from '@/lib/store';
import { getTool } from '@/lib/tools';

const colors = /^#[0-9a-f]{6}$/i;

function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error && error.message ? error.message : 'The tool settings could not be saved.';
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json((await readStore()).toolOverrides, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { slug?: string; patch?: ToolOverride };
    try {
      body = await request.json() as { slug?: string; patch?: ToolOverride };
    } catch {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    const slug = String(body.slug || '').trim();
    if (!slug || !getTool(slug)) {
      return NextResponse.json({ error: 'Unknown tool slug.' }, { status: 400 });
    }

    const patch: ToolOverride = { ...(body.patch || {}) };
    for (const key of ['cardButtonColor', 'actionButtonColor'] as const) {
      if (patch[key] && !colors.test(String(patch[key]))) patch[key] = '';
    }

    if (patch.maximumFileSize !== undefined) {
      patch.maximumFileSize = Math.max(1, Math.min(5000, Number(patch.maximumFileSize) || 50));
    }

    const saved = await mutateStore((store) => {
      store.toolOverrides[slug] = {
        ...(store.toolOverrides[slug] || {}),
        ...patch,
      };
      store.activity.unshift({
        id: createId('act'),
        action: 'Tool updated',
        target: slug,
        createdAt: new Date().toISOString(),
      });
      return store.toolOverrides[slug];
    });

    return NextResponse.json({ ok: true, saved }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return jsonError(error);
  }
}
