import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

// The simulation uses real Three.js objects; only canvas text drawing needs a browser stub.
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 20 }) }) }) };
const { createBots } = await import('../src/game/bots.js');
const { BAR } = await import('../src/game/shift.js');
const { SPOTS, PADS, D, PLAZA_S, ISLE_S } = await import('../src/game/island.js');
const player = { pos: { x: 100, z: 100 }, y: 0 };
const run = { glass: { count: 0 }, mods: { on: () => false } };
const level = { colliders: Object.entries(PADS).map(([key, [x, z]]) => {
  const s = key === 'plaza' ? PLAZA_S : ISLE_S;
  return { minX: x - 3.2 * s, maxX: x + 3.2 * s, minZ: z - 2.5 * s, maxZ: z + 2.5 * s };
}) };
level.colliders.push({ minX: -1.55, maxX: 1.55, minZ: -D, maxZ: D }, { minX: -D, maxX: D, minZ: -1.55, maxZ: 1.55 });

test('bots leave the bar for a real island and only earn tips after reaching it', async () => {
  const api = createBots(new THREE.Scene(), level);
  await api.ready;
  for (const b of api.bots) {
    b.p.pos.x = BAR.x; b.p.pos.z = BAR.z; b.want = 1; b.wait = 0;
    b.tray.step = () => {}; // Keep tower instability separate from this navigation regression.
  }
  api.update(1 / 60, 0, player, run);
  const destinations = Object.values(SPOTS).map(([x, z]) => ({ x: x * .93, z: z * .93 }));
  for (const b of api.bots) {
    assert.equal(b.mode, 'serve-run');
    assert.equal(b.tips, 0, 'loading at the bar must not count as delivering');
    assert.ok(destinations.some(p => p.x === b.goal.x && p.z === b.goal.z), 'destination must be one actual island');
  }
  for (let frame = 1; frame < 40 * 60; frame++) {
    const previous = api.bots.map(b => ({ tips: b.tips, goal: { ...b.goal } }));
    api.update(1 / 60, frame / 60, player, run);
    api.bots.forEach((b, i) => {
      if (b.tips > previous[i].tips) assert.ok(Math.hypot(b.p.pos.x - previous[i].goal.x, b.p.pos.z - previous[i].goal.z) < 1.5, 'tips require physical arrival at the destination');
    });
  }
  for (const b of api.bots) assert.ok(b.tips > 0, `${b.name} must finish a delivery within 40 seconds`);
});
