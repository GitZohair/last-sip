import * as THREE from 'three';
import { model, textTexture } from './assets.js';
import { sfx } from './sfx.js';
import { planeMesh } from './planes.js';

// CARS: a taxi, a police car and a go-kart parked around the arena. F to get in / out. W/S gas & brake, A/D steer.
// Ram anyone at speed and they get YEETED. Your drink tower rides along and sways with every turn and brake,
// so driving fast with a tall stack is a gamble. Drive off the boards = you, the car and the drinks go swimming.
const KINDS = [{ name: 'taxi', s: 1.35, max: 15, seat: .55 }, { name: 'police', s: 1.35, max: 17, seat: .55 }, { name: 'kart-oobi', s: 1.7, max: 19, seat: .35 }, { name: 'plane', s: .8, max: 15, seat: -.55, fly: true }];
const SPAWNS = [[5.5, 3.6, -1.2], [-5.6, -3.6, 2], [0, 15, Math.PI], [-21, 0, Math.PI / 2]]; // x, z, yaw (the plane waits on the west islet)

export function createCars({ scene, level, player, run, bots, avatar, onRam, bombs }) {
  const onBoards = (x, z) => level.colliders.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
  const cars = [];
  const hint = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('F', { w: 128, h: 128, bg: '#ffd166', fg: '#1b1530', font: '900 84px system-ui' }), depthTest: false })); hint.scale.setScalar(.7); hint.renderOrder = 12; hint.visible = false; scene.add(hint);
  KINDS.forEach(async (k, i) => {
    const m = k.fly ? planeMesh('#ffb020') : (await model('car', k.name)).clone(); m.scale.setScalar(k.s); if (k.fly) m.rotation.y = Math.PI; // plane nose is -z, cars face +z
    m.getObjectByName('character')?.removeFromParent(); // the kart's own driver: our bean drives
    const wheels = []; m.traverse(o => { if (o.name.startsWith('wheel-front')) wheels.push(o); });
    const g = new THREE.Group(); g.add(m); scene.add(g);
    const [x, z, yaw] = SPAWNS[i];
    cars.push({ k, g, m, wheels, home: { x, z, yaw }, x, z, yaw, speed: 0, steer: 0, y: 0, vy: 0, sink: 0, fuel: 14 });
    place(cars.at(-1));
  });
  function place(c) { c.g.position.set(c.x, c.y, c.z); c.g.rotation.set(0, Math.PI - c.yaw, 0); for (const w of c.wheels) w.rotation.y = c.steer * .5; }
  function reset(c) { Object.assign(c, { x: c.home.x, z: c.home.z, yaw: c.home.yaw, speed: 0, y: 0, vy: 0, sink: 0, fuel: 14 }); place(c); }
  let car = null, fWas = false, lastV = { x: 0, z: 0 };
  const near = () => cars.filter(c => c.sink <= 0).sort((a, b) => Math.hypot(a.x - player.pos.x, a.z - player.pos.z) - Math.hypot(b.x - player.pos.x, b.z - player.pos.z))[0];
  function exit() {
    if (!car) return; const c = car; car = null; const sx = Math.cos(c.yaw) * 1.8, sz = Math.sin(c.yaw) * 1.8;
    player.pos.x = c.x + sx; player.pos.z = c.z + sz; player.y = c.k.fly ? c.y : 0; player.vy = 2; if (c.k.fly && c.y > 1) c.fuel = 0; // bail out: the plane goes down without you player.grounded = false; player.vel.x = player.vel.z = 0; avatar.root.position.y = 0;
  }
  run.onFall = () => { if (car) { const c = car; car = null; c.sink = 3; } };
  // called from run.step: returns true while driving (it moves the player)
  run.drive = dt => {
    const f = player.keys.has('KeyF');
    if (f && !fWas) { if (car) exit(); else { const c = near(); if (c && Math.hypot(c.x - player.pos.x, c.z - player.pos.z) < 2.6 && player.grounded) { car = c; sfx.thud(.8); } } }
    fWas = f;
    if (car && run.inflateT > 0) car = null; // CO2'd out of the driver's seat
    if (!car) return false;
    if (car.k.fly) return flyStep(dt);
    const c = car, k = player.keys, gas = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0), st = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    c.speed += (gas * (gas > 0 ? 14 : 20) - c.speed * (gas ? .4 : 1.6)) * dt; c.speed = Math.max(-6, Math.min(c.k.max * (run.rule === 'rush' ? 1.6 : 1), c.speed));
    c.steer += (st - c.steer) * Math.min(1, dt * 8);
    c.yaw += c.steer * dt * 2.4 * Math.min(1, Math.abs(c.speed) / 4) * Math.sign(c.speed || 1);
    const vx = Math.sin(c.yaw) * c.speed, vz = -Math.cos(c.yaw) * c.speed;
    c.x += vx * dt; c.z += vz * dt;
    if (!onBoards(c.x, c.z) || c.vy < 0) { c.vy -= 18 * dt; c.y += c.vy * dt; } // off the edge: nose-dive into the sea
    place(c); c.g.rotation.x = c.vy < 0 ? Math.max(-.8, c.vy * .08) : 0; c.g.rotation.z = -c.steer * Math.min(1, Math.abs(c.speed) / 10) * .08;
    // the player rides in the seat; the tower feels every turn and brake
    player.pos.x = c.x; player.pos.z = c.z; player.y = c.y + c.k.seat; player.yaw = c.yaw; player.vel.x = vx; player.vel.z = vz; player.grounded = true; player.vy = 0;
    const ax = (vx - lastV.x) / dt, az = (vz - lastV.z) / dt; lastV = { x: vx, z: vz };
    player.accel.x = ax * Math.cos(c.yaw) + az * Math.sin(c.yaw); player.accel.z = -(ax * Math.sin(c.yaw) - az * Math.cos(c.yaw)); player.turnRate = c.steer * c.speed * .15;
    { let d = c.yaw - player.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); player.camYaw += d * Math.min(1, dt * 3); }
    // RAM: anyone in front at speed gets launched
    if (Math.abs(c.speed) > 5) {
      for (const b of bots?.bots || []) {
        if (b.fall > 0 || b.p.y > .2) continue; const dx = b.p.pos.x - c.x, dz = b.p.pos.z - c.z;
        if (Math.hypot(dx, dz) < 1.7) { bots.yeet(b, dx + vx * .2, dz + vz * .2, Math.abs(c.speed) * 1.1, 7 + Math.abs(c.speed) * .3); c.speed *= .7; sfx.hit(); run.shakeT = .3; run.onSlamLanded?.(b.name); }
      }
      onRam?.(c, vx, vz);
    }
    return true;
  };
  // THE PLANE: it takes off by itself; A/D bank, W climb, S dive, Q drops bombs (they inherit your speed). ~14 s of fuel,
  // then the engine coughs and it nosedives. Crash on the boards = big boom; anyone underneath gets launched.
  function flyStep(dt) {
    const c = car, k = player.keys, st = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), up = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
    c.fuel -= dt; c.speed += (16 - c.speed) * Math.min(1, dt * .8); c.steer += (st - c.steer) * Math.min(1, dt * 4);
    c.yaw += c.steer * dt * 1.5;
    if (c.fuel > 0) { const want = Math.max(1.5, Math.min(14, (c.alt ?? 7) + up * 5 * dt)); c.alt = want; c.y += (want - c.y) * Math.min(1, dt * (c.y < 1 ? 1.2 : 2)); c.vy = 0; }
    else { c.vy -= 12 * dt; c.y += c.vy * dt; } // out of fuel: nosedive
    const vx = Math.sin(c.yaw) * c.speed, vz = -Math.cos(c.yaw) * c.speed; c.x += vx * dt; c.z += vz * dt;
    if (Math.hypot(c.x, c.z) > 60) c.yaw += dt * 2.5; // the edge of the world turns you back
    c.g.position.set(c.x, c.y, c.z); c.g.rotation.set(c.fuel > 0 ? -up * .2 : .6, Math.PI - c.yaw, -c.steer * .6, 'YXZ'); // nose forward (same heading as the parked plane) c.m.userData.prop && (c.m.userData.prop.rotation.z += dt * (c.fuel > 0 ? 40 : 4));
    player.pos.x = c.x; player.pos.z = c.z; player.y = c.y + c.k.seat; player.yaw = c.yaw; player.vel.x = vx; player.vel.z = vz; player.grounded = true; player.vy = 0;
    player.accel.x = c.steer * 6; player.accel.z = 0; player.turnRate = c.steer * 1.5;
    { let d = c.yaw - player.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); player.camYaw += d * Math.min(1, dt * 2.5); }
    if (c.fuel < 0 && c.y <= .3) { // CRASH
      const land = onBoards(c.x, c.z); if (land) bombs?.boom(new THREE.Vector3(c.x, .3, c.z), 'PLANE CRASH'); else sfx.splash();
      car = null; c.sink = 4; player.y = land ? .5 : -3; player.vy = land ? 9 : 0; player.grounded = false; player.spin = 10;
      return false;
    }
    if (c.y < 2.2 && c.fuel > 0) for (const b of bots?.bots || []) { const dx = b.p.pos.x - c.x, dz = b.p.pos.z - c.z; if (b.fall <= 0 && Math.hypot(dx, dz) < 2.2) bots.yeet(b, dx + vx * .3, dz + vz * .3, 16, 10); }
    return true;
  }
  return {
    get driving() { return !!car; }, cars,
    update(dt) {
      const n = !car && near(); hint.visible = !!n && Math.hypot(n.x - player.pos.x, n.z - player.pos.z) < 3; if (hint.visible) hint.position.set(n.x, 2.6 + Math.sin(performance.now() / 200) * .1, n.z);
      for (const c of cars) if (c.sink > 0 && c !== car) { c.sink -= dt; c.y -= dt * 2; place(c); if (c.sink <= 0) reset(c); } },
    dispose() { car = null; scene.remove(hint); for (const c of cars) scene.remove(c.g); delete run.drive; delete run.onFall; },
  };
}
