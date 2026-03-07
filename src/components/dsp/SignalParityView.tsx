import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { linspace } from '@/utils/signalAnalysis';
import { motion } from 'framer-motion';
import { FlipHorizontal } from 'lucide-react';

// ─── Signal definitions ───────────────────────────────────────────────────────

const PARITY_SIGNALS = [
  {
    id: 'x1',
    latex: 'x(t) = e⁻²ᵗ · cos(t)',
    func: (t: number) => Math.exp(-2 * t) * Math.cos(t),
    defaultRange: 2,
    maxRange: 3,
  },
  {
    id: 'x2',
    latex: 'x(t) = cos(t) + sin(t) + sin(t)cos(t)',
    func: (t: number) => Math.cos(t) + Math.sin(t) + Math.sin(t) * Math.cos(t),
    defaultRange: 5,
    maxRange: 10,
  },
];

// ─── Even/Odd decomposition (no clipping — exact numerical values) ────────────

function computeParity(func: (t: number) => number, tArr: number[]) {
  return tArr.map((t) => {
    const xt  = func(t);
    const xmt = func(-t);
    const even = (xt + xmt) / 2;
    const odd  = (xt - xmt) / 2;
    return {
      t,
      original: isFinite(xt)   ? xt   : null,
      even:     isFinite(even) ? even : null,
      odd:      isFinite(odd)  ? odd  : null,
    };
  });
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLORS = {
  original: 'hsl(var(--primary))',
  even:     '#3b82f6',
  odd:      '#f59e0b',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SignalParityView: React.FC = () => {
  const [selectedSignal, setSelectedSignal] = useState(0);
  const signal = PARITY_SIGNALS[selectedSignal];

  const [tRange, setTRange] = useState(signal.defaultRange);

  // Reset range when switching signal
  const handleSelectSignal = (i: number) => {
    setSelectedSignal(i);
    setTRange(PARITY_SIGNALS[i].defaultRange);
  };

  const data = useMemo(() => {
    const t = linspace(-tRange, tRange, 800);
    return computeParity(signal.func, t);
  }, [selectedSignal, tRange]);

  const charts = [
    { key: 'original' as const, label: 'Signal original x(t)',   color: COLORS.original },
    { key: 'even'     as const, label: 'Partie paire  xₑ(t)',    color: COLORS.even },
    { key: 'odd'      as const, label: 'Partie impaire xₒ(t)',   color: COLORS.odd },
  ];

  return (
    <div className="space-y-6">
      {/* Theory card */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FlipHorizontal className="text-primary" size={18} />
          Décomposition Paire / Impaire
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm font-mono">
          <div className="p-3 rounded-lg bg-background border border-border">
            <span className="text-xs font-semibold text-muted-foreground block mb-1 uppercase tracking-wider">Partie paire</span>
            <span className="text-foreground">xₑ(t) = [x(t) + x(−t)] / 2</span>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border">
            <span className="text-xs font-semibold text-muted-foreground block mb-1 uppercase tracking-wider">Partie impaire</span>
            <span className="text-foreground">xₒ(t) = [x(t) − x(−t)] / 2</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Propriété : x(t) = xₑ(t) + xₒ(t)</p>
      </div>

      {/* Signal selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Signal</span>
        {PARITY_SIGNALS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleSelectSignal(i)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all border ${
              selectedSignal === i
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
            }`}
          >
            <span className="font-semibold mr-2">{i + 1})</span>
            <span className="font-mono">{s.latex}</span>
          </button>
        ))}
      </div>

      {/* Time range slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          Fenêtre : [−{tRange}, {tRange}]
        </span>
        <input
          type="range"
          min={0.5}
          max={signal.maxRange}
          step={0.5}
          value={tRange}
          onChange={(e) => setTRange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
      </div>

      {/* Charts */}
      <div className="space-y-5">
        {charts.map((chart, idx) => (
          <motion.div
            key={chart.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: chart.color }} />
              <span className="text-sm font-semibold text-foreground">{chart.label}</span>
            </div>
            <div className="p-4 bg-background">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={[-tRange, tRange]}
                    tickFormatter={(v) => v.toFixed(1)}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => Number(v).toFixed(2)}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(v: number) => [v.toFixed(4), chart.label]}
                    labelFormatter={(l: number) => `t = ${Number(l).toFixed(3)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={chart.key}
                    stroke={chart.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verification */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vérification</p>
        <p className="text-sm text-muted-foreground">
          x(t) = xₑ(t) + xₒ(t) — La partie paire est symétrique par rapport à l'axe des ordonnées,
          et la partie impaire est antisymétrique (xₒ(−t) = −xₒ(t)).
        </p>
      </div>
    </div>
  );
};
