import * as THREE from 'three';
import { sfx } from './sfx.js';
import { BEATS } from './film-beats.js';

// FILM MODE (?film): an autopilot plays a scripted round (stack, get bombed, slam, bomb, CO2, taxi, plane crash)
// while a camera director cuts between cinematic angles. ?film=play keeps the normal game camera + HUD (for a
// screen recording); ?film (cine) hides the HUD. Recording frames to disk is done by main.js (record()).
export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, -(tz - fz));

export function createFilm({ world, player, get, cine = true }) {
  const cam = world.camera, K = player.keys, tmp = new THREE.Vector3();
  const film = { frame: -1, t: 0, bt: 0, i: -1, shots: [], sfx: [], done: false, cine };
  // every impact sound is logged with its frame so ffmpeg can lay the same sounds under the video
  for (const k of ['slam', 'hit', 'shatter', 'splash', 'boom', 'thud']) { const f = sfx[k]; sfx[k] = (...a) => { if (film.frame >= 0) film.sfx.push({ f: film.frame, k }); return f(...a); }; }

  // ---- hands on the keyboard
  const MOVE = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyE'];
  const taps = [];
  const io = {
    hold(...c) { for (const x of MOVE) K.delete(x); for (const x of c) if (x) K.add(x); },
    tap(c) { K.add(c); taps.push([c, .15]); },
    aim(x, z, dt = 1) { const w = yawTo(player.pos.x, player.pos.z, x, z); player.camYaw += wrap(w - player.camYaw) * Math.min(1, dt * 8); player.lookIdle = 0; },
    face(x, z) { player.camYaw = yawTo(player.pos.x, player.pos.z, x, z); player.lookIdle = 0; },
    walk(x, z, dt, r = .8) { if (Math.hypot(x - player.pos.x, z - player.pos.z) < r) { io.hold(); return true; } io.aim(x, z, dt); io.hold('KeyW'); return false; },
    drive(c, x, z) { const d = wrap(yawTo(c.x, c.z, x, z) - c.yaw); io.hold('KeyW', d > .06 ? 'KeyD' : d < -.06 ? 'KeyA' : null); return d; },
    tp(x, z, yaw = 0) { const r = get().run; if (r) { r.swimming = false; r.climb = null; r.inflateT = 0; r.avatar?.inflate?.(0); } player.swimming = false; player.reset({ x, z, yaw }); player.grounded = true; player.spin = 0; },
    bot(pred = () => true) { const g = get(); let best = null, bd = 1e9; for (const b of g.bots?.bots || []) { if (b.fall > 0 || b.inflateT > 0 || !pred(b)) continue; const d = Math.hypot(b.p.pos.x - player.pos.x, b.p.pos.z - player.pos.z); if (d < bd) { bd = d; best = b; } } return best; },
    dist: (o) => Math.hypot((o.x ?? o.p.pos.x) - player.pos.x, (o.z ?? o.p.pos.z) - player.pos.z),
  };

  // ---- camera rigs (smoothed); snap on every cut
  const P = new THREE.Vector3(), L = new THREE.Vector3(); let snap = true;
  const put = (px, py, pz, lx, ly, lz, dt, k = 5) => {
    py = Math.max(.9, py); // never under the sea
    if (snap) { P.set(px, py, pz); L.set(lx, ly, lz); snap = false; }
    else { P.lerp(tmp.set(px, py, pz), Math.min(1, dt * k)); L.lerp(tmp.set(lx, ly, lz), Math.min(1, dt * k * 1.6)); }
    cam.position.copy(P); cam.up.set(0, 1, 0); cam.lookAt(L);
  };
  const head = () => ({ x: player.pos.x, y: player.y + 1.4 + (player.towerH || 0) * .5, z: player.pos.z });
  const rig = {
    orbit: (c, r, h, speed, a0 = 0) => dt => { const a = a0 + film.bt * speed, C = typeof c === 'function' ? c() : c; put(C.x + Math.sin(a) * r, h, C.z + Math.cos(a) * r, C.x, C.y ?? 1, C.z, dt, 3); },
    hero: (dist = 3.4, side = 1.2) => dt => { const y = player.yaw, fx = Math.sin(y), fz = -Math.cos(y), H = head(); put(player.pos.x + fx * dist + fz * -side, player.y + 1.7, player.pos.z + fz * dist + fx * side, H.x, player.y + 1.3 + (player.towerH || 0) * .3, H.z, dt, 4); },
    side: (dist = 6, h = 1.6, ang = Math.PI / 2) => dt => { const y = player.yaw + ang, H = head(); put(H.x + Math.sin(y) * dist, player.y + h, H.z - Math.cos(y) * dist, H.x, H.y - .3, H.z, dt, 2.5); },
    behind: (back = 4.5, up = 2.2, look = 6) => dt => { const y = player.camYaw, fx = Math.sin(y), fz = -Math.cos(y); put(player.pos.x - fx * back, player.y + up, player.pos.z - fz * back, player.pos.x + fx * look, player.y + .8, player.pos.z + fz * look, dt, 5); },
    follow: (obj, back = 9, up = 3.5, side = 3) => dt => { const o = obj(); if (!o) return; const fx = Math.sin(o.yaw), fz = -Math.cos(o.yaw); put(o.x - fx * back + fz * -side, o.y + up, o.z - fz * back + fx * side, o.x + fx * 4, o.y, o.z + fz * 4, dt, 3); },
    fixed: (pos, look) => dt => { const l = look(); put(pos.x, pos.y, pos.z, l.x, l.y, l.z, dt, 6); },
    watch: (obj, off) => dt => { const o = obj(); if (!o) return; put(o.x + off.x, (o.y || 0) + off.y, o.z + off.z, o.x, (o.y || 0) + .8, o.z, dt, 3); },
  };
  film.io = io; film.rig = rig; film.get = get; film.player = player;

  function next() {
    film.i++; film.bt = 0; snap = true; io.hold();
    const b = BEATS[film.i]; if (!b) { film.done = true; film.beat = null; return; }
    film.beat = { ...b, st: {} }; cam.fov = b.fov || 60; cam.updateProjectionMatrix();
    film.shots.push({ name: b.name, from: Math.max(0, film.frame), t: film.t });
    b.enter?.(film, film.beat.st);
  }
  // called once per frame BEFORE the sim steps: drives the keys
  film.update = dt => {
    film.t += dt; film.bt += dt;
    for (let i = taps.length - 1; i >= 0; i--) if ((taps[i][1] -= dt) <= 0) { K.delete(taps[i][0]); taps.splice(i, 1); }
    if (!film.beat && !film.done) next();
    const b = film.beat; if (!b) return;
    const g = get(); if (g.run) { if (g.run.t > 80) g.run.t = 80; g.run.shield = !!b.shield; } // never let the round end mid-take
    const finished = b.tick?.(dt, film, b.st, g);
    if ((finished && film.bt >= (b.min || 0)) || film.bt >= b.len) next();
  };
  // called AFTER the game camera: cinematic override + the sun follows the action
  film.camera = dt => {
    const b = film.beat; if (!cine || !b?.cam) return;
    if (!b.camFn) b.camFn = b.cam(rig, film, b.st);
    b.camFn(dt);
    world.light({ pos: { x: L.x, z: L.z } }, 0, {});
  };
  return film;
}
