import * as THREE from 'three';
import { model, textTexture } from './assets.js';
import { screenImage } from '../moderation.js';

// SKY DROPS: chat (and the house) drop furniture and picture frames onto the boardwalk.
// Every drop is telegraphed: a shadow on the target grows darker as the object falls, a red ring pulses,
// and a name tag says who sent it. Impact = shove + slosh if you're close. Furniture that lands on the boards
// becomes an obstacle (squeeze past or hop), then tips into the sea after a while. Frames slam flat on the boards
// with the viewer's emote facing up, so the chase camera can read whose it is.
export const FURNITURE = [['kitchenFridge', 'FRIDGE'], ['toilet', 'TOILET'], ['bathtub', 'BATHTUB'], ['washer', 'WASHING MACHINE'], ['televisionVintage', 'TELLY'], ['loungeSofa', 'SOFA'], ['bear', 'TEDDY'], ['speaker', 'SPEAKER']];
const FALL = 1.25, H0 = 15; // seconds in the air, drop height

export function createDrops(scene, level, { sfx, onImpact }) {
  const list = [];
  const shadowGeo = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), ringGeo = new THREE.RingGeometry(.92, 1.05, 40).rotateX(-Math.PI / 2);
  const groundAt = (x, z) => { for (const c of level.colliders) if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.top <= .1) return c.top; return null; };

  function tag(text, color) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(text.slice(0, 22).toUpperCase(), { w: 512, h: 96, bg: color, font: 'bold 50px system-ui' }), depthTest: false }));
    s.scale.set(3, .56, 1); s.renderOrder = 11; return s;
  }
  function launch(obj, x, z, { user, label, radius = .8, color = '#ff3b5c', flat = false }) {
    const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false }));
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    const gy = groundAt(x, z), y0 = gy ?? -1.7;
    shadow.position.set(x, y0 + .03, z); ring.position.set(x, y0 + .04, z); shadow.scale.setScalar(radius); ring.scale.setScalar(radius);
    const t = tag(`${label} · ${user}`, color); t.position.set(x, y0 + 2.6, z);
    obj.position.set(x, y0 + H0, z); obj.rotation.set(Math.random() * .6, Math.random() * 6, Math.random() * .6);
    scene.add(shadow, ring, t, obj);
    const d = { obj, shadow, ring, tag: t, x, z, y0, onBoards: gy !== null, t: 0, vy: 0, spin: (Math.random() - .5) * 4, user, label, radius, flat, state: 'fall', life: 10, collider: null };
    list.push(d); return d;
  }

  async function furniture(user, x, z, which) {
    const [name, label] = which || FURNITURE[Math.floor(Math.random() * FURNITURE.length)];
    const m = await model('furniture', name); m.scale.multiplyScalar(1.15);
    return launch(m, x, z, { user, label, radius: .85 });
  }
  async function frame(user, x, z, image, trusted = true) {
    let map;
    if (image) { const res = await screenImage(image, { trusted }); if (!res.ok) return null; map = new THREE.Texture(res.img); map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true; }
    else map = textTexture(['CHAT WAS', 'HERE'], { w: 256, h: 256, bg: '#ff7aa8', fg: '#1b1530', font: 'bold 34px system-ui' });
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, .12, 1.7), new THREE.MeshLambertMaterial({ color: '#c58b3e' })));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map })); pic.position.y = .065; g.add(pic);
    return launch(g, x, z, { user, label: 'FRAME', radius: 1.1, color: '#a970ff', flat: true });
  }

  function update(dt, t, player) {
    const hits = [];
    for (const d of [...list]) {
      if (d.state === 'fall') {
        d.t += dt; const k = Math.min(1, d.t / FALL);
        d.obj.position.y = d.y0 + H0 * (1 - k * k); d.obj.rotation.y += d.spin * dt;
        if (d.flat) d.obj.rotation.x = d.obj.rotation.z = (1 - k) * .5;
        d.shadow.material.opacity = .15 + k * .5; d.shadow.scale.setScalar(d.radius * (1.6 - k * .6));
        d.ring.material.opacity = .5 + Math.sin(t * 20) * .4; d.tag.position.set(d.x, Math.max(d.y0 + 2.6, d.obj.position.y + 1.8), d.z); // the name rides down with the object
        if (k >= 1) { // impact
          scene.remove(d.shadow, d.ring);
          const dx = player.pos.x - d.x, dz = player.pos.z - d.z, dist = Math.hypot(dx, dz);
          if (dist < d.radius + 1.2 && player.y > -.5) hits.push({ user: d.user, kind: d.label, drop: true, direct: dist < d.radius * .9, dir: { x: dx / (dist || 1), z: dz / (dist || 1) }, power: 7 * (1 - dist / (d.radius + 1.6)) + 3 });
          onImpact?.(d, dist);
          if (!d.onBoards) { d.state = 'sink'; sfx.splash(); }
          else {
            d.state = 'land'; d.vy = 3.2; sfx.boom?.() ?? sfx.thud(1);
            if (d.flat) { d.obj.rotation.set(0, d.obj.rotation.y, 0); d.collider = null; }
            else { const b = new THREE.Box3().setFromObject(d.obj); const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, hx = Math.min(.45, (b.max.x - b.min.x) * .35), hz = Math.min(.45, (b.max.z - b.min.z) * .35); // compact footprint: leaves a squeeze-past gap
            d.collider = { minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, top: b.max.y - d.obj.position.y + d.y0, drop: true }; level.colliders.push(d.collider); }
          }
        }
      } else if (d.state === 'land') { // one comic bounce, then settle
        d.vy -= 20 * dt; d.obj.position.y = Math.max(d.y0, d.obj.position.y + d.vy * dt);
        if (!d.flat) d.obj.rotation.z += (d.vy > 0 ? 2 : -2) * dt * .3;
        if ((d.life -= dt) <= 0) { d.state = 'tip'; d.tipDir = Math.abs(d.x) > .2 ? Math.sign(d.x) : (Math.random() > .5 ? 1 : -1); removeCollider(d); }
      } else if (d.state === 'tip') { // slides off the boards into the sea
        d.obj.position.x += d.tipDir * dt * 2.2; d.obj.rotation.z -= d.tipDir * dt * 2;
        if (Math.abs(d.obj.position.x - d.x) > 1.4) { d.state = 'sink'; sfx.splash(); }
      } else if (d.state === 'sink') {
        d.obj.position.y -= dt * 2.5; d.tag.material.opacity = Math.max(0, (d.tag.material.opacity ?? 1) - dt * 2);
        if (d.obj.position.y < -4) remove(d);
      }
      if (d.state !== 'fall' && d.state !== 'sink' && d.tag.visible) { d.tagT = (d.tagT || 0) + dt; if (d.tagT > 2.5) d.tag.visible = false; }
    }
    return hits;
  }
  function removeCollider(d) { if (d.collider) { const i = level.colliders.indexOf(d.collider); if (i >= 0) level.colliders.splice(i, 1); d.collider = null; } }
  function remove(d) { removeCollider(d); scene.remove(d.obj, d.shadow, d.ring, d.tag); list.splice(list.indexOf(d), 1); }
  return { list, furniture, frame, update, clear: () => [...list].forEach(remove) };
}
