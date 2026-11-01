import * as THREE from 'three';

// Room shell: floor, walls with door gaps, colliders. Coordinates: course runs toward -z.
// Collider = {minX,maxX,minZ,maxZ,top} (axis-aligned; top = height you can stand on).
export function makeShell(scene) {
  const colliders = [];
  const wallMat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .9 });
  const add = (mesh) => { mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh; };

  function solid(cx, cz, w, d, h, mat, y = 0) {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(cx, y + h / 2, cz);
    colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, top: y + h });
    return m;
  }
  function floor(cx, cz, w, d, map) {
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, roughness: .75 })));
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0, cz); m.castShadow = false;
    return m;
  }
  // Wall across x at z, spanning [x0,x1], with an optional door gap centred at doorX.
  function crossWall(z, x0, x1, color, doorX = null, door = 1.8) {
    const mat = wallMat(color), H = 2.8, T = .2;
    if (doorX === null) return solid((x0 + x1) / 2, z, x1 - x0, T, H, mat);
    const a = doorX - door / 2, b = doorX + door / 2;
    if (a > x0) solid((x0 + a) / 2, z, a - x0, T, H, mat);
    if (x1 > b) solid((b + x1) / 2, z, x1 - b, T, H, mat);
    const lintel = add(new THREE.Mesh(new THREE.BoxGeometry(door, .5, T), mat)); lintel.position.set(doorX, H - .25, z);
  }
  function sideWall(x, z0, z1, color) { solid(x, (z0 + z1) / 2, .2, Math.abs(z1 - z0), 2.8, wallMat(color)); }
  // Furniture collider from an Object3D's world bounds (shrunk slightly so it feels fair).
  function fromObject(obj, shrink = .05) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    const c = { minX: b.min.x + shrink, maxX: b.max.x - shrink, minZ: b.min.z + shrink, maxZ: b.max.z - shrink, top: b.max.y, obj };
    colliders.push(c); return c;
  }
  return { colliders, solid, floor, crossWall, sideWall, fromObject };
}

// Circle-vs-AABB push-out for the player. Returns the standing height under the player.
export function collide(pos, radius, y, colliders, base = 0) {
  let ground = base; // base < 0 over pits (water, trapdoors)
  for (const c of colliders) {
    if (c.disabled) continue;
    const nx = Math.max(c.minX, Math.min(pos.x, c.maxX)), nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - nx, dz = pos.z - nz, d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (y >= c.top - .12) { ground = Math.max(ground, c.top); continue; } // standing on it
    if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (radius - d) / d; pos.x += dx * k; pos.z += dz * k; }
    else { // centre inside box: push out along the shortest axis
      const opts = [[c.minX - radius - pos.x, 0], [c.maxX + radius - pos.x, 0], [0, c.minZ - radius - pos.z], [0, c.maxZ + radius - pos.z]];
      opts.sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1])); pos.x += opts[0][0]; pos.z += opts[0][1];
    }
  }
  return ground;
}
