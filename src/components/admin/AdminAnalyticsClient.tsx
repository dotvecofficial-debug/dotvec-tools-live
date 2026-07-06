'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnalyticsEvent } from '@/lib/store';
import { requestJson } from '@/lib/client-api';

type Payload = { activeUsers: number; todayPageViews: number; todayToolActions: number; todayDownloads: number; events: AnalyticsEvent[] };
const empty: Payload = { activeUsers: 0, todayPageViews: 0, todayToolActions: 0, todayDownloads: 0, events: [] };

export function AdminAnalyticsClient() {
  const [data, setData] = useState<Payload>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await requestJson<Payload>('/api/admin/analytics', { cache: 'no-store' });
        if (active) setData(payload);
      } catch {
        // Keep the previous snapshot if the analytics endpoint is temporarily unavailable.
      } finally { if (active) setLoading(false); }
    }
    load();
    const timer = setInterval(load, 10_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const topPages = useMemo(() => count(data.events.filter((event) => event.type === 'page_view' || event.type === 'tool_open').map((event) => event.path)), [data.events]);
  const topTools = useMemo(() => count(data.events.filter((event) => event.toolSlug).map((event) => event.toolSlug || '')), [data.events]);
  const sessions = new Set(data.events.map((event) => event.sessionId)).size;

  return <div className="cms-page">
    <section className="admin-hero"><div><span>Live Analytics</span><h1>User activity dashboard</h1><p>Track page views, tool opens, process actions and downloads. This panel refreshes every 10 seconds.</p></div><span className="live-indicator"><i/>Live</span></section>
    <div className="admin-cards"><Card title="Active users" value={data.activeUsers} copy="Seen in the last 5 minutes"/><Card title="Page views today" value={data.todayPageViews} copy="Public page and tool opens"/><Card title="Tool actions today" value={data.todayToolActions} copy="Process and generator clicks"/><Card title="Downloads today" value={data.todayDownloads} copy="Tracked download actions"/></div>
    <div className="cms-dashboard-grid"><section className="cms-panel"><h2>Top pages</h2><Ranked rows={topPages}/></section><section className="cms-panel"><h2>Top tools</h2><Ranked rows={topTools}/></section></div>
    <section className="cms-panel cms-full-panel"><div className="cms-subheading"><h2>Recent live events</h2><span className="help">{sessions} recorded sessions · {loading ? 'Loading…' : `${data.events.length} recent events`}</span></div><div className="analytics-table-wrap"><table className="table"><thead><tr><th>Time</th><th>Event</th><th>Page</th><th>Tool</th><th>Action</th><th>Session</th></tr></thead><tbody>{data.events.slice(0,100).map((event) => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleTimeString()}</td><td><span className="badge">{event.type}</span></td><td>{event.path}</td><td>{event.toolSlug || '—'}</td><td>{event.label || event.action || '—'}</td><td><code>{event.sessionId.slice(0,8)}</code></td></tr>)}</tbody></table></div></section>
  </div>;
}

function count(values: string[]) { const map = new Map<string, number>(); values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1)); return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0,10); }
function Card({ title, value, copy }: { title: string; value: number; copy: string }) { return <div className="admin-stat"><span>{title}</span><b>{value}</b><p>{copy}</p></div>; }
function Ranked({ rows }: { rows: Array<[string, number]> }) { return <div className="cms-list">{rows.length ? rows.map(([label,value],index) => <div className="cms-list-item" key={label}><div><b>{index+1}. {label}</b></div><span className="cms-pill">{value}</span></div>) : <div className="notice">No analytics data yet. Browse the public website to generate events.</div>}</div>; }
