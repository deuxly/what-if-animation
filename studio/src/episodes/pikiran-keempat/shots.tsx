import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, kf, clamp, easeOut, easeIn, backOut, rnd, camT, LOOKS, LEG_LEN, HEAD, joints, toWorld,
  Kitchen, KitchenIsland, islandTop, stand, KITCHEN, Tabletop, Study, Desk, Classroom, SchoolDesk, Kid, Rooftop, Schematic, SCH, SchLabel, CountUp, DrawOn,
  Bedroom, BedDuvet, bedSit, BEDROOM, LAMP, Cat, Cookie, CookieTop, Plate, PlateTop, Paper, Foreground, Sparkle, TitleCard, Glow, FONT, ShotProps,
} from '../../engine';

// "Bayangkan jika kamu bisa mendengar pikiran orang." A thriller in seventeen shots: the title on the roof at dusk,
// three demos (kitchen, classroom, the study at night), the science beat on the schematic, then the bedroom at night
// where Pip counts the minds in the house and gets one too many. The power: a cyan thought bubble with a picture in
// it over whoever is thinking, sound rings and a cyan glint in Pip's eyes. The fourth mind's bubble is red.

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const MOM = LOOKS.mom;
export const CYAN = '#7FD4FF';
export const RED = '#FF3B4E';

// ---------------------------------------------------------------- the power's marks
/** A thought bubble: three dots trail from the thinker's head (`from`), then the cloud pops on at (x, y). */
export const ThoughtBubble: React.FC<{ x: number; y: number; t: number; from: { x: number; y: number }; s?: number; color?: string; children?: React.ReactNode }> = ({
  x, y, t, from, s = 1, color = CYAN, children,
}) => {
  if (t < 0) return null;
  const pop = backOut(clamp((t - 4) / 7));
  const bob = Math.sin(t / 9) * 4 * s;
  const lobes: [number, number, number][] = [[-70, 10, 52], [-30, -30, 58], [30, -34, 56], [72, 4, 50], [36, 40, 50], [-30, 42, 50], [0, 0, 70]];
  return (
    <g>
      {[0.25, 0.5, 0.72].map((k, i) => {
        const on = clamp((t - i * 1.4) / 3);
        if (on <= 0) return null;
        const px = from.x + (x - from.x) * k;
        const py = from.y + (y + 60 * s - from.y) * k;
        return <circle key={i} cx={px} cy={py + bob * k} r={(6 + i * 5) * s * on} fill="#0B0816" fillOpacity={0.55} stroke={color} strokeWidth={4 * Math.sqrt(s)} />;
      })}
      {pop > 0 ? (
        <g transform={`translate(${x} ${y + bob}) scale(${s * pop})`} style={{ filter: `drop-shadow(0 0 14px ${color})` }}>
          {lobes.map(([cx, cy, r], i) => <circle key={`o${i}`} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10} />)}
          {lobes.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill="#0E0B1C" fillOpacity={0.92} />)}
          <g>{children}</g>
        </g>
      ) : null}
    </g>
  );
};

