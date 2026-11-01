import * as THREE from 'three';
import { model } from './assets.js';

// Goofy loose-prop physics: every prop is a bouncy sphere. Cheap (no physics engine), exaggerated on purpose.
// Kinds: { kit, name, r (radius), bounce, mass, onTouch?(player) } — onTouch makes bananas slip, balls bonk, etc.
export const KINDS = {
  banana: { kit: 'food', name: 'banana', r: .18, bounce: .3, mass: .3, slip: true },
  ball: { r: .35, bounce: .92, mass: .6, color: '#ff5fa2' },
  duck: { r: .16, bounce: .6, mass: .2, color: '#ffd23f', duck: true },
  can: { kit: 'food', name: 'soda-can', r: .12, bounce: .5, mass: .3 },
  donut: { kit: 'food', name: 'donut-sprinkles', r: .14, bounce: .7, mass: .2 },
  box: { kit: 'furniture', name: 'cardboardBoxOpen', r: .3, bounce: .2, mass: 1.2 },
  pizza: { kit: 'food', name: 'pizza-box', r: .28, bounce: .25, mass: .5 },
  pillow: { kit: 'furniture', name: 'pillow', r: .22, bounce: .8, mass: .2 },
};
const duckGeo = new THREE.SphereGeometry(1, 16, 12);

export function createProps(scene, colliders) {
  const list = [];
  async function spawn(kind, x, y, z, v = {}) {
    const k = KINDS[kind];
    let obj;
    if (k.kit) obj = await model(k.kit, k.name);
    else {
      obj = new THREE.Group();
      const body = new THREE.Mesh(duckGeo, new THREE.MeshStandardMaterial({ color: k.color, roughness: .35 }));
      body.scale.setScalar(k.r); body.position.y = k.r; body.castShadow = true; obj.add(body);
      if (k.duck) { const head = body.clone(); head.scale.setScalar(k.r * .6); head.position.set(0, k.r * 1.8, k.r * .5); obj.add(head); const beak = new THREE.Mesh(duckGeo, new THREE.MeshStandardMaterial({ color: '#ff8a00' })); beak.scale.set(k.r * .3, k.r * .15, k.r * .3); beak.position.set(0, k.r * 1.75, k.r * 1.05); obj.add(beak); }
    }
    obj.position.set(x, y, z); scene.add(obj);
    const p = { kind, k, obj, pos: obj.position, vel: new THREE.Vector3(v.x || 0, v.y || 0, v.z || 0), spin: (Math.random() - .5) * 8, life: v.life ?? Infinity };
    list.push(p); return p;
  }
  function blast(x, z, radius, power) {
    for (const p of list) {
      const dx = p.pos.x - x, dz = p.pos.z - z, d = Math.hypot(dx, dz) || .1;
      if (d > radius) continue; const f = (1 - d / radius) * power / p.k.mass;
      p.vel.x += dx / d * f; p.vel.z += dz / d * f; p.vel.y += f * .7; p.spin += (Math.random() - .5) * 20;
    }
  }
  const tmp = { x: 0, z: 0 };
  // Returns touches: [{prop, speed}] so the game can apply slips / bonks / glass kicks.
  function step(dt, player, gravity = 18) {
    const touches = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]; p.life -= dt;
      if (p.life <= 0 || p.pos.y < -10) { scene.remove(p.obj); list.splice(i, 1); continue; }
      p.vel.y -= gravity * dt; p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y < 0) { p.pos.y = 0; p.vel.y = Math.abs(p.vel.y) > 1 ? -p.vel.y * p.k.bounce : 0; p.vel.x *= .985; p.vel.z *= .985; p.spin *= .97; }
      // bounce off walls / furniture (sides only)
      tmp.x = p.pos.x; tmp.z = p.pos.z;
      for (const c of colliders) {
        if (c.disabled || p.pos.y > c.top) continue;
        const nx = Math.max(c.minX, Math.min(tmp.x, c.maxX)), nz = Math.max(c.minZ, Math.min(tmp.z, c.maxZ));
        const dx = tmp.x - nx, dz = tmp.z - nz, d2 = dx * dx + dz * dz;
        if (d2 < p.k.r * p.k.r && d2 > 1e-6) { const d = Math.sqrt(d2); tmp.x = nx + dx / d * p.k.r; tmp.z = nz + dz / d * p.k.r; const vn = (p.vel.x * dx + p.vel.z * dz) / d; if (vn < 0) { p.vel.x -= (1 + p.k.bounce) * vn * dx / d; p.vel.z -= (1 + p.k.bounce) * vn * dz / d; } }
      }
      p.pos.x = tmp.x; p.pos.z = tmp.z;
      // player kicks props; props shove the player (lighter props shove less)
      const dx = p.pos.x - player.pos.x, dz = p.pos.z - player.pos.z, d = Math.hypot(dx, dz), R = p.k.r + .3;
      if (d < R && p.pos.y < player.y + 1.2) {
        const nx = dx / (d || 1), nz = dz / (d || 1), rel = (player.vel.x - p.vel.x) * nx + (player.vel.z - p.vel.z) * nz;
        p.pos.x = player.pos.x + nx * R; p.pos.z = player.pos.z + nz * R;
        if (rel > 0) { p.vel.x += nx * rel * 1.6 / p.k.mass * .4; p.vel.z += nz * rel * 1.6 / p.k.mass * .4; p.vel.y += rel * .5; p.spin += rel * 4; }
        touches.push({ prop: p, speed: Math.hypot(p.vel.x, p.vel.z) });
      }
      p.obj.rotation.y += p.spin * dt; if (p.pos.y > .05) p.obj.rotation.x += p.spin * dt * .5;
    }
    return touches;
  }
  function clear() { for (const p of list) scene.remove(p.obj); list.length = 0; }
  return { spawn, blast, step, clear, list };
}
