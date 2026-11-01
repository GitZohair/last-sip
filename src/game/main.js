import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createChaseCam } from './character.js';
import { createRun, LIMIT } from './run.js';
import { dayKey } from './rng.js';
import { today, recordPour, receipt, dayNumber, submit, boards, history } from './daily.js';
import { ChatDirector, connectChat, emoteUrl } from '../twitch.js';
import * as tw from '../twitch-auth.js';
import { $, ui } from './ui.js';
import { createVoice } from './voice.js';
import { sfx } from './sfx.js';
import { INGREDIENTS, todaysOrder } from './recipe.js';
import { buildIsland } from './island.js';
import { RULES, todaysRule } from './rules.js';
import { createHudCues } from './hudcues.js';

const params = new URLSearchParams(location.search);
// Pointer lock can be refused (embedded browsers, no user gesture): ignore, drag-free play still works with arrows.
const lockPointer = () => { try { world.renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch {} };
const seed = /^\d{4}-\d{2}-\d{2}$/.test(params.get('seed') || '') ? params.get('seed') : dayKey();
const world = createWorld($('world'));
const player = createPlayer(world.renderer.domElement);
const chase = createChaseCam(world.camera);
const director = new ChatDirector();
const voice = createVoice();
const lastEmote = new Map(); // viewer -> their last emote url (for MOST WANTED posters)
let cues = null, run = null, chat = null, session = null, profile = null, official = false, slowmo = 0;

// ---------- Twitch: anonymous chat (zero setup) + optional sign-in for EventSub, rewards, clips
function connect(name) { chat?.close(); chat = connectChat(name, { onMessage: onChat, onStatus: ui.chatStatus }); localStorage.setItem('lastsip:channel', name); }
function onChat(msg) {
  if (msg.emotes[0]) lastEmote.set(msg.user, emoteUrl(msg.emotes[0].id));
  const r = director.handle(msg); if (!r) return;
  if (r.kind === 'chaos' || r.kind === 'help') play(r.event, r.users);
  else if (r.kind === 'queued') ui.feed(`${r.users[0]} is queued`, 'muted', 'stopwatch');
  else if (r.kind === 'vote') ui.feed(`${r.users[0]} wants to steady you (${r.have}/${r.needed})`, 'help', 'steady');
  else if (r.kind === 'support') r.bits >= 100 ? play('sniper', [r.users[0]]) : play('deck', [`${r.users[0]} (${r.bits} bits)`], { bias: Math.min(1, r.bits / 500) });
  else if (r.kind === 'frame') run?.gallery.hang(r).then(res => ui.feed(res.ok ? `${r.user} hung a frame` : `Frame from ${r.user} rejected (${res.reason})`, res.ok ? 'help' : 'muted', res.ok ? 'chat' : 'warning'));
}
function onEventSub(e) {
  if (e.type === 'sub' || (e.type === 'cheer' && e.amount >= 100)) return play('sniper', [e.user]);
  const map = { cheer: ['deck', Math.min(1, e.amount / 500)], follow: ['barrel', 0], sub: ['deck', .5], raid: ['nuke', 0], hype: ['deck', 1] };
  if (e.type === 'redeem') return play(/fridge/i.test(e.title) ? 'fridge' : /lid/i.test(e.title) ? 'lid' : 'deck', [e.user]);
  const [card, bias] = map[e.type] || []; if (card) play(card, [e.type === 'raid' ? `RAID ${e.user} (+${e.amount})` : e.user], { bias });
}
function play(event, users, opts) {
  if (event === 'sniper' || event === 'barrel') { if (run?.summon(event, users[0])) { ui.feed(`${users[0]}: ${event === 'sniper' ? 'SNIPER' : 'BARREL'}`, 'legend', event === 'sniper' ? 'cannon' : 'barrel'); } return; }
  const card = run?.play(event, users, opts); if (!card) return;
  ui.feed(`${users.join(', ')}: ${card.label}`, card.help ? 'help' : card.r === 'l' ? 'legend' : 'chaos', card.id);
  ui.slot(card, users.join(', '));
  if (card.r === 'l') clipIt('legendary');
}
async function clipIt(why) { const url = await tw.clip(session); if (url) ui.feed(`Auto-clipped: ${why}`, 'help', 'twitch'); }
let simN = 0;
const simulate = text => onChat({ user: `test_viewer_${++simN % 6}`, login: `test_viewer_${simN % 6}`, text, bits: 0, mod: true, emotes: [] });

// ---------- runs
async function start(asPour) {
  const d = today(seed); official = asPour && !d.poured;
  sfx.unlock(); voice.enable(); // the mic is part of the game; V is the fallback if it's refused
  ui.loading(true);
  run = await createRun(world, player, { seed, voice, profile: profile || (chat ? { name: chat.channel } : null), hooks: {
    spill: (who, amt) => ui.blame(who, amt), toast: (t, ico) => ui.feed(t, 'help', ico),
    house: card => card && ui.slot(card, 'THE HOUSE'),
    catchPrompt: on => ui.catchPrompt(on), saved: n => { slowmo = .35; ui.catchPrompt(false); },
    lastSip: () => { slowmo = 1.2; ui.lastSip(); clipIt('last sip'); }, clip: clipIt, end: finish, trick: t => ui.trick(t), fell: () => ui.big('SPLASH'), collect: (id, n, total) => { showOrder(); cues?.pop(`+ ${INGREDIENTS[id].label}  ${n}/${total}`, INGREDIENTS[id].color, true); if (n === total) setTimeout(() => cues?.pop('TO THE HUT', '#c9a2ff', true), 900); },
    hit: (who, kind) => cues?.pop(kind === 'BUMPED' ? `${who}!` : `${kind === 'SNIPER' ? 'SNIPED' : 'ROLLED'} BY ${who}`, '#ff5c7a'),
  } });
  const v = JSON.parse(localStorage.getItem('lastsip:villain') || 'null');
  if (v?.image) run.gallery.hang({ ...v, trusted: true, mostWanted: true });
  cues?.remove(); cues = createHudCues($('hud'));
  ui.loading(false); ui.show('hud'); run.state = 'ready'; showOrder(); ui.mode(official ? `THE POUR · #${dayNumber(seed)}` : 'PRACTICE');
  lockPointer();
  const me = run; await ui.countdown(); if (me === run && run.state === 'ready') run.state = 'play';
}
function showOrder() { const rc = run.recipe; ui.order(rc.order, Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.label])), Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.color])), rc.got, RULES[run.rule]); }
// Front page backdrop: the real island, slowly orbiting behind the editorial panel.
let preview = null;
async function backdrop() { const scene = world.reset(); await buildIsland(scene); if (!run) preview = { t: 0 }; }
function orbit(dt) {
  preview.t += dt; const a = preview.t * .045, cam = world.camera;
  cam.position.set(14 + Math.sin(a) * 34, 15 + Math.sin(a * .7) * 2, -42 + Math.cos(a) * 34); cam.lookAt(6, 0, -42);
  world.light({ pos: { x: 0, z: -40 } }, dt, {}); world.scene.userData.sea?.userData.update(preview.t); world.render();
}
async function finish(r) {
  document.exitPointerLock?.(); if (r.won) ui.confetti();
  const water = r.glass.state.water, time = r.t, score = r.won ? Math.round(water * 1000 + Math.max(0, LIMIT - time) * 6 + r.style.points) : 0;
  const villain = r.ledger.villain();
  if (villain) localStorage.setItem('lastsip:villain', JSON.stringify({ user: villain.name, image: lastEmote.get(villain.name) || null, title: 'MOST WANTED' }));
  const rooms = r.level.rooms.map(x => ({ key: x.key, lost: r.roomLoss[x.key] }));
  const d = official ? recordPour(seed, { finished: r.won, water, time, score }) : today(seed);
  const text = receipt({ order: r.recipe.order.map(id => INGREDIENTS[id].label), falls: r.falls, saves: r.saves, seed, number: dayNumber(seed), rooms, water, time, finished: r.won, villain: villain?.name, duck: r.duck, streak: d.streak, official });
  if (official) submit(session, { saves: r.saves, seed, channel: session?.login || chat?.channel || 'anonymous', water, time, score, finished: r.won, credits: r.ledger.credits().slice(0, 10) });
  const board = await boards(seed).catch(() => null);
  setTimeout(() => ui.results({ rooms, won: r.won, water, time, score, credits: r.ledger.credits(), receipt: text, official, streak: d.streak, board }), 1600);
}

