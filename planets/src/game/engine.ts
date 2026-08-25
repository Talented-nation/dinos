/* Puzzle Planet — canvas space engine: starfield, rocket flight, asteroids,
   collectibles, particles, screen shake, cute procedural planets. */

export interface PlanetDef {
  id: string;
  name: string;
  tag: string;
  base: string;
  dark: string;
  accent: string;
  ring: boolean;
  bands?: boolean;
  spot?: boolean;
  seed: number;
}

export type EngineMode = "menu" | "countdown" | "flight" | "ambient" | "warp";

export interface EngineCallbacks {
  onProgress: (p: number) => void;
  onCollectStar: () => void;
  onCollectHeart: () => void;
  onHit: () => void;
  onArrive: () => void;
  onWarpEnd: () => void;
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

interface Star { x: number; y: number; r: number; tw: number; ph: number; }
interface Pickup { x: number; y: number; t: number; kind: "star" | "heart"; bob: number; }
interface Rock { x: number; y: number; r: number; vx: number; vy: number; rot: number; vr: number; verts: number[]; craters: { a: number; d: number; r: number }[]; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; glow: boolean; drag: number; }
interface Streak { x: number; y: number; len: number; sp: number; hue: string; }

const BG_HUES = ["#8fd8ff", "#ffe9ad", "#ffc4d9", "#b8ffe9"];

/* ------------------------------------------------------------------ */
/* Standalone cute-planet renderer — shared with the Galactic Journal. */
/* ------------------------------------------------------------------ */
export function drawPlanetOn(
  ctx: CanvasRenderingContext2D,
  p: PlanetDef,
  cx: number,
  cy: number,
  r: number,
  t: number
) {
  if (r < 2) return;
  ctx.save();

  // halo
  const halo = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.45);
  halo.addColorStop(0, p.accent + "33");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
  ctx.fill();

