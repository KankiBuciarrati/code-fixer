import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, TrendingDown, Zap, Waves, BookOpen, LucideIcon } from 'lucide-react';
import { linspace } from '@/utils/signalAnalysis';

// ─── Signal y(t) definition ──────────────────────────────────────────────────
// y(t) = -(t+1)  for t ∈ [-1, 0)
// y(t) =  (1-t)  for t ∈ [0, 1]
// y(t) = 0       elsewhere
// Note: discontinuity (jump of +2) at t = 0
const y = (t: number): number => {
  if (t >= -1 && t < 0) return -(t + 1);
  if (t >= 0 && t <= 1) return 1 - t;
  return 0;
};

// ─── Ramp / Step decomposition ───────────────────────────────────────────────
// y(t) = -(t+1)·[u(t+1) - u(t)] + (1-t)·[u(t) - u(t-1)]
//      = -R(t+1) + R(t) + (something for jump) ...
// Cleanest expression:
//   y(t) = -(t+1)[u(t+1)−u(t)] + (1−t)[u(t)−u(t−1)]
// Equivalent expanded form using R and u:
//   y(t) = −R(t+1) + R(t) + 2·u(t) − R(t) + R(t−1) − u(t−1)
//        = −R(t+1) + R(t−1) + 2u(t) − u(t−1) − u(t+1)·0 ...
// We display the gated form which is clearest.
const u = (t: number): number => (t >= 0 ? 1 : 0);

const yDecomp = (t: number): number =>
  -(t + 1) * (u(t + 1) - u(t)) + (1 - t) * (u(t) - u(t - 1));

// ─── Analytical first derivative ─────────────────────────────────────────────
// y'(t) = -1  for t ∈ ]-1, 0[ ∪ ]0, 1[
//       = 0   elsewhere (continuous part)
//       + 2·δ(t)   (Dirac from the +2 jump at t=0)
const yPrime = (t: number): number => {
  if (t > -1 && t < 0) return -1;
  if (t > 0  && t < 1) return -1;
  return 0;
};

// Note on derivatives:
// y'(t) = -1·[u(t+1) - u(t-1)] + 2·δ(t)
//        = -1 on ]-1, 1[ continuous part, plus a Dirac of weight +2 at t=0
// y''(t) = -δ(t+1) + δ(t-1) + 2·δ'(t)
//        = continuous part is zero everywhere
//        Diracs at t=±1 (jumps of y') + doublet at t=0 (derivative of Dirac)

// ─── Fourier Transform (numerical) ───────────────────────────────────────────
// Y(f) computed analytically:
// y(t) = -(t+1)·gate[-1,0] + (1-t)·gate[0,1]
// Using rectangular pulses centered & ramps; closed form:
// Y(f) = ∫_{-1}^{0} -(t+1) e^{-j2πft} dt + ∫_{0}^{1} (1-t) e^{-j2πft} dt
// We compute it numerically via Simpson rule for robustness.
const computeFourier = (
  fValues: number[],
  tMin: number,
  tMax: number,
  N: number,
): { f: number; re: number; im: number; mag: number; phase: number }[] => {
  const dt = (tMax - tMin) / N;
  const tArr = Array.from({ length: N + 1 }, (_, i) => tMin + i * dt);
  const yArr = tArr.map(y);

  return fValues.map((f) => {
    let re = 0;
    let im = 0;
    for (let i = 0; i < N; i++) {
      // Trapezoidal rule
      const t1 = tArr[i];
      const t2 = tArr[i + 1];
      const y1 = yArr[i];
      const y2 = yArr[i + 1];
      const w1 = 2 * Math.PI * f * t1;
      const w2 = 2 * Math.PI * f * t2;
      re += 0.5 * dt * (y1 * Math.cos(w1) + y2 * Math.cos(w2));
      im += -0.5 * dt * (y1 * Math.sin(w1) + y2 * Math.sin(w2));
    }
    const mag = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);
    return { f, re, im, mag, phase };
  });
};

// ─── Component ───────────────────────────────────────────────────────────────
type TabKey = 'signal' | 'decomp' | 'd1' | 'd2' | 'fourier';

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'signal',  label: 'Signal y(t)',          icon: Activity   },
  { key: 'decomp',  label: 'Décomposition R/u',    icon: BookOpen   },
  { key: 'd1',      label: '1ère dérivée',         icon: TrendingDown },
  { key: 'd2',      label: '2ème dérivée',         icon: Zap        },
  { key: 'fourier', label: 'Transformée Fourier',  icon: Waves      },
];

