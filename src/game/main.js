import * as THREE from 'three';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createChaseCam } from './character.js';
import { createRun, LIMIT } from './run.js';
import { dayKey } from './rng.js';
import { today, recordPour, receipt, dayNumber, submit, boards, history } from './daily.js';
import { ChatDirector, connectChat, emoteUrl, parseLine } from '../twitch.js';
import * as tw from '../twitch-auth.js';
import { $, ui } from './ui.js';
import { createVoice } from './voice.js';
import { sfx } from './sfx.js';
import { todaysOrder, INGREDIENTS } from './recipe.js';
import { buildIsland } from './island.js';
import { RULES, todaysRule } from './rules.js';
import { createHudCues } from './hudcues.js';
import { createArena } from './arena.js';
import { joinRoom, newRoomCode } from '../net.js';

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
// ---------- STREAMER ARENA: ?room=CODE puts everyone with that link on the same island
const ME = { id: Math.random().toString(36).slice(2, 10), name: localStorage.getItem('lastsip:channel') || 'GUEST' + Math.floor(100 + Math.random() * 900), color: ['#ff4f6d', '#5dd39e', '#ffb020', '#4fc3ff', '#c77dff', '#ff8c42'][Math.floor(Math.random() * 6)] };
let room = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), net = null, arena = null;
function openRoom(code) {
  room = code; net?.close(); window.history.replaceState(null, '', `?room=${code}${params.has('dev') ? '&dev' : ''}`);
  net = joinRoom(code, { onStatus: st => ui.roomStatus?.(code, st), onMessage: (ev, d) => {
    if (ev === 'start' && (!run || run.state !== 'play')) { if (d.id !== ME.id) { asRemote = true; start(false).finally(() => { asRemote = false; }); } return; } // somebody started the round: everyone in the room goes
    arena?.onMessage(ev, d, {
      hit: d => run?.applyHit?.(d),
      attack: d => { if (run?.summon(d.kind, `${d.from} CHAT: ${d.user}`, 'paid')) ui.feed(`${d.from.toUpperCase()}'S CHAT sent ${d.kind.toUpperCase()} (${d.user})`, 'legend', 'twitch'); },
    });
  } });
}
if (room) openRoom(room);
let cues = null, run = null, chat = null, session = null, profile = null, official = false, slowmo = 0;

