import * as THREE from 'three';
import { makeShell } from './shell.js';
import { ROOMS } from './rooms.js';
import { rng } from './rng.js';
import { buildSea, plankWalk } from './outside.js';
import { model } from './assets.js';

const WALLS = { kitchen: '#f2d7b6', living: '#c9dcc8', bedroom: '#e8d6f0', stream: '#43345e' };

// THE STILT HOUSE: one fixed level (same layout every day, so it can be mastered like a Wordle grid).
// Rooms sit on stilts over the sea, joined by plank walks with no railings. Only timings, the house rule
// and the code lock change with the daily seed.
const LAYOUT = ['kitchen', 'walk:hop', 'living', 'walk:zigzag', 'bedroom', 'stream'];

export async function buildLevel(scene, seed) {
  const r = rng('stilt-house-v1'); // layout randomness is frozen: the house never changes
  const shell = makeShell(scene);
  const pending = [];
  const ctx = {
    scene, shell,
    place(kit, name, x, z, rot = 0, solid = true) {
      const p = model(kit, name).then(m => { m.position.set(x, 0, z); m.rotation.y = rot; scene.add(m); if (solid) shell.fromObject(m); return m; });
      pending.push(p); return p;
    },
  };
  const rooms = [], doors = [], walks = []; let z = 0, prev = null;
  const DOORS = [1.6, -1.8, 1.2]; // fixed door x for each room exit
  for (const key of LAYOUT) {
    if (key.startsWith('walk:')) { const wk = plankWalk(ctx, z, key.slice(5), prev.doorOut); walks.push(wk); z -= wk.len; prev = wk; continue; }
    const room = ROOMS[key](ctx, z, r);
    Object.assign(room, { key, z0: z, z1: z - room.len, doorIn: prev ? (prev.exitX ?? prev.doorOut) : null, sharedIn: !!prev && !prev.exitX && prev.exitX !== 0 });
    room.doorOut = key === 'stream' ? null : DOORS[rooms.length] ?? 0;
    rooms.push(room); z -= room.len; prev = room;
  }
  for (const a of rooms) {
    const col = WALLS[a.key];
    shell.sideWall(-a.w / 2 - .1, a.z0, a.z1, col); shell.sideWall(a.w / 2 + .1, a.z0, a.z1, col);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(a.w + .4, a.len), new THREE.MeshStandardMaterial({ color: a.key === 'stream' ? '#2a2140' : '#f6efe6', roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.8, (a.z0 + a.z1) / 2); scene.add(ceil);
    if (!a.sharedIn) shell.crossWall(a.z0, -a.w / 2 - .2, a.w / 2 + .2, col, a.doorIn);
    shell.crossWall(a.z1, -a.w / 2 - .2, a.w / 2 + .2, col, a.doorOut);
    if (a.doorOut !== null) doors.push({ x: a.doorOut, z: a.z1, from: a.key });
  }
  const stream = rooms.at(-1);
  buildSea(scene, rooms, -z);
  await Promise.all(pending);
  return {
    rooms, doors, walks, colliders: shell.colliders,
    hazards: [...rooms.flatMap(x => x.hazards), ...walks.flatMap(w => w.hazards)], slots: rooms.flatMap(x => x.slots),
    finish: stream.finish, spawn: { x: 0, z: -3.4, yaw: 0 }, length: -z,
    roomAt: zz => rooms.find(x => zz <= x.z0 && zz > x.z1) || walks.find(w => zz <= w.z0 && zz > w.z1) || rooms.at(-1),
  };
}
