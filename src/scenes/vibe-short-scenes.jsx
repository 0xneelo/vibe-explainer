// vibe-short-scenes.jsx — 60-second fast-paced cut of the Vibe explainer.
// Nine micro-beats, ~6–8s each, reusing the whiteboard primitives from
// vibe-elements.jsx. Scene-local time; no global slow-down (SHORT runs 1:1).
// Timeline (absolute seconds):
//   S1 0–7 · S2 7–14 · S3 14–21.5 · S4 21.5–28.5 · S5 28.5–34.5
//   S6 34.5–41.5 · S7 41.5–48 · S8 48–55 · S9 55–63

// ── Local helpers (mirrors of the ones in the long-cut scene files) ─────────
function FlowDot({ p0, c, p1, start = 0, period = 1.7, phase = 0, r = 14, once = false,
  color = 'var(--accent)', label = null, labelColor = '#fff', labelSize = 17 }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const per = period * ANIM;
  let t;
  if (once) { t = clamp((localTime - start) / per, 0, 1); if (t >= 1) return null; }
  else { t = (((localTime - start) / per) + phase) % 1; }
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
  const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
  const o = clamp(Math.min(t / 0.12, (1 - t) / 0.12, 1), 0, 1);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r} fill={color}></circle>
      {label && <text x={x} y={y + labelSize * 0.36} textAnchor="middle"
        style={{ fontFamily: 'var(--font-hand)', fontSize: labelSize, fontWeight: 700, fill: labelColor }}>{label}</text>}
    </g>
  );
}

function Ground({ x1 = 120, x2 = 1800, y = 940, seed = 31, start = 0 }) {
  return <DrawPath d={sketchLine(x1, y, x2, y, seed, 4)} start={start} dur={0.6} width={4} stroke="var(--ink-soft)"></DrawPath>;
}

function HouseIcon({ x, y, s = 1, start = 0, seed = 41, dashed = false, color = 'var(--ink)' }) {
  const d = `${sketchRect(x - 50 * s, y - 40 * s, 100 * s, 80 * s, 6, seed)} ` +
    `M ${x - 62 * s} ${y - 40 * s} L ${x} ${y - 92 * s} L ${x + 62 * s} ${y - 40 * s} ` +
    `${sketchRect(x - 14 * s, y + 4 * s, 28 * s, 36 * s, 4, seed + 1)}`;
  return <DrawPath d={d} start={start} dur={0.7} width={4.5} stroke={color} dashed={dashed}></DrawPath>;
}

function BankIcon({ x, y, s = 1, start = 0, seed = 43 }) {
  const d = `M ${x - 70 * s} ${y - 50 * s} L ${x} ${y - 88 * s} L ${x + 70 * s} ${y - 50 * s} Z ` +
    `${sketchLine(x - 60 * s, y - 44 * s, x - 60 * s, y + 30 * s, seed)} ` +
    `${sketchLine(x - 20 * s, y - 44 * s, x - 20 * s, y + 30 * s, seed + 1)} ` +
    `${sketchLine(x + 20 * s, y - 44 * s, x + 20 * s, y + 30 * s, seed + 2)} ` +
    `${sketchLine(x + 60 * s, y - 44 * s, x + 60 * s, y + 30 * s, seed + 3)} ` +
    `${sketchLine(x - 78 * s, y + 34 * s, x + 78 * s, y + 34 * s, seed + 4)}`;
  return <DrawPath d={d} start={start} dur={0.8} width={4.5}></DrawPath>;
}

function CoinPile({ x, y, rows = 3, r = 30, start = 0, stagger = 0.07 }) {
  const coins = [];
  let i = 0;
  for (let row = 0; row < rows; row++) {
    const n = rows - row + 2;
    for (let k = 0; k < n; k++) {
      coins.push(<Coin key={i} cx={x + (k - (n - 1) / 2) * (r * 2.02)} cy={y - row * (r * 1.72)}
        r={r} label="$" start={start + i * stagger} seed={50 + i} fontSize={r * 0.95}></Coin>);
      i++;
    }
  }
  return <g>{coins}</g>;
}

