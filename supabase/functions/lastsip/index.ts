// Supabase Edge Function: POST /lastsip/submit  (Authorization: Bearer <twitch user token>)
//                         GET  /lastsip/boards?seed=YYYY-MM-DD
// The client's VITE_LEADERBOARD_URL = https://<project>.functions.supabase.co/lastsip
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname.endsWith('/boards')) {
    const seed = url.searchParams.get('seed');
    const [pour, wanted, stats] = await Promise.all([
      db.from('board_pour').select('*').eq('seed', seed).limit(10),
      db.from('board_wanted').select('*').eq('seed', seed).limit(10),
      db.from('board_stats').select('*').eq('seed', seed).maybeSingle(),
    ]);
    return json({ pour: pour.data ?? [], wanted: wanted.data ?? [], stats: stats.data });
  }
  if (req.method === 'POST' && url.pathname.endsWith('/submit')) {
    const e = await req.json();
    // Verified when a Twitch user token is supplied; otherwise accept the self-reported channel as unverified.
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    let who = { login: '', user_id: '' }, verified = false;
    if (token) {
      const v = await fetch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${token}` } });
      if (!v.ok) return json({ error: 'invalid twitch token' }, 401);
      who = await v.json(); verified = true;
    } else {
      const login = String(e.channel || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 25);
      if (!login || login === 'anonymous') return json({ error: 'connect a channel to post a pour' }, 400);
      who = { login, user_id: 'anon:' + login };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (e.seed !== today) return json({ error: 'only today\'s pour counts' }, 400);
    const row = { seed: e.seed, channel: who.login, channel_id: who.user_id, verified, water: +e.water, time_s: +e.time, score: Math.round(+e.score), finished: !!e.finished, saves: e.saves | 0 };
    const { error } = await db.from('pours').insert(row);
    if (error) return json({ error: error.code === '23505' ? 'already poured today' : error.message }, 409);
    const spills = (e.credits ?? []).slice(0, 10).map((c: { name: string; amount: number }) => ({ seed: e.seed, channel_id: who.user_id, viewer: String(c.name).slice(0, 40), spilled: Math.min(1, Math.max(0, +c.amount)) }));
    if (spills.length) await db.from('spills').upsert(spills);
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
});
