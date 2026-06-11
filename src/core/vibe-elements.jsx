// vibe-elements.jsx — shared sketch primitives for the Vibe whiteboard explainer.
// Whiteboard aesthetic: ink strokes that draw themselves on, slight jitter,
// handwritten type, one electric-blue accent (CSS var --accent).
// All components expect to live inside a <Sprite> (scene) and use scene-local time.

// Global animation pace: durations of draw-ons/pop-ins are multiplied by this.
// Start cues stay locked to the narration timeline, so captions/voiceover sync
// is unaffected — only the motion itself plays slower.
const ANIM = 1.3; // 30% slower

// ── Seeded jitter helpers ────────────────────────────────────────────────────
function vibeRng(seed) {
  let s = (Math.floor(seed * 9973) % 2147483647);
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Wobbly line: quadratic curve(s) through midpoints with jitter.
function sketchLine(x1, y1, x2, y2, seed = 1, amt = 3) {
  const R = vibeRng(seed);
  const j = () => (R() - 0.5) * 2 * amt;
  const mx = (x1 + x2) / 2 + j(), my = (y1 + y2) / 2 + j();
  return `M ${x1 + j()} ${y1 + j()} Q ${mx} ${my} ${x2 + j()} ${y2 + j()}`;
}

// Wobbly rounded rect.
function sketchRect(x, y, w, h, r = 14, seed = 1, amt = 2.5) {
  const R = vibeRng(seed);
  const j = () => (R() - 0.5) * 2 * amt;
  const side = (xa, ya, xb, yb) =>
    `Q ${(xa + xb) / 2 + j()} ${(ya + yb) / 2 + j()} ${xb + j()} ${yb + j()} `;
  let d = `M ${x + r + j()} ${y + j()} `;
  d += side(x + r, y, x + w - r, y);
  d += `Q ${x + w + j()} ${y + j()} ${x + w + j()} ${y + r + j()} `;
  d += side(x + w, y + r, x + w, y + h - r);
  d += `Q ${x + w + j()} ${y + h + j()} ${x + w - r + j()} ${y + h + j()} `;
  d += side(x + w - r, y + h, x + r, y + h);
  d += `Q ${x + j()} ${y + h + j()} ${x + j()} ${y + h - r + j()} `;
  d += side(x, y + h - r, x, y + r);
  d += `Q ${x + j()} ${y + j()} ${x + r} ${y} Z`;
  return d;
}

// Wobbly circle (4 cubic arcs, jittered anchors).
function sketchCircle(cx, cy, r, seed = 1, amt = 0.05) {
  const R = vibeRng(seed);
  const k = 0.5523 * r;
  const jr = () => r * (1 + (R() - 0.5) * 2 * amt);
  const r1 = jr(), r2 = jr(), r3 = jr(), r4 = jr();
  return [
    `M ${cx} ${cy - r1}`,
    `C ${cx + k} ${cy - r1} ${cx + r2} ${cy - k} ${cx + r2} ${cy}`,
    `C ${cx + r2} ${cy + k} ${cx + k} ${cy + r3} ${cx} ${cy + r3}`,
    `C ${cx - k} ${cy + r3} ${cx - r4} ${cy + k} ${cx - r4} ${cy}`,
    `C ${cx - r4} ${cy - k} ${cx - k} ${cy - r1} ${cx} ${cy - r1} Z`,
  ].join(' ');
}

// Scribble underline (back-and-forth marker stroke).
function scribblePath(x, y, w, seed = 7) {
  const R = vibeRng(seed);
  const j = (a) => (R() - 0.5) * 2 * a;
  return `M ${x} ${y + j(3)} Q ${x + w * 0.4} ${y + j(7)} ${x + w} ${y + j(4)} ` +
         `M ${x + w * 0.96} ${y + 9 + j(3)} Q ${x + w * 0.5} ${y + 9 + j(6)} ${x + w * 0.07} ${y + 9 + j(4)}`;
}

// Arrow: shaft + head, as one path.
function sketchArrow(x1, y1, x2, y2, seed = 3, head = 18, amt = 3) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ha = 0.5;
  const hx1 = x2 - head * Math.cos(a - ha), hy1 = y2 - head * Math.sin(a - ha);
  const hx2 = x2 - head * Math.cos(a + ha), hy2 = y2 - head * Math.sin(a + ha);
  return sketchLine(x1, y1, x2, y2, seed, amt) +
    ` M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`;
}

