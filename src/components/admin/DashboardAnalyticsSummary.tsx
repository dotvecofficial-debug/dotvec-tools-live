'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/client-api';

type Summary = { activeUsers: number; todayPageViews: number; todayToolActions: number; todayDownloads: number };
const initial: Summary = { activeUsers: 0, todayPageViews: 0, todayToolActions: 0, todayDownloads: 0 };

export function DashboardAnalyticsSummary() {
  const [data, setData] = useState(initial);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const payload = await requestJson<Summary>('/api/admin/analytics', { cache: 'no-store' });
        if (active) setData(payload);
      } catch {
        // Dashboard remains usable if analytics refresh fails.
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return <div className="admin-cards dashboard-live-cards">
    <div className="admin-stat live-stat"><span>Live users</span><b>{data.activeUsers}</b><p>Last 5 minutes</p></div>
    <div className="admin-stat"><span>Views today</span><b>{data.todayPageViews}</b><p>Page and tool opens</p></div>
    <div className="admin-stat"><span>Tool uses today</span><b>{data.todayToolActions}</b><p>Process actions</p></div>
    <div className="admin-stat"><span>Downloads today</span><b>{data.todayDownloads}</b><p>Tracked outputs</p></div>
  </div>;
}
