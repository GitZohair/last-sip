import * as THREE from 'three';

// SPEECH BUBBLES over a bean's head ("IT WAS BRAD", "WHAT?!", "-$10"). In-world, short, gone in ~2 s.
function bubbleTex(text, bg, fg) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = '900 56px system-ui';
  const w = Math.min(1000, Math.ceil(g.measureText(text).width) + 70); c.width = w; c.height = 130;
  g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, 96, 40); g.fill();
  g.beginPath(); g.moveTo(w / 2 - 18, 98); g.lineTo(w / 2, 126); g.lineTo(w / 2 + 18, 98); g.fill(); // tail
  g.fillStyle = fg; g.font = '900 56px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, aspect: w / 130 };
}
export function createBubbles(scene) {
  const live = [];
  return {
    // pos: () => {x,y,z} of the speaker's feet
    say(pos, text, { bg = '#ffffff', fg = '#1b1530', life = 2.2, lift = 2.9 } = {}) {
      const { t, aspect } = bubbleTex(text.toUpperCase(), bg, fg);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, sizeAttenuation: false })); s.renderOrder = 20; scene.add(s);
      live.push({ s, pos, life, max: life, lift, aspect });
    },
    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const b = live[i]; b.life -= dt; const p = b.pos(), k = b.max - b.life;
        const pop = k < .15 ? k / .15 * 1.15 : k < .25 ? 1.15 - (k - .15) / .1 * .15 : 1, h = .055 * pop;
        b.s.scale.set(h * b.aspect, h, 1); b.s.position.set(p.x, (p.y || 0) + b.lift + k * .15, p.z); b.s.material.opacity = Math.min(1, b.life / .3);
        if (b.life <= 0) { scene.remove(b.s); b.s.material.map.dispose(); b.s.material.dispose(); live.splice(i, 1); }
      }
    },
    clear() { for (const b of live) scene.remove(b.s); live.length = 0; },
  };
}
