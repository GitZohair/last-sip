import * as THREE from 'three';
import { createGlass } from './glass.js';

// THE TRAY: up to 5 glasses that slosh together on one spring. Same interface as a single glass (state.water,
// state.danger, step, kick, lip, render, tint) so the rest of the run doesn't care. More glasses = more gain
// (wobblier), and the two on the top tier have less rim allowance, so the stack spills from the top first.
const SLOTS = [[0, 0, .13], [-.12, 0, -.07], [.12, 0, -.07], [-.065, 1, .03], [.065, 1, .03]]; // [x, tier, z]
const TIER = .2; // height of the second tier

export function createTray(parent) {
  const g = new THREE.Group(); parent.add(g);
  const wood = new THREE.MeshLambertMaterial({ color: '#c58b3e' }), dark = new THREE.MeshLambertMaterial({ color: '#8a5a26' });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.27, .25, .025, 24), wood); disc.position.y = -.145; g.add(disc);
  const lipRing = new THREE.Mesh(new THREE.TorusGeometry(.265, .012, 6, 28), dark); lipRing.rotation.x = Math.PI / 2; lipRing.position.y = -.13; g.add(lipRing);
  const board = new THREE.Mesh(new THREE.BoxGeometry(.3, .016, .16), wood); board.position.set(0, -.145 + TIER, .03); board.visible = false; g.add(board);
  const glasses = []; // { gl, id, color, salt }
  const spring = { tx: 0, tz: 0, vx: 0, vz: 0 };
  const state = {
    get water() { return glasses.length ? glasses.reduce((a, x) => a + x.gl.state.water, 0) / glasses.length : 0; },
    set water(v) { for (const x of glasses) x.gl.state.water = Math.max(0, Math.min(1, v)); },
    get tx() { return spring.tx; }, set tx(v) { spring.tx = v; }, get tz() { return spring.tz; }, set tz(v) { spring.tz = v; },
    get vx() { return spring.vx; }, set vx(v) { spring.vx = v; }, get vz() { return spring.vz; }, set vz(v) { spring.vz = v; },
    danger: 0, scale: 1,
  };
  function place() {
    glasses.forEach((x, i) => { const [sx, tier, sz] = SLOTS[i]; x.gl.group.position.set(sx, tier * TIER, sz); });
    board.visible = glasses.length > 3;
  }
  const api = {
    state, group: g, glasses,
    get count() { return glasses.length; },
    add(id, color) { // one fresh, full glass for a customer
      if (glasses.length >= SLOTS.length) return false;
      const gl = createGlass(g); gl.group.scale.setScalar(.75); gl.state.water = 1; gl.tint(new THREE.Color(color));
      glasses.push({ gl, id, color: new THREE.Color(color), salt: 0 }); place(); return true;
    },
    take(id) { // hand a glass over: returns { water, salt } or null
      const i = glasses.findIndex(x => x.id === id); if (i < 0) return null;
      const [x] = glasses.splice(i, 1); g.remove(x.gl.group); place(); return { water: x.gl.state.water, salt: x.salt };
    },
    drop(id) { const x = api.take(id); return !!x; }, // customer walked out: their glass goes too
    refill(f) { for (const x of glasses) x.gl.state.water = Math.min(1, x.gl.state.water + f); },
    salt(k) { const sea = new THREE.Color('#5d8f7c'); for (const x of glasses) { x.salt = Math.min(1, x.salt + k); x.gl.tint(x.color.clone().lerp(sea, Math.min(.85, x.salt))); } },
    step(dt, { ax = 0, az = 0, turn = 0, steady = false, calm = false, wobble = 0, gain = 1, noSpill = false }) {
      const n = Math.max(1, glasses.length), stack = 1 + (n - 1) * .3; // the stack gets sillier with every glass
      const k = steady || calm ? 24 : 12, c = steady ? 7 : calm ? 9 : 2.4, a = (steady ? .03 : .055) * gain * stack;
      const s = spring;
      s.vx += (-k * s.tx - c * s.vx - ax * a + turn * .8 * stack + (Math.random() - .5) * wobble * stack) * dt;
      s.vz += (-k * s.tz - c * s.vz - az * a + (Math.random() - .5) * wobble * stack) * dt;
      s.tx += s.vx * dt; s.tz += s.vz * dt;
      const tilt = Math.hypot(s.tx, s.tz); let lost = 0, danger = 0;
      glasses.forEach((x, i) => {
        const w = x.gl.state.water, allow = (.26 + (1 - w) * .45) * (SLOTS[i][1] ? .8 : 1);
        danger = Math.max(danger, w > .01 ? tilt / allow : 0);
        const l = noSpill ? 0 : Math.min(w, Math.max(0, tilt - allow) * .75 * dt); x.gl.state.water -= l; lost += l;
        x.gl.state.tx = s.tx; x.gl.state.tz = s.tz; x.gl.state.danger = Math.min(1, tilt / allow);
      });
      state.danger = Math.min(1, danger); return lost;
    },
    kick(x, z) { spring.vx += x; spring.vz += z; },
    lip(out) { // the most endangered glass's low rim
      let best = glasses[0]; for (const x of glasses) if (x.gl.state.danger > best.gl.state.danger) best = x;
      return best ? best.gl.lip(out) : g.localToWorld(out.set(0, 0, 0));
    },
    tint() {}, // per-glass colours are set on add()/salt()
    render(t, scale = 1) {
      g.scale.setScalar(scale);
      g.rotation.z = THREE.MathUtils.clamp(-spring.tx * .35, -.35, .35); g.rotation.x = THREE.MathUtils.clamp(spring.tz * .35, -.35, .35);
      for (const x of glasses) x.gl.render(t, .75);
    },
    clear() { while (glasses.length) g.remove(glasses.pop().gl.group); place(); },
  };
  return api;
}
