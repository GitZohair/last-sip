import * as THREE from 'three';

// Renderer + lighting tuned for speed by default:
// - adaptive resolution (drops pixel ratio when frame time is high, restores when stable)
// - one shadowed sun that follows the player with a tight frustum, PCF (not PCFSoft)
// - two "follow lamps" instead of a point light per room (point lights are the main fragment cost)
export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  let ratio = Math.min(devicePixelRatio, 1.25);
  renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 60); camera.rotation.order = 'YXZ';
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  let scene, hemi, sun, lampA, lampB, flashlight;
  function reset() {
    scene = new THREE.Scene(); const bg = new THREE.Color('#2a2238'); scene.background = bg; scene.fog = new THREE.Fog(bg, 12, 34);
    hemi = new THREE.HemisphereLight('#ffe9d2', '#c9a58f', 1.8); scene.add(hemi);
    sun = new THREE.DirectionalLight('#ffd6a8', 2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); sun.shadow.normalBias = .03; scene.add(sun, sun.target);
    lampA = new THREE.PointLight('#ffcf9a', 6, 9, 1.6); lampB = new THREE.PointLight('#ffcf9a', 4, 9, 1.6); scene.add(lampA, lampB);
    if (flashlight) camera.remove(flashlight, flashlight.target);
    flashlight = new THREE.SpotLight('#fff3d6', 0, 14, .5, .6, 1.2); camera.add(flashlight, flashlight.target); flashlight.target.position.set(0, 0, -1); scene.add(camera);
    w.scene = scene; return scene;
  }
  let acc = 0, frames = 0;
  function adapt(dt) { // every ~1s, compare average frame time
    acc += dt; frames++; if (acc < 1) return;
    const avg = acc / frames; acc = 0; frames = 0;
    const next = avg > 1 / 45 ? Math.max(.6, ratio - .15) : avg < 1 / 58 ? Math.min(devicePixelRatio, 1.25, ratio + .1) : ratio;
    if (Math.abs(next - ratio) > .01) { ratio = next; renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight); }
  }
  const disco = new THREE.Color();
  function light(player, dt, { dark, discoOn, fogOn }) {
    sun.position.set(player.pos.x + 5, 11, player.pos.z + 4); sun.target.position.set(player.pos.x, 0, player.pos.z - 3);
    lampA.position.set(player.pos.x, 2.5, player.pos.z - 3); lampB.position.set(player.pos.x, 2.5, player.pos.z + 3);
    const k = Math.min(1, dt * 6), lit = dark ? 0 : 1;
    hemi.intensity += (1.8 * lit + .03 - hemi.intensity) * k; sun.intensity += (2 * lit - sun.intensity) * k;
    lampA.intensity += (6 * lit - lampA.intensity) * k; lampB.intensity += (4 * lit - lampB.intensity) * k;
    flashlight.intensity = dark ? 30 : 0;
    if (discoOn) { disco.setHSL((performance.now() / 600) % 1, .9, .55); lampA.color.copy(disco); hemi.color.copy(disco); } else { lampA.color.set('#ffcf9a'); hemi.color.set('#ffe9d2'); }
    scene.fog.far += ((fogOn ? 7 : 34) - scene.fog.far) * k; scene.fog.near = Math.min(12, scene.fog.far * .3);
  }
  const w = { renderer, camera, scene: null, adapt, light, reset };
  return w;
}
