import * as THREE from 'three';
import { screenImage } from '../moderation.js';

// Picture frames on the hallway walls. Chat fills them with `!frame <emote>` (trusted Twitch CDN)
// or `!frame <https image url>` (allowlisted host + in-browser NSFW classifier, fail-closed).
// Until chat fills them, frames show house "art" captions. Bomb blasts knock frames crooked.
const HOUSE_ART = [['STILL LIFE', 'WITH SPILL'], ['PORTRAIT OF', 'A DRY GLASS'], ['MOM SAID', 'NO STREAMING'], ['LIVE LAUGH', 'HYDRATE'], ['CHAT WAS', 'HERE']];

export function createGallery(scene, slots) {
  const frames = slots.map((s, i) => {
    const g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = s.rot;
    const wood = new THREE.MeshStandardMaterial({ color: ['#c58b3e', '#2d2a32', '#e8e1d3'][i % 3], roughness: .5 });
    const border = new THREE.Mesh(new THREE.BoxGeometry(.95, .95, .06), wood); g.add(border);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(.78, .78), new THREE.MeshStandardMaterial({ map: art(HOUSE_ART[i % HOUSE_ART.length]), roughness: .8 }));
    pic.position.z = .035; g.add(pic);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.6, .12), new THREE.MeshBasicMaterial({ map: plateTex('THE HOUSE') }));
    plate.position.set(0, -.58, .01); g.add(plate);
    scene.add(g);
    return { g, pic, plate, owner: null, tilt: 0 };
  });
  let next = 0;

  async function hang({ image, user, title, trusted, mostWanted = false }) {
    if (!frames.length) return { ok: false, reason: 'no frames in this course' };
    const res = await screenImage(image, { trusted });
    if (!res.ok) return res;
    const f = mostWanted ? frames[0] : frames[(next++ % (frames.length - 1)) + 1];
    const tex = new THREE.Texture(res.img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    f.pic.material.map = tex; f.pic.material.color.set('#fff'); f.pic.material.needsUpdate = true;
    f.plate.material.map = plateTex(mostWanted ? `MOST WANTED · ${user}` : `${title || ''} · ${user}`.slice(0, 28)); f.plate.material.needsUpdate = true;
    f.owner = user; f.tilt = 0; f.g.rotation.z = 0;
    return { ok: true };
  }
  function shake(power = 1) { for (const f of frames) f.tilt += (Math.random() - .5) * .5 * power; }
  function render(dt) { for (const f of frames) { f.g.rotation.z += (f.tilt - f.g.rotation.z) * Math.min(1, dt * 6); } }
  return { hang, shake, render, frames };
}

function art(lines) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 256, 256); grad.addColorStop(0, '#ffcf8a'); grad.addColorStop(1, '#ff7aa8');
  x.fillStyle = grad; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#3fb6ff'; x.beginPath(); x.ellipse(128, 150, 70, 22, 0, 0, 7); x.fill(); // the spill
  x.fillStyle = '#ffffffcc'; x.fillRect(108, 70, 40, 70);
  x.fillStyle = '#1b1530'; x.font = 'bold 26px system-ui'; x.textAlign = 'center'; x.fillText(lines[0], 128, 36); x.fillText(lines[1], 128, 222);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function plateTex(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#d9b45a'; x.fillRect(0, 0, 512, 96); x.fillStyle = '#2a1f0f'; x.font = 'bold 40px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
