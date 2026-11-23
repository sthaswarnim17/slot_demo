/** Tiny synthesized sound kit (Web Audio). No audio files, so nothing to license. */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  unlock() { this.ensure(); }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, delay = 0, slide = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Bell-like chime made of inharmonic partials. */
  chime(base = 660, delay = 0, vol = 0.35) {
    this.tone(base, 1.2, 'sine', vol, delay);
    this.tone(base * 2.76, 0.6, 'sine', vol * 0.35, delay);
    this.tone(base * 5.4, 0.3, 'sine', vol * 0.15, delay);
  }

  spin() { this.tone(180, 0.18, 'triangle', 0.25, 0, 2.2); }
  land(col: number) { this.tone(140 + col * 12, 0.09, 'triangle', 0.18); }
  win(step: number) {
    const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    this.chime(scale[Math.min(step, scale.length - 1)]);
  }
  pop() { this.tone(900, 0.12, 'square', 0.06, 0, 0.4); }
  lantern() { this.chime(988, 0, 0.3); this.chime(1319, 0.08, 0.2); }
  scatter() { this.chime(392, 0, 0.4); this.chime(523, 0.12, 0.35); this.chime(784, 0.24, 0.3); }
  ember() { this.tone(220, 0.5, 'sawtooth', 0.08, 0, 3); this.chime(1175, 0.2, 0.3); }
  bigWin() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.chime(f, i * 0.11, 0.3)); }
  click() { this.tone(1200, 0.04, 'square', 0.04); }
}
