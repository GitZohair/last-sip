import * as THREE from 'three';

// The island's resident menace. Hits are reported as {kind, dir:{x,z}, power}.
// THE BEACH BOT: a robot beach-cleaner that hunts you along your own breadcrumb trail (no navmesh needed:
// your trail is always walkable). Starts slow, accelerates. Eats puddles. Contact = big shove + slosh.
function vacuum(scene, spawn) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.36, .38, .14, 40), new THREE.MeshStandardMaterial({ color: '#1f2129', roughness: .25, metalness: .4 }));
  shell.position.y = .09; shell.castShadow = true; g.add(shell);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .02, 40), new THREE.MeshStandardMaterial({ color: '#3a3d48', roughness: .15, metalness: .6 })); top.position.y = .17; g.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.37, .018, 10, 48), new THREE.MeshStandardMaterial({ color: '#ff3b5c', emissive: '#ff1e46', emissiveIntensity: 1.6 })); ring.rotation.x = Math.PI / 2; ring.position.y = .12; g.add(ring);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ff2d55', emissiveIntensity: 3 })); eye.position.set(0, .19, -.22); g.add(eye);
  const brush = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .02, 3), new THREE.MeshStandardMaterial({ color: '#888' })); brush.position.set(.25, .02, -.25); g.add(brush);
  g.position.set(spawn.x, 0, spawn.z + 1); scene.add(g);
  const trail = []; let speed = 0, wake = 6, cool = 0, stun = 0;
  return {
    kind: 'vacuum', label: 'THE VACUUM', mesh: g,
    distance: 99,
    stun(s) { stun = s; speed = Math.max(0, speed - 1); ring.material.color.set('#5ab8ff'); ring.material.emissive.set('#2a8cff'); },
    get stunned() { return stun > 0; },
    update(t, player, dt, chaos) {
      const last = trail.at(-1);
      if (!last || Math.hypot(last.x - player.pos.x, last.z - player.pos.z) > .35) trail.push({ x: player.pos.x, z: player.pos.z });
      brush.rotation.y += dt * 30; cool -= dt;
      if (t < (this.hungry ? 3 : wake)) { this.distance = 99; return null; }
      if (stun > 0) { stun -= dt; g.rotation.y += dt * 14; if (stun <= 0) { ring.material.color.set('#ff3b5c'); ring.material.emissive.set('#ff1e46'); } this.distance = Math.hypot(player.pos.x - g.position.x, player.pos.z - g.position.z); return null; }
      speed = Math.min(4.6, 2.2 + Math.max(0, t - wake) * .07) * (this.hungry ? 1.25 : 1);
      let move = speed * dt;
      while (move > 0 && trail.length) {
        const p = trail[0], dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
        if (d <= move) { g.position.x = p.x; g.position.z = p.z; trail.shift(); move -= d; }
        else { g.position.x += dx / d * move; g.position.z += dz / d * move; g.rotation.y = Math.atan2(-dx, -dz); move = 0; }
      }
      chaos?.eatPuddle?.(g.position.x, g.position.z);
      const dx = player.pos.x - g.position.x, dz = player.pos.z - g.position.z, d = Math.hypot(dx, dz);
      this.distance = d;
      ring.material.emissiveIntensity = 1 + Math.max(0, 3 - d) * 1.2 + Math.sin(t * 12) * .4;
      if (d < .7 && cool <= 0 && player.y < .3) { cool = 1.4; trail.length = 0; return { kind: 'vacuum', dir: { x: dx / (d || 1), z: dz / (d || 1) }, power: 8 }; }
      return null;
    },
  };
}

export async function createHazards(scene, level, r, spawn) {
  const vac = vacuum(scene, spawn);
  vac.label = 'THE BEACH BOT';
  const lock = { kind: 'none', near: false, open: true, charge: 0, x: 0, z: 0 };
  return {
    list: [vac], vacuum: vac, lock, mate: null,
    update(t, player, dt, chaos) { const hit = vac.update(t, player, dt, chaos); return hit ? [{ ...hit, label: vac.label }] : []; },
    doorWarning: () => false,
  };
}
