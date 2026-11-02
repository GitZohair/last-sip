import * as THREE from 'three';

// BANNER PLANES: chat literally flies over the arena. Every plane tows a banner with a viewer's chat message
// ("XQCFAN99: DROP HIM"), and carries a payload:
//   strike: bombs rain down on the target (the leader in a live room, your own streamer in solo)
//   care:   a parachute crate that bursts into bomb pickups next to the streamer
// With no chat connected, the house sends the odd plane with its own banner so the sky is never empty.
const white = new THREE.MeshPhongMaterial({ color: '#f4f1ea', shininess: 60 }), red = new THREE.MeshPhongMaterial({ color: '#ff4f6d', shininess: 60 });
const darkM = new THREE.MeshLambertMaterial({ color: '#2b2838' }), rope = new THREE.LineBasicMaterial({ color: '#2b2838' });
function planeMesh(tint) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; body.add(m); return m; };
  const tm = new THREE.MeshPhongMaterial({ color: tint, shininess: 60 });
  add(new THREE.CapsuleGeometry(.55, 3, 8, 16).rotateX(Math.PI / 2), white, 0, 0, 0);            // fuselage
  add(new THREE.CapsuleGeometry(.3, 5.4, 6, 12).rotateZ(Math.PI / 2), tm, 0, .25, -.3, 1, .28, 1.6); // wing
  add(new THREE.CapsuleGeometry(.2, 1.8, 6, 10).rotateZ(Math.PI / 2), tm, 0, .2, 2, 1, .3, 1.4);    // tailplane
  add(new THREE.CapsuleGeometry(.18, .7, 6, 10), red, 0, .7, 2.1, .4, 1, 1.6);                         // fin
  add(new THREE.SphereGeometry(.42, 16, 10), new THREE.MeshPhongMaterial({ color: '#7fd0ff', shininess: 120, transparent: true, opacity: .8 }), 0, .45, -.6, 1, .8, 1.4); // canopy
  const prop = new THREE.Group(); prop.position.z = -2.1; body.add(prop);
  for (const r of [0, Math.PI / 2]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.07, 1.3, 4, 8), darkM); b.rotation.z = r; prop.add(b); }
  g.userData.prop = prop; g.userData.body = body; return g;
}
function bannerTex(text) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 1024; c.height = 160;
  x.fillStyle = '#fffdf6'; x.fillRect(0, 0, 1024, 160); x.fillStyle = '#ff4f6d'; x.fillRect(0, 0, 1024, 12); x.fillRect(0, 148, 1024, 12);
  let size = 92; x.font = `900 ${size}px system-ui`; while (x.measureText(text).width > 980 && size > 34) { size -= 4; x.font = `900 ${size}px system-ui`; }
  x.fillStyle = '#1b1530'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const TINTS = ['#a970ff', '#4fc3ff', '#5dd39e', '#ffb020'];
const HOUSE = ['THIS STREAM IS SPONSORED BY NOBODY', 'TYPE !BOMB IN CHAT', 'LAST SIP: NO REFUNDS', 'TIPS ARE NOT GUARANTEED', 'HYDRATE (WITH SOMETHING)', 'YOUR BOSS IS WATCHING', 'CHAT IS ALWAYS RIGHT'];

export function createPlanes({ scene, bombs, target }) {
  const live = [];
  let houseT = 14;
  function fly(text, kind, by, count = 3) {
    const tint = TINTS[Math.floor(Math.random() * TINTS.length)], g = planeMesh(tint); scene.add(g);
    const tex = bannerTex(text.toUpperCase().slice(0, 44)), banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4, 12, 1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false }));
    scene.add(banner); const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), rope); scene.add(line);
    const T = target(), a = Math.random() * Math.PI * 2, dir = { x: Math.cos(a), z: Math.sin(a) }, L = 70;
    const from = { x: T.x - dir.x * L, z: T.z - dir.z * L };
    live.push({ g, banner, line, tex, dir, from, s: 0, L: L * 2, speed: 17, kind, by, count, dropped: 0, T, y: 8 + Math.random() * 2, base: banner.geometry.attributes.position.array.slice() });
  }
  return {
    strike(by, msg, count = 3) { fly(msg ? `${by}: ${msg}` : `${by} SENT AN AIRSTRIKE`, 'strike', by, count); },
    care(by, msg) { fly(msg ? `${by}: ${msg}` : `CARE PACKAGE FROM ${by}`, 'care', by); },
    update(dt, t, { auto = true, chatLine = null } = {}) {
      if (auto && (houseT -= dt) <= 0) { houseT = 18 + Math.random() * 8; const h = chatLine?.() || HOUSE[Math.floor(Math.random() * HOUSE.length)]; Math.random() < .5 ? fly(h, 'strike', 'THE HOUSE', 2) : fly(h, 'care', 'THE HOUSE'); }
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i]; p.s += p.speed * dt;
        const x = p.from.x + p.dir.x * p.s, z = p.from.z + p.dir.z * p.s, y = p.y + Math.sin(t * 1.3 + i) * .4;
        p.g.position.set(x, y, z); p.g.rotation.y = Math.atan2(-p.dir.x, -p.dir.z); p.g.userData.body.rotation.z = Math.sin(t * 1.1) * .12; p.g.userData.prop.rotation.z += dt * 40;
        // banner trails 5 m behind, flapping
        const bx = x - p.dir.x * 8, bz = z - p.dir.z * 8; p.banner.position.set(bx, y - .4, bz); p.banner.rotation.y = Math.atan2(-p.dir.z, p.dir.x) + Math.PI;
        const arr = p.banner.geometry.attributes.position.array; for (let k = 0; k < arr.length; k += 3) arr[k + 2] = p.base[k + 2] + Math.sin(t * 9 + p.base[k] * 1.4) * .25 * (p.base[k] + 4.5) / 9; p.banner.geometry.attributes.position.needsUpdate = true;
        const lp = p.line.geometry.attributes.position.array; lp[0] = x - p.dir.x * 2.2; lp[1] = y; lp[2] = z - p.dir.z * 2.2; lp[3] = bx + p.dir.x * 4.5; lp[4] = y - .4; lp[5] = bz + p.dir.z * 4.5; p.line.geometry.attributes.position.needsUpdate = true;
        // payload over the target (re-aimed at the moment of the drop: it's homing, like a blue shell)
        const near = p.s > p.L / 2 - 4;
        if (near && p.dropped < (p.kind === 'care' ? 1 : p.count) && p.s > p.L / 2 - 4 + p.dropped * 1.6) {
          const T = target(); p.dropped++;
          if (p.kind === 'strike') bombs.drop(T.x + (Math.random() - .5) * 3, T.z + (Math.random() - .5) * 3, p.by);
          else bombs.care?.(T.x + 2, T.z + 1.5);
        }
        if (p.s > p.L) { for (const o of [p.g, p.banner, p.line]) scene.remove(o); p.tex.dispose(); p.banner.geometry.dispose(); live.splice(i, 1); }
      }
    },
    dispose() { for (const p of live) for (const o of [p.g, p.banner, p.line]) scene.remove(o); live.length = 0; },
  };
}
