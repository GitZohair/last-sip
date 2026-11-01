// Diagnostic controllers. These inspect exact state and know the route;
// they are not simulated people or evidence of enjoyment/retention.
import { writeFileSync } from 'node:fs';
import { createState, step, score, WAYPOINTS, applyEvent } from '../src/simulation.js';

const policies = ['walk', 'sprint', 'steady', 'sprint-straights', 'steady-corners'];
const dates = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2026, 10, i + 1)).toISOString().slice(0, 10));
const runs = [];
for (const date of dates) {
  for (const policy of policies) {
    const s = createState(date);
    const events = [];
    for (let i = 0; i < 120 * 76 && !s.done; i++) {
      const target = WAYPOINTS[Math.min(s.leg + 1, 5)];
      const dx = target.x - s.x, dz = target.z - s.z;
      const yaw = Math.atan2(dx, -dz);
      const diff = (yaw - s.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      const corner = Math.abs(diff) > .22 || Math.hypot(dx, dz) < 5;
      const input = {
        forward: Math.abs(diff) < .9 ? 1 : .2,
        turn: Math.max(-1, Math.min(1, diff * 3)),
        sprint: policy === 'sprint' || (policy === 'sprint-straights' && !corner),
        steady: policy === 'steady' || (policy === 'steady-corners' && corner),
      };
      step(s, input, 1 / 120);
      if (s.lastEvent) events.push({ time: s.time, text: s.lastEvent });
    }
    runs.push({ date, policy, finished: s.finished, time: s.time, water: s.water, score: score(s), falls: s.falls, bumps: s.bumps, events });
  }
}
const round = n => Math.round(n * 100) / 100;
const summary = policies.map(policy => {
  const rows = runs.filter(r => r.policy === policy);
  const mean = key => round(rows.reduce((n, r) => n + r[key], 0) / rows.length);
  return { policy, finishes: `${rows.filter(r => r.finished).length}/${rows.length}`, meanTime: mean('time'), meanWaterPercent: round(rows.reduce((n,r)=>n+r.water,0)/rows.length*100), meanScore: mean('score'), meanBumps: mean('bumps'), minScore: Math.min(...rows.map(r => r.score)), maxScore: Math.max(...rows.map(r => r.score)) };
});
const winners = dates.map(date => { const rows = runs.filter(r => r.date === date).sort((a,b) => b.score - a.score); return { date, winner: rows[0].policy, score: rows[0].score }; });
const spam = createState(dates[0]);
for (let i=0;i<20;i++) { applyEvent(spam, 'calm'); step(spam, {}, .025); }
const report = { evidenceLimit: 'Perfect-state diagnostic policies, not human participants. Live game source unchanged.', summary, winners, observedEvents: [...new Set(runs.flatMap(r => r.events.map(e => e.text)))], repeatedCalm: { calmRemaining: spam.calm, crowd: spam.crowd }, runs };
writeFileSync(new URL('./solo-playtest-results.json', import.meta.url), JSON.stringify(report, null, 2));
console.table(summary);
console.log('Daily best policy:', JSON.stringify(winners));
console.log('All emitted event categories:', JSON.stringify(report.observedEvents));
console.log('Repeated calm requests:', JSON.stringify(report.repeatedCalm));
