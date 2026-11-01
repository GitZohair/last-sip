import * as THREE from 'three';
import { model } from './assets.js';
import { voiceDoor, roommate } from './voicegames.js';

// Timed house hazards that turn walking into dodging. All timing is seeded, so every streamer
// faces the same rhythm on the same day. Each hazard reports hits as {kind, dir:{x,z}, power}.

const wood = new THREE.MeshStandardMaterial({ color: '#b07a4f', roughness: .55 });
const brass = new THREE.MeshStandardMaterial({ color: '#d8b25a', roughness: .3, metalness: .8 });
const cord = new THREE.MeshStandardMaterial({ color: '#2b2633', roughness: .8 });

// SLAMMING DOOR: a hinged door in each doorway. It swings shut for `closed` seconds every `period`.
// While shut it is a wall. While swinging it shoves you. Readable: it creaks open, then slams.
function door(scene, colliders, d, r) {
  const W = 1.7, H = 2.25, period = 3.6 + r() * 1.6, closed = 1.1 + r() * .5, phase = r() * period;
  const pivot = new THREE.Group(); pivot.position.set(d.x - W / 2, 0, d.z); scene.add(pivot);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W, H, .07), wood); panel.position.set(W / 2, H / 2, 0); panel.castShadow = true; pivot.add(panel);
  for (const y of [.55, 1.65]) { const inset = new THREE.Mesh(new THREE.BoxGeometry(W * .7, .7, .09), new THREE.MeshStandardMaterial({ color: '#9c6a43', roughness: .6 })); inset.position.set(W / 2, y, 0); pivot.add(inset); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), brass); knob.position.set(W - .15, 1.05, .07); pivot.add(knob);
  const col = { minX: d.x - W / 2, maxX: d.x + W / 2, minZ: d.z - .1, maxZ: d.z + .1, top: H, disabled: true };
  colliders.push(col);
  let wasShut = false;
  return {
    kind: 'door', label: 'SLAMMING DOOR', x: d.x, z: d.z,
    update(t, player) {
      const k = ((t + phase) % period) / period, shutFrom = 1 - closed / period;
      // open (90 deg) most of the time; swing shut fast at shutFrom, reopen slowly afterwards
      const ang = k < shutFrom - .08 ? Math.PI / 2 : k < shutFrom ? (Math.PI / 2) * (shutFrom - k) / .08 : k > .97 ? (Math.PI / 2) * (k - .97) / .03 : 0;
      pivot.rotation.y = ang;
      const shut = ang < .25; col.disabled = !shut;
      const hit = shut && !wasShut && Math.abs(player.pos.z - d.z) < .7 && Math.abs(player.pos.x - d.x) < W / 2 + .2;
      wasShut = shut;
      return hit ? { kind: 'door', dir: { x: 0, z: Math.sign(player.pos.z - d.z) || 1 }, power: 7 } : null;
    },
    warn: t => { const k = ((t + phase) % period) / period, shutFrom = 1 - closed / period; return k > shutFrom - .25 && k < shutFrom; },
  };
}

// PENDULUM LAMP: a ceiling lamp on a long cord sweeping across the room. The bob knocks you sideways.
async function pendulum(scene, x, z, r, span) {
  const pivot = new THREE.Group(); pivot.position.set(x, 2.8, z); scene.add(pivot);
  const L = 2.05, rod = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, L, 8), cord); rod.position.y = -L / 2; pivot.add(rod);
  const shade = await model('furniture', 'lampSquareCeiling').catch(() => null);
  const bob = shade || new THREE.Mesh(new THREE.SphereGeometry(.25, 20, 16), brass); bob.position.y = -L - (shade ? .1 : 0); pivot.add(bob);
  const glow = new THREE.PointLight('#ffd9a0', 2.5, 4, 2); glow.position.y = -L - .2; pivot.add(glow);
  const speed = 1.6 + r() * .8, phase = r() * 6, amp = Math.min(1.1, Math.asin(Math.min(.95, span / 2 / L)));
  const world = new THREE.Vector3(); let cool = 0;
  return {
    kind: 'pendulum', label: 'SWINGING LAMP', x, z,
    update(t, player, dt) {
      cool -= dt; pivot.rotation.z = Math.sin(t * speed + phase) * amp; bob.getWorldPosition(world);
      const dx = player.pos.x - world.x, dz = player.pos.z - world.z;
      if (cool <= 0 && world.y < player.y + 1.9 && Math.hypot(dx, dz) < .55) { cool = 1; return { kind: 'pendulum', dir: { x: Math.cos(t * speed + phase) > 0 ? 1 : -1, z: 0 }, power: 6 }; }
      return null;
    },
    near: player => Math.hypot(player.pos.x - world.x, player.pos.z - world.z),
  };
}

// THE VACUUM: a robot vacuum that hunts you along your own breadcrumb trail (no navmesh needed:
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
      if (t < wake) { this.distance = 99; return null; }
      if (stun > 0) { stun -= dt; g.rotation.y += dt * 14; if (stun <= 0) { ring.material.color.set('#ff3b5c'); ring.material.emissive.set('#ff1e46'); } this.distance = Math.hypot(player.pos.x - g.position.x, player.pos.z - g.position.z); return null; }
      speed = Math.min(4.6, 2.2 + (t - wake) * .07);
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

export async function createHazards(scene, level, r, spawn, props) {
  const list = [];
  level.doors.forEach((d, i) => i === level.doors.length - 1 ? 0 : list.push(door(scene, level.colliders, d, r)));
  const lock = level.doors.length ? await voiceDoor(scene, level.colliders, level.doors.at(-1)) : { kind: 'none', near: false, open: true, charge: 0, x: 0, z: 0, update: () => null };
  list.push(lock);
  const mate = roommate(level.rooms.find(x => x.key === 'bedroom'), props); if (mate) list.push(mate);
  for (const room of level.rooms) {
    if (['kitchen', 'living', 'hallway', 'laundry', 'bathroom'].includes(room.key)) {
      const z = room.z0 - room.len * (.35 + r() * .3);
      list.push(await pendulum(scene, r.range(-.4, .4), z, r, Math.min(room.w - 1, 3.2)));
    }
  }
  const vac = vacuum(scene, spawn); list.push(vac);
  return {
    list, vacuum: vac, lock, mate,
    update(t, player, dt, chaos, voice) { const hits = []; for (const h of list) { const hit = h.update(t, player, dt, h.kind === 'vacuum' ? chaos : voice); if (hit) hits.push({ ...hit, label: h.label }); } return hits; },
    doorWarning: (t, player) => list.some(h => h.kind === 'door' && h.warn(t) && Math.abs(player.pos.z - h.z) < 4),
  };
}
