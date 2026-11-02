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

test('ballot: one changeable vote per viewer, winner fires with a voter as its face', () => {
  let now = 0; const d = new ChatDirector({ now: () => now });
  const m = (login, text, extra = {}) => ({ user: login.toUpperCase(), login, text, bits: 0, mod: false, emotes: [], ...extra });
  d.openBallot(['sniper', 'barrel', 'drop'], 8);
  d.handle(m('a', '1')); d.handle(m('b', '2')); d.handle(m('c', '2')); d.handle(m('a', '2')); // a changes vote
  assert.deepEqual(d.ballotState().counts, [0, 3, 0]);
  d.handle(m('e', '!sniper')); assert.equal(d.ballotState().counts[0], 1); // command name counts as a vote
  now = 9; const end = d.tick();
  assert.equal(end.kind, 'ballotEnd'); assert.equal(end.event, 'barrel'); assert.equal(end.users.length, 3);
  assert.ok(['A', 'B', 'C'].includes(end.users[0]));
});

test('big chat: free chaos commands are muted (vote instead); !order enters the raffle, subs get 3 tickets (chatting alone = 1)', () => {
  let now = 0; const d = new ChatDirector({ now: () => now });
  const m = (login, text, extra = {}) => ({ user: login, login, text, bits: 0, mod: false, emotes: [], ...extra });
  for (const u of ['v1', 'v2', 'v3', 'v4', 'v5']) d.handle(m(u, 'hi'));
  assert.equal(d.handle(m('v6', '!barrel')).kind, 'muted');
  assert.equal(d.handle(m('mod', '!barrel', { mod: true })).kind, 'chaos');
  assert.deepEqual(d.handle(m('v7', '!order', { sub: true })), { kind: 'order', user: 'v7', tickets: 3 });
});

test('USERNOTICE: subs, gift subs, gift bombs and raids parse from anonymous chat', () => {
  const sub = parseLine('@badge-info=subscriber/5;badges=subscriber/3;color=#FF4500;display-name=Ronni;login=ronni;msg-id=resub;msg-param-cumulative-months=5;msg-param-sub-plan=1000;room-id=1;tmi-sent-ts=1 :tmi.twitch.tv USERNOTICE #dallas :Great stream -- keep it up!');
  assert.equal(sub.notice, 'sub'); assert.equal(sub.user, 'Ronni'); assert.equal(sub.months, 5); assert.equal(sub.text, 'Great stream -- keep it up!'); assert.equal(sub.color, '#FF4500');
  const gift = parseLine('@display-name=TWW2;login=tww2;msg-id=subgift;msg-param-recipient-display-name=Mr_Woodchuck;msg-param-sub-plan=1000 :tmi.twitch.tv USERNOTICE #forstycup');
  assert.equal(gift.notice, 'gift'); assert.equal(gift.recipient, 'Mr_Woodchuck'); assert.equal(gift.text, '');
  const bomb = parseLine('@display-name=Gifter;login=gifter;msg-id=submysterygift;msg-param-mass-gift-count=10 :tmi.twitch.tv USERNOTICE #chan');
  assert.equal(bomb.notice, 'giftbomb'); assert.equal(bomb.count, 10);
  const raid = parseLine('@display-name=TestChannel;login=testchannel;msg-id=raid;msg-param-viewerCount=15 :tmi.twitch.tv USERNOTICE #othertestchannel');
  assert.equal(raid.notice, 'raid'); assert.equal(raid.user, 'TestChannel'); assert.equal(raid.count, 15);
  assert.equal(parseLine('@msg-id=bitsbadgetier :tmi.twitch.tv USERNOTICE #chan'), null);
  const d = new ChatDirector({ now: () => 0 });
  assert.equal(d.handle(raid).kind, 'notice');
});

test('channel points (text reward / highlight) go to the supporter lane; first-time chatters get noticed', () => {
  const d = new ChatDirector({ now: () => 0 });
  const redeem = parseLine('@custom-reward-id=abc-123;display-name=Pointy;badges= :pointy!pointy@pointy.tmi.twitch.tv PRIVMSG #chan :send a barrel please');
  assert.equal(redeem.reward, 'abc-123');
  assert.deepEqual(d.handle(redeem), { kind: 'redeem', event: 'barrel', users: ['Pointy'], text: 'send a barrel please' });
  const hl = parseLine('@msg-id=highlighted-message;display-name=Shiny :shiny!shiny@shiny.tmi.twitch.tv PRIVMSG #chan :hello');
  assert.equal(d.handle(hl).event, null);
  const first = parseLine('@first-msg=1;display-name=Newbie;color=#00FF7F :newbie!newbie@newbie.tmi.twitch.tv PRIVMSG #chan :hi chat');
  assert.deepEqual(d.handle(first), { kind: 'first', user: 'Newbie', color: '#00FF7F' });
  assert.equal(d.handle(first), null); // only once
});
