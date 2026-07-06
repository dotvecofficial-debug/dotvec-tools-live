'use client';

import { useState } from 'react';
import type { ErrorReport } from '@/lib/store';
import { errorMessage, requestJson } from '@/lib/client-api';

export function AdminErrorsClient({ initial }: { initial: ErrorReport[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState('');

  async function update(id: string, status: ErrorReport['status']) {
    if (savingId) return;
    setSavingId(id);
    setMessage('');
    try {
      await requestJson<{ ok: true }>('/api/admin/errors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setMessage('Error status saved successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Error status could not be saved.'));
    } finally {
      setSavingId('');
    }
  }

  return <div>
    <div className="admin-top"><div><span className="eyebrow">Diagnostics</span><h1>Error Center</h1></div></div>
    {message && <div className={`status ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}
    {items.length ? <div className="grid">{items.map((item) => <div className="card" key={item.id} style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap' }}>
        <div><span className={`badge ${item.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span><h3>{item.toolSlug}</h3></div>
        <select className="select" style={{ width: 180 }} value={item.status} disabled={savingId === item.id} onChange={(event) => update(item.id, event.target.value as ErrorReport['status'])}>
          <option value="new">New</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option>
        </select>
      </div>
      <pre className="output-code">{JSON.stringify(item, null, 2)}</pre>
    </div>)}</div> : <div className="card" style={{ padding: 30 }}><h3>No error reports</h3><p className="muted">Privacy-safe tool errors will appear here.</p></div>}
  </div>;
}
