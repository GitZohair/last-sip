import * as THREE from 'three';

// Smooth stylized island scenery (no textures needed): curved palms, rocks, lifeguard towers.
const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
const bark = M('#9a6b43'), leaf = M('#3f9a4a'), leafDark = M('#2f7f3c'), nut = M('#5b3a22'), rockM = M('#a7adb0'), white = M('#f6f1e7'), red = M('#e8505b');
const cast = m => { m.castShadow = true; m.receiveShadow = true; return m; };

export function palm(scene, x, z, h = 5, lean = .25, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  let px = 0, py = 0; const segs = 6;
  for (let i = 0; i < segs; i++) {
    const k = i / segs, seg = cast(new THREE.Mesh(new THREE.CylinderGeometry(.16 - k * .05, .2 - k * .05, h / segs + .05, 10), bark));
    const nx = Math.pow((i + 1) / segs, 2) * lean * h; seg.position.set((px + nx) / 2, py + h / segs / 2, 0); seg.rotation.z = -Math.atan2(nx - px, h / segs);
    g.add(seg); px = nx; py += h / segs;
  }
  for (let j = 0; j < 7; j++) { // each frond: a flattened cone on a pivot, pointing out and drooping
    const pivot = new THREE.Group(); pivot.position.set(px, py - .1, 0); pivot.rotation.y = j / 7 * Math.PI * 2; g.add(pivot);
    const l = cast(new THREE.Mesh(new THREE.ConeGeometry(.42, 2.8, 6), j % 2 ? leaf : leafDark));
    l.scale.set(1, 1, .2); l.rotation.z = -Math.PI / 2 - .45 - (j % 3) * .12; l.position.set(1.25, -.45, 0); pivot.add(l);
  }
  for (let j = 0; j < 3; j++) { const c = cast(new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), nut)); c.position.set(px + Math.cos(j * 2.1) * .25, py - .3, Math.sin(j * 2.1) * .25); g.add(c); }
  scene.add(g); return g;
}

export function rock(scene, x, z, s = 1, y = -.4) {
  const m = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), rockM)); m.position.set(x, y, z); m.scale.set(1, .6, 1.2); m.rotation.y = x * 3.1; scene.add(m); return m;
}

// Lifeguard tower: a perch for viewer SNIPERS. Returns the perch point.
export function tower(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  for (const [dx, dz] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) { const p = cast(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 5.2, 8), white)); p.position.set(dx, 1.1, dz); g.add(p); }
  const deck = cast(new THREE.Mesh(new THREE.BoxGeometry(2.1, .15, 2.1), white)); deck.position.y = 3.2; g.add(deck);
  for (const [w, d, dx, dz] of [[2.1, .06, 0, 1.05], [2.1, .06, 0, -1.05], [.06, 2.1, 1.05, 0], [.06, 2.1, -1.05, 0]]) { const rail = cast(new THREE.Mesh(new THREE.BoxGeometry(w, .45, d), red)); rail.position.set(dx, 3.5, dz); g.add(rail); }
  const roof = cast(new THREE.Mesh(new THREE.ConeGeometry(1.7, 1, 4), red)); roof.position.y = 4.9; roof.rotation.y = Math.PI / 4; g.add(roof);
  const base = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 2, 10), rockM)); base.position.y = -1.5; g.add(base);
  scene.add(g); return { x, z, y: 3.3 };
}
