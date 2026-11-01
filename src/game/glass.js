import * as THREE from 'three';

// Slosh = damped spring per axis, driven by hand acceleration, turning, events.
// Spill happens when slosh exceeds the rim allowance, which grows as the glass empties.
export function createGlass(camera) {
  const s = { water: 1, tx: 0, tz: 0, vx: 0, vz: 0, spillRate: 0 };
  const g = new THREE.Group(); g.position.set(.3, -.3, -.6); camera.add(g);
  const glassMat = new THREE.MeshStandardMaterial({ color: '#dff6ff', transparent: true, opacity: .22, roughness: .05, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const R = .075, H = .19;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R * .82, H, 32, 1, true), glassMat));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R * .82, R * .82, .015, 32), glassMat); base.position.y = -H / 2; g.add(base);
  const waterMat = new THREE.MeshStandardMaterial({ color: '#3fb6ff', transparent: true, opacity: .55, roughness: .1, emissive: '#0a3a66', emissiveIntensity: .4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R * .96, R * .8, 1, 32), waterMat); g.add(body);
  const surface = new THREE.Mesh(new THREE.CircleGeometry(R * .97, 32), new THREE.MeshStandardMaterial({ color: '#a9e4ff', roughness: .05, emissive: '#2a7bbf', emissiveIntensity: .35 }));
  g.add(surface);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, .004, 8, 40), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .1 })); rim.rotation.x = Math.PI / 2; rim.position.y = H / 2; g.add(rim);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshStandardMaterial({ color: '#f1b48f', roughness: .6 }));
  hand.scale.set(1.25, .8, 1.1); hand.position.set(.05, -.05, .04); g.add(hand);

  function step(dt, { ax = 0, az = 0, turn = 0, steady = false, calm = false, wobble = 0 }) {
    const k = steady || calm ? 26 : 13, c = steady ? 7.5 : calm ? 9 : 2.6, gain = steady ? .028 : .05;
    s.vx += (-k * s.tx - c * s.vx - ax * gain + turn * .9 + (Math.random() - .5) * wobble) * dt;
    s.vz += (-k * s.tz - c * s.vz - az * gain + (Math.random() - .5) * wobble) * dt;
    s.tx += s.vx * dt; s.tz += s.vz * dt;
    const tilt = Math.hypot(s.tx, s.tz), rim = .2 + (1 - s.water) * .42;
    s.spillRate = Math.max(0, tilt - rim) * .9;
    s.water = Math.max(0, s.water - s.spillRate * dt);
    return s.spillRate * dt; // amount spilled this step (0..1 of a glass)
  }
  function kick(x, z) { s.vx += x; s.vz += z; }
  function render(t) {
    g.rotation.z = THREE.MathUtils.clamp(-s.tx * .9, -.6, .6); g.rotation.x = THREE.MathUtils.clamp(s.tz * .9, -.6, .6);
    const h = Math.max(.002, (H - .02) * s.water);
    body.scale.y = h; body.position.y = -H / 2 + .01 + h / 2; body.visible = s.water > .003;
    surface.position.y = -H / 2 + .012 + h; surface.visible = body.visible;
    // liquid stays level with the world: counter-rotate the surface, then add the slosh lean
    surface.rotation.set(-Math.PI / 2 - g.rotation.x + s.tz * 2.2, 0, -g.rotation.z - s.tx * 2.2);
    g.position.y = -.3 + Math.sin(t * 9) * .004;
  }
  return { state: s, step, kick, render, group: g };
}
