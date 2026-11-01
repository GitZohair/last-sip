import * as THREE from 'three';
import { planks } from './assets.js';
import { zone } from './roomkit.js';

// The outside of the stilt house: sea, sky, stilts, and the plank walks between rooms (no railings).
const SEA_Y = -1.7, TOP = .02;
const wood = new THREE.MeshStandardMaterial({ map: planks('#c99a62', '#a87946', 2), roughness: .8 });
const post = new THREE.MeshStandardMaterial({ color: '#6e4b2f', roughness: .9 });
const postGeo = new THREE.CylinderGeometry(.09, .11, 1, 10);

function addPost(scene, x, z, top = 0) { const p = new THREE.Mesh(postGeo, post); p.scale.y = top - SEA_Y + 1.2; p.position.set(x, (top + SEA_Y - 1.2) / 2, z); p.castShadow = true; scene.add(p); }

// One plank segment: an axis-aligned walkable box (collider top at floor level).
function plank(ctx, x0, x1, z0, z1) {
  const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, .14, d), wood); m.position.set(cx, TOP - .07, cz); m.castShadow = m.receiveShadow = true; ctx.scene.add(m);
  ctx.shell.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, top: TOP });
  for (const [px, pz] of [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx - w / 2, cz + d / 2], [cx + w / 2, cz + d / 2]]) addPost(ctx.scene, px, pz);
}

const W = 1.3; // plank width: wide enough to walk, narrow enough that a gust matters
export function plankWalk(ctx, z0, kind, startX) {
  let len, exitX;
  if (kind === 'hop') { // two planks with a gap you must hop (glass sloshes on landing)
    len = 8; exitX = -.4;
    plank(ctx, startX - W / 2, startX + W / 2, z0, z0 - 3.3);
    plank(ctx, startX - W / 2, startX + W / 2, z0 - 4.3, z0 - 5.4);
    plank(ctx, Math.min(startX, exitX) - W / 2, Math.max(startX, exitX) + W / 2, z0 - 5.4, z0 - 6.7);
    plank(ctx, exitX - W / 2, exitX + W / 2, z0 - 6.7, z0 - len);
  } else { // zigzag: three narrow legs, two blind corners
    len = 9; exitX = startX + 3;
    plank(ctx, startX - W / 2, startX + W / 2, z0, z0 - 3);
    plank(ctx, startX - W / 2, exitX + W / 2, z0 - 3, z0 - 3 - W);
    plank(ctx, exitX - W / 2, exitX + W / 2, z0 - 3 - W, z0 - len);
  }
  return { key: 'outside', name: 'THE PLANKS', z0, z1: z0 - len, len, exitX, hazards: [zone(0, z0 - len / 2, 30, len, { pit: true, label: '' })] };
}

export function buildSea(scene, rooms, length) {
  const sky = new THREE.Color('#bfe6ee'); scene.background = sky; scene.fog.color = sky; scene.fog.near = 25; scene.fog.far = 90;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, length + 160, 60, 60), new THREE.MeshStandardMaterial({ color: '#4fc6c2', roughness: .15, metalness: .1, flatShading: true }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, SEA_Y, -length / 2); sea.receiveShadow = true; scene.add(sea);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(9, 14, 2, 24), new THREE.MeshStandardMaterial({ color: '#f1dcae', roughness: 1 }));
  sand.position.set(-26, SEA_Y - .6, -length * .5); scene.add(sand);
  const s2 = sand.clone(); s2.position.set(30, SEA_Y - .8, -length * .2); s2.scale.setScalar(.7); scene.add(s2);
  for (const a of rooms) { // a slab under each room + stilts, so the house reads as raised
    const slab = new THREE.Mesh(new THREE.BoxGeometry(a.w + .4, .5, a.len), post); slab.position.set(0, -.26, (a.z0 + a.z1) / 2); slab.castShadow = true; scene.add(slab);
    for (const sx of [-1, 1]) for (let zz = a.z0 - .5; zz > a.z1; zz -= 4) addPost(scene, sx * (a.w / 2), zz, -.5);
  }
  const pos = sea.geometry.attributes.position, base = Float32Array.from(pos.array);
  sea.userData.update = t => { for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 1.2 + base[i * 3] * .25) * .12 + Math.cos(t * .9 + base[i * 3 + 1] * .3) * .1; pos.needsUpdate = true; };
  scene.userData.sea = sea;
}