// ---------- boot
ui.bind({ start: () => start(true), practice: () => start(false), connect, mic: () => voice.enable(), signIn: tw.signIn, lock: () => run?.state === 'play' && lockPointer() });
(async () => {
  ui.intro({ seed, number: dayNumber(seed), daily: today(seed), canSignIn: !!tw.CLIENT_ID });
  ui.todayOrder(todaysOrder(seed), INGREDIENTS, RULES[todaysRule(seed)]);
  ui.tabs(tab => { if (tab === 'board') boards(seed).then(ui.introBoard).catch(() => ui.introBoard(null)); if (tab === 'stats') ui.stats(history()); });
  backdrop();
  session = await tw.restore().catch(() => null);
  if (session) {
    ui.signedIn(session.login); connect(session.login);
    profile = await tw.profile(session).catch(() => null);
    tw.eventsub(session, onEventSub, s => ui.feed(`EventSub connected`, 'help', 'twitch'));
    tw.ensureRewards(session);
  } else if (localStorage.getItem('lastsip:channel')) connect(localStorage.getItem('lastsip:channel'));
  ui.ready();
})();

// ---------- loop: fixed 120 Hz simulation, render every frame
let last = performance.now(), acc = 0, t = 0;
const STEP = 1 / 120, prev = { x: 0, y: 0, z: 0 }, real = { x: 0, y: 0, z: 0 };
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(.1, (now - last) / 1000); last = now; world.adapt(dt);
  if (!run) { if (preview) orbit(dt); return; }
  if (slowmo > 0) { slowmo -= dt; dt *= .35; }
  t += dt;
  let info = null;
  if (run.state === 'play') {
    acc += dt; let n = 0;
    while (acc >= STEP && n++ < 12) { prev.x = player.pos.x; prev.y = player.y; prev.z = player.pos.z; info = run.step(STEP); acc -= STEP; }
    if (n > 12) acc = 0; // after a long stall, don't try to catch up
    const q = director.tick(); if (q) play(q.event, q.users);
  }
  // Render between the last two sim steps (smooth motion at any refresh rate). Skipped on teleports.
  real.x = player.pos.x; real.y = player.y; real.z = player.pos.z;
  const a = run.state === 'play' ? acc / STEP : 1;
  if (a < 1 && Math.hypot(real.x - prev.x, real.z - prev.z) < 1) { player.pos.x = prev.x + (real.x - prev.x) * a; player.y = prev.y + (real.y - prev.y) * a; player.pos.z = prev.z + (real.z - prev.z) * a; }
  run.render(dt, t);
  const m = run.mods;
  chase(dt, player, run.level.colliders, m.eye, m.roll, run.chaos.active.quake > 0 ? .04 : 0);
  cues?.update(dt, run, player, world.camera, run.wind);
  document.body.classList.toggle('dark', run.chaos.active.lights > 0);
  world.light(player, dt, { dark: run.chaos.active.lights > 0, discoOn: m.disco, fogOn: m.fog });
  if (info) ui.hud({ water: run.glass.state.water, danger: run.glass.state.danger, time: LIMIT - run.t, room: info.room.name, hazard: info.hazard, steady: player.steady, calm: info.calm, mods: m.active(), progress: Math.min(1, -player.pos.z / run.level.length), vacuum: info.vacuum, style: info.style, voice: info.voice });
  world.render();
  player.pos.x = real.x; player.y = real.y; player.pos.z = real.z;
}
requestAnimationFrame(loop);
if (params.has('dev')) window.lastSip = { run: () => run, world,
  simulate, play, start,
  state: () => run && { state: run.state, t: run.t, water: run.glass.state.water, pos: { ...player.pos }, room: run.level.roomAt(player.pos.z).name },
  tp: (x, z) => player.reset({ x, z, yaw: 0 }), player: () => player,
  goto: key => { const r = run.level.rooms.find(x => x.key === key); player.reset({ x: 0, z: r.z0 - 1.2, yaw: 0 }); return r.name; },
};
