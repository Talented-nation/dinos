import React, { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "./audio";
import type { PlanetDef } from "./engine";
import { BoltIcon, BrainIcon, CheckIcon, EyeIcon, StarIcon } from "./icons";

/* ================= shared ================= */

export type PuzzleType = "memory" | "pattern" | "odd" | "pipes";

export const PUZZLE_META: Record<
  PuzzleType,
  { name: string; flavor: string; hint: string; time: number }
> = {
  memory: {
    name: "Crystal Echo",
    flavor: "The crystals sing a secret tune. Sing it back!",
    hint: "Watch the glow, then tap the crystals in the same order.",
    time: 60,
  },
  pattern: {
    name: "Pattern Portal",
    flavor: "The portal only opens for those who see what comes next.",
    hint: "Study the row of symbols — which one belongs in the '?' slot?",
    time: 60,
  },
  odd: {
    name: "Odd Bot Out",
    flavor: "One cheeky bot is pretending. Spot the impostor!",
    hint: "All bots are twins except one. Tap the different bot.",
    time: 75,
  },
  pipes: {
    name: "Power Pipes",
    flavor: "The planet's lights went out! Route the power to the bulb.",
    hint: "Tap pipes to turn them. Connect the battery to the bulb.",
    time: 90,
  },
};

export const PuzzleShell: React.FC<{
  type: PuzzleType;
  planet: PlanetDef;
  children: React.ReactNode;
}> = ({ type, planet, children }) => {
  const meta = PUZZLE_META[type];
  const Icon = type === "memory" ? BrainIcon : type === "pattern" ? StarIcon : type === "odd" ? EyeIcon : BoltIcon;
  return (
    <div className="panel-solid w-[min(94vw,620px)] overflow-hidden animate-rise">
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b-[3px] border-ink"
        style={{ background: `linear-gradient(180deg, ${planet.accent}, ${planet.accent}cc)` }}
      >
        <span className="grid place-items-center w-9 h-9 rounded-xl border-[3px] border-ink bg-[#fff6e3] text-ink shrink-0">
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl leading-none text-ink">{meta.name}</h2>
          <p className="text-[13px] font-bold text-ink/75 truncate">{meta.flavor}</p>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      <div className="px-4 py-2 bg-[#09213a] border-t-[3px] border-ink flex items-center gap-2">
        <span className="text-sun text-sm">✦</span>
        <p className="text-[12.5px] font-bold text-[#9fc3e8]">{meta.hint}</p>
      </div>
    </div>
  );
};

/* ================= 1 · Crystal Echo (memory) ================= */

const CRYSTALS = [
  { c: "#ff6b4a", label: "Ruby" },
  { c: "#3ee6c1", label: "Jade" },
  { c: "#ffd23f", label: "Topaz" },
  { c: "#9be84a", label: "Moss" },
];

const GemSvg: React.FC<{ color: string; lit: boolean; size?: number }> = ({ color, lit, size = 74 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" style={{ filter: lit ? `drop-shadow(0 0 14px ${color}) brightness(1.25)` : "none", transition: "filter .12s" }}>
    <polygon points="30,4 52,22 44,52 16,52 8,22" fill={color} stroke="#061726" strokeWidth="3.5" strokeLinejoin="round" />
    <polygon points="30,4 52,22 30,26 8,22" fill="#ffffff" opacity="0.35" />
    <polygon points="30,26 44,52 16,52" fill="#061726" opacity="0.14" />
    <polygon points="20,14 26,10 24,18" fill="#fff6e3" opacity="0.85" />
  </svg>
);

export const MemoryPuzzle: React.FC<{ d: number; onSolve: () => void; paused: boolean }> = ({ d, onSolve, paused }) => {
  const seqLen = Math.min(6, 3 + Math.floor(d / 2));
  const seq = useMemo(() => Array.from({ length: seqLen }, () => Math.floor(Math.random() * 4)), [seqLen]);
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<"watch" | "input" | "done">("watch");
  const [input, setInput] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [replay, setReplay] = useState(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    let cancelled = false;
    setPhase("watch");
    setInput(0);
    const onTime = Math.max(330, 540 - d * 35);
    const timers: number[] = [];
    const start = 700;
    seq.forEach((c, i) => {
      timers.push(window.setTimeout(() => { if (!cancelled) { setLit(c); sfx.crystal(c); } }, start + i * (onTime + 160)));
      timers.push(window.setTimeout(() => { if (!cancelled) setLit(-1); }, start + i * (onTime + 160) + onTime));
    });
    timers.push(
      window.setTimeout(() => { if (!cancelled && alive.current) setPhase("input"); }, start + seq.length * (onTime + 160) + 120)
    );
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [seq, replay, d]);

  const tap = (i: number) => {
    if (phase !== "input" || paused) return;
    if (i === seq[input]) {
      sfx.crystal(i);
      setLit(i);
      window.setTimeout(() => setLit(-1), 200);
      const next = input + 1;
      setInput(next);
      if (next >= seq.length) {
        setPhase("done");
        onSolve();
      }
    } else {
      sfx.crystalBad();
      setAttempts((a) => a + 1);
      setLit(i);
      window.setTimeout(() => setLit(-1), 350);
      window.setTimeout(() => { if (alive.current) setReplay((r) => r + 1); }, 900);
    }
  };

  const pos = [
    "top-0 left-1/2 -translate-x-1/2",
    "right-0 top-1/2 -translate-y-1/2",
    "bottom-0 left-1/2 -translate-x-1/2",
    "left-0 top-1/2 -translate-y-1/2",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[264px] h-[264px] sm:w-[290px] sm:h-[290px]">
        {CRYSTALS.map((cr, i) => (
          <button
            key={i}
            aria-label={cr.label}
            onClick={() => tap(i)}
            disabled={phase !== "input"}
            className={`absolute ${pos[i]} tile-btn bg-[#0d2b47] p-2.5 ${phase === "input" ? "" : "cursor-default"} ${lit === i ? "scale-110" : ""}`}
            style={{ borderColor: lit === i ? cr.c : "#061726", transition: "transform .1s" }}
          >
            <GemSvg color={cr.c} lit={lit === i} />
          </button>
        ))}
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="w-[104px] h-[104px] rounded-full border-[3px] border-ink bg-[#09213a] grid place-items-center shadow-[inset_0_4px_10px_#00000088]">
            {phase === "watch" ? (
              <span className="text-sky animate-blink-soft"><EyeIcon size={40} /></span>
            ) : phase === "done" ? (
              <span className="text-lime"><CheckIcon size={40} /></span>
            ) : (
              <span className="text-sun"><BoltIcon size={38} /></span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {seq.map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full border-2 border-ink transition-colors"
            style={{ background: i < input ? "#9be84a" : "#123a5c" }}
          />
        ))}
      </div>
      <p className="text-sm font-extrabold text-[#9fc3e8] h-5">
        {phase === "watch" ? "Watch carefully…" : phase === "done" ? "Perfect echo!" : attempts > 0 ? "Oops! Listen again…" : "Your turn — repeat the tune!"}
      </p>
    </div>
  );
};

/* ================= 2 · Pattern Portal ================= */

type Shape = "star" | "moon" | "bolt" | "drop" | "heart" | "ring";
interface Glyph { shape: Shape; color: string; size: number }

const GLYPH_PATHS: Record<Shape, React.ReactNode> = {
  star: <path d="M20 3l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L20 26.6l-9.3 4.9 1.8-10.3L5 13.9l10.4-1.5z" />,
  moon: <path d="M27 23.5A12.5 12.5 0 1116.5 3 10 10 0 0027 23.5z" />,
  bolt: <path d="M22 2L7 22h9l-2 14 15-20h-9z" />,
  drop: <path d="M20 3s11 13 11 21a11 11 0 01-22 0C9 16 20 3 20 3z" />,
  heart: <path d="M20 35C10 27.5 4 21.5 4 14.7 4 9.4 8 5.5 12.7 5.5c2.9 0 5.6 1.5 7.3 4 1.7-2.5 4.4-4 7.3-4C32 5.5 36 9.4 36 14.7c0 6.8-6 12.8-16 20.3z" />,
  ring: <circle cx="20" cy="20" r="10" fill="none" strokeWidth="8" stroke="currentColor" />,
};

const GlyphSvg: React.FC<{ g: Glyph; px?: number }> = ({ g, px = 40 }) => (
  <svg width={px * g.size} height={px * g.size} viewBox="0 0 40 40" style={{ overflow: "visible" }}>
    <g fill={g.color} stroke="#061726" strokeWidth="2.6" strokeLinejoin="round" style={{ color: g.color }}>
      {GLYPH_PATHS[g.shape]}
    </g>
  </svg>
);

const SHAPES: Shape[] = ["star", "moon", "bolt", "drop", "heart", "ring"];
const COLORS = ["#ffd23f", "#ff6b4a", "#3ee6c1", "#9be84a", "#ff7ab8", "#5bc9ff"];

function genPattern(d: number) {
  const sizeWave = d >= 3 && Math.random() < 0.45;
  const motifLen = sizeWave ? 1 : d < 2 ? 2 : 2 + Math.floor(Math.random() * 2);
  const pool = [...SHAPES].sort(() => Math.random() - 0.5);
  const cp = [...COLORS].sort(() => Math.random() - 0.5);
  const motif: Glyph[] = Array.from({ length: motifLen }, (_, i) => ({
    shape: pool[i % pool.length],
    color: cp[i % cp.length],
    size: 1,
  }));
  const seq: Glyph[] = Array.from({ length: 7 }, (_, i) => {
    const g = motif[i % motifLen];
    return { ...g, size: sizeWave ? (i % 2 === 0 ? 0.72 : 1.18) : g.size };
  });
  const answer = seq[6];
  const key = (g: Glyph) => `${g.shape}|${g.color}|${g.size.toFixed(2)}`;
  const cands: Glyph[] = [];
  for (const s of SHAPES) for (const c of COLORS) for (const sz of sizeWave ? [0.72, 1.18] : [1]) {
    const g = { shape: s, color: c, size: sz };
    if (key(g) !== key(answer)) cands.push(g);
  }
  cands.sort(() => Math.random() - 0.5);
  const distractors = cands.slice(0, 3);
  const options = [...distractors, answer].sort(() => Math.random() - 0.5);
  return { seq, answer, options };
}

export const PatternPuzzle: React.FC<{ d: number; onSolve: () => void; onPenalty: (s: number) => void; paused: boolean }> = ({ d, onSolve, onPenalty, paused }) => {
  const [{ seq, answer, options }] = useState(() => genPattern(d));
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const key = (g: Glyph) => `${g.shape}|${g.color}|${g.size.toFixed(2)}`;

  const pick = (g: Glyph) => {
    if (paused) return;
    if (key(g) === key(answer)) {
      sfx.collect();
      onSolve();
    } else {
      sfx.wrong();
      setWrongPick(key(g));
      onPenalty(5);
      window.setTimeout(() => setWrongPick(null), 450);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
        {seq.slice(0, 6).map((g, i) => (
          <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 grid place-items-center rounded-xl border-[3px] border-ink bg-[#09213a] animate-pop-in" style={{ animationDelay: `${i * 70}ms` }}>
            <GlyphSvg g={g} px={30} />
          </div>
        ))}
        <div className="w-12 h-12 sm:w-14 sm:h-14 grid place-items-center rounded-xl border-[3px] border-dashed border-sun bg-[#3a2f08] animate-glow-pulse text-sun font-display text-2xl">
          ?
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        {options.map((g, i) => (
          <button
            key={i}
            onClick={() => pick(g)}
            className={`tile-btn bg-[#123a5c] w-16 h-16 sm:w-20 sm:h-20 grid place-items-center ${wrongPick === key(g) ? "animate-shake-x opacity-50" : ""}`}
            aria-label={`option ${i + 1}`}
          >
            <GlyphSvg g={g} px={38} />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ================= 3 · Odd Bot Out ================= */

interface BotCfg { body: string; antenna: string; mouth: "smile" | "o" | "flat"; wink: boolean; flip: boolean }

const BotSvg: React.FC<{ cfg: BotCfg; px: number }> = ({ cfg, px }) => (
  <svg width={px} height={px} viewBox="0 0 60 60" style={{ transform: cfg.flip ? "rotate(180deg)" : undefined }}>
    <line x1="30" y1="14" x2="30" y2="6" stroke="#061726" strokeWidth="3" />
    <circle cx="30" cy="5.5" r="4" fill={cfg.antenna} stroke="#061726" strokeWidth="2.5" />
    <rect x="10" y="14" width="40" height="34" rx="10" fill={cfg.body} stroke="#061726" strokeWidth="3" />
    <circle cx="21" cy="27" r="5.5" fill="#fff" stroke="#061726" strokeWidth="2.5" />
    <circle cx="39" cy="27" r="5.5" fill="#fff" stroke="#061726" strokeWidth="2.5" />
    {cfg.wink ? (
      <path d="M35 27h8" stroke="#061726" strokeWidth="2.5" strokeLinecap="round" />
    ) : (
      <circle cx="39" cy="28" r="2.4" fill="#061726" />
    )}
    <circle cx="21" cy="28" r="2.4" fill="#061726" />
    {cfg.mouth === "smile" && <path d="M22 37q8 6 16 0" stroke="#061726" strokeWidth="2.8" fill="none" strokeLinecap="round" />}
    {cfg.mouth === "o" && <circle cx="30" cy="39" r="3.4" fill="#061726" />}
    {cfg.mouth === "flat" && <path d="M23 39h14" stroke="#061726" strokeWidth="2.8" strokeLinecap="round" />}
    <rect x="18" y="48" width="8" height="5" rx="2" fill="#061726" />
    <rect x="34" y="48" width="8" height="5" rx="2" fill="#061726" />
  </svg>
);

const BOT_COLORS = ["#5bc9ff", "#ff6b4a", "#3ee6c1", "#ffd23f", "#ff7ab8", "#9be84a"];

function genOdd(d: number) {
  const n = [3, 3, 4, 4, 5, 5][Math.min(5, d)];
  const body = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
  const antenna = BOT_COLORS.filter((c) => c !== body)[Math.floor(Math.random() * 5)];
  const base: BotCfg = { body, antenna, mouth: "smile", wink: false, flip: false };
  const easy = d < 2;
  const mid = d < 4;
  let mut: BotCfg;
  if (easy) {
    const other = BOT_COLORS.filter((c) => c !== body).sort(() => Math.random() - 0.5)[0];
    mut = { ...base, body: other };
  } else if (mid) {
    mut = Math.random() < 0.5 ? { ...base, flip: true } : { ...base, antenna: BOT_COLORS.filter((c) => c !== antenna)[0] };
  } else {
    const r = Math.random();
    mut = r < 0.34 ? { ...base, mouth: "o" } : r < 0.67 ? { ...base, wink: true } : { ...base, mouth: "flat" };
  }
  const oddIdx = Math.floor(Math.random() * (n * n));
  return { n, base, mut, oddIdx };
}

export const OddPuzzle: React.FC<{ d: number; onSolve: () => void; onPenalty: (s: number) => void; paused: boolean }> = ({ d, onSolve, onPenalty, paused }) => {
  const [{ n, base, mut, oddIdx }] = useState(() => genOdd(d));
  const [tried, setTried] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState(-1);
  const cell = n <= 3 ? 74 : n === 4 ? 66 : 56;

  const tap = (i: number) => {
    if (paused || tried.has(i)) return;
    if (i === oddIdx) {
      sfx.collect();
      onSolve();
    } else {
      sfx.wrong();
      setTried((s) => new Set(s).add(i));
      setShaking(i);
      onPenalty(4);
      window.setTimeout(() => setShaking(-1), 450);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}>
        {Array.from({ length: n * n }, (_, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={`tile-btn bg-[#0d2b47] grid place-items-center ${tried.has(i) ? "opacity-35 saturate-0" : ""} ${shaking === i ? "animate-shake-x" : ""}`}
            style={{ width: cell, height: cell }}
            aria-label={`bot ${i + 1}`}
          >
            <BotSvg cfg={i === oddIdx ? mut : base} px={cell - 18} />
          </button>
        ))}
      </div>
      {tried.size > 0 && <p className="text-sm font-extrabold text-coral">Not that one! Look closer… (−4s)</p>}
    </div>
  );
};

/* ================= 4 · Power Pipes ================= */

type Dir = 0 | 1 | 2 | 3; // N E S W
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

interface PipeCell { kind: "straight" | "corner" | "source" | "bulb"; rot: number; dir?: Dir }

function openingsOf(c: PipeCell): Dir[] {
  if (c.kind === "source" || c.kind === "bulb") return [c.dir!];
  if (c.kind === "straight") return c.rot % 2 === 0 ? [0, 2] : [1, 3];
  return [((0 + c.rot) % 4) as Dir, ((1 + c.rot) % 4) as Dir];
}

function genPipes(R: number, C: number): PipeCell[][] | null {
  const sy = Math.floor(R / 2);
  const ty = Math.floor(Math.random() * R);
  const path: [number, number][] = [[sy, 0]];
  const visited = new Set<string>([`${sy},0`]);
  let r = sy, c = 0, guard = 0;
  while (!(r === ty && c === C - 1) && guard++ < 600) {
    const opts: [number, number][] = [];
    if (c < C - 1) opts.push([r, c + 1], [r, c + 1], [r, c + 1]);
    if (c === C - 1) {
      if (r < ty) opts.push([r + 1, c]);
      else if (r > ty) opts.push([r - 1, c]);
    } else {
      if (r > 0) opts.push([r - 1, c]);
      if (r < R - 1) opts.push([r + 1, c]);
    }
    const free = opts.filter(([rr, cc]) => !visited.has(`${rr},${cc}`));
    if (!free.length) return null;
    [r, c] = free[Math.floor(Math.random() * free.length)];
    path.push([r, c]);
    visited.add(`${r},${c}`);
  }
  if (!(r === ty && c === C - 1)) return null;

  const grid: PipeCell[][] = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => ({
      kind: (Math.random() < 0.5 ? "straight" : "corner") as "straight" | "corner",
      rot: Math.floor(Math.random() * 4),
    }))
  );
  const pairRot = (a: Dir, b: Dir): PipeCell => {
    if ((a + 2) % 4 === b) return { kind: "straight", rot: a % 2 === 0 ? 0 : 1 };
    for (let rot = 0; rot < 4; rot++) {
      const o = [rot % 4, (1 + rot) % 4];
      if (o.includes(a) && o.includes(b)) return { kind: "corner", rot };
    }
    return { kind: "corner", rot: 0 };
  };
  path.forEach(([pr, pc], i) => {
    if (i === 0) {
      const [nr, nc] = path[1];
      const dir = DR.findIndex((_, k) => nr === pr + DR[k] && nc === pc + DC[k]) as Dir;
      grid[pr][pc] = { kind: "source", rot: 0, dir };
    } else if (i === path.length - 1) {
      const [prv, pcv] = path[i - 1];
      const dir = DR.findIndex((_, k) => prv === pr + DR[k] && pcv === pc + DC[k]) as Dir;
      grid[pr][pc] = { kind: "bulb", rot: 0, dir };
    } else {
      const [ar, ac] = path[i - 1];
      const [br, bc] = path[i + 1];
      const dA = DR.findIndex((_, k) => ar === pr + DR[k] && ac === pc + DC[k]) as Dir;
      const dB = DR.findIndex((_, k) => br === pr + DR[k] && bc === pc + DC[k]) as Dir;
      const cell = pairRot(dA, dB);
      cell.rot = (cell.rot + 1 + Math.floor(Math.random() * 3)) % 4;
      grid[pr][pc] = cell;
    }
  });
  return grid;
}

function poweredSet(grid: PipeCell[][], R: number, C: number): { powered: Set<string>; lit: boolean } {
  let sr = -1, sc = -1, br = -1, bc = -1;
  grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell.kind === "source") { sr = r; sc = c; }
    if (cell.kind === "bulb") { br = r; bc = c; }
  }));
  const powered = new Set<string>();
  if (sr < 0) return { powered, lit: false };
  const queue: [number, number][] = [[sr, sc]];
  powered.add(`${sr},${sc}`);
  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (const d of openingsOf(grid[r][c])) {
      const nr = r + DR[d], nc = c + DC[d];
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      const k = `${nr},${nc}`;
      if (powered.has(k)) continue;
      if (openingsOf(grid[nr][nc]).includes(((d + 2) % 4) as Dir)) {
        powered.add(k);
        queue.push([nr, nc]);
      }
    }
  }
  return { powered, lit: powered.has(`${br},${bc}`) };
}

const PipeGlyph: React.FC<{ cell: PipeCell; powered: boolean; lit: boolean; px: number }> = ({ cell, powered, lit, px }) => {
  const col = powered ? "#3ee6c1" : "#64809c";
  const arm = (d: Dir) => {
    const transforms = ["translate(20 20) rotate(0)", "translate(20 20) rotate(90)", "translate(20 20) rotate(180)", "translate(20 20) rotate(270)"];
    return <rect key={d} x="-5.5" y="-20" width="11" height="22" rx="3" transform={transforms[d]} />;
  };
  return (
    <svg width={px} height={px} viewBox="0 0 40 40">
      {cell.kind === "source" && (
        <g>
          {arm(cell.dir!)}
          <rect x="8" y="9" width="24" height="22" rx="5" fill="#ffd23f" stroke="#061726" strokeWidth="2.6" />
          <path d="M22 12l-7 9h5l-2 7 7-9h-5z" fill="#061726" />
        </g>
      )}
      {cell.kind === "bulb" && (
        <g>
          {arm(cell.dir!)}
          <circle cx="20" cy="18" r="10" fill={lit ? "#ffd23f" : "#3d546e"} stroke="#061726" strokeWidth="2.6" style={lit ? { filter: "drop-shadow(0 0 8px #ffd23f)" } : undefined} />
          <rect x="15" y="27" width="10" height="5" rx="2" fill="#8a99ad" stroke="#061726" strokeWidth="2" />
          {lit && <path d="M15 15q5 -5 10 0" stroke="#fff6e3" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
        </g>
      )}
      {(cell.kind === "straight" || cell.kind === "corner") && (
        <g
          fill={col}
          stroke="#061726"
          strokeWidth="2.6"
          style={{ transform: `rotate(${cell.rot * 90}deg)`, transformOrigin: "20px 20px", transition: "transform .18s cubic-bezier(.34,1.56,.64,1), fill .2s" }}
        >
          {cell.kind === "straight" ? (
            <rect x="14.5" y="-1" width="11" height="42" rx="3.5" />
          ) : (
            <path d="M14.5 -1 h11 v15 a6 6 0 006 6 h10 v11 h-15 a11.5 11.5 0 01-12 -11.5 z" transform="translate(-0.5 0)" />
          )}
          {powered && <circle cx="20" cy="20" r="4" fill="#bffff0" stroke="none" />}
        </g>
      )}
    </svg>
  );
};

export const PipesPuzzle: React.FC<{ d: number; onSolve: () => void; paused: boolean }> = ({ d, onSolve, paused }) => {
  const size = [3, 3, 4, 4, 5, 5][Math.min(5, d)];
  const [grid] = useState<PipeCell[][]>(() => {
    for (let t = 0; t < 60; t++) {
      const g = genPipes(size, size);
      if (!g) continue;
      let { lit } = poweredSet(g, size, size);
      let guard = 0;
      while (lit && guard++ < 30) {
        const cells: [number, number][] = [];
        g.forEach((row, r) => row.forEach((c, cc) => { if (c.kind === "straight" || c.kind === "corner") cells.push([r, cc]); }));
        const [r, c] = cells[Math.floor(Math.random() * cells.length)];
        g[r][c] = { ...g[r][c], rot: (g[r][c].rot + 1) % 4 };
        lit = poweredSet(g, size, size).lit;
      }
      if (!lit) return g;
    }
    let fallback = genPipes(size, size);
    while (!fallback) fallback = genPipes(size, size);
    return fallback;
  });
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const { powered, lit } = useMemo(() => poweredSet(grid, size, size), [grid, size]);

  useEffect(() => {
    if (lit && !done) {
      setDone(true);
      sfx.heart();
      window.setTimeout(onSolve, 650);
    }
  }, [lit, done, onSolve]);

  const rotate = (r: number, c: number) => {
    const cell = grid[r][c];
    if (paused || done || (cell.kind !== "straight" && cell.kind !== "corner")) return;
    sfx.rotate();
    cell.rot = (cell.rot + 1) % 4;
    setMoves((m) => m + 1);
  };

  const px = size <= 3 ? 74 : size === 4 ? 66 : 56;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-1.5 p-3 rounded-2xl border-[3px] border-ink bg-[#09213a]" style={{ gridTemplateColumns: `repeat(${size}, ${px}px)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => rotate(r, c)}
              disabled={cell.kind === "source" || cell.kind === "bulb" || done}
              className={`rounded-xl border-[3px] grid place-items-center transition-colors ${
                powered.has(`${r},${c}`) ? "border-[#3ee6c1] bg-[#0f3f45]" : "border-ink bg-[#0d2b47]"
              } ${cell.kind === "straight" || cell.kind === "corner" ? "cursor-pointer hover:brightness-125 active:scale-95" : "cursor-default"}`}
              style={{ width: px, height: px }}
              aria-label={`pipe ${r},${c}`}
            >
              <PipeGlyph cell={cell} powered={powered.has(`${r},${c}`)} lit={lit} px={px - 12} />
            </button>
          ))
        )}
      </div>
      <p className="text-sm font-extrabold text-[#9fc3e8] h-5">
        {lit ? "Let there be light!" : `Turns: ${moves} — power flows through glowing pipes`}
      </p>
    </div>
  );
};
