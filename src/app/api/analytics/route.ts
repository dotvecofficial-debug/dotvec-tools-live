import { NextRequest, NextResponse } from 'next/server';
import { createId, mutateStore, type AnalyticsEvent } from '@/lib/store';

const allowed = new Set<AnalyticsEvent['type']>(['page_view', 'tool_open', 'tool_action', 'download', 'click']);

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<AnalyticsEvent>;
  if (!body.sessionId || !body.path || !body.type || !allowed.has(body.type)) {
    return NextResponse.json({ error: 'Invalid analytics event.' }, { status: 400 });
  }

  const event: AnalyticsEvent = {
    id: createId('evt'),
    sessionId: String(body.sessionId).slice(0, 120),
    type: body.type,
    path: String(body.path).slice(0, 500),
    toolSlug: body.toolSlug ? String(body.toolSlug).slice(0, 160) : undefined,
    action: body.action ? String(body.action).slice(0, 160) : undefined,
    label: body.label ? String(body.label).slice(0, 300) : undefined,
    referrer: body.referrer ? String(body.referrer).slice(0, 500) : undefined,
    userAgent: String(req.headers.get('user-agent') || '').slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  await mutateStore((store) => {
    store.analytics.unshift(event);
    if (store.analytics.length > 10_000) store.analytics.length = 10_000;
  });

  return NextResponse.json({ ok: true });
}
