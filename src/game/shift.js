import * as THREE from 'three';
import { model, textTexture } from './assets.js';
import { PADS } from './island.js';
import { INGREDIENTS, todaysOrder } from './recipe.js';
import { rng } from './rng.js';
import { viewer, preloadCrew } from './actors.js';

// THE SHIFT: customers appear on the islets wanting a drink; you load glasses at the BAR (plaza) and serve them.
// Customer slots, timing and flavours come from the daily seed (same for every streamer, so tips compare);
// chat only supplies the NAMES: `!order` puts a viewer in the raffle, each new slot draws one (subs get 2 tickets).
export const PATIENCE = 30;
const TOURISTS = ['SUNBURNT STEVE', 'AUNTIE MO', 'DJ SANDY', 'GRANDPA REEF', 'COCONUT CARL', 'LIFEGUARD LOU', 'TINY TINA', 'CAPTAIN GULL', 'FLIPFLOP FRAN', 'SANDCASTLE SAM'];
const SPOTS = { coconut: [-14, -16], lemon: [14, -16], pineapple: [-14, -48], strawberry: [14, -48], honey: [-14, -64], watermelon: [14, -64], beach: [2.6, -1], hut: [-2.6, -77] };
export const BAR = { x: -2.6, z: -32, r: 2.1 };

