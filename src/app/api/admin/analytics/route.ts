import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { readStore } from '@/lib/store';

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const events = (await readStore()).analytics;
  const now = Date.now();
  const activeCutoff = now - 5 * 60 * 1000;
  const todayCutoff = new Date();
  todayCutoff.setHours(0, 0, 0, 0);
  const activeSessions = new Set(events.filter((event) => Date.parse(event.createdAt) >= activeCutoff).map((event) => event.sessionId));
  const today = events.filter((event) => Date.parse(event.createdAt) >= todayCutoff.getTime());

  return NextResponse.json({
    activeUsers: activeSessions.size,
    todayPageViews: today.filter((event) => event.type === 'page_view').length,
    todayToolActions: today.filter((event) => event.type === 'tool_action').length,
    todayDownloads: today.filter((event) => event.type === 'download').length,
    events: events.slice(0, 500),
  });
}
