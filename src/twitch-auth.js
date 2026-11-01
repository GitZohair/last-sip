// "Sign in with Twitch" (implicit grant, no backend needed) + Helix + EventSub WebSocket.
// Requires VITE_TWITCH_CLIENT_ID (dev.twitch.tv app, redirect = site origin + '/').
// Everything is optional: without sign-in the game still works with anonymous chat.
export const CLIENT_ID = import.meta.env?.VITE_TWITCH_CLIENT_ID || '';
export const SCOPES = ['user:read:chat', 'bits:read', 'channel:read:redemptions', 'channel:manage:redemptions', 'clips:edit', 'moderator:read:followers', 'channel:read:subscriptions', 'channel:read:hype_train'];
const KEY = 'lastsip:twitch';

export function signIn() {
  const state = crypto.randomUUID(); sessionStorage.setItem('lastsip:oauth', state);
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: location.origin + '/', response_type: 'token', scope: SCOPES.join(' '), state, force_verify: 'false' });
  location.href = `https://id.twitch.tv/oauth2/authorize?${q}`;
}

// Call on page load: consumes #access_token from the redirect, validates it, returns session or null.
export async function restore() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('access_token') && h.get('state') === sessionStorage.getItem('lastsip:oauth')) {
    localStorage.setItem(KEY, h.get('access_token')); history.replaceState(null, '', location.pathname + location.search);
  }
  const token = localStorage.getItem(KEY); if (!token || !CLIENT_ID) return null;
  const v = await fetch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${token}` } });
  if (!v.ok) { localStorage.removeItem(KEY); return null; }
  const info = await v.json();
  return { token, userId: info.user_id, login: info.login, scopes: info.scopes };
}
export function signOut() { localStorage.removeItem(KEY); }

export async function helix(session, path, opts = {}) {
  const r = await fetch(`https://api.twitch.tv/helix/${path}`, { ...opts, headers: { 'Client-Id': CLIENT_ID, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json', ...opts.headers } });
  if (r.status === 204) return {};
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || r.status); return j;
}

// Streamer's own stuff for the house: avatar, current game box art, recent clip thumbnails, channel emotes.
export async function profile(session) {
  const id = session.userId;
  const [u, ch, clips, emotes] = await Promise.all([
    helix(session, `users?id=${id}`), helix(session, `channels?broadcaster_id=${id}`),
    helix(session, `clips?broadcaster_id=${id}&first=6`).catch(() => ({ data: [] })), helix(session, `chat/emotes?broadcaster_id=${id}`).catch(() => ({ data: [] })),
  ]);
  const game = ch.data?.[0]?.game_id ? await helix(session, `games?id=${ch.data[0].game_id}`).catch(() => null) : null;
  return {
    name: u.data?.[0]?.display_name || session.login, avatar: u.data?.[0]?.profile_image_url,
    boxArt: game?.data?.[0]?.box_art_url?.replace('{width}', '285').replace('{height}', '380'),
    clips: clips.data.map(c => c.thumbnail_url), emotes: emotes.data.map(e => e.images.url_4x || e.images.url_2x),
  };
}

// Auto-clip the last ~30s of the stream when something clip-worthy happens (needs to be live).
let lastClip = 0;
export async function clip(session) {
  if (!session || Date.now() - lastClip < 30000) return null; lastClip = Date.now();
  try { const r = await helix(session, `clips?broadcaster_id=${session.userId}`, { method: 'POST' }); return r.data?.[0]?.edit_url || null; } catch { return null; }
}

// Channel point rewards the game creates for the streamer (affiliates/partners only; silently skipped otherwise).
export const REWARDS = [{ title: 'LAST SIP: Pull the chaos lever', cost: 100, card: null }, { title: 'LAST SIP: Drop a fridge', cost: 500, card: 'fridge' }, { title: 'LAST SIP: Give them a lid', cost: 300, card: 'lid' }];
export async function ensureRewards(session) {
  try {
    const have = await helix(session, `channel_points/custom_rewards?broadcaster_id=${session.userId}&only_manageable_rewards=true`);
    for (const rw of REWARDS) if (!have.data.some(h => h.title === rw.title)) await helix(session, `channel_points/custom_rewards?broadcaster_id=${session.userId}`, { method: 'POST', body: JSON.stringify({ title: rw.title, cost: rw.cost, is_global_cooldown_enabled: true, global_cooldown_seconds: 10 }) });
    return true;
  } catch { return false; }
}

// EventSub over WebSocket: cheers, redemptions, follows, subs, gift subs, raids, hype trains -> onEvent({type, user, amount, title}).
const SUBS = [['channel.cheer', '1'], ['channel.channel_points_custom_reward_redemption.add', '1'], ['channel.follow', '2', true], ['channel.subscribe', '1'], ['channel.subscription.gift', '1'], ['channel.raid', '1', false, true], ['channel.hype_train.begin', '1']];
export function eventsub(session, onEvent, onStatus = () => {}) {
  let ws, closed = false;
  const open = (url = 'wss://eventsub.wss.twitch.tv/ws') => {
    ws = new WebSocket(url);
    ws.onmessage = async e => {
      const m = JSON.parse(e.data), type = m.metadata?.message_type;
      if (type === 'session_welcome') {
        for (const [t, version, mod, raid] of SUBS) {
          const condition = raid ? { to_broadcaster_user_id: session.userId } : { broadcaster_user_id: session.userId, ...(mod ? { moderator_user_id: session.userId } : {}) };
          helix(session, 'eventsub/subscriptions', { method: 'POST', body: JSON.stringify({ type: t, version, condition, transport: { method: 'websocket', session_id: m.payload.session.id } }) }).catch(() => {});
        }
        onStatus('eventsub');
      } else if (type === 'session_reconnect') { const old = ws; old.onclose = null; open(m.payload.session.reconnect_url); setTimeout(() => old.close(), 1000); }
      else if (type === 'notification') {
        const ev = m.payload.event, t = m.payload.subscription.type;
        const user = ev.user_name || ev.from_broadcaster_user_name || 'anonymous';
        if (t === 'channel.cheer') onEvent({ type: 'cheer', user, amount: ev.bits });
        else if (t.includes('redemption')) onEvent({ type: 'redeem', user, title: ev.reward.title });
        else if (t === 'channel.follow') onEvent({ type: 'follow', user });
        else if (t.includes('subscri')) onEvent({ type: 'sub', user, amount: ev.total || 1 });
        else if (t === 'channel.raid') onEvent({ type: 'raid', user, amount: ev.viewers });
        else if (t.includes('hype_train')) onEvent({ type: 'hype', user: 'HYPE TRAIN' });
      }
    };
    ws.onclose = () => { if (!closed) setTimeout(() => open(), 3000); };
  };
  open();
  return { close() { closed = true; ws?.close(); } };
}
