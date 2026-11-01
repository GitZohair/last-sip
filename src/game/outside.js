import * as THREE from 'three';

// Sky + animated sea around the island. The sea is a flat-shaded wave plane (cheap, reads as stylized water).
export const SEA_Y = -1.7;

export function buildSea(scene, length) {
  const sky = new THREE.Color('#bfe6ee'); scene.background = sky; scene.fog.color = sky; scene.fog.near = 30; scene.fog.far = 110; scene.userData.fogFar = 110; scene.userData.outdoor = true;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(240, length + 180, 70, 70), new THREE.MeshStandardMaterial({ color: '#4fc6c2', roughness: .15, metalness: .1, flatShading: true }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, SEA_Y, -length / 2); sea.receiveShadow = true; scene.add(sea);
  const pos = sea.geometry.attributes.position, base = Float32Array.from(pos.array);
  sea.userData.update = t => {
    for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 1.2 + base[i * 3] * .25) * .12 + Math.cos(t * .9 + base[i * 3 + 1] * .3) * .1;
    pos.needsUpdate = true;
  };
  scene.userData.sea = sea;
  return sea;
}
