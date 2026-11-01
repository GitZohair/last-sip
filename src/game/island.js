import * as THREE from 'three';
import { model } from './assets.js';
import { buildSea, SEA_Y } from './outside.js';
import { bake } from './bake.js';

// THE ISLAND: one fixed open map (Kenney Pirate Kit, CC0). A boardwalk spine runs from the beach bar to
// your stream hut; side branches lead to six ingredient islets. Off the boards is open sea: fall = splash.
export const PADS = {
  start: [0, 0], coconut: [-14, -16], lemon: [14, -16], plaza: [0, -32],
  pineapple: [-14, -48], strawberry: [14, -48], honey: [-14, -64], watermelon: [14, -64], hut: [0, -80],
};
// THE CASTAWAY ISLET: too far to swim. A rowboat ferries you from the plaza dock and waits where you leave it.
export const ISLE = { x: 32, z: -30, r: 4 }, BOAT = { dock: { x: 11.8, z: -32, land: { x: 9.2, z: -32 }, yaw: Math.PI / 2 }, isle: { x: 26.4, z: -30.6, land: { x: 29.6, z: -30.4 }, yaw: -Math.PI / 2 } };
// boardwalk runs: [x0, z0, x1, z1] along one axis; gaps are deliberate (hop them)
const RUNS = [[0, -4, 0, -19], [0, -21, 0, -27.5], [-1, -16, -9, -16], [1, -16, 9, -16],
  [0, -36.5, 0, -54], [0, -56.4, 0, -75.5], [-1, -48, -9, -48], [1, -48, 9, -48], [-1, -64, -9, -64], [1, -64, 6, -64], [7.4, -64, 9, -64], [5.2, -32, 10.2, -32]]; // last one: the boat dock
export const TOWERS = [[8, -26], [-8, -40], [8, -58], [-7, -73]];
const ZONES = [['beach', 'THE BEACH', 6, -24], ['plaza', 'THE PLAZA', -24, -40], ['reef', 'THE REEF', -40, -72], ['hut', 'THE STREAM HUT', -72, -90]];

const slatGeo = new THREE.BoxGeometry(1.25, .1, .42), rampMat = new THREE.MeshLambertMaterial({ color: '#b07a4a' });
// ISLET BASES: the Kenney sand patch is a thin slab, so on its own it hovers over the sea. Each islet gets a
// low-poly sand mound under it (UVs pinned to one sand texel of the patch's own colormap, so the colour matches
// exactly and it merges into the same draw call) plus a foam ring at the waterline.
const moundGeo = new THREE.CylinderGeometry(1, 1.3, 1, 12, 1, true).translate(0, -.5, 0);
const foamGeo = new THREE.RingGeometry(1, 1.14, 28).rotateX(-Math.PI / 2), foamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, depthWrite: false });
function mound(patch, s, statics) {
  let mesh = null; patch.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return;
  const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv; let u = .5, v = .5;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > .04 && y < .2) { u = uv.getX(i); v = uv.getY(i); break; } } // a vertex on the slab's side
  const g = moundGeo.clone(), a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, u, v);
  const top = patch.position.y + .08 * s, bottom = SEA_Y - 1.6, m = new THREE.Mesh(g, mesh.material);
  m.position.set(patch.position.x, top, patch.position.z); m.rotation.y = patch.rotation.y; m.scale.set(3.45 * s, top - bottom, 2.65 * s); m.receiveShadow = true; statics.add(m);
  const f = new THREE.Mesh(foamGeo, foamMat); f.position.set(patch.position.x, SEA_Y + .16, patch.position.z); f.rotation.y = patch.rotation.y; f.scale.set(3.75 * s, 1, 2.95 * s); f.renderOrder = 1; statics.add(f);
}
const postGeo = new THREE.CylinderGeometry(.09, .11, 2.4, 10), postMat = new THREE.MeshLambertMaterial({ color: '#7a5233' });