function YieldMachine({ x, y, label1, label2, accent = false, start = 0, seed = 80 }) {
  return (
    <g>
      <DrawPath d={sketchRect(x, y, 460, 300, 18, seed)} start={start} dur={0.9} width={6}
        fill={accent ? 'var(--accent-soft)' : 'var(--paper2)'}
        stroke={accent ? 'var(--accent)' : 'var(--ink)'}></DrawPath>
      <DrawPath d={`M ${x + 150} ${y} L ${x + 180} ${y - 60} L ${x + 280} ${y - 60} L ${x + 310} ${y}`}
        start={start + 0.4} dur={0.4} width={5} stroke={accent ? 'var(--accent)' : 'var(--ink)'}></DrawPath>
      <SvgText x={x + 230} y={y + 140} size={42} font="var(--font-display)" weight={700} start={start + 0.6}
        color={accent ? 'var(--accent)' : 'var(--ink)'}>{label1}</SvgText>
      <SvgText x={x + 230} y={y + 190} size={42} font="var(--font-display)" weight={700} start={start + 0.6}
        color={accent ? 'var(--accent)' : 'var(--ink)'}>{label2}</SvgText>
    </g>
  );
}

// Snappier edge fades than the long cut.
function ShortWrap({ children, label }) {
  const { localTime, duration } = useSprite();
  const o = Math.min(clamp(localTime / 0.28, 0, 1), clamp((duration - localTime) / 0.28, 0, 1));
  return <div data-scene={label} style={{ position: 'absolute', inset: 0, opacity: o }}>{children}</div>;
}

// ───────────────────────── S1 — buy/sell → lend/borrow ──────────────────────
function ShortS1() {
  return (
    <Sprite start={0} end={7}>
      <ShortWrap label="S1 hook">
        <SceneSvg>
          <Ground start={0.05}></Ground>
          <SketchButton x={470} y={360} w={400} h={150} label="BUY" start={0.4} seed={2}
            fill="var(--good-soft)" fontSize={66} press={[1.6]}></SketchButton>
          <SketchButton x={470} y={360} w={400} h={150} label="BUY" start={0.4} seed={2}
            fill="none" fontSize={66} strokeW={0}></SketchButton>
          <SketchButton x={1050} y={360} w={400} h={150} label="SELL" start={0.8} seed={3}
            fill="var(--bad-soft)" fontSize={66} press={[2.3]}></SketchButton>
          {/* the missing button slams in */}
          <Seg start={3.7}>
            {({ localTime }) => {
              const e = Easing.easeOutBack(clamp(localTime / (0.4 * ANIM), 0, 1));
              return (
                <g transform={`translate(960 640) scale(${1.6 - 0.6 * e}) rotate(${-2 * (1 - e)}) translate(-960 -640)`}
                  opacity={clamp(localTime / (0.18 * ANIM), 0, 1)}>
                  <path d={sketchRect(490, 560, 940, 175, 22, 17)} fill="var(--accent)"
                    stroke="var(--ink)" strokeWidth="6"></path>
                  <text x={960} y={672} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 74, fill: '#fff' }}>
                    LEND / BORROW
                  </text>
                  <Sparkle cx={450} cy={570} r={20} start={0.3}></Sparkle>
                  <Sparkle cx={1470} cy={720} r={16} start={0.45} phase={1.2}></Sparkle>
                  <Sparkle cx={1450} cy={545} r={24} start={0.6} phase={2.1}></Sparkle>
                </g>
              );
            }}
          </Seg>
        </SceneSvg>
        <HandText x={960} y={70} size={62} align="center" font="var(--font-display)" weight={700}
          start={0.3} rotate={-1} fadeOutAt={3.5}>Markets = two buttons… right?</HandText>
        <HandText x={960} y={70} size={62} align="center" font="var(--font-display)" weight={700}
          start={3.9} rotate={-1}>Real finance has a third.</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S2 — hold / pray / dump ──────────────────────────
