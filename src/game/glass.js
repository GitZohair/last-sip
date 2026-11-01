import * as THREE from 'three';

// Slosh = 2D damped spring (tx = sideways, tz = forward/back), driven by acceleration, turning, hits.
// Spill when |tilt| exceeds the rim allowance (grows as the glass empties → the last sip is the hardest to lose,
// which makes comebacks possible and near-misses frequent). `danger` (0..1) feeds the HUD meter.
const R = .11, H = .26;

export function createGlass(parent) {
  const s = { water: 1, tx: 0, tz: 0, vx: 0, vz: 0, spillRate: 0, danger: 0, scale: 1 };
  const g = new THREE.Group(); parent.add(g);
  const glassMat = new THREE.MeshStandardMaterial({ color: '#e8fbff', transparent: true, opacity: .28, roughness: .05, depthWrite: false, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R * .8, H, 28, 1, true), glassMat));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R * .8, R * .8, .03, 28), glassMat); base.position.y = -H / 2; g.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, .006, 6, 32), new THREE.MeshStandardMaterial({ color: '#fff' })); rim.rotation.x = Math.PI / 2; rim.position.y = H / 2; g.add(rim);
  const waterMat = new THREE.MeshStandardMaterial({ color: '#3fb6ff', transparent: true, opacity: .7, roughness: .1, emissive: '#0b4a80', emissiveIntensity: .5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R * .95, R * .78, 1, 28), waterMat); g.add(body);
  const surface = new THREE.Mesh(new THREE.CircleGeometry(R * .96, 28), new THREE.MeshStandardMaterial({ color: '#b5ecff', roughness: .05, emissive: '#3a90d0', emissiveIntensity: .45, side: THREE.DoubleSide }));
  g.add(surface);

  function step(dt, { ax = 0, az = 0, turn = 0, steady = false, calm = false, wobble = 0, gain = 1, noSpill = false }) {
    const k = steady || calm ? 24 : 12, c = steady ? 7 : calm ? 9 : 2.4, a = (steady ? .03 : .055) * gain;
    s.vx += (-k * s.tx - c * s.vx - ax * a + turn * .8 + (Math.random() - .5) * wobble) * dt;
    s.vz += (-k * s.tz - c * s.vz - az * a + (Math.random() - .5) * wobble) * dt;
    s.tx += s.vx * dt; s.tz += s.vz * dt;
    const tilt = Math.hypot(s.tx, s.tz), rimAllow = .26 + (1 - s.water) * .45;
    s.danger = Math.min(1, tilt / rimAllow);
    s.spillRate = noSpill ? 0 : Math.max(0, tilt - rimAllow) * .75;
    const lost = Math.min(s.water, s.spillRate * dt); s.water -= lost; return lost;
  }
  function kick(x, z) { s.vx += x; s.vz += z; }
  // world-space position + direction of the low side of the rim (where droplets leave)
  const tmp = new THREE.Vector3();
  function lip(out) {
    const len = Math.hypot(s.tx, s.tz) || 1;
    tmp.set(-s.tx / len * R, H / 2, s.tz / len * R); return g.localToWorld(out.copy(tmp));
  }
  function render(t, scale = 1) {
    g.scale.setScalar(scale);
    g.rotation.z = THREE.MathUtils.clamp(-s.tx * .8, -.7, .7); g.rotation.x = THREE.MathUtils.clamp(s.tz * .8, -.7, .7);
    const h = Math.max(.003, (H - .03) * s.water);
    body.scale.y = h; body.position.y = -H / 2 + .015 + h / 2; body.visible = s.water > .003;
    surface.position.y = -H / 2 + .016 + h; surface.visible = body.visible;
    surface.rotation.set(-Math.PI / 2 - g.rotation.x * 1.6 + Math.sin(t * 7) * .03 * s.danger, 0, -g.rotation.z * 1.6);
    waterMat.emissiveIntensity = .5 + s.danger * .6;
  }
  return { state: s, step, kick, render, lip, group: g };
}

// Droplets: pooled instanced spheres. They arc out of the rim and turn into puddles where they land.
export function createSplash(scene, onLand) {
  const N = 220, mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 6, 5), new THREE.MeshStandardMaterial({ color: '#5cc8ff', roughness: .1, emissive: '#1a6aa8', emissiveIntensity: .4 }), N);
  mesh.frustumCulled = false; scene.add(mesh);
  const p = Array.from({ length: N }, () => ({ life: 0, x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0 }));
  const m = new THREE.Matrix4(); let next = 0;
  function emit(pos, vel, n) {
    for (let i = 0; i < n; i++) { const d = p[next++ % N]; Object.assign(d, { life: 1.5, x: pos.x, y: pos.y, z: pos.z, vx: vel.x + (Math.random() - .5) * 1.4, vy: 1 + Math.random() * 1.8, vz: vel.z + (Math.random() - .5) * 1.4 }); }
  }
  function step(dt) {
    for (let i = 0; i < N; i++) {
      const d = p[i];
      if (d.life > 0) { d.life -= dt; d.vy -= 14 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; if (d.y <= .02) { d.life = 0; onLand?.(d.x, d.z); } }
      m.makeTranslation(d.x, d.life > 0 ? d.y : -9, d.z); mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { emit, step };
}