// 4-point sparkle star.
function sparklePath(cx, cy, r) {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

// ── Seg: scene-local sub-window (like Sprite, but re-bases parent localTime) ──
function Seg({ start = 0, end = Infinity, keepAfter = true, children }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  if (!keepAfter && localTime > end) return null;
  const duration = end - start;
  const lt = localTime - start;
  const progress = isFinite(duration) && duration > 0 ? clamp(lt / duration, 0, 1) : 1;
  const value = { localTime: lt, progress, duration, visible: true };
  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}

// Extract plain text from children (the host editor may wrap literal JSX text
// in instrumentation elements; never rely on String(children)).
function textOf(ch) {
  if (ch == null || ch === false) return '';
  if (typeof ch === 'string' || typeof ch === 'number') return String(ch);
  if (Array.isArray(ch)) return ch.map(textOf).join('');
  if (ch.props) return textOf(ch.props.children);
  return '';
}

// ── DrawPath: SVG path that draws itself on ─────────────────────────────────
function DrawPath({ d, stroke = 'var(--ink)', width = 5, fill = 'none', fillOpacity = 1,
  start = 0, dur = 0.8, ease = Easing.easeInOutCubic, opacity = 1, dashed = false }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const D = dur * ANIM;
  const p = ease(clamp((localTime - start) / D, 0, 1));
  const fp = fill !== 'none' ? clamp((localTime - start - D * 0.55) / (D * 0.6), 0, 1) : 0;
  return (
    <g opacity={opacity}>
      {fill !== 'none' && <path d={d} fill={fill} opacity={fp * fillOpacity} stroke="none"></path>}
      {dashed ? (
        <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round"
          strokeLinejoin="round" strokeDasharray="14 16" opacity={p}></path>
      ) : (
        <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round"
          strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p}></path>
      )}
    </g>
  );
}

// ── HandText: handwritten HTML text with marker pop-in ──────────────────────
// plate: sketched paper card behind the text (wobbly hand-drawn border) for
// readability when the label sits on top of scene artwork.
function HandText({ x, y, size = 40, color = 'var(--ink)', font = 'var(--font-hand)',
  weight = 400, start = 0, dur = 0.4, rotate = 0, align = 'left', width,
  lineHeight = 1.18, children, fadeOutAt = null, plate = false }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const e = Easing.easeOutBack(clamp((localTime - start) / (dur * ANIM), 0, 1));
  let o = clamp((localTime - start) / (dur * ANIM * 0.5), 0, 1);
  if (fadeOutAt != null && localTime > fadeOutAt) o *= clamp(1 - (localTime - fadeOutAt) / (0.4 * ANIM), 0, 1);
  if (o <= 0) return null;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0%';
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: width || 'max-content',
      maxWidth: width ? undefined : 1800,
      transform: `translate(${tx}, 0) rotate(${rotate}deg) scale(${0.75 + 0.25 * e})`,
      transformOrigin: align === 'center' ? 'center top' : 'left top',
      opacity: o, fontFamily: font, fontWeight: weight, fontSize: size, color,
      lineHeight, textAlign: align, whiteSpace: width ? 'normal' : 'nowrap',
      textWrap: width ? 'pretty' : 'nowrap', willChange: 'transform, opacity',
      ...(plate ? {
        background: 'var(--paper2)',
        border: '3.5px solid var(--ink-soft)',
        borderRadius: '255px 18px 225px 18px / 18px 225px 18px 255px',
        padding: '10px 30px 14px',
        boxShadow: '4px 5px 0 rgba(28,30,42,0.08)',
      } : null),
    }}>{children}</div>
  );
}