function bubbleCanvas() { const c = document.createElement('canvas'); c.width = c.height = 128; return c; }
function drawBubble(c, color, k, mood) { // order bubble: drink icon + a patience arc that drains green → red
  const g = c.getContext('2d'); g.clearRect(0, 0, 128, 128);
  g.fillStyle = mood === 'angry' ? '#ff3b5c' : mood === 'happy' ? '#2fbf71' : '#fffdf6'; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.fill();
  g.lineWidth = 11; g.lineCap = 'round'; g.strokeStyle = '#0002'; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke();
  if (mood === 'wait') { g.strokeStyle = k > .5 ? '#2fbf71' : k > .25 ? '#ffb020' : '#ff3b5c'; g.beginPath(); g.arc(64, 64, 56, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); }
  if (mood === 'wait') { // a glass in the customer's flavour
    g.fillStyle = color; g.beginPath(); g.moveTo(44, 46); g.lineTo(84, 46); g.lineTo(78, 92); g.lineTo(50, 92); g.closePath(); g.fill();
    g.strokeStyle = '#1b1530'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#ff4f6d'; g.lineWidth = 4; g.beginPath(); g.moveTo(70, 50); g.lineTo(80, 28); g.stroke();
  } else { g.fillStyle = '#fff'; g.font = '900 54px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(mood === 'happy' ? '$' : '!', 64, 68); }
}

export async function createShift(scene, seed, tray) {
  await preloadCrew();
  const r = rng(seed + ':shift'), flavours = todaysOrder(seed); // today's menu: 3 drinks, same as the intro shows
  // seeded timeline: first customers quickly, then one every 5-8 s
  const names = r.shuffle(TOURISTS), schedule = []; for (let t = 1.5, i = 0; t < 82; t += i < 2 ? 3.5 : r.range(5, 8), i++) schedule.push({ at: t, spots: i === 0 ? ['lemon', 'coconut'] : r.shuffle(Object.keys(SPOTS)), flavour: r.pick(flavours), tourist: names[i % names.length] });
  // the bar: Kenney counter + stools + pennant, a purple floor ring and a BAR sign
  const bar = new THREE.Group(); bar.position.set(BAR.x - .9, 0, BAR.z); scene.add(bar);
  for (const [n, z] of [['kitchenBar', -.9], ['kitchenBar', 0], ['kitchenBarEnd', .9]]) { const m = await model('furniture', n); m.position.set(0, 0, z); m.rotation.y = Math.PI / 2; bar.add(m); }
  for (const z of [-.7, .7]) { const s = await model('furniture', 'stoolBar'); s.position.set(1, 0, z); bar.add(s); }
  const pen = await model('pirate', 'flag-high-pennant'); pen.position.set(-.6, 0, -1.4); pen.scale.multiplyScalar(.7); bar.add(pen);
  const barRing = new THREE.Mesh(new THREE.RingGeometry(BAR.r - .12, BAR.r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#a970ff', transparent: true, opacity: .8, depthWrite: false }));
  barRing.position.set(BAR.x, .03, BAR.z); scene.add(barRing);
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('BAR', { w: 256, h: 96, bg: '#a970ff', fg: '#fff', font: '900 64px system-ui' }), depthTest: false })); sign.scale.set(1.4, .52, 1); sign.position.set(BAR.x, 2.6, BAR.z); sign.renderOrder = 9; scene.add(sign);

  const pool = new Map(); // raffle: name -> tickets
  const S = { customers: [], tips: 0, served: 0, walkouts: 0, servedBy: [], log: [], next: 0, near: null, atBar: false, barRing };
  S.enter = (name, tickets = 1) => { if (!S.customers.some(c => c.user === name && c.mood === 'wait')) pool.set(name, Math.max(pool.get(name) || 0, tickets)); };
  function draw() { // one name from the raffle, weighted by tickets
    const total = [...pool.values()].reduce((a, b) => a + b, 0); if (!total) return null;
    let k = Math.random() * total; for (const [n, w] of pool) { if ((k -= w) <= 0) { pool.delete(n); return n; } } return null;
  }
  async function arrive(slot) {
    const key = slot.spots.find(k => !S.customers.some(c => c.key === k)); if (!key) return;
    const [x, z] = SPOTS[key], name = draw();
    const c = { id: Math.random().toString(36).slice(2), key, x, z, user: name || slot.tourist, viewer: !!name, flavour: slot.flavour, color: INGREDIENTS[slot.flavour].color, patience: PATIENCE, mood: 'wait', t: 0, drawK: -1 };
    S.customers.push(c);
    const fig = await viewer(c.user); fig.m.position.set(x, 0, z); fig.m.scale.setScalar(2); scene.add(fig.m); c.fig = fig;
    c.canvas = bubbleCanvas(); c.tex = new THREE.CanvasTexture(c.canvas); c.tex.colorSpace = THREE.SRGBColorSpace;
    c.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.tex, depthTest: false })); c.bubble.scale.setScalar(1.1); c.bubble.renderOrder = 10; scene.add(c.bubble);
    c.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(c.user.slice(0, 18).toUpperCase(), { w: 512, h: 96, bg: c.viewer ? '#a970ff' : '#1b1530cc', font: 'bold 54px system-ui' }), depthTest: false }));
    c.tag.scale.set(3.4, .64, 1); c.tag.renderOrder = 10; scene.add(c.tag);
    if (S.next === 1) tray.add(c.id, c.color); // onboarding: your first order is already on the tray, so you learn SERVE before BAR
    S.onArrive?.(c);
  }
  S.arrive = arrive; S.schedule = schedule;
  // cb: { loaded(n), served(c, tip, water), walkout(c) }
  S.update = (t, dt, player, cb = {}) => {
    while (S.next < schedule.length && t >= schedule[S.next].at) arrive(schedule[S.next++]);
    const px = player.pos.x, pz = player.pos.z, swim = player.y < -.5;
    // BAR: fresh glasses for every waiting customer (replaces salty / half-empty ones)
    S.atBar = !swim && Math.hypot(px - BAR.x, pz - BAR.z) < BAR.r;
    const waiting = S.customers.filter(c => c.mood === 'wait');
    if (S.atBar) {
      const stale = tray.glasses.some(g => g.gl.state.water < .9 || g.salt > 0), missing = waiting.some(c => !tray.glasses.some(g => g.id === c.id));
      if ((stale || missing) && waiting.length) { tray.clear(); for (const c of waiting.slice(0, 5)) tray.add(c.id, c.color); cb.loaded?.(tray.count); }
    }
    barRing.material.opacity = .5 + Math.sin(t * 5) * .3 * (tray.count ? .3 : 1);
    S.near = null;
    for (const c of [...S.customers]) {
      if (!c.fig) continue;
      c.fig.mixer.update(dt);
      const d = Math.hypot(px - c.x, pz - c.z);
      if (c.mood === 'wait') {
        c.patience -= dt; c.fig.m.rotation.y = Math.atan2(px - c.x, pz - c.z); // watches you
        if (d < 4) S.near = c;
        if (d < 1.7 && !swim && tray.glasses.some(g => g.id === c.id)) {
          const g = tray.take(c.id), tip = Math.max(0, Math.round(10 * g.water * (1 - g.salt * .7)));
          c.mood = g.water < .3 || tip < 3 ? 'angry' : 'happy'; c.t = 0; S.tips += tip; S.served++; S.servedBy.push(c.user); S.log.push({ user: c.user, tip, mood: c.mood });
          if (c.mood === 'happy') c.fig.cheer(); cb.served?.(c, tip, g.water);
        } else if (c.patience <= 0) { c.mood = 'angry'; c.t = 0; S.walkouts++; S.log.push({ user: c.user, tip: 0, mood: 'walkout' }); tray.drop(c.id); cb.walkout?.(c); }
      } else if ((c.t += dt) > 1.8) { // leaves: shrinks away
        const k = Math.max(0, 1 - (c.t - 1.8) * 3); c.fig.m.scale.setScalar(2 * k);
        if (k <= 0) { scene.remove(c.fig.m, c.bubble, c.tag); c.tex.dispose(); S.customers.splice(S.customers.indexOf(c), 1); continue; }
      }
      const k = Math.max(0, c.patience / PATIENCE), key = c.mood + Math.round(k * 40);
      if (key !== c.drawK) { c.drawK = key; drawBubble(c.canvas, c.color, k, c.mood); c.tex.needsUpdate = true; }
      const bob = Math.sin(t * 3 + c.x) * .08, urgent = c.mood === 'wait' && k < .25 ? 1 + Math.sin(t * 14) * .08 : 1;
      c.bubble.position.set(c.x, 3.5 + bob, c.z); c.bubble.scale.setScalar(1.9 * urgent); c.tag.position.set(c.x, 2.4, c.z);
    }
  };
  // where the guide should send you: customers whose glass you carry, else the bar (if anyone is waiting)
  S.targets = () => {
    const carry = S.customers.filter(c => c.mood === 'wait' && tray.glasses.some(g => g.id === c.id));
    if (carry.length) return carry.map(c => ({ x: c.x, z: c.z, color: c.color }));
    return S.customers.some(c => c.mood === 'wait') ? [{ x: BAR.x, z: BAR.z, color: '#a970ff', bar: true }] : [];
  };
  S.clear = () => { for (const c of S.customers) if (c.fig) scene.remove(c.fig.m, c.bubble, c.tag); S.customers.length = 0; };
  return S;
}
