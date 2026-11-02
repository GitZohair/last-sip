import * as THREE from 'three';

// Sky + animated sea around the island. Smooth analytic wave normals avoid per-frame CPU work.
export const SEA_Y = -1.7;

export function buildSea(scene, length) {
  const sky = new THREE.Color('#bfe6ee'); scene.background = sky; scene.fog.color = sky; scene.fog.near = 30; scene.fog.far = 110; scene.userData.fogFar = 110; scene.userData.outdoor = true;
  // Displace vertices and their normals together so broad highlights follow the waves.
  const mat = new THREE.MeshPhongMaterial({ color: '#32c4c3', specular: '#b9f4e9', shininess: 95 });
  const time = { value: 0 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = time;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(uTime * 1.2 + position.x * .25) * .12 + cos(uTime * .9 + position.y * .3) * .1;');
    sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(vec3(-cos(uTime * 1.2 + position.x * .25) * .03, sin(uTime * .9 + position.y * .3) * .03, 1.0));');
  };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(240, length + 180, 70, 70), mat);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, SEA_Y, -length / 2); sea.receiveShadow = true; scene.add(sea);
  sea.userData.update = t => { time.value = t; };
  scene.userData.sea = sea;
  return sea;
}
