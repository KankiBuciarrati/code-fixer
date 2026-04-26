import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceDot,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, GitBranch, TrendingUp, Waves } from 'lucide-react';
import { callPython } from '@/lib/pyodideRuntime';
import { usePyodide } from '@/hooks/usePyodide';

// ─── Component ───────────────────────────────────────────────────────
type Tab = 'signal' | 'decomp' | 'deriv' | 'fourier';

interface TPt { t: number; y: number; decomp: number; b1: number; b2: number; yp: number; }
interface FPt { f: number; mag: number; phase: number; im: number; }

export const SignalYAnalysisView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('signal');
  const py = usePyodide();
  const [tData, setTData] = useState<TPt[]>([]);
  const [fData, setFData] = useState<FPt[]>([]);

  useEffect(() => {
    if (!py.ready) return;
    let cancelled = false;
    (async () => {
      const [td, fd] = await Promise.all([
        callPython<TPt[]>('y_time_series', [-3, 3, 1500]),
        callPython<FPt[]>('y_freq_series', [-5, 5, 1500]),
      ]);
      if (cancelled) return;
      setTData(td);
      setFData(fd);
    })();
    return () => { cancelled = true; };
  }, [py.ready]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'signal',  label: 'Signal y(t)',        icon: Activity },
    { id: 'decomp',  label: 'Décomposition R/u',  icon: GitBranch },
    { id: 'deriv',   label: 'Dérivées y′, y″',    icon: TrendingUp },
    { id: 'fourier', label: 'Transformée Y(f)',   icon: Waves },
  ];

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <Activity className="text-primary mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-foreground">
            Exercice 3 — Analyse complète du signal y(t)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Triangle discontinu : <span className="font-mono">y(t) = −(t+1)</span> sur [−1, 0[ et <span className="font-mono">y(t) = 1−t</span> sur [0, 1], avec un saut de <span className="font-mono">+2</span> en <span className="font-mono">t = 0</span>.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              tab === id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 'signal'  && <SignalTab data={tData} />}
        {tab === 'decomp'  && <DecompTab data={tData} />}
        {tab === 'deriv'   && <DerivTab  data={tData} />}
        {tab === 'fourier' && <FourierTab data={fData} />}
      </motion.div>
    </div>
  );
};

