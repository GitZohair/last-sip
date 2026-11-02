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
import { createBots } from './bots.js';
import { createTwists, LINES, TWIST_LABEL } from './twists.js';
import { createBubbles } from './bubbles.js';
import { createBombs } from './bombs.js';
import { createCars } from './cars.js';
import { createPlanes } from './planes.js';
import { createChatPanel } from './chatpanel.js';
import { createFilm } from './film.js';
const chatPanel = createChatPanel(document.getElementById('hud'));
// the old text feed is gone: only things chat paid for or caused (subs, raids, channel points, chat attacks) reach the proof strip
ui.feed = (text, kind) => { if (chat && kind === 'legend') chatPanel.event('', text, '#ffd166'); };
// plain words anyone can type (no "!"), rare enough not to fire by accident
const TRIGGERS = [[/\bkaboom\b/i, 'airstrike'], [/\bmayday\b/i, 'care'], [/\bseagull\b/i, 'gull'], [/\bswapsies\b/i, 'swap']];
const trigAt = new Map(); let trigLast = 0;
const EVT_TEXT = { airstrike: 'called in an AIRSTRIKE', care: 'dropped a CARE PACKAGE', gull: 'sent the SEAGULL', swap: 'swapped the towers', chairs: 'shuffled everyone', quake: 'hit the BASS', mop: 'mopped the floor' };
let bubbles = null, bombs = null, cars = null, planes = null;
const said = new Map(), chatLines = []; // viewer -> their last chat line; recent lines for the house banner planes
const AIR = new Set(['bomb', 'drop', 'sniper', 'barrel', 'deck', 'crate', 'airstrike', 'storm', 'lights', 'nuke', 'fridge']), CARE = new Set(['calm', 'care']);
function throwBomb() { const th = bombs?.throw(ME.name); if (th && arena) net?.send('bomb', { id: ME.id, by: ME.name, ...th }); }
function shootGas() { const sh = bombs?.shoot(ME.name); if (sh && arena) net?.send('co2', { id: ME.id, by: ME.name, ...sh }); return !!sh; }
addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'KeyQ') throwBomb(); if (e.code === 'KeyR') shootGas(); });
addEventListener('mousedown', e => { if (e.button === 0 && document.pointerLockElement && !shootGas()) throwBomb(); });
const pickLine = a => a[Math.floor(Math.random() * a.length)];
let twists = null;
const recentChat = []; let bots = null;
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
    if (ev === 'lobby' || ev === 'state') { lobbyPeers.set(d.id, { name: d.name, color: d.color, seen: performance.now() }); }
    if (ev === 'start' && (!run || run.state !== 'play')) { if (d.id !== ME.id) { asRemote = true; start(false).finally(() => { asRemote = false; }); } return; } // somebody started the round: everyone in the room goes
    arena?.onMessage(ev, d, {
      hit: d => run?.applyHit?.(d), bomb: d => bombs?.launch(d.x, d.y, d.z, d.vx, d.vy, d.vz, d.by, { mine: true, ghost: true }), co2: d => bombs?.fire(d.x, d.y, d.z, d.dx, d.dz, d.by, true, true),
      attack: d => { if (run?.summon(d.kind, `${d.from} CHAT: ${d.user}`, 'paid')) ui.feed(`${d.from.toUpperCase()}'S CHAT sent ${d.kind.toUpperCase()} (${d.user})`, 'legend', 'twitch'); },
    });
  } });
}
const lobbyPeers = new Map();
function lobbyTick() { // who's in the arena (pre-round presence ping), shown on the front page
  if (!net) return; if (!run || run.state !== 'play') net.send('lobby', { id: ME.id, name: ME.name, color: ME.color });
  const now = performance.now(); for (const [id, p] of lobbyPeers) if (now - p.seen > 4000) lobbyPeers.delete(id);
  ui.lobby(room, [{ name: ME.name, color: ME.color, me: true }, ...[...lobbyPeers.values()]]);
}
setInterval(lobbyTick, 1000);
if (room) openRoom(room);
let cues = null, run = null, chat = null, session = null, profile = null, official = false, slowmo = 0;