/** Sound rings: arcs opening out on both sides of a head, the sign that Pip is listening. */
export const SoundRings: React.FC<{ x: number; y: number; t: number; r0?: number; color?: string }> = ({ x, y, t, r0 = 90, color = CYAN }) => {
  if (t < 0) return null;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const p = ((t + i * 7) % 21) / 21;
        const r = r0 * (1 + p * 1.2);
        const o = (1 - p) * clamp(t / 4);
        return (
          <g key={i} opacity={o}>
            <path d={`M ${x - r * 0.7} ${y - r * 0.7} A ${r} ${r} 0 0 0 ${x - r * 0.7} ${y + r * 0.7}`} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d={`M ${x + r * 0.7} ${y - r * 0.7} A ${r} ${r} 0 0 1 ${x + r * 0.7} ${y + r * 0.7}`} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** Little line icons for inside the bubbles (centred on 0, 0, about 120 across). */
const IconCookie: React.FC = () => <CookieTop x={0} y={4} r={58} rot={20} />;
const IconHead: React.FC<{ kind: 'mom' | 'sis' | 'pip' | 'none'; color?: string }> = ({ kind, color = '#F6EFE3' }) => (
  <g stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M -50 66 Q -50 18 0 18 Q 50 18 50 66" />
    <circle cx={0} cy={-18} r={30} />
    {kind === 'mom' ? <path d="M -34 -6 Q -40 -58 0 -54 Q 40 -58 34 -6" /> : null}
    {kind === 'sis' ? <g><circle cx={-40} cy={-30} r={11} /><circle cx={40} cy={-30} r={11} /></g> : null}
    {kind === 'pip' ? <path d="M -40 2 Q -44 -62 0 -60 Q 44 -62 40 2" /> : null}
  </g>
);
const IconEyes: React.FC<{ t: number; color?: string }> = ({ t, color = '#FFE27A' }) => {
  const open = clamp((t - 6) / 5) * (Math.floor(t / 40) % 3 === 2 && t % 40 < 3 ? 0.1 : 1);
  return (
    <g>
      <path d="M -60 70 Q -64 -10 -30 -36 Q 0 -54 30 -36 Q 64 -10 60 70 Z" fill="#05040A" />
      {[-20, 20].map((dx) => (
        <ellipse key={dx} cx={dx} cy={-6} rx={11} ry={8 * open} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      ))}
    </g>
  );
};

/** Pip's mind-counter: a pill readout, the number flips with a pop at each count; red when it's wrong. */
const Counter: React.FC<{ x: number; y: number; n: number; since: number; red?: boolean; s?: number }> = ({ x, y, n, since, red = false, s = 1 }) => {
  const pop = 1 + 0.25 * Math.max(0, 1 - since / 6);
  const col = red ? RED : '#FFB15A';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-200} y={-58} width={400} height={116} rx={58} fill="#0B0816" opacity={0.72} stroke={red ? RED : 'none'} strokeWidth={4} />
      <text x={-150} y={14} fontFamily={FONT.ui} fontSize={38} fill="#F6EFE3" letterSpacing={4}>
        PIKIRAN
      </text>
      <g transform={`translate(132 20) scale(${pop})`}>
        <text textAnchor="middle" fontFamily={FONT.ui} fontSize={78} fill={col} style={{ filter: `drop-shadow(0 0 12px ${col})` }}>
          {n}
        </text>
      </g>
    </g>
  );
};

/** A close-up of a character's head, the rig scaled up, with the arms left down (traps: a hand can't reach the head). */
const headPose = (x: number, y: number, sc: number, extra: Partial<Pose>): Pose => ({
  ...basePose, x, y: y - HEAD.y * sc, scale: sc, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...extra,
});

// ---------------------------------------------------------------- S1: the title, wide on the roof at dusk; thoughts rise from the city
const ROOF_FEET = 840;
const CITY_THOUGHTS = Array.from({ length: 16 }).map((_, i) => ({ x: 80 + rnd(3, i) * 1760, y: 560 + rnd(4, i) * 220, at: rnd(5, i) * 50, s: 0.16 + rnd(6, i) * 0.14 }));
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: ROOF_FEET - LEG_LEN * 0.62, scale: 0.62, yaw: -0.1, look: -0.3, headTilt: -6, armL: { a: 14, b: 4 }, armR: { a: 14, b: 4 } } },
    { f: 30, p: { look: 0.4, headTilt: -10 } },
    { f: 60, p: { look: -0.2, headTilt: -4 } },
  ]);
  return (
    <g transform={camT(960, kf(t, [[0, 520], [len, 545]]), kf(t, [[0, 1.0], [len, 1.07]]))}>
      <Rooftop t={t} sunX={1180} sunY={700 - 20 * easeOut(clamp(t / 60))} cityLit={1.8} />
      {CITY_THOUGHTS.map((c, i) => (
        <g key={i} opacity={0.85}>
          <ThoughtBubble x={c.x} y={c.y - 40 - (t - c.at) * 1.2} t={t - c.at} from={{ x: c.x, y: c.y + 40 }} s={c.s} />
        </g>
      ))}
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral']]) }} rimId="rimR" shadow={0.6} />
      <TitleCard t={t} lines={['BAYANGKAN JIKA KAMU', 'BISA MENDENGAR PIKIRAN?']} accent="PIKIRAN" accentT={40} size={92} y={170} />
    </g>
  );
};

