export type AudioSource = "mic" | "file";

export interface BandEnergy {
  bass: number;
  mid: number;
  treble: number;
}

export interface AudioAnalyzerState {
  waveform: Float32Array;
  spectrum: Uint8Array;
  bands: BandEnergy;
  bpm: number | null;
}

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null;
  private stream: MediaStream | null = null;

  private beatTimes: number[] = [];
  private lastEnergy = 0;
  private animFrameId: number | null = null;

  private onUpdate: (state: AudioAnalyzerState) => void;

  constructor(onUpdate: (state: AudioAnalyzerState) => void) {
    this.onUpdate = onUpdate;
  }

  async startMic() {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
    this.loop();
  }

  async startFile(file: File) {
    this.stop();
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;

    const buffer = await file.arrayBuffer();
    const decoded = await this.audioCtx.decodeAudioData(buffer);
    const src = this.audioCtx.createBufferSource();
    src.buffer = decoded;
    src.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    src.start();
    this.source = src;
    this.loop();
  }

  private loop() {
    if (!this.analyser) return;

    const waveform = new Float32Array(this.analyser.fftSize);
    const spectrum = new Uint8Array(this.analyser.frequencyBinCount);

    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(waveform);
      this.analyser.getByteFrequencyData(spectrum);

      const bands = this.computeBands(spectrum);
      const bpm = this.detectBeat(bands.bass);

      this.onUpdate({
        waveform: new Float32Array(waveform),
        spectrum: new Uint8Array(spectrum),
        bands,
        bpm,
      });
      this.animFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  private computeBands(spectrum: Uint8Array): BandEnergy {
    const len = spectrum.length;
    const bassEnd = Math.floor(len * 0.05);
    const midEnd = Math.floor(len * 0.3);

    const avg = (arr: Uint8Array, start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += arr[i];
      return sum / (end - start) / 255;
    };

    return {
      bass: avg(spectrum, 0, bassEnd),
      mid: avg(spectrum, bassEnd, midEnd),
      treble: avg(spectrum, midEnd, len),
    };
  }

  private energyHistory: number[] = [];
  private lastBeatTime = 0;

  private detectBeat(bassEnergy: number): number | null {
    const now = performance.now();

    // Maintain a rolling 1s window of bass energy samples (~60 fps -> 60 samples)
    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > 60) this.energyHistory.shift();

    const avgEnergy =
      this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Refractory period: at 200 BPM max -> 300ms minimum between beats
    const sinceLast = now - this.lastBeatTime;
    const isBeat =
      bassEnergy > 0.15 &&
      bassEnergy > avgEnergy * 1.35 &&
      sinceLast > 300;

    if (isBeat) {
      this.beatTimes.push(now);
      this.lastBeatTime = now;
      // Keep only beats from the last 5 seconds
      this.beatTimes = this.beatTimes.filter((t) => now - t < 5000);
    } else {
      // Drop very stale beats even without new ones
      this.beatTimes = this.beatTimes.filter((t) => now - t < 5000);
    }

    if (this.beatTimes.length < 3) return null;

    const intervals: number[] = [];
    for (let i = 1; i < this.beatTimes.length; i++) {
      intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
    }
    // Median is more robust than mean
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    const bpm = Math.round(60000 / median);
    return bpm >= 50 && bpm <= 200 ? bpm : null;
  }

  stop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.audioCtx) this.audioCtx.close();
    this.source = null;
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.beatTimes = [];
    this.lastEnergy = 0;
    this.energyHistory = [];
    this.lastBeatTime = 0;
  }
}