// ---------- Twitch: anonymous chat (zero setup) + optional sign-in for EventSub, rewards, clips
function connect(name) { chatPanel.channel(name); ME.name = name; chat?.close(); chat = connectChat(name, { onMessage: onChat, onStatus: ui.chatStatus }); localStorage.setItem('lastsip:channel', name); }
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
  chatPanel.line(msg);
  if (msg.user && msg.text && run?.state === 'play') { const tg = TRIGGERS.find(([re]) => re.test(msg.text)); const now = performance.now();
    if (tg && now - trigLast > 4000 && now - (trigAt.get(msg.user) || 0) > 15000) { trigLast = now; trigAt.set(msg.user, now); play(tg[1], [msg.user], { src: 'word', color: msg.color }); } }
  if (msg.user && msg.text && !msg.notice) { const tx = msg.text.replace(/^!\w+\s*/, '').trim(); if (tx) { said.set(msg.user, tx); chatLines.push(`${msg.user}: ${tx}`); if (chatLines.length > 20) chatLines.shift(); } }
  if (msg.user && !msg.notice && !recentChat.includes(msg.user)) { recentChat.unshift(msg.user); recentChat.length = Math.min(recentChat.length, 12); }
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
// controls strip for the first seconds of a round (fades out by itself)
function showKeys() {
  let el = $('keyhint'); if (!el) { el = document.createElement('div'); el.id = 'keyhint'; $('hud').appendChild(el); }
  el.innerHTML = [['WASD', 'move'], ['E', 'slam'], ['Q', 'bomb'], ['R', 'CO2'], ['F', 'drive'], ['SPACE', 'hop']].map(([k, t]) => `<span><kbd>${k}</kbd>${t}</span>`).join('');
  el.classList.remove('off'); clearTimeout(showKeys.t); showKeys.t = setTimeout(() => el.classList.add('off'), 11000);
}
function play(event, users, opts) {
  if (planes && run?.state === 'play') { // chat's power: banner planes (with their message on the banner) and arena twists
    const who = users[0] || 'CHAT', msg = said.get(who);
    const kind = AIR.has(event) || opts?.src === 'paid' ? 'airstrike' : CARE.has(event) ? 'care' : event === 'ice' ? 'mop' : event;
    if (EVT_TEXT[kind] && chat) chatPanel.event(opts?.src === 'vote' ? `CHAT VOTED (${who})` : who, EVT_TEXT[kind], opts?.color || '#bf94ff');
    if (AIR.has(event) || opts?.src === 'paid') { planes.strike(who, msg, opts?.count || (opts?.src === 'paid' ? 5 : 3)); sfx.reveal(); sfx.say('plane'); return; }
    if (CARE.has(event)) { planes.care(who, msg); return; }
    if (TWIST_LABEL[event]) { twists.fire(event, who); speak(ME.name, `${who.slice(0, 14)}?!`); return; }
    if (event === 'ice') return twists.fire('mop', who); if (event === 'quake') return twists.fire('quake', who);
  }
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
function pickBallot() { // chat votes the next PLOT TWIST
  if (twists) return twists.ballot();
  const bad = ['barrel', 'drop', 'storm', 'deck'].sort(() => Math.random() - .5);
  return Math.random() < .35 ? [bad[0], bad[1], 'calm'] : bad.slice(0, 3);
}
const simulate = text => onChat({ user: `test_viewer_${++simN % 6}`, login: `test_viewer_${simN % 6}`, text, bits: 0, mod: true, emotes: [] });

// ---------- runs
let asRemote = false;
// who is where (for speech bubbles): me, a bot, or a remote player
function posOf(name) {
  if (name === ME.name) return () => ({ x: player.pos.x, y: player.y + run.glass.count * .12, z: player.pos.z });
  const b = bots?.bots.find(x => x.name === name); if (b) return () => ({ x: b.p.pos.x, y: b.p.y, z: b.p.pos.z });
  const e = arena && [...arena.peers.values()].find(x => x.s.name === name); if (e) return () => ({ x: e.p.pos.x, y: e.p.y, z: e.p.pos.z });
  return null;
}
function speak(name, text, opts) { const p = posOf(name); if (p && bubbles) bubbles.say(p, text, opts); }
// THE BLAME GAME: your tower fell, so it was somebody else's fault (whoever hit you, else whoever is closest).
function blameFor(n, who) {
  if (!twists) return;
  const near = list => list.sort((a, b) => Math.hypot(a.x - player.pos.x, a.z - player.pos.z) - Math.hypot(b.x - player.pos.x, b.z - player.pos.z))[0];
  if (bots) {
    const b = bots.bots.find(x => x.name === who) || near(bots.bots.map(x => ({ b: x, x: x.p.pos.x, z: x.p.pos.z }))).b;
    twists.blame(ME.name, b.name); const tax = Math.min(10, b.tips); b.tips -= tax; run.shift.tips += tax; return;
  }
  if (arena?.peers.size) { const p = who !== 'GRAVITY' ? { name: who } : near([...arena.peers.values()].map(e => ({ name: e.s.name, x: e.s.x, z: e.s.z }))); return twists.blame(ME.name, p.name, false); }
  twists.blame(ME.name, null);
}
async function start(asPour) {
  const d = today(seed); official = asPour && !d.poured;
  sfx.unlock(); // no mic prompt: nothing in the game needs it
  ui.loading(true);
  run = await createRun(world, player, { seed, voice, profile: profile || (chat ? { name: chat.channel } : null), hooks: {
    spill: (who, amt) => ui.blame(who, amt), toast: (t, ico) => ui.feed(t, 'help', ico),
    house: card => card && ui.slot(card, 'THE HOUSE'),
    catchPrompt: on => ui.catchPrompt(on), saved: n => { slowmo = .35; ui.catchPrompt(false); },
    lastSip: () => { slowmo = 1.2; ui.lastSip(); clipIt('last sip'); }, clip: clipIt, end: finish, trick: () => {}, // style tricks no longer pop text: tips are the only score
    fell: () => {},
    toppled: (n, who) => { slowmo = 1.1; blameFor(n, who); }, drowned: n => { cues?.pop(n ? `${n} DRINK${n > 1 ? 'S' : ''} LOST AT SEA` : 'WASHED UP AT THE BAR', '#ff5c7a', true); },
    order: c => { sfx.ding(); cues?.pop(c.far ? `ORDER ON THE ISLAND  ${c.user}` : `NEW ORDER  ${c.user}`, c.far ? '#ffd166' : c.color); },
    hurry: c => { sfx.beep(true); cues?.pop(`${c.user} IS LEAVING`, '#ffb020'); },
    loaded: n => { if (n % 5 === 0) cues?.pop(`TOWER x${n}`, n >= 15 ? '#ffd166' : '#c9a2ff', n >= 15); },
    served: (c, tip) => { if (twists?.T.happy > 0 && c.mood === 'happy') { run.shift.tips += tip; tip *= 2; } cues?.pop(c.mood === 'happy' ? `+$${tip}  ${c.want > 1 ? `${c.want} DRINKS FROM` : 'FROM'} A x${c.tower} TOWER  ${c.user}` : `1 STAR FROM ${c.user}`, c.mood === 'happy' ? '#5dff9b' : '#ff5c7a', true) },
    walkout: (c, v) => { // an angry customer doesn't leave quietly: they lob a bomb at you on the way out
      void v; bubbles?.say(() => ({ x: c.x, y: 0, z: c.z }), pickLine(['NO TIP. ONLY BOMB', 'ONE STAR', 'I WANT THE MANAGER', 'UNSUBSCRIBED']), { bg: '#ff4f6d', fg: '#fff', lift: 3.6 });
      const dx = player.pos.x - c.x, dz = player.pos.z - c.z, d = Math.hypot(dx, dz), T = Math.min(2.2, Math.max(.8, d / 12));
      if (d < 40) bombs?.launch(c.x, 1.6, c.z, dx / T, 9 * T - 1.6 / T, dz / T, c.user, { fuse: T + .3 });
    },
    buoy: who => cues?.pop(`LIFEBUOY FROM ${who}`, '#5dffa0'), rescued: who => { cues?.pop(`SAVED BY ${who}`, '#5dffa0', true); clipIt('rescue'); },
    inflated: who => speak(who, 'POP GOES THE STREAMER', { bg: '#5dd6ff' }), popped: (pos, y) => bombs?.pop(pos, y),
    slammed: who => { sfx.say('hit'); speak(who, pickLine(LINES.slam)); },
    hit: (who, kind) => cues?.pop(kind === 'BUMPED' ? `${who}!` : kind === 'SNIPER' ? `SNIPED BY ${who}` : kind === 'BARREL' ? `ROLLED BY ${who}` : `${kind} FROM ${who}`, '#ff5c7a'),
  } });
  const v = JSON.parse(localStorage.getItem('lastsip:villain') || 'null');
  if (v?.image) run.gallery.hang({ ...v, trusted: true, mostWanted: true });
  cues?.remove(); cues = createHudCues($('hud'));
  arena = net ? createArena(world.scene, { net, me: ME }) : null;
  bots = net ? null : createBots(world.scene, run.level, { names: film ? ['CASEOH_FAN_420', 'JYNXZI_DROPS', 'XQC_JUICER'] : recentChat.slice(0, 3) }); if (bots) await bots.ready;
  document.getElementById('twist')?.remove(); bombs?.dispose(); bombs = createBombs({ scene: world.scene, level: run.level, player, run, bots, onInflatePeers: sh => {
    for (const [id, e] of arena?.peers || []) if (Math.hypot(e.p.pos.x - sh.x, e.p.pos.z - sh.z) < .9 && !(e.puffed > performance.now())) { e.puffed = performance.now() + 3000; net.send('hit', { id: ME.id, to: id, by: ME.name, kind: 'inflate', dir: { x: sh.dx, z: sh.dz }, power: 0 }); run.onSlamLanded?.(e.s.name); return true; }
    return false;
  }, onHitPeers: (p, R, by) => {
    for (const [id, e] of arena?.peers || []) { const d = Math.hypot(e.p.pos.x - p.x, e.p.pos.z - p.z); if (d < R) net.send('hit', { id: ME.id, to: id, by, dir: { x: (e.p.pos.x - p.x) / (d || 1), z: (e.p.pos.z - p.z) / (d || 1) }, power: 6 + 8 * (1 - d / R), up: 3 }); }
  } });
  cars?.dispose(); cars = createCars({ scene: world.scene, level: run.level, player, run, bots, bombs, avatar: run.avatar, onRam: (c, vx, vz) => {
    for (const [id, e] of arena?.peers || []) { const dx = e.p.pos.x - c.x, dz = e.p.pos.z - c.z, d = Math.hypot(dx, dz); if (d < 1.7 && !(e.rammed > performance.now())) { e.rammed = performance.now() + 800; net.send('hit', { id: ME.id, to: id, by: ME.name, dir: { x: dx / (d || 1), z: dz / (d || 1) }, power: Math.abs(c.speed), up: 5 }); } }
  } });
  planes?.dispose(); planes = createPlanes({ scene: world.scene, bombs, view: () => ({ x: player.pos.x, z: player.pos.z, yaw: player.camYaw }), target: () => { // airstrikes home in on the leader (blue-shell rules); solo = your own chat bombs you
    const L = arena?.leader(); if (L && L.s.tips > run.shift.tips) { const e = arena.peers.get(L.id); return { x: e.p.pos.x, z: e.p.pos.z }; }
    return { x: player.pos.x, z: player.pos.z }; } });
  bubbles = createBubbles(world.scene);
  run.onPop = (pos, y) => bombs.pop(pos, y); twists = createTwists({ hud: $('hud'), run, player, bots, me: ME, speak }); twists.chatPicks = !!chat;
  run.onBotRingout = b => { sfx.splash(); sfx.say('ringout'); speak(b.name, 'NOOOO', { bg: '#4fc3ff' }); };
  run.onSlamLanded = name => { speak(ME.name, pickLine(LINES.slam)); sfx.say('slam'); };
  if (bots) bots.onTopple = (b, n, byMe) => { // a bot drops its tower: if you slammed it, gloat; otherwise it blames YOU
    if (byMe) return;
    const r = twists.blame(b.name, ME.name); if (r) { run.shift.tips = Math.max(0, run.shift.tips - 10); b.tips += 10; }
  };
  if (net && !asRemote) net.send('start', { id: ME.id });
  ui.loading(false); ui.show('hud'); run.state = 'ready'; ui.mode(official ? `THE POUR · #${dayNumber(seed)}` : 'PRACTICE');
  lockPointer();
  const me = run; showKeys(); await ui.countdown(); if (me === run && run.state === 'ready') run.state = 'play';
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
  { const k = 'lastsip:best:' + seed, b = +(localStorage.getItem(k) || 0); if (sh.tips > b) localStorage.setItem(k, sh.tips); }
  const d = official ? recordPour(seed, { finished: sh.served > 0, water, time, score }) : today(seed);
  const stars = sh.log.map(x => x.mood === 'happy' ? (x.tip >= 8 ? '★' : '☆') : '✖').join('');
  const text = receipt({ tips: sh.tips, served: sh.served, walkouts: sh.walkouts, stars, falls: r.falls, saves: r.saves, number: dayNumber(seed), villain: villain?.name, duck: r.duck, streak: d.streak, official });
  if (official) submit(session, { saves: r.saves, seed, channel: session?.login || chat?.channel || 'anonymous', water, time, score, finished: sh.served > 0, credits: r.ledger.credits().slice(0, 10) });
  const board = await boards(seed).catch(() => null);
  const podium = arena ? arena.standings(run) : bots ? [{ name: ME.name, tips: sh.tips, me: true }, ...bots.standings()].sort((a, b) => b.tips - a.tips) : null;
  setTimeout(() => ui.results({ podium, salt, rooms, tips: sh.tips, served: sh.served, walkouts: sh.walkouts, servedBy: sh.servedBy, won: r.won, water, time, score, credits: r.ledger.credits(), receipt: text, official, streak: d.streak, board }), 1600);
}

// ---------- boot
const soundToggle = $('sound-toggle');
function updateSoundToggle() {
  soundToggle.textContent = sfx.muted ? 'SOUND OFF' : 'SOUND ON';
  soundToggle.setAttribute('aria-pressed', String(sfx.muted));
  soundToggle.setAttribute('aria-label', sfx.muted ? 'Unmute game sound' : 'Mute game sound');
}
soundToggle.onclick = () => { sfx.setMuted(!sfx.muted); updateSoundToggle(); };
updateSoundToggle();
$('join').onclick = () => { const c = $('room-code').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c) { openRoom(c); lobbyTick(); } };
ui.bind({ start: () => { if (!room) { openRoom(newRoomCode()); lobbyTick(); } else start(false); }, practice: () => { if (room) { net?.close(); net = null; room = ''; ui.lobby('', []); window.history.replaceState(null, '', params.has('dev') ? '?dev' : '/'); } start(false); }, connect, mic: () => voice.enable(), signIn: tw.signIn, lock: () => run?.state === 'play' && lockPointer() });
(async () => {
  ui.intro({ seed, number: dayNumber(seed), daily: today(seed), canSignIn: !!tw.CLIENT_ID });
  ui.todayOrder(todaysOrder(seed), INGREDIENTS, RULES[todaysRule(seed)], +(localStorage.getItem('lastsip:best:' + seed) || 0), today(seed).streak);
  ui.tabs(tab => { if (tab === 'board') boards(seed).then(ui.introBoard).catch(() => ui.introBoard(null)); if (tab === 'stats') ui.stats(history()); });
  backdrop();
  session = await tw.restore().catch(() => null);
  if (session) {
    ui.signedIn(session.login); connect(session.login);
    profile = await tw.profile(session).catch(() => null);
    tw.eventsub(session, onEventSub, s => ui.feed(`EventSub connected`, 'help', 'twitch'));
    tw.ensureRewards(session);
  } else if (localStorage.getItem('lastsip:channel') && !params.has('film')) connect(localStorage.getItem('lastsip:channel'));
  ui.ready();
})();

