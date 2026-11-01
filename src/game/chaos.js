import * as THREE from 'three';
import { model } from './assets.js';

// Chat events. Chat never touches the controls: it changes the house around the streamer.
export const EVENTS = {
  bomb: { label: 'CHAT BOMB', icon: '💣' },
  crate: { label: 'FRIDGE DELIVERY', icon: '🧊' },
  storm: { label: 'DRAFT', icon: '🌬️' },
  ice: { label: 'MOPPED FLOOR', icon: '🧽' },
  lights: { label: 'LIGHTS OUT', icon: '🌑' },
  quake: { label: 'BASS DROP', icon: '🔊' },
  calm: { label: 'CHAT STEADIES YOU', icon: '🫶' },
};

export function createChaos({ scene, level, player, glass }) {
  const active = { gust: 0, gustDir: 1, lights: 0, quake: 0, calm: 0 };
  const bombs = [], drops = [], puddles = [];
  const puddleMat = new THREE.MeshStandardMaterial({ color: '#7fd0ff', transparent: true, opacity: .55, roughness: .02, metalness: .2 });
  const ahead = d => ({ x: player.pos.x + Math.sin(player.yaw) * d, z: player.pos.z - Math.cos(player.yaw) * d });

  function puddle(x, z, r = .5, life = 14) {
    const near = puddles.find(p => Math.hypot(p.x - x, p.z - z) < p.r);
    if (near) { near.r = Math.min(1.6, near.r + .02); near.life = life; near.mesh.scale.setScalar(near.r); return; }
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), puddleMat); mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .012, z); mesh.scale.setScalar(r);
    scene.add(mesh); puddles.push({ x, z, r, life, mesh });
  }
  const slipAt = (x, z) => puddles.some(p => Math.hypot(p.x - x, p.z - z) < p.r);

  function fire(type) {
    if (type === 'bomb') {
      const p = ahead(2.6);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), new THREE.MeshStandardMaterial({ color: '#ff4f7b', roughness: .35, emissive: '#ff2050', emissiveIntensity: .2 }));
      mesh.position.set(p.x, 3, p.z); scene.add(mesh); bombs.push({ mesh, vy: 0, fuse: 1.7 });
    } else if (type === 'crate') {
      const p = ahead(2.2 + Math.random()), side = (Math.random() - .5) * 1.4;
      model('furniture', 'kitchenFridge').then(m => { m.position.set(p.x + side, 6, p.z); m.rotation.y = Math.random() * 6; scene.add(m); drops.push({ m, vy: 0 }); });
    } else if (type === 'storm') { active.gust = 3.2; active.gustDir = Math.random() > .5 ? 1 : -1; }
    else if (type === 'ice') { const p = ahead(3); for (let i = 0; i < 5; i++) puddle(p.x + (Math.random() - .5) * 2, p.z - i * .7, 1.1, 10); }
    else if (type === 'lights') active.lights = 5;
    else if (type === 'quake') active.quake = 2.5;
    else if (type === 'calm') { active.calm = 6; active.gust = 0; }
  }

  function step(dt) {
    for (const k of ['gust', 'lights', 'quake', 'calm']) active[k] = Math.max(0, active[k] - dt);
    let push = { x: 0, z: 0 }, kick = 0;
    if (active.gust > 0) { const c = Math.cos(player.yaw), s = Math.sin(player.yaw); push.x += c * 3 * active.gustDir; push.z += s * 3 * active.gustDir; glass.kick(active.gustDir * 1.2 * dt * 10, 0); }
    if (active.quake > 0) kick = 3;
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i]; b.fuse -= dt; b.vy -= 18 * dt; b.mesh.position.y = Math.max(.22, b.mesh.position.y + b.vy * dt); if (b.mesh.position.y <= .22) b.vy *= -.35;
      b.mesh.scale.setScalar(1 + Math.max(0, Math.sin(performance.now() / (b.fuse * 40 + 20))) * .15);
      if (b.fuse <= 0) {
        const dx = player.pos.x - b.mesh.position.x, dz = player.pos.z - b.mesh.position.z, d = Math.hypot(dx, dz) || 1, f = Math.max(0, 1 - d / 4.5);
        player.vel.x += dx / d * 11 * f; player.vel.z += dz / d * 11 * f; player.vy += 4 * f;
        glass.kick((Math.random() - .5) * 5 * f, -4 * f);
        flash(b.mesh.position); scene.remove(b.mesh); bombs.splice(i, 1);
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.vy -= 20 * dt; d.m.position.y += d.vy * dt;
      if (d.m.position.y <= 0) { d.m.position.y = 0; level.colliders.push(boundsOf(d.m)); drops.splice(i, 1); kick = 6; }
    }
    for (let i = puddles.length - 1; i >= 0; i--) { const p = puddles[i]; p.life -= dt; if (p.life <= 0) { scene.remove(p.mesh); puddles.splice(i, 1); } else p.mesh.material.opacity = .55; }
    return { push, kick, calm: active.calm > 0 };
  }

  const flashes = [];
  function flash(pos) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.4, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true }));
    m.position.copy(pos); scene.add(m); flashes.push({ m, life: .4 });
  }
  function render(dt) {
    for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.life -= dt; f.m.scale.setScalar(1 + (.4 - f.life) * 14); f.m.material.opacity = Math.max(0, f.life / .4); if (f.life <= 0) { scene.remove(f.m); flashes.splice(i, 1); } }
  }
  return { fire, step, render, puddle, slipAt, active };
}

function boundsOf(m) { const b = new THREE.Box3().setFromObject(m); return { minX: b.min.x + .05, maxX: b.max.x - .05, minZ: b.min.z + .05, maxZ: b.max.z - .05, top: b.max.y }; }
