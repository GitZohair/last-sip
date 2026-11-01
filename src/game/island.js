import * as THREE from 'three';
import { model } from './assets.js';
import { buildSea } from './outside.js';

// THE ISLAND: one fixed open map (Kenney Pirate Kit, CC0). A boardwalk spine runs from the beach bar to
// your stream hut; side branches lead to six ingredient islets. Off the boards is open sea: fall = splash.
export const PADS = {
  start: [0, 0], coconut: [-14, -16], lemon: [14, -16], plaza: [0, -32],
  pineapple: [-14, -48], strawberry: [14, -48], honey: [-14, -64], watermelon: [14, -64], hut: [0, -80],
};
// boardwalk runs: [x0, z0, x1, z1] along one axis; gaps are deliberate (hop them)
const RUNS = [[0, -4, 0, -19], [0, -21, 0, -27.5], [-1, -16, -9, -16], [1, -16, 9, -16],
  [0, -36.5, 0, -54], [0, -56.4, 0, -75.5], [-1, -48, -9, -48], [1, -48, 9, -48], [-1, -64, -9, -64], [1, -64, 6, -64], [7.4, -64, 9, -64]];
export const TOWERS = [[8, -26], [-8, -40], [8, -58], [-7, -73]];
const ZONES = [['beach', 'THE BEACH', 6, -24], ['plaza', 'THE PLAZA', -24, -40], ['reef', 'THE REEF', -40, -72], ['hut', 'THE STREAM HUT', -72, -90]];

export async function buildIsland(scene) {
  const colliders = [], jobs = [];
  const put = (kit, name, x, y, z, rot = 0, s = 1) => { const p = model(kit, name).then(m => { m.scale.multiplyScalar(s); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m); return m; }); jobs.push(p); return p; };
  for (const [key, [x, z]] of Object.entries(PADS)) {
    const big = key === 'start' || key === 'plaza' || key === 'hut', s = big ? 1.7 : 1.25;
    put('pirate', key === 'plaza' ? 'patch-sand' : 'patch-sand-foliage', x, -.25 * s, z, (x + z) % 3, s);
    colliders.push({ minX: x - 3.2 * s, maxX: x + 3.2 * s, minZ: z - 2.5 * s, maxZ: z + 2.5 * s, top: 0 });
  }
  for (const [x0, z0, x1, z1] of RUNS) { // dock tiles, top flush with y = 0
    const alongZ = x0 === x1, len = Math.abs(alongZ ? z1 - z0 : x1 - x0), n = Math.max(1, Math.round(len / 2.5));
    for (let i = 0; i < n; i++) {
      const k = (i + .5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      put('pirate', 'structure-platform-dock-small', x, -1.31, z, alongZ ? 0 : Math.PI / 2);
    }
    const hw = .95;
    colliders.push(alongZ ? { minX: x0 - hw, maxX: x0 + hw, minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1), top: 0 } : { minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: z0 - hw, maxZ: z0 + hw, top: 0 });
  }
  const towers = TOWERS.map(([x, z]) => { put('pirate', 'rocks-sand-b', x, -1.6, z, x); put('pirate', 'tower-watch', x, .2, z, Math.atan2(-x, 0)); return { x, z, y: 3.1 }; });
  // scenery: palms, rocks, boats, a wreck (all Kenney)
  const palms = [['palm-bend', -4, 3, 1], ['palm-detailed-straight', 4.5, 2, 1.1], ['palm-detailed-bend', -16.5, -14, .9], ['palm-bend', 16.5, -18, .9], ['palm-detailed-straight', -4.5, -29, 1.2], ['palm-bend', 4.5, -35, 1],
    ['palm-detailed-bend', -16, -50, .9], ['palm-straight', 16.5, -46, .9], ['palm-bend', -16, -62, .9], ['palm-detailed-straight', 16, -66, .9], ['palm-detailed-bend', 5, -83, 1.1], ['palm-bend', -5, -77, 1]];
  for (const [n, x, z, s] of palms) put('pirate', n, x, 0, z, x * 1.7, s);
  for (const [x, z, r] of [[-22, -30, 0], [24, -36, 1], [-24, -70, 2], [22, -80, 3], [9, 6, 1]]) put('pirate', r % 2 ? 'rocks-sand-a' : 'rocks-sand-c', x, -1.5, z, r);
  put('pirate', 'ship-wreck', -30, -2.2, -52, .6); put('pirate', 'boat-row-small', 6, -1.55, -8, 1.2); put('pirate', 'boat-row-large', -7, -1.55, -70, -.4);
  // the stream hut: a Kenney pirate structure with your desk, screen and a purple LIVE glow
  put('pirate', 'structure', 0, 0, -84, 0, 1.7); put('pirate', 'structure-roof', 0, 3.6, -84, 0, 1.7);
  put('furniture', 'desk', 0, 0, -84.6); put('furniture', 'computerScreen', 0, .76, -84.8); put('furniture', 'chairDesk', 0, 0, -83.4, Math.PI);
  put('pirate', 'flag-high-pennant', 3.2, 0, -82, 0, .9);
  const live = new THREE.PointLight('#a970ff', 8, 9); live.position.set(0, 2.4, -83); scene.add(live);
  colliders.push({ minX: -1.2, maxX: 1.2, minZ: -85.2, maxZ: -84.1, top: .78 });
  const length = 90;
  buildSea(scene, [], length);
  await Promise.all(jobs);
  const rooms = ZONES.map(([key, name, z0, z1]) => ({ key, name, z0, z1, w: 40, len: z0 - z1, hazards: [], slots: [] }));
  return {
    rooms, doors: [], walks: [], colliders, hazards: [], slots: [], towers, ground: -12, open: true,
    finish: { x: 0, z: -81.5, r: 1 }, spawn: { x: 0, z: 1.5, yaw: 0 }, length,
    roomAt: zz => rooms.find(x => zz <= x.z0 && zz > x.z1) || rooms.at(-1),
  };
}
