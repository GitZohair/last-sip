import * as THREE from 'three';
import { rng } from './rng.js';

// DAILY HOUSE RULE: one seeded twist per day, the same for every streamer (shown next to today's order).
export const RULES = {
  windy: { label: 'WINDY', tip: 'Gusts push you sideways on the boards' },
  heavy: { label: 'TOP HEAVY', tip: 'The tower sways more' },
  calm: { label: 'CALM SEAS', tip: 'A gentle day. Go tall.' },
};
export const todaysRule = seed => rng(seed + ':rule').pick(Object.keys(RULES));

// WIND: one system for the WINDY daily rule (a gust every ~7 s) and the SEA BREEZE chat card (one long gust).
// Every gust is telegraphed 0.8 s early: white streaks start drifting across the view and a screen arrow blinks.
export function createWind(scene, seed, auto = false) {
  const r = rng(seed + ':wind'), N = 70;
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, .025, .025), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), N);
  streaks.frustumCulled = false; scene.add(streaks);
  const pts = Array.from({ length: N }, () => new THREE.Vector3(r.range(-12, 12), r.range(.2, 3.2), r.range(-10, 10)));
  const m = new THREE.Matrix4();
  let next = auto ? 5 : Infinity, t0 = -9, dir = 1, len = 1.6, now = 0;
  return {
    push: { x: 0, z: 0 }, state: null, dir: 1,
    gust(seconds = 3, d = Math.random() > .5 ? 1 : -1) { t0 = now; dir = d; len = seconds; }, // chat card
    update(t, dt, player) {
      now = t;
      if (t > next) { t0 = t; dir = r() > .5 ? 1 : -1; len = 1.6; next = t + 6 + r() * 3; }
      const k = t - t0, warn = k >= 0 && k < .8, blow = k >= .8 && k < .8 + len;
      this.state = warn ? 'warn' : blow ? 'blow' : null; this.dir = dir;
      this.push.x = blow ? dir * 3.2 * Math.min(1, (k - .8) / .3, (.8 + len - k) / .3) : 0; // ramp in, hold, ramp out
      streaks.material.opacity += ((warn ? .35 : blow ? .7 : 0) - streaks.material.opacity) * Math.min(1, dt * 6);
      for (let i = 0; i < N; i++) {
        const p = pts[i]; p.x += dir * dt * (blow ? 28 : 12); if (p.x > 12) p.x -= 24; if (p.x < -12) p.x += 24;
        m.makeTranslation(player.pos.x + p.x, player.y + p.y, player.pos.z + p.z); streaks.setMatrixAt(i, m);
      }
      streaks.instanceMatrix.needsUpdate = true; streaks.visible = streaks.material.opacity > .01;
      return warn;
    },
  };
}