// ── SvgText: handwritten text inside an SVG scene ────────────────────────────
// plate: draws a wobbly filled paper plate behind the text for readability
// when the label sits on top of arrows/lines.
function SvgText({ x, y, size = 30, color = 'var(--ink)', font = 'var(--font-hand)',
  weight = 400, start = 0, dur = 0.35, anchor = 'middle', children, opacity = 1,
  plate = false, plateSeed = 7 }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const o = clamp((localTime - start) / (dur * ANIM), 0, 1) * opacity;
  const txt = textOf(children);
  let plateEl = null;
  if (plate) {
    const w = txt.length * size * 0.52 + size * 0.9;
    const h = size * 1.42;
    const px = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    plateEl = (
      <path d={sketchRect(px, y - size * 1.02, w, h, h * 0.3, plateSeed)}
        fill="var(--paper)" stroke="var(--ink-soft)" strokeWidth={2}
        opacity={o * 0.96}></path>
    );
  }
  return (
    <g>
      {plateEl}
      <text x={x} y={y} textAnchor={anchor} opacity={o}
        style={{ fontFamily: font, fontWeight: weight, fontSize: size, fill: color }}>
        {txt}
      </text>
    </g>
  );
}

// ── SketchButton: hand-drawn button (SVG group) ─────────────────────────────
function SketchButton({ x, y, w, h, label, start = 0, dur = 0.7, seed = 2,
  fill = 'var(--paper2)', stroke = 'var(--ink)', labelColor = 'var(--ink)',
  fontSize = 40, press = null, font = 'var(--font-display)', strokeW = 5.5 }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  // press: array of times (scene-local) when the button gets squashed
  let squash = 0;
  if (press) {
    for (const pt of (Array.isArray(press) ? press : [press])) {
      const dtp = localTime - pt;
      if (dtp >= 0 && dtp < 0.5 * ANIM) squash = Math.max(squash, Math.sin(clamp(dtp / (0.5 * ANIM), 0, 1) * Math.PI));
    }
  }
  const sy = 1 - 0.14 * squash, sx = 1 + 0.06 * squash;
  return (
    <g transform={`translate(${x + w / 2} ${y + h}) scale(${sx} ${sy}) translate(${-(x + w / 2)} ${-(y + h)})`}>
      <DrawPath d={sketchRect(x, y, w, h, 16, seed)} start={start} dur={dur}
        stroke={stroke} width={strokeW} fill={fill}></DrawPath>
      <SvgText x={x + w / 2} y={y + h / 2 + fontSize * 0.34} size={fontSize} font={font}
        weight={700} color={labelColor} start={start + dur * 0.45}>{label}</SvgText>
    </g>
  );
}

// ── StickFigure ──────────────────────────────────────────────────────────────
// Simple geometric character. ~170 units tall at scale 1, origin at feet center.
// pose: stand | press | cheer | sit | panic | point | shrug | run
function StickFigure({ x, y, scale = 1, pose = 'stand', facing = 1, mood = 'neutral',
  start = 0, dur = 0.7, color = 'var(--ink)', accent = false }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const P = {
    stand: { la: 205, ra: 335, legs: 'stand', lean: 0 },
    press: { la: 215, ra: 290, legs: 'stand', lean: 6 },
    cheer: { la: 130, ra: 50, legs: 'spread', lean: 0 },
    sit:   { la: 240, ra: 300, legs: 'sit', lean: 0 },
    panic: { la: 140, ra: 40, legs: 'spread', lean: -4 },
    point: { la: 210, ra: 270, legs: 'stand', lean: 3 },
    shrug: { la: 235, ra: 305, legs: 'stand', lean: 0 },
    run:   { la: 250, ra: 300, legs: 'run', lean: 18 },
  }[pose] || {};
  const hipY = -62, shY = -118, headY = -148, headR = 24, armL = 42;
  const armPt = (deg) => {
    const a = (deg * Math.PI) / 180;
    return [Math.cos(a) * armL * facing, shY + 8 - Math.sin(a) * armL];
  };
  const [lax, lay] = armPt(P.la), [rax, ray] = armPt(P.ra);
  const legs = {
    stand: `M 0 ${hipY} L -14 0 M 0 ${hipY} L 14 0`,
    spread: `M 0 ${hipY} L -24 0 M 0 ${hipY} L 24 0`,
    sit: `M 0 ${hipY} L 26 ${hipY + 4} L 26 ${hipY + 34} M 0 ${hipY} L 34 ${hipY + 10} L 34 ${hipY + 38}`,
    run: `M 0 ${hipY} L -26 -10 L -34 0 M 0 ${hipY} L 22 -28 L 38 -22`,
  }[P.legs];
  const mouth = mood === 'happy' ? `M -8 ${headY + 8} Q 0 ${headY + 16} 8 ${headY + 8}`
    : mood === 'sad' ? `M -8 ${headY + 12} Q 0 ${headY + 5} 8 ${headY + 12}`
    : mood === 'shock' ? sketchCircle(0, headY + 9, 5, 4)
    : `M -7 ${headY + 10} L 7 ${headY + 10}`;
  const e = Easing.easeOutBack(clamp((localTime - start) / (dur * ANIM), 0, 1));
  return (
    <g transform={`translate(${x} ${y}) rotate(${P.lean * facing}) scale(${scale * (0.8 + 0.2 * e)})`}
      opacity={clamp((localTime - start) / (dur * ANIM * 0.4), 0, 1)}>
      <DrawPath d={sketchCircle(0, headY, headR, 11)} start={start} dur={dur * 0.5}
        stroke={color} width={5} fill="var(--paper)" fillOpacity={0.01}></DrawPath>
      {/* eyes */}
      <Seg start={start + dur * 0.3}>
        <circle cx={-8 * facing} cy={headY - 4} r={2.6} fill={color}></circle>
        <circle cx={8 * facing} cy={headY - 4} r={2.6} fill={color}></circle>
        <path d={mouth} fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round"></path>
      </Seg>
      <DrawPath d={sketchLine(0, shY, 0, hipY, 12)} start={start + dur * 0.18} dur={dur * 0.4}
        stroke={color} width={5}></DrawPath>
      <DrawPath d={`${sketchLine(0, shY + 8, lax, lay, 13)} ${sketchLine(0, shY + 8, rax, ray, 14)}`}
        start={start + dur * 0.3} dur={dur * 0.45} stroke={color} width={5}></DrawPath>
      <DrawPath d={legs} start={start + dur * 0.4} dur={dur * 0.45} stroke={color} width={5}></DrawPath>
      {accent && <circle cx={0} cy={shY + 26} r={7} fill="var(--accent)"></circle>}
    </g>
  );
}

