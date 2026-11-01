import * as THREE from 'three';
import { buildLevel } from './level.js';
import { createPlayer } from './player.js';
import { createGlass } from './glass.js';
import { createChaos, EVENTS } from './chaos.js';
import { createGallery } from './gallery.js';
import { Ledger } from './ledger.js';
import { dayKey } from './rng.js';
import { ChatDirector, connectChat } from '../twitch.js';
import { $, ui } from './ui.js';

const LIMIT = 90;
const renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 120); camera.rotation.order = 'YXZ';
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

let scene, level, player, glass, chaos, gallery, ledger, sun, hemi, flashlight, state = 'menu', t = 0, last = performance.now();
const seed = dayKey();
const director = new ChatDirector();
let chat = null;
player = createPlayer(renderer.domElement);

async function setup() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#2a2238'); scene.fog = new THREE.Fog('#2a2238', 14, 46);
  hemi = new THREE.HemisphereLight('#ffe9d2', '#c9a58f', 1.7); scene.add(hemi);
  sun = new THREE.DirectionalLight('#ffd6a8', 2.2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
  scene.add(sun, sun.target);
  flashlight = new THREE.SpotLight('#fff3d6', 0, 14, .5, .6, 1.2); camera.add(flashlight, flashlight.target); flashlight.target.position.set(0, 0, -1);
  scene.add(camera);
  level = await buildLevel(scene, seed);
  for (const room of level.rooms) { const l = new THREE.PointLight('#ffcf9a', 7, 11, 1.6); l.position.set(0, 2.5, (room.z0 + room.z1) / 2); scene.add(l); }
  if (glass) camera.remove(glass.group);
  glass = createGlass(camera);
  gallery = createGallery(scene, level.slots);
  chaos = createChaos({ scene, level, player, glass });
  ledger = new Ledger();
  const villain = JSON.parse(localStorage.getItem('lastsip:villain') || 'null');
  if (villain?.image) gallery.hang({ ...villain, trusted: true, mostWanted: true });
  player.reset(level.spawn); t = 0;
}

function fireEvent(event, users, viaChat = true) {
  if (state !== 'play') return;
  chaos.fire(event);
  if (event !== 'calm') ledger.blame(users, EVENTS[event].label, event === 'ice' ? 8 : 3.5, t);
  if (event === 'bomb') setTimeout(() => gallery.shake(1.4), 1700);
  ui.feed(`${EVENTS[event].icon} ${users.join(', ')} → ${EVENTS[event].label}`, event === 'calm' ? 'help' : 'chaos');
  ui.banner(EVENTS[event].label, users.join(', '));
}

function onChat(msg) {
  const r = director.handle(msg);
  if (!r) return;
  if (r.kind === 'chaos' || r.kind === 'help') fireEvent(r.event, r.users);
  else if (r.kind === 'queued') ui.feed(`⏳ ${r.users[0]} queued ${EVENTS[r.event].label}`, 'muted');
  else if (r.kind === 'vote') ui.feed(`🫶 ${r.users[0]} wants to steady you (${r.have}/${r.needed})`, 'help');
  else if (r.kind === 'support') { fireEvent(['bomb', 'crate', 'quake'][Math.floor(Math.random() * 3)], [`${r.users[0]} (${r.bits} bits)`]); }
  else if (r.kind === 'frame') gallery?.hang(r).then(res => ui.feed(res.ok ? `🖼️ ${r.user} hung a frame` : `🚫 frame from ${r.user} rejected (${res.reason})`, res.ok ? 'help' : 'muted'));
}
// Offline practice: same pipeline as real chat, with clearly fake names.
let simN = 0;
export function simulate(text) { simN++; onChat({ user: `test_viewer_${simN % 5}`, login: `test_viewer_${simN % 5}`, text, bits: 0, mod: false, emotes: [] }); }

ui.bind({
  start: async () => { await setup(); state = 'play'; ui.show('hud'); renderer.domElement.requestPointerLock(); },
  connect: name => { chat?.close(); chat = connectChat(name, { onMessage: onChat, onStatus: (s, c) => ui.chatStatus(s, c) }); },
  simulate,
  lock: () => state === 'play' && renderer.domElement.requestPointerLock(),
});

