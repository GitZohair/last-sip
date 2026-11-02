import * as THREE from 'three';
import { sfx } from './sfx.js';

// BOMBS: pick them up off the boards (max 3), throw with Q / left click. Anyone near the blast gets YEETED.
// Planes and chat drop them from the sky too. Bots find and throw their own.
const ballGeo = new THREE.SphereGeometry(.26, 20, 14), fuseGeo = new THREE.CylinderGeometry(.035, .035, .16, 6), sparkGeo = new THREE.SphereGeometry(.07, 8, 6);
const ballMat = new THREE.MeshPhongMaterial({ color: '#25202e', shininess: 90, specular: '#888' }), fuseMat = new THREE.MeshLambertMaterial({ color: '#c58b3e' });
const sparkMat = new THREE.MeshBasicMaterial({ color: '#ffd166' }), flashMat = new THREE.MeshBasicMaterial({ color: '#ffb020', transparent: true, depthWrite: false });
const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, side: THREE.DoubleSide });
const glowMat = new THREE.MeshBasicMaterial({ color: '#ff4f6d', transparent: true, opacity: .5, depthWrite: false });
function bombMesh() {
  const g = new THREE.Group(); const b = new THREE.Mesh(ballGeo, ballMat); b.castShadow = true; g.add(b);
  const f = new THREE.Mesh(fuseGeo, fuseMat); f.position.y = .3; g.add(f); const s = new THREE.Mesh(sparkGeo, sparkMat); s.position.y = .4; g.add(s); g.userData.spark = s; return g;
}
export function createBombs({ scene, level, player, run, bots, onHitPeers }) {
  const onBoards = (x, z) => level.colliders.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
  const pickups = [], live = [], fx = [], crates = [];
  const crateGeo = new THREE.BoxGeometry(.9, .9, .9), crateMat = new THREE.MeshLambertMaterial({ color: '#c58b3e' }), chuteMat = new THREE.MeshLambertMaterial({ color: '#ff4f6d', side: THREE.DoubleSide });
  let spawnT = 2, held = 0;
  const hud = document.createElement('div'); hud.id = 'bombs'; document.getElementById('hud')?.appendChild(hud);
  const drawHud = () => { hud.innerHTML = held ? `<i></i>`.repeat(held) + '<span>Q</span>' : ''; };
  function randomSpot() {
    for (let i = 0; i < 20; i++) { const c = level.colliders[Math.floor(Math.random() * level.colliders.length)]; const x = c.minX + .6 + Math.random() * (c.maxX - c.minX - 1.2), z = c.minZ + .6 + Math.random() * (c.maxZ - c.minZ - 1.2); if (Math.hypot(x, z) > 2.5) return { x, z }; }
    return { x: 4, z: 4 };
  }
  function addPickup(x, z) {
    const m = bombMesh(); m.scale.setScalar(1.3); const glow = new THREE.Mesh(new THREE.CircleGeometry(.6, 20).rotateX(-Math.PI / 2), glowMat); glow.position.y = -.6; m.add(glow);
    m.position.set(x, .7, z); scene.add(m); pickups.push({ m, x, z, t: Math.random() * 6 });
  }
  // throw (or drop): v is the launch velocity
  function launch(x, y, z, vx, vy, vz, by, { fuse = 1.5, sky = false, mine = false, ghost = false } = {}) {
    const m = bombMesh(); m.position.set(x, y, z); scene.add(m); live.push({ m, v: new THREE.Vector3(vx, vy, vz), by, fuse, sky, mine, ghost, spin: Math.random() * 10 });
  }
  function boom(p, by, ghost = false) {
    run.shakeT = Math.max(run.shakeT || 0, .45); sfx.boom();
    const f = new THREE.Mesh(sparkGeo, flashMat.clone()); f.position.copy(p); scene.add(f); fx.push({ m: f, t: 0, kind: 'flash' });
    const r = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 32).rotateX(-Math.PI / 2), ringMat.clone()); r.position.set(p.x, .05, p.z); scene.add(r); fx.push({ m: r, t: 0, kind: 'ring' });
    const R = 4; if (ghost) return; // someone else's bomb: they compute the hits
    const dp = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
    if (dp < R && player.y < p.y + 2.5) run.applyHit?.({ by, dir: { x: (player.pos.x - p.x) / (dp || 1), z: (player.pos.z - p.z) / (dp || 1) }, power: 6 + 8 * (1 - dp / R), up: 3 });
    for (const b of bots?.bots || []) { const d = Math.hypot(b.p.pos.x - p.x, b.p.pos.z - p.z); if (d < R && b.fall <= 0) bots.yeet(b, b.p.pos.x - p.x, b.p.pos.z - p.z, 7 + 8 * (1 - d / R), 6 + 4 * (1 - d / R)); }
    onHitPeers?.(p, R, by);
  }
  const api = {
    get held() { return held; }, launch, boom, addPickup,
    throw(by) {
      if (!held || run.state !== 'play') return false; held--; drawHud();
      const yaw = player.camYaw ?? player.yaw, fx2 = Math.sin(yaw), fz = -Math.cos(yaw);
      launch(player.pos.x + fx2 * .6, player.y + 1.6, player.pos.z + fz * .6, fx2 * 11 + player.vel.x * .5, 6, fz * 11 + player.vel.z * .5, by, { mine: true });
      return { x: player.pos.x, y: player.y + 1.6, z: player.pos.z, vx: fx2 * 11, vy: 6, vz: fz * 11 };
    },
    // CARE PACKAGE: a crate floats down on a parachute and bursts into 3 bomb pickups
    care(x, z) {
      const g = new THREE.Group(), box = new THREE.Mesh(crateGeo, crateMat); box.castShadow = true; g.add(box);
      const chute = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), chuteMat); chute.position.y = 2.2; g.add(chute);
      g.position.set(x, 15, z); scene.add(g); crates.push({ g, x, z });
    },
    // a bomb from the sky (planes, chat): lands at x,z and goes off
    drop(x, z, by) { launch(x, 16, z, 0, -2, 0, by, { fuse: .25, sky: true }); },
    update(dt, t) {
      const bombDay = run.rule === 'bombs'; if (run.state === 'play' && (spawnT -= dt) <= 0 && pickups.length < (bombDay ? 12 : 6)) { spawnT = (bombDay ? 1 : 3) + Math.random() * 3; const s = randomSpot(); addPickup(s.x, s.z); }
      for (let i = pickups.length - 1; i >= 0; i--) {
        const k = pickups[i]; k.t += dt; k.m.position.y = .7 + Math.sin(k.t * 3) * .12; k.m.rotation.y += dt * 1.5;
        if (held < 3 && Math.hypot(player.pos.x - k.x, player.pos.z - k.z) < 1.1 && player.y < 1.5) { held++; drawHud(); sfx.thud(.6); scene.remove(k.m); pickups.splice(i, 1); continue; }
        const b = bots?.bots.find(b => (b.bombs || 0) < 2 && b.fall <= 0 && Math.hypot(b.p.pos.x - k.x, b.p.pos.z - k.z) < 1.1);
        if (b) { b.bombs = (b.bombs || 0) + 1; scene.remove(k.m); pickups.splice(i, 1); }
      }
      // bots lob theirs at you when you're in range
      for (const b of bots?.bots || []) {
        b.bombCd = (b.bombCd ?? 4 + Math.random() * 4) - dt;
        const d = Math.hypot(player.pos.x - b.p.pos.x, player.pos.z - b.p.pos.z);
        if (b.bombs > 0 && b.bombCd <= 0 && d < 13 && d > 3 && b.fall <= 0 && run.state === 'play') {
          b.bombs--; b.bombCd = 5 + Math.random() * 5; const T = d / 10, vx = (player.pos.x - b.p.pos.x) / T, vz = (player.pos.z - b.p.pos.z) / T;
          launch(b.p.pos.x, 1.6, b.p.pos.z, vx, 18 * T / 2 - 1.6 / T, vz, b.name, { fuse: T + .35 });
        }
      }
      for (let i = live.length - 1; i >= 0; i--) {
        const b = live[i]; b.v.y -= 18 * dt; b.m.position.addScaledVector(b.v, dt); b.m.rotation.x += b.spin * dt; b.fuse -= dt;
        b.m.userData.spark.scale.setScalar(.8 + Math.random() * .8);
        const p = b.m.position;
        if (p.y < .26 && onBoards(p.x, p.z) && b.v.y < 0) { p.y = .26; b.v.y *= -.35; b.v.x *= .6; b.v.z *= .6; if (b.sky) b.fuse = Math.min(b.fuse, .05); }
        if (p.y < -1.6) { scene.remove(b.m); live.splice(i, 1); continue; } // fizzled in the sea
        const touching = !b.mine && !b.sky && Math.hypot(player.pos.x - p.x, player.pos.z - p.z) < .7 && Math.abs(player.y + 1 - p.y) < 1.2;
        if (b.fuse <= 0 || touching) { boom(p.clone(), b.by, b.ghost); scene.remove(b.m); live.splice(i, 1); }
      }
      for (let i = crates.length - 1; i >= 0; i--) {
        const c = crates[i]; c.g.position.y -= dt * 3.2; c.g.rotation.y += dt * .6; c.g.rotation.z = Math.sin(t * 2 + i) * .08;
        if (c.g.position.y <= .45) { scene.remove(c.g); crates.splice(i, 1); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; if (onBoards(c.x + Math.cos(a), c.z + Math.sin(a))) addPickup(c.x + Math.cos(a) * 1.1, c.z + Math.sin(a) * 1.1); } sfx.thud(1); }
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i]; f.t += dt; const k = f.t / .45;
        if (f.kind === 'flash') { f.m.scale.setScalar(1 + k * 30); f.m.material.opacity = 1 - k; } else { f.m.scale.setScalar(1 + k * 4); f.m.material.opacity = (1 - k) * .8; }
        if (k >= 1) { scene.remove(f.m); f.m.material.dispose(); fx.splice(i, 1); }
      }
      void t;
    },
    dispose() { hud.remove(); for (const x of [...crates.map(c => c.g), ...pickups.map(p => p.m), ...live.map(b => b.m), ...fx.map(f => f.m)]) scene.remove(x); },
  };
  drawHud();
  return api;
}