// ---------------------------------------------------------------- S2: medium, the kitchen: Mum hides the cookie plate; her thought gives it away
const S2_STAND = stand(KITCHEN, 0.5, 0.4);
const S2_PLATE = islandTop(0.64, 0.45);
const s2Pose = (t: number) =>
  poseAt(t, [
    { f: 0, p: { x: S2_STAND.x, y: S2_STAND.y, scale: S2_STAND.scale, yaw: -0.35, look: -0.9, armL: { a: 12, b: -6 }, armR: { a: 52, b: 24 } } },
    { f: 6, p: { look: 0.6 } },
    { f: 14, p: { armR: { a: 20, b: 10 }, look: -0.6, tilt: -3 }, ease: easeOut },
    { f: 20, p: { armR: { a: 14, b: 4 }, tilt: 0 } },
  ]);
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose = s2Pose(t);
  const hand = toWorld(pose, joints(pose).armR.end);
  const lifted = t >= 8;
  const plate = lifted ? { x: hand.x + 10, y: hand.y + 6 } : { x: kf(t, [[0, S2_PLATE.x], [8, hand.x + 10]]), y: S2_PLATE.y };
  const head = toWorld(pose, { x: 0, y: HEAD.y });
  const face = faceAt(t, [[0, 'smug']]);
  const plateEl = (
    <g>
      <Plate x={plate.x} y={plate.y} s={0.7} />
      <Cookie x={plate.x - 18} y={plate.y - 8} s={0.7} />
      <Cookie x={plate.x + 16} y={plate.y - 10} s={0.7} seed={3} />
    </g>
  );
  return (
    <g transform={camT(kf(t, [[0, 1000], [len, 990]]), 560, kf(t, [[0, 1.85], [len, 1.95]]))}>
      <Kitchen t={t + 40} id="k2" />
      <Hero look={MOM} pose={{ ...pose, ...face }} rimId="rimR" shadow={0} />
      {lifted ? plateEl : null}
      <KitchenIsland />
      {lifted ? null : plateEl}
      <ThoughtBubble x={head.x + 150} y={head.y - 150} t={t - 18} from={{ x: head.x + 30, y: head.y - 50 }} s={0.62}>
        <IconCookie />
      </ThoughtBubble>
      <Foreground blur={10}>
        <path d="M 1260 1000 Q 1300 760 1420 700 Q 1380 820 1400 1000 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// ---------------------------------------------------------------- S3: close-up: Pip hears it. The glint, the rings, the smirk
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 4.4 * (1 + 0.05 * clamp(t / len));
  const head = { x: 900, y: 600 };
  const pose = headPose(head.x, head.y, sc, { yaw: 0.35, look: 0.7, headTilt: kf(t, [[0, 0], [8, 6]]), ...faceAt(t, [[0, 'neutral'], [12, 'smug']]) });
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-500 -420) scale(1.9)">
          <Kitchen t={t + 90} id="k3" />
          <Hero look={MOM} pose={{ ...s2Pose(24), x: 1200 }} rimId="rimR" shadow={0} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.24} />
      <SoundRings x={head.x} y={head.y} t={t - 1} r0={300} />
      <Hero look={PIP} pose={{ ...pose, glint: clamp((t - 2) / 4) }} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------------------------------------------------------------- S4: top-down insert: his mitten lands on the hidden plate