function ShortS2() {
  const S = 7;
  return (
    <Sprite start={S} end={S + 7}>
      <ShortWrap label="S2 crypto today">
        <SceneSvg>
          <Ground start={0}></Ground>
          <CoinPile x={560} y={870} rows={3} start={0.2}></CoinPile>
          <Seg start={0.9}>
            {({ localTime }) => (
              <StickFigure x={560} y={762} pose="sit" facing={1}
                mood={localTime > 3 ? 'sad' : 'neutral'} start={0} scale={1.05}></StickFigure>
            )}
          </Seg>
          <SketchButton x={1090} y={420} w={250} h={104} label="HOLD" start={3.5} seed={61} fontSize={40}></SketchButton>
          <SketchButton x={1390} y={420} w={250} h={104} label="PRAY" start={3.9} seed={62} fontSize={40}></SketchButton>
          <SketchButton x={1090} y={560} w={250} h={104} label="TWEET" start={4.3} seed={63} fontSize={40}></SketchButton>
          <SketchButton x={1390} y={560} w={250} h={104} label="DUMP" start={4.7} seed={64} fontSize={40}></SketchButton>
          <Sparkle cx={1660} cy={388} r={13} start={5.2}></Sparkle>
        </SceneSvg>
        <HandText x={960} y={66} size={60} align="center" font="var(--font-display)" weight={700}
          start={0.3} rotate={1}>Crypto nailed buying &amp; selling.</HandText>
        <HandText x={1365} y={344} size={38} align="center" start={3.2} rotate={-1}
          color="var(--ink-soft)">then what? your options:</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S3 — the matching engine ─────────────────────────
function ShortS3() {
  const S = 14;
  return (
    <Sprite start={S} end={S + 7.5}>
      <ShortWrap label="S3 matching engine">
        <SceneSvg>
          <Ground start={0}></Ground>
          <DrawPath d={sketchLine(960, 150, 960, 830, 23, 5)} start={0.2} dur={0.7} width={4}
            stroke="var(--ink-soft)" dashed></DrawPath>
          {/* holders */}
          <Seg start={0.6}>
            <BankIcon x={300} y={560} start={0.1}></BankIcon>
            <HouseIcon x={520} y={540} start={0.35}></HouseIcon>
            <Coin cx={690} cy={520} r={34} label="$" start={0.6} seed={71}></Coin>
            <Seg start={0.9}><StickFigure x={700} y={940} pose="stand" facing={1} mood="happy" start={0} scale={1.08} dur={0.5}></StickFigure></Seg>
          </Seg>
          {/* seekers */}
          <Seg start={2.0}>
            <Seg start={0.3}><StickFigure x={1240} y={940} pose="point" facing={-1} start={0} scale={1.08} dur={0.5}></StickFigure></Seg>
            <HouseIcon x={1450} y={540} start={0.55} dashed color="var(--ink-soft)"></HouseIcon>
            <Coin cx={1660} cy={560} r={36} label="20x" start={0.9} seed={73} accent fontSize={26}></Coin>
          </Seg>
          {/* bridge + flows */}
          <DrawPath d={`M 700 690 Q 960 470 1220 690`} start={3.8} dur={1.0} width={6} stroke="var(--accent)"></DrawPath>
          <Seg start={4.5}>
            <FlowDot p0={[1220, 690]} c={[960, 470]} p1={[700, 690]} start={0} phase={0} label="$" color="var(--accent)"></FlowDot>
            <FlowDot p0={[1220, 690]} c={[960, 470]} p1={[700, 690]} start={0} phase={0.5} label="$" color="var(--accent)"></FlowDot>
            <FlowDot p0={[700, 740]} c={[960, 560]} p1={[1220, 740]} start={0.3} phase={0.25} r={12} color="var(--ink)" label="↗" labelSize={15}></FlowDot>
          </Seg>
          <SvgText x={960} y={460} size={38} font="var(--font-display)" weight={700} color="var(--accent)" start={4.8} plate plateSeed={121}>← YIELD</SvgText>
          <SvgText x={960} y={800} size={38} font="var(--font-display)" weight={700} start={5.2} plate plateSeed={122}>EXPOSURE →</SvgText>
        </SceneSvg>
        <HandText x={480} y={168} size={50} align="center" width={540} font="var(--font-display)" weight={700} start={0.7}>ASSET HOLDERS</HandText>
        <HandText x={480} y={244} size={30} align="center" width={540} start={1.0} color="var(--ink-soft)">banks · landlords · funds</HandText>
        <HandText x={1440} y={168} size={50} align="center" width={640} font="var(--font-display)" weight={700} start={2.2}>EXPOSURE SEEKERS</HandText>
        <HandText x={1440} y={244} size={30} align="center" width={640} start={2.5} color="var(--ink-soft)">buyers · traders · funds</HandText>
        <HandText x={960} y={62} size={50} align="center" start={3.4} rotate={-1} font="var(--font-display)" weight={700}>Finance = a matching engine</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S4 — real estate / the ban ───────────────────────
function ShortS4() {
  const S = 21.5;
  return (
    <Sprite start={S} end={S + 7}>
      <ShortWrap label="S4 real estate">
        <SceneSvg>
          <Ground start={0}></Ground>
          <Seg start={0}>
            {({ localTime }) => {
              let shake = 0;
              if (localTime > 4.4 && localTime < 5.4) shake = Math.sin((localTime - 4.4) * 42) * 7 * (1 - (localTime - 4.4) / 1.0);
              return (
                <g transform={`translate(${shake} 0)`}>
                  <DrawPath d={sketchRect(740, 340, 440, 600, 10, 33)} start={0.2} dur={1.0} width={6} fill="var(--paper2)"></DrawPath>
                  {[0, 1, 2, 3].map((row) => [0, 1].map((col) => (
                    <DrawPath key={row + '-' + col} d={sketchRect(800 + col * 200, 390 + row * 130, 90, 80, 5, 34 + row * 3 + col)}
                      start={0.9 + (row * 2 + col) * 0.07} dur={0.35} width={4}
                      fill={(row + col) % 2 ? 'var(--accent-soft)' : 'none'}></DrawPath>
                  )))}
                  <DrawPath d={`M 730 340 L 960 240 L 1190 340`} start={1.2} dur={0.5} width={6}></DrawPath>
                </g>
              );
            }}
          </Seg>
          <Seg start={1.0}>
            {({ localTime }) => (
              <StickFigure x={430} y={940} pose={localTime > 3.8 ? 'panic' : 'stand'} facing={1}
                mood={localTime > 3.8 ? 'shock' : 'happy'} start={0} scale={1.1} dur={0.5}></StickFigure>
            )}
          </Seg>
          <Seg start={1.3}>
            {({ localTime }) => (
              <StickFigure x={1500} y={940} pose={localTime > 3.5 ? 'panic' : 'stand'} facing={-1}
                mood={localTime > 3.5 ? 'shock' : 'neutral'} start={0} scale={1.1} dur={0.5}></StickFigure>
            )}
          </Seg>
          <SvgText x={430} y={1010} size={30} font="var(--font-display)" weight={700} start={1.4}>OWNER</SvgText>
          <SvgText x={1500} y={1010} size={30} font="var(--font-display)" weight={700} start={1.7}>RENTER</SvgText>
          <Seg start={2.0} end={4.4} keepAfter={false}>
            <DrawPath d={`M 1430 660 Q 960 580 510 660`} start={0} dur={0.8} width={5} stroke="var(--accent)"></DrawPath>
            <FlowDot p0={[1430, 660]} c={[960, 580]} p1={[510, 660]} start={0.8} phase={0} label="$"></FlowDot>
            <FlowDot p0={[1430, 660]} c={[960, 580]} p1={[510, 660]} start={0.8} phase={0.5} label="$"></FlowDot>
            <SvgText x={960} y={560} size={34} font="var(--font-display)" weight={700} color="var(--accent)" start={1.2} plate plateSeed={123}>← RENT (yield)</SvgText>
            <SvgText x={960} y={815} size={34} font="var(--font-display)" weight={700} start={1.2} plate plateSeed={124}>ACCESS (a home) →</SvgText>
          </Seg>
          {/* THE BAN */}
          <Seg start={4.2}>
            {({ localTime }) => {
              const e = Easing.easeOutBack(clamp(localTime / (0.35 * ANIM), 0, 1));
              return (
                <g transform={`translate(960 560) rotate(-8) scale(${1.9 - 0.9 * e}) translate(-960 -560)`}
                  opacity={clamp(localTime / (0.13 * ANIM), 0, 1)}>
                  <path d={sketchRect(520, 485, 880, 150, 12, 55)} fill="var(--paper)" stroke="var(--bad)" strokeWidth="9"></path>
                  <text x={960} y={585} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 74, fill: 'var(--bad)', letterSpacing: 2 }}>
                    RENTING BANNED
                  </text>
                </g>
              );
            }}
          </Seg>
        </SceneSvg>
        <HandText x={960} y={64} size={54} align="center" width={1100} font="var(--font-display)" weight={700} start={0.3} rotate={-1}>The oldest yield market on earth</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S5 — the token conveyor ──────────────────────────
function ShortS5() {
  const S = 28.5;
  const NAMES = ['DOG', 'AI', 'MEME', 'DAO', 'PEPE', 'MOON'];
  return (
    <Sprite start={S} end={S + 6}>
      <ShortWrap label="S5 conveyor">
        <SceneSvg>
          <DrawPath d={sketchRect(120, 400, 300, 240, 16, 61)} start={0.2} dur={0.7} width={6} fill="var(--paper2)"></DrawPath>
          <SvgText x={270} y={500} size={36} font="var(--font-display)" weight={700} start={0.7}>TOKEN</SvgText>
          <SvgText x={270} y={548} size={36} font="var(--font-display)" weight={700} start={0.7}>PRINTER</SvgText>
          <SvgText x={270} y={596} size={24} color="var(--ink-soft)" start={0.9}>(open 24/7)</SvgText>
          <DrawPath d={`${sketchLine(420, 620, 1240, 620, 63)} ${sketchLine(420, 666, 1240, 666, 64)}`} start={0.7} dur={0.7} width={5}></DrawPath>
          <Seg start={0.9}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <DrawPath key={i} d={sketchCircle(490 + i * 140, 643, 16, 65 + i)} start={0.1 + i * 0.06} dur={0.25} width={4}></DrawPath>
            ))}
          </Seg>
          <Seg start={1.1}>
            {({ localTime }) => (
              <g>
                {NAMES.map((name, i) => {
                  const born = i * 0.62;
                  const age = localTime - born;
                  if (age < 0 || age > 4.0) return null;
                  const beltT = clamp(age / 1.7, 0, 1);
                  let x = 460 + beltT * 780, y = 580;
                  if (age > 1.7) { const f = (age - 1.7) / 1.0; x = 1240 + f * 150; y = 580 + f * f * 270; }
                  const o = age > 2.5 ? clamp((3.4 - age) / 0.6, 0, 1) : 1;
                  return (
                    <g key={name} opacity={o} transform={age > 1.7 ? `rotate(${(age - 1.7) * 70} ${x} ${y})` : ''}>
                      <circle cx={x} cy={y} r={36} fill="var(--paper2)" stroke="var(--ink)" strokeWidth="4.5"></circle>
                      <text x={x} y={y + 9} textAnchor="middle" style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, fill: 'var(--ink)' }}>{name}</text>
                    </g>
                  );
                })}
              </g>
            )}
          </Seg>
          <DrawPath d={sketchRect(1280, 790, 380, 180, 10, 71)} start={1.4} dur={0.7} width={6} fill="var(--paper2)"></DrawPath>
          <SvgText x={1470} y={890} size={44} font="var(--font-display)" weight={700} start={2.0}>NO YIELD</SvgText>
          <SvgText x={1470} y={935} size={26} color="var(--ink-soft)" start={2.2}>~99% of tokens</SvgText>
          <DrawPath d={sketchRect(1730, 880, 130, 80, 8, 73)} start={3.0} dur={0.5} width={4.5} stroke="var(--accent)" fill="var(--accent-soft)"></DrawPath>
          <SvgText x={1795} y={913} size={19} color="var(--accent)" weight={700} start={3.5}>productive</SvgText>
          <SvgText x={1795} y={940} size={19} color="var(--accent)" weight={700} start={3.5}>assets</SvgText>
        </SceneSvg>
        <HandText x={960} y={62} size={54} align="center" font="var(--font-display)" weight={700} start={0.3} rotate={1}>Millions of tokens / year</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────── S6 — fake yield vs real yield ────────────────────────
function ShortS6() {
  const S = 34.5;
  return (
    <Sprite start={S} end={S + 7}>
      <ShortWrap label="S6 fake vs real yield">
        <SceneSvg>
          <Ground start={0} y={970}></Ground>
          {/* fake — inflation */}
          <YieldMachine x={170} y={420} label1="INFLATION" label2="MACHINE" start={0.2} seed={81}></YieldMachine>
          <Seg start={1.4}>
            {({ localTime }) => (
              <g>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const born = i * 0.5;
                  const age = localTime - born;
                  if (age < 0) return null;
                  const f = clamp(age / 0.7, 0, 1);
                  const x = 640 + (i % 3) * 46 - 40, y = 480 + Easing.easeInQuad(f) * (380 - (i % 3) * 34);
                  return <circle key={i} cx={x} cy={y} r={22} fill="var(--paper2)" stroke="var(--ink)" strokeWidth="4"></circle>;
                })}
              </g>
            )}
          </Seg>
          <Seg start={2.0}>
            {({ localTime }) => {
              const shrink = 1 - 0.45 * clamp(localTime / 2.0, 0, 1);
              return (
                <g>
                  <circle cx={380} cy={860} r={54 * shrink} fill="var(--bad-soft)" stroke="var(--bad)" strokeWidth="5"></circle>
                  <text x={380} y={872} textAnchor="middle" style={{ fontFamily: 'var(--font-hand)', fontSize: 28 * shrink + 6, fill: 'var(--bad)', fontWeight: 700 }}>your share</text>
                </g>
              );
            }}
          </Seg>
          <Seg start={3.0}>
            <DrawPath d={`${sketchLine(240, 350, 600, 680, 86, 5)} ${sketchLine(600, 350, 240, 680, 87, 5)}`} start={0} dur={0.4} width={13} stroke="var(--bad)"></DrawPath>
          </Seg>
          {/* real — demand */}
          <YieldMachine x={1250} y={420} label1="REAL DEMAND" label2="MACHINE" accent start={1.6} seed={83}></YieldMachine>
          <Seg start={2.6}>
            <Seg start={0}><StickFigure x={1140} y={970} pose="press" facing={1} start={0} dur={0.5}></StickFigure></Seg>
            <SvgText x={1140} y={720} size={28} font="var(--font-display)" weight={700} start={0.4}>TRADER</SvgText>
            <Seg start={0.4}><StickFigure x={1840} y={970} pose="cheer" facing={-1} mood="happy" start={0} dur={0.5}></StickFigure></Seg>
            <SvgText x={1840} y={720} size={28} font="var(--font-display)" weight={700} start={0.8}>HOLDER</SvgText>
            <FlowDot p0={[1160, 830]} c={[1190, 610]} p1={[1340, 570]} start={1.0} phase={0} label="fee" labelSize={14} color="var(--ink)"></FlowDot>
            <FlowDot p0={[1650, 570]} c={[1810, 610]} p1={[1830, 810]} start={1.3} phase={0.4} label="$" color="var(--accent)"></FlowDot>
          </Seg>
          <Seg start={4.3}>
            <DrawPath d={`M 1320 500 L 1430 620 L 1660 360`} start={0} dur={0.5} width={13} stroke="var(--good)"></DrawPath>
          </Seg>
        </SceneSvg>
        <HandText x={960} y={86} size={54} align="center" font="var(--font-display)" weight={700} start={0.3}>“Yield” ≠ yield</HandText>
        <HandText x={415} y={188} size={32} align="center" start={3.2} rotate={-1.5} color="var(--bad)" font="var(--font-hand)">printing = diluting you</HandText>
        <HandText x={1490} y={196} size={32} align="center" start={2.4} rotate={1.5} color="var(--accent)" font="var(--font-hand)">someone PAYS for exposure</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S7 — the Vibe idea ───────────────────────────────