// ── Coin / token ─────────────────────────────────────────────────────────────
function Coin({ cx, cy, r = 26, label = '$', start = 0, seed = 5, accent = false, fontSize }) {
  return (
    <g>
      <DrawPath d={sketchCircle(cx, cy, r, seed)} start={start} dur={0.5}
        stroke={accent ? 'var(--accent)' : 'var(--ink)'} width={4.5}
        fill={accent ? 'var(--accent-soft)' : 'var(--paper2)'}></DrawPath>
      <SvgText x={cx} y={cy + (fontSize || r * 0.9) * 0.36} size={fontSize || r * 0.9} weight={700}
        color={accent ? 'var(--accent)' : 'var(--ink)'} start={start + 0.25}>{label}</SvgText>
    </g>
  );
}

// ── Sparkle: accent twinkle ──────────────────────────────────────────────────
function Sparkle({ cx, cy, r = 16, start = 0, phase = 0, color = 'var(--accent)' }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const tw = 0.72 + 0.28 * Math.sin((localTime + phase) * (2.6 / ANIM));
  const o = clamp((localTime - start) / (0.4 * ANIM), 0, 1);
  return <path d={sparklePath(cx, cy, r * tw)} fill={color} opacity={o * (0.55 + 0.45 * tw)}></path>;
}

// ── Speech bubble ────────────────────────────────────────────────────────────
function Bubble({ x, y, w, h, tail = 'bl', start = 0, seed = 21, children, fontSize = 30, pad = 18, tailLen = 26, tailDx = 0, dur = 0.55 }) {
  const tails = {
    bl: `M ${x + w * 0.18} ${y + h} L ${x + w * 0.1 + tailDx} ${y + h + tailLen} L ${x + w * 0.32} ${y + h}`,
    br: `M ${x + w * 0.82} ${y + h} L ${x + w * 0.9 + tailDx} ${y + h + tailLen} L ${x + w * 0.68} ${y + h}`,
  };
  return (
    <g>
      <DrawPath d={sketchRect(x, y, w, h, 18, seed) + ' ' + tails[tail]} start={start} dur={dur}
        stroke="var(--ink)" width={4.5} fill="var(--paper2)"></DrawPath>
      <Seg start={start + Math.min(0.3, dur)}>
        <foreignObject x={x + pad} y={y + pad * 0.6} width={w - pad * 2} height={h - pad}>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize, color: 'var(--ink)',
            lineHeight: 1.16, textAlign: 'center', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textWrap: 'pretty' }}>
            {children}
          </div>
        </foreignObject>
      </Seg>
    </g>
  );
}

