import * as THREE from 'three';
import { rng } from './rng.js';

// DAILY HOUSE RULE: one seeded twist per day, the same for every streamer (shown next to today's order).
export const RULES = {
  windy: { label: 'WINDY', tip: 'Gusts push you sideways on the boards' },
  hungry: { label: 'HUNGRY BOT', tip: 'The beach bot wakes early and moves faster' },
  heavy: { label: 'HEAVY GLASS', tip: 'The drink sloshes more' },
};
export const todaysRule = seed => rng(seed + ':rule').pick(Object.keys(RULES));

// WINDY: every ~7 s a 1.6 s gust from one side. Telegraphed 0.8 s early by streaks drifting across the view.
export function createWind(scene, seed) {
  const r = rng(seed + ':wind'), N = 60;
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, .02, .02), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), N);
  streaks.frustumCulled = false; scene.add(streaks);
  const pts = Array.from({ length: N }, () => new THREE.Vector3(r.range(-12, 12), r.range(.3, 3), r.range(-10, 10)));
  const m = new THREE.Matrix4();
  let next = 5, t0 = -9, dir = 1;
  return {
    push: { x: 0, z: 0 },
    update(t, dt, player) {
      if (t > next) { t0 = t; dir = r() > .5 ? 1 : -1; next = t + 6 + r() * 3; }
      const k = t - t0, warn = k >= 0 && k < .8, blow = k >= .8 && k < 2.4;
      this.push.x = blow ? dir * 3.2 * Math.sin((k - .8) / 1.6 * Math.PI) : 0;
      streaks.material.opacity += ((warn || blow ? .55 : 0) - streaks.material.opacity) * Math.min(1, dt * 6);
      for (let i = 0; i < N; i++) {
        const p = pts[i]; p.x += dir * dt * (blow ? 26 : 12); if (p.x > 12) p.x -= 24; if (p.x < -12) p.x += 24;
        m.makeTranslation(player.pos.x + p.x, p.y, player.pos.z + p.z); streaks.setMatrixAt(i, m);
      }
      streaks.instanceMatrix.needsUpdate = true;
      return warn;
    },
  };
}
