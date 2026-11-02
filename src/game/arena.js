import * as THREE from 'three';
import { createCharacter } from './character.js';
import { createTray } from './tray.js';
import { textTexture } from './assets.js';

// STREAMER ARENA: everyone in the room is on the same island, each carrying their own drink tower.
// Each client simulates itself and broadcasts its state ~12x/s; other players are interpolated puppets.
// SLAM (E): a short dash. If it connects, the victim gets the hit (victim-side authority): shove + tower kick.
// CHAT WARS: your chat's sabotage is sent to a rival (the leader), arriving with your channel's name on it.
export function createArena(scene, { net, me }) {
  const peers = new Map(); // id -> { avatar, tray, tag, s (latest state), p (smoothed), seen }
  let sendT = 0;
  const puppet = () => ({ pos: { x: 0, z: 0 }, y: 0, yaw: 0, vel: { x: 0, z: 0 }, vy: 0, grounded: true, steady: false });
  async function add(id, s) {
    const e = { s, p: puppet(), seen: performance.now(), loading: true }; peers.set(id, e);
    e.avatar = await createCharacter(scene, { color: s.color }); e.tray = createTray(e.avatar.holder);
    e.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(s.name.slice(0, 16).toUpperCase(), { w: 512, h: 96, bg: s.color || '#a970ff', font: 'bold 56px system-ui' }), depthTest: false, sizeAttenuation: false }));
    e.tag.scale.set(.16, .03, 1); e.tag.renderOrder = 11; scene.add(e.tag); e.loading = false;
  }
  function remove(id) { const e = peers.get(id); if (!e) return; e.avatar?.dispose(); scene.remove(e.tag); peers.delete(id); }
  const api = {
    peers,
    onMessage(ev, d, handlers) {
      if (!d || d.id === me.id) return;
      if (ev === 'state') { const e = peers.get(d.id); if (!e) add(d.id, d); else { e.s = d; e.seen = performance.now(); } return; }
      if (ev === 'leave') return remove(d.id);
      if (ev === 'bomb') return handlers.bomb?.(d);
      if (ev === 'co2') return handlers.co2?.(d);
      if (d.to !== me.id) return; // hits and attacks are addressed
      if (ev === 'hit') handlers.hit?.(d);
      if (ev === 'attack') handlers.attack?.(d);
    },
    // my state out, everyone else's puppets in
    update(dt, t, player, tower, run) {
      if ((sendT -= dt) <= 0 && net.ready) {
        sendT = 1 / 12;
        net.send('state', { id: me.id, name: me.name, color: me.color, x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2), y: +player.y.toFixed(2), yaw: +player.yaw.toFixed(2),
          vx: +player.vel.x.toFixed(1), vz: +player.vel.z.toFixed(1), n: tower.count, tx: +tower.state.tx.toFixed(3), tz: +tower.state.tz.toFixed(3), tips: run.shift.tips, best: run.best, down: run.drops, slam: run.slamT > 0 ? 1 : 0 });
      }
      const now = performance.now();
      for (const [id, e] of peers) {
        if (now - e.seen > 6000) { remove(id); continue; }
        if (e.loading) continue;
        const s = e.s, p = e.p, k = Math.min(1, dt * 12);
        if (Math.hypot(s.x - p.pos.x, s.z - p.pos.z) > 6) { p.pos.x = s.x; p.pos.z = s.z; } // teleport (respawn) snaps
        p.pos.x += (s.x - p.pos.x) * k; p.pos.z += (s.z - p.pos.z) * k; p.y += (s.y - p.y) * k; p.yaw = s.yaw; p.vel.x = s.vx; p.vel.z = s.vz;
        while (e.tray.count < s.n) e.tray.add(null, ['#ffb020', '#ff4f6d', '#5dd39e', '#ffd166'][e.tray.count % 4]);
        if (e.tray.count > s.n) e.tray.takeTop(e.tray.count - s.n);
        e.tray.state.tx += (s.tx - e.tray.state.tx) * k; e.tray.state.tz += (s.tz - e.tray.state.tz) * k;
        e.avatar.update(dt, p, e.tray.state, 'play'); e.tray.render(t);
        e.tag.position.set(p.pos.x, p.y + 2.6 + s.n * .3, p.pos.z);
        // my slam connecting with them: send the hit once per dash
        if (run.slamT > 0 && !run.slamHit?.has(id) && Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z) < 1.25 && Math.abs(player.y - p.y) < 1) {
          (run.slamHit ??= new Set()).add(id);
          const dx = p.pos.x - player.pos.x, dz = p.pos.z - player.pos.z, l = Math.hypot(dx, dz) || 1;
          net.send('hit', { id: me.id, to: id, by: me.name, dir: { x: dx / l, z: dz / l }, power: 9 });
          run.onSlamLanded?.(s.name);
        }
      }
    },
    standings(run) {
      const rows = [{ name: me.name, color: me.color, tips: run.shift.tips, n: run.glass.count, me: true }];
      for (const e of peers.values()) rows.push({ name: e.s.name, color: e.s.color, tips: e.s.tips || 0, n: e.s.n || 0 });
      return rows.sort((a, b) => b.tips - a.tips);
    },
    leader() { let best = null; for (const [id, e] of peers) if (!best || (e.s.tips || 0) > (best.s.tips || 0)) best = { id, s: e.s }; return best; },
    attack(kind, user, from) { const L = api.leader(); if (!L) return false; net.send('attack', { id: me.id, to: L.id, kind, user, from }); return L.s.name; },
    leave() { net.send('leave', { id: me.id }); for (const id of [...peers.keys()]) remove(id); },
  };
  return api;
}