const Mitten: React.FC<{ x: number; y: number; rot: number; s?: number; from: { x: number; y: number } }> = ({ x, y, rot, s = 4.8, from }) => (
  <g filter="url(#rimR)">
    <path d={`M ${x} ${y} L ${from.x} ${from.y}`} stroke={PIP.line} strokeWidth={26 * s} strokeLinecap="round" />
    <path d={`M ${x} ${y} L ${from.x} ${from.y}`} stroke={PIP.limb} strokeWidth={22.5 * s} strokeLinecap="round" />
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -13 -4 Q -16 16 -7 20 L 8 20 Q 16 16 13 -4 Z" fill={PIP.hand} stroke={PIP.line} strokeWidth={2.4} strokeLinejoin="round" />
      <ellipse cx={-12} cy={6} rx={5} ry={8} fill={PIP.hand} stroke={PIP.line} strokeWidth={2.2} />
    </g>
  </g>
);
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const hx = kf(t, [[0, 1500], [3, 1500], [13, 1080], [16, 1060], [len, 1120]]);
  const hy = kf(t, [[0, 1250], [3, 1250], [13, 640], [16, 600], [len, 660]]);
  const grabbed = t >= 16;
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.0], [len, 1.06]]))}>
      <Tabletop edge={1300} kind="stone" wood="#A89C8A" grain="#968A78" lip="#8E8474" floor="#2C2A30" floorLines="#232127" />
      <Glow x={960} y={420} r={700} o={0.3} />
      {/* a tea towel, a jar, the plate tucked at the back corner where Mum hid it */}
      <rect x={160} y={120} width={420} height={230} fill="#7A4A52" transform="rotate(-10 370 235)" />
      {[0, 1, 2].map((i) => <rect key={i} x={160} y={150 + i * 66} width={420} height={12} fill="#E9C46A" opacity={0.7} transform="rotate(-10 370 235)" />)}
      <circle cx={1560} cy={260} r={110} fill="#000" opacity={0.3} />
      <circle cx={1550} cy={250} r={100} fill="#B98A5A" />
      <circle cx={1550} cy={250} r={80} fill="#8A5A3A" />
      <PlateTop x={900} y={520} r={250} />
      <CookieTop x={790} y={470} r={92} rot={20} />
      <CookieTop x={960} y={600} r={92} rot={80} />
      {grabbed ? null : <CookieTop x={1040} y={450} r={92} rot={140} />}
      {grabbed ? <CookieTop x={hx - 30} y={hy - 70} r={92} rot={140} /> : null}
      <Mitten x={hx} y={hy} rot={-40} from={{ x: hx + 700, y: hy + 900 }} />
      <Sparkle x={1180} y={360} t={t - 18} s={1.6} />
    </g>
  );
};

// ---------------------------------------------------------------- S5: over the shoulder in class: Mo knows the answer, and thinks it
const MO_X = 760;
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const mo = poseAt(t, [
    { f: 0, p: { x: MO_X, y: 760, yaw: 0.3, look: -0.4, headTilt: -4, armL: { a: 10, b: -8 }, armR: { a: 10, b: -8 } } },
    { f: 12, p: { headTilt: 4, look: 0.2 } },
  ]);
  const head = toWorld(mo, { x: 0, y: HEAD.y });
  return (
    <g transform={camT(kf(t, [[0, 820], [len, 840]]), 520, kf(t, [[0, 1.55], [len, 1.62]]))}>
      <Classroom t={t + 240} id="cls5" />
      <Hero look={MO} pose={{ ...mo, ...faceAt(t, [[0, 'neutral'], [10, 'smug']]) }} rimId="rimL" shadow={0} />
      <SchoolDesk x={MO_X} />
      <ThoughtBubble x={head.x + 190} y={head.y - 140} t={t - 6} from={{ x: head.x + 40, y: head.y - 40 }} s={0.75}>
        <text y={30} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={96} fill="#F6EFE3">56</text>
      </ThoughtBubble>
      <Foreground blur={16}>
        <Kid x={1380} y={1100} s={3.1} look={{ hair: 'short', hairC: '#120E18', top: '#1E1A28' }} />
      </Foreground>
    </g>
  );
};

