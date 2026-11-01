-- LAST SIP leaderboards. Writes go ONLY through the edge function (service role), which verifies the
-- caller's Twitch token with id.twitch.tv/oauth2/validate, so a channel name can't be spoofed.
-- Reads are public (anon key) through views.

create table if not exists pours (
  id bigint generated always as identity primary key,
  seed date not null,
  channel text not null,             -- twitch login, from the validated token
  channel_id text not null,
  water real not null check (water between 0 and 1),
  time_s real not null check (time_s between 0 and 120),
  score int not null check (score between 0 and 2000),
  finished boolean not null,
  saves int not null default 0,
  created_at timestamptz not null default now(),
  unique (seed, channel_id)          -- one official Pour per channel per day
);

create table if not exists spills (
  seed date not null,
  channel_id text not null,
  viewer text not null,
  spilled real not null check (spilled between 0 and 1),
  primary key (seed, channel_id, viewer)
);

alter table pours enable row level security;
alter table spills enable row level security;
create policy "public read pours" on pours for select using (true);
create policy "public read spills" on spills for select using (true);

-- Today's Pour (streamers) and Most Wanted (viewers summed across every channel)
create or replace view board_pour as
  select seed, channel, score, water, time_s, finished from pours order by score desc;
create or replace view board_wanted as
  select seed, viewer, sum(spilled) as spilled, count(distinct channel_id) as channels
  from spills where viewer not in ('YOUR OWN HANDS', 'THE HOUSE', 'THE BANANA')
  group by seed, viewer order by spilled desc;
create or replace view board_stats as
  select seed, count(*) as pours, avg(finished::int) as finish_rate,
         percentile_cont(0.5) within group (order by water) as median_water
  from pours group by seed;
