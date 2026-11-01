// THE CONDUCTOR: a tiny chaos director (think Left 4 Dead's AI director, much smaller).
// Every threat (house, chat vote, direct chat command, paid support) asks here before it happens, so chaos
// arrives as a readable rhythm instead of a pile-up:
//   budget     threats on the island at once are capped by a cost budget that grows over the shift
//   spacing    a minimum gap between threats, longer when tension is high; per-kind cooldowns
//   breathers  a grace window after every hit, nothing new while you're swimming
//   priority   paid > vote > chat > house; the house never queues more than one thing
//   expiry     stale requests drop (chat moved on); paid ones wait longer
export const COST = { sniper: 3, barrel: 2, drop: 2, frame: 1, storm: 2, card: 1, lifeguard: 0 };
const COOLDOWN = { sniper: 7, barrel: 3.5, drop: 2.5, frame: 1.5, storm: 8, card: 3, lifeguard: 0 };
const PRIO = { paid: 3, vote: 2, chat: 1, house: 0 };

export function createConductor() {
  const q = [], lastKind = {};
  let now = 0, last = -99, grace = 0, tension = 0;
  const api = {
    q,
    get tension() { return tension; },
    budget: t => t < 20 ? 3 : t < 50 ? 5 : 7, // calm opening, then it builds
    request(kind, user, src = 'house', fire) {
      if (src === 'house' && q.some(x => x.src === 'house')) return false;
      q.push({ kind, user, src, fire, at: now });
      q.sort((a, b) => PRIO[b.src] - PRIO[a.src] || a.at - b.at);
      while (q.length > 6) q.pop(); // overflow drops the lowest priority, newest first
      return true;
    },
    hit(power = 5) { tension = Math.min(1, tension + .12 + power * .02); grace = now + 2.2; },
    // ctx: { t, activeCost, swimming }. Returns the item to fire now (and calls its fire()), or null.
    update(dt, { t, activeCost = 0, swimming = false }) {
      now = t; tension = Math.max(0, tension - dt * .07);
      for (let i = q.length - 1; i >= 0; i--) if (now - q[i].at > (q[i].src === 'paid' ? 20 : 10)) q.splice(i, 1);
      const helpOnly = swimming || now < grace;
      const gap = 1.1 + tension * 1.8;
      if (now - last < gap) return null;
      for (let i = 0; i < q.length; i++) {
        const it = q[i], cost = COST[it.kind] ?? 1;
        if (helpOnly && cost > 0) continue;
        if (now - (lastKind[it.kind] ?? -99) < (COOLDOWN[it.kind] ?? 2)) continue;
        if (cost && activeCost + cost > api.budget(now) + (it.src === 'paid' ? 2 : 0)) continue;
        q.splice(i, 1); last = now; lastKind[it.kind] = now; it.fire?.(it); return it;
      }
      return null;
    },
  };
  return api;
}
