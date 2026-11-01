// Spill attribution: every drop lost is blamed on whoever caused the current disturbance.
// Causes stay "hot" for a few seconds after an event. No hot cause -> the streamer's own hands
// (or the house hazard they walked into). Results screen rolls these as "Spill Credits".
export class Ledger {
  constructor() { this.hot = []; this.totals = new Map(); this.log = []; }
  blame(users, label, seconds = 3.5, t = 0) { this.hot.push({ users, label, until: t + seconds }); this.log.push({ t, users, label }); }
  spill(amount, t, fallback = 'YOUR OWN HANDS') {
    if (amount <= 0) return null;
    this.hot = this.hot.filter(h => h.until > t);
    const cause = this.hot.at(-1);
    const names = cause ? cause.users : [fallback];
    for (const n of names) this.totals.set(n, (this.totals.get(n) || 0) + amount / names.length);
    return cause || null;
  }
  credits() { return [...this.totals].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount); }
  villain() { return this.credits().find(c => !/^(YOUR OWN HANDS|THE HOUSE)/.test(c.name)) || null; }
}