// ---------------------------------------------------------------- S6: medium: Pip at his desk hears it and writes
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const scrib = t > 10 ? Math.sin(t * 1.6) * 6 : 0;
  const pose = poseAt(t, [
    { f: 0, p: { x: 1260, y: 760, yaw: -0.3, look: -0.8, headTilt: 0, armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 } } },
    { f: 6, p: { look: 0.6, headTilt: -6 } },
    { f: 10, p: { armL: { a: 40, b: 70 }, look: -0.2, headTilt: 10 }, ease: easeOut },
  ]);
  const head = toWorld(pose, { x: 0, y: HEAD.y });
  return (
    <g transform={camT(kf(t, [[0, 1220], [len, 1240]]), 560, kf(t, [[0, 2.1], [len, 2.2]]))}>
      <Classroom t={t + 290} id="cls6" />
      <Hero look={PIP} pose={{ ...pose, armL: { a: pose.armL.a + scrib, b: pose.armL.b }, ...faceAt(t, [[0, 'neutral'], [9, 'smug']]), glint: clamp((t - 1) / 4) }} rimId="rimL" shadow={0} />
      <SchoolDesk x={1260} />
      <SoundRings x={head.x} y={head.y} t={t - 1} r0={70} />
    </g>
  );
};

// ---------------------------------------------------------------- S7: top-down insert: the test, a red 100 stamps on
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const stamp = t >= 8 ? backOut(clamp((t - 8) / 6)) : 0;
  return (
    <g transform={`translate(960 540) rotate(${-3 + t * 0.06}) scale(${1 + t * 0.003}) translate(-960 -540)`}>
      <Tabletop edge={1400} />
      <Glow x={1000} y={420} r={720} o={0.3} />
      <rect x={1380} y={820} width={320} height={16} rx={8} fill="#E9C46A" transform="rotate(-24 1540 828)" />
      <rect x={180} y={180} width={300} height={300} fill="#9BD3A8" transform="rotate(10 330 330)" />
      <Paper x={960} y={560} w={400} rot={-4} done grade="" fill={1} />
      {stamp > 0 ? (
        <g transform={`translate(1090 330) rotate(-14) scale(${1.5 * stamp})`}>
          <circle r={64} fill="none" stroke="#D9534F" strokeWidth={8} />
          <text y={22} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={62} fill="#D9534F">100</text>
        </g>
      ) : null}
      <Sparkle x={1230} y={240} t={t - 11} s={1.4} />
    </g>
  );
};

// ---------------------------------------------------------------- S8: medium, the study at night: the cat stares past Pip, at something behind him
const s8Pip = (t: number) =>
  poseAt(t, [
    { f: 0, p: { x: 1130, y: 712, yaw: -0.4, look: -0.8, headTilt: 6, armL: { a: 40, b: 60 }, armR: { a: 30, b: 50 } } },
    { f: 40, p: { headTilt: 2 } },
  ]);
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const cat = { x: 960, y: 700 };
  return (
    <g transform={camT(kf(t, [[0, 980], [len, 1000]]), 560, kf(t, [[0, 1.7], [len, 1.82]]))}>
      <Study t={t + 120} id="st8" night veil={0.5} />
      <Hero look={PIP} pose={{ ...s8Pip(t), ...faceAt(t, [[0, 'tired']]) }} rimId="rimBlueL" shadow={0} />
      <Desk x0={560} x1={1360} y={700} />
      {/* the cat on the desk, mirrored to face right: past Pip, at the door behind him */}
      <Glow x={cat.x} y={cat.y - 40} r={170} kind="cool" o={0.5} />
      <g transform={`translate(${cat.x} ${cat.y}) scale(-0.95 0.95) translate(${-cat.x} ${-cat.y})`} filter="url(#rimBlue)">
        <Cat x={cat.x} y={cat.y} mood={t > 4 ? 'alert' : 'sleep'} f={t} />
      </g>
      <ThoughtBubble x={cat.x - 40} y={cat.y - 270} t={t - 10} from={{ x: cat.x + 40, y: cat.y - 70 }} s={0.62}>
        <IconEyes t={t - 14} />
      </ThoughtBubble>
      <Foreground blur={10}>
        <path d="M 1500 1000 Q 1380 800 1430 600 Q 1470 800 1580 980 Z" fill="#0A0C14" />
      </Foreground>
    </g>
  );
};

