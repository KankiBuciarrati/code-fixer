import React from 'react';
import { linspace } from '@/utils/signalAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// x14(t) = Tri(t)
const x14 = (t: number): number => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0;

function numericalDerivative(func: (t: number) => number, t: number, h = 1e-5): number {
  return (func(t + h) - func(t - h)) / (2 * h);
}

const x14_d1 = (t: number): number => numericalDerivative(x14, t);
const x14_d2 = (t: number): number => numericalDerivative(x14_d1, t);

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: 'monospace',
};

export const SignalDerivativesView: React.FC = () => {
  const t = linspace(-5, 5, 1000);

  const data = t.map((ti) => {
    const v = x14(ti);
    const d1 = x14_d1(ti);
    const d2 = x14_d2(ti);
    return {
      t: parseFloat(ti.toFixed(3)),
      'x14(t)': isFinite(v) ? parseFloat(v.toFixed(5)) : null,
      "x14'(t)": isFinite(d1) ? parseFloat(d1.toFixed(5)) : null,
      "x14''(t)": isFinite(d2) && Math.abs(d2) < 500 ? parseFloat(d2.toFixed(5)) : null,
    };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dérivées de x14(t)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visualisation de la première et deuxième dérivée du signal triangle x14(t)
        </p>
      </div>

      {/* Formules */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">🧮 Formules analytiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Signal</p>
            <p className="font-mono text-primary">x14(t) = 1 − |t|</p>
            <p className="text-xs text-muted-foreground mt-1">pour |t| &lt; 1, sinon 0</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">1ère dérivée</p>
            <p className="font-mono text-primary">x14'(t) = −sgn(t)</p>
            <p className="text-xs text-muted-foreground mt-1">+1 si t&lt;0, −1 si t&gt;0 (pour |t|&lt;1)</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">2ème dérivée</p>
            <p className="font-mono text-primary text-xs">δ(t+1) − 2δ(t) + δ(t−1)</p>
            <p className="text-xs text-muted-foreground mt-1">Impulsions aux discontinuités</p>
          </div>
        </div>
      </div>

      {/* Chart 1 : signal */}
      <div className="bg-background rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">x14(t) — Signal triangle</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
              label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} domain={[-0.2, 1.3]}
              label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
            <Line type="monotone" dataKey="x14(t)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2 : première dérivée */}
      <div className="bg-background rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">x14'(t) — Première dérivée</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
              label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} domain={[-1.5, 1.5]}
              label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
            <Line type="monotone" dataKey="x14'(t)" stroke="hsl(210, 90%, 60%)" strokeWidth={2.5} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3 : deuxième dérivée */}
      <div className="bg-background rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">x14''(t) — Deuxième dérivée (impulsions de Dirac)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
              label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
              label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
            <Line type="monotone" dataKey="x14''(t)" stroke="hsl(340, 80%, 55%)" strokeWidth={2.5} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 text-center italic">
          Les pics correspondent aux impulsions δ(t+1), −2δ(t), δ(t−1)
        </p>
      </div>
    </motion.div>
  );
};
