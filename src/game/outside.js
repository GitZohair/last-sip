import * as THREE from 'three';

// Sky + animated sea around the island. The sea is a flat-shaded wave plane (cheap, reads as stylized water).
export const SEA_Y = -1.7;

export function buildSea(scene, length) {
  const sky = new THREE.Color('#bfe6ee'); scene.background = sky; scene.fog.color = sky; scene.fog.near = 30; scene.fog.far = 110; scene.userData.fogFar = 110; scene.userData.outdoor = true;
  // waves run in the vertex shader (no per-frame CPU work or buffer upload); flatShading keeps the faceted look
  const mat = new THREE.MeshPhongMaterial({ color: '#4fc6c2', specular: '#d8fff8', shininess: 70, flatShading: true });
  const time = { value: 0 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = time;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(uTime * 1.2 + position.x * .25) * .12 + cos(uTime * .9 + position.y * .3) * .1;');
  };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(240, length + 180, 70, 70), mat);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, SEA_Y, -length / 2); sea.receiveShadow = true; scene.add(sea);
  sea.userData.update = t => { time.value = t; };
  scene.userData.sea = sea;
  return sea;
}
