import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Third-person streamer avatar: a Kenney Mini Character (CC0) with its own clips
// (idle / walk / sprint / jump / fall / die / emote-yes / emote-no / holding-right ...).
// The drink is held out in the RIGHT HAND like a waiter, beside the body, so the chase camera always sees it.
// The right arm is driven only by the 'holding-right' pose; locomotion clips have their arm-right tracks removed.
// THE STREAMER: a big, chunky low-poly guy (wide torso, thick legs) with a gaming headset, built on male-b.
const CHAR = new URLSearchParams(location.search).get('char') || 'character-male-b';
const BULK = { torso: [1.55, 1.12, 1.5], legs: [1.35, 1, 1.35] };
function headset(head, model) {
  // fit to the head mesh: its bind-pose box (model space) relative to the head bone
  model.updateMatrixWorld(true);
  const hm = model.getObjectByName('head-mesh'); hm.geometry.computeBoundingBox();
  const box = hm.geometry.boundingBox.clone(), hp = new THREE.Vector3(); head.getWorldPosition(hp); model.worldToLocal(hp);
  const w = box.max.x - box.min.x, top = box.max.y - hp.y, cy = (box.min.y + box.max.y) / 2 - hp.y, cz = (box.min.z + box.max.z) / 2 - hp.z;
  const black = new THREE.MeshLambertMaterial({ color: '#2b2838' }), accent = new THREE.MeshLambertMaterial({ color: '#a970ff' });
  const g = new THREE.Group(); g.position.set(0, 0, cz);
  const band = new THREE.Mesh(new THREE.TorusGeometry(w / 2 + .012, .014, 6, 18, Math.PI), black); band.position.y = cy; band.scale.y = (top - cy + .015) / (w / 2 + .012); g.add(band);
  for (const sx of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .04, 14).rotateZ(Math.PI / 2), accent); cup.position.set(sx * (w / 2 + .012), cy, 0); g.add(cup); const ring = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .044, 12).rotateZ(Math.PI / 2), black); ring.position.copy(cup.position).x += sx * .004; g.add(ring); }
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .11, 6).rotateX(Math.PI / 2), black); boom.position.set(w / 2 + .01, cy - .04, .06); boom.rotation.y = -.35; g.add(boom);
  const mic = new THREE.Mesh(new THREE.SphereGeometry(.016, 8, 6), accent); mic.position.set(w / 2 - .01, cy - .045, .115); g.add(mic);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); head.add(g);
}
const SCALE = 1.75;
let srcPromise = null;
const NAMES = { ThumbsUp: 'emote-yes', Yes: 'emote-yes', No: 'emote-no', Death: 'die', Dance: 'emote-yes', Wave: 'emote-yes' };

