import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { linspace } from '@/utils/signalAnalysis';
import { motion } from 'framer-motion';
import { GitCompare } from 'lucide-react';

// ─── Primitives ───────────────────────────────────────────────────────────────
const u  = (t: number) => t >= 0 ? 1 : 0;
const R  = (t: number) => t > 0 ? t : 0;   // rampe unitaire

// ─── Signals catalogue ────────────────────────────────────────────────────────
const SIGNALS = [
  {
    id: 's1',
    name: 'Signal triangulaire y(t)',
    original: (t: number) => {
      if (t >= -1 && t <= 0) return -(t + 1);
      if (t > 0  && t <= 1)  return 1 - t;
      return 0;
    },
    decomp: (t: number) => R(t + 1) - 2 * R(t) + R(t - 1),
    formula: 'y(t) = R(t+1) − 2R(t) + R(t−1)',
    components: [
      { label: 'R(t+1)',   color: '#3b82f6', fn: (t: number) =>  R(t + 1) },
      { label: '−2R(t)',   color: '#f59e0b', fn: (t: number) => -2 * R(t) },
      { label: 'R(t−1)',   color: '#10b981', fn: (t: number) =>  R(t - 1) },
    ],
    domain: [-3, 3] as [number, number],
  },
  {
    id: 's2',
    name: 'Porte Rect(t/2)',
    original: (t: number) => Math.abs(t) < 1 ? 1 : (Math.abs(t) === 1 ? 0.5 : 0),
    decomp: (t: number) => u(t + 1) - u(t - 1),
    formula: 'Rect(t/2) = u(t+1) − u(t−1)',
    components: [
      { label: 'u(t+1)',   color: '#3b82f6', fn: (t: number) => u(t + 1) },
      { label: '−u(t−1)',  color: '#f59e0b', fn: (t: number) => -u(t - 1) },
    ],
    domain: [-4, 4] as [number, number],
  },
  {
    id: 's3',
    name: 'Rampe tronquée x(t)',
    original: (t: number) => {
      if (t >= 0 && t <= 2) return t;
      if (t > 2 && t <= 3)  return 2;
      return 0;
    },
    decomp: (t: number) => R(t) - R(t - 2) - (R(t - 2) - R(t - 3)),
    formula: 'x(t) = R(t) − R(t−2) − [R(t−2) − R(t−3)]',
    components: [
      { label: 'R(t)',     color: '#3b82f6', fn: (t: number) =>  R(t) },
      { label: '−R(t−2)',  color: '#f59e0b', fn: (t: number) => -R(t - 2) },
      { label: '−R(t−2)', color: '#10b981', fn: (t: number) => -(R(t - 2) - R(t - 3)) },
    ],
    domain: [-1, 5] as [number, number],
  },
  {
    id: 's4',
    name: 'Échelon décalé U(t−2)',
    original: (t: number) => t >= 2 ? 1 : 0,
    decomp: (t: number) => u(t - 2),
    formula: 'u(t−2)',
    components: [
      { label: 'u(t−2)', color: '#3b82f6', fn: (t: number) => u(t - 2) },
    ],
    domain: [-1, 5] as [number, number],
  },
];

const COLORS = {
  original: 'hsl(var(--primary))',
  decomp:   '#f43f5e',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const SignalExo6View: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showComponents, setShowComponents] = useState(false);

  const sig = SIGNALS[selectedIdx];

  const data = useMemo(() => {
    const t = linspace(sig.domain[0], sig.domain[1], 1200);
    return t.map((ti) => {
      const row: Record<string, number | null> = { t: parseFloat(ti.toFixed(4)) };
      row.original = sig.original(ti);
      row.decomp   = sig.decomp(ti);
      if (showComponents) {
        sig.components.forEach((c, i) => { row[`c${i}`] = c.fn(ti); });
      }
      return row;
    });
  }, [selectedIdx, showComponents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <GitCompare className="text-primary mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-foreground">
            Exercice 6 — Représentation en Rampe &amp; Échelon
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Comparer le tracé original d'un signal avec sa décomposition analytique
            en fonctions Rampe <span className="font-mono">R(t)</span> et Échelon <span className="font-mono">u(t)</span>.
          </p>
        </div>
      </div>

      {/* Signal selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SIGNALS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSelectedIdx(i)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all border ${
              selectedIdx === i
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
            }`}
          >
            <span className="font-semibold mr-2">{i + 1}.</span>
            {s.name}
          </button>
        ))}
      </div>

      {/* Formula card */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Décomposition analytique</p>
          <p className="font-mono text-base text-primary font-semibold">{sig.formula}</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowComponents((v) => !v)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
              showComponents
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {showComponents ? '▼ Masquer' : '▶ Voir'} les composantes
          </button>
        </div>
      </div>

      {/* Comparison chart */}
      <motion.div
        key={selectedIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 bg-muted/40 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Comparaison : signal original vs décomposition</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Les deux courbes doivent se superposer parfaitement pour valider la décomposition.
          </p>
        </div>
        <div className="p-4 bg-background">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="t"
                type="number"
                domain={sig.domain}
                tickFormatter={(v) => v.toFixed(1)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
              />
              <YAxis
                tickFormatter={(v) => Number(v).toFixed(1)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={45}
              />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
              <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.4} strokeWidth={1.5} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(l) => `t = ${Number(l).toFixed(3)}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

              {/* Original signal */}
              <Line
                type="linear"
                dataKey="original"
                name="Signal original"
                stroke={COLORS.original}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />

              {/* Decomposition */}
              <Line
                type="linear"
                dataKey="decomp"
                name="Décomposition R/u(t)"
                stroke={COLORS.decomp}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
              />

              {/* Optional components */}
              {showComponents &&
                sig.components.map((c, i) => (
                  <Line
                    key={`c${i}`}
                    type="linear"
                    dataKey={`c${i}`}
                    name={c.label}
                    stroke={c.color}
                    strokeWidth={1.5}
                    strokeDasharray="2 4"
                    dot={false}
                    isAnimationActive={false}
                    opacity={0.7}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Verification note */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">💡 Principe : </span>
        Toute fonction définie par morceaux peut s'exprimer à l'aide de rampes <span className="font-mono text-foreground">R(t) = t·u(t)</span> et
        d'échelons <span className="font-mono text-foreground">u(t)</span>. La courbe en tirets rouges doit se superposer exactement
        au signal bleu, confirmant l'équivalence analytique.
      </div>
    </div>
  );
};
