// vibe-scenes-c.jsx — Scenes 7–9: The Vibe Idea, Synthetic Exposure, Closing
// Timeline (absolute): S7 142–166 · S8 166–192 · S9 192–212

// ═══════════════════════ SCENE 7 — THE CORE VIBE IDEA ═══════════════════════
function Scene7() {
  const S = 142;
  return (
    <Sprite start={S} end={S + 24}>
      <SceneWrap label="S7 vibe idea">
        <SceneSvg>
          <Ground start={0}></Ground>
          {/* hub ring */}
          <DrawPath d={sketchCircle(960, 310, 185, 91)} start={9.8} dur={0.9} width={5}
            stroke="var(--accent)"></DrawPath>
          {/* holder side */}
          <Seg start={2.8}><StickFigure x={340} y={940} pose="stand" facing={1} mood="happy" start={0} scale={1.12}></StickFigure></Seg>
          <Bubble x={110} y={530} w={470} h={170} tail="bl" start={3.4} fontSize={36}>
            {ST('s7.bubble.holder')}
          </Bubble>
          {/* trader side */}
          <Seg start={5.8}><StickFigure x={1580} y={940} pose="point" facing={-1} start={0} scale={1.12}></StickFigure></Seg>
          <Bubble x={1340} y={530} w={470} h={170} tail="br" start={6.4} fontSize={36}>
            {ST('s7.bubble.trader')}
          </Bubble>
          {/* flows */}
          <Seg start={10.8}>
            <DrawPath d={`M 480 780 Q 600 500 790 410`} start={0} dur={0.7} width={4} dashed stroke="var(--ink-soft)"></DrawPath>
            <DrawPath d={`M 1440 780 Q 1320 500 1130 410`} start={0.3} dur={0.7} width={4} dashed stroke="var(--ink-soft)"></DrawPath>
            <FlowDot p0={[480, 780]} c={[600, 500]} p1={[790, 410]} start={0.8} phase={0} r={13} color="var(--ink)" label="T" labelSize={16}></FlowDot>
            <FlowDot p0={[790, 460]} c={[620, 580]} p1={[470, 830]} start={1.2} phase={0.4} label="$" color="var(--accent)"></FlowDot>
            <FlowDot p0={[790, 460]} c={[620, 580]} p1={[470, 830]} start={1.2} phase={0.9} label="$" color="var(--accent)"></FlowDot>
            <FlowDot p0={[1440, 780]} c={[1320, 500]} p1={[1130, 410]} start={1.0} phase={0.2} r={13} color="var(--ink)" label={ST('s7.flow.fee')} labelSize={14}></FlowDot>
            <FlowDot p0={[1130, 460]} c={[1300, 580]} p1={[1450, 830]} start={1.4} phase={0.6} r={13} color="var(--accent)" label="↗" labelColor="#fff"></FlowDot>
          </Seg>
          <SvgText x={520} y={460} size={36} font="var(--font-display)" weight={700} color="var(--accent)" start={12.6}
            plate plateSeed={125}>{ST('s7.label.yield')}</SvgText>
          <SvgText x={1400} y={460} size={36} font="var(--font-display)" weight={700} start={13.0}
            plate plateSeed={126}>{ST('s7.label.exposure')}</SvgText>
        </SceneSvg>
        {/* brand hub */}
        <DuckBadge x={960} y={258} size={172} start={0.4} bob></DuckBadge>
        <HandText x={960} y={372} size={78} align="center" font="var(--font-brand)" weight={900}
          start={1.1}>{ST('s7.brand')}</HandText>
        <HandText x={960} y={56} size={50} align="center" font="var(--font-display)" weight={700}
          start={8.6} rotate={-1}>{ST('s7.title')}</HandText>
        <Highlight start={S + 17.6} end={S + 23.7} size={118}>{ST('s7.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ═══════════════════ SCENE 8 — SYNTHETIC EXPOSURE ═══════════════════════════
function Scene8() {
  const S = 166;
  return (
    <Sprite start={S} end={S + 26}>
      <SceneWrap label="S8 synthetic exposure">
        {/* Part A: why naive lending fails (0–6.5) */}
        <Seg start={0} end={6.6} keepAfter={false}>
          {({ localTime }) => (
            <div style={{ position: 'absolute', inset: 0, opacity: clamp((6.4 - localTime) / 0.35, 0, 1) }}>
              <SceneSvg>
                <Ground start={0}></Ground>
                <Seg start={0.2}>
                  {({ localTime: lt }) => (
                    <StickFigure x={560} y={940} pose={lt > 2.8 ? 'panic' : 'point'} facing={1}
                      mood={lt > 2.8 ? 'shock' : 'neutral'} start={0} scale={1.12}></StickFigure>
                  )}
                </Seg>
                <Seg start={0.6}>
                  {({ localTime: lt }) => {
                    const runX = lt > 1.9 ? (lt - 1.9) * 520 : 0;
                    return (
                      <g transform={`translate(${runX} 0)`} opacity={clamp((1500 - (1100 + runX)) / 180 + 1, 0, 1)}>
                        <StickFigure x={1100} y={940} pose={lt > 1.9 ? 'run' : 'stand'} facing={1} start={0} scale={1.12}></StickFigure>
                      </g>
                    );
                  }}
                </Seg>
                <FlowDot p0={[620, 800]} c={[860, 620]} p1={[1060, 800]} start={1.2} period={1.1} once
                  r={30} color="var(--paper2)" label={ST('s8.token')} labelColor="var(--ink)" labelSize={20}></FlowDot>
                <Seg start={1.2} end={2.4} keepAfter={false}>
                  <circle cx={840} cy={700} r={0} fill="none"></circle>
                </Seg>
              </SceneSvg>
              <HandText x={960} y={56} size={54} align="center" font="var(--font-display)" weight={700}
                start={0.3} rotate={1}>{ST('s8.naive.title')}</HandText>
              <HandText x={620} y={580} size={64} align="center" start={3.4} rotate={-3}
                font="var(--font-display)" weight={700} color="var(--bad)">??</HandText>
              <HandText x={1430} y={640} size={36} align="center" start={3.0} color="var(--ink-soft)"
                rotate={2}>{ST('s8.naive.gone')}</HandText>
            </div>
          )}
        </Seg>
        {/* Part B: the synthetic version (6.6–26) */}
        <Seg start={6.6}>
          <SceneSvg>
            <Ground start={0}></Ground>
            {/* vault */}
            <DrawPath d={sketchRect(360, 480, 360, 330, 18, 95)} start={0.2} dur={0.9} width={6.5}
              fill="var(--paper2)"></DrawPath>
            <DrawPath d={`${sketchCircle(540, 620, 56, 96)} ${sketchLine(540, 576, 540, 664, 97)} ${sketchLine(496, 620, 584, 620, 98)}`}
              start={0.9} dur={0.7} width={5}></DrawPath>
            <SvgText x={540} y={748} size={40} font="var(--font-display)" weight={700} start={1.4}>{ST('s8.vault.title')}</SvgText>
            <SvgText x={540} y={790} size={26} color="var(--ink-soft)" start={1.7}>{ST('s8.vault.sub')}</SvgText>
            <SvgText x={540} y={860} size={28} color="var(--ink-soft)" start={5.4}>{ST('s8.vault.note')}</SvgText>
            <Seg start={1.6}><StickFigure x={180} y={940} pose="press" facing={1} mood="happy" start={0} scale={1.05}></StickFigure></Seg>
            <SvgText x={180} y={1015} size={28} font="var(--font-display)" weight={700} start={2.0}>{ST('s8.holder')}</SvgText>
            <FlowDot p0={[240, 800]} c={[360, 520]} p1={[520, 500]} start={2.2} period={1.0} once r={20}
              color="var(--paper2)" label={ST('s8.token')} labelColor="var(--ink)" labelSize={15}></FlowDot>
            <FlowDot p0={[240, 800]} c={[360, 520]} p1={[520, 500]} start={3.2} period={1.0} once r={20}
              color="var(--paper2)" label={ST('s8.token')} labelColor="var(--ink)" labelSize={15}></FlowDot>
            {/* the price */}
            <DrawPath d={`M 790 330 Q 850 300 890 250 Q 930 200 970 260 Q 1010 320 1070 290 Q 1110 270 1150 276`}
              start={5.6} dur={1.6} width={5} stroke="var(--accent)"></DrawPath>
            <SvgText x={970} y={380} size={30} color="var(--accent)" weight={700} start={6.8}>{ST('s8.price')}</SvgText>
            {/* trade screen */}
            <DrawPath d={sketchRect(1180, 420, 540, 440, 22, 99)} start={4.0} dur={1.0} width={6}
              fill="var(--paper2)"></DrawPath>
            <DrawPath d={`M 1240 600 Q 1300 560 1340 520 Q 1390 470 1430 540 Q 1470 610 1540 560 Q 1600 530 1650 540`}
              start={5.0} dur={1.2} width={4.5} stroke="var(--accent)"></DrawPath>
            <Seg start={6.0}>
              {({ localTime: lt }) => (
                <g>
                  <g transform={lt > 8.4 && lt < 8.9 ? 'translate(0 4)' : ''}>
                    <path d={sketchRect(1240, 690, 210, 84, 14, 101)} fill="var(--accent)" stroke="var(--ink)" strokeWidth="4.5"
                      opacity={clamp(lt / (0.3 * ANIM), 0, 1)}></path>
                    <text x={1345} y={745} textAnchor="middle" opacity={clamp(lt / (0.4 * ANIM), 0, 1)}
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, fill: '#fff' }}>{ST('s8.btn.long')}</text>
                  </g>
                  <path d={sketchRect(1470, 690, 210, 84, 14, 102)} fill="var(--paper)" stroke="var(--ink)" strokeWidth="4.5"
                    opacity={clamp((lt - 0.3) / (0.3 * ANIM), 0, 1)}></path>
                  <text x={1575} y={745} textAnchor="middle" opacity={clamp((lt - 0.3) / (0.4 * ANIM), 0, 1)}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, fill: 'var(--ink)' }}>{ST('s8.btn.short')}</text>
                </g>
              )}
            </Seg>
            <Seg start={7.4}><StickFigure x={1830} y={940} pose="press" facing={-1} start={0} scale={1.05}></StickFigure></Seg>
            <SvgText x={1830} y={1015} size={28} font="var(--font-display)" weight={700} start={7.8}>{ST('s8.trader')}</SvgText>
            {/* exposure tracks the price, not the tokens */}
            <DrawPath d={sketchLine(1340, 430, 1160, 310, 103, 4)} start={8.2} dur={0.6} width={4}
              dashed stroke="var(--ink-soft)"></DrawPath>
            {/* solver — protocol-operated, stands on the vault & quotes the market (~4:01) */}
            <Seg start={6.8}><StickFigure x={540} y={480} pose="point" facing={1} mood="happy" start={0} scale={1.05}></StickFigure></Seg>
            <SvgText x={290} y={380} size={28} font="var(--font-display)" weight={700} start={7.2}>{ST('s8.solver')}</SvgText>
            <SvgText x={290} y={414} size={20} color="var(--ink-soft)" start={7.4}>{ST('s8.solver.sub')}</SvgText>
            <Bubble x={210} y={130} w={390} h={140} tail="br" tailLen={56} tailDx={-50} dur={0.05} start={7.7} fontSize={28}>
              {ST('s8.bubble.solver')}
            </Bubble>
            {/* fee + yield loop */}
            <Seg start={11.2}>
              <FlowDot p0={[1240, 800]} c={[980, 900]} p1={[710, 700]} start={0} phase={0} label={ST('s8.flow.fee')} labelSize={15} color="var(--ink)"></FlowDot>
              <FlowDot p0={[1240, 800]} c={[980, 900]} p1={[710, 700]} start={0} phase={0.5} label={ST('s8.flow.fee')} labelSize={15} color="var(--ink)"></FlowDot>
              <FlowDot p0={[480, 820]} c={[340, 890]} p1={[240, 850]} start={0.6} phase={0.25} label="$" color="var(--accent)"></FlowDot>
              <FlowDot p0={[480, 820]} c={[340, 890]} p1={[240, 850]} start={0.6} phase={0.75} label="$" color="var(--accent)"></FlowDot>
            </Seg>
            <Seg start={12.4}>
              <SvgText x={975} y={935} size={32} font="var(--font-display)" weight={700} start={0}
                plate plateSeed={127}>{ST('s8.label.fees')}</SvgText>
              <SvgText x={350} y={935} size={32} font="var(--font-display)" weight={700} color="var(--accent)" start={0.4}
                plate plateSeed={128}>{ST('s8.label.yield')}</SvgText>
            </Seg>
          </SceneSvg>
          <HandText x={960} y={56} size={54} align="center" font="var(--font-display)" weight={700}
            start={0.5} rotate={-1}>{ST('s8.title')}</HandText>
        </Seg>
        <Highlight start={S + 21.2} end={S + 25.7} size={138}>{ST('s8.highlight')}</Highlight>
      </SceneWrap>
    </Sprite>
  );
}