// ---------- Twitch: anonymous chat (zero setup) + optional sign-in for EventSub, rewards, clips
function connect(name) { ME.name = name; chat?.close(); chat = connectChat(name, { onMessage: onChat, onStatus: ui.chatStatus }); localStorage.setItem('lastsip:channel', name); }
const BOTS = /^(nightbot|streamelements|streamlabs|moobot|fossabot|wizebot|sery_bot|soundalerts|kofistreambot|botrixoficial|pokemoncommunitygame|commanderroot)$/;
// chat's emotes float up the right edge while you play (rate-limited), so the stream's reactions are in the game
const reacts = document.createElement('div'); reacts.id = 'reacts'; document.body.appendChild(reacts); let reactT = 0;
function react(url) {
  const now = performance.now(); if (now - reactT < 180 || run?.state !== 'play') return; reactT = now;
  const i = new Image(); i.src = url; i.className = 'react'; i.alt = ''; i.style.right = `${2 + Math.random() * 9}%`; i.onanimationend = () => i.remove(); i.onerror = () => i.remove();
  reacts.appendChild(i); if (reacts.children.length > 14) reacts.firstChild.remove();
}
function onChat(msg) {
  if (msg.emotes?.[0]) { lastEmote.set(msg.user, emoteUrl(msg.emotes[0].id)); react(emoteUrl(msg.emotes[0].id, '2.0')); }
  if (BOTS.test(msg.login || '')) return; // chat bots never order drinks or vote
  if (!msg.notice && msg.user) run?.shift?.enter(msg.user, 1, msg.color); // anyone chatting can be drawn as a customer; !order = 2 tickets, subs 3
  const r = director.handle(msg); if (!r) return;
  if (r.kind === 'chaos' || r.kind === 'help') play(r.event, r.users, { src: 'chat' });
  else if (r.kind === 'notice') onNotice(r);
  else if (r.kind === 'redeem') { ui.feed(`${r.users[0]} spent channel points`, 'legend', 'twitch'); play(r.event || pickBallot()[0], r.users, { src: 'paid' }); }
  else if (r.kind === 'first') { run?.shift?.enter(r.user, 3, r.color); ui.feed(`First chat from ${r.user}: next customer`, 'help', 'glass'); }
  else if (r.kind === 'order') { run?.shift?.enter(r.user, r.tickets, msg.color); if (director.active() < 5) ui.feed(`${r.user} ordered a drink`, 'help', 'glass'); }
  else if (r.kind === 'ballot') ui.ballot(r);
  else if (r.kind === 'queued') ui.feed(`${r.users[0]} is queued`, 'muted', 'stopwatch');
  else if (r.kind === 'vote') ui.feed(`LIFEGUARD VOTE ${r.have}/${r.needed}`, 'help', 'steady', 'vote');
  else if (r.kind === 'support') r.bits >= 100 ? play('sniper', [r.users[0]], { src: 'paid' }) : play('deck', [`${r.users[0]} (${r.bits} bits)`], { bias: Math.min(1, r.bits / 500) });
  else if (r.kind === 'frame') run?.dropFrame(r).then(res => ui.feed(res.ok ? `${r.user} dropped a frame` : `Frame from ${r.user} rejected (${res.reason})`, res.ok ? 'help' : 'muted', res.ok ? 'chat' : 'warning'));
}
// Subs, gifts and raids from anonymous chat (no dev app needed): each one fires in the supporter lane AND
// puts names into the customer raffle, so supporters show up on the island as both sabotage and customers.
function onNotice(n) {
  const s = run?.shift;
  if (n.notice === 'sub') { s?.enter(n.user, 3, n.color); ui.feed(n.months > 1 ? `${n.user} resubbed (${n.months} months)` : `${n.user} subscribed`, 'legend', 'twitch'); return onEventSub({ type: 'sub', user: n.user }); }
  if (n.notice === 'gift') { if (n.recipient) s?.enter(n.recipient, 3); ui.feed(`${n.user} gifted ${n.recipient || 'a sub'}: drinks on them`, 'legend', 'twitch'); return onEventSub({ type: 'sub', user: n.user }); }
  if (n.notice === 'giftbomb') { ui.feed(`${n.user} gifted ${n.count} subs`, 'legend', 'twitch'); return onEventSub({ type: 'hype', user: `${n.user} (${n.count} gifts)` }); }
  if (n.notice === 'raid') { s?.enter(n.user, 9, n.color); ui.feed(`RAID: ${n.user} brought ${n.count}`, 'legend', 'twitch'); return onEventSub({ type: 'raid', user: n.user, amount: n.count }); }
}
function onEventSub(e) {
  if (e.type === 'sub' || (e.type === 'cheer' && e.amount >= 100)) return play('sniper', [e.user], { src: 'paid' });
  const map = { cheer: ['deck', Math.min(1, e.amount / 500)], follow: ['barrel', 0], sub: ['deck', .5], raid: ['nuke', 0], hype: ['deck', 1] };
  if (e.type === 'redeem') return play(/fridge/i.test(e.title) ? 'fridge' : /lid/i.test(e.title) ? 'lid' : 'deck', [e.user]);
  const [card, bias] = map[e.type] || []; if (card) play(card, [e.type === 'raid' ? `RAID ${e.user} (+${e.amount})` : e.user], { bias });
}
function play(event, users, opts) {
  if (event === 'sniper') event = 'drop'; // no towers in the arena: snipes arrive as sky drops
  if (arena?.peers.size && ['drop', 'sniper', 'barrel'].includes(event) && opts?.src !== 'house') { const target = arena.attack(event, users[0], ME.name); if (target) { ui.feed(`YOUR CHAT sent ${event.toUpperCase()} to ${target}`, 'legend', 'twitch'); return; } }
  if (event === 'drop') { if (run?.summon('drop', users[0], opts?.src)) ui.feed(`${users[0]}: SKY DROP`, 'legend', 'fridge'); return; }
  if (event === 'sniper' || event === 'barrel') { if (run?.summon(event, users[0], opts?.src)) { ui.feed(`${users[0]}: ${event === 'sniper' ? 'SNIPER' : 'BARREL'}`, 'legend', event === 'sniper' ? 'cannon' : 'barrel'); } return; }
  if (event === 'calm' && users[0]) run?.summon('lifeguard', users[0]);
  const card = run?.play(event, users, opts); if (!card) return;
  $('feed').querySelector('[data-key="vote"]')?.remove();
  ui.slot(card, users.join(', ')); // the slot card is the announcement; no duplicate feed line
  if (card.r === 'l') clipIt('legendary');
}
async function clipIt(why) { const url = await tw.clip(session); if (url) ui.feed(`Auto-clipped: ${why}`, 'help', 'twitch'); }
let simN = 0, ballotT = 6;
const BALLOT_LABEL = { sniper: 'SNIPER', barrel: 'BARREL', drop: 'SKY DROP', storm: 'SEA BREEZE', deck: 'MYSTERY CARD', calm: 'LIFEBUOY', bomb: 'BOMB', fridge: 'FRIDGE' };
function pickBallot() { // two sabotage options, sometimes one helpful
  const bad = ['barrel', 'drop', 'storm', 'deck'].sort(() => Math.random() - .5);
  return Math.random() < .35 ? [bad[0], bad[1], 'calm'] : bad.slice(0, 3);
}
const simulate = text => onChat({ user: `test_viewer_${++simN % 6}`, login: `test_viewer_${simN % 6}`, text, bits: 0, mod: true, emotes: [] });