function ShortS7() {
  const S = 41.5;
  return (
    <Sprite start={S} end={S + 6.5}>
      <ShortWrap label="S7 vibe idea">
        <SceneSvg>
          <Ground start={0}></Ground>
          <DrawPath d={sketchCircle(960, 300, 180, 91)} start={3.6} dur={0.8} width={5} stroke="var(--accent)"></DrawPath>
          <Seg start={1.2}><StickFigure x={340} y={940} pose="stand" facing={1} mood="happy" start={0} scale={1.1} dur={0.5}></StickFigure></Seg>
          <Bubble x={110} y={540} w={460} h={150} tail="bl" start={1.6} fontSize={33}>“I hold this. I want yield.”</Bubble>
          <Seg start={2.4}><StickFigure x={1580} y={940} pose="point" facing={-1} start={0} scale={1.1} dur={0.5}></StickFigure></Seg>
          <Bubble x={1350} y={540} w={460} h={150} tail="br" start={2.8} fontSize={32}>“I want exposure. Long / short.”</Bubble>
          <Seg start={4.2}>
            <DrawPath d={`M 480 800 Q 600 520 790 410`} start={0} dur={0.6} width={4} dashed stroke="var(--ink-soft)"></DrawPath>
            <DrawPath d={`M 1440 800 Q 1320 520 1130 410`} start={0.2} dur={0.6} width={4} dashed stroke="var(--ink-soft)"></DrawPath>
            <FlowDot p0={[790, 450]} c={[620, 580]} p1={[470, 840]} start={0.6} phase={0.4} label="$" color="var(--accent)"></FlowDot>
            <FlowDot p0={[1440, 800]} c={[1320, 520]} p1={[1130, 410]} start={0.6} phase={0.2} r={13} color="var(--ink)" label="fee" labelSize={14}></FlowDot>
            <FlowDot p0={[1130, 450]} c={[1300, 580]} p1={[1450, 840]} start={0.8} phase={0.6} r={13} color="var(--accent)" label="↗" labelColor="#fff"></FlowDot>
          </Seg>
        </SceneSvg>
        <DuckBadge x={960} y={252} size={162} start={0.3} bob></DuckBadge>
        <HandText x={960} y={364} size={74} align="center" font="var(--font-brand)" weight={900} start={0.8}>Vibe</HandText>
        <HandText x={960} y={58} size={48} align="center" font="var(--font-display)" weight={700} start={3.2} rotate={-1}>a marketplace between the two</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S8 — synthetic exposure ──────────────────────────
function ShortS8() {
  const S = 48;
  return (
    <Sprite start={S} end={S + 7}>
      <ShortWrap label="S8 synthetic exposure">
        <SceneSvg>
          <Ground start={0}></Ground>
          {/* vault */}
          <DrawPath d={sketchRect(330, 480, 350, 330, 18, 95)} start={0.2} dur={0.8} width={6.5} fill="var(--paper2)"></DrawPath>
          <DrawPath d={`${sketchCircle(505, 620, 54, 96)} ${sketchLine(505, 578, 505, 662, 97)} ${sketchLine(461, 620, 549, 620, 98)}`} start={0.8} dur={0.6} width={5}></DrawPath>
          <SvgText x={505} y={760} size={38} font="var(--font-display)" weight={700} start={1.2}>VAULT</SvgText>
          <SvgText x={505} y={850} size={26} color="var(--ink-soft)" start={3.4}>tokens never leave</SvgText>
          <Seg start={1.0}><StickFigure x={160} y={940} pose="press" facing={1} mood="happy" start={0} scale={1.0} dur={0.5}></StickFigure></Seg>
          <SvgText x={160} y={1012} size={26} font="var(--font-display)" weight={700} start={1.4}>HOLDER</SvgText>
          <FlowDot p0={[220, 800]} c={[340, 520]} p1={[500, 500]} start={1.6} period={0.9} once r={19} color="var(--paper2)" label="DOG" labelColor="var(--ink)" labelSize={15}></FlowDot>
          <FlowDot p0={[220, 800]} c={[340, 520]} p1={[500, 500]} start={2.4} period={0.9} once r={19} color="var(--paper2)" label="DOG" labelColor="var(--ink)" labelSize={15}></FlowDot>
          {/* trade screen */}
          <DrawPath d={sketchRect(1180, 430, 540, 420, 22, 99)} start={1.8} dur={0.8} width={6} fill="var(--paper2)"></DrawPath>
          <DrawPath d={`M 1240 600 Q 1300 560 1340 520 Q 1390 470 1430 540 Q 1470 610 1540 560 Q 1600 530 1650 540`} start={2.4} dur={1.0} width={4.5} stroke="var(--accent)"></DrawPath>
          <SvgText x={1450} y={490} size={26} color="var(--accent)" weight={700} start={3.0}>the price</SvgText>
          <Seg start={3.2}>
            {({ localTime: lt }) => (
              <g>
                <path d={sketchRect(1240, 690, 210, 84, 14, 101)} fill="var(--accent)" stroke="var(--ink)" strokeWidth="4.5" opacity={clamp(lt / (0.3 * ANIM), 0, 1)}></path>
                <text x={1345} y={745} textAnchor="middle" opacity={clamp(lt / (0.4 * ANIM), 0, 1)} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, fill: '#fff' }}>LONG 20x</text>
                <path d={sketchRect(1470, 690, 210, 84, 14, 102)} fill="var(--paper)" stroke="var(--ink)" strokeWidth="4.5" opacity={clamp((lt - 0.3) / (0.3 * ANIM), 0, 1)}></path>
                <text x={1575} y={745} textAnchor="middle" opacity={clamp((lt - 0.3) / (0.4 * ANIM), 0, 1)} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, fill: 'var(--ink)' }}>SHORT 20x</text>
              </g>
            )}
          </Seg>
          <Seg start={3.8}><StickFigure x={1830} y={940} pose="press" facing={-1} start={0} scale={1.0} dur={0.5}></StickFigure></Seg>
          <SvgText x={1830} y={1012} size={26} font="var(--font-display)" weight={700} start={4.2}>TRADER</SvgText>
          {/* fee → yield loop */}
          <Seg start={4.8}>
            <FlowDot p0={[1240, 820]} c={[980, 910]} p1={[700, 720]} start={0} phase={0} label="fee" labelSize={14} color="var(--ink)"></FlowDot>
            <FlowDot p0={[1240, 820]} c={[980, 910]} p1={[700, 720]} start={0} phase={0.5} label="fee" labelSize={14} color="var(--ink)"></FlowDot>
            <FlowDot p0={[480, 830]} c={[340, 895]} p1={[230, 855]} start={0.4} phase={0.25} label="$" color="var(--accent)"></FlowDot>
            <SvgText x={975} y={945} size={30} font="var(--font-display)" weight={700} start={0.6} plate plateSeed={127}>← fees</SvgText>
            <SvgText x={350} y={945} size={30} font="var(--font-display)" weight={700} color="var(--accent)" start={0.9} plate plateSeed={128}>← yield</SvgText>
          </Seg>
        </SceneSvg>
        <HandText x={960} y={60} size={52} align="center" font="var(--font-display)" weight={700} start={0.3} rotate={-1}>So Vibe makes it synthetic</HandText>
      </ShortWrap>
    </Sprite>
  );
}

