"""Final submission cut: trailer + sections cut to the voiceover.
  python tools/final.py            -> video/final/last_sip_final.mp4
Each section = voice chunks from video/vo/take1_clean.wav (cut out the mistakes) + a list of footage clips
filling the section's length. Non-16:9 footage sits on a blurred copy of itself; captions go in the free bar."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = lambda p: os.path.join(ROOT, 'video', p)
OUT = V('final'); os.makedirs(OUT, exist_ok=True)
FONT = 'C\\:/Windows/Fonts/seguibl.ttf'
VO = V('vo/take1_clean.wav')
FPS = 60

def run(a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode: print(' '.join(a)[-3000:]); print(r.stderr[-3000:]); sys.exit(1)
def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
def esc(t): return t.replace('\\', '\\\\').replace("'", '’').replace(':', '\\:').replace('%', '\\%').replace(',', '\\,')

def voice(chunks, out, gap=.18):
    """cut (start, end) chunks from the cleaned take, tiny fades, short gaps between them."""
    flt, ins = [], []
    for i, (a, b) in enumerate(chunks):
        flt.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=in:d=0.03,afade=out:st={b - a - .05:.3f}:d=0.05,apad=pad_dur={gap}[c{i}]'); ins.append(f'[c{i}]')
    flt.append(f'{"".join(ins)}concat=n={len(chunks)}:v=0:a=1[a]')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', VO, '-filter_complex', ';'.join(flt), '-map', '[a]', '-ar', '48000', '-ac', '1', out])
    return dur(out)

# a footage clip: (file, start, seconds, speed, caption, crop)  crop = 'w:h:x:y' or None
def section(name, clips, length, out):
    """fill `length` seconds with clips in order (last clip absorbs the remainder; slowed a little or held)."""
    args, flt, labels, t = ['ffmpeg', '-y', '-loglevel', 'error'], [], [], 0.0
    for i, c in enumerate(clips):
        f, st, ln, sp, cap, crop = (list(c) + [None])[:6]
        last = i == len(clips) - 1
        take = (length - t) if last else min(ln / sp, length - t)
        if take <= .05: break
        args += ['-i', V(f)]
        src = take * sp; hold = 0
        avail = dur(V(f)) - st
        if src > avail: hold = (src - avail) / sp; src = avail
        ch = f'[{i}:v]trim=start={st}:duration={src:.3f},setpts=(PTS-STARTPTS)/{sp},fps={FPS}'
        if crop: ch += f',crop={crop}'
        if hold > 0: ch += f',tpad=stop_mode=clone:stop_duration={hold:.3f}'
        ch += f',split[f{i}][b{i}];[b{i}]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=28:3,eq=brightness=-0.18[bg{i}];'
        ch += f'[f{i}]scale=1920:1080:force_original_aspect_ratio=decrease[fg{i}];[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,setsar=1'
        if cap:
            ch += (f",drawtext=fontfile='{FONT}':text='{esc(cap)}':fontsize=50:fontcolor=white:box=1:boxcolor=0x18181bE0:boxborderw=18:"
                   f"x=(w-tw)/2:y=h-th-34:alpha='min(1,t*5)'")
        flt.append(ch + f'[v{i}]'); labels.append(f'[v{i}]'); t += take
    flt.append(f'{"".join(labels)}concat=n={len(labels)}:v=1:a=0,trim=duration={length:.3f}[v]')
    run(args + ['-filter_complex', ';'.join(flt), '-map', '[v]', '-an', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', out])

def card(title, sub, url, secs, out, bg=('broll/finale.mp4', 3.0)):
    vf = (f"scale=1920:1080,boxblur=18:2,eq=brightness=-0.14,"
          f"drawtext=fontfile='{FONT}':text='{esc(title)}':fontsize=200:fontcolor=white:x=(w-tw)/2:y=(h-th)/2-110,"
          f"drawtext=fontfile='{FONT}':text='{esc(sub)}':fontsize=60:fontcolor=0xffd166:x=(w-tw)/2:y=(h/2)+50,"
          f"drawtext=fontfile='{FONT}':text='{esc(url)}':fontsize=54:fontcolor=white:box=1:boxcolor=0x18181bD0:boxborderw=18:x=(w-tw)/2:y=h-200,fade=in:st=0:d=0.25")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(bg[1]), '-i', V(bg[0]), '-t', str(secs), '-vf', vf, '-an', '-r', str(FPS),
         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', out])

# voice: word-level cuts from the transcript (best takes, notes-to-Claude, repeats and gaps removed)
import json
TX = os.path.join(os.environ.get('SCRATCH', ''), 'tx.json')
VOICE = {  # (from, to) ranges in take1_clean.wav ; words inside CUT ranges are dropped
  'vo1': [(3.6, 8.2)],
  'vo2': [(9.1, 37.5)],
  'vo3': [(43.2, 50.65), (51.55, 63.05), (64.4, 69.35), (70.1, 75.1), (76.7, 88.15)],
  'vo4': [(98.7, 102.95), (108.75, 111.35)],
  'vo5': [(119.8, 126.8), (127.55, 129.45), (138.9, 145.35)],
  'vo6': [(164.35, 171.55)],
  'vo7': [(242.5, 253.55), (254.05, 263.45), (265.8, 274.1), (274.85, 278.7)],
  'vo8': [(301.4, 305.3), (305.8, 316.15), (316.7, 327.6), (327.9, 331.75), (372.8, 386.0)],
  'vo9': [(390.8, 396.0), (397.2, 398.4)],
}
SQUEEZE = 'silenceremove=stop_periods=-1:stop_duration=0.22:stop_threshold=-35dB:stop_silence=0.13,atempo=1.03'

def runs(ranges, words):
    out = []
    for a, b in ranges:
        ws = [w for w in words if w[0] >= a - .06 and w[1] <= b + .06]
        cur = None
        for w in ws:
            if cur and w[0] - cur[1] <= .2: cur[1] = w[1]
            else:
                if cur: out.append(cur)
                cur = [w[0], w[1]]
        if cur: out.append(cur)
    return [(max(0, x - .05), y + .08) for x, y in out]

def build_voice():
    words = [tuple(w) for seg in json.load(open(TX)) for w in seg['w']]
    d = {}
    for k, rng in VOICE.items():
        raw = os.path.join(OUT, f'{k}_raw.wav'); voice(runs(rng, words), raw, gap=.1)
        f = os.path.join(OUT, f'{k}.wav'); run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', SQUEEZE, f]); d[k] = dur(f)
    return d

def cues():
    """re-transcribe each built section so the footage can cut on the spoken words"""
    from faster_whisper import WhisperModel
    import wave, numpy as np
    m = WhisperModel('base', device='cpu', compute_type='int8', local_files_only=True)
    out = {}
    for k in VOICE:
        w = wave.open(os.path.join(OUT, f'{k}_16k.wav')) if False else None
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, f'{k}.wav'), '-ar', '16000', '-ac', '1', os.path.join(OUT, f'{k}_16k.wav')])
        w = wave.open(os.path.join(OUT, f'{k}_16k.wav')); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        segs, _ = m.transcribe(a, language='en', word_timestamps=True, beam_size=1)
        out[k] = [(x.start, x.word.strip().lower().strip('.,!?')) for sg in segs for x in sg.words]
        print(k, ' '.join(f'{w}@{t:.1f}' for t, w in out[k]))
    json.dump(out, open(os.path.join(OUT, 'cues.json'), 'w'))

if __name__ == '__main__' and sys.argv[1:] == ['voice']:
    d = build_voice(); print({k: round(v, 1) for k, v in d.items()}, 'total', round(sum(d.values()), 1)); cues()