// ---------- runs
let asRemote = false;
async function start(asPour) {
  const d = today(seed); official = asPour && !d.poured;
  sfx.unlock(); // no mic prompt: nothing in the game needs it
  ui.loading(true);
  run = await createRun(world, player, { seed, voice, profile: profile || (chat ? { name: chat.channel } : null), hooks: {
    spill: (who, amt) => ui.blame(who, amt), toast: (t, ico) => ui.feed(t, 'help', ico),
    house: card => card && ui.slot(card, 'THE HOUSE'),
    catchPrompt: on => ui.catchPrompt(on), saved: n => { slowmo = .35; ui.catchPrompt(false); },
    lastSip: () => { slowmo = 1.2; ui.lastSip(); clipIt('last sip'); }, clip: clipIt, end: finish, trick: () => {}, // style tricks no longer pop text: tips are the only score
    fell: () => ui.big('SPLASH'),
    toppled: (n, who) => { slowmo = 1.1; ui.big(n >= 8 ? 'TIMBER!' : 'CRASH'); cues?.pop(`${n} DRINKS DOWN${who !== 'GRAVITY' ? ` · THANKS ${who}` : ''}`, '#ff5c7a', true); }, drowned: n => { ui.big('GLUG'); cues?.pop(n ? `${n} DRINK${n > 1 ? 'S' : ''} LOST AT SEA` : 'WASHED UP AT THE BAR', '#ff5c7a', true); },
    order: c => { sfx.ding(); cues?.pop(c.far ? `ORDER ON THE ISLAND  ${c.user}` : `NEW ORDER  ${c.user}`, c.far ? '#ffd166' : c.color); },
    hurry: c => { sfx.beep(true); cues?.pop(`${c.user} IS LEAVING`, '#ffb020'); },
    loaded: n => { if (n % 5 === 0) cues?.pop(`TOWER x${n}`, n >= 15 ? '#ffd166' : '#c9a2ff', n >= 15); },
    served: (c, tip) => cues?.pop(c.mood === 'happy' ? `+$${tip}  ${c.want > 1 ? `${c.want} DRINKS FROM` : 'FROM'} A x${c.tower} TOWER  ${c.user}` : `1 STAR FROM ${c.user}`, c.mood === 'happy' ? '#5dff9b' : '#ff5c7a', true),
    walkout: (c, v) => { cues?.pop(`${c.user} WALKED OUT`, '#ff5c7a', true); if (v) ui.feed(`Walkout blamed on ${v}`, 'muted', 'warning'); },
    buoy: who => cues?.pop(`LIFEBUOY FROM ${who}`, '#5dffa0'), rescued: who => { cues?.pop(`SAVED BY ${who}`, '#5dffa0', true); clipIt('rescue'); },
    hit: (who, kind) => cues?.pop(kind === 'BUMPED' ? `${who}!` : kind === 'SNIPER' ? `SNIPED BY ${who}` : kind === 'BARREL' ? `ROLLED BY ${who}` : `${kind} FROM ${who}`, '#ff5c7a'),
  } });
  const v = JSON.parse(localStorage.getItem('lastsip:villain') || 'null');
  if (v?.image) run.gallery.hang({ ...v, trusted: true, mostWanted: true });
  cues?.remove(); cues = createHudCues($('hud'));
  arena = net ? createArena(world.scene, { net, me: ME }) : null; run.onSlamLanded = name => ui.feed(`SLAMMED ${name}`, 'legend', 'cannon');
  if (net && !asRemote) net.send('start', { id: ME.id });
  ui.loading(false); ui.show('hud'); run.state = 'ready'; ui.mode(official ? `THE POUR · #${dayNumber(seed)}` : 'PRACTICE');
  lockPointer();
  const me = run; await ui.countdown(); if (me === run && run.state === 'ready') run.state = 'play';
}
function showOrder_unused() { const rc = run.recipe; ui.order(rc.order, Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.label])), Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.color])), rc.got, RULES[run.rule]); }
// Front page backdrop: the real island, slowly orbiting behind the editorial panel.
let preview = null;
async function backdrop() { const scene = world.reset(); await buildIsland(scene); if (!run) preview = { t: 0 }; }
function orbit(dt) {
  preview.t += dt; const a = preview.t * .045, cam = world.camera;
  cam.position.set(Math.sin(a) * 24, 11 + Math.sin(a * .7) * 1.5, Math.cos(a) * 24); cam.lookAt(0, 0, 0);
  world.light({ pos: { x: 0, z: 0 } }, dt, {}); world.scene.userData.sea?.userData.update(preview.t); world.render();
}
async function finish(r) {
  document.exitPointerLock?.(); if (r.won) ui.confetti();
  const sh = r.shift, time = r.t, salt = 0, water = sh.served ? sh.tips / (sh.served * 10) : 0;
  const score = sh.tips * 10; // tips are the score (style tricks are just flair now)
  const villain = r.ledger.villain();
  if (villain) localStorage.setItem('lastsip:villain', JSON.stringify({ user: villain.name, image: lastEmote.get(villain.name) || null, title: 'MOST WANTED' }));
  const rooms = [];
  const d = official ? recordPour(seed, { finished: sh.served > 0, water, time, score }) : today(seed);
  const stars = sh.log.map(x => x.mood === 'happy' ? (x.tip >= 8 ? '★' : '☆') : '✖').join('');
  const text = receipt({ tips: sh.tips, served: sh.served, walkouts: sh.walkouts, stars, falls: r.falls, saves: r.saves, number: dayNumber(seed), villain: villain?.name, duck: r.duck, streak: d.streak, official });
  if (official) submit(session, { saves: r.saves, seed, channel: session?.login || chat?.channel || 'anonymous', water, time, score, finished: sh.served > 0, credits: r.ledger.credits().slice(0, 10) });
  const board = await boards(seed).catch(() => null);
  setTimeout(() => ui.results({ salt, rooms, tips: sh.tips, served: sh.served, walkouts: sh.walkouts, servedBy: sh.servedBy, won: r.won, water, time, score, credits: r.ledger.credits(), receipt: text, official, streak: d.streak, board }), 1600);
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
let last = performance.now(), acc = 0, t = 0, standT = 0;
const STEP = 1 / 120, prev = { x: 0, y: 0, z: 0 }, real = { x: 0, y: 0, z: 0 };
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(.1, (now - last) / 1000); last = now; world.adapt(dt);
  if (!run) { if (preview) orbit(dt); return; }
  if (run.hitStop > 0) { run.hitStop -= dt; dt = 0; } // hit-stop: a few frames of freeze sells the impact
  if (slowmo > 0) { slowmo -= dt; dt *= .35; }
  t += dt;
  let info = null;
  if (run.state === 'play') {
    acc += dt; let n = 0;
    while (acc >= STEP && n++ < 12) { prev.x = player.pos.x; prev.y = player.y; prev.z = player.pos.z; info = run.step(STEP); acc -= STEP; }
    if (n > 12) acc = 0; // after a long stall, don't try to catch up
    const q = director.tick();
    if (q?.kind === 'ballotEnd') { ui.ballot(null, q.event ? { label: BALLOT_LABEL[q.event], user: q.users[0], votes: q.votes } : null); if (q.event) play(q.event, q.users.slice(0, 1), { src: 'vote' }); }
    else if (q) play(q.event, q.users, { src: 'chat' });
    // free viewers vote every ~12 s while chat is connected (supporters and small chats still fire directly)
    if (chat && !director.ballot && (ballotT -= dt) <= 0) { ballotT = 12; const opts = pickBallot(); director.openBallot(opts, 8); ui.ballot({ options: opts, counts: opts.map(() => 0), left: 8, seconds: 8 }); }
    if (director.ballot) ui.ballotTick(director.ballotState());
  }
  // Render between the last two sim steps (smooth motion at any refresh rate). Skipped on teleports.
  real.x = player.pos.x; real.y = player.y; real.z = player.pos.z;
  const a = run.state === 'play' ? acc / STEP : 1;
  if (a < 1 && Math.hypot(real.x - prev.x, real.z - prev.z) < 1) { player.pos.x = prev.x + (real.x - prev.x) * a; player.y = prev.y + (real.y - prev.y) * a; player.pos.z = prev.z + (real.z - prev.z) * a; }
  run.render(dt, t);
  if (arena) { arena.update(dt, t, player, run.glass, run); if ((standT -= dt) <= 0) { standT = .25; ui.standings?.(arena.standings(run)); } }
  const m = run.mods;
  run.shakeT = Math.max(0, (run.shakeT || 0) - dt);
  chase(dt, player, run.level.colliders, m.eye, m.roll, run.chaos.active.quake > 0 ? .04 : run.shakeT * .3);
  cues?.update(dt, run, player, world.camera, run.wind);
  document.body.classList.toggle('dark', run.chaos.active.lights > 0);
  world.light(player, dt, { dark: run.chaos.active.lights > 0, discoOn: m.disco, fogOn: m.fog });
  if (info) ui.hud({ water: run.glass.state.water, danger: run.glass.state.danger, time: LIMIT - run.t, room: info.room.name, hazard: info.hazard, steady: player.steady, calm: info.calm, mods: m.active(), progress: Math.min(1, -player.pos.z / run.level.length), vacuum: info.vacuum, style: info.style, voice: info.voice, salt: run.salt, tips: run.shift.tips, tray: run.glass.count, served: run.shift.served, streak: run.shift.streak });
  world.render();
  player.pos.x = real.x; player.y = real.y; player.pos.z = real.z;
}
requestAnimationFrame(loop);
// dev: render a still from any camera into an overlay image (works while the tab is in the background)
function devShot(pos, look, fov = 50) {
  if (!pos) { document.getElementById('dev-shot')?.remove(); return; }
  const w = 640, h = 480, cam = new THREE.PerspectiveCamera(fov, w / h, .05, 200); cam.position.set(...pos); cam.lookAt(...look);
  const R = world.renderer, rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 }); R.setRenderTarget(rt); R.render(world.scene, cam);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, px); R.setRenderTarget(null); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); g.putImageData(id, 0, 0);
  let img = document.getElementById('dev-shot'); if (!img) { img = document.createElement('img'); img.id = 'dev-shot'; img.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:99999;pointer-events:none'; document.body.appendChild(img); }
  img.src = cv.toDataURL();
}
if (params.has('dev')) window.lastSip = { run: () => run, world, shot: devShot, frame: (n = 1) => { for (let i = 0; i < n; i++) { run.render(1 / 60, i / 60); } },
  advance: (sec = 1) => { for (let i = 0; i < sec * 60; i++) loop(last + 1000 / 60); }, // run the REAL loop (sim + camera + render) while rAF is paused
  simulate, play, start, director, inject: raw => { const m = parseLine(raw); if (m) onChat(m); return m; }, connect, fakeChat: () => { chat = { channel: 'dev', close() {} }; },
  state: () => run && { state: run.state, t: run.t, water: run.glass.state.water, pos: { ...player.pos }, room: run.level.roomAt(player.pos.z).name },
  tp: (x, z) => player.reset({ x, z, yaw: 0 }), player: () => player,
  goto: key => { const r = run.level.rooms.find(x => x.key === key); player.reset({ x: 0, z: r.z0 - 1.2, yaw: 0 }); return r.name; },
};