function finish(success) {
  state = 'done'; document.exitPointerLock();
  const water = glass.state.water, score = success ? Math.round(water * 1000 + Math.max(0, LIMIT - t) * 6) : 0;
  const v = ledger.villain();
  if (v) localStorage.setItem('lastsip:villain', JSON.stringify({ user: v.name, image: 'https://static-cdn.jtvnw.net/emoticons/v2/86/default/dark/3.0', title: 'MOST WANTED' }));
  ui.results({ success, water, time: t, score, credits: ledger.credits(), seed, channel: chat?.channel });
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!scene) return;
  if (state === 'play') {
    t += dt;
    const room = level.roomAt(player.pos.z);
    let push = { x: 0, z: 0 }, shake = 0, label = null;
    for (const h of level.hazards) {
      h.update?.(t);
      if (player.pos.x > h.minX && player.pos.x < h.maxX && player.pos.z > h.minZ && player.pos.z < h.maxZ && player.y < .2) {
        if (h.push) { push.x += h.push.x; push.z += h.push.z; } if (h.shake) shake += h.shake; label = h.label;
      }
    }
    const fx = chaos.step(dt); push.x += fx.push.x; push.z += fx.push.z;
    player.step(dt, { colliders: level.colliders, push, slip: chaos.slipAt(player.pos.x, player.pos.z) });
    if (player.landed) glass.kick(0, -player.landed * .25);
    const spilled = glass.step(dt, { ax: player.accel.x, az: player.accel.z, turn: THREE.MathUtils.clamp(player.turnRate, -6, 6) * .25, steady: player.steady, calm: fx.calm, wobble: (shake + fx.kick) * 6 });
    if (spilled > 0) {
      const cause = ledger.spill(spilled, t, label ? 'THE HOUSE' : 'YOUR OWN HANDS');
      if (Math.random() < spilled * 60) chaos.puddle(player.pos.x + Math.sin(player.yaw) * .5, player.pos.z - Math.cos(player.yaw) * .5, .35);
      ui.blame(cause ? cause.users.join(', ') : label || 'YOUR OWN HANDS', spilled);
    }
    const q = director.tick(); if (q) fireEvent(q.event, q.users);
    ui.hud({ water: glass.state.water, time: LIMIT - t, room: room.name, hazard: label, steady: player.steady, calm: fx.calm, lights: chaos.active.lights > 0, progress: Math.min(1, -player.pos.z / level.length) });
    const f = level.finish; if (Math.hypot(player.pos.x - f.x, player.pos.z - f.z) < f.r) finish(true);
    else if (glass.state.water <= .001 || t >= LIMIT) finish(false);
  }
  const shakeAmt = state === 'play' ? (chaos.active.quake > 0 ? .03 : 0) : 0;
  camera.position.set(player.pos.x + (Math.random() - .5) * shakeAmt, player.y + 1.6 + Math.sin(t * 9) * .02 * Math.min(1, Math.hypot(player.vel.x, player.vel.z) / 4), player.pos.z);
  camera.rotation.set(-player.pitch, -player.yaw, 0);
  sun.position.set(player.pos.x + 6, 12, player.pos.z + 4); sun.target.position.set(player.pos.x, 0, player.pos.z - 3);
  const dark = chaos?.active.lights > 0; hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, dark ? .03 : 1.6, dt * 6); sun.intensity = THREE.MathUtils.lerp(sun.intensity, dark ? 0 : 2.2, dt * 6); flashlight.intensity = dark ? 30 : 0;
  glass?.render(t); chaos?.render(dt); gallery?.render(dt);
  renderer.render(scene, camera);
}

setup().then(() => { ui.ready(); requestAnimationFrame(loop); });
window.lastSip = { goto: key => { const r = level.rooms.find(x => x.key === key); player.reset({ x: 0, z: r.z0 - 1.2, yaw: 0 }); return r.name; }, state: () => ({ state, t, water: glass?.state.water, pos: player.pos, room: level?.roomAt(player.pos.z).name }), simulate, fireEvent };
