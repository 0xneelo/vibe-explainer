// vibe-scenes-b.jsx — Scenes 4–6: Real Estate, Token Conveyor, Fake vs Real Yield
// Timeline (absolute): S4 72–98 · S5 98–118 · S6 118–142

// ══════════════════════ SCENE 4 — REAL ESTATE ANALOGY ═══════════════════════
function Scene4() {
  const S = 72;
  return (
    <Sprite start={S} end={S + 26}>
      <SceneWrap label="S4 real estate">
        <Cam kf={[{ t: 0, s: 1.04 }, { t: 12, s: 1 }, { t: 17.4, s: 1.1, y: 26 }, { t: 20.2, s: 1.04 }]}>
          <SceneSvg>
            <Ground start={0}></Ground>
            {/* Building shake on ban */}
            <Seg start={0}>
              {({ localTime }) => {
                let shake = 0;
                if (localTime > 17.4 && localTime < 18.5) shake = Math.sin((localTime - 17.4) * 42) * 7 * (1 - (localTime - 17.4) / 1.1);
                return (
                  <g transform={`translate(${shake} 0)`}>
                    <DrawPath d={sketchRect(700, 300, 520, 640, 10, 33)} start={0.2} dur={1.4} width={6}
                      fill="var(--paper2)"></DrawPath>
                    {/* windows */}
                    {[0, 1, 2, 3].map((row) => [0, 1, 2].map((col) => (
                      <DrawPath key={row + '-' + col}
                        d={sketchRect(760 + col * 150, 350 + row * 130, 90, 80, 5, 34 + row * 3 + col)}
                        start={1.2 + (row * 3 + col) * 0.08} dur={0.4} width={4}
                        fill={(row + col) % 2 ? 'var(--accent-soft)' : 'none'}></DrawPath>
                    )))}
                    <DrawPath d={sketchRect(890, 830, 130, 110, 8, 47)} start={2.2} dur={0.5} width={5}></DrawPath>
                    <DrawPath d={`M 690 300 L 960 200 L 1230 300`} start={1.8} dur={0.6} width={6}></DrawPath>
                  </g>
                );
              }}
            </Seg>
            {/* Owner + tenant */}
            <Seg start={2.6}>
              {({ localTime }) => (
                <StickFigure x={420} y={940} pose={localTime > 14.8 ? 'panic' : 'stand'} facing={1}
                  mood={localTime > 14.8 ? 'shock' : 'happy'} start={0} scale={1.12}></StickFigure>
              )}
            </Seg>
            <Seg start={3.4}>
              {({ localTime }) => (
                <g>
                  <StickFigure x={1500} y={940} pose={localTime > 14.0 ? 'panic' : 'stand'} facing={-1}
                    mood={localTime > 14.0 ? 'shock' : 'neutral'} start={0} scale={1.12}></StickFigure>
                  <DrawPath d={sketchRect(1560, 880, 90, 60, 8, 49)} start={0.3} dur={0.5} width={4.5}
                    fill="var(--paper2)"></DrawPath>
                </g>
              )}
            </Seg>
            <SvgText x={420} y={1010} size={34} font="var(--font-display)" weight={700} start={3.2}>{ST('s4.owner')}</SvgText>
            <SvgText x={1500} y={1010} size={34} font="var(--font-display)" weight={700} start={4.0}>{ST('s4.renter')}</SvgText>
            {/* Rent / access arrows */}
            <Seg start={5.0} end={17.3} keepAfter={false}>
              <DrawPath d={`M 1430 640 Q 960 560 510 640`} start={0} dur={1.0} width={5} stroke="var(--accent)"></DrawPath>
              <FlowDot p0={[1430, 640]} c={[960, 560]} p1={[510, 640]} start={1.0} phase={0} label="$"></FlowDot>
              <FlowDot p0={[1430, 640]} c={[960, 560]} p1={[510, 640]} start={1.0} phase={0.5} label="$"></FlowDot>
              <DrawPath d={sketchArrow(510, 760, 1420, 760, 51, 20, 4)} start={1.6} dur={1.0} width={5}></DrawPath>
            </Seg>
            <Seg start={6.2} end={17.3} keepAfter={false}>
              <SvgText x={960} y={545} size={38} font="var(--font-display)" weight={700} color="var(--accent)"
                plate plateSeed={123}>{ST('s4.label.rent')}</SvgText>
              <SvgText x={960} y={815} size={38} font="var(--font-display)" weight={700}
                plate plateSeed={124}>{ST('s4.label.access')}</SvgText>
            </Seg>
            {/* THE BAN — lands only after “…ban renting overnight” is narrated */}
            <Seg start={17.4}>
              {({ localTime }) => {
                const e = Easing.easeOutBack(clamp(localTime / (0.4 * ANIM), 0, 1));
                return (
                  <g transform={`translate(960 530) rotate(-8) scale(${2.0 - e}) translate(-960 -530)`}
                    opacity={clamp(localTime / (0.15 * ANIM), 0, 1)}>
                    <path d={sketchRect(520, 455, 880, 150, 12, 55)} fill="var(--paper)" stroke="var(--bad)" strokeWidth="9"></path>
                    <text x={960} y={555} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 76, fill: 'var(--bad)', letterSpacing: 2 }}>
                      {ST('s4.ban')}
                    </text>
                  </g>
                );
              }}
            </Seg>
            {/* value crash */}
            <DrawPath d={sketchArrow(1290, 330, 1420, 470, 57)} start={18.4} dur={0.3} width={7} stroke="var(--bad)"></DrawPath>
            <SvgText x={1480} y={420} size={36} color="var(--bad)" font="var(--font-display)" weight={700} start={18.85}>{ST('s4.value')}</SvgText>
          </SceneSvg>
          <HandText x={960} y={52} size={56} align="center" font="var(--font-display)" weight={700}
            start={0.5} rotate={-1}>{ST('s4.title')}</HandText>
          <HandText x={960} y={690} size={42} align="center" start={19.5} rotate={-2} plate
            color="var(--ink-soft)" width={700}>{ST('s4.noincome')}</HandText>
        </Cam>
        <Highlight start={S + 20.4} end={S + 25.7} size={112}>{ST('s4.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ═══════════════════════ SCENE 5 — THE TOKEN CONVEYOR ═══════════════════════
function Scene5() {
  const S = 98;
  const NAMES = ST('s5.tokens').split(',').map((s) => s.trim()).filter(Boolean);
  return (
    <Sprite start={S} end={S + 20}>
      <SceneWrap label="S5 conveyor">
        <Cam kf={[{ t: 0, s: 1.02 }, { t: 10, s: 1 }, { t: 12.5, s: 1.12, x: -120, y: -40 }]}>
          <SceneSvg>
            {/* printer */}
            <DrawPath d={sketchRect(120, 380, 320, 260, 16, 61)} start={0.2} dur={0.9} width={6}
              fill="var(--paper2)"></DrawPath>
            <SvgText x={280} y={490} size={38} font="var(--font-display)" weight={700} start={0.9}>{ST('s5.printer.l1')}</SvgText>
            <SvgText x={280} y={540} size={38} font="var(--font-display)" weight={700} start={0.9}>{ST('s5.printer.l2')}</SvgText>
            <SvgText x={280} y={590} size={26} color="var(--ink-soft)" start={1.1}>{ST('s5.printer.sub')}</SvgText>
            {/* belt */}
            <DrawPath d={`${sketchLine(440, 620, 1240, 620, 63)} ${sketchLine(440, 668, 1240, 668, 64)}`}
              start={0.8} dur={0.8} width={5}></DrawPath>
            <Seg start={1.0}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <DrawPath key={i} d={sketchCircle(500 + i * 140, 644, 17, 65 + i)} start={0.1 + i * 0.07}
                  dur={0.3} width={4}></DrawPath>
              ))}
            </Seg>
            {/* tokens riding the belt then falling into the box */}
            <Seg start={1.8}>
              {({ localTime }) => (
                <g>
                  {NAMES.map((name, i) => {
                    const born = i * 1.25;
                    const age = localTime - born;
                    if (age < 0 || age > 4.4) return null;
                    const beltT = clamp(age / 2.6, 0, 1);
                    let x = 470 + beltT * 760, y = 580;
                    if (age > 2.6) { // falling off the end
                      const f = (age - 2.6) / 1.2;
                      x = 1230 + f * 160;
                      y = 580 + f * f * 260;
                    }
                    const o = age > 3.6 ? clamp((4.4 - age) / 0.6, 0, 1) : 1;
                    return (
                      <g key={i} opacity={o} transform={age > 2.6 ? `rotate(${(age - 2.6) * 70} ${x} ${y})` : ''}>
                        <circle cx={x} cy={y} r={38} fill="var(--paper2)" stroke="var(--ink)" strokeWidth="4.5"></circle>
                        <text x={x} y={y + 9} textAnchor="middle"
                          style={{ fontFamily: 'var(--font-hand)', fontSize: 25, fontWeight: 700, fill: 'var(--ink)' }}>{name}</text>
                      </g>
                    );
                  })}
                </g>
              )}
            </Seg>
            {/* the box */}
            <DrawPath d={sketchRect(1270, 780, 380, 180, 10, 71)} start={1.4} dur={0.8} width={6}
              fill="var(--paper2)"></DrawPath>
            <SvgText x={1460} y={880} size={44} font="var(--font-display)" weight={700} start={2.2}>{ST('s5.box.title')}</SvgText>
            <SvgText x={1460} y={925} size={26} color="var(--ink-soft)" start={2.4}>{ST('s5.box.sub')}</SvgText>
            {/* tiny productive box */}
            <DrawPath d={sketchRect(1730, 880, 130, 80, 8, 73)} start={3.0} dur={0.6} width={4.5}
              stroke="var(--accent)" fill="var(--accent-soft)"></DrawPath>
            <SvgText x={1795} y={915} size={20} color="var(--accent)" weight={700} start={3.6}>{ST('s5.productive.l1')}</SvgText>
            <SvgText x={1795} y={942} size={20} color="var(--accent)" weight={700} start={3.6}>{ST('s5.productive.l2')}</SvgText>
            {/* trust me bro vignette */}
            <Seg start={12.2}>
              <Seg start={0}><StickFigure x={620} y={420} pose="point" facing={1} start={0} scale={0.95}></StickFigure></Seg>
              <Seg start={0.4}><StickFigure x={880} y={420} pose="stand" facing={-1} mood="sad" start={0} scale={0.95}></StickFigure></Seg>
              <Bubble x={330} y={90} w={420} h={130} tail="br" start={0.8} fontSize={34}>
                {ST('s5.bubble')}
              </Bubble>
            </Seg>
          </SceneSvg>
          <HandText x={960} y={52} size={56} align="center" font="var(--font-display)" weight={700}
            start={0.4} rotate={1}>{ST('s5.title')}</HandText>
        </Cam>
        <Highlight start={S + 15.8} end={S + 19.7} size={116}>{ST('s5.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ════════════════════ SCENE 6 — FAKE YIELD vs REAL YIELD ════════════════════
function YieldMachine({ x, y, label1, label2, accent = false, start = 0, seed = 80 }) {
  return (
    <g>
      <DrawPath d={sketchRect(x, y, 460, 300, 18, seed)} start={start} dur={1.0} width={6}
        fill={accent ? 'var(--accent-soft)' : 'var(--paper2)'}
        stroke={accent ? 'var(--accent)' : 'var(--ink)'}></DrawPath>
      <DrawPath d={`M ${x + 150} ${y} L ${x + 180} ${y - 60} L ${x + 280} ${y - 60} L ${x + 310} ${y}`}
        start={start + 0.5} dur={0.5} width={5} stroke={accent ? 'var(--accent)' : 'var(--ink)'}></DrawPath>
      <SvgText x={x + 230} y={y + 140} size={42} font="var(--font-display)" weight={700} start={start + 0.7}
        color={accent ? 'var(--accent)' : 'var(--ink)'}>{label1}</SvgText>
      <SvgText x={x + 230} y={y + 190} size={42} font="var(--font-display)" weight={700} start={start + 0.7}
        color={accent ? 'var(--accent)' : 'var(--ink)'}>{label2}</SvgText>
    </g>
  );
}

function Scene6() {
  const S = 118;
  return (
    <Sprite start={S} end={S + 24}>
      <SceneWrap label="S6 fake vs real yield">
        <Cam kf={[{ t: 0, s: 1.16, x: 240 }, { t: 8.5, s: 1.16, x: 240 }, { t: 11, s: 1.16, x: -240 }, { t: 18.5, s: 1.16, x: -240 }, { t: 20.5, s: 1 }]}>
          <SceneSvg>
            <Ground start={0} y={960}></Ground>
            {/* Machine 1: inflation */}
            <YieldMachine x={210} y={400} label1={ST('s6.machine1.l1')} label2={ST('s6.machine1.l2')} start={0.2} seed={81}></YieldMachine>
            {/* printed tokens raining onto pile */}
            <Seg start={1.6}>
              {({ localTime }) => (
                <g>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const born = i * 0.7;
                    const age = localTime - born;
                    if (age < 0) return null;
                    const f = clamp(age / 0.8, 0, 1);
                    const x = 700 + (i % 3) * 46 - 40, y = 460 + Easing.easeInQuad(f) * (400 - (i % 3) * 36);
                    return <circle key={i} cx={x} cy={y} r={24} fill="var(--paper2)" stroke="var(--ink)" strokeWidth="4"></circle>;
                  })}
                </g>
              )}
            </Seg>
            <SvgText x={700} y={945} size={30} color="var(--ink-soft)" start={3.2}>{ST('s6.more')}</SvgText>
            {/* shrinking share */}
            <Seg start={4.6}>
              {({ localTime }) => {
                const shrink = 1 - 0.45 * clamp(localTime / 2.5, 0, 1);
                return (
                  <g>
                    <circle cx={420} cy={840} r={56 * shrink} fill="var(--bad-soft)" stroke="var(--bad)" strokeWidth="5"></circle>
                    <text x={420} y={852} textAnchor="middle" style={{ fontFamily: 'var(--font-hand)', fontSize: 30 * shrink + 6, fill: 'var(--bad)', fontWeight: 700 }}>
                      {ST('s6.share')}
                    </text>
                  </g>
                );
              }}
            </Seg>
            {/* X stamp */}
            <Seg start={8.2}>
              <DrawPath d={`${sketchLine(280, 330, 620, 660, 86, 5)} ${sketchLine(620, 330, 280, 660, 87, 5)}`}
                start={0} dur={0.5} width={13} stroke="var(--bad)"></DrawPath>
            </Seg>
            {/* Machine 2: real demand */}
            <YieldMachine x={1250} y={400} label1={ST('s6.machine2.l1')} label2={ST('s6.machine2.l2')} accent start={10.4} seed={83}></YieldMachine>
            <Seg start={11.4}>
              <Seg start={0}><StickFigure x={1130} y={960} pose="press" facing={1} start={0}></StickFigure></Seg>
              <SvgText x={1130} y={700} size={30} font="var(--font-display)" weight={700} start={0.5}>{ST('s6.trader')}</SvgText>
              <Seg start={0.5}><StickFigure x={1830} y={960} pose="cheer" facing={-1} mood="happy" start={0}></StickFigure></Seg>
              <SvgText x={1830} y={700} size={30} font="var(--font-display)" weight={700} start={1.0}>{ST('s6.holder')}</SvgText>
              <FlowDot p0={[1150, 820]} c={[1180, 600]} p1={[1330, 560]} start={1.2} phase={0} label={ST('s6.flow.fee')} labelSize={15} color="var(--ink)"></FlowDot>
              <FlowDot p0={[1150, 820]} c={[1180, 600]} p1={[1330, 560]} start={1.2} phase={0.5} label={ST('s6.flow.fee')} labelSize={15} color="var(--ink)"></FlowDot>
              <FlowDot p0={[1640, 560]} c={[1800, 600]} p1={[1820, 800]} start={1.8} phase={0.25} label="$" color="var(--accent)"></FlowDot>
              <FlowDot p0={[1640, 560]} c={[1800, 600]} p1={[1820, 800]} start={1.8} phase={0.75} label="$" color="var(--accent)"></FlowDot>
            </Seg>
            {/* check */}
            <Seg start={16.4}>
              <DrawPath d={`M 1320 480 L 1430 600 L 1660 340`} start={0} dur={0.6} width={13} stroke="var(--good)"></DrawPath>
            </Seg>
          </SceneSvg>
          <HandText x={960} y={92} size={56} align="center" font="var(--font-display)" weight={700}
            start={0.4}>{ST('s6.title')}</HandText>
          <HandText x={695} y={186} size={38} align="center" start={5.2} rotate={-1.5} color="var(--bad)"
            font="var(--font-hand)">{ST('s6.left')}</HandText>
          <HandText x={1480} y={186} size={38} align="center" start={13} rotate={1.5} color="var(--accent)"
            font="var(--font-hand)">{ST('s6.right')}</HandText>
        </Cam>
        <Highlight start={S + 18.6} end={S + 23.7} size={112}>{ST('s6.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

Object.assign(window, { Scene4, Scene5, Scene6, YieldMachine });