// ---------------------------------------------------------------- S9: close-up: Pip turns to look behind him; the dark doorway soft at the right
export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 4.2 * (1 + 0.05 * clamp(t / len));
  const turn = easeOut(clamp((t - 4) / 8));
  const pose = headPose(760, 620, sc, { yaw: -0.35 + 0.95 * turn, look: -0.6 + 1.6 * turn, headTilt: -4 * turn, ...faceAt(t, [[0, 'tired'], [6, 'worried']]) });
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-1100 -560) scale(2)">
          <Study t={t + 180} id="st9" night veil={0.6} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#05030A" opacity={0.35} />
      {/* the doorway behind him, darker than the room, a sliver of nothing in it */}
      <g filter="url(#blur6)">
        <rect x={1380} y={180} width={300} height={900} fill="#030208" opacity={0.85} />
        <ellipse cx={1530} cy={420} rx={60} ry={70} fill="#000" opacity={0.6 * turn} />
      </g>
      <Hero look={PIP} pose={pose} rimId="rimBlueL" shadow={0} />
    </g>
  );
};

// ---------------------------------------------------------------- S10: schematic: one head, thoughts streaming out, the count to 6,200 a day
const HEAD_D = 'M 520 820 L 520 700 Q 400 690 410 600 L 380 560 L 410 540 Q 380 360 540 300 Q 700 250 790 380 Q 850 480 790 590 L 790 820';
const SchHead: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <DrawOn d={HEAD_D} t={t} dur={12} width={7} />
    {Array.from({ length: 14 }).map((_, i) => {
      const at = 10 + i * 5;
      const p = clamp((t - at) / 30);
      if (p <= 0 || p >= 1) return null;
      const x = 620 + (rnd(9, i) - 0.3) * 260 * p + 120 * p;
      const y = 380 - 330 * p;
      return <circle key={i} cx={x} cy={y} r={14 + 16 * p} fill="none" stroke={SCH.live} strokeWidth={4} opacity={1 - p} />;
    })}
  </g>
);
export const S10: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.05]])}) translate(-960 -540)`}>
    <Schematic t={t} id="sch10" />
    <SchHead t={t} />
    <SchLabel x={600} y={920} t={t - 6} text="1 MANUSIA" size={44} />
    <CountUp x={1360} y={560} t={t - 14} to={6200} dur={56} size={190} />
    <SchLabel x={1360} y={680} t={t - 20} text="PIKIRAN SEHARI" size={50} color={SCH.dim} />
  </g>
);

// ---------------------------------------------------------------- S11: schematic, closer: the number holds, the source pops on
export const S11: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={`translate(1360 540) scale(${kf(t, [[0, 1.12], [len, 1.22]])}) translate(-1360 -540)`}>
    <Schematic t={t + 90} id="sch11" />
    <SchHead t={t + 90} />
    <CountUp x={1360} y={560} t={200} to={6200} dur={56} size={190} />
    <SchLabel x={1360} y={680} t={60} text="PIKIRAN SEHARI" size={50} color={SCH.dim} />
    <SchLabel x={1360} y={780} t={t - 4} text="TSENG & POPPENK, 2020" size={34} color={SCH.line} />
    <SchLabel x={1360} y={830} t={t - 7} text="NATURE COMMUNICATIONS" size={28} color={SCH.dim} />
  </g>
);

// ---------------------------------------------------------------- the bedroom at night: Pip sitting up in bed
const SIT = bedSit(0.22);
const DOOR = BEDROOM.P(0, 0.6, 0.64);
const GAP = BEDROOM.P(0, 0.42, 0.5375); // the middle of the door crack, where the hall shows
const CRACK = BEDROOM.Q([[0, 0.23, 0.52], [0, 0.23, 0.555], [0, 1, 0.555], [0, 1, 0.52]]);
const bedPip = (extra: Partial<Pose>): Pose => ({ ...basePose, x: SIT.x, y: SIT.y, scale: SIT.scale, yaw: -0.25, armL: { a: 30, b: 40 }, armR: { a: 30, b: 40 }, ...extra });
/** Darkens the door crack's hall light (0 lit .. 1 out). */
const CrackOut: React.FC<{ v: number }> = ({ v }) => (v > 0 ? <polygon points={CRACK} fill="#06050C" opacity={v} /> : null);

// S12: wide: the bedroom; Pip sits up, the lamp on, the hall light in the door crack. His eyes light up.
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: bedPip({ look: 0.3 }) },
    { f: 20, p: { look: -0.4, headTilt: -4 } },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 940], [len, 900]]), kf(t, [[0, 560], [len, 570]]), kf(t, [[0, 1.0], [len, 1.12]]))}>
      <Bedroom t={t + 300} id="bd12" duvet={false} veil={0.32} clock="23:47" crossed={0} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [22, 'worried']]), glint: clamp((t - 24) / 6) }} rimId="rimR" shadow={0} />
      <BedDuvet knees={1} />
    </g>
  );
};

// S13: medium on Pip in bed: the count. A bubble pops for each mind (mum through the wall, his sister, himself).
export const S13_COUNTS = [34, 56, 76];
export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const n = S13_COUNTS.filter((c) => t >= c).length;
  const last = S13_COUNTS[Math.max(0, n - 1)];
  const pose = poseAt(t, [
    { f: 0, p: bedPip({ look: -0.2, headTilt: 0 }) },
    { f: 30, p: { look: -0.9, headTilt: -6 } },
    { f: 52, p: { look: 0.9, headTilt: 6 } },
    { f: 74, p: { look: 0, headTilt: 0 } },
  ]);
  const head = toWorld(pose, { x: 0, y: HEAD.y });
  return (
    <g transform={camT(kf(t, [[0, 700], [len, 720]]), kf(t, [[0, 500], [len, 490]]), kf(t, [[0, 1.75], [len, 1.9]]))}>
      <Bedroom t={t + 362} id="bd13" duvet={false} clock="23:48" crossed={0} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral']]), glint: 1 }} rimId="rimR" shadow={0} />
      <BedDuvet knees={1} />
      <SoundRings x={head.x} y={head.y} t={t} r0={50} />
      <ThoughtBubble x={470} y={360} t={t - S13_COUNTS[0] + 4} from={{ x: 430, y: 470 }} s={0.42}>
        <IconHead kind="mom" />
      </ThoughtBubble>
      <ThoughtBubble x={930} y={330} t={t - S13_COUNTS[1] + 4} from={{ x: 990, y: 440 }} s={0.42}>
        <IconHead kind="sis" />
      </ThoughtBubble>
      <ThoughtBubble x={head.x + 110} y={head.y - 120} t={t - S13_COUNTS[2] + 4} from={{ x: head.x + 20, y: head.y - 40 }} s={0.42}>
        <IconHead kind="pip" />
      </ThoughtBubble>
      {n > 0 ? <Counter x={1020} y={250} n={n} since={t - last} s={0.5} /> : null}
    </g>
  );
};

// S14: extreme close-up: "Empat." The counter flips to 4 in red; the rim goes red.
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 6.4 * (1 + 0.05 * clamp(t / len));
  const pose = headPose(860, 720, sc, { yaw: -0.15, look: -0.3, ...faceAt(t, [[0, 'shock']]), glint: 1, glintColor: RED });
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-300 -600) scale(2.1)">
          <Bedroom t={t + 470} id="bd14" duvet={false} clock="23:48" crossed={0} lamp={0.6} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#12030A" opacity={0.35} />
      <Glow x={1500} y={300} r={700} kind="red" o={0.35} />
      <Hero look={PIP} pose={pose} rimId="rimRed" shadow={0} />
      <Counter x={1540} y={170} n={t >= 2 ? 4 : 3} since={t - 2} red={t >= 2} s={0.9} />
    </g>
  );
};

// S15: wide: the lamp flickers; Pip stares at the door; the hall light in the crack goes out.
const flicker = (t: number, from: number) => (t < from ? 1 : rnd(Math.floor(t / 2), 7) > 0.45 ? 0.9 : 0.25);
export const S15: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: bedPip({ yaw: -0.55, look: -1, headTilt: -4, armL: { a: 40, b: 60 }, armR: { a: 40, b: 60 } }) },
    { f: 30, p: { tilt: 4, headTilt: -8 } },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 820], [len, 760]]), kf(t, [[0, 560], [len, 560]]), kf(t, [[0, 1.05], [len, 1.18]]))}>
      <Bedroom t={t + 500} id="bd15" duvet={false} clock="23:48" crossed={0} lamp={flicker(t, 44)} veil={0.38} />
      <CrackOut v={easeIn(clamp((t - 30) / 30))} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried']]) }} rimId="rimR" shadow={0} />
      <BedDuvet knees={1.3} />
    </g>
  );
};

// S16: over the shoulder: the dark crack of the door; a red thought bubble rises out of the hall.
export const S16: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(kf(t, [[0, DOOR.x + 80], [len, DOOR.x + 60]]), kf(t, [[0, DOOR.y - 40], [len, DOOR.y - 50]]), kf(t, [[0, 2.1], [len, 2.35]]))}>
    <Bedroom t={t + 560} id="bd16" duvet={false} clock="23:49" crossed={0} lamp={0.5} veil={0.55} />
    <CrackOut v={1} />
    <rect x={0} y={0} width={1920} height={1080} fill="#05030A" opacity={0.25} />
    <ThoughtBubble x={DOOR.x + 90} y={DOOR.y - 170} t={t - 8} from={{ x: GAP.x, y: GAP.y }} s={0.36} color={RED}>
      <IconHead kind="pip" color="#FFD0D4" />
    </ThoughtBubble>
    {/* Pip's head and shoulder, close and dark, at the right */}
    <Foreground blur={16}>
      <path d={`M ${DOOR.x + 300} 1000 Q ${DOOR.x + 310} ${DOOR.y + 40} ${DOOR.x + 380} ${DOOR.y + 10} Q ${DOOR.x + 520} ${DOOR.y - 20} ${DOOR.x + 560} 1000 Z`} fill="#0C0A14" />
      <circle cx={DOOR.x + 420} cy={DOOR.y - 70} r={92} fill="#100D1A" />
    </Foreground>
  </g>
);

// S17: close-up on the crack: an eye opens in the dark; the lamp dies; black.
export const S17: React.FC<ShotProps> = ({ t, len }) => {
  const open = easeOut(clamp((t - 14) / 10));
  const lamp = t < 46 ? 0.5 + 0.2 * Math.sin(t / 3) : t < 52 ? (t % 2 ? 0.4 : 0) : 0;
  const black = clamp((t - 52) / 10);
  const eye = { x: GAP.x, y: GAP.y };
  return (
    <g>
      <g transform={camT(eye.x + 20, eye.y + 20, kf(t, [[0, 4.0], [len, 4.6]]))}>
        <Bedroom t={t + 620} id="bd17" duvet={false} clock="23:49" crossed={0} lamp={lamp} veil={0.6} />
        <CrackOut v={1} />
        {open > 0 ? (
          <g transform={`translate(${eye.x} ${eye.y})`} style={{ filter: `drop-shadow(0 0 6px ${RED})` }}>
            <ellipse cx={0} cy={0} rx={13} ry={7 * open} fill="#E9E2D2" />
            <circle cx={1 + 2 * open} cy={0} r={4.2 * open} fill={RED} />
            <circle cx={1 + 2 * open} cy={0} r={1.8 * open} fill="#05040A" />
          </g>
        ) : null}
      </g>
      <Glow x={1700} y={900} r={600} o={0.25 * lamp} />
      <rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={black} />
    </g>
  );
};
