import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createChaseCam } from './character.js';
import { createRun, LIMIT } from './run.js';
import { dayKey } from './rng.js';
import { today, recordPour, receipt, dayNumber, submit, boards } from './daily.js';
import { ChatDirector, connectChat, emoteUrl } from '../twitch.js';
import * as tw from '../twitch-auth.js';
import { $, ui } from './ui.js';
import { createScream } from './scream.js';

const params = new URLSearchParams(location.search);
const seed = /^\d{4}-\d{2}-\d{2}$/.test(params.get('seed') || '') ? params.get('seed') : dayKey();
const world = createWorld($('world'));
const player = createPlayer(world.renderer.domElement);
const chase = createChaseCam(world.camera);
const director = new ChatDirector();
const scream = createScream();
const lastEmote = new Map(); // viewer -> their last emote url (for MOST WANTED posters)
let run = null, chat = null, session = null, profile = null, official = false, slowmo = 0;

// ---------- Twitch: anonymous chat (zero setup) + optional sign-in for EventSub, rewards, clips
function connect(name) { chat?.close(); chat = connectChat(name, { onMessage: onChat, onStatus: ui.chatStatus }); localStorage.setItem('lastsip:channel', name); }
function onChat(msg) {
  if (msg.emotes[0]) lastEmote.set(msg.user, emoteUrl(msg.emotes[0].id));
  const r = director.handle(msg); if (!r) return;
  if (r.kind === 'chaos' || r.kind === 'help') play(r.event, r.users);
  else if (r.kind === 'queued') ui.feed(`⏳ ${r.users[0]} queued a pull`, 'muted');
  else if (r.kind === 'vote') ui.feed(`🫶 ${r.users[0]} wants to steady you (${r.have}/${r.needed})`, 'help');
  else if (r.kind === 'support') play('deck', [`${r.users[0]} (${r.bits} bits)`], { bias: Math.min(1, r.bits / 500) });
  else if (r.kind === 'frame') run?.gallery.hang(r).then(res => ui.feed(res.ok ? `🖼️ ${r.user} hung a frame` : `🚫 frame from ${r.user} rejected (${res.reason})`, res.ok ? 'help' : 'muted'));
}
function onEventSub(e) {
  const map = { cheer: ['deck', Math.min(1, e.amount / 500)], follow: ['deck', 0], sub: ['deck', .5], raid: ['nuke', 0], hype: ['deck', 1] };
  if (e.type === 'redeem') return play(/fridge/i.test(e.title) ? 'fridge' : /lid/i.test(e.title) ? 'lid' : 'deck', [e.user]);
  const [card, bias] = map[e.type] || []; if (card) play(card, [e.type === 'raid' ? `RAID ${e.user} (+${e.amount})` : e.user], { bias });
}
function play(event, users, opts) {
  const card = run?.play(event, users, opts); if (!card) return;
  ui.feed(`${card.icon} ${users.join(', ')} → ${card.label}`, card.help ? 'help' : card.r === 'l' ? 'legend' : 'chaos');
  ui.slot(card, users.join(', '));
  if (card.r === 'l') clipIt('legendary');
}
async function clipIt(why) { const url = await tw.clip(session); if (url) ui.feed(`🎬 auto-clipped: ${why}`, 'help'); }
let simN = 0;
const simulate = text => onChat({ user: `test_viewer_${++simN % 6}`, login: `test_viewer_${simN % 6}`, text, bits: 0, mod: true, emotes: [] });

