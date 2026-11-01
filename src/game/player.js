import { collide } from './shell.js';

// First-person controller: pointer-lock mouse look, WASD, Shift = careful steps (steadier glass),
// Space = hop (over boxes / onto furniture). Acceleration feeds the glass slosh.
export function createPlayer(dom) {
  const p = { pos: { x: 0, z: 0 }, y: 0, vy: 0, vel: { x: 0, z: 0 }, yaw: 0, pitch: 0, keys: new Set(), grounded: true, accel: { x: 0, z: 0 }, turnRate: 0, steady: false };
  let mouseX = 0;
  addEventListener('keydown', e => { if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); p.keys.add(e.code); });
  addEventListener('keyup', e => p.keys.delete(e.code));
  addEventListener('blur', () => p.keys.clear());
  dom.addEventListener('mousedown', e => { if (e.button === 2) p.keys.add('Mouse2'); });
  addEventListener('mouseup', e => { if (e.button === 2) p.keys.delete('Mouse2'); });
  dom.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mousemove', e => {
    if (document.pointerLockElement !== dom) return;
    mouseX += e.movementX; p.yaw += e.movementX * .0022 * (p.mirror || 1); p.pitch = Math.max(-1.2, Math.min(1.2, p.pitch + e.movementY * .0022));
  });

  p.reset = (spawn) => { Object.assign(p.pos, { x: spawn.x, z: spawn.z }); p.yaw = spawn.yaw; p.pitch = 0; p.y = 0; p.vy = 0; p.vel.x = p.vel.z = 0; mouseX = 0; };

  p.step = (dt, { colliders, push = { x: 0, z: 0 }, slip = false, gravity = 14, speedMul = 1, mirror = 1, base = 0, noJump = false }) => {
    const k = p.keys, f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const s = ((k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0)) * mirror;
    if (k.has('ArrowLeft')) p.yaw -= 2 * dt; if (k.has('ArrowRight')) p.yaw += 2 * dt;
    p.steady = k.has('ShiftLeft') || k.has('ShiftRight') || k.has('Mouse2');
    const len = Math.hypot(f, s) || 1, speed = (p.steady ? 2.1 : 4.4) * speedMul;
    const tx = (Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) / len * speed + push.x;
    const tz = (-Math.cos(p.yaw) * f + Math.sin(p.yaw) * s) / len * speed + push.z;
    const traction = (slip ? 1.4 : 11) * (p.grounded ? 1 : .25);
    const ox = p.vel.x, oz = p.vel.z;
    p.vel.x += (tx - p.vel.x) * Math.min(1, traction * dt); p.vel.z += (tz - p.vel.z) * Math.min(1, traction * dt);
    // acceleration in the player's local frame (x = right, z = forward) drives the slosh
    const ax = (p.vel.x - ox) / dt, az = (p.vel.z - oz) / dt;
    p.accel.x = ax * Math.cos(p.yaw) + az * Math.sin(p.yaw); p.accel.z = -(ax * Math.sin(p.yaw) - az * Math.cos(p.yaw));
    p.turnRate = mouseX * .0022 / Math.max(dt, 1e-3); mouseX = 0;
    p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt;
    if (k.has('Space') && p.grounded && !noJump) { p.vy = 4.6; p.grounded = false; p.justJumped = true; }
    p.vy -= gravity * dt; p.y += p.vy * dt;
    const ground = collide(p.pos, .3, p.y, colliders, base);
    const wasAir = !p.grounded;
    if (p.y <= ground) { p.landed = wasAir && p.vy < -3 ? -p.vy : 0; p.y = ground; p.vy = 0; p.grounded = true; } else { p.grounded = p.y - ground < .02; p.landed = 0; }
  };
  return p;
}
