import * as THREE from 'three';
import { createCharacter } from './character.js';
import { createTray } from './tray.js';
import { textTexture } from './assets.js';
import { BAR } from './shift.js';
import { SPOTS } from './island.js';

// RIVAL WAITERS (solo): three local bots so the arena is never empty. They stack at the bar, run drinks out to
// the islets, and body-slam you when you're carrying something tall. They're named after your chatters when
// chat is connected ("your chat is literally trying to knock your drinks over"), else house names.
const HOUSE = ['BARISTA BRAD', 'TIPLESS TOM', 'KAREN (MANAGER)', 'SEAGULL STEVE', 'INTERN IAN'];
const COLORS = ['#ff4f6d', '#4fc3ff', '#5dd39e', '#ffb020', '#c77dff'];
const DROP = Object.values(SPOTS).map(([x, z]) => [x * .93, z * .93]);

export function createBots(scene, level, { names = [], count = 3 } = {}) {
  const bots = [];
  const onBoards = (x, z) => level.colliders.some(c => x > c.minX - .2 && x < c.maxX + .2 && z > c.minZ - .2 && z < c.maxZ + .2);
  async function spawn(i) {
    const name = (names[i] || HOUSE[i % HOUSE.length]).slice(0, 16), color = COLORS[i % COLORS.length];
    const avatar = await createCharacter(scene, { color }), tray = createTray(avatar.holder);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(name.toUpperCase(), { w: 512, h: 96, bg: color, font: 'bold 56px system-ui' }), depthTest: false, sizeAttenuation: false }));
    tag.scale.set(.16, .03, 1); tag.renderOrder = 11; scene.add(tag);
    const a = i / count * Math.PI * 2;
    const b = { name, color, avatar, tray, tag, tips: 0, slammedAt: -9, vy: 0, mode: 'stack', want: 3 + Math.floor(Math.random() * 6), goal: null, slamCd: 3 + i, slamT: 0, kb: { x: 0, z: 0 }, fall: 0, wait: 0,
      p: { pos: { x: Math.cos(a) * 3.5, z: Math.sin(a) * 2.5 }, y: 0, yaw: 0, vel: { x: 0, z: 0 }, vy: 0, grounded: true, steady: false } };
    tray.onCollapse = n => { if (b.fall <= 0) api.onTopple?.(b, n, api.t - (b.slammedAt ?? -9) < 1.5); };
    bots.push(b); return b;
  }
  const ready = Promise.all(Array.from({ length: count }, (_, i) => spawn(i)));
  const api = {
    bots, ready,
    // run = the live run (player, applyHit, slam state); returns nothing
    update(dt, t, player, run) {
      api.t = t; const drunk = run.mods?.on('drunk');
      for (const b of bots) {
        const p = b.p;
        if (b.inflateT > 0) { // CO2'd: swell, float up, POP, respawn at the plaza
          b.inflateT -= dt; const k = Math.min(1, (2.4 - b.inflateT) / .8); b.avatar.inflate(k); p.y += dt * 2.4 * k; p.pos.x += Math.sin(t * 3 + b.want) * dt * .6;
          if (b.inflateT <= 0) { b.avatar.inflate(0); run.onPop?.(p.pos, p.y); b.fall = .01; if (b.tray.count) b.tray.collapse(); p.y = -1; }
          b.avatar.update(dt, p, b.tray.state, 'play'); b.tray.render(t); b.tag.position.set(p.pos.x, p.y + 3.2, p.pos.z); continue;
        }
        if (b.fall > 0) { // ring-out: sink, then pop back at the plaza
          b.fall -= dt; p.y -= dt * 6; if (b.fall <= 0) { const a = Math.random() * 6.28; p.pos.x = Math.cos(a) * 3; p.pos.z = Math.sin(a) * 2; p.y = 0; b.mode = 'stack'; }
          b.avatar.update(dt, p, b.tray.state, 'play'); b.tag.position.set(p.pos.x, p.y + 2.5, p.pos.z); continue;
        }
        // choose a goal
        if (b.mode === 'stack') b.goal = { x: BAR.x + Math.cos(t * .3 + b.want) * 1, z: BAR.z + Math.sin(t * .3 + b.want) * .8 };
        const pd = Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z), juicy = run.glass.count >= 3 && player.y > -.5;
        if (b.slamCd <= 0 && juicy && pd < 5.5 && b.mode !== 'serve-run') b.mode = 'hunt';
        if (b.mode === 'hunt') b.goal = { x: player.pos.x, z: player.pos.z };
        if (drunk) b.goal = { x: b.goal.x + Math.sin(t * 2 + b.want) * 3, z: b.goal.z + Math.cos(t * 1.7 + b.want) * 3 }; // OPEN BAR: they stagger too
        // move (bots don't walk off the edge on their own; knockback can still send them in)
        b.slamCd -= dt; b.slamT = Math.max(0, b.slamT - dt);
        const dx = b.goal.x - p.pos.x, dz = b.goal.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
        const speed = b.mode === 'hunt' ? (b.slamT > 0 ? 9 : 3.6) : d > .4 ? 3 : 0;
        let vx = dx / d * speed + b.kb.x, vz = dz / d * speed + b.kb.z; b.kb.x *= Math.pow(.02, dt); b.kb.z *= Math.pow(.02, dt);
        const nx = p.pos.x + vx * dt, nz = p.pos.z + vz * dt, air = p.y > .01 || b.vy > 0;
        if (air) { // YEETED: ballistic arc, spinning; land on boards or splash into the sea
          p.pos.x = nx; p.pos.z = nz; b.vy -= 14 * dt; p.y += b.vy * dt; b.kb.x /= Math.pow(.02, dt * .8); b.kb.z /= Math.pow(.02, dt * .8);
          if (p.y <= 0) { p.y = 0; b.vy = 0; p.spin = 0; if (!onBoards(p.pos.x, p.pos.z)) { b.fall = 1; b.tray.collapse(); run.onBotRingout?.(b); } }
        } else if (onBoards(nx, nz)) { p.pos.x = nx; p.pos.z = nz; } else if (Math.hypot(b.kb.x, b.kb.z) > 2) { p.pos.x = nx; p.pos.z = nz; b.fall = 1; b.tray.collapse(); run.onBotRingout?.(b); }
        else { vx = vz = 0; }
        p.grounded = p.y <= .01;
        p.vel.x = vx; p.vel.z = vz; if (speed > 0) p.yaw = Math.atan2(dx, -dz);
        // the bot's own tower: stacks at the bar, rides its movement
        b.tray.step(dt, { ax: -vx * .3, az: -vz * .3 });
        if (b.mode === 'stack' && d < 1.4 && (b.wait -= dt) <= 0) { b.wait = .9; b.tray.add(null, COLORS[(b.tray.count + 2) % 5]); if (b.tray.count >= b.want) { b.mode = 'serve-run'; b.goal = { x: DROP[Math.floor(Math.random() * 4)][0], z: DROP[Math.floor(Math.random() * 4)][1] }; } }
        if (b.mode === 'serve-run') { if (!b.goal.x && !b.goal.z) b.goal = { x: DROP[0][0], z: DROP[0][1] }; if (d < 1.5) { const n = b.tray.count; b.tips += Math.round(2.5 * n * (1 + n * .1)); b.tray.takeTop(n); b.mode = 'stack'; b.want = 3 + Math.floor(Math.random() * 8); } }
        if (b.mode !== 'stack' && b.mode !== 'hunt' && b.mode !== 'serve-run') b.mode = 'stack';
        if (b.tray.count === 0 && b.mode === 'serve-run') b.mode = 'stack';
        // HUNT: lunge when close, shove the player on contact
        if (b.mode === 'hunt') {
          if (pd < 2.4 && b.slamT <= 0 && b.slamCd <= 0) { b.slamT = .3; b.slamCd = 4 + Math.random() * 3; }
          if (b.slamT > 0 && pd < 1.15) { const l = pd || 1; run.applyHit?.({ by: b.name, dir: { x: (player.pos.x - p.pos.x) / l, z: (player.pos.z - p.pos.z) / l }, power: 7 }); b.slamT = 0; b.mode = 'stack'; }
          if (!juicy || (b.slamT <= 0 && b.slamCd > 0)) b.mode = 'stack';
        }
        // the player's slam landing on this bot: its tower goes, it gets shoved (maybe into the sea)
        if (run.slamT > 0 && !run.slamHit?.has(b) && Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z) < 1.25) {
          (run.slamHit ??= new Set()).add(b); const l = Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z) || 1;
          b.kb.x = (p.pos.x - player.pos.x) / l * 11; b.kb.z = (p.pos.z - player.pos.z) / l * 11; b.vy = 6.5; p.spin = 14; b.slammedAt = t; if (b.tray.count) b.tray.collapse(); b.avatar.knock('fall', .7); run.onSlamLanded?.(b.name);
        }
        b.avatar.update(dt, p, b.tray.state, 'play'); b.tray.render(t);
        b.tag.position.set(p.pos.x, p.y + 2.5 + b.tray.count * .3, p.pos.z);
      }
    },
    yeet(b, dx, dz, power = 10, up = 7) { const l = Math.hypot(dx, dz) || 1; b.kb.x = dx / l * power; b.kb.z = dz / l * power; b.vy = up; b.p.spin = 12 + Math.random() * 6; if (b.tray.count) { b.slammedAt = api.t; b.tray.collapse(); } },
    standings() { return bots.map(b => ({ name: b.name, color: b.color, tips: b.tips, n: b.tray.count })); },
  };
  return api;
}
