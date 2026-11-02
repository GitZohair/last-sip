// The autopilot's shot list. Each beat: len (max s), min, fov, enter(), tick() -> true when done, cam(rig) -> camera.
const peace = g => { for (const b of g.bots?.bots || []) b.slamCd = Math.max(b.slamCd, 1.5); };
const car = (g, name) => g.cars?.cars?.find(c => c.k.name === name);
const at = c => c && { x: c.x, y: c.y, z: c.z, yaw: c.yaw };
// get into a vehicle: stand by its door, tap F (retry until seated)
const board = (dt, f, st, g, c, off = 1.4) => {
  if (g.cars.driving) return true; f.io.hold();
  if ((st.tries = (st.tries ?? .4) + dt) > .5) { st.tries = 0; if (f.io.dist(c) > 2.2 || c.sink > 0) f.io.tp(c.x + Math.cos(c.yaw) * off, c.z + Math.sin(c.yaw) * off, c.yaw); f.io.tap('KeyF'); }
  return false;
};

export const BEATS = [
  { name: 'establish', len: 7, fov: 50,
    enter: (f, st) => { f.io.tp(3.4, 2.6, 2.6); st.fly = false; },
    tick: (dt, f, st, g) => { peace(g); f.io.hold(); if (!st.fly && f.bt > .3) { st.fly = true; g.planes?.flyby('STACK DRINKS. SLAM STREAMERS.'); } },
    cam: r => r.orbit({ x: 0, y: 1.2, z: 0 }, 30, 12, .07, .7) },

  { name: 'tower', len: 5, fov: 50, shield: true,
    enter: (f, st) => { st.fill = 0; },
    tick: (dt, f, st, g) => { peace(g); while (g.run.glass.count < 10 && st.fill++ < 30) g.run.glass.add(null, ['#ff4f6d', '#ffd166', '#5dd39e', '#4fc3ff', '#c77dff'][st.fill % 5]); if (f.bt < .2) { const q = g.run.glass.state; q.vx = q.vz = q.tx = q.tz = 0; } f.io.walk(0, -20, dt); f.io.hold('KeyW', 'ShiftLeft'); },
    cam: r => r.hero(8.5, 2.6) },

  { name: 'airstrike', len: 9, fov: 62,
    enter: (f, st) => { st.sent = false; },
    tick: (dt, f, st, g) => { peace(g); f.io.walk(0, -20, dt); if (!st.sent && f.bt > .4) { st.sent = true; f.io.face(0, -20); g.planes?.strike('YOUR CHAT', 'KABOOM', 4); } },
    cam: r => r.behind(10, 3.2, 14) },

  { name: 'slam', len: 6, min: 2.5, fov: 55,
    enter: (f, st) => { f.io.tp(-4, 2, 1.6); },
    tick: (dt, f, st, g) => {
      const b = st.b && st.b.fall <= 0 ? st.b : (st.b = f.io.bot()); if (!b) return false;
      if (st.hit) return true;
      f.io.walk(b.p.pos.x, b.p.pos.z, dt, .2); if (f.io.dist(b) < 1.9) { f.io.tap('KeyE'); st.hit = true; }
    },
    cam: r => r.side(8.5, 2.6, -Math.PI / 2) },

  { name: 'bombs', len: 7, fov: 55, shield: true,
    enter: (f, st, ) => { f.io.tp(11.5, .5, -Math.PI / 2); st.next = .6; },
    tick: (dt, f, st, g) => {
      if (f.bt < .1) g.bombs?.give('bomb', 3);
      f.io.hold(); const b = f.io.bot(); if (b) f.io.aim(b.p.pos.x, b.p.pos.z, dt);
      if ((st.next -= dt) <= 0 && g.bombs?.held) { st.next = 1.1; if (b) f.io.face(b.p.pos.x, b.p.pos.z); g.throwBomb(); }
    },
    cam: r => r.behind(7, 3.4, 12) },

  { name: 'co2', len: 8, min: 4, fov: 50, shield: true,
    enter: (f, st) => { f.io.tp(-2, -3, 0); },
    tick: (dt, f, st, g) => {
      if (f.bt < .1) g.bombs?.give('gun', 3);
      if (st.target) { f.io.hold(); return st.target.fall > 0; }
      const b = f.io.bot(); if (!b) return false;
      if (f.io.dist(b) > 3.5) f.io.walk(b.p.pos.x, b.p.pos.z, dt, .5); else { f.io.hold(); f.io.face(b.p.pos.x, b.p.pos.z); if (g.shootGas()) st.target = b; }
    },
    cam: (r, f, st) => { const p = f.player; return r.watch(() => st.target ? { x: st.target.p.pos.x, y: st.target.p.y, z: st.target.p.pos.z } : { x: p.pos.x, y: p.y, z: p.pos.z }, { x: 6.5, y: 3.2, z: 8 }); } },

  { name: 'taxi', len: 8, fov: 60, shield: true,
    enter: (f, st) => { st.c = null; },
    tick: (dt, f, st, g) => {
      const c = st.c || (st.c = car(g, 'taxi')); if (!c) return;
      if (!board(dt, f, st, g, c)) return;
      const inside = Math.abs(c.x) < 5.5 && Math.abs(c.z) < 4.2, b = f.io.bot(x => Math.abs(x.p.pos.x) < 6 && Math.abs(x.p.pos.z) < 4.5);
      if (b && inside) f.io.drive(c, b.p.pos.x, b.p.pos.z); else f.io.drive(c, 0, 0); // ram rivals, but stay on the plaza
    },
    cam: (r, f, st) => r.follow(() => at(st.c), 10, 3.6, 3) },

  { name: 'offedge', len: 7, min: 3, fov: 55, shield: true,
    enter: (f, st, ) => { st.c = null; },
    tick: (dt, f, st, g) => { const c = st.c || (st.c = car(g, 'taxi')); if (!c) return; if (!st.went && !board(dt, f, st, g, c)) return; st.went = true; if (g.cars.driving) f.io.drive(c, 16, 12); else f.io.hold(); return c.y < -2.5; },
    cam: (r, f, st) => r.follow(() => at(st.c), 11, 3.8, 4) },

  { name: 'plane', len: 20, min: 3, fov: 60, shield: true,
    enter: (f, st) => { st.c = null; st.phase = 0; },
    tick: (dt, f, st, g) => {
      const c = st.c || (st.c = car(g, 'plane')); if (!c) return;
      if (f.bt < .1) { f.io.tp(c.x + Math.cos(c.yaw) * 1.6, c.z + Math.sin(c.yaw) * 1.6, c.yaw); g.bombs?.give('bomb', 3); }
      if (st.phase === 0) { if (board(dt, f, st, g, c, 1.6)) st.phase = 1; return; }
      if (st.phase === 1) { f.io.drive(c, 20, -14); if (Math.hypot(c.x - 20, c.z + 14) < 5) st.phase = 2; } // out over the sea, then turn back
      else if (st.phase === 2) { const d = f.io.drive(c, 0, 0); const k = Math.hypot(c.x, c.z); if (k < 15 && Math.abs(d) < .25 && c.y > 3) { c.fuel = 0; st.phase = 3; st.t = 0; } }
      else { f.io.hold(); st.t += dt; if (st.dropT === undefined) st.dropT = 0; return st.t > 3; }
      if (g.bombs?.held && c.y > 2) { const b = f.io.bot(); if (b && f.io.dist(b) < 4) { f.io.face(b.p.pos.x, b.p.pos.z); g.throwBomb(); } }
    },
    cam: (r, f, st) => { const fol = r.follow(() => at(st.c), 11, 3.4, 4), crash = r.watch(() => st.c && { x: st.c.x, y: Math.max(0, st.c.y), z: st.c.z }, { x: 10, y: 4.5, z: 10 });
      return dt => (st.phase === 3 ? crash : fol)(dt); } },

  { name: 'finale', len: 7, fov: 48,
    enter: (f, st) => { f.io.tp(1, .8, 2.6); st.fly = false; },
    tick: (dt, f, st, g) => { f.io.hold(); if (!st.fly) { st.fly = true; g.planes?.flyby('YOUR CHAT RUNS THE SKY'); } },
    cam: r => r.orbit({ x: 0, y: 1.5, z: 0 }, 34, 15, -.06, 2.2) },
];