// ───────────────────────── S9 — closing ─────────────────────────────────────
function ShortS9() {
  const S = 55;
  return (
    <Sprite start={S} end={S + 8}>
      <ShortWrap label="S9 closing">
        {/* complete market */}
        <Seg start={0} end={4.0} keepAfter={false}>
          {({ localTime }) => (
            <div style={{ position: 'absolute', inset: 0, opacity: clamp((3.8 - localTime) / 0.35, 0, 1) }}>
              <SceneSvg>
                <SketchButton x={420} y={430} w={250} h={120} label="BUY" start={0.3} seed={111} fill="var(--good-soft)" fontSize={46}></SketchButton>
                <SketchButton x={710} y={430} w={250} h={120} label="SELL" start={0.7} seed={112} fill="var(--bad-soft)" fontSize={46}></SketchButton>
                <Seg start={1.2}>
                  {({ localTime: lt }) => (
                    <g opacity={clamp(lt / (0.25 * ANIM), 0, 1)}>
                      <path d={sketchRect(1000, 430, 480, 120, 16, 113)} fill="var(--accent)" stroke="var(--ink)" strokeWidth="5.5"></path>
                      <text x={1240} y={507} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46, fill: '#fff' }}>LEND / BORROW</text>
                    </g>
                  )}
                </Seg>
                <DrawPath d={`M 320 490 Q 320 310 960 310 Q 1600 310 1600 490 Q 1600 670 960 670 Q 320 670 320 490`} start={1.8} dur={1.1} width={5} stroke="var(--ink)"></DrawPath>
                <Sparkle cx={1660} cy={340} r={18} start={2.6}></Sparkle>
                <Sparkle cx={290} cy={630} r={14} start={2.8} phase={1.4}></Sparkle>
                <Seg start={2.4}><StickFigure x={300} y={950} pose="cheer" facing={1} mood="happy" start={0} dur={0.5}></StickFigure></Seg>
                <Seg start={2.6}><StickFigure x={1620} y={950} pose="cheer" facing={-1} mood="happy" start={0} dur={0.5}></StickFigure></Seg>
                <Ground start={0}></Ground>
              </SceneSvg>
              <HandText x={960} y={740} size={58} align="center" font="var(--font-display)" weight={700} start={2.2} rotate={-1}>a complete market</HandText>
            </div>
          )}
        </Seg>
        {/* brand close */}
        <Seg start={4.0}>
          <SceneSvg>
            <Sparkle cx={700} cy={300} r={20} start={1.4}></Sparkle>
            <Sparkle cx={1240} cy={260} r={16} start={1.6} phase={1.1}></Sparkle>
            <Sparkle cx={1300} cy={460} r={24} start={1.8} phase={2.2}></Sparkle>
            <Sparkle cx={640} cy={500} r={14} start={2.0} phase={0.6}></Sparkle>
          </SceneSvg>
          <DuckBadge x={960} y={392} size={230} start={0.2} bob></DuckBadge>
          <HandText x={960} y={548} size={116} align="center" font="var(--font-brand)" weight={900} start={0.7}>Vibe</HandText>
          <HandText x={960} y={730} size={62} align="center" font="var(--font-display)" weight={700} start={1.4} rotate={-1}>Making every asset productive.</HandText>
          <Seg start={2.0}>
            <svg style={{ position: 'absolute', left: 660, top: 828, overflow: 'visible' }} width="600" height="40">
              <DrawPath d={scribblePath(0, 10, 600, 13)} start={0} dur={0.45} stroke="var(--accent)" width={9}></DrawPath>
            </svg>
          </Seg>
          <HandText x={960} y={892} size={26} align="center" start={3.0} color="var(--ink-soft)">Trade carefully. Leverage involves risk. Not financial advice.</HandText>
        </Seg>
      </ShortWrap>
    </Sprite>
  );
}

Object.assign(window, {
  ShortWrap, ShortS1, ShortS2, ShortS3, ShortS4, ShortS5, ShortS6, ShortS7, ShortS8, ShortS9,
});
