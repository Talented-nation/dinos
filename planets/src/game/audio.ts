/* Tiny procedural WebAudio synth for game SFX — no assets. */

type OscType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture to unlock audio. */
  unlock() {
    this.ensure();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.35;
  }

  private tone(
    freq: number,
    dur = 0.12,
    type: OscType = "sine",
    vol = 1,
    slideTo?: number,
    delay = 0
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur = 0.2, vol = 0.6, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  click() { this.tone(520, 0.07, "triangle", 0.8, 660); }
  hover() { this.tone(340, 0.045, "sine", 0.35); }
  collect() { this.tone(740, 0.09, "triangle", 0.9); this.tone(1180, 0.12, "triangle", 0.8, 1400, 0.06); }
  heart() { this.tone(520, 0.1, "sine", 0.9); this.tone(780, 0.16, "sine", 0.9, undefined, 0.09); }
  hit() { this.noise(0.25, 0.9); this.tone(160, 0.28, "sawtooth", 0.8, 60); }
  wrong() { this.tone(220, 0.14, "square", 0.5, 160); this.tone(150, 0.2, "square", 0.45, 110, 0.1); }
  rotate() { this.tone(430, 0.06, "square", 0.4, 520); }
  tick() { this.tone(900, 0.05, "square", 0.35); }
  countdown() { this.tone(440, 0.12, "square", 0.6); }
  go() { this.tone(660, 0.1, "square", 0.7); this.tone(880, 0.22, "square", 0.7, undefined, 0.1); }
  crystal(i: number) { this.tone([392, 494, 587, 698][i % 4], 0.3, "triangle", 0.9); }
  crystalBad() { this.tone(180, 0.3, "sawtooth", 0.5, 120); }
  solve() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.16, "triangle", 0.9, undefined, i * 0.09));
    this.tone(1319, 0.3, "triangle", 0.8, undefined, 0.38);
  }
  fail() { [392, 330, 262, 196].forEach((n, i) => this.tone(n, 0.2, "sawtooth", 0.45, undefined, i * 0.13)); }
  warp() { this.tone(180, 0.9, "sawtooth", 0.6, 1500); this.noise(0.5, 0.5, 0.1); this.tone(90, 1.0, "sine", 0.7, 40, 0.1); }
  arrive() { this.tone(520, 0.12, "triangle", 0.8); this.tone(390, 0.18, "triangle", 0.7, undefined, 0.1); }
  victory() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((n, i) => this.tone(n, 0.18, "triangle", 0.85, undefined, i * 0.12));
  }
  gameover() { [330, 294, 262, 220, 175].forEach((n, i) => this.tone(n, 0.3, "triangle", 0.6, undefined, i * 0.2)); }
}

export const sfx = new Sfx();
