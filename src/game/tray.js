import * as THREE from 'three';

// THE LEANING TOWER OF DRINKS: every glass you load stacks on top of the last. The tower bends as you move
// (one lean spring, amplified by height) and topples when the top leans too far: everything flies off.
// Same interface as the old tray (state.water/danger, step, kick, lip, render, add, clear, count).
const H = .27, R = .12, MAX = 30; // chunky glasses: the tower has to read on a compressed stream
const shellGeo = new THREE.CylinderGeometry(R, R * .82, H * .96, 10, 1, true), liquidGeo = new THREE.CylinderGeometry(R * .9, R * .75, H * .7, 10);
const rimGeo = new THREE.TorusGeometry(R, .018, 4, 14).rotateX(Math.PI / 2);
const shellMat = new THREE.MeshLambertMaterial({ color: '#e8fbff', emissive: '#6fb7d0', emissiveIntensity: .35, transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
const rimMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const liquidMats = new Map(); const liquid = c => { const k = new THREE.Color(c).getHexString(); if (!liquidMats.has(k)) liquidMats.set(k, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: .45 })); return liquidMats.get(k); };

export function createTray(parent) {
  const g = new THREE.Group(); parent.add(g);
  const wood = new THREE.MeshLambertMaterial({ color: '#c58b3e' });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.27, .25, .025, 20), wood); disc.position.y = -.145; g.add(disc);
  const stack = new THREE.Group(); stack.position.y = -.13; g.add(stack);
  const deco = new THREE.Group(); // umbrella + straw ride on the top glass
  const brolly = new THREE.Mesh(new THREE.ConeGeometry(.12, .06, 8, 1, true), new THREE.MeshLambertMaterial({ color: '#ff5fa2', side: THREE.DoubleSide })); brolly.position.set(-.04, .2, 0); brolly.rotation.z = .3; deco.add(brolly);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .3, 6), new THREE.MeshBasicMaterial({ color: '#ff4f6d' })); straw.position.set(.03, .12, 0); straw.rotation.z = -.25; deco.add(straw);
  const glasses = []; // { m, color, water, salt }
  const flying = []; // shattered glasses: { m, v, spin, t }
  const s = { tx: 0, tz: 0, vx: 0, vz: 0 };
  let lastT = 0, wob = 0;
  const state = {
    get water() { return glasses.length ? glasses.reduce((a, x) => a + x.water, 0) / glasses.length : 0; },
    set water(v) { for (const x of glasses) x.water = Math.max(0, Math.min(1, v)); },
    get tx() { return s.tx; }, set tx(v) { s.tx = v; }, get tz() { return s.tz; }, set tz(v) { s.tz = v; },
    get vx() { return s.vx; }, set vx(v) { s.vx = v; }, get vz() { return s.vz; }, set vz(v) { s.vz = v; },
    danger: 0, scale: 1,
  };
  const reach = () => 1 + glasses.length * .16; // how much the top amplifies the lean
  const api = {
    state, group: g, glasses, onCollapse: null,
    get count() { return glasses.length; },
    get height() { return glasses.length * H; },
    add(_id, color = '#ffb020') {
      if (glasses.length >= MAX) return false;
      const m = new THREE.Group(); m.add(new THREE.Mesh(shellGeo, shellMat)); const lq = new THREE.Mesh(liquidGeo, liquid(color)); lq.position.y = -H * .1; m.add(lq);
      const rim = new THREE.Mesh(rimGeo, rimMat); rim.position.y = H * .48; m.add(rim);
      stack.add(m); glasses.push({ m, color: new THREE.Color(color), water: 1, salt: 0 });
      m.add(deco); s.vx += (Math.random() - .5) * .25; s.vz += (Math.random() - .5) * .25; // every new glass rattles the tower
      return true;
    },
    take() { return api.takeTop(1); },
    takeTop(n = 1) { // serve from the top: returns { water, salt } averaged, or null
      if (glasses.length < n) return null; let w = 0, sa = 0;
      for (let i = 0; i < n; i++) { const x = glasses.pop(); stack.remove(x.m); w += x.water; sa += x.salt; }
      if (glasses.length) glasses.at(-1).m.add(deco); else deco.removeFromParent();
      return { water: w / n, salt: sa / n };
    },
    drop() { return false; },
    refill(f) { for (const x of glasses) x.water = Math.min(1, x.water + f); },
    salt(k) { const sea = new THREE.Color('#5d8f7c'); for (const x of glasses) { x.salt = Math.min(1, x.salt + k); x.m.children[1].material = liquid(x.color.clone().lerp(sea, Math.min(.85, x.salt))); } },
    collapse(dirx = s.tx, dirz = s.tz) { // TIMBER: every glass flies off in the lean direction
      if (!glasses.length) return 0;
      let root = g; while (root.parent) root = root.parent;
      const n = glasses.length, top = glasses.at(-1).m.getWorldPosition(new THREE.Vector3()), base = stack.getWorldPosition(new THREE.Vector3());
      let ux = top.x - base.x, uz = top.z - base.z; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; void dirx; void dirz;
      glasses.forEach((x, i) => {
        root.attach(x.m); const k = i / Math.max(1, n - 1);
        flying.push({ m: x.m, v: new THREE.Vector3(ux * (1.5 + k * 4) + (Math.random() - .5) * 2, 2 + Math.random() * 3 + k * 2, uz * (1.5 + k * 4) + (Math.random() - .5) * 2), spin: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), t: 0 });
      });
      glasses.length = 0; deco.removeFromParent(); s.tx = s.tz = s.vx = s.vz = 0; state.danger = 0;
      api.onCollapse?.(n); return n;
    },
    step(dt, { ax = 0, az = 0, turn = 0, steady = false, calm = false, wobble = 0, gain = 1 }) {
      const n = glasses.length, tall = reach();
      const k = (steady || calm ? 16 : 9) / (1 + n * .05), c = steady ? 5 : calm ? 7 : 1.6 + n * .02, a = (steady ? .03 : .05) * gain;
      s.vx += (-k * s.tx - c * s.vx - ax * a + turn * .5 + (Math.random() - .5) * wobble) * dt;
      s.vz += (-k * s.tz - c * s.vz - az * a + (Math.random() - .5) * wobble) * dt;
      // past the tipping point a leaning tower wants to lean MORE (taller = faster): counter-steer or lose it
      const lean = Math.hypot(s.tx, s.tz), over = Math.max(0, lean * tall - .3);
      if (over > 0 && lean > 1e-4) { const p = over * n * 1.2 * dt / lean; s.vx += s.tx * p; s.vz += s.tz * p; }
      s.tx += s.vx * dt; s.tz += s.vz * dt;
      const top = Math.hypot(s.tx, s.tz) * tall, limit = .62;
      state.danger = n > 1 ? Math.min(1, top / limit) : 0;
      if (n > 1 && top > limit) api.collapse();
      for (const x of glasses) x.water = Math.max(0, x.water - Math.max(0, top - .35) * .05 * dt);
      return 0;
    },
    kick(x, z) { s.vx += x * .5; s.vz += z * .5; },
    lip(out) { const top = glasses.at(-1); return top ? top.m.localToWorld(out.set(0, H / 2, 0)) : g.localToWorld(out.set(0, 0, 0)); },
    tint() {},
    render(t, scale = 1) {
      const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t; wob += dt;
      g.scale.setScalar(scale);
      // bend: glass i is pushed sideways by the lean times (i/n)^2, and tilted along the curve
      const n = glasses.length, tall = reach();
      glasses.forEach((x, i) => {
        const f = n > 1 ? i / (n - 1) : 0, bend = f * f * tall, sway = Math.sin(wob * 3 + i * .4) * .004 * i;
        x.m.position.set(-s.tx * bend * .9 * n * H + sway, i * H + H / 2, s.tz * bend * .9 * n * H);
        x.m.rotation.set(s.tz * f * 1.6 * tall, 0, s.tx * f * 1.6 * tall);
      });
      for (let i = flying.length - 1; i >= 0; i--) { // shattered glasses tumble, then sink away
        const f = flying[i]; f.t += dt; f.v.y -= 14 * dt; f.m.position.addScaledVector(f.v, dt);
        f.m.rotation.x += f.spin.x * dt; f.m.rotation.y += f.spin.y * dt; f.m.rotation.z += f.spin.z * dt;
        if (f.m.position.y < -.05 && f.v.y < 0) { f.v.y *= -.3; f.v.x *= .5; f.v.z *= .5; f.m.position.y = -.05; }
        if (f.t > 2.2) { f.m.scale.multiplyScalar(.85); if (f.t > 2.8) { f.m.removeFromParent(); flying.splice(i, 1); } }
      }
    },
    clear() { while (glasses.length) stack.remove(glasses.pop().m); deco.removeFromParent(); },
  };
  return api;
}
