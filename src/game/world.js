import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Vignette + gentle warm grade (the "toy diorama" look of the reference games).
const Grade = { uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; float v = smoothstep(.85, .25, length(d * vec2(1.1, 1.))); c.rgb *= mix(.72, 1.04, v); c.rgb = mix(c.rgb, c.rgb * vec3(1.04, 1.0, .95), .6); gl_FragColor = c; }' };

// Renderer + lighting tuned for speed by default:
// - adaptive resolution (drops pixel ratio when frame time is high, restores when stable)
// - one shadowed sun that follows the player with a tight frustum, PCF (not PCFSoft)
// - two "follow lamps" instead of a point light per room (point lights are the main fragment cost)
export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  let ratio = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 60); camera.rotation.order = 'YXZ';
  const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target), renderPass = new RenderPass(new THREE.Scene(), camera);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .32, .55, .82);
  composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new ShaderPass(Grade)); composer.addPass(new OutputPass());
  let fx = true;
  const resize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setPixelRatio(ratio); composer.setSize(innerWidth, innerHeight); };
  addEventListener('resize', resize);

  let scene, hemi, sun, lampA, lampB, flashlight;
  function reset() {
    if (scene) { // free the previous run's GPU buffers (cached models re-upload on next use)
      scene.traverse(o => { o.geometry?.dispose(); for (const m of [o.material].flat()) if (m) { m.map?.dispose(); m.dispose(); } });
      renderer.renderLists.dispose();
    }
    scene = new THREE.Scene(); const bg = new THREE.Color('#2a2238'); scene.background = bg; scene.fog = new THREE.Fog(bg, 12, 34);
    hemi = new THREE.HemisphereLight('#ffe9d2', '#c9a58f', 1.8); scene.add(hemi);
    sun = new THREE.DirectionalLight('#ffd6a8', 2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); sun.shadow.normalBias = .03; scene.add(sun, sun.target);
    lampA = new THREE.PointLight('#ffcf9a', 6, 9, 1.6); lampB = new THREE.PointLight('#ffcf9a', 4, 9, 1.6); scene.add(lampA, lampB);
    if (flashlight) camera.remove(flashlight, flashlight.target);
    flashlight = new THREE.SpotLight('#fff3d6', 0, 14, .5, .6, 1.2); camera.add(flashlight, flashlight.target); flashlight.target.position.set(0, 0, -1); scene.add(camera);
    renderPass.scene = scene; w.scene = scene; return scene;
  }
  let acc = 0, frames = 0;
  function adapt(dt) { // every ~1s, compare average frame time
    acc += dt; frames++; if (acc < 1) return;
    const avg = acc / frames; acc = 0; frames = 0;
    if (avg > 1 / 40 && ratio <= 1.01) fx = false; // last resort on slow GPUs: drop post FX
    const next = avg > 1 / 45 ? Math.max(1, ratio - .15) : avg < 1 / 58 ? Math.min(devicePixelRatio, 1.5, ratio + .1) : ratio;
    if (Math.abs(next - ratio) > .01) { ratio = next; renderer.setPixelRatio(ratio); resize(); }
  }
  const disco = new THREE.Color();
  function light(player, dt, { dark, discoOn, fogOn }) {
    sun.position.set(player.pos.x + 5, 11, player.pos.z + 4); sun.target.position.set(player.pos.x, 0, player.pos.z - 3);
    lampA.position.set(player.pos.x, 2.5, player.pos.z - 3); lampB.position.set(player.pos.x, 2.5, player.pos.z + 3);
    const k = Math.min(1, dt * 6), lit = dark ? 0 : 1, out = scene.userData.outdoor, sunI = out ? 3.4 : 2, lampI = out ? 0 : 1;
    if (out && !hemi.userData.out) { hemi.userData.out = true; hemi.color.set('#e4f6ff'); hemi.groundColor.set('#f1d9a8'); sun.color.set('#fff1d6'); }
    hemi.intensity += (1.8 * lit + .03 - hemi.intensity) * k; sun.intensity += (sunI * lit - sun.intensity) * k;
    lampA.intensity += (6 * lit * lampI - lampA.intensity) * k; lampB.intensity += (4 * lit * lampI - lampB.intensity) * k;
    flashlight.intensity = dark ? 30 : 0;
    if (discoOn) { disco.setHSL((performance.now() / 600) % 1, .9, .55); lampA.color.copy(disco); hemi.color.copy(disco); } else { lampA.color.set('#ffcf9a'); hemi.color.set(out ? '#e4f6ff' : '#ffe9d2'); }
    scene.fog.far += ((fogOn ? 7 : scene.userData.fogFar || 34) - scene.fog.far) * k; scene.fog.near = Math.min(12, scene.fog.far * .3);
  }
  const render = () => fx ? composer.render() : renderer.render(scene, camera);
  const w = { renderer, camera, scene: null, adapt, light, reset, render };
  return w;
}
