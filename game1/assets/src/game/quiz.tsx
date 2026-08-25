import React, { useEffect, useMemo, useRef, useState } from "react";
import { drawPlanetOn } from "./engine";
import type { PlanetData } from "./planets";
import { PLANETS } from "./planets";
import { sfx } from "./audio";
import {
  BoltIcon, BookIcon, BulbIcon, CheckIcon, ClockIcon, HeartIcon, LockIcon,
  MoonIcon, OrbitIcon, RocketIcon, RulerIcon, StarIcon, TempIcon, XIcon,
} from "./icons";

/* ---------- tiny canvas render of a cute planet (journal + quiz) ---------- */
export const PlanetOrb: React.FC<{ planet: PlanetData; size: number }> = ({ planet, size }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const r = planet.ring ? size * 0.27 : size * 0.35;
    drawPlanetOn(ctx, planet, size / 2, size / 2, r, 1.7);
  }, [planet, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />;
};

/* ---------- stat chips ---------- */
const Chip: React.FC<{ icon: React.ReactNode; label: string; value: string; tint: string }> = ({ icon, label, value, tint }) => (
  <div className="stat-chip" style={{ borderLeftColor: tint }}>
    <span className="stat-ic" style={{ background: tint }}>{icon}</span>
    <div className="min-w-0">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

/* ---------- full planet fact card ---------- */
export const PlanetCard: React.FC<{ planet: PlanetData; compact?: boolean }> = ({ planet, compact }) => {
  const e = planet.edu;
  return (
    <div className={`planet-card ${compact ? "planet-card-compact" : ""}`}>
      <div className="planet-card-top">
        <div className="pop-in" style={{ animationDelay: "60ms" }}><PlanetOrb planet={planet} size={compact ? 88 : 128} /></div>
        <div>
          <div className="planet-name">{planet.name}</div>
          <div className="planet-tag" style={{ color: planet.accent }}>{planet.tag}</div>
        </div>
      </div>
      <div className="stat-grid">
        <Chip icon={<OrbitIcon size={16} />} label="Distance" value={e.distance} tint="#5bc9ff" />
        <Chip icon={<ClockIcon size={16} />} label="One day" value={e.day} tint="#ffd23f" />
        <Chip icon={<RocketIcon size={16} />} label="One year" value={e.year} tint="#3ee6c1" />
        <Chip icon={<RulerIcon size={16} />} label="Size" value={e.size} tint="#ff9d5c" />
        <Chip icon={<TempIcon size={16} />} label="Weather" value={e.temp} tint="#ff6b4a" />
        <Chip icon={<MoonIcon size={16} />} label="Moons" value={e.moons} tint="#ff7ab8" />
      </div>
      <ul className="fact-list">
        {e.facts.map((f, i) => (
          <li key={i} className="pop-in" style={{ animationDelay: `${140 + i * 90}ms` }}>
            <StarIcon size={13} className="fact-star" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- quiz panel shown after the logic puzzle ---------- */
const shuffle3 = () => {
  const idx = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
};

export const QuizPanel: React.FC<{
  planet: PlanetData;
  onAnswered: (correct: boolean) => void;
  onContinue: () => void;
}> = ({ planet, onAnswered, onContinue }) => {
  const q = useMemo(() => planet.edu.quiz[Math.floor(Math.random() * planet.edu.quiz.length)], [planet]);
  const order = useMemo(shuffle3, [q]);
  const [picked, setPicked] = useState<number | null>(null);

  const answered = picked !== null;
  const correct = picked !== null && q.options[picked] === q.options[q.correct];

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (q.options[i] === q.options[q.correct]) sfx.solve();
    else sfx.wrong();
    onAnswered(q.options[i] === q.options[q.correct]);
  };

  const letters = ["A", "B", "C"];

  return (
    <div className="overlay">
      <div className="panel quiz-panel pop-in">
        <div className="quiz-head">
          <PlanetOrb planet={planet} size={64} />
          <div>
            <div className="panel-eyebrow" style={{ color: planet.accent }}>
              Planet quiz · {planet.name}
            </div>
            <div className="quiz-q">{q.q}</div>
          </div>
        </div>

        <div className="quiz-options">
          {order.map((orig, slot) => {
            const text = q.options[orig];
            const isCorrect = orig === q.correct;
            const isPicked = picked === orig;
            let cls = "quiz-opt";
            if (answered) {
              if (isCorrect) cls += " quiz-opt-correct";
              else if (isPicked) cls += " quiz-opt-wrong";
              else cls += " quiz-opt-dim";
            }
            return (
              <button key={slot} className={cls} onClick={() => pick(orig)} disabled={answered}>
                <span className="quiz-letter">{letters[slot]}</span>
                <span className="flex-1 text-left">{text}</span>
                {answered && isCorrect && <CheckIcon size={20} className="text-[#3ee6c1]" />}
                {answered && isPicked && !isCorrect && <XIcon size={18} className="text-[#ff6b4a]" />}
              </button>
            );
          })}
        </div>

        {!answered && (
          <div className="quiz-hint">
            <BulbIcon size={18} className="text-[#ffd23f]" />
            Think like an astronaut — you've got this!
          </div>
        )}

        {answered && (
          <div className="quiz-answer slide-up">
            <div className={`quiz-verdict ${correct ? "verdict-good" : "verdict-oops"}`}>
              {correct ? (
                <>
                  <CheckIcon size={20} /> Cosmic! That's right — +40 stardust!
                </>
              ) : (
                <>
                  <HeartIcon size={20} /> Good try, explorer! The answer is: <b>{q.options[q.correct]}</b>
                </>
              )}
            </div>
            <div className="quiz-fact">
              <div className="quiz-fact-head">
                <BulbIcon size={18} className="text-[#ffd23f]" />
                <span>Science scoop</span>
              </div>
              <p>{q.fact}</p>
            </div>

            <PlanetCard planet={planet} />

            <div className="quiz-continue">
              <span className="quiz-continue-note">Saved to your Galactic Journal!</span>
              <button className="btn btn-sun btn-lg" onClick={onContinue}>
                <RocketIcon size={22} />
                {PLANETS[PLANETS.length - 1].id === planet.id ? "Finish the mission!" : "Warp to next planet"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Galactic Journal (collection of explored planets) ---------- */
export const JournalModal: React.FC<{ visited: string[]; onClose: () => void }> = ({ visited, onClose }) => {
  return (
    <div className="overlay journal-overlay" onClick={onClose}>
      <div className="panel journal-panel pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <div>
            <div className="panel-eyebrow text-[#ff7ab8]">
              <BookIcon size={16} /> Your space collection
            </div>
            <div className="journal-title">Galactic Journal</div>
            <div className="journal-sub">
              {visited.length} of {PLANETS.length} planets explored — visit planets to fill these pages!
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close journal">
            <XIcon size={18} />
          </button>
        </div>

        <div className="journal-progress">
          {PLANETS.map((p) => (
            <span key={p.id} className={`journal-dot ${visited.includes(p.id) ? "" : "journal-dot-off"}`} style={{ background: visited.includes(p.id) ? p.base : undefined }} title={p.name} />
          ))}
        </div>

        <div className="journal-grid">
          {PLANETS.map((p, i) => {
            const open = visited.includes(p.id);
            return open ? (
              <div key={p.id} className="pop-in" style={{ animationDelay: `${i * 60}ms` }}>
                <PlanetCard planet={p} compact />
              </div>
            ) : (
              <div key={p.id} className="planet-card planet-card-locked pop-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="locked-orb"><LockIcon size={26} /></div>
                <div className="locked-name">?</div>
                <div className="locked-sub">
                  Planet #{i + 1} is still undiscovered. Fly there to unlock its secrets!
                </div>
              </div>
            );
          })}
        </div>

        <div className="journal-foot">
          <BoltIcon size={16} className="text-[#ffd23f]" />
          <span>Every planet page is packed with REAL space science. Collect them all!</span>
        </div>
      </div>
    </div>
  );
};
