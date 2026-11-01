import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Third-person streamer avatar: a Kenney Mini Character (CC0) with its own clips
// (idle / walk / sprint / jump / fall / die / emote-yes / emote-no / holding-right ...).
// The drink is held out in the RIGHT HAND like a waiter, beside the body, so the chase camera always sees it.
// The right arm is driven only by the 'holding-right' pose; locomotion clips have their arm-right tracks removed.
const CHAR = new URLSearchParams(location.search).get('char') || 'character-female-b';
const SCALE = 1.75;
let srcPromise = null;
const NAMES = { ThumbsUp: 'emote-yes', Yes: 'emote-yes', No: 'emote-no', Death: 'die', Dance: 'emote-yes', Wave: 'emote-yes' };

export async function createCharacter(scene) {
  srcPromise ??= new GLTFLoader().loadAsync(`/assets/kenney/mini-characters/${CHAR}.glb`);
  const gltf = await srcPromise;
  const model = skeletonClone(gltf.scene);
  model.scale.setScalar(SCALE); model.rotation.y = Math.PI; // model faces +z; our forward is -z
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
  const root = new THREE.Group(); const lean = new THREE.Group(); lean.add(model); root.add(lean); scene.add(root);
  const arm = model.getObjectByName('arm-right');
  // the glass follows the hand's POSITION but stays upright (only the body lean/slosh tilts it)
  const holder = new THREE.Group(); lean.add(holder); holder.scale.setScalar(1.4);
  const hand = new THREE.Vector3(), HAND = new THREE.Vector3(-.19, .02, 0); // the fist, in arm-bone space (the arm points along -x)

  const mixer = new THREE.AnimationMixer(model);
  const clip = name => gltf.animations.find(a => a.name === name);
  const noArm = c => { const k = c.clone(); k.tracks = k.tracks.filter(t => !t.name.startsWith('arm-right')); return k; };
  const actions = {};
  for (const a of gltf.animations) actions[a.name] = mixer.clipAction(a.name === 'holding-right' ? a : noArm(a));
  for (const n of ['jump', 'die', 'emote-yes', 'emote-no', 'pick-up']) if (actions[n]) { actions[n].setLoop(THREE.LoopOnce); actions[n].clampWhenFinished = true; }
  if (actions['holding-right']) actions['holding-right'].play(); // always: the arm holds the drink out
  let current = actions.idle; current.play();
  let oneShot = 0;
  function play(name, fade = .18) {
    const next = actions[NAMES[name] || name]; if (!next || next === current) return;
    next.reset().fadeIn(fade).play(); current.fadeOut(fade); current = next;
  }
  function emote(name, seconds = 1) { play(name, .1); oneShot = seconds; }

  function update(dt, player, slosh, state) {
    root.position.set(player.pos.x, player.y, player.pos.z); root.rotation.y = -player.yaw;
    lean.rotation.z = THREE.MathUtils.lerp(lean.rotation.z, -slosh.tx * .5, .2); lean.rotation.x = THREE.MathUtils.lerp(lean.rotation.x, slosh.tz * .35, .2);
    if (state === 'done-win') play('emote-yes'); else if (state === 'done-fail') play('die');
    else if ((oneShot -= dt) > 0) { /* hold reaction */ }
    else if (player.swimming) { play('fall', .2); current.timeScale = .6; }
    else if (!player.grounded) play(player.vy > 0 ? 'jump' : 'fall', .08);
    else { const v = Math.hypot(player.vel.x, player.vel.z); play(v > 3.6 ? 'sprint' : v > .4 ? 'walk' : 'idle'); current.timeScale = v > .4 ? Math.max(.7, v / (v > 3.6 ? 4.6 : 2.6)) : 1; }
    mixer.update(dt);
    if (arm) { root.updateMatrixWorld(true); hand.copy(HAND).applyMatrix4(arm.matrixWorld); lean.worldToLocal(hand); holder.position.copy(hand).add({ x: .16, y: .2, z: -.1 }); }
  }
  return { root, holder, HAND, update, emote, play, dispose: () => scene.remove(root) };
}

// Over-the-shoulder chase camera. Pulls in when a wall is between camera and player (cheap ray vs AABB colliders).
export function createChaseCam(camera) {
  const target = new THREE.Vector3(), want = new THREE.Vector3();
  let dist = 3.4;
  return function update(dt, player, colliders, eye = 1.6, roll = 0, shake = 0) {
    const back = 3.4, height = .95 + Math.max(0, player.pitch) * 1.8;
    target.set(player.pos.x + Math.cos(player.yaw) * .8, player.y + eye * .7, player.pos.z + Math.sin(player.yaw) * .8); // well over the right shoulder: the drink (right hand) stays in view
    const dx = -Math.sin(player.yaw), dz = Math.cos(player.yaw);
    // shortest hit along the boom against walls/furniture taller than the camera ray
    let maxD = back;
    for (const c of colliders) {
      if (c.top < target.y + .2) continue;
      for (let d = .4; d < maxD; d += .25) { const x = target.x + dx * d, z = target.z + dz * d; if (x > c.minX - .15 && x < c.maxX + .15 && z > c.minZ - .15 && z < c.maxZ + .15) { maxD = d; break; } }
    }
    dist += (Math.max(.6, maxD - .2) - dist) * Math.min(1, dt * (maxD < dist ? 20 : 4));
    // as walls pull the boom in, rise over the head so the robot never fills the screen
    const squeeze = 1 - dist / back;
    want.set(target.x + dx * dist, Math.min(2.65, target.y + height * dist / back + squeeze * 1.25), target.z + dz * dist);
    camera.position.lerp(want, Math.min(1, dt * 14));
    camera.position.x += (Math.random() - .5) * shake; camera.position.y += (Math.random() - .5) * shake;
    camera.lookAt(target.x - dx * (1.5 + squeeze * 2), target.y + .1 - squeeze * .6 - player.pitch * 1.2, target.z - dz * (1.5 + squeeze * 2));
    camera.rotateZ(roll);
  };
}
