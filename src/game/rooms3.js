import * as THREE from 'three';
import { checker } from './assets.js';
import { zone } from './roomkit.js';

// THE FLOODED BASEMENT: the middle of the room is water. Hop across floating furniture.
// Soggy boxes sink a moment after you land, sofas drift, everything bobs. Fall in = splash, lose water,
// respawn at the ledge. This is the "you can fall off" room.
const TOP = .05;
const KINDS = [
  { name: 'tableCoffee', type: 'still' }, { name: 'bedSingle', type: 'still' },
  { name: 'cardboardBoxClosed', type: 'sink', scale: 1.7 }, { name: 'loungeSofa', type: 'drift' }, { name: 'cardboardBoxOpen', type: 'sink', scale: 1.7 },
];

function floater(ctx, k, x, z, rot, r) {
  const col = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, top: TOP }; ctx.shell.colliders.push(col);
  const p = { col, x, z, y: 0, sinkT: 0, downT: 0, type: k.type, phase: r.range(0, 6), amp: r.range(.8, 1.6), m: null, hw: .5, hd: .5 };
  ctx.place('furniture', k.name, x, z, rot, false).then(m => {
    if (k.scale) m.scale.setScalar(k.scale);
    const b = new THREE.Box3().setFromObject(m); p.hw = (b.max.x - b.min.x) / 2; p.hd = (b.max.z - b.min.z) / 2;
    p.off = TOP - b.max.y; m.position.y = p.off; p.m = m;
  });
  return p;
}

export const FLOODED = {
  flooded(ctx, z0, r) {
    const w = 10, len = 15, ledge = 2.6, zc = z0 - len / 2, tile = checker('#5d6b7a', '#4e5b69', 4);
    ctx.shell.floor(0, z0 - ledge / 2, w, ledge, tile); ctx.shell.floor(0, z0 - len + ledge / 2, w, ledge, tile);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(w, len - ledge * 2, 24, 24), new THREE.MeshStandardMaterial({ color: '#2f9fd0', roughness: .08, metalness: .2, transparent: true, opacity: .85 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -.35, zc); ctx.scene.add(water);
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshStandardMaterial({ color: '#163a4f' })); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -2, zc); ctx.scene.add(bed);
    // rows of floaters ~2 m apart (gaps need a hop); at least one per row is always within reach
    const floats = []; const rows = Math.floor((len - ledge * 2) / 1.9);
    let lastX = 0;
    for (let i = 0; i < rows; i++) {
      const z = z0 - ledge - 1 - i * 1.9, x = THREE.MathUtils.clamp(lastX + r.range(-2.2, 2.2), -3.2, 3.2);
      floats.push(floater(ctx, KINDS[Math.floor(r() * KINDS.length)], x, z, r() > .5 ? 0 : Math.PI / 2, r));
      if (r() > .35) { const x2 = x > 0 ? x - r.range(2.6, 3.6) : x + r.range(2.6, 3.6); floats.push(floater(ctx, KINDS[Math.floor(r() * KINDS.length)], x2, z + r.range(-.4, .4), 0, r)); }
      lastX = x;
    }
    const pit = zone(0, zc, w, len - ledge * 2, { pit: true, label: '' });
    const pos = water.geometry.attributes.position;
    pit.update = (t, player) => {
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(t * 1.6 + pos.getX(i) * .9 + pos.getY(i) * .7) * .05);
      pos.needsUpdate = true;
      for (const p of floats) {
        if (!p.m) continue;
        const x = p.type === 'drift' ? p.x + Math.sin(t * .7 + p.phase) * p.amp : p.x;
        const on = player && player.grounded && Math.abs(player.pos.x - x) < p.hw + .2 && Math.abs(player.pos.z - p.z) < p.hd + .2 && player.y > -.3;
        if (p.type === 'sink') {
          if (on && p.downT <= 0) p.sinkT += 1 / 120; else if (p.downT <= 0) p.sinkT = Math.max(0, p.sinkT - 1 / 240);
          if (p.sinkT > .7) { p.downT = 3; p.sinkT = 0; }
          if (p.downT > 0) p.downT -= 1 / 120;
        }
        const sunk = p.downT > 0 ? Math.min(1, (3 - p.downT) * 1.5) * Math.min(1, p.downT * 1.5) : 0;
        const wobble = p.type === 'sink' && p.sinkT > 0 ? Math.sin(t * 40) * .03 : 0;
        p.y = Math.sin(t * 2 + p.phase) * .04 - sunk * 1.2 - p.sinkT * .15;
        p.m.position.set(x + wobble, p.off + p.y, p.z);
        Object.assign(p.col, { minX: x - p.hw, maxX: x + p.hw, minZ: p.z - p.hd, maxZ: p.z + p.hd, top: TOP + p.y });
        p.col.disabled = sunk > .5;
      }
    };
    return { name: 'THE FLOODED BASEMENT', len, w, slots: [], hazards: [pit], respawn: { x: 0, z: z0 - 1.2 } };
  },
};
