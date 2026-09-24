/** Tiny WebAudio chiptune engine: looped square-wave song + retro SFX. No files needed. */
type Ctor = typeof AudioContext;
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const MELODY = [76, 0, 79, 81, 79, 76, 74, 72, 74, 0, 76, 79, 77, 76, 74, 0, 72, 0, 76, 79, 81, 79, 77, 76, 74, 76, 77, 79, 76, 0, 0, 0];
const BASS = [48, 48, 55, 55, 50, 50, 57, 57, 53, 53, 48, 48, 55, 55, 48, 48];
const EIGHTH = 60 / 132 / 2;

export class Chip {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextAt = 0;
  muted = false;

  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const C: Ctor | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.16, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = 'square', vol = 0.5, slideTo?: number) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(this.master);
    o.start(at); o.stop(at + dur + 0.02);
  }

  startMusic() {
    if (!this.ctx || this.timer) return;
    this.step = 0; this.nextAt = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => {
      if (!this.ctx) return;
      while (this.nextAt < this.ctx.currentTime + 0.3) {
        const m = MELODY[this.step % MELODY.length];
        if (m) this.tone(midi(m), this.nextAt, EIGHTH * 0.9, 'square', 0.22);
        if (this.step % 2 === 0) {
          const b = BASS[(this.step / 2) % BASS.length];
          this.tone(midi(b), this.nextAt, EIGHTH * 1.8, 'triangle', 0.5);
        }
        this.step++; this.nextAt += EIGHTH;
      }
    }, 90);
  }

  stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  sfx(name: 'jump' | 'coin' | 'chest' | 'blip' | 'select' | 'win' | 'start') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump': this.tone(300, t, 0.14, 'square', 0.25, 700); break;
      case 'coin': this.tone(midi(88), t, 0.07, 'square', 0.25); this.tone(midi(93), t + 0.07, 0.16, 'square', 0.25); break;
      case 'blip': this.tone(midi(84), t, 0.03, 'square', 0.08); break;
      case 'select': this.tone(midi(79), t, 0.06, 'square', 0.2); this.tone(midi(84), t + 0.06, 0.08, 'square', 0.2); break;
      case 'start': [72, 76, 79, 84].forEach((n, i) => this.tone(midi(n), t + i * 0.08, 0.12, 'square', 0.25)); break;
      case 'chest': [67, 71, 74, 79, 83, 86].forEach((n, i) => this.tone(midi(n), t + i * 0.06, 0.14, 'square', 0.22)); break;
      case 'win': [72, 76, 79, 84, 79, 84, 88, 91].forEach((n, i) => this.tone(midi(n), t + i * 0.12, i === 7 ? 0.8 : 0.16, 'square', 0.28)); break;
    }
  }

  close() { this.stopMusic(); this.ctx?.close().catch(() => {}); this.ctx = null; }
}
