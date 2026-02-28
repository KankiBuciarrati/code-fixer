import React, { useState } from 'react';
import { linspace } from '@/utils/signalAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

// ─── Partie 1 : U(t) en fonction de sgn(t) ───────────────────────────────────
const sgn = (t: number): number => (t > 0 ? 1 : t < 0 ? -1 : 0);
const U_from_sgn = (t: number): number => (1 + sgn(t)) / 2;
const U = (t: number): number => (t >= 0 ? 1 : 0);

// ─── Partie 2 : Rect(2t) en fonction de U(t) ─────────────────────────────────
const Rect2t_from_U = (t: number): number => U(t + 0.25) - U(t - 0.25);
const Rect2t = (t: number): number => (Math.abs(2 * t) < 0.5 ? 1 : 0);

// ─── Partie 3 : x14(t) et ses dérivées ───────────────────────────────────────
// x14(t) = Tri(t) : signal triangle
const x14 = (t: number): number => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0;

function numericalDerivative(func: (t: number) => number, t: number, h = 1e-5): number {
  return (func(t + h) - func(t - h)) / (2 * h);
}

const x14_d1 = (t: number): number => numericalDerivative(x14, t);
const x14_d2 = (t: number): number => numericalDerivative(x14_d1, t);

// ─────────────────────────────────────────────────────────────────────────────

type ActivePart = 'part1' | 'part2' | 'part3';

export const SignalDecompositionView: React.FC = () => {
  const [activePart, setActivePart] = useState<ActivePart>('part1');

  const parts: { id: ActivePart; label: string; icon: string }[] = [
    { id: 'part1', label: 'U(t) = f(sgn(t))', icon: '1️⃣' },
    { id: 'part2', label: 'Rect(2t) = f(U(t))', icon: '2️⃣' },
    { id: 'part3', label: 'Dérivées de x14(t)', icon: '3️⃣' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Décomposition en Signaux Élémentaires</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Expression de signaux en fonction de signaux élémentaires et analyse des dérivées
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {parts.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePart(p.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePart === p.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-1.5">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="signal-card p-6">
        {activePart === 'part1' && <Part1View />}
        {activePart === 'part2' && <Part2View />}
        {activePart === 'part3' && <Part3View />}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Partie 1 : U(t) en fonction de sgn(t)
// ═══════════════════════════════════════════════════════════════════════════════

const Part1View: React.FC = () => {
  const t = linspace(-3, 3, 500);
  const data = t.map((ti) => ({
    t: parseFloat(ti.toFixed(3)),
    'sgn(t)': sgn(ti),
    'U(t) classique': U(ti),
    'U(t) = (1+sgn(t))/2': U_from_sgn(ti),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-2">🧮 Démonstration</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>On sait que :</p>
          <p className="font-mono text-primary text-center text-base py-2">
            sgn(t) = {'{'} +1 si t &gt; 0 ; −1 si t &lt; 0 ; 0 si t = 0 {'}'}
          </p>
          <p>Et on veut exprimer U(t) = {'{'} 1 si t ≥ 0 ; 0 si t &lt; 0 {'}'}</p>
          <p className="font-semibold text-foreground mt-3">Résultat :</p>
          <p className="font-mono text-primary text-center text-lg py-2 bg-primary/10 rounded-lg">
            U(t) = (1 + sgn(t)) / 2
          </p>
          <p className="text-xs mt-2">
            Vérification : si t &gt; 0 → (1+1)/2 = 1 ✓ | si t &lt; 0 → (1−1)/2 = 0 ✓
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">sgn(t)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[-1.5, 1.5]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="stepAfter" dataKey="sgn(t)" stroke="hsl(210, 90%, 60%)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">U(t) = (1 + sgn(t)) / 2</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[-0.5, 1.5]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="stepAfter" dataKey="U(t) = (1+sgn(t))/2" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="stepAfter" dataKey="U(t) classique" stroke="hsl(150, 70%, 45%)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Trait plein = (1+sgn)/2 | Pointillé = U(t) classique → identiques ✓
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Partie 2 : x₁(t) = Rect(2t) en fonction de U(t)
// ═══════════════════════════════════════════════════════════════════════════════

const Part2View: React.FC = () => {
  const t = linspace(-2, 2, 500);
  const data = t.map((ti) => ({
    t: parseFloat(ti.toFixed(3)),
    'Rect(2t)': Rect2t(ti),
    'U(t+1/4) - U(t-1/4)': Rect2t_from_U(ti),
    'U(t+1/4)': U(ti + 0.25),
    'U(t-1/4)': U(ti - 0.25),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-2">🧮 Démonstration</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>On sait que Rect(t) = U(t + ½) − U(t − ½)</p>
          <p>Donc par changement de variable (t → 2t) :</p>
          <p className="font-mono text-primary text-center text-lg py-2 bg-primary/10 rounded-lg">
            x₁(t) = Rect(2t) = U(t + ¼) − U(t − ¼)
          </p>
          <p className="text-xs mt-2">
            Rect(2t) = 1 si |2t| &lt; ½ ↔ |t| &lt; ¼, soit t ∈ ]−¼, ¼[
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Composantes : U(t+¼) et U(t−¼)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[-0.5, 1.5]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="stepAfter" dataKey="U(t+1/4)" stroke="hsl(210, 90%, 60%)" strokeWidth={2} dot={false} />
              <Line type="stepAfter" dataKey="U(t-1/4)" stroke="hsl(340, 80%, 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Résultat : Rect(2t)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[-0.5, 1.5]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="stepAfter" dataKey="U(t+1/4) - U(t-1/4)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="stepAfter" dataKey="Rect(2t)" stroke="hsl(150, 70%, 45%)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Trait plein = U(t+¼)−U(t−¼) | Pointillé = Rect(2t) → identiques ✓
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Partie 3 : x14(t) et ses dérivées
// ═══════════════════════════════════════════════════════════════════════════════

const Part3View: React.FC = () => {
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

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
  };

  return (
    <div className="space-y-6">
      {/* Theory */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">🧮 Signal x14(t) = Tri(t)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Signal</p>
            <p className="font-mono text-primary">x14(t) = 1 − |t|</p>
            <p className="text-xs text-muted-foreground mt-1">pour |t| &lt; 1, sinon 0</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">1ère dérivée</p>
            <p className="font-mono text-primary">x14'(t) = −sgn(t)</p>
            <p className="text-xs text-muted-foreground mt-1">pour |t| &lt; 1 : +1 si t&lt;0, −1 si t&gt;0</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">2ème dérivée</p>
            <p className="font-mono text-primary">x14''(t) = δ(t+1) − 2δ(t) + δ(t−1)</p>
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
    </div>
  );
};