export const SignalYAnalysisView: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('signal');

  // ── Signal samples ──
  const signalData = useMemo(() => {
    const t = linspace(-3, 3, 1500);
    return t.map((ti) => ({
      t: parseFloat(ti.toFixed(4)),
      original: y(ti),
      decomp: yDecomp(ti),
    }));
  }, []);

  // ── First derivative (analytical, continuous part only) ──
  const d1Data = useMemo(() => {
    const t = linspace(-3, 3, 1500);
    return t.map((ti) => ({
      t: parseFloat(ti.toFixed(4)),
      v: yPrime(ti),
    }));
  }, []);

  // ── Fourier Transform ──
  const fourierData = useMemo(() => {
    const fValues = linspace(-5, 5, 600);
    return computeFourier(fValues, -1.5, 1.5, 2000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <Activity className="text-primary mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-foreground">
            Exercice 3 — Analyse complète du signal y(t)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Décomposition en rampe / échelon, dérivées (1ère et 2ème) et transformée de Fourier
            d'un signal triangulaire discontinu en t = 0.
          </p>
        </div>
      </div>

      {/* Definition card */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Définition analytique
        </p>
        <div className="font-mono text-sm space-y-1 text-foreground">
          <p>y(t) = −(t + 1)  pour t ∈ [−1, 0[</p>
          <p>y(t) =  (1 − t)   pour t ∈ [0, 1]</p>
          <p>y(t) =  0          ailleurs</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ Discontinuité (saut de +2) en t = 0 : y(0⁻) = −1, y(0⁺) = +1.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-all ${
              tab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden"
      >
        {tab === 'signal' && (
          <ChartFrame title="Tracé du signal y(t)" subtitle="Représentation graphique originale">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={signalData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[-3, 3]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => v.toFixed(0)}
                  label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                />
                <YAxis
                  domain={[-1.2, 1.2]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={45}
                />
                <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
                <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  labelFormatter={(l) => `t = ${Number(l).toFixed(3)}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="linear" dataKey="original" name="y(t)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}

        {tab === 'decomp' && (
          <>
            <ChartFrame
              title="Décomposition en rampe et échelon"
              subtitle="Vérification graphique : les deux courbes doivent se superposer."
            >
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={signalData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="t" type="number" domain={[-3, 3]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[-1.2, 1.2]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="linear" dataKey="original" name="y(t) original" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="linear" dataKey="decomp" name="Décomposition R/u" stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
            <div className="p-4 bg-muted/30 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Expression en fonctions porte (gates) :
              </p>
              <p className="font-mono text-sm text-foreground">
                y(t) = −(t+1)·[u(t+1) − u(t)] + (1−t)·[u(t) − u(t−1)]
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-2">
                Forme développée (rampes + échelons) :
              </p>
              <p className="font-mono text-sm text-foreground">
                y(t) = −R(t+1) + R(t) + 2·u(t) + R(t) − R(t−1) − u(t−1) − ... 
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Le saut de +2 en t = 0 est généré par le terme 2·u(t).
              </p>
            </div>
          </>
        )}

        {tab === 'd1' && (
          <>
            <ChartFrame
              title="Première dérivée  y′(t)"
              subtitle="Tracé analytique exact. La flèche rouge représente l'impulsion de Dirac."
            >
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={d1Data} margin={{ top: 30, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="t" type="number" domain={[-3, 3]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v.toFixed(0)} label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} />
                  <YAxis domain={[-2.5, 2.5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
                  <ReferenceLine x={0} stroke="#f43f5e" strokeWidth={3} label={{ value: '+2·δ(t)', fill: '#f43f5e', fontSize: 13, position: 'top', fontWeight: 'bold' }} segment={[{ x: 0, y: 0 }, { x: 0, y: 2 }]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelFormatter={(l) => `t = ${Number(l).toFixed(3)}`} />
                  <Line type="linear" dataKey="v" name="y'(t) (partie continue)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
            <div className="p-4 bg-muted/30 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expression analytique</p>
              <p className="font-mono text-sm text-foreground">y′(t) = −[u(t+1) − u(t−1)] + 2·δ(t)</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Partie continue :</span> y′(t) = −1 sur ]−1, 1[, et 0 ailleurs (les deux morceaux ont une pente de −1).
                <br />
                <span className="font-semibold text-foreground">Partie singulière :</span> le saut de +2 en t = 0 (de −1 vers +1) génère l'impulsion <span className="font-mono">2·δ(t)</span>.
              </p>
            </div>
          </>
        )}

        {tab === 'd2' && (
          <>
            <ChartFrame
              title="Seconde dérivée  y″(t)"
              subtitle="La partie continue est nulle. y″(t) est une somme de Diracs et d'un doublet."
            >
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={[{ t: -3, v: 0 }, { t: 3, v: 0 }]} margin={{ top: 40, right: 30, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="t" type="number" domain={[-3, 3]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v.toFixed(0)} label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} />
                  <YAxis domain={[-2, 2]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.6} strokeWidth={1.5} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
                  <ReferenceLine x={-1} stroke="#f43f5e" strokeWidth={3} segment={[{ x: -1, y: 0 }, { x: -1, y: -1 }]} label={{ value: '−δ(t+1)', fill: '#f43f5e', fontSize: 12, position: 'insideBottomLeft', fontWeight: 'bold' }} />
                  <ReferenceLine x={1} stroke="#f43f5e" strokeWidth={3} segment={[{ x: 1, y: 0 }, { x: 1, y: 1 }]} label={{ value: '+δ(t−1)', fill: '#f43f5e', fontSize: 12, position: 'top', fontWeight: 'bold' }} />
                  <ReferenceLine x={-0.05} stroke="#8b5cf6" strokeWidth={3} segment={[{ x: -0.05, y: 0 }, { x: -0.05, y: 1.6 }]} />
                  <ReferenceLine x={0.05} stroke="#8b5cf6" strokeWidth={3} segment={[{ x: 0.05, y: 0 }, { x: 0.05, y: -1.6 }]} label={{ value: '2·δ′(t)', fill: '#8b5cf6', fontSize: 12, position: 'insideBottomRight', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="linear" dataKey="v" name="y''(t) (partie continue = 0)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
            <div className="p-4 bg-muted/30 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expression analytique</p>
              <p className="font-mono text-sm text-foreground">y″(t) = −δ(t+1) + δ(t−1) + 2·δ′(t)</p>
              <ul className="text-xs text-muted-foreground space-y-1 mt-2 list-disc list-inside">
                <li><span className="font-mono text-foreground">−δ(t+1)</span> en t = −1 : saut de y′ de 0 → −1</li>
                <li><span className="font-mono text-foreground">+δ(t−1)</span> en t = +1 : saut de y′ de −1 → 0</li>
                <li><span className="font-mono text-foreground">2·δ′(t)</span> en t = 0 : doublet (dérivée du Dirac 2·δ provenant du saut de y)</li>
              </ul>
            </div>
          </>
        )}

        {tab === 'fourier' && (
          <>
            <ChartFrame title="Spectre d'amplitude  |Y(f)|" subtitle="Calcul numérique par intégration trapézoïdale.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fourierData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="f" type="number" domain={[-5, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'f (Hz)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelFormatter={(l) => `f = ${Number(l).toFixed(3)} Hz`} />
                  <Line type="monotone" dataKey="mag" name="|Y(f)|" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>

            <div className="border-t border-border">
              <ChartFrame title="Spectre de phase  arg(Y(f))" subtitle="En radians.">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={fourierData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="f" type="number" domain={[-5, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'f (Hz)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis domain={[-Math.PI, Math.PI]} tickFormatter={(v) => v.toFixed(1)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                    <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="linear" dataKey="phase" name="arg(Y(f))" stroke="#f43f5e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Expression analytique (par intégration directe)
              </p>
              <p className="font-mono text-sm text-foreground break-all">
                Y(f) = ∫₋₁⁰ −(t+1)·e^(−j2πft) dt + ∫₀¹ (1−t)·e^(−j2πft) dt
              </p>
              <p className="text-xs text-muted-foreground">
                Comme y(t) est <span className="font-semibold">impair</span>, Y(f) est purement imaginaire,
                donc |Y(f)| est paire et arg(Y(f)) = ±π/2 (modulo le signe).
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Helper: chart frame ─────────────────────────────────────────────────────
const ChartFrame: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <>
    <div className="px-4 py-3 bg-muted/40 border-b border-border">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4 bg-background">{children}</div>
  </>
);
