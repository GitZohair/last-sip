import * as THREE from 'three';

// Renderer tuned for laptop iGPUs (measured on Intel UHD 620, where cost is per pixel, not per object):
// - direct render with MSAA, no post-processing passes (the vignette is a CSS overlay, free)
// - exactly two lights (sky hemi + one shadowed sun that follows the player); every extra light,
//   even at intensity 0, costs every pixel
// - adaptive resolution: drops pixel ratio when frames run long, restores when stable (never below 1)
// Add ?fx=1 for bloom on fast machines.
const wantFx = new URLSearchParams(location.search).get('fx') === '1';

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  const maxRatio = Math.min(devicePixelRatio, 1.5);
  let ratio = Math.min(devicePixelRatio, 1.25);
  renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 90); camera.rotation.order = 'YXZ';
  let composer = null;
  if (wantFx) import('./postfx.js').then(m => { composer = m.createPostFx(renderer, camera); composer.setScene(scene); });
  let fixedSize = null; // film capture: render at an exact size (e.g. 1920x1080) whatever the window is
  const resize = () => { const [W, H] = fixedSize || [innerWidth, innerHeight]; camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.setSize(W, H, !fixedSize); composer?.setSize(W, H, ratio); };
  addEventListener('resize', resize);

  let scene, hemi, sun;
  function reset() {
    if (scene) { // free the previous run's GPU buffers (cached models re-upload on next use)
      scene.traverse(o => { o.geometry?.dispose(); for (const m of [o.material].flat()) if (m) { m.map?.dispose(); m.dispose(); } });
      renderer.renderLists.dispose();
    }
    scene = new THREE.Scene(); const bg = new THREE.Color('#bfe6ee'); scene.background = bg; scene.fog = new THREE.Fog(bg, 30, 110);
    hemi = new THREE.HemisphereLight('#e4f6ff', '#f1d9a8', 1.8); scene.add(hemi);
    sun = new THREE.DirectionalLight('#fff1d6', 3.4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 34 }); sun.shadow.normalBias = .03; scene.add(sun, sun.target);
    scene.add(camera); composer?.setScene(scene);
    w.scene = scene; return scene;
  }
  let acc = 0, frames = 0, calm = 0;
  function adapt(dt) { // every ~1s, compare average frame time
    if (fixedSize) return; acc += dt; frames++; if (acc < 1) return;
    const avg = acc / frames; acc = 0; frames = 0;
    if (avg > 1 / 40 && ratio <= 1.01 && composer) composer = null; // slow GPU: drop bloom
    calm = avg < 1 / 57 ? calm + 1 : 0;
    const next = avg > 1 / 50 ? Math.max(1, ratio - .15) : calm > 3 ? Math.min(maxRatio, ratio + .1) : ratio;
    if (Math.abs(next - ratio) > .01) { ratio = next; calm = 0; renderer.setPixelRatio(ratio); resize(); }
  }
  const disco = new THREE.Color();
  function light(player, dt, { dark, discoOn, fogOn }) {
    sun.position.set(player.pos.x + 5, 12, player.pos.z + 4); sun.target.position.set(player.pos.x, 0, player.pos.z - 3);
    const k = Math.min(1, dt * 6), lit = dark ? .12 : 1;
    hemi.intensity += (1.8 * lit - hemi.intensity) * k; sun.intensity += (3.4 * lit - sun.intensity) * k;
    if (discoOn) { disco.setHSL((performance.now() / 600) % 1, .9, .6); hemi.color.copy(disco); } else hemi.color.set('#e4f6ff');
    scene.fog.far += ((fogOn ? 9 : scene.userData.fogFar || 110) - scene.fog.far) * k; scene.fog.near = Math.min(30, scene.fog.far * .3);
  }
  const render = () => composer ? composer.render() : renderer.render(scene, camera);
  const w = { renderer, camera, scene: null, adapt, light, reset, render,
    fixed(W, H) { fixedSize = W ? [W, H] : null; ratio = W ? 1 : Math.min(devicePixelRatio, 1.25); renderer.setPixelRatio(ratio); resize(); },
    shadowSpan(n = 10) { Object.assign(sun.shadow.camera, { left: -n, right: n, top: n, bottom: -n, far: 34 + n }); sun.shadow.camera.updateProjectionMatrix(); } };
  return w;
}
