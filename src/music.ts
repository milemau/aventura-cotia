/** Trilha da Floresta — original score, 100 BPM, D major, 32-bar / 76.8 s loop.
 * Synthesized locally: no audio downloads, samples or external dependencies.
 */
const STEP_SECONDS = 60 / 100 / 2;
const STEPS_PER_BAR = 8;
const LOOP_STEPS = 32 * STEPS_PER_BAR;
const LOOKAHEAD = 0.15;
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

// Eighth-note melody: 0 is a rest; sustained notes leave room to breathe.
const VERSE = [
  [74, 0, 78, 81, 83, 0, 81, 78],
  [76, 0, 78, 81, 78, 0, 76, 0],
  [71, 0, 74, 78, 81, 0, 78, 74],
  [79, 0, 78, 76, 74, 0, 71, 0],
  [74, 78, 81, 0, 83, 0, 85, 83],
  [81, 0, 78, 76, 78, 0, 81, 0],
  [79, 0, 78, 74, 76, 0, 78, 76],
  [73, 0, 76, 0, 81, 0, 0, 0],
];
const BRIDGE = [
  [83, 0, 81, 78, 74, 0, 78, 0],
  [81, 0, 78, 76, 73, 0, 76, 0],
  [79, 0, 83, 86, 85, 0, 83, 81],
  [78, 0, 81, 85, 83, 0, 81, 0],
  [83, 0, 81, 78, 79, 0, 83, 0],
  [81, 0, 78, 76, 78, 0, 74, 0],
  [79, 78, 76, 0, 73, 0, 76, 0],
  [78, 0, 76, 73, 74, 0, 0, 0],
];
// D, A, Bm, G; a contrasting middle phrase returns through A to D.
const CHORDS = [[50, 62, 66, 69], [45, 61, 64, 69], [47, 62, 66, 71], [43, 62, 67, 71]];
const VERSE_CHORDS = [0, 1, 2, 3, 0, 2, 3, 1];
const BRIDGE_CHORDS = [2, 1, 3, 0, 2, 0, 1, 0];
const ARPEGGIO = [1, 2, 3, 2, 1, 2, 3, 2];

export class ForestMusic {
  private readonly output: GainNode;
  private readonly flute: PeriodicWave;
  private readonly shaker: AudioBuffer;
  private readonly voices = new Set<AudioScheduledSourceNode>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private origin = 0;
  private position = 0;
  private nextStep = 0;

  constructor(private readonly audio: AudioContext) {
    this.output = audio.createGain();
    this.output.gain.value = 0;
    this.output.connect(audio.destination);
    this.flute = audio.createPeriodicWave(new Float32Array(5), new Float32Array([0, 1, 0.18, 0.07, 0.025]));
    this.shaker = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.06), audio.sampleRate);
    const samples = this.shaker.getChannelData(0);
    let seed = 17;
    for (let i = 0; i < samples.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      samples[i] = (seed / 2 ** 32 * 2 - 1) * (1 - i / samples.length) ** 2;
    }
  }

  setPlaying(playing: boolean, reset = false) {
    if (!playing || this.audio.state !== 'running') {
      this.stop(reset);
      return;
    }
    if (this.timer !== undefined) return;
    const now = this.audio.currentTime;
    this.origin = now + 0.035 - this.position;
    this.nextStep = Math.ceil(this.position / STEP_SECONDS);
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(0, now);
    this.output.gain.linearRampToValueAtTime(0.7, now + 0.12);
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 50);
  }

  private stop(reset: boolean) {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
      const now = this.audio.currentTime;
      this.position = Math.max(0, now - this.origin) % (LOOP_STEPS * STEP_SECONDS);
      this.output.gain.cancelAndHoldAtTime(now);
      this.output.gain.linearRampToValueAtTime(0, now + 0.03);
      for (const voice of this.voices) voice.stop(now + 0.035);
    }
    if (reset) this.position = 0;
  }

  private schedule() {
    const now = this.audio.currentTime;
    // Skip missed beats after a stalled tab; never play a backlog at once.
    this.nextStep = Math.max(this.nextStep, Math.ceil((now - this.origin) / STEP_SECONDS));
    while (this.origin + this.nextStep * STEP_SECONDS < now + LOOKAHEAD) {
      this.step(this.nextStep % LOOP_STEPS, this.origin + this.nextStep * STEP_SECONDS);
      this.nextStep++;
    }
  }

  private step(step: number, time: number) {
    const bar = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    const middle = bar >= 16 && bar < 24;
    const phrase = bar % 8;
    const chord = CHORDS[(middle ? BRIDGE_CHORDS : VERSE_CHORDS)[phrase]];
    const melody = (middle ? BRIDGE : VERSE)[phrase];
    const note = melody[beat];
    if (note) {
      let length = 1;
      while (beat + length < STEPS_PER_BAR && !melody[beat + length]) length++;
      this.note(note, time, length * STEP_SECONDS * 0.88, 0.075, 'flute');
      // A soft upper sparkle in the final reprise.
      if (bar >= 24 && beat === 0) this.note(note + 12, time, 0.45, 0.018, 'sine');
    }
    this.note(chord[ARPEGGIO[beat]], time, 0.24, beat % 2 ? 0.026 : 0.038, 'triangle');
    if (beat === 0 || beat === 4) {
      this.note(chord[0] + (beat === 4 ? 7 : 0), time, 0.48, 0.075, 'sine');
      this.kick(time);
    }
    if (beat % 2 === 1 && bar >= 4) this.rustle(time, beat === 3 || beat === 7 ? 0.028 : 0.014);
  }

  private envelope(source: AudioScheduledSourceNode, time: number, duration: number, volume: number, sustain = 0, ...effects: AudioNode[]) {
    const gain = this.audio.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + Math.min(0.018, duration / 4));
    if (sustain) gain.gain.linearRampToValueAtTime(volume * 0.85, time + duration * sustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    let node: AudioNode = source;
    for (const effect of effects) { node.connect(effect); node = effect; }
    node.connect(gain);
    gain.connect(this.output);
    this.voices.add(source);
    source.onended = () => {
      source.disconnect();
      effects.forEach(effect => effect.disconnect());
      gain.disconnect();
      this.voices.delete(source);
    };
    source.start(time);
    source.stop(time + duration + 0.01);
  }

  private note(note: number, time: number, duration: number, volume: number, type: OscillatorType | 'flute') {
    const oscillator = this.audio.createOscillator();
    if (type === 'flute') oscillator.setPeriodicWave(this.flute);
    else oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency(note), time);
    this.envelope(oscillator, time, duration, volume, type === 'flute' ? 0.55 : 0);
  }

  private kick(time: number) {
    const oscillator = this.audio.createOscillator();
    oscillator.frequency.setValueAtTime(105, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.12);
    this.envelope(oscillator, time, 0.15, 0.09);
  }

  private rustle(time: number, volume: number) {
    const source = this.audio.createBufferSource();
    source.buffer = this.shaker;
    const filter = this.audio.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4500;
    this.envelope(source, time, 0.06, volume, 0, filter);
  }

  dispose() {
    this.stop(true);
    for (const voice of this.voices) voice.stop();
    this.output.disconnect();
  }
}
