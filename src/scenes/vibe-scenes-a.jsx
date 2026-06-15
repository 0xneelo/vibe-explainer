// vibe-scenes-a.jsx — Scenes 1–3: Hook, Crypto Today, The Real Economy
// Timeline (absolute): S1 0–24 · S2 24–48 · S3 48–72

// Fade scene content in/out at its edges.
function SceneWrap({ children, label }) {
  const { localTime, duration } = useSprite();
  const o = Math.min(clamp(localTime / 0.35, 0, 1), clamp((duration - localTime) / 0.3, 0, 1));
  return <div data-scene={label} style={{ position: 'absolute', inset: 0, opacity: o }}>{children}</div>;
}

// Dot/coin travelling along a quadratic bezier. Loops by default; `once` plays a single pass.
function FlowDot({ p0, c, p1, start = 0, period = 1.7, phase = 0, r = 14, once = false,
  color = 'var(--accent)', label = null, labelColor = '#fff', labelSize = 17 }) {
  const { localTime } = useSprite();
  if (localTime < start) return null;
  const per = period * ANIM;
  let t;
  if (once) {
    t = clamp((localTime - start) / per, 0, 1);
    if (t >= 1) return null;
  } else {
    t = (((localTime - start) / per) + phase) % 1;
  }
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

// Ground line for characters to stand on.
function Ground({ x1 = 120, x2 = 1800, y = 940, seed = 31, start = 0 }) {
  return <DrawPath d={sketchLine(x1, y, x2, y, seed, 4)} start={start} dur={0.7} width={4}
    stroke="var(--ink-soft)"></DrawPath>;
}

// Simple house icon (rect + roof).
function HouseIcon({ x, y, s = 1, start = 0, seed = 41, dashed = false, color = 'var(--ink)' }) {
  const d = `${sketchRect(x - 50 * s, y - 40 * s, 100 * s, 80 * s, 6, seed)} ` +
    `M ${x - 62 * s} ${y - 40 * s} L ${x} ${y - 92 * s} L ${x + 62 * s} ${y - 40 * s} ` +
    `${sketchRect(x - 14 * s, y + 4 * s, 28 * s, 36 * s, 4, seed + 1)}`;
  return <DrawPath d={d} start={start} dur={0.8} width={4.5} stroke={color} dashed={dashed}></DrawPath>;
}

// Bank icon (pediment + columns).
function BankIcon({ x, y, s = 1, start = 0, seed = 43 }) {
  const d = `M ${x - 70 * s} ${y - 50 * s} L ${x} ${y - 88 * s} L ${x + 70 * s} ${y - 50 * s} Z ` +
    `${sketchLine(x - 60 * s, y - 44 * s, x - 60 * s, y + 30 * s, seed)} ` +
    `${sketchLine(x - 20 * s, y - 44 * s, x - 20 * s, y + 30 * s, seed + 1)} ` +
    `${sketchLine(x + 20 * s, y - 44 * s, x + 20 * s, y + 30 * s, seed + 2)} ` +
    `${sketchLine(x + 60 * s, y - 44 * s, x + 60 * s, y + 30 * s, seed + 3)} ` +
    `${sketchLine(x - 78 * s, y + 34 * s, x + 78 * s, y + 34 * s, seed + 4)}`;
  return <DrawPath d={d} start={start} dur={0.9} width={4.5}></DrawPath>;
}

// Pile of coins (pyramid).
function CoinPile({ x, y, rows = 3, r = 30, start = 0, stagger = 0.08 }) {
  const coins = [];
  let i = 0;
  for (let row = 0; row < rows; row++) {
    const n = rows - row + 2;
    for (let k = 0; k < n; k++) {
      coins.push(
        <Coin key={i} cx={x + (k - (n - 1) / 2) * (r * 2.02)} cy={y - row * (r * 1.72)}
          r={r} label="$" start={start + i * stagger} seed={50 + i} fontSize={r * 0.95}></Coin>
      );
      i++;
    }
  }
  return <g>{coins}</g>;
}

// ════════════════════════════════ SCENE 1 — HOOK ════════════════════════════
function Scene1() {
  return (
    <Sprite start={0} end={24}>
      <SceneWrap label="S1 hook">
        <Cam kf={[{ t: 0, s: 1.06 }, { t: 10, s: 1.0 }, { t: 12.4, s: 1.0 }, { t: 14.2, s: 0.94, y: 30 }]}>
          <SceneSvg>
            <Ground start={0.1}></Ground>
            {/* The two famous buttons */}
            <SketchButton x={360} y={430} w={280} h={120} label={ST('s1.btn.buy')} start={0.4} seed={2}
              fill="var(--good-soft)" fontSize={52} press={[3.1]}></SketchButton>
            <SketchButton x={360} y={590} w={280} h={120} label={ST('s1.btn.sell')} start={1.1} seed={3}
              fill="var(--bad-soft)" fontSize={52} press={[6.3]}></SketchButton>
            {/* Trader */}
            <Seg start={2.0}>
              {({ localTime }) => {
                const pressing = (localTime > 1.0 && localTime < 1.7) || (localTime > 4.2 && localTime < 4.9);
                const mood = localTime > 4.4 && localTime < 5.4 ? 'sad' : localTime > 1.2 && localTime < 4.2 ? 'happy' : 'neutral';
                return <StickFigure x={790} y={940} pose={pressing ? 'press' : 'stand'} facing={-1}
                  mood={mood} start={0} scale={1.15}></StickFigure>;
              }}
            </Seg>
            {/* Chart */}
            <DrawPath d={`${sketchLine(1000, 760, 1740, 760, 8)} ${sketchLine(1000, 760, 1000, 320, 9)}`}
              start={1.6} dur={0.8} width={4.5}></DrawPath>
            <Candle x={1080} y={740} h={100} up start={3.4}></Candle>
            <Candle x={1170} y={680} h={120} up start={3.9}></Candle>
            <Candle x={1260} y={600} h={150} up start={4.4}></Candle>
            <Candle x={1350} y={680} h={130} up={false} start={6.6}></Candle>
            <Candle x={1440} y={745} h={120} up={false} start={7.1}></Candle>
            <SvgText x={1545} y={735} size={30} start={7.6} color="var(--ink-soft)">{ST('s1.chart.repeat')}</SvgText>
            {/* The bigger button */}
            <Seg start={13.0}>
              {({ localTime }) => {
                const e = Easing.easeOutBack(clamp(localTime / (0.5 * ANIM), 0, 1));
                return (
                  <g transform={`translate(960 250) scale(${1.7 - 0.7 * e}) rotate(${-3 * (1 - e)}) translate(-960 -250)`}
                    opacity={clamp(localTime / (0.2 * ANIM), 0, 1)}>
                    <path d={sketchRect(490, 140, 940, 220, 24, 17)} fill="var(--accent)" stroke="var(--ink)" strokeWidth="6"></path>
                    <text x={960} y={272} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 84, fill: '#fff' }}>
                      {ST('s1.btn.lendborrow')}
                    </text>
                    <Sparkle cx={430} cy={150} r={20} start={0.4}></Sparkle>
                    <Sparkle cx={1490} cy={330} r={16} start={0.55} phase={1.2}></Sparkle>
                    <Sparkle cx={1465} cy={120} r={24} start={0.7} phase={2.1}></Sparkle>
                  </g>
                );
              }}
            </Seg>
          </SceneSvg>
          <HandText x={960} y={56} size={58} align="center" font="var(--font-display)" weight={700}
            start={0.6} rotate={-1} fadeOutAt={12.4}>{ST('s1.title')}</HandText>
        </Cam>
        <Highlight start={18.2} end={23.7} size={120}>{ST('s1.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ═══════════════════════════ SCENE 2 — CRYPTO TODAY ═════════════════════════
function Scene2() {
  const S = 24;
  return (
    <Sprite start={S} end={S + 24}>
      <SceneWrap label="S2 crypto today">
        {/* Part A: the spot market (0–9.5) */}
        <Seg start={0} end={10}>
          {({ localTime }) => (
            <div style={{ position: 'absolute', inset: 0, opacity: clamp((9.8 - localTime) / 0.4, 0, 1) }}>
              <SceneSvg>
                <Ground start={0}></Ground>
                <DrawPath d={sketchCircle(620, 600, 210, 19)} start={0.2} dur={1.0} width={5.5}
                  fill="var(--accent-soft)"></DrawPath>
                <SvgText x={620} y={590} size={48} font="var(--font-display)" weight={700} start={1.0}>{ST('s2.pool.title')}</SvgText>
                <SvgText x={620} y={646} size={30} color="var(--ink-soft)" start={1.2}>{ST('s2.pool.sub')}</SvgText>
                {/* buyer / seller */}
                <Seg start={1.4}><StickFigure x={210} y={940} pose="point" facing={1} mood="happy" start={0}></StickFigure></Seg>
                <Seg start={3.6}><StickFigure x={1040} y={940} pose="point" facing={-1} start={0}></StickFigure></Seg>
                <FlowDot p0={[250, 800]} c={[420, 560]} p1={[590, 660]} start={2.3} period={0.9} once
                  label="$" color="var(--good)"></FlowDot>
                <FlowDot p0={[660, 660]} c={[860, 540]} p1={[1000, 800]} start={4.4} period={0.9} once
                  label="T" color="var(--accent)"></FlowDot>
                {/* price squiggle */}
                <DrawPath d={`M 1230 470 Q 1300 420 1340 330 Q 1380 250 1430 350 Q 1470 430 1530 430 Q 1600 430 1660 416`}
                  start={5.2} dur={2.2} width={5} stroke="var(--accent)"></DrawPath>
                <SvgText x={1450} y={520} size={30} color="var(--ink-soft)" start={6.4}>{ST('s2.chart.note')}</SvgText>
              </SceneSvg>
              <HandText x={960} y={56} size={58} align="center" font="var(--font-display)" weight={700}
                start={0.4} rotate={1}>{ST('s2.title')}</HandText>
            </div>
          )}
        </Seg>
        {/* Part B: now what? (10–24) */}
        <Seg start={10}>
          <SceneSvg>
            <Ground start={0}></Ground>
            <CoinPile x={620} y={880} rows={3} start={0.1}></CoinPile>
            <Seg start={0.9}><StickFigure x={620} y={772} pose="sit" facing={1} mood="neutral" start={0}></StickFigure></Seg>
            <SketchButton x={1130} y={500} w={250} h={104} label={ST('s2.btn.hold')} start={3.4} seed={61} fontSize={40}></SketchButton>
            <SketchButton x={1420} y={500} w={250} h={104} label={ST('s2.btn.pray')} start={4.2} seed={62} fontSize={40}></SketchButton>
            <SketchButton x={1130} y={644} w={250} h={104} label={ST('s2.btn.tweet')} start={5.0} seed={63} fontSize={40}></SketchButton>
            <SketchButton x={1420} y={644} w={250} h={104} label={ST('s2.btn.dump')} start={5.8} seed={64} fontSize={32}></SketchButton>
            <Sparkle cx={1690} cy={460} r={14} start={6.4}></Sparkle>
          </SceneSvg>
          <HandText x={620} y={420} size={84} align="center" font="var(--font-display)" weight={700}
            start={1.8} rotate={-2}>{ST('s2.nowwhat')}</HandText>
          <HandText x={1395} y={420} size={40} align="center" start={3.0} rotate={-1}
            color="var(--ink-soft)">{ST('s2.options')}</HandText>
        </Seg>
        <Highlight start={S + 19.6} end={S + 23.7} size={130}>{ST('s2.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ═══════════════════════ SCENE 3 — THE REAL ECONOMY ═════════════════════════
function Scene3() {
  const S = 48;
  return (
    <Sprite start={S} end={S + 24}>
      <SceneWrap label="S3 real economy">
        <Cam kf={[{ t: 0, s: 1 }, { t: 9.5, s: 1 }, { t: 11.5, s: 1.07, y: -20 }]}>
          <SceneSvg>
            <Ground start={0}></Ground>
            <DrawPath d={sketchLine(960, 150, 960, 820, 23, 5)} start={0.2} dur={0.9} width={4}
              stroke="var(--ink-soft)" dashed></DrawPath>
            {/* Left: asset holders */}
            <Seg start={0.8}>
              <BankIcon x={300} y={560} start={0.2}></BankIcon>
              <HouseIcon x={530} y={540} start={0.5}></HouseIcon>
              <Coin cx={700} cy={520} r={36} label="$" start={0.8} seed={71}></Coin>
              <CoinPile x={430} y={880} rows={2} r={26} start={1.0}></CoinPile>
              <Seg start={1.6}><StickFigure x={720} y={940} pose="stand" facing={1} mood="happy" start={0} scale={1.1}></StickFigure></Seg>
            </Seg>
            {/* Right: exposure seekers */}
            <Seg start={3.6}>
              <Seg start={0.6}><StickFigure x={1240} y={940} pose="point" facing={-1} start={0} scale={1.1}></StickFigure></Seg>
              <HouseIcon x={1450} y={540} start={0.9} dashed color="var(--ink-soft)"></HouseIcon>
              <DrawPath d={sketchArrow(1580, 600, 1700, 480, 27)} start={1.3} dur={0.6}
                width={5} stroke="var(--good)"></DrawPath>
              <Coin cx={1660} cy={650} r={36} label="20x" start={1.6} seed={73} accent fontSize={26}></Coin>
            </Seg>
            {/* The bridge */}
            <DrawPath d={`M 700 690 Q 960 480 1220 690`} start={10.2} dur={1.4} width={6}
              stroke="var(--accent)"></DrawPath>
            <Seg start={12}>
              <FlowDot p0={[1220, 690]} c={[960, 480]} p1={[700, 690]} start={0} phase={0} label="$" color="var(--accent)"></FlowDot>
              <FlowDot p0={[1220, 690]} c={[960, 480]} p1={[700, 690]} start={0} phase={0.5} label="$" color="var(--accent)"></FlowDot>
              <FlowDot p0={[700, 740]} c={[960, 560]} p1={[1220, 740]} start={0.4} phase={0.25} r={12}
                color="var(--ink)" label="↗" labelSize={15}></FlowDot>
              <FlowDot p0={[700, 740]} c={[960, 560]} p1={[1220, 740]} start={0.4} phase={0.75} r={12}
                color="var(--ink)" label="↗" labelSize={15}></FlowDot>
            </Seg>
            <SvgText x={960} y={470} size={40} font="var(--font-display)" weight={700}
              color="var(--accent)" start={12.6} plate plateSeed={121}>{ST('s3.label.yield')}</SvgText>
            <SvgText x={960} y={800} size={40} font="var(--font-display)" weight={700} start={13.2}
              plate plateSeed={122}>{ST('s3.label.exposure')}</SvgText>
          </SceneSvg>
          <HandText x={480} y={170} size={56} align="center" font="var(--font-display)" weight={700}
            start={0.9}>{ST('s3.holders.title')}</HandText>
          <HandText x={480} y={248} size={34} align="center" start={1.3} color="var(--ink-soft)">{ST('s3.holders.sub')}</HandText>
          <HandText x={1440} y={170} size={56} align="center" font="var(--font-display)" weight={700}
            start={3.9}>{ST('s3.seekers.title')}</HandText>
          <HandText x={1440} y={248} size={34} align="center" start={4.3} color="var(--ink-soft)">{ST('s3.seekers.sub')}</HandText>
          <HandText x={960} y={56} size={50} align="center" start={9.0} rotate={-1}
            font="var(--font-display)" weight={700}>{ST('s3.title')}</HandText>
        </Cam>
        <Highlight start={S + 17.6} end={S + 23.7} size={110}>{ST('s3.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

Object.assign(window, { SceneWrap, FlowDot, Ground, HouseIcon, BankIcon, CoinPile, Scene1, Scene2, Scene3 });