// ---------- runs
async function start(asPour) {
  const d = today(seed); official = asPour && !d.poured;
  ui.loading(true);
  run = await createRun(world, player, { seed, scream, profile: profile || (chat ? { name: chat.channel } : null), hooks: {
    spill: (who, amt) => ui.blame(who, amt), toast: t => ui.feed(t, 'help'),
    house: card => card && ui.slot(card, 'THE HOUSE'),
    catchPrompt: on => ui.catchPrompt(on), saved: n => { slowmo = .35; ui.catchPrompt(false); ui.feed(`🙌 CAUGHT IT! (${n} saves)`, 'help'); },
    scream: () => ui.feed('🗣️ AAAAAAA (dash)', 'muted'),
    lastSip: () => { slowmo = 1.2; ui.lastSip(); clipIt('last sip'); }, clip: clipIt, end: finish,
  } });
  const v = JSON.parse(localStorage.getItem('lastsip:villain') || 'null');
  if (v?.image) run.gallery.hang({ ...v, trusted: true, mostWanted: true });
  ui.loading(false); ui.show('hud'); ui.mode(official ? `THE POUR · #${dayNumber(seed)}` : 'PRACTICE');
  world.renderer.domElement.requestPointerLock?.();
}
async function finish(r) {
  document.exitPointerLock?.();
  const water = r.glass.state.water, time = r.t, score = r.won ? Math.round(water * 1000 + Math.max(0, LIMIT - time) * 6) : 0;
  const villain = r.ledger.villain();
  if (villain) localStorage.setItem('lastsip:villain', JSON.stringify({ user: villain.name, image: lastEmote.get(villain.name) || null, title: 'MOST WANTED' }));
  const rooms = r.level.rooms.map(x => ({ key: x.key, lost: r.roomLoss[x.key] }));
  const d = official ? recordPour(seed, { finished: r.won, water, time, score }) : today(seed);
  const text = receipt({ saves: r.saves, seed, number: dayNumber(seed), rooms, water, time, finished: r.won, villain: villain?.name, duck: r.duck, streak: d.streak, official });
  if (official) submit(session, { saves: r.saves, seed, channel: session?.login || chat?.channel || 'anonymous', water, time, score, finished: r.won, credits: r.ledger.credits().slice(0, 10) });
  const board = await boards(seed).catch(() => null);
  setTimeout(() => ui.results({ won: r.won, water, time, score, credits: r.ledger.credits(), receipt: text, official, streak: d.streak, board }), 1600);
}

// ---------- boot
ui.bind({ start: () => start(true), practice: () => start(false), connect, mic: () => scream.enable(), signIn: tw.signIn, lock: () => run?.state === 'play' && world.renderer.domElement.requestPointerLock?.() });
(async () => {
  ui.intro({ seed, number: dayNumber(seed), daily: today(seed), canSignIn: !!tw.CLIENT_ID });
  session = await tw.restore().catch(() => null);
  if (session) {
    ui.signedIn(session.login); connect(session.login);
    profile = await tw.profile(session).catch(() => null);
    tw.eventsub(session, onEventSub, s => ui.feed(`⚡ ${s} connected`, 'help'));
    tw.ensureRewards(session);
  } else if (localStorage.getItem('lastsip:channel')) connect(localStorage.getItem('lastsip:channel'));
  ui.ready();
})();

// ---------- loop: fixed 120 Hz simulation, render every frame
let last = performance.now(), acc = 0, t = 0;
const STEP = 1 / 120;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(.1, (now - last) / 1000); last = now; world.adapt(dt);
  if (!run) return;
  if (slowmo > 0) { slowmo -= dt; dt *= .35; }
  t += dt;
  let info = null;
  if (run.state === 'play') {
    acc += dt; let n = 0;
    while (acc >= STEP && n++ < 12) { info = run.step(STEP); acc -= STEP; }
    const q = director.tick(); if (q) play(q.event, q.users);
  }
  run.render(dt, t);
  const m = run.mods;
  chase(dt, player, run.level.colliders, m.eye, m.roll, run.chaos.active.quake > 0 ? .04 : 0);
  world.light(player, dt, { dark: run.chaos.active.lights > 0, discoOn: m.disco, fogOn: m.fog });
  if (info) ui.hud({ water: run.glass.state.water, danger: run.glass.state.danger, time: LIMIT - run.t, room: info.room.name, hazard: info.hazard, steady: player.steady, calm: info.calm, mods: m.active(), progress: Math.min(1, -player.pos.z / run.level.length) });
  world.renderer.render(world.scene, world.camera);
}
requestAnimationFrame(loop);
if (params.has('dev')) window.lastSip = { run: () => run,
  simulate, play, start,
  state: () => run && { state: run.state, t: run.t, water: run.glass.state.water, pos: { ...player.pos }, room: run.level.roomAt(player.pos.z).name },
  goto: key => { const r = run.level.rooms.find(x => x.key === key); player.reset({ x: 0, z: r.z0 - 1.2, yaw: 0 }); return r.name; },
};