// ---------- loop: fixed 120 Hz simulation, render every frame
let last = performance.now(), acc = 0, t = 0, standT = 0;
const STEP = 1 / 120, prev = { x: 0, y: 0, z: 0 }, real = { x: 0, y: 0, z: 0 };
let filming = false; // while recording, frames are driven by record(), not by rAF
function raf(now) { requestAnimationFrame(raf); if (!filming) loop(now); }
function loop(now) {
  let dt = Math.min(.1, (now - last) / 1000); last = now; world.adapt(dt);
  if (!run) { if (preview) orbit(dt); return; }
  if (run.hitStop > 0) { run.hitStop -= dt; dt = 0; } // hit-stop: a few frames of freeze sells the impact
  if (slowmo > 0) { slowmo -= dt; dt *= .35; }
  t += dt;
  let info = null;
  if (run.state === 'play') {
    film?.update(dt);
    acc += dt; let n = 0;
    while (acc >= STEP && n++ < 12) { prev.x = player.pos.x; prev.y = player.y; prev.z = player.pos.z; info = run.step(STEP); acc -= STEP; }
    if (n > 12) acc = 0; // after a long stall, don't try to catch up
    const q = director.tick();
    if (q?.kind === 'ballotEnd') { ui.ballot(null, q.event ? { label: BALLOT_LABEL[q.event] || TWIST_LABEL[q.event], user: q.users[0], votes: q.votes } : null); if (q.event) play(q.event, q.users.slice(0, 1), { src: 'vote' }); }
    else if (q) play(q.event, q.users, { src: 'chat' });
    // free viewers vote every ~12 s while chat is connected (supporters and small chats still fire directly)
    if (chat && !director.ballot && (ballotT -= dt) <= 0) { ballotT = 16; const opts = pickBallot(); director.openBallot(opts, 8); ui.ballot({ options: opts, counts: opts.map(() => 0), left: 8, seconds: 8 }); }
    if (director.ballot) ui.ballotTick(director.ballotState());
  }
  // Render between the last two sim steps (smooth motion at any refresh rate). Skipped on teleports.
  real.x = player.pos.x; real.y = player.y; real.z = player.pos.z;
  const a = run.state === 'play' ? acc / STEP : 1;
  if (a < 1 && Math.hypot(real.x - prev.x, real.z - prev.z) < 1) { player.pos.x = prev.x + (real.x - prev.x) * a; player.y = prev.y + (real.y - prev.y) * a; player.pos.z = prev.z + (real.z - prev.z) * a; }
  run.render(dt, t);
  if (arena) { arena.update(dt, t, player, run.glass, run); if ((standT -= dt) <= 0) { standT = .25; ui.standings?.(arena.standings(run)); } }
  if (run.state === 'play' || run.state === 'done') twists?.update(dt);
  bubbles?.update(dt); if (run.state === 'play') { bombs?.update(dt, t); cars?.update(dt); planes?.update(dt, t, { chatLine: () => chatLines.length ? chatLines[Math.floor(Math.random() * chatLines.length)] : null }); }
  if (bots && run.state === 'play') { bots.update(dt, t, player, run); if ((standT -= dt) <= 0) { standT = .25; ui.standings?.([{ name: ME.name, color: ME.color, tips: run.shift.tips, n: run.glass.count, me: true }, ...bots.standings()].sort((a, b) => b.tips - a.tips)); } }
  const m = run.mods;
  run.shakeT = Math.max(0, (run.shakeT || 0) - dt);
  chase(dt, player, run.level.colliders, m.eye, m.roll, run.chaos.active.quake > 0 ? .04 : run.shakeT * .3);
  cues?.update(dt, run, player, world.camera, run.wind);
  document.body.classList.toggle('dark', run.chaos.active.lights > 0);
  world.light(player, dt, { dark: run.chaos.active.lights > 0, discoOn: m.disco, fogOn: m.fog });
  if (info) ui.hud({ water: run.glass.state.water, danger: run.glass.state.danger, time: LIMIT - run.t, room: info.room.name, hazard: info.hazard, steady: player.steady, calm: info.calm, mods: m.active(), progress: Math.min(1, -player.pos.z / run.level.length), vacuum: info.vacuum, style: info.style, voice: info.voice, salt: run.salt, tips: run.shift.tips, tray: run.glass.count, served: run.shift.served, streak: run.shift.streak });
  film?.camera(dt);
  world.render();
  player.pos.x = real.x; player.y = real.y; player.pos.z = real.z;
}
requestAnimationFrame(raf);
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
// ---------- FILM (?film or ?film=play): autopilot + camera director; record() saves 1080p frames via the dev server
const film = params.has('film') ? createFilm({ world, player, cine: params.get('film') !== 'play', get: () => ({ run, bots, bombs, cars, planes, twists, throwBomb, shootGas }) }) : null;
if (film?.cine) document.body.classList.add('film');
if (film) ME.name = 'STREAMER'; // film: house names only, no real chatters on screen
async function record(name = 'take', fps = 60, maxSec = 110) {
  while (run?.state !== 'play') await new Promise(r => setTimeout(r, 100));
  filming = true; world.fixed(1920, 1080); let tt = last, i = 0;
  const gl = world.renderer.getContext(), W = 1920, H = 1080, px = new Uint8Array(W * H * 4), oc = new OffscreenCanvas(W, H), g2 = oc.getContext('2d'), img = g2.createImageData(W, H), pend = new Set();
  for (; i < maxSec * fps && !film.done; i++) {
    film.frame = i; tt += 1000 / fps; loop(tt);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); // straight after the render: works even when the tab is hidden
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    g2.putImageData(img, 0, 0); const blob = await oc.convertToBlob({ type: 'image/jpeg', quality: .92 });
    if (i % 300 === 299) fetch(`/__film/${name}/log.json`, { method: 'POST', body: JSON.stringify({ fps, frames: i + 1, shots: film.shots, sfx: film.sfx }) }).catch(() => {}); // survive a reload
    while (pend.size >= 8) await Promise.race(pend);
    const p = fetch(`/__film/${name}/f${String(i).padStart(5, '0')}.jpg`, { method: 'POST', body: blob }).catch(() => {}).finally(() => pend.delete(p)); pend.add(p);
  }
  await Promise.all(pend);
  await fetch(`/__film/${name}/log.json`, { method: 'POST', body: JSON.stringify({ fps, frames: i, shots: film.shots, sfx: film.sfx }) });
  world.fixed(0); filming = false; last = performance.now(); return { frames: i, shots: film.shots.map(s => s.name) };
}
if (film) { window.lastSip = window.lastSip || {}; window.film = { film, record, start }; }
if (params.has('dev')) window.lastSip = { run: () => run, bots: () => bots, twists: () => twists, bombs: () => bombs, cars: () => cars, planes: () => planes, world, shot: devShot, frame: (n = 1) => { for (let i = 0; i < n; i++) { run.render(1 / 60, i / 60); } },
  advance: (sec = 1) => { for (let i = 0; i < sec * 60; i++) loop(last + 1000 / 60); }, // run the REAL loop (sim + camera + render) while rAF is paused
  simulate, play, start, director, inject: raw => { const m = parseLine(raw); if (m) onChat(m); return m; }, connect, fakeChat: () => { chat = { channel: 'dev', close() {} }; },
  state: () => run && { state: run.state, t: run.t, water: run.glass.state.water, pos: { ...player.pos }, room: run.level.roomAt(player.pos.z).name },
  tp: (x, z) => player.reset({ x, z, yaw: 0 }), player: () => player,
  goto: key => { const r = run.level.rooms.find(x => x.key === key); player.reset({ x: 0, z: r.z0 - 1.2, yaw: 0 }); return r.name; },
};