// ── Duck badge (brand mascot on accent circle) ───────────────────────────────
function DuckBadge({ x, y, size = 160, start = 0, ring = true, bob = false }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const e = Easing.easeOutBack(clamp((localTime - start) / (0.6 * ANIM), 0, 1));
  const dy = bob ? Math.sin(localTime * (1.8 / ANIM)) * 6 : 0;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2 + dy,
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent)',
      boxShadow: ring ? `0 0 0 ${size * 0.07}px var(--accent-soft)` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${0.5 + 0.5 * e})`, opacity: clamp((localTime - start) / (0.25 * ANIM), 0, 1),
    }}>
      <img src={(window.__resources && window.__resources.vibeDuck) || 'assets/images/vibe-duck.svg'} alt="Vibe duck" style={{ width: '62%', height: '62%' }}></img>
    </div>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ x, y, size = 64, start = 0, sub = null, underline = true, align = 'left' }) {
  return (
    <Seg start={start}>
      <div style={{ position: 'absolute', left: x, top: y, display: 'flex',
        alignItems: 'baseline', gap: size * 0.22,
        transform: align === 'center' ? 'translateX(-50%)' : 'none' }}>
        <HandText x={0} y={0} size={size} font="var(--font-brand)" weight={900}
          color="var(--ink)" start={0}>Vibe</HandText>
        {sub && <HandText x={size * 2.1} y={size * 0.18} size={size * 0.52}
          font="var(--font-brand)" weight={600} color="var(--ink)" start={0.15}>{sub}</HandText>}
      </div>
      {underline && (
        <svg style={{ position: 'absolute', left: align === 'center' ? x - size * 1.05 : x,
          top: y + size * 1.18, overflow: 'visible' }} width={size * 2.1} height={size * 0.5}>
          <DrawPath d={scribblePath(4, 8, size * 1.95, 9)} start={0.3} dur={0.4}
            stroke="var(--accent)" width={size * 0.1}></DrawPath>
        </svg>
      )}
    </Seg>
  );
}

// ── Highlight: full-screen handwritten text moment ──────────────────────────
// Pass text with *accent words*. Renders over a paper wash, words pop in staggered.
// The paper wash holds at full opacity until the SCENE ends — only the text
// fades out at `end` — so the previous board is never flashed again between
// the text moment and the next scene.
function Highlight({ start, end, children, size = 110, underlineWord = null }) {
  const W = 1920, H = 1080;
  // The wash holds until the parent SCENE sprite unmounts (end=Infinity inside
  // it) — computing the scene's end here mixed scene-relative duration with
  // absolute time and cut the wash ~0.4s early, flashing the old board.
  const holdEnd = Infinity;
  return (
    <Sprite start={start} end={holdEnd}>
      {({ localTime }) => {
        const textOut = clamp(((end - start) - localTime) / 0.45, 0, 1);
        const inn = clamp(localTime / 0.3, 0, 1);
        const words = textOf(children).split(' ').filter(Boolean);
        let accentOn = false;
        const parsed = words.map((w) => {
          let acc = accentOn, word = w;
          if (w.startsWith('*')) { acc = true; accentOn = true; word = word.slice(1); }
          if (word.endsWith('*')) { accentOn = false; word = word.slice(0, -1); }
          else if (word.includes('*')) { word = word.replace('*', ''); accentOn = false; }
          return { word, acc };
        });
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)',
            opacity: inn, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 40 }}>
            <div style={{ maxWidth: W * 0.78, textAlign: 'center', opacity: textOut,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size,
              lineHeight: 1.12, color: 'var(--ink)' }}>
              {parsed.map((p, i) => {
                // Text write speed: 1 = normal; lower = slower (Console → Look).
                const wsp = window.__vibeWriteSpeed || 1;
                const ws = 0.18 + i * (0.085 * ANIM) / wsp;
                const we = Easing.easeOutBack(clamp((localTime - ws) / (0.32 * ANIM / wsp), 0, 1));
                if (localTime < ws) return null;
                return (
                  <span key={i} style={{ display: 'inline-block',
                    transform: `scale(${0.6 + 0.4 * we}) rotate(${(i % 2 ? 1 : -1) * (1 - we) * 4}deg)`,
                    opacity: clamp((localTime - ws) / (0.18 * ANIM / wsp), 0, 1),
                    color: p.acc ? 'var(--accent)' : 'var(--ink)',
                    marginRight: size * 0.32 }}>{p.word}</span>
                );
              })}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ── TimeScale: runs children's timeline slower/faster than the real clock ───
// factor 1.3 = children see time advancing 30% slower. Anything outside
// (captions, voiceover) keeps real time.
function TimeScale({ factor = 1, children }) {
  const ctx = useTimeline();
  const value = React.useMemo(() => ({
    ...ctx,
    time: ctx.time / factor,
    duration: (ctx.duration || 0) / factor,
    setTime: ctx.setTime ? (s) => ctx.setTime(s * factor) : undefined,
  }), [ctx, factor]);
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

// ── Captions ─────────────────────────────────────────────────────────────────
// items: [{ t, t2, text }] in absolute stage seconds.
function Captions({ items, visible = true }) {
  const t = useTime();
  if (!visible) return null;
  const cap = items.find((c) => t >= c.t && t < c.t2);
  if (!cap) return null;
  const o = Math.min(clamp((t - cap.t) / 0.3, 0, 1), clamp((cap.t2 - t) / 0.3, 0, 1));
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 42, transform: 'translateX(-50%)',
      maxWidth: 1500, zIndex: 60, opacity: o }}>
      <div style={{ fontFamily: 'var(--font-hand)', fontSize: 37, lineHeight: 1.25,
        color: 'var(--ink)', background: 'var(--caption-bg)',
        border: '2.5px solid var(--ink)', borderRadius: 20, padding: '12px 38px',
        textAlign: 'center', boxShadow: '0 4px 0 rgba(28,30,42,0.12)', textWrap: 'pretty' }}>
        {cap.text}
      </div>
    </div>
  );
}

// ── Cam: simple camera (zoom/pan keyframes over scene-local time) ───────────
// kf: [{ t, x, y, s }] — x/y are translation of the world (px at scale 1), s = zoom.
function Cam({ kf, children }) {
  const { localTime } = useSprite();
  const ts = kf.map((k) => k.t);
  const gx = interpolate(ts, kf.map((k) => k.x || 0), Easing.easeInOutCubic)(localTime);
  const gy = interpolate(ts, kf.map((k) => k.y || 0), Easing.easeInOutCubic)(localTime);
  const gs = interpolate(ts, kf.map((k) => k.s || 1), Easing.easeInOutCubic)(localTime);
  return (
    <div style={{ position: 'absolute', inset: 0,
      transform: `scale(${gs}) translate(${gx}px, ${gy}px)`,
      transformOrigin: 'center', willChange: 'transform' }}>
      {children}
    </div>
  );
}

// ── SceneSvg: full-canvas SVG layer ──────────────────────────────────────────
function SceneSvg({ children }) {
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {children}
    </svg>
  );
}

// ── Candle chart bits ────────────────────────────────────────────────────────
function Candle({ x, y, w = 34, h, up = true, start = 0, seed = 6 }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const e = Easing.easeOutCubic(clamp((localTime - start) / (0.45 * ANIM), 0, 1));
  const hh = h * e;
  const col = up ? 'var(--good)' : 'var(--bad)';
  return (
    <g>
      <line x1={x + w / 2} y1={y - hh - 14} x2={x + w / 2} y2={y + 10} stroke={col} strokeWidth={4} strokeLinecap="round"></line>
      <rect x={x} y={y - hh} width={w} height={Math.max(4, hh)} rx={5} fill={col}></rect>
    </g>
  );
}

Object.assign(window, {
  ANIM, vibeRng, sketchLine, sketchRect, sketchCircle, scribblePath, sketchArrow, sparklePath, textOf,
  Seg, DrawPath, HandText, SvgText, SketchButton, StickFigure, Coin, Sparkle, Bubble,
  DuckBadge, Wordmark, Highlight, Captions, Cam, SceneSvg, Candle, TimeScale,
});
