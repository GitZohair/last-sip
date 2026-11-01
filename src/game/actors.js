import * as THREE from 'three';
import { model, textTexture } from './assets.js';

// VIEWER CHARACTERS: chat doesn't just trigger effects, it shows up on the island with its name on it.
//   SNIPER  (!sniper, 100+ bits, sub)  mounts a water cannon on the lifeguard tower nearest ahead of you,
//            paints you with a laser for 1.4 s, fires. 3 shots, then leaves. Move sideways to dodge.
//   ROLLER  (!barrel)                  drops a barrel on the boards ahead; it rolls straight down the planks. Hop it (Space).
//   LIFEGUARD (!steady x3)              a named lifeguard on a tower throws you a lifebuoy: your next fall is free.
// Every hit is credited to that viewer (Spill Credits, Most Wanted); every save is credited too.
export function lifebuoy() { // red/white striped ring
  const g = new THREE.Group(), seg = 8;
  for (let i = 0; i < seg; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(.42, .1, 8, 10, Math.PI * 2 / seg), new THREE.MeshLambertMaterial({ color: i % 2 ? '#ffffff' : '#ff3b2f' })); m.rotation.z = i * Math.PI * 2 / seg; g.add(m); }
  g.rotation.x = Math.PI / 2; return g;
}
function tag(name, color = '#ff3b5c') {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(name.slice(0, 18).toUpperCase(), { w: 512, h: 96, bg: color, font: 'bold 54px system-ui' }), depthTest: false }));
  s.scale.set(3.4, .64, 1); s.renderOrder = 11; return s;
}
const laserMat = new THREE.LineBasicMaterial({ color: '#ff2040', transparent: true, opacity: .9 });
export const ballMat = new THREE.MeshStandardMaterial({ color: '#5cc8ff', emissive: '#2a8cff', emissiveIntensity: .8, roughness: .1 });

