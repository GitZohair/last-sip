"""Final cut v2: footage cut on the spoken words, trailer-style captions, xfade transitions.
  python tools/final.py voice     (once: builds video/final/vo1..vo9.wav)
  python tools/final2.py [s3 s7]  -> video/final/last_sip_final.mp4  (rebuild only the named sections)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from final import V, OUT, FONT, FPS, VOICE, run, dur, esc, card
SID = '01a19373-1629-76f2-a2ef-8676028cddb5'

DCROP = '1392:864:528:0'
XF = .4  # transition length between sections

# clip = (file, src_start, at (s into the section), speed, caption, crop)
def section2(clips, length, out):
    args, flt, labels = ['ffmpeg', '-y', '-loglevel', 'error'], [], []
    for i, c in enumerate(clips):
        f, st, at, sp, cap, crop = (list(c) + [None, None])[:6]
        take = (clips[i + 1][2] if i + 1 < len(clips) else length) - at
        args += ['-i', V(f)]
        src = take * sp; avail = dur(V(f)) - st; hold = 0
        if src > avail: hold = (src - avail) / sp; src = avail
        ch = f'[{i}:v]trim=start={st}:duration={src:.3f},setpts=(PTS-STARTPTS)/{sp},fps={FPS}'
        if crop: ch += f',crop={crop}'
        if hold > 0: ch += f',tpad=stop_mode=clone:stop_duration={hold:.3f}'
        ch += (f',split[f{i}][b{i}];[b{i}]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=28:3,eq=brightness=-0.18[bg{i}];'
               f'[f{i}]scale=1920:1080:force_original_aspect_ratio=decrease[fg{i}];[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,setsar=1')
        if cap:  # trailer caption style: heavy white on a dark pill, lower third
            ch += (f",drawtext=fontfile='{FONT}':text='{esc(cap)}':fontsize=68:fontcolor=white:box=1:boxcolor=0x18181bD9:boxborderw=24:"
                   f"x=(w-tw)/2:y=h-200:alpha='min(1,t*6)'")
        flt.append(ch + f',trim=duration={take:.3f}[v{i}]'); labels.append(f'[v{i}]')
    flt.append(f'{"".join(labels)}concat=n={len(labels)}:v=1:a=0,trim=duration={length:.3f}[v]')
    run(args + ['-filter_complex', ';'.join(flt), '-map', '[v]', '-an', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', out])

def plan2(vd):
    L = lambda k, extra=0: vd[k] + .55 + XF + extra
    D = 'raw/D_codex_take01.mp4'
    return [
      ('s1', 'vo1', L('vo1', .3), [('cut_v3/title.mp4', 0, 0, .7)], 'fade'),
      ('s2', 'vo2', L('vo2'), [('broll/establish.mp4', .5, 0, 1, 'LIKE ROB THE NEST, FOR STREAMERS'),
                               ('broll/tower.mp4', 0, 11.1, 1, 'STACK DRINKS. TALLER = BIGGER TIPS'),
                               ('edits/take02-driving.mp4', 0, 21.8, 1, '90 SECONDS. MOST TIPS WINS.')], 'smoothleft'),
      ('s3', 'vo3', L('vo3'), [('edits/B_front.mp4', 0, 0, 1, 'NO APP. NO LOGIN. JUST YOUR CHANNEL.'),
                               ('edits/take02-airstrike.mp4', 0, 6.4, 1, 'CHAT TYPES. THEIR MESSAGE FLIES IN.'),
                               ('edits/take02-airstrike.mp4', 10.0, 16.2, 1, 'IT QUOTES WHO DID IT'),
                               ('edits/take02-vote.mp4', 0, 21.0, 1, 'CHAT CAN SAVE YOU, RUIN YOU, OR VOTE')], 'fade'),
      ('s4', 'vo4', L('vo4'), [('edits/A2_busy-channel.mp4', 0, 0, 1, 'REAL LIVE CHANNEL. REAL CHATTERS.')], 'smoothleft'),
      ('s5', 'vo5', L('vo5'), [('cut_v3/p04.mp4', 0, 0, 1), ('cut_v3/p05.mp4', 0, 3.3, 1), ('cut_v3/p06.mp4', 0, 5.0, 1),
                               ('cut_v3/p07.mp4', 0, 7.9, 1), ('cut_v3/p08.mp4', 0, 9.5, 1), ('cut_v3/p09.mp4', 0, 12.0, 1)], 'fade'),
      ('s6', 'vo6', L('vo6'), [('edits/F_round-results.mp4', 0, 0, 1, 'LEADERBOARD + SHARE YOUR RESULT')], 'smoothleft'),
      ('s7', 'vo7', L('vo7'), [(D, 2.0, 0, 1, 'IDEAS: 13+ HOURS WITH CHATGPT', DCROP),
                               (D, 12.4, 10.2, .7, 'BUILT WITH CODEX', DCROP),
                               ('edits/D_codex-diffs.mp4', 0, 19.9, .45, 'CLAUDE CODE HELPED TOO'),
                               ('edits/D_codex-cover.mp4', 0, 26.5, .7, f'CODEX SESSION {SID}')], 'fade'),
      ('s8', 'vo8', L('vo8'), [('broll/airstrike.mp4', 0, 0, 1, '7 EXAMS. 3 DAYS. WHILE SICK.'), ('broll/offedge.mp4', 0, 10.0, 1),
                               ('broll/plane.mp4', 0, 15.4, 1, 'NO TWITCH DEV ACCESS = ZERO SETUP'), ('broll/co2.mp4', 0, 26.2, 1),
                               ('broll/finale.mp4', 0, 33.0, 1)], 'fade'),
      ('s9', 'vo9', L('vo9', 1.8), None, 'fadeblack'),
    ]

def build2(only=None):
    vd = {k: dur(os.path.join(OUT, f'{k}.wav')) for k in VOICE}
    hook = os.path.join(OUT, 's0.mp4')
    if not only or 's0' in only:
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', V('cut_v3/p00.mp4'), '-i', V('cut_v3/p02.mp4'), '-filter_complex',
             '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast',
             '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2', hook])
    P = plan2(vd); files = [hook]
    for name, k, ln, clips, tr in P:
        f = os.path.join(OUT, name + '.mp4'); files.append(f)
        if only and name not in only: continue
        if clips: section2(clips, ln, f)
        else: card('LAST SIP', 'FREE IN YOUR BROWSER. LET YOUR CHAT DECIDE.', 'lastsip-seven.vercel.app', ln, f)
        print(name, round(ln, 1), flush=True)
    lens = [dur(f) for f in files]
    args = ['ffmpeg', '-y', '-loglevel', 'error']
    for f in files: args += ['-i', f]
    flt = [f'[{i}:v]settb=AVTB,fps={FPS},format=yuv420p,setsar=1[n{i}]' for i in range(len(files))]
    prev, t, starts = '[n0]', lens[0], []
    for i, (name, k, ln, clips, tr) in enumerate(P, 1):
        off = t - XF; starts.append(off)
        flt.append(f'{prev}[n{i}]xfade=transition={tr}:duration={XF}:offset={off:.3f}[x{i}]'); prev = f'[x{i}]'; t = off + lens[i]
    total = t; nv = len(files)
    for name, k, *_ in P: args += ['-i', os.path.join(OUT, k + '.wav')]
    args += ['-i', V('music/pixel-peeker-polka-faster.mp3')]
    flt.append(f'[0:a]volume=0.8,apad,atrim=0:{total:.3f}[fx]'); mix = ['[fx]']
    for j, s in enumerate(starts):  # voice starts right after each transition
        ms = int((s + XF + .1) * 1000)
        flt.append(f'[{nv + j}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=9,adelay={ms}|{ms}[vo{j}]'); mix.append(f'[vo{j}]')
    end = starts[-1] + XF
    flt.append(f"[{nv + len(P)}:a]atrim=0:{total:.3f},volume='if(lt(t,{lens[0]:.2f}),0.6,if(gt(t,{end + 2:.2f}),0.35,0.08))':eval=frame,afade=out:st={total - 2:.2f}:d=2[mu]"); mix.append('[mu]')
    flt.append(f'{"".join(mix)}amix=inputs={len(mix)}:normalize=0:duration=longest,atrim=0:{total:.3f},alimiter=limit=0.93[a]')
    out = V('final/last_sip_final.mp4')
    run(args + ['-filter_complex', ';'.join(flt), '-map', prev, '-map', '[a]', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
                '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out])
    print('done', out, round(dur(out), 1), 'starts', [round(s, 1) for s in starts])

if __name__ == '__main__': build2(sys.argv[1:] or None)
