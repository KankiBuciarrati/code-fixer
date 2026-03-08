import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { linspace } from '@/utils/signalAnalysis';
import { motion } from 'framer-motion';
import { GitCompare, PenLine, ChevronRight } from 'lucide-react';

// ─── Primitives ───────────────────────────────────────────────────────────────
const u  = (t: number) => t >= 0 ? 1 : 0;
const R  = (t: number) => t > 0 ? t : 0;

// ─── Safe formula evaluator ───────────────────────────────────────────────────
const mathCtx: Record<string, unknown> = {
  u, R,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  exp: Math.exp, log: Math.log, sqrt: Math.sqrt, abs: Math.abs,
  pi: Math.PI, e: Math.E,
};

function evalFormula(formula: string, tValue: number): number {
  try {
    const processed = formula
      .replace(/\s+/g, '')
      .replace(/π/g, 'pi')
      .replace(/\^/g, '**')
      .replace(/(\d)([\(a-zA-Z])/g, '$1*$2')
      .replace(/\)\(/g, ')*(');
    const fn = new Function('ctx', `with(ctx){ const t=${tValue}; return ${processed}; }`);
    const v = fn(mathCtx);
    return isFinite(v) ? v : 0;
  } catch { return 0; }
}

// ─── Signals catalogue ────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: 's1',
    name: 'Signal triangulaire',
    originalFormula: '-(t+1)*(t>=-1&&t<=0) + (1-t)*(t>0&&t<=1)',
    decompFormula:   'R(t+1) - 2*R(t) + R(t-1)',
    domain: [-3, 3] as [number, number],
  },
  {
    id: 's2',
    name: 'Porte Rect(t/2)',
    originalFormula: 'Math.abs(t)<1 ? 1 : 0',
    decompFormula:   'u(t+1) - u(t-1)',
    domain: [-4, 4] as [number, number],
  },
  {
    id: 's3',
    name: 'Rampe tronquée',
    originalFormula: 't>=0&&t<=2 ? t : (t>2&&t<=3 ? 2 : 0)',
    decompFormula:   'R(t) - R(t-2) - (R(t-2) - R(t-3))',
    domain: [-1, 5] as [number, number],
  },
  {
    id: 'custom',
    name: '✏️ Personnalisé',
    originalFormula: '',
    decompFormula:   '',
    domain: [-5, 5] as [number, number],
  },
];

const COLORS = {
  original: 'hsl(var(--primary))',
  decomp:   '#f43f5e',
};

const HINTS = [
  { label: 'u(t−a)',  example: 'u(t-2)' },
  { label: 'R(t−a)',  example: 'R(t-1)' },
  { label: 'sin(πt)', example: 'sin(pi*t)' },
  { label: 'exp(−t)', example: 'exp(-t)*u(t)' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const SignalExo6View: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // formula state (driven by preset OR user input)
  const preset = PRESETS[selectedIdx];
  const isCustom = preset.id === 'custom';

  const [origFormula, setOrigFormula]   = useState(preset.originalFormula);
  const [decompFormula, setDecompFormula] = useState(preset.decompFormula);
  const [domainMin, setDomainMin]       = useState(preset.domain[0]);
  const [domainMax, setDomainMax]       = useState(preset.domain[1]);

  // Switching preset resets all fields
  const handleSelect = (i: number) => {
    setSelectedIdx(i);
    setOrigFormula(PRESETS[i].originalFormula);
    setDecompFormula(PRESETS[i].decompFormula);
    setDomainMin(PRESETS[i].domain[0]);
    setDomainMax(PRESETS[i].domain[1]);
  };

  const insertHint = useCallback((example: string, target: 'orig' | 'decomp') => {
    if (target === 'orig')  setOrigFormula(f => f + example);
    else                    setDecompFormula(f => f + example);
  }, []);

  const data = useMemo(() => {
    const safeMin = isNaN(domainMin) ? -5 : domainMin;
    const safeMax = isNaN(domainMax) ? 5  : domainMax;
    if (safeMin >= safeMax) return [];
    const t = linspace(safeMin, safeMax, 1200);
    return t.map((ti) => ({
      t:        parseFloat(ti.toFixed(4)),
      original: evalFormula(origFormula,  ti),
      decomp:   evalFormula(decompFormula, ti),
    }));
  }, [origFormula, decompFormula, domainMin, domainMax]);

  const domainRange: [number, number] = [
    isNaN(domainMin) ? -5 : domainMin,
    isNaN(domainMax) ? 5  : domainMax,
  ];

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
            Tracez votre signal, écrivez sa décomposition en <span className="font-mono">R(t)</span> et <span className="font-mono">u(t)</span>,
            puis vérifiez graphiquement que les deux courbes coïncident.
          </p>
        </div>
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleSelect(i)}
            className={`px-3 py-2 rounded-lg text-sm font-medium text-center transition-all border ${
              selectedIdx === i
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Formula inputs — always shown, editable only in custom mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.original }} />
            Signal original f(t)
          </label>
          <input
            value={origFormula}
            onChange={(e) => setOrigFormula(e.target.value)}
            readOnly={!isCustom}
            placeholder="ex: -(t+1)*(t>=-1&&t<=0) + (1-t)*(t>0&&t<=1)"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono transition-all ${
              isCustom
                ? 'bg-background border-border focus:ring-2 focus:ring-primary/30 focus:border-primary'
                : 'bg-muted/30 border-border/50 text-muted-foreground cursor-default'
            }`}
          />
          {isCustom && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {HINTS.map(h => (
                <button key={h.label} onClick={() => insertHint(h.example, 'orig')}
                  className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono text-muted-foreground border border-border transition-colors flex items-center gap-1">
                  <ChevronRight size={10} />{h.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Decomposition */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.decomp }} />
            Décomposition en R(t) / u(t)
          </label>
          <input
            value={decompFormula}
            onChange={(e) => setDecompFormula(e.target.value)}
            readOnly={!isCustom}
            placeholder="ex: R(t+1) - 2*R(t) + R(t-1)"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono transition-all ${
              isCustom
                ? 'bg-background border-border focus:ring-2 focus:ring-primary/30 focus:border-primary'
                : 'bg-muted/30 border-border/50 text-muted-foreground cursor-default'
            }`}
          />
          {isCustom && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {HINTS.map(h => (
                <button key={h.label} onClick={() => insertHint(h.example, 'decomp')}
                  className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono text-muted-foreground border border-border transition-colors flex items-center gap-1">
                  <ChevronRight size={10} />{h.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Domain inputs (custom only) */}
      {isCustom && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Fenêtre</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">[</span>
            <input type="number" value={domainMin} onChange={e => setDomainMin(parseFloat(e.target.value))} step={0.5}
              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <span className="text-sm text-muted-foreground">,</span>
            <input type="number" value={domainMax} onChange={e => setDomainMax(parseFloat(e.target.value))} step={0.5}
              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <span className="text-sm text-muted-foreground">]</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <motion.div
        key={`${selectedIdx}-${origFormula}-${decompFormula}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 bg-muted/40 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Comparaison graphique</p>
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
                domain={domainRange}
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
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(l) => `t = ${Number(l).toFixed(3)}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line type="linear" dataKey="original" name="Signal original" stroke={COLORS.original} strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="decomp" name="Décomposition R/u(t)" stroke={COLORS.decomp} strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Tip */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">💡 Fonctions disponibles : </span>
        <span className="font-mono">u(t)</span> échelon · <span className="font-mono">R(t)</span> rampe · <span className="font-mono">sin, cos, exp, abs, sqrt</span> · constante <span className="font-mono">pi</span>
      </div>
    </div>
  );
};
