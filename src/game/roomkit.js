import * as THREE from 'three';

// Shared room-building helpers. Hazard zones: {minX,maxX,minZ,maxZ,label, push?, shake?, slip?, grip?,
// bounce?, quiet?, update?(t, player, props)}.
export const zone = (x, z, w, d, extra) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, ...extra });

const discMat = new THREE.MeshStandardMaterial({ color: '#33363d', roughness: .4 });
// ROBO-BEAR (or any model) riding a robot vacuum, patrolling x0..x1 at z. Solid while it moves.
export function patrol(ctx, x0, x1, z, speed, phase, name = 'bear', label = 'ROBO-BEAR') {
  const m = ctx.place('furniture', name, x0, z, 0, false);
  m.then(b => { const disc = new THREE.Mesh(new THREE.CylinderGeometry(.35, .38, .12, 24), discMat); disc.position.y = .06; b.add(disc); b.children[0].position.y += .12; });
  const col = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, top: .7 }; ctx.shell.colliders.push(col);
  const mid = (x0 + x1) / 2, amp = (x1 - x0) / 2;
  return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, label, update(t) {
    const x = mid + Math.sin(t * speed + phase) * amp;
    m.then(b => { b.position.x = x; b.rotation.y = Math.cos(t * speed + phase) > 0 ? -Math.PI / 2 : Math.PI / 2; });
    Object.assign(col, { minX: x - .38, maxX: x + .38, minZ: z - .38, maxZ: z + .38 });
  } };
}

// LAUNCHER: an appliance that lobs props at you when you're in range (toaster -> donuts, dryer -> socks).
export function launcher(x, y, z, { kind = 'donut', every = 2.4, range = 6, label = 'TOASTER', power = 1 } = {}) {
  let next = 1;
  return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, label, update(t, player, props) {
    if (!player || t < next) return;
    const dx = player.pos.x - x, dz = player.pos.z - z, d = Math.hypot(dx, dz);
    if (d > range || d < .8) return;
    next = t + every;
    const flight = .55 + d * .07, lead = 1.2;
    props.spawn(kind, x, y, z, { x: (dx + player.vel.x * lead * flight) / flight * power, z: (dz + player.vel.z * lead * flight) / flight * power, y: 3.2, life: 6 });
  } };
}

export function light(ctx, x, z, color = '#ffe2b8', i = 3, d = 8) { const l = new THREE.PointLight(color, i, d, 2); l.position.set(x, 2.4, z); ctx.scene.add(l); return l; }
