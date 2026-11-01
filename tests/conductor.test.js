import test from 'node:test';
import assert from 'node:assert/strict';
import { createConductor } from '../src/game/conductor.js';

test('conductor spaces threats, respects budget, priority and grace', () => {
  const c = createConductor(), fired = [];
  const fire = it => fired.push(it.kind + ':' + it.src);
  c.request('barrel', 'h', 'house', fire); c.request('sniper', 'v', 'vote', fire); c.request('drop', 'p', 'paid', fire);
  assert.equal(c.request('barrel', 'h2', 'house', fire), false); // house never stacks
  c.update(.1, { t: 0, activeCost: 0 }); assert.deepEqual(fired, ['drop:paid']); // paid first
  c.update(.1, { t: .5, activeCost: 2 }); assert.equal(fired.length, 1); // too soon after the last one
  c.update(.1, { t: 2, activeCost: 2 }); assert.equal(fired.length, 1); // sniper (3) would exceed the opening budget (3)
  c.update(.1, { t: 2.2, activeCost: 0 }); assert.equal(fired[1], 'sniper:vote');
  c.hit(7); c.request('barrel', 'x', 'chat', fire);
  c.update(.1, { t: 3.5, activeCost: 0 }); assert.equal(fired.length, 2); // grace after a hit
  c.update(.1, { t: 3.5, activeCost: 0, swimming: true }); assert.equal(fired.length, 2);
  c.update(.1, { t: 9, activeCost: 0 }); assert.equal(fired[2], 'barrel:chat'); // fires once the breather is over
});

test('conductor drops stale requests', () => {
  const c = createConductor(), fired = [];
  c.request('barrel', 'a', 'chat', it => fired.push(it)); c.update(.1, { t: 0, activeCost: 99 });
  c.update(.1, { t: 15, activeCost: 0 }); assert.equal(fired.length, 0); assert.equal(c.q.length, 0);
});
