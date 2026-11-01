import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Merge every static mesh under `group` into a handful of big meshes (one per material per chunk of the
// map). Hundreds of Kenney pieces become ~20 draw calls, and the shadow pass shrinks the same way.
// Chunks keep frustum culling useful along the long island.
export function bake(group, chunk = 24) {
  group.updateMatrixWorld(true);
  const buckets = new Map(), done = [];
  group.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.dynamic) return;
    const g = o.geometry, attrs = Object.keys(g.attributes).sort().join();
    const z = Math.floor(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).z / chunk);
    const key = [o.material.uuid, attrs, !!g.index, o.castShadow, o.receiveShadow, z].join('|');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
    const c = g.clone(); c.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(c.morphAttributes)) delete c.morphAttributes[k];
    buckets.get(key).geos.push(c); done.push(o);
  });
  for (const o of done) o.removeFromParent();
  group.clear();
  let calls = 0;
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    for (const g of b.geos) g.dispose();
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.matrixAutoUpdate = false;
    group.add(m); calls++;
  }
  group.position.set(0, 0, 0); group.rotation.set(0, 0, 0); group.scale.setScalar(1); group.updateMatrixWorld(true);
  return calls;
}
