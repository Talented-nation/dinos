import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { SpaceEngine } from "./game/engine";
import { sfx } from "./game/audio";
import {
  MemoryPuzzle, OddPuzzle, PatternPuzzle, PipesPuzzle, PuzzleShell, PUZZLE_META, type PuzzleType,
} from "./game/puzzles";
import {
  BookIcon, BulbIcon, HeartIcon, HomeIcon, PauseIcon, PlayIcon, RetryIcon, RocketIcon, SoundOffIcon, SoundOnIcon, StarIcon,
} from "./game/icons";
import { PLANETS } from "./game/planets";
import { JournalModal, QuizPanel } from "./game/quiz";

type Phase = "menu" | "countdown" | "flight" | "puzzle" | "learn" | "warp" | "gameover" | "victory";

const readBest = () => {
  try { return Number(localStorage.getItem("puzzle-planet-best") || 0); } catch { return 0; }
};
const writeBest = (v: number) => {
  try { localStorage.setItem("puzzle-planet-best", String(v)); } catch { /* ignore */ }
};
const readJournal = (): string[] => {
  try {
    const raw = localStorage.getItem("puzzle-planet-journal");
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
};
const writeJournal = (ids: string[]) => {
  try { localStorage.setItem("puzzle-planet-journal", JSON.stringify(ids)); } catch { /* ignore */ }
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpaceEngine | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("menu");
  const [planetIdx, setPlanetIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [puzzle, setPuzzle] = useState<{ type: PuzzleType; key: number }>({ type: "pattern", key: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [countVal, setCountVal] = useState("3");
  const [toast, setToast] = useState<{ text: string; k: number } | null>(null);
  const [visited, setVisited] = useState<string[]>(readJournal);
  const [journalOpen, setJournalOpen] = useState(false);
  const [learnKey, setLearnKey] = useState(0);
  const [factIdx, setFactIdx] = useState(0);

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const timeLeftRef = useRef(timeLeft); timeLeftRef.current = timeLeft;
  const planetIdxRef = useRef(planetIdx); planetIdxRef.current = planetIdx;
  const lastTypeRef = useRef<PuzzleType | null>(null);
  const puzzleKeyRef = useRef(1);
  const tickRef = useRef(99);
  const timersRef = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const setLivesBoth = (v: number) => {
    const nv = Math.max(0, Math.min(3, v));
    livesRef.current = nv;
    setLives(nv);
    engineRef.current?.setLives(nv);
  };
  const addScore = (v: number) => {
    scoreRef.current += v;
    setScore(scoreRef.current);
  };
  const updateBest = (s: number) => {
    if (s > best) { setBest(s); writeBest(s); }
  };
  const showToast = (text: string) => setToast({ text, k: Date.now() });

  const markVisited = (id: string) => {
    setVisited((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeJournal(next);
      return next;
    });
  };

  /* ---------- puzzle picking ---------- */
  const newPuzzle = (idx: number): PuzzleType => {
    let type: PuzzleType;
    if (idx === 0) type = Math.random() < 0.5 ? "pattern" : "odd";
    else {
      const pool: PuzzleType[] = (["memory", "pattern", "odd", "pipes"] as PuzzleType[]).filter((t) => t !== lastTypeRef.current);
      type = pool[Math.floor(Math.random() * pool.length)];
    }
    lastTypeRef.current = type;
    puzzleKeyRef.current += 1;
    setPuzzle({ type, key: puzzleKeyRef.current });
    return type;
  };

  /* ---------- flow ---------- */
  const runCountdown = () => {
    const steps = ["3", "2", "1", "GO!"];
    steps.forEach((s, i) => {
      later(() => {
        setCountVal(s);
        if (s === "GO!") { sfx.go(); later(() => { setPhase("flight"); engineRef.current?.go(); }, 550); }
        else sfx.countdown();
      }, i * 750);
    });
  };

  const startGame = () => {
    sfx.unlock(); sfx.click();
    clearTimers();
    setPaused(false);
    if (engineRef.current) engineRef.current.paused = false;
    scoreRef.current = 0; setScore(0);
    setLivesBoth(3);
    setPlanetIdx(0);
    lastTypeRef.current = null;
    setPhase("countdown");
    engineRef.current?.startCountdown(0, PLANETS[0]);
    showToast(`Course set for Planet ${PLANETS[0].name}!`);
    runCountdown();
  };

  const startNextPlanet = (idx: number) => {
    setPlanetIdx(idx);
    setPhase("countdown");
    engineRef.current?.startCountdown(idx, PLANETS[idx]);
    showToast(`Next stop: Planet ${PLANETS[idx].name}!`);
    runCountdown();
  };

  const gameOver = () => {
    setPhase("gameover");
    engineRef.current?.setMode("menu");
    updateBest(scoreRef.current);
    later(() => sfx.gameover(), 350);
  };

  const onPuzzleFail = () => {
    if (phaseRef.current !== "puzzle") return;
    sfx.fail();
    const nl = livesRef.current - 1;
    setLivesBoth(nl);
    if (nl <= 0) { gameOver(); return; }
    const type = newPuzzle(planetIdxRef.current);
    setTimeLeft(PUZZLE_META[type].time);
    tickRef.current = 99;
    showToast("Time ran out! −1 hull. New puzzle!");
  };

  const onPuzzleSolve = () => {
    if (phaseRef.current !== "puzzle") return;
    const bonus = 150 + Math.ceil(timeLeftRef.current) * 2;
    addScore(bonus);
    sfx.solve();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.45 }, colors: ["#ffd23f", "#3ee6c1", "#ff6b4a", "#ff7ab8"] });
    const landed = PLANETS[planetIdxRef.current];
    markVisited(landed.id);
    setLearnKey((k) => k + 1);
    setPhase("learn");
    showToast(`Puzzle solved! +${bonus} stardust`);
  };

  const onQuizAnswered = (correct: boolean) => {
    if (correct) {
      addScore(40);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.35 }, colors: ["#ffd23f", "#3ee6c1", "#9be84a"] });
      showToast("Quiz star! +40 stardust");
    }
  };

  const onQuizContinue = () => {
    sfx.click();
    setPhase("warp");
    engineRef.current?.startWarp();
    sfx.warp();
  };

  /* ---------- engine callbacks ---------- */
  const cbRef = useRef({
    onCollectStar: () => {}, onCollectHeart: () => {}, onHit: () => {},
    onArrive: () => {}, onWarpEnd: () => {},
  });
  cbRef.current = {
    onCollectStar: () => { addScore(15); sfx.collect(); },
    onCollectHeart: () => { setLivesBoth(livesRef.current + 1); sfx.heart(); },
    onHit: () => {
      if (phaseRef.current !== "flight") return;
      const nl = livesRef.current - 1;
      setLivesBoth(nl);
      if (nl <= 0) gameOver();
    },
    onArrive: () => {
      if (phaseRef.current !== "flight") return;
      sfx.arrive();
      engineRef.current?.setMode("ambient");
      const type = newPuzzle(planetIdxRef.current);
      setTimeLeft(PUZZLE_META[type].time);
      tickRef.current = 99;
      setPhase("puzzle");
      showToast(`Landed on ${PLANETS[planetIdxRef.current].name}!`);
    },
    onWarpEnd: () => {
      if (phaseRef.current !== "warp") return;
      const next = planetIdxRef.current + 1;
      if (next >= PLANETS.length) {
        setPhase("victory");
        engineRef.current?.setMode("menu");
        updateBest(scoreRef.current);
        sfx.victory();
        later(() => confetti({ particleCount: 130, spread: 130, origin: { y: 0.4 }, colors: ["#ffd23f", "#3ee6c1", "#ff6b4a", "#ff7ab8", "#9be84a"] }), 200);
        later(() => confetti({ particleCount: 90, spread: 100, origin: { x: 0.2, y: 0.5 }, colors: ["#ffd23f", "#3ee6c1", "#ff6b4a"] }), 700);
        later(() => confetti({ particleCount: 90, spread: 100, origin: { x: 0.8, y: 0.5 }, colors: ["#ff7ab8", "#9be84a", "#5bc9ff"] }), 1000);
      } else {
        startNextPlanet(next);
      }
    },
  };

  /* ---------- engine init ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const eng = new SpaceEngine(canvas, {
      onProgress: (p) => { if (progressRef.current) progressRef.current.style.width = `${(p * 100).toFixed(1)}%`; },
      onCollectStar: () => cbRef.current.onCollectStar(),
      onCollectHeart: () => cbRef.current.onCollectHeart(),
      onHit: () => cbRef.current.onHit(),
      onArrive: () => cbRef.current.onArrive(),
      onWarpEnd: () => cbRef.current.onWarpEnd(),
    });
    eng.setPlanet(PLANETS[0]);
    engineRef.current = eng;
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      eng.destroy();
      engineRef.current = null;
      clearTimers();
    };
  }, []);

  /* ---------- puzzle timer ---------- */
  useEffect(() => {
    if (phase !== "puzzle" || paused) return;
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(id);
  }, [phase, paused, puzzle.key]);

  useEffect(() => {
    if (phase !== "puzzle") return;
    if (timeLeft <= 0) { onPuzzleFail(); return; }
    if (timeLeft <= 10.05) {
      const c = Math.ceil(timeLeft);
      if (c !== tickRef.current && c > 0) { tickRef.current = c; sfx.tick(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ---------- space fact ticker during flight ---------- */
  useEffect(() => {
    if (phase !== "flight") return;
    const id = window.setInterval(() => setFactIdx((f) => f + 1), 4200);
    return () => clearInterval(id);
  }, [phase]);

  /* ---------- pause ---------- */
  const togglePause = () => {
    const p = phaseRef.current;
    if (p !== "flight" && p !== "puzzle") return;
    setPaused((prev) => {
      const nv = !prev;
      if (engineRef.current) engineRef.current.paused = nv;
      sfx.click();
      return nv;
    });
  };
  const togglePauseRef = useRef(togglePause); togglePauseRef.current = togglePause;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "p" || k === "escape") togglePauseRef.current();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const quitToMenu = () => {
    sfx.click();
    clearTimers();
    setPaused(false);
    if (engineRef.current) { engineRef.current.paused = false; engineRef.current.setMode("menu"); }
    setPhase("menu");
  };

  const toggleMute = () => {
    sfx.unlock();
    setMuted((m) => { sfx.setMuted(!m); return !m; });
  };

  const planet = PLANETS[Math.min(planetIdx, PLANETS.length - 1)];
  const totalTime = PUZZLE_META[puzzle.type].time;
  const timePct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const inGame = phase === "flight" || phase === "puzzle" || phase === "learn" || phase === "countdown" || phase === "warp";

  /* ================= render ================= */
  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ fontFamily: "var(--font-body)" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none" />

      {/* ---------- HUD ---------- */}
      {inGame && (
        <div className="absolute top-0 inset-x-0 p-3 flex items-start justify-between gap-2 pointer-events-none z-20">
          <div className="flex flex-col gap-2 items-start">
            <div className="panel-solid px-3 py-2 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < lives ? "text-coral" : "text-[#28456a]"} style={i < lives ? { filter: "drop-shadow(0 0 5px #ff6b4a88)" } : undefined}>
                  <HeartIcon size={22} />
                </span>
              ))}
            </div>
            <div className="panel-solid px-3 py-1 text-[12px] font-black tracking-widest text-aqua">
              SECTOR {Math.min(planetIdx + 1, PLANETS.length)}/{PLANETS.length}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 pt-0.5 max-w-[46vw]">
            {phase === "puzzle" ? (
              <div className={`panel-solid px-4 py-1.5 flex items-center gap-3 ${timeLeft <= 10 ? "timer-critical" : ""}`}>
                <span className="font-display text-lg text-cream leading-none hidden md:inline">{PUZZLE_META[puzzle.type].name}</span>
                <span className={`font-display text-2xl leading-none tabular-nums ${timeLeft <= 10 ? "text-coral" : "text-sun"}`}>
                  {Math.ceil(timeLeft)}
                </span>
                <span className="w-24 sm:w-40 h-3 rounded-full border-2 border-ink bg-[#09213a] overflow-hidden block">
                  <span
                    className="block h-full rounded-full transition-[width] duration-150"
                    style={{ width: `${timePct}%`, background: timeLeft <= 10 ? "#ff6b4a" : "linear-gradient(90deg,#ffd23f,#9be84a)" }}
                  />
                </span>
              </div>
            ) : (
              <div className="panel-solid px-4 py-1.5 flex items-center gap-2.5">
                <span className="text-sun"><StarIcon size={18} /></span>
                <span className="text-[12px] font-black tracking-wider text-[#9fc3e8] whitespace-nowrap">
                  ROUTE · {planet.name.toUpperCase()}
                </span>
                <span className="w-28 sm:w-48 h-3.5 rounded-full border-2 border-ink bg-[#09213a] overflow-hidden block">
                  <span ref={progressRef} className="block h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg,#3ee6c1,#5bc9ff)" }} />
                </span>
                <RocketIcon size={20} className="-scale-x-100" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="panel-solid px-3.5 py-2 flex items-center gap-2">
              <span className="text-sun"><StarIcon size={20} /></span>
              <span className="font-display text-xl text-cream leading-none tabular-nums">{score}</span>
            </div>
            <button onClick={togglePause} className="btn-square panel-solid w-11 h-11 grid place-items-center text-cream pointer-events-auto" aria-label="Pause">
              {paused ? <PlayIcon size={20} /> : <PauseIcon size={20} />}
            </button>
            <button onClick={toggleMute} className="btn-square panel-solid w-11 h-11 grid place-items-center text-cream pointer-events-auto" aria-label="Toggle sound">
              {muted ? <SoundOffIcon size={20} /> : <SoundOnIcon size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* space fact ticker */}
      {phase === "flight" && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[92vw]">
          <div key={factIdx} className="panel-solid px-4 py-2 flex items-center gap-2.5 animate-pop-in">
            <BulbIcon size={18} className="text-sun shrink-0" />
            <span className="text-[12.5px] font-extrabold text-[#cfe6ff] leading-snug">
              <span className="text-sun">{planet.name}:</span>{" "}
              {planet.edu.facts[factIdx % planet.edu.facts.length]}
            </span>
          </div>
        </div>
      )}

      {/* flight control hint */}
      {phase === "flight" && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="panel px-4 py-1.5 flex items-center gap-2 text-[12.5px] font-extrabold text-[#9fc3e8]">
            <span className="kbd">W</span><span className="kbd">A</span><span className="kbd">S</span><span className="kbd">D</span>
            <span>or</span>
            <span className="kbd">drag</span>
            <span>to fly · dodge rocks · grab stars</span>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div key={toast.k} className="absolute top-20 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="panel-solid px-6 py-2.5 font-display text-lg sm:text-xl text-sun animate-toast">{toast.text}</div>
        </div>
      )}

      {/* ---------- MENU ---------- */}
      {phase === "menu" && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(4,16,31,0.88) 0%, rgba(4,16,31,0.55) 42%, rgba(4,16,31,0) 68%)" }} />
          <div className="relative h-full flex flex-col justify-between pl-5 sm:pl-12 py-6 max-w-[1100px]">
            <div className="flex items-center gap-2 pointer-events-auto justify-end pr-3 sm:pr-8">
              {best > 0 && (
                <div className="panel-solid px-3 py-1.5 flex items-center gap-1.5 text-sun">
                  <StarIcon size={16} />
                  <span className="text-[12px] font-black tracking-wider">BEST {best}</span>
                </div>
              )}
              <button onClick={toggleMute} className="btn-square panel-solid w-11 h-11 grid place-items-center text-cream" aria-label="Toggle sound">
                {muted ? <SoundOffIcon size={20} /> : <SoundOnIcon size={20} />}
              </button>
            </div>

            <div className="pointer-events-auto -mt-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full border-2 border-ink bg-sun text-ink text-[11px] font-black tracking-[0.18em] shadow-[0_3px_0_#061726]">AGES 8+</span>
                <span className="px-3 py-1 rounded-full border-2 border-ink bg-aqua text-ink text-[11px] font-black tracking-[0.18em] shadow-[0_3px_0_#061726]">A LOGIC ADVENTURE IN SPACE</span>
              </div>
              <h1 className="font-display leading-[0.88] text-outline">
                <span className="block text-[17vw] sm:text-8xl lg:text-9xl text-cream">PUZZLE</span>
                <span className="block text-[17vw] sm:text-8xl lg:text-9xl text-aqua -rotate-2">PLANET</span>
              </h1>
              <p className="mt-4 max-w-md text-[15px] sm:text-lg font-bold text-[#bfe0ff] leading-snug">
                Pilot your rocket past grumpy asteroids, land on six REAL planets,
                crack their clever puzzles — and fill your Galactic Journal with
                amazing space facts. Play smart, learn the solar system!
              </p>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button onClick={startGame} className="btn-chunk bg-coral text-cream px-9 py-4 text-2xl sm:text-3xl flex items-center gap-3 animate-glow-pulse">
                  <RocketIcon size={30} /> LAUNCH!
                </button>
                <button onClick={() => { sfx.unlock(); sfx.click(); setJournalOpen(true); }} className="btn-chunk bg-sun text-ink px-6 py-4 text-lg flex items-center gap-2.5">
                  <BookIcon size={24} />
                  <span className="text-left leading-tight">
                    JOURNAL<br />
                    <span className="text-[11px] font-black tracking-widest opacity-70">{visited.length}/{PLANETS.length} PLANETS</span>
                  </span>
                </button>
                <div className="text-[13px] font-extrabold text-[#9fc3e8] leading-tight">
                  6 real planets · 4 puzzle types<br />18 space-science quiz questions
                </div>
              </div>
            </div>

            <div className="pointer-events-auto self-start">
              <div className="panel px-4 py-3 flex items-center gap-4 flex-wrap text-[13px] font-extrabold text-[#cfe6ff]">
                <span className="flex items-center gap-1.5">
                  <span className="kbd">W</span><span className="kbd">A</span><span className="kbd">S</span><span className="kbd">D</span>
                  <span className="text-[#9fc3e8]">/ arrows / drag — fly</span>
                </span>
                <span className="w-px h-6 bg-[#1d4f7a] hidden sm:block" />
                <span className="flex items-center gap-1.5"><span className="kbd">click</span><span className="text-[#9fc3e8]">solve puzzles</span></span>
                <span className="w-px h-6 bg-[#1d4f7a] hidden sm:block" />
                <span className="flex items-center gap-1.5"><span className="kbd">P</span><span className="text-[#9fc3e8]">pause</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- COUNTDOWN ---------- */}
      {phase === "countdown" && (
        <div className="absolute inset-0 z-30 grid place-items-center pointer-events-none">
          <div key={countVal} className="animate-count-pop text-center">
            <div className={`font-display text-[26vw] sm:text-9xl text-outline ${countVal === "GO!" ? "text-lime" : "text-sun"}`}>{countVal}</div>
          </div>
        </div>
      )}

      {/* ---------- PUZZLE ---------- */}
      {phase === "puzzle" && (
        <div className="absolute inset-0 z-20 grid place-items-center pt-14 pb-4 overflow-auto">
          <PuzzleShell type={puzzle.type} planet={planet} key={puzzle.key}>
            {puzzle.type === "memory" && <MemoryPuzzle d={planetIdx} onSolve={onPuzzleSolve} paused={paused} />}
            {puzzle.type === "pattern" && <PatternPuzzle d={planetIdx} onSolve={onPuzzleSolve} onPenalty={(s) => setTimeLeft((t) => Math.max(1, t - s))} paused={paused} />}
            {puzzle.type === "odd" && <OddPuzzle d={planetIdx} onSolve={onPuzzleSolve} onPenalty={(s) => setTimeLeft((t) => Math.max(1, t - s))} paused={paused} />}
            {puzzle.type === "pipes" && <PipesPuzzle d={planetIdx} onSolve={onPuzzleSolve} paused={paused} />}
          </PuzzleShell>
        </div>
      )}

      {/* ---------- LEARN (planet facts + quiz) ---------- */}
      {phase === "learn" && (
        <div className="absolute inset-0 z-20 grid place-items-center pt-14 pb-4 overflow-auto">
          <QuizPanel
            key={`${planet.id}-${learnKey}`}
            planet={planet}
            onAnswered={onQuizAnswered}
            onContinue={onQuizContinue}
          />
        </div>
      )}

      {/* ---------- WARP ---------- */}
      {phase === "warp" && (
        <div className="absolute inset-0 z-20 grid place-items-center pointer-events-none">
          <div className="text-center animate-pop-in">
            <div className="font-display text-6xl sm:text-8xl text-aqua text-outline animate-glow-pulse">WARP!</div>
            <div className="mt-2 text-lg font-black text-[#bfe0ff]">Charging to the next planet…</div>
          </div>
        </div>
      )}

      {/* ---------- PAUSE ---------- */}
      {paused && inGame && (
        <div className="absolute inset-0 z-40 grid place-items-center" style={{ background: "rgba(4,16,31,0.78)" }}>
          <div className="panel-solid p-7 w-[min(92vw,400px)] text-center animate-pop-in">
            <h2 className="font-display text-4xl text-sun text-outline-sm">PAUSED</h2>
            <p className="mt-1 text-sm font-bold text-[#9fc3e8]">The asteroids are frozen. Nice trick.</p>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={togglePause} className="btn-chunk bg-aqua text-ink px-6 py-3 text-xl flex items-center justify-center gap-2">
                <PlayIcon size={20} /> KEEP GOING
              </button>
              <button onClick={startGame} className="btn-chunk bg-sun text-ink px-6 py-3 text-lg flex items-center justify-center gap-2">
                <RetryIcon size={19} /> RESTART
              </button>
              <button onClick={() => { sfx.click(); setJournalOpen(true); }} className="btn-chunk bg-bubble text-ink px-6 py-3 text-lg flex items-center justify-center gap-2">
                <BookIcon size={19} /> PLANET JOURNAL
              </button>
              <button onClick={quitToMenu} className="btn-chunk bg-[#123a5c] text-cream px-6 py-3 text-lg flex items-center justify-center gap-2">
                <HomeIcon size={19} /> SPACE PORT
              </button>
            </div>
            <div className="mt-4 text-[12px] font-extrabold text-[#7fa6cc]">
              <span className="kbd">P</span> or <span className="kbd">Esc</span> to resume
            </div>
          </div>
        </div>
      )}

      {/* ---------- GAME OVER ---------- */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-40 grid place-items-center" style={{ background: "rgba(4,16,31,0.7)" }}>
          <div className="panel-solid p-7 w-[min(92vw,440px)] text-center animate-rise">
            <div className="hazard-stripes h-4 rounded-full border-[3px] border-ink mb-5" />
            <h2 className="font-display text-4xl sm:text-5xl text-coral text-outline-sm leading-none">OUT OF HULL!</h2>
            <p className="mt-2 text-sm font-bold text-[#9fc3e8]">
              The space tugs towed your rocket home. Planet {planet.name} will wait for you.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="panel px-2 py-3">
                <div className="text-[10px] font-black tracking-widest text-[#7fa6cc]">SCORE</div>
                <div className="font-display text-2xl text-sun">{score}</div>
              </div>
              <div className="panel px-2 py-3">
                <div className="text-[10px] font-black tracking-widest text-[#7fa6cc]">BEST</div>
                <div className="font-display text-2xl text-aqua">{Math.max(best, score)}</div>
              </div>
              <div className="panel px-2 py-3">
                <div className="text-[10px] font-black tracking-widest text-[#7fa6cc]">PLANETS</div>
                <div className="font-display text-2xl text-lime">{planetIdx}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={startGame} className="btn-chunk bg-aqua text-ink px-6 py-3 text-xl flex items-center justify-center gap-2">
                <RetryIcon size={20} /> TRY AGAIN
              </button>
              <button onClick={quitToMenu} className="btn-chunk bg-[#123a5c] text-cream px-6 py-3 text-lg flex items-center justify-center gap-2">
                <HomeIcon size={19} /> SPACE PORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- VICTORY ---------- */}
      {phase === "victory" && (
        <div className="absolute inset-0 z-40 grid place-items-center" style={{ background: "rgba(4,16,31,0.6)" }}>
          <div className="panel-solid p-7 w-[min(92vw,460px)] text-center animate-rise">
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="text-sun animate-bob" style={{ animationDelay: `${i * 0.2}s`, filter: "drop-shadow(0 0 8px #ffd23f)" }}>
                  <StarIcon size={i === 1 ? 40 : 30} />
                </span>
              ))}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl text-sun text-outline-sm leading-none">GALAXY SAVED!</h2>
            <p className="mt-2 text-sm font-bold text-[#9fc3e8]">
              All six planets are glowing because of your big brain. They're singing about you.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="panel px-2 py-3">
                <div className="text-[10px] font-black tracking-widest text-[#7fa6cc]">FINAL SCORE</div>
                <div className="font-display text-3xl text-sun">{score}</div>
              </div>
              <div className="panel px-2 py-3">
                <div className="text-[10px] font-black tracking-widest text-[#7fa6cc]">BEST</div>
                <div className="font-display text-3xl text-aqua">{Math.max(best, score)}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={startGame} className="btn-chunk bg-coral text-cream px-6 py-3 text-xl flex items-center justify-center gap-2">
                <RocketIcon size={22} /> FLY AGAIN
              </button>
              <button onClick={quitToMenu} className="btn-chunk bg-[#123a5c] text-cream px-6 py-3 text-lg flex items-center justify-center gap-2">
                <HomeIcon size={19} /> SPACE PORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- GALACTIC JOURNAL ---------- */}
      {journalOpen && (
        <JournalModal visited={visited} onClose={() => { sfx.click(); setJournalOpen(false); }} />
      )}
    </div>
  );
}
