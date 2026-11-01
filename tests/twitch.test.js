import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLine, ChatDirector, parseEmotes } from '../src/twitch.js';
import { checkUrl, verdict } from '../src/moderation.js';
import { Ledger } from '../src/game/ledger.js';

const line = (text, extra = '') => `@badges=;color=#FF0000;display-name=Foo;emotes=${extra};mod=0 :foo!foo@foo.tmi.twitch.tv PRIVMSG #chan :${text}`;

test('parses chat line with emotes and bits', () => {
  const m = parseLine(line('!frame Kappa', '25:7-11'));
  assert.equal(m.user, 'Foo'); assert.equal(m.channel, 'chan'); assert.equal(m.emotes[0].name, 'Kappa');
  assert.equal(parseLine('@bits=100;display-name=B :b!b@b PRIVMSG #c :Cheer100 go').bits, 100);
  assert.equal(parseLine(':tmi.twitch.tv PING'), null);
  assert.deepEqual(parseEmotes('1:5-6/2:0-1').map(e => e.id), ['2', '1']);
});

test('director enforces cooldowns, queues chaos, needs 3 helpers', () => {
  let now = 0; const d = new ChatDirector({ now: () => now });
  const msg = (u, text) => ({ ...parseLine(line(text)), user: u, login: u });
  assert.equal(d.handle(msg('a', '!bomb')).kind, 'chaos');
  assert.equal(d.handle(msg('a', '!ice')), null, 'per-user cooldown');
  assert.equal(d.handle(msg('b', '!ice')).kind, 'queued', 'global cooldown');
  now = 5; assert.equal(d.tick().event, 'ice');
  assert.equal(d.handle(msg('c', '!steady')).kind, 'vote');
  assert.equal(d.handle(msg('d', '!steady')).kind, 'vote');
  const help = d.handle(msg('e', '!steady')); assert.equal(help.kind, 'help'); assert.equal(help.users.length, 3);
  const f = d.handle({ ...msg('f', '!frame Kappa'), emotes: [{ id: '25', name: 'Kappa' }] });
  assert.equal(f.trusted, true); assert.match(f.image, /jtvnw/);
});

test('moderation rejects unsafe sources and NSFW predictions', () => {
  assert.equal(checkUrl('http://i.imgur.com/a.png').ok, false);
  assert.equal(checkUrl('https://evil.example/a.png').ok, false);
  assert.equal(checkUrl('https://i.imgur.com/a.png').ok, true);
  assert.equal(verdict([{ className: 'Porn', probability: .4 }]).ok, false);
  assert.equal(verdict([{ className: 'Neutral', probability: .9 }, { className: 'Sexy', probability: .1 }]).ok, true);
});

test('ledger blames hot causes, else the streamer', () => {
  const l = new Ledger(); l.spill(.1, 0); l.blame(['viewer'], 'BOMB', 3, 1); l.spill(.2, 2); l.spill(.05, 10);
  const c = l.credits(); assert.equal(c[0].name, 'viewer'); assert.equal(l.villain().name, 'viewer');
  assert.ok(Math.abs(c.find(x => x.name === 'YOUR OWN HANDS').amount - .15) < 1e-9);
});
