import * as THREE from 'three';

// THE STREAMER BEAN: a smooth, glossy jelly-bean body with big googly eyes, a gaming headset and stubby limbs.
// No skeleton, no GLB: a handful of shared smooth meshes animated in code (waddle, flail, spin, squash).
// Same API as the old character (root / holder / update / emote / play / knock / down / dispose).
const BODY = new THREE.CapsuleGeometry(.4, .62, 6, 16), LIMB = new THREE.CapsuleGeometry(.11, .22, 3, 8), FOOT = new THREE.CapsuleGeometry(.13, .14, 3, 8);
const EYE = new THREE.SphereGeometry(.12, 12, 8), PUPIL = new THREE.SphereGeometry(.058, 8, 6), BAND = new THREE.TorusGeometry(.43, .035, 5, 16, Math.PI), CUP = new THREE.CylinderGeometry(.12, .12, .08, 20).rotateZ(Math.PI / 2);
const MIC = new THREE.CylinderGeometry(.012, .012, .26, 6).rotateX(Math.PI / 2);
const SMILE = new THREE.TorusGeometry(.09, .02, 6, 16, Math.PI).rotateZ(Math.PI);
const white = new THREE.MeshPhongMaterial({ color: '#ffffff', shininess: 80 }), black = new THREE.MeshPhongMaterial({ color: '#1b1530', shininess: 100 });
const dark = new THREE.MeshLambertMaterial({ color: '#2b2838' }), mats = new Map();
const skin = c => { if (!mats.has(c)) mats.set(c, new THREE.MeshPhongMaterial({ color: c, shininess: 55, specular: '#666666' })); return mats.get(c); };
const accent = c => { const k = 'a' + c; if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: new THREE.Color(c).offsetHSL(0, 0, -.25) })); return mats.get(k); };

