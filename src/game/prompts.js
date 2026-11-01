import * as THREE from 'three';
import { icon } from './icons.js';

// World-space prompts: icon badges that float over the thing you need to deal with, so the HUD can stay
// nearly text-free. Each badge is a camera-facing sprite drawn from a game-icons glyph on a coloured disc.
function badgeTexture(name, bg, glyph = '') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffffffcc'; g.stroke();
  if (glyph) { g.fillStyle = '#fff'; g.font = '900 64px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(glyph, 64, 68); tex.needsUpdate = true; return tex; }
  const svg = icon(name).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" style="color:#fff" ');
  const img = new Image(); img.onload = () => { g.drawImage(img, 24, 24, 80, 80); tex.needsUpdate = true; };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(svg); return tex;
}

export function badge(scene, name, bg = '#a970ff', size = .55, glyph = '') {
  const mat = new THREE.SpriteMaterial({ map: badgeTexture(name, bg, glyph), depthTest: false, transparent: true });
  const s = new THREE.Sprite(mat); s.scale.setScalar(size); s.renderOrder = 10; scene.add(s);
  return s;
}

// Prompts for this run's set pieces. update() bobs/pulses them and hides them when irrelevant.
export function createPrompts(scene, hazards) {
  const lock = hazards.lock, mate = hazards.mate;
  const mic = badge(scene, 'mic', '#a970ff', .6); mic.position.set(lock.x, 2.45, lock.z + .3);
  let zzz = null, alarm = null;
  if (mate) {
    zzz = badge(scene, '', '#3b4a7a', .5, 'Z'); alarm = badge(scene, '', '#ff3b5c', .6, '!');
    zzz.userData.base = new THREE.Vector3(mate.x, 1.9, mate.z); alarm.position.set(mate.x, 2.1, mate.z);
  }
  return {
    update(t, voice, run) {

      mic.visible = !lock.open && lock.kind !== 'none'; const k = lock.near ? 1 + lock.charge * .5 + (voice.loud ? Math.sin(t * 30) * .08 : Math.sin(t * 5) * .05) : .8;
      mic.scale.setScalar(.6 * k); mic.position.y = 2.45 + Math.sin(t * 2) * .05; mic.material.opacity = lock.near ? 1 : .6;
      if (zzz) {
        const asleep = mate.awake <= 0, k2 = (t * .5) % 1;
        zzz.visible = asleep && mate.alert < .6; zzz.position.copy(zzz.userData.base).add({ x: Math.sin(t * 2) * .15, y: k2 * .5, z: 0 }); zzz.material.opacity = 1 - k2;
        alarm.visible = !asleep || mate.alert >= .6; alarm.scale.setScalar(.5 + (asleep ? mate.alert * .3 : .4 + Math.sin(t * 20) * .08));
      }
    },
  };
}