export async function createCharacter(scene) {
  srcPromise ??= new GLTFLoader().loadAsync(`/assets/kenney/mini-characters/${CHAR}.glb`);
  const gltf = await srcPromise;
  const model = skeletonClone(gltf.scene);
  const bone = n => model.getObjectByName(n);
  if (!new URLSearchParams(location.search).has('char')) headset(bone('head'), model);
  model.scale.setScalar(SCALE); model.rotation.y = Math.PI; // model faces +z; our forward is -z
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
  const root = new THREE.Group(); const lean = new THREE.Group(); lean.add(model); root.add(lean); scene.add(root);
  const arm = model.getObjectByName('arm-right');
  // the glass follows the hand's POSITION but stays upright (only the body lean/slosh tilts it)
  const holder = new THREE.Group(); lean.add(holder); holder.scale.setScalar(1.4);
  const hand = new THREE.Vector3(), HAND = new THREE.Vector3(-.19, .02, 0); // the fist, in arm-bone space (the arm points along -x)

  const mixer = new THREE.AnimationMixer(model);
  const clip = name => gltf.animations.find(a => a.name === name);
  // scale tracks are dropped so the chunky build (set once below) isn't overwritten every frame
  const noScale = c => { const k = c.clone(); k.tracks = k.tracks.filter(t => !t.name.endsWith('.scale')); return k; };
  const noArm = c => { const k = noScale(c); k.tracks = k.tracks.filter(t => !t.name.startsWith('arm-right')); return k; };
  const actions = {};
  for (const a of gltf.animations) actions[a.name] = mixer.clipAction(a.name === 'holding-right' ? noScale(a) : noArm(a));
  if (!new URLSearchParams(location.search).has('char')) { // chunky build: wide torso, head/arms counter-scaled so only the body bulks up
    const [tx, ty, tz] = BULK.torso; bone('torso').scale.set(tx, ty, tz);
    bone('head').scale.set(1.1 / tx, 1.1 / ty, 1.1 / tz); for (const n of ['arm-left', 'arm-right']) bone(n).scale.set(1.2 / tx, 1.05 / ty, 1.2 / tz);
    for (const n of ['leg-left', 'leg-right']) bone(n).scale.set(...BULK.legs);
  }
  for (const n of ['jump', 'die', 'emote-yes', 'emote-no', 'pick-up']) if (actions[n]) { actions[n].setLoop(THREE.LoopOnce); actions[n].clampWhenFinished = true; }
  if (actions['holding-right']) actions['holding-right'].play(); // always: the arm holds the drink out
  let current = actions.idle; current.play();
  let oneShot = 0;
  function play(name, fade = .18) {
    const next = actions[NAMES[name] || name]; if (!next || next === current) return;
    next.reset().fadeIn(fade).play(); current.fadeOut(fade); current = next;
  }
  function emote(name, seconds = 1) { play(name, .1); oneShot = seconds; }
  // KNOCKDOWNS: 'flat' = pancaked by something landing on you, 'fall' = tipped over backwards. Then you pop back up.
  let knockKind = null, knockT = 0, knockLen = 1;
  function knock(kind, seconds = 1) { knockKind = kind; knockT = knockLen = seconds; }

  function update(dt, player, slosh, state) {
    root.position.set(player.pos.x, player.y, player.pos.z); root.rotation.y = -player.yaw;
    lean.rotation.z = THREE.MathUtils.lerp(lean.rotation.z, -slosh.tx * .5, .2); lean.rotation.x = THREE.MathUtils.lerp(lean.rotation.x, slosh.tz * .35, .2);
    lean.scale.set(1, 1, 1);
    if (knockT > 0) {
      knockT -= dt; const k = 1 - knockT / knockLen; // 0 → 1 over the knockdown
      if (knockKind === 'flat') { // squash fast, hold, spring back with an overshoot
        const sq = k < .1 ? k / .1 : k < .7 ? 1 : Math.max(0, 1 - (k - .7) / .3), boing = k > .7 ? Math.sin((k - .7) / .3 * Math.PI) * .25 : 0;
        lean.scale.set(1 + sq * .45, 1 - sq * .7 + boing, 1 + sq * .45);
      } else { // tip over backwards, lie there a beat, get back up
        const tip = k < .2 ? k / .2 : k < .65 ? 1 : Math.max(0, 1 - (k - .65) / .35);
        lean.rotation.x = -tip * 1.35; lean.position.y = tip * .25;
      }
    } else lean.position.y = 0;
    if (state === 'done-win') play('emote-yes'); else if (state === 'done-fail') play('die');
    else if ((oneShot -= dt) > 0) { /* hold reaction */ }
    else if (player.swimming) { play('fall', .2); current.timeScale = .6; }
    else if (!player.grounded) play(player.vy > 0 ? 'jump' : 'fall', .08);
    else { const v = Math.hypot(player.vel.x, player.vel.z); play(v > 3.6 ? 'sprint' : v > .4 ? 'walk' : 'idle'); current.timeScale = v > .4 ? Math.max(.7, v / (v > 3.6 ? 4.6 : 2.6)) : 1; }
    mixer.update(dt);
    if (arm) { root.updateMatrixWorld(true); hand.copy(HAND).applyMatrix4(arm.matrixWorld); lean.worldToLocal(hand); holder.position.copy(hand).add({ x: .16, y: .2, z: -.1 }); }
  }
  return { root, holder, HAND, update, emote, play, knock, get down() { return knockT > 0; }, dispose: () => scene.remove(root) };
}

// Over-the-shoulder chase camera. Pulls in when a wall is between camera and player (cheap ray vs AABB colliders).
export function createChaseCam(camera) {
  const target = new THREE.Vector3(), want = new THREE.Vector3();
  let dist = 3.4;
  const look = new THREE.Vector3(); let init = false;
  return function update(dt, player, colliders, eye = 1.6, roll = 0, shake = 0) {
    const tw = player.towerH || 0, yaw = player.camYaw ?? player.yaw, back = 5.4 + tw * 1.1, height = 1.55 + tw * .55 + Math.max(0, player.pitch) * 2; // a tall tower pulls the camera back so you can see it lean
    // a wider, higher view: the streamer, the tray and the boards ahead all fit; a little to the right so the tray stays clear
    target.set(player.pos.x + Math.cos(yaw) * .45, Math.max(player.y, -1.5) + eye * .75, player.pos.z + Math.sin(yaw) * .45);
    const dx = -Math.sin(yaw), dz = Math.cos(yaw);
    // shortest hit along the boom against walls/furniture taller than the camera ray
    let maxD = back;
    for (const c of colliders) {
      if (c.top < target.y + .2) continue;
      for (let d = .4; d < maxD; d += .25) { const x = target.x + dx * d, z = target.z + dz * d; if (x > c.minX - .15 && x < c.maxX + .15 && z > c.minZ - .15 && z < c.maxZ + .15) { maxD = d; break; } }
    }
    dist += (Math.max(.6, maxD - .2) - dist) * Math.min(1, dt * (maxD < dist ? 20 : 4));
    // as walls pull the boom in, rise over the head so the robot never fills the screen
    const squeeze = 1 - dist / back;
    want.set(target.x + dx * dist, Math.min(3.6 + tw * .8, target.y + height * dist / back + squeeze * 1.25), target.z + dz * dist);
    if (!init) { camera.position.copy(want); init = true; }
    camera.position.lerp(want, Math.min(1, dt * 7)); // softer follow: less rigid
    camera.position.x += (Math.random() - .5) * shake; camera.position.y += (Math.random() - .5) * shake;
    want.set(target.x - dx * (2.8 + squeeze * 2), target.y - .6 - squeeze * .6 - player.pitch * 1.6, target.z - dz * (2.6 + squeeze * 2));
    look.lerp(want, Math.min(1, dt * 10)); camera.lookAt(look);
    camera.rotateZ(roll);
  };
}