export async function buildIsland(scene) {
  const colliders = [], exits = [], jobs = [], statics = new THREE.Group(); scene.add(statics); // everything static is merged at the end
  const put = (kit, name, x, y, z, rot = 0, s = 1) => { const p = model(kit, name).then(m => { m.scale.multiplyScalar(s); m.position.set(x, y, z); m.rotation.y = rot; statics.add(m); return m; }); jobs.push(p); return p; };
  for (const [key, [x, z]] of Object.entries(PADS)) {
    const big = key === 'start' || key === 'plaza' || key === 'hut', s = big ? 1.7 : 1.25;
    put('pirate', key === 'plaza' ? 'patch-sand' : 'patch-sand-foliage', x, -.25 * s, z, Math.abs(Math.round(x + z)) % 2 ? Math.PI : 0, s).then(m => mound(m, s, statics)); // 0 or 180 deg only: the collider is axis-aligned
    colliders.push({ minX: x - 3.2 * s, maxX: x + 3.2 * s, minZ: z - 2.5 * s, maxZ: z + 2.5 * s, top: 0, beach: true }); // beaches: swim up anywhere
  }
  for (const [x0, z0, x1, z1] of RUNS) { // dock tiles, top flush with y = 0
    const alongZ = x0 === x1, len = Math.abs(alongZ ? z1 - z0 : x1 - x0), n = Math.max(1, Math.round(len / 2.5));
    for (let i = 0; i < n; i++) {
      const k = (i + .5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      put('pirate', 'platform', x, -.23, z, alongZ ? 0 : Math.PI / 2).then(m => { m.scale.x *= .76; });
      if (i % 2 === 0) for (const side of [-1, 1]) { const p = new THREE.Mesh(postGeo, postMat); p.position.set(alongZ ? x + side * .9 : x, -1.1, alongZ ? z : z + side * .9); p.castShadow = true; statics.add(p); } // posts into the sea
    }
    // swim-up ramps every ~9 m, alternating sides: a sloped plank from the water to the board edge
    // a short staircase of slats stepping DOWN and AWAY from the board edge into the water. Skipped near
    // junctions and islets so a ramp never pokes into another walkway.
    for (let d = 3; d < len - 1.5; d += 9) {
      const k = d / len, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, side = (exits.length % 2 ? 1 : -1);
      const ox = alongZ ? side : 0, oz = alongZ ? 0 : side; // outward from the board
      const ex = x + ox * 3.1, ez = z + oz * 3.1;
      const clash = RUNS.some(([a0, b0, a1, b1]) => { if (a0 === x0 && b0 === z0 && a1 === x1 && b1 === z1) return false; const nx = Math.max(Math.min(a0, a1) - 1, Math.min(ex, Math.max(a0, a1) + 1)), nz = Math.max(Math.min(b0, b1) - 1, Math.min(ez, Math.max(b0, b1) + 1)); return Math.hypot(ex - nx, ez - nz) < 2.2; })
        || Object.values(PADS).some(([px, pz]) => Math.hypot(ex - px, ez - pz) < 6.5) || TOWERS.some(([tx, tz]) => Math.hypot(ex - tx, ez - tz) < 4);
      if (clash) continue;
      for (let s = 0; s < 5; s++) { const o = 1.2 + s * .42, sl = new THREE.Mesh(slatGeo, rampMat); sl.position.set(x + ox * o, -.12 - s * .36, z + oz * o); if (alongZ) sl.rotation.y = Math.PI / 2; sl.castShadow = true; statics.add(sl); }
      for (const w of [-.6, .6]) { const p = new THREE.Mesh(postGeo, postMat); p.scale.y = .7; p.position.set(x + ox * 2.6 + (alongZ ? 0 : w), -1, z + oz * 2.6 + (alongZ ? w : 0)); statics.add(p); }
      exits.push({ x: ex, z: ez, to: { x: x + ox * .5, z: z + oz * .5 } });
    }
    const hw = .95;
    colliders.push(alongZ ? { minX: x0 - hw, maxX: x0 + hw, minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1), top: 0 } : { minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: z0 - hw, maxZ: z0 + hw, top: 0 });
  }
  // the castaway islet + its rowboat (the boat moves, so it stays out of the baked statics)
  put('pirate', 'patch-sand-foliage', ISLE.x, -.35, ISLE.z, 0, 1.4).then(m => mound(m, 1.4, statics)); put('pirate', 'palm-detailed-bend', ISLE.x + 2, 0, ISLE.z - 1.5, 2, 1);
  colliders.push({ minX: ISLE.x - 4.4, maxX: ISLE.x + 4.4, minZ: ISLE.z - 3.4, maxZ: ISLE.z + 3.4, top: 0, beach: true });
  const boat = await model('pirate', 'boat-row-small'); boat.position.set(BOAT.dock.x, -1.55, BOAT.dock.z); boat.rotation.y = BOAT.dock.yaw; scene.add(boat);
  const towers = TOWERS.map(([x, z]) => { put('pirate', 'rocks-sand-b', x, -1.6, z, x); put('pirate', 'tower-watch', x, .2, z, Math.atan2(-x, 0)); return { x, z, y: 3.1 }; });
  // scenery: palms, rocks, boats, a wreck (all Kenney)
  const palms = [['palm-bend', -4, 3, 1], ['palm-detailed-straight', 4.5, 2, 1.1], ['palm-detailed-bend', -16.5, -14, .9], ['palm-bend', 16.5, -18, .9], ['palm-detailed-straight', -4.5, -29, 1.2], ['palm-bend', 4.5, -35, 1],
    ['palm-detailed-bend', -16, -50, .9], ['palm-straight', 16.5, -46, .9], ['palm-bend', -16, -62, .9], ['palm-detailed-straight', 16, -66, .9], ['palm-detailed-bend', 5, -83, 1.1], ['palm-bend', -5, -77, 1]];
  for (const [n, x, z, s] of palms) put('pirate', n, x, 0, z, x * 1.7, s);
  for (const [x, z, r] of [[-22, -30, 0], [24, -44, 1], [-24, -70, 2], [22, -80, 3], [9, 6, 1]]) put('pirate', r % 2 ? 'rocks-sand-a' : 'rocks-sand-c', x, -1.5, z, r);
  put('pirate', 'ship-wreck', -30, -2.2, -52, .6); put('pirate', 'boat-row-large', -7, -1.55, -70, -.4);
  // the stream hut: a Kenney pirate structure with your desk, screen and a purple LIVE glow
  put('pirate', 'structure', 0, 0, -84, 0, 1.7); put('pirate', 'structure-roof', 0, 3.6, -84, 0, 1.7);
  put('furniture', 'desk', 0, 0, -84.6); put('furniture', 'computerScreen', 0, .76, -84.8); put('furniture', 'chairDesk', 0, 0, -83.4, Math.PI);
  put('pirate', 'flag-high-pennant', 3.2, 0, -82, 0, .9);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#a970ff', transparent: true, opacity: .35, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, .02, -84); scene.add(glow); // LIVE glow on the hut floor (no point light: lights cost every pixel)
  colliders.push({ minX: -1.2, maxX: 1.2, minZ: -85.2, maxZ: -84.1, top: .78 });
  // poster boards along the boardwalk: chat's !frame emotes and yesterday's MOST WANTED hang here
  const slots = [[-4.2, -9], [4.2, -24], [-4.2, -42], [4.2, -70]].map(([x, z]) => { // out in the water, clear of the path
    const p = new THREE.Mesh(postGeo, postMat); p.scale.y = 1.4; p.position.set(x, -.3, z); p.castShadow = true; statics.add(p);
    return { x, y: 1.85, z, rot: x < 0 ? Math.PI / 2 : -Math.PI / 2 };
  });
  const length = 90;
  buildSea(scene, length);
  await Promise.all(jobs);
  bake(statics);
  const rooms = ZONES.map(([key, name, z0, z1]) => ({ key, name, z0, z1, w: 40, len: z0 - z1, hazards: [], slots: [] }));
  return {
    rooms, doors: [], walks: [], colliders, exits, boat: { mesh: boat, at: 'dock' }, hazards: [], slots, towers, ground: -12, open: true,
    finish: { x: 0, z: -81.5, r: 1 }, spawn: { x: 0, z: 1.5, yaw: 0 }, length,
    roomAt: zz => rooms.find(x => zz <= x.z0 && zz > x.z1) || rooms.at(-1),
  };
}
