// Browser-free investigation of the existing bot update, without changing game code.
// Rendering uses real Three.js objects; a tiny canvas stub supports name-tag textures.
import * as THREE from 'three';
import { writeFileSync } from 'node:fs';

globalThis.location = { search: '' };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 20 }) }) }) };

const { createBots } = await import('../src/game/bots.js');
const { SPOTS } = await import('../src/game/island.js');
const { BAR } = await import('../src/game/shift.js');
const bots = createBots(new THREE.Scene(), { colliders: [{ minX: -8, maxX: 8, minZ: -6, maxZ: 6 }] });
await bots.ready;
for (const bot of bots.bots) {
  bot.p.pos.x = BAR.x; bot.p.pos.z = BAR.z;
  bot.want = 1; bot.wait = 0;
  bot.tray.step = () => {}; // isolate navigation from tower instability
}
const before = bots.bots.map(b => ({ name: b.name, tips: b.tips, mode: b.mode }));
bots.update(1 / 60, 0, { pos: { x: 100, z: 100 }, y: 0 }, { glass: { count: 0 }, mods: { on: () => false } });
const after = bots.bots.map(b => ({ name: b.name, tips: b.tips, mode: b.mode, distanceFromBar: Math.hypot(b.p.pos.x - BAR.x, b.p.pos.z - BAR.z), destination: b.goal }));

const destinations = Object.values(SPOTS).map(([x, z]) => [x * .93, z * .93]);
const diagonalPairs = destinations.flatMap(([x]) => destinations.map(([, z]) => [x, z])).filter(([x, z]) => x !== 0 && z !== 0);
const report = {
  before, after,
  instantDeliveryAtBar: after.every(b => b.tips > 0 && b.distanceFromBar < .1),
  legacyCoordinateSelection: { combinations: 16, diagonalOceanCombinations: diagonalPairs.length, examples: diagonalPairs },
};
writeFileSync(new URL('./bot-behavior-audit.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
