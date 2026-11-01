// Read-only Twitch chat over the public IRC WebSocket. Anonymous "justinfan" login:
// no OAuth, no token copying, no bot account. Works for any public channel.
// Cheers arrive as a `bits` tag on PRIVMSG, so real Bits can drive events with no extra auth.

export const COMMANDS = {
  // Chaos ("weather"): changes conditions around the streamer, never the controls.
  gust: { kind: 'chaos', event: 'storm', cost: 1 },
  storm: { kind: 'chaos', event: 'storm', cost: 1 },
  ice: { kind: 'chaos', event: 'ice', cost: 1 },
  bomb: { kind: 'chaos', event: 'bomb', cost: 2 },
  fridge: { kind: 'chaos', event: 'crate', cost: 2 },
  lights: { kind: 'chaos', event: 'lights', cost: 1 },
  quake: { kind: 'chaos', event: 'quake', cost: 1 },
  bass: { kind: 'chaos', event: 'quake', cost: 1 },
  chaos: { kind: 'chaos', event: 'deck', cost: 1 },
  roll: { kind: 'chaos', event: 'deck', cost: 1 },
  // Viewer characters: you appear on the island with your name on it.
  sniper: { kind: 'chaos', event: 'sniper', cost: 2 },
  drop: { kind: 'chaos', event: 'drop', cost: 2 },
  toilet: { kind: 'chaos', event: 'drop', cost: 2 },
  barrel: { kind: 'chaos', event: 'barrel', cost: 1 },
  // Help: needs several different viewers inside a short window.
  steady: { kind: 'help', event: 'calm', needed: 3 },
  shelter: { kind: 'help', event: 'calm', needed: 3 },
  // Decoration: hang an emote (or approved image) in a picture frame on the course.
  frame: { kind: 'frame' },
  // Beach waiter: enter the customer raffle.
  order: { kind: 'order' },
  drink: { kind: 'order' },
};

export function parseTags(raw = '') {
  const tags = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) tags[part.slice(0, i)] = part.slice(i + 1).replace(/\\s/g, ' ');
  }
  return tags;
}

// "25:0-4,12-16/1902:6-10" -> [{id:'25', start:0, end:4}, ...]
export function parseEmotes(value = '') {
  if (!value) return [];
  return value.split('/').flatMap(group => {
    const [id, ranges = ''] = group.split(':');
    return ranges.split(',').filter(Boolean).map(r => {
      const [start, end] = r.split('-').map(Number);
      return { id, start, end };
    });
  }).sort((a, b) => a.start - b.start);
}

