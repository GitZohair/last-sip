import * as THREE from 'three';
import { model } from './assets.js';
import { makeShell } from './shell.js';
import { ROOMS } from './rooms.js';
import { rng } from './rng.js';

const WALLS = { kitchen: '#f2d7b6', hallway: '#e9c4c8', living: '#c9dcc8', laundry: '#cfd8ea', bathroom: '#bfe0e6', bedroom: '#e8d6f0', stream: '#43345e' };

// Daily house: kitchen first, stream desk last, middle rooms + door positions shuffled by the seed.
export async function buildLevel(scene, seed) {
  const r = rng(seed);
  const shell = makeShell(scene);
  const pending = [];
  const ctx = {
    scene, shell,
    place(kit, name, x, z, rot = 0, solid = true) {
      const p = model(kit, name).then(m => { m.position.set(x, 0, z); m.rotation.y = rot; scene.add(m); if (solid) shell.fromObject(m); return m; });
      pending.push(p); return p;
    },
  };
  const order = ['kitchen', ...r.shuffle(['hallway', 'living', 'laundry', 'bathroom', 'bedroom']).slice(0, 3), 'stream'];
  const rooms = [], doors = []; let z = 0;
  for (const key of order) {
    const room = ROOMS[key](ctx, z, r);
    Object.assign(room, { key, z0: z, z1: z - room.len });
    rooms.push(room); z -= room.len;
  }
  for (let i = 0; i < rooms.length; i++) {
    const a = rooms[i], b = rooms[i + 1], col = WALLS[a.key];
    shell.sideWall(-a.w / 2 - .1, a.z0, a.z1, col); shell.sideWall(a.w / 2 + .1, a.z0, a.z1, col);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(a.w + .4, a.len), new THREE.MeshStandardMaterial({ color: a.key === 'stream' ? '#2a2140' : '#f6efe6', roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.8, (a.z0 + a.z1) / 2); scene.add(ceil);
    if (i === 0) shell.crossWall(a.z0, -a.w / 2 - .2, a.w / 2 + .2, col);
    const span = Math.max(a.w, b?.w ?? a.w) / 2 + .2, narrow = Math.min(a.w, b?.w ?? a.w) / 2;
    const doorX = b ? r.range(-narrow + 1.1, narrow - 1.1) : null;
    shell.crossWall(a.z1, -span, span, col, doorX);
    if (b) doors.push({ x: doorX, z: a.z1, from: a.key, to: b.key });
  }
  await Promise.all(pending);
  return {
    rooms, doors, colliders: shell.colliders,
    hazards: rooms.flatMap(x => x.hazards), slots: rooms.flatMap(x => x.slots),
    finish: rooms.at(-1).finish, spawn: { x: 0, z: -3.4, yaw: 0 }, length: -z,
    roomAt: zz => rooms.find(x => zz <= x.z0 && zz > x.z1) || rooms.at(-1),
  };
}
