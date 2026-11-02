import * as THREE from 'three';
import { model } from './assets.js';
import { buildSea, SEA_Y } from './outside.js';
import { bake } from './bake.js';

// THE ARENA: one small island you can see all of. The BAR sits in the middle of the plaza (everyone fights over
// it), four tiny customer islets hang off narrow boardwalks. Off the boards is open sea: RING-OUT.
// Deliberately few models (sand patches, dock tiles, two palms, the bar) so it loads fast on a laptop iGPU.
export const PADS = { plaza: [0, 0], north: [0, -12], south: [0, 12], east: [12, 0], west: [-12, 0] };
export const TOWERS = [], ISLE = { x: 999, z: 999, r: 0 }, BOAT = {}; // (kept for older imports)
const RUNS = [[0, -4, 0, -9.6], [0, 4, 0, 9.6], [5.2, 0, 9.4, 0], [-5.2, 0, -9.4, 0]]; // narrow bridges: slam zones

const moundGeo = new THREE.CylinderGeometry(1, 1.3, 1, 12, 1, true).translate(0, -.5, 0);
const foamGeo = new THREE.RingGeometry(1, 1.14, 28).rotateX(-Math.PI / 2), foamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, depthWrite: false });
function mound(patch, s, statics) { // a sand mound under the thin patch + a foam ring, so islets sit IN the sea
  let mesh = null; patch.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return;
  const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv; let u = .5, v = .5;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > .04 && y < .2) { u = uv.getX(i); v = uv.getY(i); break; } }
  const g = moundGeo.clone(), a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, u, v);
  const top = patch.position.y + .08 * s, bottom = SEA_Y - 1.6, m = new THREE.Mesh(g, mesh.material);
  m.position.set(patch.position.x, top, patch.position.z); m.rotation.y = patch.rotation.y; m.scale.set(3.45 * s, top - bottom, 2.65 * s); statics.add(m);
  const f = new THREE.Mesh(foamGeo, foamMat); f.position.set(patch.position.x, SEA_Y + .16, patch.position.z); f.scale.set(3.75 * s, 1, 2.95 * s); f.renderOrder = 1; statics.add(f);
}
const postGeo = new THREE.CylinderGeometry(.09, .11, 2.4, 8), postMat = new THREE.MeshLambertMaterial({ color: '#7a5233' });

export async function buildIsland(scene) {
  const colliders = [], jobs = [], statics = new THREE.Group(); scene.add(statics);
  const put = (kit, name, x, y, z, rot = 0, s = 1) => { const p = model(kit, name).then(m => { m.scale.multiplyScalar(s); m.position.set(x, y, z); m.rotation.y = rot; statics.add(m); return m; }); jobs.push(p); return p; };
  for (const [key, [x, z]] of Object.entries(PADS)) {
    const s = key === 'plaza' ? 1.6 : 1;
    put('pirate', key === 'plaza' ? 'patch-sand' : 'patch-sand-foliage', x, -.25 * s, z, 0, s).then(m => mound(m, s, statics));
    colliders.push({ minX: x - 3.2 * s, maxX: x + 3.2 * s, minZ: z - 2.5 * s, maxZ: z + 2.5 * s, top: 0, beach: true });
  }
  for (const [x0, z0, x1, z1] of RUNS) {
    const alongZ = x0 === x1, len = Math.abs(alongZ ? z1 - z0 : x1 - x0), n = Math.max(1, Math.round(len / 2.2));
    for (let i = 0; i < n; i++) {
      const k = (i + .5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      put('pirate', 'platform', x, -.23, z, alongZ ? 0 : Math.PI / 2).then(m => { m.scale.x *= .7; });
      for (const side of [-1, 1]) { const p = new THREE.Mesh(postGeo, postMat); p.position.set(alongZ ? x + side * .85 : x, -1.1, alongZ ? z : z + side * .85); statics.add(p); }
    }
    const hw = .85;
    colliders.push(alongZ ? { minX: x0 - hw, maxX: x0 + hw, minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1), top: 0 } : { minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: z0 - hw, maxZ: z0 + hw, top: 0 });
  }
  put('pirate', 'palm-detailed-bend', 4.2, 0, -3.2, 1, 1); put('pirate', 'palm-bend', -4.4, 0, 3.4, 4, .9);
  buildSea(scene, 60);
  await Promise.all(jobs);
  bake(statics);
  const rooms = [{ key: 'arena', name: 'THE ARENA', z0: 99, z1: -99, w: 40, len: 60, hazards: [], slots: [] }];
  return {
    rooms, doors: [], walks: [], colliders, exits: [], hazards: [], slots: [], towers: [], boat: null, ground: -12, open: true,
    finish: { x: 0, z: -99, r: 0 }, spawn: { x: 1.8, z: 2.4, yaw: 0 }, length: 60,
    roomAt: () => rooms[0],
  };
}
