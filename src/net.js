// THE ARENA LINK: a tiny Supabase Realtime (Phoenix) broadcast client over a raw WebSocket. No library, no login.
// Every player in a room broadcasts its own state ~12x/s; hits are sent to the victim, who applies them (victim-side
// authority keeps it simple and cheat-proof enough for a party game). The anon key is public by design.
const URL = import.meta.env?.VITE_SUPABASE_URL || 'https://aqcxgjtbwuyhtcqusoax.supabase.co';
const KEY = import.meta.env?.VITE_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxY3hnanRid3V5aHRjcXVzb2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1Mjc1NTgsImV4cCI6MjEwOTEwMzU1OH0.JbQNlZ459NNFXYoZGZQ4rV7rxg9WmmW8M0eYqB00fsk';

export function joinRoom(room, { onMessage, onStatus = () => {} } = {}) {
  const topic = 'realtime:lastsip-' + String(room).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  let ws, ref = 0, hb = 0, closed = false, ready = false, retry = 800;
  const send = (event, payload) => { if (ready) ws.send(JSON.stringify({ topic, event: 'broadcast', payload: { type: 'broadcast', event, payload }, ref: String(++ref) })); };
  const open = () => {
    ws = new WebSocket(URL.replace('https', 'wss') + '/realtime/v1/websocket?apikey=' + KEY + '&vsn=1.0.0');
    ws.onopen = () => {
      ws.send(JSON.stringify({ topic, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false }, access_token: KEY }, ref: String(++ref) }));
      clearInterval(hb); hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) })), 25000);
    };
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.event === 'phx_reply' && m.topic === topic && m.payload?.status === 'ok' && !ready) { ready = true; retry = 800; onStatus('connected'); return; }
      if (m.event === 'phx_reply' && m.payload?.status === 'error') { onStatus('error', m.payload?.response); return; }
      if (m.event === 'broadcast' && m.payload) onMessage?.(m.payload.event, m.payload.payload);
    };
    ws.onclose = () => { ready = false; clearInterval(hb); if (closed) return; onStatus('reconnecting'); setTimeout(open, retry); retry = Math.min(retry * 2, 8000); };
  };
  open();
  return { room: topic.slice(17), send, get ready() { return ready; }, close() { closed = true; clearInterval(hb); ws?.close(); } };
}
export const newRoomCode = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
