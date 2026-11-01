import * as THREE from 'three';

import { model } from './assets.js';

// The island's resident menace. Hits are reported as {kind, dir:{x,z}, power}.
// THE LOOSE CANNON: a runaway pirate cannon on wheels (Kenney Pirate Kit) that rolls after you along your own
// breadcrumb trail (no navmesh needed: your trail is always walkable). Starts slow, accelerates, rocks and puffs
// smoke as it rolls. Contact = big shove + slosh. A SHOUT makes it spin out.
async function vacuum(scene, spawn) {
  const g = new THREE.Group();
  const body = await model('pirate', 'cannon-mobile'); body.scale.setScalar(1.1); g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .035, 8, 40), new THREE.MeshStandardMaterial({ color: '#ff3b5c', emissive: '#ff1e46', emissiveIntensity: 1.6 })); ring.rotation.x = Math.PI / 2; ring.position.y = .05; g.add(ring);
  const puffMat = new THREE.MeshBasicMaterial({ color: '#f2f2f2', transparent: true, opacity: .7, depthWrite: false });
  const puffs = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), puffMat.clone()); m.visible = false; g.add(m); return { m, life: 0 }; });
  let puffT = 0;
  const brush = { rotation: { y: 0 } };
  g.position.set(spawn.x, 0, spawn.z + 2); scene.add(g);
  const trail = []; let speed = 0, wake = 6, cool = 0, stun = 0;
  return {
    kind: 'vacuum', label: 'THE LOOSE CANNON', mesh: g,
    distance: 99,
    stun(s) { stun = s; speed = Math.max(0, speed - 1); ring.material.color.set('#5ab8ff'); ring.material.emissive.set('#2a8cff'); },
    get stunned() { return stun > 0; },
    update(t, player, dt, chaos) {
      const last = trail.at(-1);
      if (player.y > -.3 && (!last || Math.hypot(last.x - player.pos.x, last.z - player.pos.z) > .35)) trail.push({ x: player.pos.x, z: player.pos.z });
      brush.rotation.y += dt * 30; cool -= dt;
      if (t < (this.hungry ? 3 : wake)) { this.distance = 99; return null; }
      if (stun > 0) { stun -= dt; g.rotation.y += dt * 14; if (stun <= 0) { ring.material.color.set('#ff3b5c'); ring.material.emissive.set('#ff1e46'); } this.distance = Math.hypot(player.pos.x - g.position.x, player.pos.z - g.position.z); return null; }
      speed = Math.min(4.6, 2.2 + Math.max(0, t - wake) * .07) * (this.hungry ? 1.25 : 1);
      let move = speed * dt;
      while (move > 0 && trail.length) {
        const p = trail[0], dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
        if (d <= move) { g.position.x = p.x; g.position.z = p.z; trail.shift(); move -= d; }
        else { g.position.x += dx / d * move; g.position.z += dz / d * move; g.rotation.y = Math.atan2(dx, dz); move = 0; } // barrel first (model faces +z)
      }
      body.rotation.z = Math.sin(t * 9) * .08 * Math.min(1, speed / 3); body.position.y = Math.abs(Math.sin(t * 9)) * .05; // rattling over the planks
      if ((puffT -= dt) <= 0) { puffT = .18; const p = puffs.find(q => q.life <= 0); if (p) { p.life = .7; p.m.position.set((Math.random() - .5) * .3, .75, -.5); p.m.visible = true; } }
      for (const p of puffs) if (p.life > 0) { p.life -= dt; p.m.position.y += dt * .8; p.m.scale.setScalar(1 + (.7 - p.life) * 2.5); p.m.material.opacity = Math.max(0, p.life) ; if (p.life <= 0) p.m.visible = false; }
      chaos?.eatPuddle?.(g.position.x, g.position.z);
      const dx = player.pos.x - g.position.x, dz = player.pos.z - g.position.z, d = Math.hypot(dx, dz);
      this.distance = d;
      ring.material.emissiveIntensity = 1 + Math.max(0, 3 - d) * 1.2 + Math.sin(t * 12) * .4;
      if (d < 1.1 && cool <= 0 && player.y < .3 && player.y > -.3) { cool = 1.4; trail.length = 0; return { kind: 'vacuum', dir: { x: dx / (d || 1), z: dz / (d || 1) }, power: 8 }; }
      return null;
    },
  };
}

export async function createHazards(scene, level, r, spawn) {
  const vac = await vacuum(scene, spawn);
  const lock = { kind: 'none', near: false, open: true, charge: 0, x: 0, z: 0 };
  return {
    list: [vac], vacuum: vac, lock, mate: null,
    update(t, player, dt, chaos) { const hit = vac.update(t, player, dt, chaos); return hit ? [{ ...hit, label: vac.label }] : []; },
    doorWarning: () => false,
  };
}
