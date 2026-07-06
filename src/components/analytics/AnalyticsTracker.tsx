'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function sessionId() {
  const key = 'dotvec-session-id';
  const current = sessionStorage.getItem(key);
  if (current) return current;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ sessionId: sessionId(), ...payload });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    return;
  }
  fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const path = `${pathname}${search.toString() ? `?${search.toString()}` : ''}`;
    const toolSlug = pathname.startsWith('/tools/') ? pathname.split('/')[2] : undefined;
    send({ type: toolSlug ? 'tool_open' : 'page_view', path, toolSlug, referrer: document.referrer });
  }, [pathname, search]);

  useEffect(() => {
    function click(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const element = target?.closest('button,a') as HTMLElement | null;
      if (!element || pathname.startsWith('/admin')) return;
      const label = (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 220);
      const toolHost = element.closest('.tool-public-page');
      const toolSlug = toolHost?.getAttribute('data-tool-slug') || (pathname.startsWith('/tools/') ? pathname.split('/')[2] : undefined);
      const isDownload = element instanceof HTMLAnchorElement && Boolean(element.download);
      const isToolAction = Boolean(element.closest('.tool-workspace')) && element.matches('.btn-primary,button');
      send({
        type: isDownload ? 'download' : isToolAction ? 'tool_action' : 'click',
        path: pathname,
        toolSlug,
        action: isDownload ? 'download' : isToolAction ? 'process' : 'click',
        label,
      });
    }
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [pathname]);

  return null;
}