// ═══════════════════════════ SCENE 9 — CLOSING ══════════════════════════════
function Scene9() {
  const S = 192;
  return (
    <Sprite start={S} end={S + 20}>
      <SceneWrap label="S9 closing">
        {/* Part A: the complete market (0–8.2) */}
        <Seg start={0} end={8.4} keepAfter={false}>
          {({ localTime }) => (
            <div style={{ position: 'absolute', inset: 0, opacity: clamp((8.2 - localTime) / 0.4, 0, 1) }}>
              <SceneSvg>
                <SketchButton x={420} y={420} w={250} h={120} label={ST('s9.btn.buy')} start={0.3} seed={111}
                  fill="var(--good-soft)" fontSize={46}></SketchButton>
                <SketchButton x={710} y={420} w={250} h={120} label={ST('s9.btn.sell')} start={0.9} seed={112}
                  fill="var(--bad-soft)" fontSize={46}></SketchButton>
                <Seg start={1.6}>
                  {({ localTime: lt }) => (
                    <g opacity={clamp(lt / (0.25 * ANIM), 0, 1)}>
                      <path d={sketchRect(1000, 420, 480, 120, 16, 113)} fill="var(--accent)" stroke="var(--ink)" strokeWidth="5.5"></path>
                      <text x={1240} y={497} textAnchor="middle"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46, fill: '#fff' }}>{ST('s9.btn.lendborrow')}</text>
                    </g>
                  )}
                </Seg>
                <DrawPath d={`M 320 480 Q 320 300 960 300 Q 1600 300 1600 480 Q 1600 660 960 660 Q 320 660 320 480`}
                  start={3.4} dur={2.2} width={5} stroke="var(--ink)"></DrawPath>
                <Sparkle cx={1660} cy={330} r={18} start={4.6}></Sparkle>
                <Sparkle cx={290} cy={620} r={14} start={4.9} phase={1.4}></Sparkle>
                <Seg start={5.4}><StickFigure x={300} y={940} pose="cheer" facing={1} mood="happy" start={0}></StickFigure></Seg>
                <Seg start={5.7}><StickFigure x={1620} y={940} pose="cheer" facing={-1} mood="happy" start={0}></StickFigure></Seg>
                <Ground start={0}></Ground>
              </SceneSvg>
              <HandText x={960} y={730} size={62} align="center" font="var(--font-display)" weight={700}
                start={5.0} rotate={-1}>{ST('s9.complete')}</HandText>
            </div>
          )}
        </Seg>
        {/* Part B: brand close (8.6+) */}
        <Seg start={8.6}>
          <SceneSvg>
            <Sparkle cx={700} cy={300} r={20} start={2.2}></Sparkle>
            <Sparkle cx={1240} cy={260} r={16} start={2.5} phase={1.1}></Sparkle>
            <Sparkle cx={1300} cy={460} r={24} start={2.8} phase={2.2}></Sparkle>
            <Sparkle cx={640} cy={500} r={14} start={3.1} phase={0.6}></Sparkle>
          </SceneSvg>
          <DuckBadge x={960} y={295} size={240} start={0.2} bob></DuckBadge>
          <HandText x={960} y={450} size={120} align="center" font="var(--font-brand)" weight={900}
            start={0.9}>{ST('s9.brand')}</HandText>
          <HandText x={960} y={635} size={68} align="center" font="var(--font-display)" weight={700}
            start={1.8} rotate={-1}>{ST('s9.tagline')}</HandText>
          <Seg start={2.6}>
            <svg style={{ position: 'absolute', left: 660, top: 733, overflow: 'visible' }} width="600" height="40">
              <DrawPath d={scribblePath(0, 10, 600, 13)} start={0} dur={0.5} stroke="var(--accent)" width={9}></DrawPath>
            </svg>
          </Seg>
          <HandText x={960} y={800} size={27} align="center" start={4.6} color="var(--ink-soft)">
            {ST('s9.disclaimer')}
          </HandText>
        </Seg>
      </SceneWrap>
    </Sprite>
  );
}

Object.assign(window, { Scene7, Scene8, Scene9 });
