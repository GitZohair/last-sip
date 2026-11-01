import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Optional bloom for fast GPUs (?fx=1). Loaded on demand so the default build stays light.
export function createPostFx(renderer, camera) {
  const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target), pass = new RenderPass(new THREE.Scene(), camera);
  composer.addPass(pass); composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .3, .55, .85)); composer.addPass(new OutputPass());
  return {
    setScene: s => { pass.scene = s; },
    setSize: (w, h, r) => { composer.setPixelRatio(r); composer.setSize(w, h); },
    render: () => composer.render(),
  };
}
