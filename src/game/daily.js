// The daily ritual: one official POUR per UTC day (Wordle), practice is unlimited.
// Streaks, an emoji receipt for sharing, and the leaderboard client (Supabase edge function; local fallback).
const K = 'lastsip:daily';
const load = () => JSON.parse(localStorage.getItem(K) || '{"days":{},"streak":0,"glassStreak":0,"last":null}');
const save = d => localStorage.setItem(K, JSON.stringify(d));
const API = import.meta.env?.VITE_LEADERBOARD_URL || '';

export function today(seed) { const d = load(); return { poured: !!d.days[seed], result: d.days[seed] || null, streak: d.streak, glassStreak: d.glassStreak }; }

export function recordPour(seed, result) {
  const d = load(); if (d.days[seed]) return d;
  const prev = new Date(Date.parse(seed) - 864e5).toISOString().slice(0, 10);
  d.streak = d.last === prev ? d.streak + 1 : 1;
  d.glassStreak = result.finished && result.water >= .5 ? (d.last === prev ? d.glassStreak + 1 : 1) : 0;
  d.days[seed] = result; d.last = seed; save(d); return d;
}

// One emoji per room: 💧 clean (<5% lost) · 🫗 messy (5–20%) · 💥 disaster (>20%) · then extras.
export function receipt({ saves = 0, seed, number, rooms, water, time, finished, villain, duck, streak, official }) {
  const icon = l => l < .05 ? '💧' : l < .2 ? '🫗' : '💥';
  const line = rooms.map(r => icon(r.lost)).join('');
  return [`LAST SIP #${number}${official ? '' : ' (practice)'} 🥛 ${finished ? Math.round(water * 100) + '%' : 'DNF'} ⏱️${time.toFixed(1)}s`,
    `${line}${finished ? '🎮' : '❌'}${duck ? '🦆' : ''}${saves ? ' 🙌×' + saves : ''}`,
    villain ? `Most wanted: ${villain}` : 'Chat behaved (suspicious)',
    streak > 1 ? `🔥 ${streak} day streak` : '', 'lastsip.gg'].filter(Boolean).join('\n');
}
export const dayNumber = seed => Math.floor((Date.parse(seed) - Date.parse('2026-11-01')) / 864e5) + 1;

// ---- leaderboards
export async function submit(session, entry) {
  if (!API) return localSubmit(entry);
  const headers = { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) };
  const r = await fetch(`${API}/submit`, { method: 'POST', headers, body: JSON.stringify(entry) });
  return r.ok ? r.json() : localSubmit(entry);
}
export async function boards(seed) {
  if (!API) return { local: true, pour: localBoard(seed), wanted: [], stats: null };
  const r = await fetch(`${API}/boards?seed=${seed}`); return r.ok ? r.json() : { local: true, pour: localBoard(seed), wanted: [] };
}
function localSubmit(e) { const all = JSON.parse(localStorage.getItem('lastsip:board') || '[]'); all.push(e); localStorage.setItem('lastsip:board', JSON.stringify(all.slice(-200))); return { local: true }; }
function localBoard(seed) { return JSON.parse(localStorage.getItem('lastsip:board') || '[]').filter(e => e.seed === seed).sort((a, b) => b.score - a.score).slice(0, 10); }