export async function createBean(scene, { color = '#ff7a2f' } = {}) {
  const root = new THREE.Group(), lean = new THREE.Group(), body = new THREE.Group(); root.add(lean); lean.add(body); scene.add(root);
  const m = (geo, mat, x, y, z, parent = body, shadow = false) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = shadow; parent.add(o); return o; }; // only body + limbs cast shadows (cheap)
  const torso = m(BODY, skin(color), 0, .86, 0, body, true);
  // face (forward is -z)
  const eyes = [-1, 1].map(s => { const e = m(EYE, white, s * .15, 1.12, -.33); const p = m(PUPIL, black, 0, 0, -.085, e); return { e, p }; });
  const smile = m(SMILE, black, 0, .9, -.385); smile.rotation.x = -.2;
  // headset
  const band = m(BAND, dark, 0, 1.18, -.02); band.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) m(CUP, accent(color === '#a970ff' ? '#ff4f6d' : '#a970ff'), s * .42, 1.12, -.02);
  const mic = m(MIC, dark, .36, 1.0, -.16); mic.rotation.y = -.5;
  // limbs (pivot groups so they swing from the shoulder / hip)
  const limb = (x, y, geo, len) => { const g = new THREE.Group(); g.position.set(x, y, 0); body.add(g); m(geo, skin(color), 0, -len, 0, g, true); return g; };
  const armL = limb(-.43, .95, LIMB, .2), armR = limb(.43, .95, LIMB, .2), legL = limb(-.17, .3, FOOT, .16), legR = limb(.17, .3, FOOT, .16);
  armR.rotation.x = -1.25; // holds the tower out front
  const holder = new THREE.Group(); holder.position.set(.5, .98, -.42); lean.add(holder); holder.scale.setScalar(1.4);

  let puff = 0; // CO2: 0 = normal, 1 = full balloon
  let knockKind = null, knockT = 0, knockLen = 1, emoteT = 0, phase = 0, spin = 0;
  function knock(kind, seconds = 1) { knockKind = kind; knockT = knockLen = seconds; }
  function emote(_n, seconds = 1) { emoteT = seconds; }
  function update(dt, player, slosh, state) {
    root.position.set(player.pos.x, player.y, player.pos.z); root.rotation.y = -player.yaw;
    lean.rotation.z = THREE.MathUtils.lerp(lean.rotation.z, -slosh.tx * .5, .2); lean.rotation.x = THREE.MathUtils.lerp(lean.rotation.x, slosh.tz * .35, .2);
    const v = Math.hypot(player.vel.x, player.vel.z), air = !player.grounded && !player.swimming;
    phase += dt * (4 + v * 2.2);
    // waddle: legs swing, body bobs and rocks side to side
    const w = Math.min(1, v / 3);
    legL.rotation.x = Math.sin(phase) * .9 * w; legR.rotation.x = -Math.sin(phase) * .9 * w;
    armL.rotation.x = air ? -2.6 + Math.sin(phase * 3) * .6 : -Math.sin(phase) * .7 * w; armL.rotation.z = air ? -.5 : 0;
    body.position.y = Math.abs(Math.sin(phase)) * .08 * w; body.rotation.z = Math.sin(phase) * .12 * w;
    // YEET: spin while flying (player.spin is set by big hits), googly pupils go wide
    if (air && player.spin) { spin += player.spin * dt; body.rotation.x = spin; } else { spin = 0; body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0, .3); }
    const shock = air || knockT > 0 ? 1.5 : 1;
    for (const [i, { p }] of eyes.entries()) { p.scale.setScalar(THREE.MathUtils.lerp(p.scale.x, shock, .3)); p.position.x = Math.sin(phase * .7 + i) * .02 * (air ? 3 : 1); }
    smile.scale.y = air || knockT > 0 ? -1 : 1; // frown when things go wrong
    lean.scale.set(1, 1, 1); lean.position.y = 0;
    if (knockT > 0) {
      knockT -= dt; const k = 1 - knockT / knockLen;
      if (knockKind === 'flat') { const sq = k < .1 ? k / .1 : k < .7 ? 1 : Math.max(0, 1 - (k - .7) / .3), boing = k > .7 ? Math.sin((k - .7) / .3 * Math.PI) * .25 : 0; lean.scale.set(1 + sq * .5, 1 - sq * .7 + boing, 1 + sq * .5); }
      else { const tip = k < .2 ? k / .2 : k < .65 ? 1 : Math.max(0, 1 - (k - .65) / .35); lean.rotation.x = -tip * 1.4; lean.position.y = tip * .3; }
    }
    if (emoteT > 0) { emoteT -= dt; body.position.y += Math.abs(Math.sin(emoteT * 14)) * .15; }
    if (state === 'done-win') body.position.y = Math.abs(Math.sin(performance.now() / 160)) * .4;
    else if (state === 'done-fail') lean.rotation.x = -1.4;
    if (player.swimming) body.position.y = -.4 + Math.sin(phase * .5) * .05;
    if (puff > 0) { // BALLOON MODE: body swells round, limbs flap uselessly, eyes huge
      torso.scale.set(1 + puff * 1.5, 1 + puff * .8, 1 + puff * 1.5); torso.position.y = .86 + puff * .3;
      for (const [i, l] of [armL, armR, legL, legR].entries()) l.rotation.z = Math.sin(performance.now() / 60 + i) * .8 * puff;
      for (const { e } of eyes) { e.position.z = -.33 - puff * .55; e.scale.setScalar(1 + puff * .6); }
      body.rotation.z = Math.sin(performance.now() / 300) * .25 * puff;
    } else if (torso.scale.x !== 1) { torso.scale.set(1, 1, 1); torso.position.y = .86; for (const { e } of eyes) { e.position.z = -.33; e.scale.setScalar(1); } }
  }
  return { root, holder, HAND: new THREE.Vector3(), inflate: k => { puff = k; }, update, emote, play: () => {}, knock, get down() { return knockT > 0; }, dispose: () => scene.remove(root), torso };
}