export function createActors(scene, level, sfx) {
  const list = [];
  const api = {
    list,
    async spawn(kind, user, player, opts = {}) {
      if (kind === 'sniper') {
        const ahead = level.towers.filter(t => t.z < player.pos.z + 4 && !list.some(a => a.tower === t)).sort((a, b) => b.z - a.z)[0] || level.towers[0];
        const cannon = await model('pirate', 'cannon'); cannon.position.set(ahead.x, ahead.y, ahead.z); cannon.scale.setScalar(.8); scene.add(cannon);
        const t = tag(user); t.position.set(ahead.x, ahead.y + 2.3, ahead.z); scene.add(t);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), laserMat); line.visible = false; scene.add(line);
        list.push({ kind, user, tower: ahead, objs: [cannon, t, line], cannon, line, shots: 3, aim: 1.4, ball: null });
      } else if (kind === 'lifeguard') {
        const tower = level.towers.slice().sort((a, b) => Math.hypot(a.x - player.pos.x, a.z - player.pos.z) - Math.hypot(b.x - player.pos.x, b.z - player.pos.z))[0];
        const t = tag(user, '#2fbf71'); t.position.set(tower.x, tower.y + 2.3, tower.z); scene.add(t);
        const ring = lifebuoy(); ring.position.set(tower.x, tower.y + 1, tower.z); scene.add(ring);
        list.push({ kind, user, objs: [t, ring], ring, from: ring.position.clone(), k: 0, life: 2.5 });
      } else if (kind === 'barrel') {
        // ROLLER: the barrel thumps down ON THE BOARDS ahead of you (shadow first), sits for a beat, then rolls
        // in a straight line along the boardwalk. It never steers; if it runs off the planks it drops into the sea.
        const spot = opts.spot; if (!spot) return;
        const b = await model('pirate', 'barrel'); b.scale.setScalar(.55); b.rotation.z = Math.PI / 2; // lying on its side, centred so it spins about its axis
        const bb = new THREE.Box3().setFromObject(b), r = (bb.max.y - bb.min.y) / 2; b.position.sub(bb.getCenter(new THREE.Vector3()));
        const spin = new THREE.Group(); spin.add(b); const g = new THREE.Group(); g.add(spin); g.position.set(spot.x, 4, spot.z); g.rotation.y = Math.atan2(spot.dir.x, spot.dir.z); scene.add(g);
        const t = tag(user, '#ffb020'); t.scale.multiplyScalar(.8); scene.add(t);
        list.push({ kind, user, objs: [g, t], g, spin, t, x: spot.x, z: spot.z, dir: spot.dir, r, y: 4, vy: 0, wait: .6, life: 6 });
      }
    },
    // returns hits: [{ user, dir, power, kind }]
    update(dt, t, player) {
      const hits = [];
      for (const a of [...list]) {
        if (a.kind === 'sniper') {
          const from = new THREE.Vector3(a.tower.x, a.tower.y + .7, a.tower.z), to = new THREE.Vector3(player.pos.x, player.y + .9, player.pos.z);
          a.cannon.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) - Math.PI / 2;
          if (!a.ball) {
            a.aim -= dt; a.line.visible = a.aim < 1.4 && Math.sin(t * (a.aim < .4 ? 40 : 14)) > -.3;
            a.line.geometry.setFromPoints([from, to]);
            if (a.aim <= 0) { a.line.visible = false; sfx.shot(); const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), ballMat); m.position.copy(from); scene.add(m); a.objs.push(m); a.ball = { m, v: to.clone().sub(from).normalize().multiplyScalar(22), life: 1.2 }; }
          } else {
            const b = a.ball; b.m.position.addScaledVector(b.v, dt); b.life -= dt;
            const d = Math.hypot(b.m.position.x - player.pos.x, b.m.position.z - player.pos.z);
            if (d < .7 && Math.abs(b.m.position.y - (player.y + .9)) < 1.1) { const dir = b.v.clone().setY(0).normalize(); hits.push({ user: a.user, kind: 'SNIPER', dir: { x: dir.x, z: dir.z }, power: 7 }); b.life = 0; }
            if (b.life <= 0) { scene.remove(b.m); a.ball = null; a.shots--; a.aim = 1.4; if (a.shots <= 0) remove(a); }
          }
        } else if (a.kind === 'lifeguard') {
          // the buoy arcs from the tower to you, then the tag lingers a moment
          if (a.k < 1) {
            a.k = Math.min(1, a.k + dt / .9); const to = { x: player.pos.x, y: player.y + .8, z: player.pos.z };
            a.ring.position.set(a.from.x + (to.x - a.from.x) * a.k, a.from.y + (to.y - a.from.y) * a.k + Math.sin(a.k * Math.PI) * 3, a.from.z + (to.z - a.from.z) * a.k);
            a.ring.rotation.z += dt * 8;
            if (a.k >= 1) { scene.remove(a.ring); hits.push({ user: a.user, kind: 'LIFEGUARD', help: true, dir: { x: 0, z: 0 }, power: 0 }); }
          } else if ((a.life -= dt) <= 0) remove(a);
        } else if (a.kind === 'barrel') {
          a.life -= dt; const board = level.colliders.some(c => a.x > c.minX && a.x < c.maxX && a.z > c.minZ && a.z < c.maxZ && c.top <= .1 && c.top > -.5);
          const floor = board ? a.r : -3;
          if (a.y > floor || a.vy > 0) { a.vy -= 20 * dt; a.y = Math.max(floor, a.y + a.vy * dt); if (a.y === floor && a.vy < -4 && board) { a.vy = -a.vy * .3; sfx.thud(.6); } else if (a.y === floor) a.vy = 0; }
          if (a.y < -1.5 && !a.sunk) { a.sunk = true; sfx.splash(); a.life = Math.min(a.life, .8); }
          if (a.y <= floor + .01 && (a.wait -= dt) <= 0) { a.x += a.dir.x * 6.5 * dt; a.z += a.dir.z * 6.5 * dt; a.spin.rotation.x += dt * 6.5 / a.r; a.rolling = true; }
          a.g.position.set(a.x, a.y, a.z); a.t.position.set(a.x, a.y + 1.1, a.z);
          const rx = player.pos.x - a.x, rz = player.pos.z - a.z;
          if (a.y > -.2 && a.y < 1 && Math.hypot(rx, rz) < .75 && player.y < .45) { const side = Math.sign(rx * a.dir.z - rz * a.dir.x) || 1; hits.push({ user: a.user, kind: 'BARREL', dir: { x: a.dir.x * .6 + a.dir.z * side, z: a.dir.z * .6 - a.dir.x * side }, power: 6 }); a.life = 0; }
          if (a.life <= 0) remove(a);
        }
      }
      return hits;
    },
    clear() { for (const a of [...list]) remove(a); },
  };
  function remove(a) { for (const o of a.objs) scene.remove(o); list.splice(list.indexOf(a), 1); }
  return api;
}
