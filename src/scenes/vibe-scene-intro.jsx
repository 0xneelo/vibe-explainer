// vibe-scene-intro.jsx — S0 title card: "The Permissionless Credit Layer".
// big handwritten title, blue scribble, a sketched hand holding the Vibe app
// phone (duck badge, chart, two buttons, hatch shadow, sparkles), and two
// "built on" credit badges.
// Also exports TimeShift, used by vibe-app.jsx to push S1–S9 later.

// Runs children's clock `offset` seconds behind the parent timeline.
function TimeShift({ offset = 0, children }) {
  const ctx = useTimeline();
  const value = React.useMemo(() => ({
    ...ctx,
    time: ctx.time - offset,
    setTime: ctx.setTime ? (s) => ctx.setTime(s + offset) : undefined
  }), [ctx, offset]);
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>);

}

const INTRO_FONT = "'Just Another Hand', cursive";
const INTRO_DUCK = window.__resources && window.__resources.vibeDuck || 'assets/images/vibe-duck.svg';

// Pop-in group for SVG content (easeOutBack scale around cx/cy).
function IntroPop({ start, cx = 0, cy = 0, children }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const e = Easing.easeOutBack(clamp((localTime - start) / (0.5 * ANIM), 0, 1));
  const o = clamp((localTime - start) / (0.22 * ANIM), 0, 1);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * e}) translate(${-cx} ${-cy})`}
    opacity={o}>{children}</g>);

}

// The sketched hand holding the phone. Global canvas coords; the phone body
// lives in a rotated group, the hand wraps around it.
function IntroPhone() {
  const { localTime } = useSprite();
  // pencil-hatch fade-in (sits behind the phone body, peeks out right+below)
  const hatchO = clamp((localTime - 2.7) / (0.6 * ANIM), 0, 1);
  return (
    <g>
      <defs>
        <pattern id="introHatch" width="12" height="12" patternUnits="userSpaceOnUse"
        patternTransform="rotate(38)">
          <line x1="0" y1="0" x2="0" y2="12" stroke="#1c1e2a" strokeWidth="2" opacity="0.32"></line>
        </pattern>
      </defs>
      {/* extra hatch blobs outside the phone group */}
      <g opacity={hatchO}>
        <ellipse cx={1788} cy={790} rx={52} ry={135} transform="rotate(9 1788 790)"
        fill="url(#introHatch)" opacity={0.6}></ellipse>
        <ellipse cx={1490} cy={1018} rx={170} ry={42} fill="url(#introHatch)" opacity={0.45}></ellipse>
      </g>
      {/* ── phone (rotated 9°) ── */}
      <g transform="translate(1490 635) rotate(9)">
        {/* drop-shadow hatch behind the body */}
        <path d={sketchRect(-138, -295, 350, 660, 60, 77)} fill="url(#introHatch)"
        stroke="none" opacity={hatchO * 0.6}></path>
        {/* bezel + screen */}
        <DrawPath d={sketchRect(-170, -325, 340, 650, 58, 81)} start={0.5} dur={0.9}
        width={11} fill="var(--paper2)"></DrawPath>
        <DrawPath d={sketchRect(-152, -307, 304, 614, 46, 82)} start={1.0} dur={0.6}
        width={3} stroke="var(--ink-soft)" opacity={0.8}></DrawPath>
        {/* side buttons */}
        <IntroPop start={1.15} cx={174} cy={-180}>
          <rect x={169} y={-215} width={11} height={62} rx={5} fill="var(--ink)"></rect>
          <rect x={169} y={-130} width={11} height={46} rx={5} fill="var(--ink)"></rect>
        </IntroPop>
        {/* duck badge */}
        <IntroPop start={1.5} cx={16} cy={-176}>
          <path d={sketchCircle(16, -176, 124, 9)} fill="none" stroke="var(--ink-soft)"
          strokeWidth={2.2} opacity={0.55}></path>
          <circle cx={16} cy={-176} r={116} fill="var(--accent)" opacity={0.10}></circle>
          <circle cx={16} cy={-176} r={94} fill="var(--accent)" opacity={0.16}></circle>
          <circle cx={16} cy={-176} r={76} fill="var(--accent)"></circle>
        </IntroPop>
        <Sparkle cx={-78} cy={-86} r={12} start={1.95} color="var(--ink)"></Sparkle>
        <Sparkle cx={108} cy={-252} r={14} start={2.15} phase={1.1} color="var(--ink)"></Sparkle>
        {/* dashed section dividers */}
        <DrawPath d="M -152 -72 L 152 -72" start={1.9} dur={0.5} width={3.5}
        stroke="var(--ink-soft)" dashed opacity={0.75}></DrawPath>
        <DrawPath d="M -152 44 L 152 44" start={2.0} dur={0.5} width={3.5}
        stroke="var(--ink-soft)" dashed opacity={0.75}></DrawPath>
        {/* chart + ring marker */}
        <DrawPath d="M -148 36 L -120 8 L -104 22 L -78 -4 L -64 8 L -42 -12 L -30 -2 L -10 -18 L 0 -6 L 20 -22 L 96 -64"
        start={2.2} dur={0.8} width={8} stroke="var(--accent)"></DrawPath>
        <IntroPop start={2.95} cx={104} cy={-70}>
          <circle cx={104} cy={-70} r={25} fill="var(--paper2)" stroke="var(--accent)"
          strokeWidth={12}></circle>
        </IntroPop>
        {/* buttons */}
        <DrawPath d={sketchRect(-132, 92, 240, 108, 22, 84)} start={2.5} dur={0.5}
        width={4.5} fill="var(--accent)"></DrawPath>
        <IntroPop start={2.95} cx={-12} cy={146}>
          <rect x={-60} y={139} width={96} height={14} rx={7}
          fill="color-mix(in oklab, var(--accent) 28%, white)"></rect>
        </IntroPop>
        <DrawPath d={sketchRect(-134, 212, 240, 100, 22, 85)} start={2.8} dur={0.5}
        width={4.5} fill="#e4e5ec"></DrawPath>
        <IntroPop start={3.25} cx={-14} cy={262}>
          <rect x={-62} y={255} width={96} height={14} rx={7} fill="var(--paper2)"></rect>
        </IntroPop>
      </g>
    </g>);

}

// Duck mascot over the phone badge — HTML <img> (renders reliably everywhere),
// positioned at the rotated badge centre.
function IntroDuck() {
  const { localTime } = useSprite();
  if (localTime < 1.5) return null;
  const e = Easing.easeOutBack(clamp((localTime - 1.5) / (0.5 * ANIM), 0, 1));
  const o = clamp((localTime - 1.5) / (0.22 * ANIM), 0, 1);
  return (
    <img src={INTRO_DUCK} alt="" style={{ position: 'absolute',
      left: 1533 - 47, top: 464 - 47, width: 94, height: 94,
      transform: `rotate(9deg) scale(${0.6 + 0.4 * e})`, opacity: o }}></img>);

}

// ════════════════════════════ SCENE 0 — TITLE CARD ══════════════════════════
function SceneIntro() {
  return (
    <Sprite start={0} end={6}>
      <SceneWrap label="S0 title card">
        <SceneSvg>
          {/* baseline rule (hand + sleeve cover it later) */}
          <DrawPath d={sketchLine(92, 1036, 1838, 1028, 33, 2.5)} start={0.05} dur={0.7}
          width={4} stroke="var(--ink)"></DrawPath>
          <IntroPhone></IntroPhone>
        </SceneSvg>
        <IntroDuck></IntroDuck>
        <SceneSvg>
          {/* title scribble underline */}
          <DrawPath d={scribblePath(128, 278, 600, 12)} start={0.85} dur={0.5}
          stroke="var(--accent)" width={14}></DrawPath>
          {/* wordmark scribble — appears last */}
          <DrawPath d={scribblePath(124, 994, 134, 23)} start={5.15} dur={0.35}
          stroke="var(--accent)" width={8}></DrawPath>
          {/* sparkles + action lines */}
          <Sparkle cx={1856} cy={186} r={32} start={3.3}></Sparkle>
          <Sparkle cx={1230} cy={435} r={26} start={3.5} phase={0.7} color="var(--ink)"></Sparkle>
          <Sparkle cx={1150} cy={800} r={20} start={3.7} phase={1.4}></Sparkle>
          <Sparkle cx={1813} cy={672} r={25} start={3.9} phase={2.1} color="var(--ink)"></Sparkle>
          <DrawPath d="M 1742 352 L 1768 312 M 1772 374 L 1804 342 M 1722 332 L 1742 296"
          start={3.6} dur={0.4} width={5.5}></DrawPath>
        </SceneSvg>
        {/* title — JAH is condensed, so stretch it vertically to match the
                 reference's tall marker lettering */}
        <HandText x={88} y={48} size={152} font={INTRO_FONT} start={0.15} rotate={-1.5}
        lineHeight={1}>
          <span style={{ display: 'inline-block', transform: 'scaleY(1.55)',
            transformOrigin: '0 0', WebkitTextStroke: '3px var(--ink)',
            letterSpacing: '0.01em', fontFamily: 'Caveat', fontWeight: 800 }}>{ST('s0.title')}</span>
        </HandText>
        {/* subtitle — wraps within a fixed width */}
        <HandText x={140} y={381} size={60} width={1040} font="var(--font-hand)" start={1.15}>
          <span style={{ WebkitTextStroke: '0.8px var(--ink)' }}>{ST('s0.sub')}</span>
        </HandText>
        {/* accent question */}
        <HandText x={140} y={555} size={60} font="var(--font-hand)" start={1.5}>
          <span style={{ color: 'var(--accent)', WebkitTextStroke: '0.8px var(--accent)' }}>{ST('s0.accent')}</span>
        </HandText>
        {/* "Built on …" badges — sketched chip plates */}
        <HandText x={140} y={770} size={46} font="var(--font-hand)" start={4.7} plate={true}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ width: 30, height: 30, background: 'var(--accent)', display: 'inline-block', transform: 'rotate(45deg)', borderRadius: '6px' }}></span>
            <span style={{ WebkitTextStroke: '0.6px var(--ink)' }}>{ST('s0.badge1.pre')} <span style={{ color: 'var(--accent)', WebkitTextStroke: '0.6px var(--accent)' }}>{ST('s0.badge1.accent')}</span></span>
          </span>
        </HandText>
        <HandText x={680} y={770} size={46} font="var(--font-hand)" start={5.0} plate={true}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ width: 30, height: 30, background: 'var(--accent)', display: 'inline-block', borderRadius: '50%' }}></span>
            <span style={{ WebkitTextStroke: '0.6px var(--ink)' }}>{ST('s0.badge2.pre')} <span style={{ color: 'var(--accent)', WebkitTextStroke: '0.6px var(--accent)' }}>{ST('s0.badge2.accent')}</span></span>
          </span>
        </HandText>
        {/* wordmark — last element of the scene */}
        <HandText x={122} y={928} size={60} font="var(--font-brand)" weight={900}
        start={5.0}>{ST('s0.wordmark')}</HandText>
        <HandText x={282} y={942} size={47} font="var(--font-brand)" weight={500}
        start={5.1}>{ST('s0.wordmark.sub')}</HandText>
      </SceneWrap>
    </Sprite>);

}

Object.assign(window, { TimeShift, SceneIntro });