export function emoteUrl(id, scale = '3.0') {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(id)}/default/dark/${scale}`;
}

// Parse one IRC line into a chat message object, or null if it is not chat.
export function parseLine(line) {
  const m = /^(?:@(\S+) )?:(\w+)!\S+ PRIVMSG #(\w+) :(.*)$/.exec(line.trim());
  if (!m) return null;
  const tags = parseTags(m[1]);
  const text = m[4];
  const badges = tags.badges || '';
  const emotes = parseEmotes(tags.emotes).map(e => ({ ...e, name: [...text].slice(e.start, e.end + 1).join('') }));
  return {
    user: (tags['display-name'] || m[2]).slice(0, 25),
    login: m[2],
    channel: m[3],
    text,
    bits: Number(tags.bits || 0),
    mod: tags.mod === '1' || badges.includes('broadcaster'),
    sub: /subscriber|founder/.test(badges),
    color: /^#[0-9a-f]{6}$/i.test(tags.color || '') ? tags.color : null,
    emotes,
  };
}

// Map a chat message to an intent. Bits always count as a chaos credit even with no command.
export function parseCommand(msg) {
  const m = /^!(\w+)\s*(.*)$/.exec(msg.text.trim());
  const name = m?.[1].toLowerCase();
  const spec = name && COMMANDS[name];
  if (spec) return { name, ...spec, arg: m[2].trim() };
  if (msg.bits > 0) return { name: 'cheer', kind: 'support', bits: msg.bits };
  return null;
}

// Turns a stream of chat commands into bounded game events.
// - per-viewer cooldown so one person cannot spam,
// - global chaos cooldown so the streamer always gets a beat to recover,
// - help needs N distinct viewers inside `helpWindow` seconds,
// - every resulting event carries the names of who caused it (for spill blame + credits).
export class ChatDirector {
  constructor({ userCooldown = 15, chaosCooldown = 4, helpWindow = 6, now = () => performance.now() / 1000 } = {}) {
    Object.assign(this, { userCooldown, chaosCooldown, helpWindow, now, bigChat: 5 });
    this.seen = new Map(); this.ballot = null;
    this.lastByUser = new Map();
    this.lastChaos = -Infinity;
    this.helpVotes = new Map(); // event -> Map(user -> time)
    this.queue = []; // pending chaos when on global cooldown (max 3, oldest dropped)
  }

  // Returns {event, users, kind} to fire now, {queued:true}, {frame}, or null.
  // BALLOTS: in a big chat, free viewers vote instead of firing directly. One vote per viewer (changeable).
  openBallot(options, seconds = 8) { this.ballot = { options, votes: new Map(), ends: this.now() + seconds, seconds }; return this.ballot; }
  ballotState() { const b = this.ballot; if (!b) return null; const counts = b.options.map((_, i) => [...b.votes.values()].filter(v => v.i === i).length); return { options: b.options, counts, left: Math.max(0, b.ends - this.now()), seconds: b.seconds }; }
  active(window = 60) { const t = this.now(); let n = 0; for (const v of this.seen.values()) if (t - v < window) n++; return n; }
  vote(msg, text) {
    const b = this.ballot; if (!b) return null;
    const m = /^!?([1-9])$/.exec(text.trim()); let i = m ? Number(m[1]) - 1 : -1;
    if (i < 0) { const c = parseCommand(msg); if (c) i = b.options.indexOf(c.event); }
    if (i < 0 || i >= b.options.length) return null;
    b.votes.set(msg.login, { i, user: msg.user }); return { kind: 'ballot', ...this.ballotState() };
  }
  handle(msg) {
    const t = this.now();
    this.seen ??= new Map(); this.seen.set(msg.login, t);
    const voted = this.vote(msg, msg.text); if (voted) return voted;
    const cmd = parseCommand(msg);
    if (!cmd) return null;
    if (cmd.kind === 'order') return { kind: 'order', user: msg.user, tickets: msg.sub ? 2 : 1 };
    if (cmd.kind === 'frame') {
      const emote = msg.emotes[0];
      return emote ? { kind: 'frame', user: msg.user, image: emoteUrl(emote.id), title: emote.name, trusted: true }
        : cmd.arg ? { kind: 'frame', user: msg.user, image: cmd.arg, title: 'submitted by ' + msg.user, trusted: false } : null;
    }
    if (cmd.kind === 'support') return { kind: 'support', users: [msg.user], bits: cmd.bits };
    const last = this.lastByUser.get(msg.login) ?? -Infinity;
    if (!msg.mod && t - last < this.userCooldown) return null;
    this.lastByUser.set(msg.login, t);
    if (cmd.kind === 'help') {
      const votes = this.helpVotes.get(cmd.event) || new Map();
      votes.set(msg.user, t);
      for (const [u, vt] of votes) if (t - vt > this.helpWindow) votes.delete(u);
      this.helpVotes.set(cmd.event, votes);
      if (votes.size >= cmd.needed) {
        const users = [...votes.keys()];
        votes.clear();
        return { kind: 'help', event: cmd.event, users };
      }
      return { kind: 'vote', event: cmd.event, have: votes.size, needed: cmd.needed, users: [msg.user] };
    }
    // big chat: free chaos commands only count as votes (handled above); mods always fire
    if (!msg.mod && this.active() >= this.bigChat) return { kind: 'muted', event: cmd.event, users: [msg.user] };
    const fired = { kind: 'chaos', event: cmd.event, users: [msg.user] };
    if (t - this.lastChaos >= this.chaosCooldown) { this.lastChaos = t; return fired; }
    this.queue.push(fired);
    if (this.queue.length > 3) this.queue.shift();
    return { kind: 'queued', event: cmd.event, users: [msg.user] };
  }

  // Call every frame; releases one queued chaos event when the global cooldown allows.
  tick() {
    const t = this.now();
    if (this.ballot && t >= this.ballot.ends) { // close the ballot: the winner fires, one winning voter is its face
      const b = this.ballot, st = this.ballotState(); this.ballot = null;
      const best = Math.max(...st.counts); if (!best) return { kind: 'ballotEnd', event: null, users: [] };
      const tied = st.counts.map((c, i) => c === best ? i : -1).filter(i => i >= 0), win = tied[Math.floor(Math.random() * tied.length)];
      const voters = [...b.votes.values()].filter(v => v.i === win).map(v => v.user), face = voters[Math.floor(Math.random() * voters.length)];
      return { kind: 'ballotEnd', event: b.options[win], users: [face, ...voters.filter(v => v !== face)], votes: best };
    }
    if (this.queue.length && t - this.lastChaos >= this.chaosCooldown) { this.lastChaos = t; return this.queue.shift(); }
    return null;
  }
}

// Anonymous read-only connection with auto-reconnect. onMessage receives parsed chat messages.
export function connectChat(channel, { onMessage, onStatus = () => {} } = {}) {
  channel = String(channel).toLowerCase().replace(/^#/, '').replace(/[^a-z0-9_]/g, '');
  let ws, closed = false, retry = 1000;
  const open = () => {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`);
      ws.send(`JOIN #${channel}`);
      retry = 1000;
      onStatus('connected', channel);
    };
    ws.onmessage = e => {
      for (const line of String(e.data).split('\r\n')) {
        if (line.startsWith('PING')) { ws.send(line.replace('PING', 'PONG')); continue; }
        const msg = parseLine(line);
        if (msg) onMessage?.(msg);
      }
    };
    ws.onclose = () => {
      if (closed) return;
      onStatus('reconnecting', channel);
      setTimeout(open, retry);
      retry = Math.min(retry * 2, 15000);
    };
  };
  if (channel) open();
  return { channel, close() { closed = true; ws?.close(); onStatus('disconnected', channel); } };
}