// ─── Tab: Signal y(t) ─────────────────────────────────────────────────
const SignalTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-4">
    <FormulaBox title="Définition par morceaux">
      <div className="font-mono text-sm space-y-1">
        <div>y(t) = <span className="text-primary">−(t + 1)</span> &nbsp; pour &nbsp; t ∈ [−1, 0[</div>
        <div>y(t) = <span className="text-primary">1 − t</span> &nbsp;&nbsp;&nbsp;&nbsp; pour &nbsp; t ∈ [0, 1]</div>
        <div>y(t) = <span className="text-muted-foreground">0</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ailleurs</div>
        <div className="pt-2 text-xs text-muted-foreground">
          Discontinuité (saut de <span className="font-mono">+2</span>) en <span className="font-mono">t = 0</span> : y(0⁻) = −1, y(0⁺) = +1.
        </div>
      </div>
    </FormulaBox>

    <ChartCard title="Tracé du signal y(t)">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="t" type="number" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis domain={[-1.3, 1.3]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `t = ${Number(l).toFixed(3)}`}
            formatter={(v: number) => v.toFixed(3)}
          />
          <Line type="linear" dataKey="y" name="y(t)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <ReferenceDot x={0} y={-1} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
          <ReferenceDot x={0} y={1}  r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// ─── Tab: Décomposition R/u ──────────────────────────────────────────
const DecompTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-4">
    <FormulaBox title="Expression en fonction de R(t) et u(t)">
      <div className="font-mono text-sm space-y-2">
        <div className="text-muted-foreground text-xs">Avec les fenêtres rectangulaires <span className="font-mono">[u(t+1) − u(t)]</span> et <span className="font-mono">[u(t) − u(t−1)]</span> :</div>
        <div>y(t) = <span className="text-amber-500">−(t+1)·[u(t+1) − u(t)]</span> + <span className="text-emerald-500">(1−t)·[u(t) − u(t−1)]</span></div>
        <div className="pt-2 text-muted-foreground text-xs">Forme développée avec <span className="font-mono">R(t) = t·u(t)</span> :</div>
        <div className="text-xs">y(t) = −R(t+1) + 2·R(t) − R(t−1) + 2·u(t) − u(t+1) − u(t−1)</div>
      </div>
    </FormulaBox>

    <ChartCard title="Reconstruction par briques élémentaires">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="t" type="number" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis domain={[-1.3, 1.3]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `t = ${Number(l).toFixed(3)}`}
            formatter={(v: number) => v.toFixed(3)}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Line type="linear" dataKey="b1" name="−(t+1)·[u(t+1)−u(t)]" stroke="#f59e0b" strokeWidth={1.8} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
          <Line type="linear" dataKey="b2" name="(1−t)·[u(t)−u(t−1)]"  stroke="#10b981" strokeWidth={1.8} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
          <Line type="linear" dataKey="decomp" name="Somme = y(t)"     stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// ─── Tab: Dérivées ───────────────────────────────────────────────────
const DerivTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-4">
    <FormulaBox title="Première dérivée y′(t)">
      <div className="font-mono text-sm space-y-1">
        <div>y′(t) = <span className="text-rose-500">−1</span> sur ]−1, 0[ ∪ ]0, 1[ &nbsp; + &nbsp; <span className="text-primary">2·δ(t)</span></div>
        <div className="text-xs text-muted-foreground pt-1">
          Pente constante <span className="font-mono">−1</span> sur le support, plus une impulsion de Dirac de poids <span className="font-mono">+2</span> due au saut en t = 0.
        </div>
      </div>
    </FormulaBox>

    <ChartCard title="y′(t) — partie continue + Dirac">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="t" type="number" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis domain={[-1.5, 2.4]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `t = ${Number(l).toFixed(3)}`}
          />
          <Line type="linear" dataKey="yp" name="y′(t) (partie continue)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 0, y: 2 }]} stroke="#f43f5e" strokeWidth={3} />
          <ReferenceDot x={0} y={2} r={5} fill="#f43f5e" stroke="hsl(var(--background))" strokeWidth={2}
            label={{ value: '+2δ(t)', position: 'top', fill: '#f43f5e', fontSize: 12, fontWeight: 600 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <FormulaBox title="Deuxième dérivée y″(t)">
      <div className="font-mono text-sm space-y-1">
        <div>y″(t) = <span className="text-rose-500">−δ(t+1)</span> + <span className="text-emerald-500">δ(t−1)</span> + <span className="text-primary">2·δ′(t)</span></div>
        <div className="text-xs text-muted-foreground pt-1">
          Les pentes constantes disparaissent ; subsistent les Dirac aux bords du support et le doublet <span className="font-mono">δ′(t)</span> issu de la dérivation du saut.
        </div>
      </div>
    </FormulaBox>

    <ChartCard title="y″(t) — Diracs et doublet">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="t" type="number" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis domain={[-2.4, 2.4]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={45} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `t = ${Number(l).toFixed(3)}`}
          />
          <Line type="linear" dataKey={() => 0} name="y″(t) (continu = 0)" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} isAnimationActive={false} />

          {/* −δ(t+1) */}
          <ReferenceLine segment={[{ x: -1, y: 0 }, { x: -1, y: -1 }]} stroke="#f43f5e" strokeWidth={3} />
          <ReferenceDot x={-1} y={-1} r={5} fill="#f43f5e" stroke="hsl(var(--background))" strokeWidth={2}
            label={{ value: '−δ(t+1)', position: 'bottom', fill: '#f43f5e', fontSize: 11, fontWeight: 600 }} />

          {/* +δ(t-1) */}
          <ReferenceLine segment={[{ x: 1, y: 0 }, { x: 1, y: 1 }]} stroke="#10b981" strokeWidth={3} />
          <ReferenceDot x={1} y={1} r={5} fill="#10b981" stroke="hsl(var(--background))" strokeWidth={2}
            label={{ value: '+δ(t−1)', position: 'top', fill: '#10b981', fontSize: 11, fontWeight: 600 }} />

          {/* 2·δ'(t) doublet */}
          <ReferenceLine segment={[{ x: -0.05, y: 0 }, { x: -0.05, y: 2 }]} stroke="hsl(var(--primary))" strokeWidth={3} />
          <ReferenceDot x={-0.05} y={2} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
          <ReferenceLine segment={[{ x: 0.05, y: 0 }, { x: 0.05, y: -2 }]} stroke="hsl(var(--primary))" strokeWidth={3} />
          <ReferenceDot x={0.05} y={-2} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2}
            label={{ value: '2·δ′(t)', position: 'bottom', fill: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// ─── Tab: Fourier ────────────────────────────────────────────────────
const FourierTab: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-4">
    <FormulaBox title="Calcul analytique via la dérivée seconde">
      <div className="font-mono text-sm space-y-2">
        <div className="text-xs text-muted-foreground">À partir de y″(t) = −δ(t+1) + δ(t−1) + 2·δ′(t) :</div>
        <div>Y″(f) = −e^(+j2πf) + e^(−j2πf) + 2·(j2πf) = −2j·sin(2πf) + j4πf</div>
        <div className="text-xs text-muted-foreground pt-1">Or Y″(f) = (j2πf)²·Y(f) = −4π²f²·Y(f), donc :</div>
        <div className="text-primary">Y(f) = j · [2·sin(2πf) − 4πf] / (4π²f²)</div>
        <div className="text-xs text-muted-foreground pt-1">
          → Y(f) est <span className="font-semibold">imaginaire pur</span> ⇒ phase ∈ {`{ +π/2, −π/2 }`}.
        </div>
      </div>
    </FormulaBox>

    <ChartCard title="Spectre d'amplitude |Y(f)|">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="f" type="number" domain={[-5, 5]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'f (Hz)', position: 'insideRight', offset: -5, fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} tickFormatter={v => v.toFixed(2)} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `f = ${Number(l).toFixed(3)} Hz`}
            formatter={(v: number) => v.toFixed(4)}
          />
          <Line type="monotone" dataKey="mag" name="|Y(f)|" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="Spectre de phase ∠Y(f) (en multiples de π)">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="f" type="number" domain={[-5, 5]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis domain={[-0.7, 0.7]} ticks={[-0.5, 0, 0.5]}
            tickFormatter={v => `${v}π`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `f = ${Number(l).toFixed(3)} Hz`}
            formatter={(v: number) => `${v.toFixed(2)}π`}
          />
          <Line type="stepAfter" dataKey="phase" name="∠Y(f) / π" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="Partie imaginaire Im{Y(f)} (la partie réelle est nulle)">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="f" type="number" domain={[-5, 5]} tickFormatter={v => v.toFixed(0)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={50} tickFormatter={v => v.toFixed(2)} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={l => `f = ${Number(l).toFixed(3)} Hz`}
            formatter={(v: number) => v.toFixed(4)}
          />
          <Line type="monotone" dataKey="im" name="Im{Y(f)}" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// ─── UI helpers ─────────────────────────────────────────────────────
const FormulaBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
    <div className="px-4 py-2.5 bg-muted/60 border-b border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <div className="px-4 py-3 bg-muted/40 border-b border-border">
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    <div className="p-4 bg-background">{children}</div>
  </div>
);