  // ring back
  if (p.ring) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.32);
    ctx.strokeStyle = p.accent + "aa";
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.55, r * 0.42, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // body
  const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r * 1.05);
  body.addColorStop(0, p.base);
  body.addColorStop(1, p.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // surface details (seeded), clipped to sphere
  const rnd = mulberry32(p.seed);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.985, 0, Math.PI * 2);
  ctx.clip();

  if (p.bands) {
    // gas-giant cloud bands
    const bandColors = ["rgba(255,255,255,0.16)", "rgba(6,23,38,0.14)", "rgba(255,255,255,0.10)", "rgba(6,23,38,0.18)"];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const by = cy - r + ((i + 0.5) / n) * r * 2;
      const bh = (r * 2) / n;
      ctx.fillStyle = bandColors[i % bandColors.length];
      ctx.beginPath();
      ctx.moveTo(cx - r, by);
      for (let x = -1; x <= 1.01; x += 0.1) {
        ctx.lineTo(cx + x * r, by + Math.sin(x * 4 + i * 2) * r * 0.05);
      }
      for (let x = 1; x >= -1.01; x -= 0.1) {
        ctx.lineTo(cx + x * r, by + bh + Math.sin(x * 4 + i * 2 + 1) * r * 0.05);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // rocky spots
    const spotCount = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < spotCount; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * r * 0.72;
      const sr = r * (0.1 + rnd() * 0.16);
      ctx.fillStyle = "rgba(6,23,38,0.16)";
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, sr, sr * 0.72, rnd(), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // the Great Red Spot
  if (p.spot) {
    ctx.fillStyle = "rgba(255,96,64,0.85)";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.34, cy + r * 0.3, r * 0.2, r * 0.12, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,180,140,0.7)";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.34, cy + r * 0.3, r * 0.11, r * 0.06, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // shine
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.38, cy - r * 0.45, r * 0.34, r * 0.2, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // outline
  ctx.strokeStyle = "#061726";
  ctx.lineWidth = Math.max(2.5, r * 0.045);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // ring front
  if (p.ring) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.32);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.55, r * 0.42, 0, 0, Math.PI);
    ctx.stroke();
    ctx.strokeStyle = "#061726";
    ctx.lineWidth = Math.max(1.5, r * 0.02);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.62, r * 0.48, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // face (only when big enough)
  if (r > 40) {
    const blink = (t % 3.4) > 3.22;
    const look = Math.sin(t * 0.6) * r * 0.045;
    const er = r * 0.13;
    const ey = cy - r * 0.12;
    const ex = r * 0.34;
    for (const side of [-1, 1]) {
      const x = cx + side * ex;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, ey, er, blink ? er * 0.14 : er * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#061726";
      ctx.lineWidth = Math.max(1.5, r * 0.025);
      ctx.stroke();
      if (!blink) {
        ctx.fillStyle = "#061726";
        ctx.beginPath();
        ctx.arc(x + look, ey + er * 0.15, er * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x + look - er * 0.14, ey, er * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // blush
    ctx.fillStyle = "rgba(255,122,184,0.5)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.55, cy + r * 0.16, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // smile
    ctx.strokeStyle = "#061726";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.16, r * 0.26, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
  ctx.restore();
}

export class SpaceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: EngineCallbacks;
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;

  mode: EngineMode = "menu";
  paused = false;

  private planet: PlanetDef | null = null;
  private elapsed = 0;
  private dist = 0;
  private target = 2600;
  private speed = 170;
  private idx = 0;
  private arrived = false;
  private warpT = 0;
  private warpDone = false;
  private lives = 3;

  private keys = new Set<string>();
  private pointer: { x: number; y: number } | null = null;

  private ship = { x: 0, y: 0, vx: 0, vy: 0, inv: 0 };
  private bgStars: Star[][] = [[], [], []];
  private pickups: Pickup[] = [];
  private rocks: Rock[] = [];
  private particles: Particle[] = [];
  private streaks: Streak[] = [];
  private rockTimer = 1;
  private starTimer = 0.6;
  private heartTimer = 9;
  private shake = 0;
  private flash = { color: "#ffffff", a: 0 };

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onResize: () => void;
  private onPtrDown: (e: PointerEvent) => void;
  private onPtrMove: (e: PointerEvent) => void;
  private onPtrUp: () => void;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.canvas = canvas;
    this.cb = cb;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;

    this.onResize = () => this.resize();
    this.onKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    const ptrPos = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.onPtrDown = (e) => { this.pointer = ptrPos(e); };
    this.onPtrMove = (e) => { if (this.pointer) this.pointer = ptrPos(e); };
    this.onPtrUp = () => { this.pointer = null; };

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPtrDown);
    canvas.addEventListener("pointermove", this.onPtrMove);
    window.addEventListener("pointerup", this.onPtrUp);

    this.resize();
    this.seedBg();
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) this.update(dt);
      this.draw(now / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onPtrDown);
    this.canvas.removeEventListener("pointermove", this.onPtrMove);
    window.removeEventListener("pointerup", this.onPtrUp);
  }

  private resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ship.x = clamp(this.ship.x, 30, this.w - 30);
    this.ship.y = clamp(this.ship.y, 30, this.h - 30);
  }

  private seedBg() {
    const rnd = mulberry32(1234);
    const counts = [70, 40, 18];
    this.bgStars = counts.map((n) =>
      Array.from({ length: n }, () => ({
        x: rnd() * 2000, y: rnd() * 1400,
        r: rand(0.6, 2.2), tw: rand(0.5, 2.4), ph: rnd() * Math.PI * 2,
      }))
    );
  }

  /* ---------------- public control ---------------- */

  setMode(m: EngineMode) { this.mode = m; }
  setPlanet(p: PlanetDef) { this.planet = p; }
  setLives(l: number) { this.lives = l; }

  startCountdown(idx: number, planet: PlanetDef) {
    this.idx = idx;
    this.planet = planet;
    this.resetFlight();
    this.mode = "countdown";
    this.flash = { color: "#ffffff", a: 0.5 };
  }

  go() { this.mode = "flight"; }

  private resetFlight() {
    this.dist = 0;
    this.target = 2500 + this.idx * 420;
    this.speed = 168 + this.idx * 20;
    this.arrived = false;
    this.warpDone = false;
    this.warpT = 0;
    this.rockTimer = 1.1;
    this.starTimer = 0.5;
    this.heartTimer = rand(7, 12);
    this.pickups = [];
    this.rocks = [];
    this.streaks = [];
    this.ship = { x: this.w * 0.16, y: this.h * 0.5, vx: 0, vy: 0, inv: 0 };
    this.shake = 0;
    this.cb.onProgress(0);
  }

  startWarp() {
    this.mode = "warp";
    this.warpT = 0;
    this.warpDone = false;
    this.rocks = [];
    this.pickups = [];
    this.flash = { color: "#bffff0", a: 0.7 };
    for (let i = 0; i < 26; i++) {
      this.streaks.push({ x: rand(0, this.w), y: rand(0, this.h), len: rand(60, 200), sp: rand(900, 1900), hue: BG_HUES[i % BG_HUES.length] });
    }
  }

  burst(x: number, y: number, color: string, n = 14, speedMul = 1, glow = true) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(40, 260) * speedMul;
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: rand(0.35, 0.8), size: rand(2, 5.5), color, glow, drag: 3.2,
      });
    }
  }

  private puff(x: number, y: number, color: string) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x: x + rand(-8, 8), y: y + rand(-8, 8),
        vx: rand(-30, 30), vy: rand(-30, 30),
        life: 0, max: rand(0.5, 1), size: rand(5, 11), color, glow: false, drag: 1.4,
      });
    }
  }

  /* ---------------- update ---------------- */

  private update(dt: number) {
    this.elapsed += dt;
    this.shake = Math.max(0, this.shake - dt * 34);
    this.flash.a = Math.max(0, this.flash.a - dt * 1.8);

    // particles always
    for (const p of this.particles) {
      p.life += dt;
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);

    const mode = this.mode;
    const drift = mode === "flight" ? this.speed : mode === "warp" ? this.speed * 4 : 26;

    // background stars
    const pars = [0.22, 0.45, 0.85];
    this.bgStars.forEach((layer, li) => {
      for (const s of layer) {
        s.x -= drift * pars[li] * dt;
        if (s.x < -4) { s.x += this.w + 8; s.y = rand(0, this.h); }
      }
    });

    if (mode === "menu" || mode === "ambient") {
      if (Math.random() < dt * 0.25) {
        this.streaks.push({ x: rand(this.w * 0.3, this.w), y: rand(0, this.h * 0.5), len: rand(40, 90), sp: rand(500, 800), hue: "#ffffff" });
      }
    }

    for (const s of this.streaks) s.x -= s.sp * dt;
    this.streaks = this.streaks.filter((s) => s.x + s.len > -50);

    if (mode === "countdown") return;

    if (mode === "warp") {
      this.warpT += dt;
      this.ship.x = lerp(this.w * 0.16, this.w + 120, (this.warpT / 1.5) ** 2);
      if (Math.random() < dt * 60) {
        this.particles.push({
          x: this.ship.x - 26, y: this.ship.y + rand(-10, 10),
          vx: rand(-420, -260), vy: rand(-30, 30),
          life: 0, max: 0.4, size: rand(3, 7), color: Math.random() < 0.5 ? "#3ee6c1" : "#ffd23f", glow: true, drag: 0.5,
        });
      }
      if (this.warpT >= 1.5 && !this.warpDone) {
        this.warpDone = true;
        this.cb.onWarpEnd();
      }
      return;
    }

    if (mode !== "flight") return;

    /* --- ship control --- */
    const s = this.ship;
    const acc = 1500;
    let ax = 0, ay = 0;
    if (this.keys.has("arrowup") || this.keys.has("w")) ay -= 1;
    if (this.keys.has("arrowdown") || this.keys.has("s")) ay += 1;
    if (this.keys.has("arrowleft") || this.keys.has("a")) ax -= 1;
    if (this.keys.has("arrowright") || this.keys.has("d")) ax += 1;
    if (this.pointer) {
      const dx = this.pointer.x - s.x, dy = this.pointer.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 14) { ax = dx / d; ay = dy / d; }
    }
    const mag = Math.hypot(ax, ay);
    if (mag > 0) {
      s.vx += (ax / Math.max(1, mag)) * acc * dt;
      s.vy += (ay / Math.max(1, mag)) * acc * dt;
    }
    const damp = Math.exp(-4.6 * dt);
    s.vx *= damp; s.vy *= damp;
    const spMax = 360;
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > spMax) { s.vx = (s.vx / sp) * spMax; s.vy = (s.vy / sp) * spMax; }
    s.x = clamp(s.x + s.vx * dt, 26, this.w * 0.8);
    s.y = clamp(s.y + s.vy * dt, 30, this.h - 30);
    s.inv = Math.max(0, s.inv - dt);

    // engine exhaust
    if (Math.random() < dt * 90) {
      this.particles.push({
        x: s.x - 22, y: s.y + rand(-5, 5),
        vx: -this.speed * 0.5 + rand(-40, 10), vy: rand(-24, 24),
        life: 0, max: rand(0.25, 0.45), size: rand(2.5, 5.5),
        color: Math.random() < 0.5 ? "#ffd23f" : "#ff6b4a", glow: true, drag: 1.2,
      });
    }

    /* --- progress --- */
    this.dist += (this.speed + s.vx * 0.4) * dt;
    const prog = clamp(this.dist / this.target, 0, 1);
    this.cb.onProgress(prog);
    if (prog >= 1 && !this.arrived) {
      this.arrived = true;
      this.cb.onArrive();
      return;
    }

    /* --- spawning --- */
    this.rockTimer -= dt;
    const rockEvery = Math.max(0.62, 1.35 - this.idx * 0.11);
    if (this.rockTimer <= 0 && this.rocks.length < 14) {
      this.rockTimer = rockEvery * rand(0.6, 1.3);
      const r = rand(16, 30 + this.idx * 3);
      const verts = Array.from({ length: 9 }, () => rand(0.72, 1.12));
      this.rocks.push({
        x: this.w + 60, y: rand(40, this.h - 40), r,
        vx: -rand(20, 70 + this.idx * 14), vy: rand(-24, 24),
        rot: rand(0, 6.28), vr: rand(-1.4, 1.4), verts,
        craters: Array.from({ length: 3 }, () => ({ a: rand(0, 6.28), d: rand(0.2, 0.55), r: rand(0.12, 0.24) })),
      });
    }
    this.starTimer -= dt;
    if (this.starTimer <= 0 && this.pickups.length < 12) {
      this.starTimer = rand(0.7, 1.5);
      const y0 = rand(60, this.h - 60);
      const n = Math.random() < 0.4 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        this.pickups.push({ x: this.w + 50 + i * 46, y: clamp(y0 + Math.sin(i * 1.2) * 34, 40, this.h - 40), t: rand(0, 6), kind: "star", bob: rand(0, 6) });
      }
    }
    this.heartTimer -= dt;
    if (this.heartTimer <= 0) {
      this.heartTimer = rand(9, 15);
      if (this.lives < 3) {
        this.pickups.push({ x: this.w + 50, y: rand(70, this.h - 70), t: 0, kind: "heart", bob: 0 });
      }
    }

    /* --- move entities --- */
    const worldV = this.speed * 0.92;
    for (const p of this.pickups) { p.x -= worldV * dt; p.t += dt; }
    this.pickups = this.pickups.filter((p) => p.x > -50);
    for (const rk of this.rocks) {
      rk.x += (rk.vx - worldV * 0.35) * dt;
      rk.y += rk.vy * dt;
      rk.rot += rk.vr * dt;
      if (rk.y < rk.r || rk.y > this.h - rk.r) rk.vy *= -1;
    }
    this.rocks = this.rocks.filter((rk) => rk.x > -80);

    /* --- collisions --- */
    this.pickups = this.pickups.filter((p) => {
      const py = p.y + Math.sin(p.t * 3 + p.bob) * 7;
      if (Math.hypot(p.x - s.x, py - s.y) < 30) {
        if (p.kind === "star") {
          this.burst(p.x, py, "#ffd23f", 12, 0.9);
          this.cb.onCollectStar();
        } else {
          this.burst(p.x, py, "#ff7ab8", 16, 1);
          this.flash = { color: "#ff7ab8", a: 0.22 };
          this.cb.onCollectHeart();
        }
        return false;
      }
      return true;
    });

    if (s.inv <= 0) {
      for (const rk of this.rocks) {
        if (Math.hypot(rk.x - s.x, rk.y - s.y) < rk.r + 15) {
          s.inv = 1.7;
          this.shake = 16;
          this.flash = { color: "#ff4444", a: 0.38 };
          this.burst(s.x, s.y, "#ff6b4a", 22, 1.3);
          this.puff(rk.x, rk.y, "#8a7f72");
          rk.vx -= 120;
          this.cb.onHit();
          break;
        }
      }
    }
  }

  /* ---------------- draw ---------------- */

  private draw(t: number) {
    const { ctx, w, h } = this;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-this.shake, this.shake) * 0.5, rand(-this.shake, this.shake) * 0.5);
    }

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#04101f");
    sky.addColorStop(0.55, "#0a2342");
    sky.addColorStop(1, "#0e3055");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    this.drawNebula(t);

    // stars
    this.bgStars.forEach((layer, li) => {
      for (const s of layer) {
        const sx = s.x % (w + 8);
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph));
        ctx.globalAlpha = a * (0.45 + li * 0.28);
        ctx.fillStyle = li === 2 ? "#fff6e3" : "#bfe6ff";
        const x = sx < -4 ? sx + w + 8 : sx;
        ctx.fillRect(x, s.y % h, s.r, s.r);
      }
    });
    ctx.globalAlpha = 1;

    // shooting star streaks
    for (const s of this.streaks) {
      const g = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, s.hue === "#ffffff" ? "rgba(255,255,255,0.8)" : s.hue);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.stroke();
    }

    const mode = this.mode;

    // planet
    if (this.planet) {
      if (mode === "menu") this.drawPlanet(this.planet, w * 0.68, h * 0.54 + Math.sin(t * 0.8) * 10, Math.min(w, h) * 0.27, t);
      else if (mode === "ambient") this.drawPlanet(this.planet, w * 0.5, h * 0.58, Math.min(w, h) * 0.3, t);
      else if (mode === "flight" || mode === "countdown") {
        const appear = mode === "countdown" ? 0 : clamp((this.dist / this.target - 0.5) / 0.5, 0, 1);
        if (appear > 0) {
          const r = lerp(Math.min(w, h) * 0.05, Math.min(w, h) * 0.21, appear);
          const px = lerp(w + r, w - r * 1.35, appear);
          this.drawPlanet(this.planet, px, h * 0.5 + Math.sin(t) * 6, r, t);
        }
      }
    }

    // entities
    if (mode === "flight" || mode === "countdown" || mode === "warp") {
      for (const p of this.pickups) this.drawPickup(p, t);
      for (const rk of this.rocks) this.drawRock(rk);
      if (mode !== "countdown" || !(this.ship.inv > 0 && Math.floor(t * 14) % 2 === 0)) {
        this.drawShip(t);
      }
    }

    // particles
    for (const p of this.particles) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = k;
      if (p.glow) ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * k + 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;

    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(4,16,31,0)");
    vg.addColorStop(1, "rgba(4,16,31,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // flash
    if (this.flash.a > 0) {
      ctx.globalAlpha = this.flash.a;
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(-20, -20, w + 40, h + 40);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  private drawNebula(t: number) {
    const { ctx, w, h } = this;
    const blobs: [number, number, number, string][] = [
      [w * 0.22, h * 0.3, Math.min(w, h) * 0.5, "rgba(62,230,193,0.05)"],
      [w * 0.78, h * 0.72, Math.min(w, h) * 0.55, "rgba(255,107,74,0.05)"],
      [w * 0.55, h * 0.15, Math.min(w, h) * 0.4, "rgba(91,201,255,0.05)"],
    ];
    blobs.forEach(([x, y, r, c], i) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const pulse = 1 + Math.sin(t * 0.4 + i * 2) * 0.08;
      g.addColorStop(0, c);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawPlanet(p: PlanetDef, cx: number, cy: number, r: number, t: number) {
    drawPlanetOn(this.ctx, p, cx, cy, r, t);
  }

  private drawPickup(p: Pickup, t: number) {
    const { ctx } = this;
    const y = p.y + Math.sin(p.t * 3 + p.bob) * 7;
    const pulse = 1 + Math.sin(t * 5 + p.bob) * 0.12;
    ctx.save();
    ctx.translate(p.x, y);
    if (p.kind === "star") {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      g.addColorStop(0, "rgba(255,210,63,0.5)");
      g.addColorStop(1, "rgba(255,210,63,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.sin(t * 2 + p.bob) * 0.3);
      ctx.scale(pulse, pulse);
      this.starPath(11);
      ctx.fillStyle = "#ffd23f";
      ctx.fill();
      ctx.strokeStyle = "#061726";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#fff6e3";
      ctx.beginPath();
      ctx.arc(-2, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      g.addColorStop(0, "rgba(255,122,184,0.55)");
      g.addColorStop(1, "rgba(255,122,184,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.scale(pulse, pulse);
      this.heartPath(13);
      ctx.fillStyle = "#ff7ab8";
      ctx.fill();
      ctx.strokeStyle = "#061726";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private starPath(r: number) {
    const { ctx } = this;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.46;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  private heartPath(s: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.2, s * 0.1, -s * 0.7, -s * 0.9, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.7, -s * 0.9, s * 1.2, s * 0.1, 0, s * 0.9);
    ctx.closePath();
  }

  private drawRock(rk: Rock) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(rk.x, rk.y);
    ctx.rotate(rk.rot);
    ctx.beginPath();
    rk.verts.forEach((v, i) => {
      const a = (i / rk.verts.length) * Math.PI * 2;
      const rr = rk.r * v;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    });
    ctx.closePath();
    const g = ctx.createRadialGradient(-rk.r * 0.3, -rk.r * 0.3, rk.r * 0.2, 0, 0, rk.r * 1.1);
    g.addColorStop(0, "#a89a8c");
    g.addColorStop(1, "#6b5d51");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#061726";
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const c of rk.craters) {
      ctx.fillStyle = "rgba(6,23,38,0.3)";
      ctx.beginPath();
      ctx.arc(Math.cos(c.a) * rk.r * c.d, Math.sin(c.a) * rk.r * c.d, rk.r * c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawShip(t: number) {
    const { ctx } = this;
    const s = this.ship;
    const tilt = clamp(s.vy * 0.0009, -0.38, 0.38);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(tilt);

    // flame
    const flick = 1 + Math.sin(t * 42) * 0.25 + Math.random() * 0.15;
    const fLen = (this.mode === "warp" ? 46 : 20) * flick;
    const fg = ctx.createLinearGradient(-20, 0, -20 - fLen, 0);
    fg.addColorStop(0, "#fff6e3");
    fg.addColorStop(0.4, "#ffd23f");
    fg.addColorStop(1, "rgba(255,107,74,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-18, -7);
    ctx.lineTo(-20 - fLen, 0);
    ctx.lineTo(-18, 7);
    ctx.closePath();
    ctx.fill();

    // fins
    ctx.fillStyle = "#ff6b4a";
    ctx.strokeStyle = "#061726";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(-20, -19);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-20, 19);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // body
    const bg = ctx.createLinearGradient(0, -14, 0, 14);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#bfe6ff");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.quadraticCurveTo(18, -13, -2, -13);
    ctx.lineTo(-16, -9);
    ctx.lineTo(-16, 9);
    ctx.lineTo(-2, 13);
    ctx.quadraticCurveTo(18, 13, 24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // nose
    ctx.fillStyle = "#3ee6c1";
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.quadraticCurveTo(20, -8, 12, -10.5);
    ctx.lineTo(12, 10.5);
    ctx.quadraticCurveTo(20, 8, 24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // window
    ctx.fillStyle = "#0e3055";
    ctx.beginPath();
    ctx.arc(2, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5bc9ff";
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0.6, -1.4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
