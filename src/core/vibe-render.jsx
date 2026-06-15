// vibe-render.jsx — "Render": re-pace the scene timeline to the real narration.
//
// Scene lengths are authored as fixed guesses (scene-local seconds ×SLIDE_SLOW).
// When a narration line is longer than its scene's slice, the clock gate holds
// real time at the line's end while the audio finishes — but the scene's Sprite
// has already passed its `end`, so the scene vanishes mid-sentence (e.g. the
// "Orderbooks…" intro line outlasting the S0 title card).
//
// "Render" fixes this: it measures each line's generated clip duration, then
// lays the scenes out back-to-back in real time so every scene stays on screen
// exactly as long as its own voiceover lines take. The scene-local clock the
// scenes are built in is preserved — only the real↔scene-local mapping changes
// (a piecewise warp), so no scene code needs to know about it.

// Measure each line's cached clip duration (seconds), in `items` order. Lines
// with no cached clip fall back to a reading-speed estimate so the map is always
// complete (no NaN gaps). Needs no API key — it only reads what's already cached.
async function vibeMeasureDurations(items, voiceId) {
  const durations = [];
  for (const it of items) {
    const key = elClipKey(voiceId, it.text);
    let url = null, revoke = false;
    const mem = ELCache.mem.get(key);
    if (mem && mem.url) {
      url = mem.url;
    } else {
      const blob = await elIdbGet(key);
      if (blob) { url = URL.createObjectURL(blob); revoke = true; }
    }
    let dur = null;
    if (url) {
      dur = await new Promise((res) => {
        const a = new Audio();
        a.preload = 'metadata';
        a.onloadedmetadata = () => res(isFinite(a.duration) && a.duration > 0 ? a.duration : null);
        a.onerror = () => res(null);
        a.src = url;
      });
    }
    if (revoke && url) { try { URL.revokeObjectURL(url); } catch {} }
    if (dur == null) {
      const words = (it.text || '').trim().split(/\s+/).filter(Boolean).length;
      dur = Math.max(1.5, words / 2.6); // ~2.6 words/sec spoken pace
    }
    durations.push(dur);
  }
  return durations;
}

// Build a scene-paced timeline from measured clip durations.
//   durations:   seconds per line (from vibeMeasureDurations)
//   lineCues:    scene-local cue (seconds) of each line, same order as durations
//   sceneStarts: scene-local start of each scene (ascending)
//   totalScene:  scene-local end of the last scene
// Returns { cues:[{t,t2}], realToScene, sceneToReal, duration, sceneRealStarts, sceneOf }.
function vibeBuildSceneRenderMap({ durations, lineCues, sceneStarts, totalScene,
  readGap = 0.55, scenePad = 0.5, lead = 0.5 }) {
  const nScenes = sceneStarts.length;
  const r2 = (x) => Math.round(x * 100) / 100;
  // Which scene each line belongs to: the last scene whose start it is at/after.
  const sceneOf = lineCues.map((c) => {
    let s = 0;
    for (let i = 0; i < nScenes; i++) if (c >= sceneStarts[i] - 1e-6) s = i;
    return s;
  });
  // Real seconds each scene needs = sum of its lines (clip + gap) + a tail pad.
  // Empty scenes keep their nominal scene-local length so the map stays sane.
  const sceneRealDur = new Array(nScenes).fill(0);
  for (let s = 0; s < nScenes; s++) {
    let sum = 0, members = 0;
    for (let i = 0; i < durations.length; i++) {
      if (sceneOf[i] === s) { sum += durations[i] + readGap; members++; }
    }
    const nominal = (s + 1 < nScenes ? sceneStarts[s + 1] : totalScene) - sceneStarts[s];
    sceneRealDur[s] = members ? sum + scenePad : Math.max(1, nominal);
  }
  // Cumulative real scene starts.
  const sceneRealStarts = new Array(nScenes);
  let cur = 0;
  for (let s = 0; s < nScenes; s++) { sceneRealStarts[s] = cur; cur += sceneRealDur[s]; }
  const totalReal = cur;
  // Piecewise-linear map anchored at scene boundaries.
  const bpReal = sceneRealStarts.concat([totalReal]);
  const bpScene = sceneStarts.concat([totalScene]);
  const lerp = (x, xs, ys) => {
    const n = xs.length;
    if (x <= xs[0]) {
      const k = (ys[1] - ys[0]) / ((xs[1] - xs[0]) || 1);
      return ys[0] + (x - xs[0]) * k;
    }
    for (let i = 0; i < n - 1; i++) {
      if (x <= xs[i + 1]) {
        const f = (x - xs[i]) / ((xs[i + 1] - xs[i]) || 1);
        return ys[i] + f * (ys[i + 1] - ys[i]);
      }
    }
    const k = (ys[n - 1] - ys[n - 2]) / ((xs[n - 1] - xs[n - 2]) || 1);
    return ys[n - 1] + (x - xs[n - 1]) * k;
  };
  const realToScene = (r) => lerp(r, bpReal, bpScene);
  const sceneToReal = (s) => lerp(s, bpScene, bpReal);
  // Lay each scene's lines back-to-back in real time (caption + gate cues).
  const cues = new Array(durations.length);
  for (let s = 0; s < nScenes; s++) {
    let c = sceneRealStarts[s] + (s === 0 ? lead : scenePad * 0.4);
    for (let i = 0; i < durations.length; i++) {
      if (sceneOf[i] === s) {
        cues[i] = { t: r2(c), t2: r2(c + durations[i] + 0.05) };
        c += durations[i] + readGap;
      }
    }
  }
  return {
    cues, realToScene, sceneToReal,
    duration: Math.ceil(totalReal + 1),
    sceneRealStarts, sceneOf,
  };
}

Object.assign(window, { vibeMeasureDurations, vibeBuildSceneRenderMap });
