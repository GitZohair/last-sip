import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Third-person streamer avatar: RobotExpressive (CC0, three.js examples) with animations
// Idle / Walking / Running / Jump / Death / Sitting / Dance / No / ThumbsUp / Wave.
// The glass is held out in front at chest height (`holder`). The body leans with the slosh.
let srcPromise = null;
const HEIGHT = 1.45;

export async function createCharacter(scene) {
  srcPromise ??= new GLTFLoader().loadAsync('/assets/characters/robot.glb');
  const gltf = await srcPromise;
  const model = skeletonClone(gltf.scene);
  const s = HEIGHT / 4.4; // RobotExpressive is ~4.4 units tall (skinned bbox is unreliable)
  model.scale.setScalar(s); model.rotation.y = Math.PI; // model faces +z; our forward is -z
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
  const root = new THREE.Group(); const lean = new THREE.Group(); lean.add(model); root.add(lean); scene.add(root);
  const holder = new THREE.Group(); holder.position.set(.32, HEIGHT * 1.02, -.18); holder.scale.setScalar(1.5); lean.add(holder); // waiter pose: glass up by the right shoulder, always visible

  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(gltf.animations.map(a => [a.name, mixer.clipAction(a)]));
  for (const n of ['Jump', 'Death', 'Sitting', 'No', 'ThumbsUp', 'Wave', 'Yes']) if (actions[n]) { actions[n].setLoop(THREE.LoopOnce); actions[n].clampWhenFinished = true; }
  let current = actions.Idle; current.play();
  let oneShot = 0;
  function play(name, fade = .18) {
    const next = actions[name]; if (!next || next === current) return;
    next.reset().fadeIn(fade).play(); current.fadeOut(fade); current = next;
  }
  // emote: short one-shot reaction (spill → "No", help → "ThumbsUp"), then back to locomotion
  function emote(name, seconds = 1) { play(name, .1); oneShot = seconds; }

  function update(dt, player, slosh, state) {
    root.position.set(player.pos.x, player.y, player.pos.z); root.rotation.y = -player.yaw;
    lean.rotation.z = THREE.MathUtils.lerp(lean.rotation.z, -slosh.tx * .5, .2); lean.rotation.x = THREE.MathUtils.lerp(lean.rotation.x, slosh.tz * .35, .2);
    if (state === 'done-win') play('Dance'); else if (state === 'done-fail') play('Death');
    else if ((oneShot -= dt) > 0) { /* hold reaction */ }
    else if (!player.grounded) play('Jump', .08);
    else { const v = Math.hypot(player.vel.x, player.vel.z); play(v > 3.6 ? 'Running' : v > .4 ? 'Walking' : 'Idle'); current.timeScale = v > .4 ? Math.max(.6, v / (v > 3.6 ? 5 : 2.4)) : 1; }
    mixer.update(dt);
  }
  return { root, holder, update, emote, play, dispose: () => scene.remove(root) };
}

// Over-the-shoulder chase camera. Pulls in when a wall is between camera and player (cheap ray vs AABB colliders).
export function createChaseCam(camera) {
  const target = new THREE.Vector3(), want = new THREE.Vector3();
  let dist = 3.2;
  return function update(dt, player, colliders, eye = 1.6, roll = 0, shake = 0) {
    const back = 3.2, height = .9 + Math.max(0, player.pitch) * 1.8;
    target.set(player.pos.x + Math.cos(player.yaw) * .45, player.y + eye * .85, player.pos.z + Math.sin(player.yaw) * .45); // over the right shoulder
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
