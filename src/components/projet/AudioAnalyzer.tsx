import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine, AudioAnalyzerState } from "@/lib/audioEngine";
import { Waveform } from "@/components/projet/Waveform";
import { Spectrum } from "@/components/projet/Spectrum";
import { Button } from "@/components/ui/button";
import { Mic, FileAudio, Square, Activity } from "lucide-react";

const EMPTY_WAVEFORM = new Float32Array(2048);
const EMPTY_SPECTRUM = new Uint8Array(1024);

export default function AudioAnalyzer() {
  const [state, setState] = useState<AudioAnalyzerState>({
    waveform: EMPTY_WAVEFORM,
    spectrum: EMPTY_SPECTRUM,
    bands: { bass: 0, mid: 0, treble: 0 },
    bpm: null,
  });
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"mic" | "file" | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpdate = useCallback((s: AudioAnalyzerState) => setState(s), []);

  useEffect(() => {
    engineRef.current = new AudioEngine(onUpdate);
    return () => engineRef.current?.stop();
  }, [onUpdate]);

  const startMic = async () => {
    try {
      await engineRef.current?.startMic();
      setMode("mic");
      setRunning(true);
    } catch (e) {
      console.error("Mic error:", e);
    }
  };

  const startFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await engineRef.current?.startFile(file);
    setMode("file");
    setRunning(true);
  };

  const stop = () => {
    engineRef.current?.stop();
    setRunning(false);
    setMode(null);
    setState({
      waveform: EMPTY_WAVEFORM,
      spectrum: EMPTY_SPECTRUM,
      bands: { bass: 0, mid: 0, treble: 0 },
      bpm: null,
    });
  };

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const bandConfig = [
    { key: "bass" as const, label: "Basses", color: "#14d296", desc: "0 – 5%" },
    { key: "mid" as const, label: "Médiums", color: "#38bdf8", desc: "5 – 30%" },
    { key: "treble" as const, label: "Aigus", color: "#a78bfa", desc: "30 – 100%" },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl p-7 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(13,158,110,0.10) 0%, rgba(10,20,30,0.7) 50%, rgba(56,189,248,0.06) 100%)",
          border: "1px solid rgba(20,210,150,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{
              background: "rgba(20,210,150,0.15)",
              border: "1px solid rgba(20,210,150,0.3)",
            }}
          >
            <Activity size={22} style={{ color: "#14d296" }} />
          </div>
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(20,210,150,0.7)" }}
            >
              Projet
            </span>
            <h1 className="text-2xl font-bold text-white mt-0.5">Audio Analyzer</h1>
            <p className="text-sm text-white/40 mt-1">
              Forme d'onde · Spectre FFT · Énergie par bande · BPM
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className="rounded-xl p-5 flex flex-wrap items-center gap-3"
        style={{
          background: "rgba(10,15,25,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {!running ? (
          <>
            <Button
              onClick={startMic}
              className="gap-2"
              style={{
                background: "linear-gradient(135deg, #0d9e6e, #14d296)",
                color: "white",
              }}
            >
              <Mic size={16} /> Microphone
            </Button>
            <Button
              onClick={() => fileRef.current?.click()}
              className="gap-2"
              style={{
                background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                color: "white",
              }}
            >
              <FileAudio size={16} /> Fichier audio
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={startFile}
            />
          </>
        ) : (
          <Button onClick={stop} variant="destructive" className="gap-2">
            <Square size={14} /> Arrêter
          </Button>
        )}
        {mode && (
          <span className="text-xs text-white/50 ml-2 font-mono">
            ● {mode === "mic" ? "Microphone actif" : "Lecture du fichier"}
          </span>
        )}
      </div>

      {/* Waveform */}
      <section
        className="rounded-xl p-5"
        style={{
          background: "rgba(10,15,25,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white/80">Forme d'onde</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
            Time domain
          </span>
        </div>
        <Waveform data={state.waveform} />
      </section>

      {/* Spectrum */}
      <section
        className="rounded-xl p-5"
        style={{
          background: "rgba(10,15,25,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white/80">Spectre FFT</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
            Frequency domain
          </span>
        </div>
        <Spectrum data={state.spectrum} />
      </section>

      {/* Bands + BPM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section
          className="lg:col-span-2 rounded-xl p-5"
          style={{
            background: "rgba(10,15,25,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-sm font-bold text-white/80 mb-4">Énergie par bande</h3>
          <div className="space-y-4">
            {bandConfig.map((b) => (
              <div key={b.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/70">{b.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/30">{b.desc}</span>
                    <span
                      className="font-mono font-bold w-12 text-right"
                      style={{ color: b.color }}
                    >
                      {pct(state.bands[b.key])}
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: pct(state.bands[b.key]),
                      background: `linear-gradient(90deg, ${b.color}, ${b.color}aa)`,
                      boxShadow: `0 0 12px ${b.color}80`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(20,210,150,0.08) 0%, rgba(10,15,25,0.6) 100%)",
            border: "1px solid rgba(20,210,150,0.2)",
          }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
            BPM estimé
          </span>
          <span
            className="text-6xl font-black font-mono"
            style={{
              background: "linear-gradient(135deg, #14d296, #00f5c4, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {state.bpm ?? "—"}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 mt-2">
            Beats / min
          </span>
        </section>
      </div>
    </div>
  );
}
