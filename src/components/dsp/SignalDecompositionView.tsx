import React, { useState } from 'react';
import { linspace } from '@/utils/signalAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// ─── Partie 1 : U(t) en fonction de sgn(t) ───────────────────────────────────

const sgn = (t: number): number => (t > 0 ? 1 : t < 0 ? -1 : 0);
const U_from_sgn = (t: number): number => (1 + sgn(t)) / 2;
const U = (t: number): number => (t >= 0 ? 1 : 0);

// ─── Partie 2 : Rect(2t) en fonction de U(t) ─────────────────────────────────

// Rect(2t) = U(t + 1/4) - U(t - 1/4)
const Rect2t_from_U = (t: number): number => U(t + 0.25) - U(t - 0.25);
const Rect2t = (t: number): number => (Math.abs(2 * t) < 0.5 ? 1 : 0);

// ─── Partie 3 : Signaux avec Dirac ───────────────────────────────────────────

// x(t) = (t³ - 2t + 5)δ(3-t) = (27 - 6 + 5)δ(t-3) = 26·δ(t-3)
// y(t) = (cos(πt) - t)δ(1-t) = (cos(π) - 1)δ(t-1) = (-1-1)δ(t-1) = -2·δ(t-1)
// z(t) = (2t - 1)δ(t - 2) = (4-1)δ(t-2) = 3·δ(t-2)
// w(t) = Rect(t) * δ(t-2) = Rect(t-2) (convolution shifts by 2)

const deltaApprox = (t: number, t0: number): number => {
  const eps = 0.02;
  return (1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((t - t0) / eps) ** 2);
};

const signalX = (t: number): number => (t ** 3 - 2 * t + 5) * deltaApprox(t, 3);
const signalY = (t: number): number => (Math.cos(Math.PI * t) - t) * deltaApprox(t, 1);
const signalZ = (t: number): number => (2 * t - 1) * deltaApprox(t, 2);
const signalW = (t: number): number => (Math.abs(t - 2) <= 0.5 ? 1 : 0); // Rect(t-2)

const PART3_SIGNALS: { name: string; formula: string; func: (t: number) => number; explanation: string; color: string }[] = [
  {
    name: 'x(t)',
    formula: '(t³ - 2t + 5)δ(3-t)',
    func: signalX,
    explanation: 'f(t)δ(t₀-t) = f(t₀)δ(t-t₀) → f(3)=26, donc x(t) = 26·δ(t-3)',
    color: 'hsl(var(--primary))',
  },
  {
    name: 'y(t)',
    formula: '(cos(πt) - t)δ(1-t)',
    func: signalY,
    explanation: 'f(1) = cos(π)-1 = -2, donc y(t) = -2·δ(t-1)',
    color: 'hsl(210, 90%, 60%)',
  },
  {
    name: 'z(t)',
    formula: '(2t - 1)δ(t - 2)',
    func: signalZ,
    explanation: 'f(2) = 4-1 = 3, donc z(t) = 3·δ(t-2)',
    color: 'hsl(340, 80%, 55%)',
  },
  {
    name: 'w(t)',
    formula: 'Rect(t) * δ(t-2)',
    func: signalW,
    explanation: 'Convolution : f(t)*δ(t-a) = f(t-a), donc w(t) = Rect(t-2)',
    color: 'hsl(150, 70%, 45%)',
  },
];

type ActivePart = 'part1' | 'part2' | 'part3';

export const SignalDecompositionView: React.FC = () => {
  const [activePart, setActivePart] = useState<ActivePart>('part1');
  const [selectedPart3, setSelectedPart3] = useState(0);

  const parts: { id: ActivePart; label: string; icon: string }[] = [
    { id: 'part1', label: 'U(t) = f(sgn(t))', icon: '1️⃣' },
    { id: 'part2', label: 'Rect(2t) = f(U(t))', icon: '2️⃣' },
    { id: 'part3', label: 'Visualisation δ(t)', icon: '3️⃣' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Décomposition & Propriétés du Dirac</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Expression de signaux en fonction de signaux élémentaires et propriétés de δ(t)
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
        {activePart === 'part3' && (
          <Part3View selected={selectedPart3} onSelect={setSelectedPart3} />
        )}
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
      {/* Explanation */}
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

      {/* Charts side by side */}
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
// Partie 3 : Visualisation des signaux avec δ(t)
// ═══════════════════════════════════════════════════════════════════════════════

const Part3View: React.FC<{ selected: number; onSelect: (i: number) => void }> = ({ selected, onSelect }) => {
  const sig = PART3_SIGNALS[selected];
  const tStart = -2;
  const tEnd = 6;
  const t = linspace(tStart, tEnd, 1000);

  const data = t.map((ti) => ({
    t: parseFloat(ti.toFixed(3)),
    value: (() => { const v = sig.func(ti); return isFinite(v) ? v : null; })(),
  }));

  return (
    <div className="space-y-6">
      {/* Signal selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {PART3_SIGNALS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`text-left p-3 rounded-lg border transition-all duration-200 ${
              selected === i
                ? 'border-primary/40 bg-primary/10'
                : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <span className="font-mono text-sm font-semibold" style={{ color: s.color }}>
              {s.name}
            </span>
            <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{s.formula}</p>
          </button>
        ))}
      </div>

      {/* Explanation */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-2">🧮 {sig.name} = {sig.formula}</h3>
        <p className="text-sm text-muted-foreground">{sig.explanation}</p>
        {sig.name === 'w(t)' && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            * désigne le produit de convolution
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="bg-background rounded-xl border border-border p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="t"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Temps (t)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value: number) => [value?.toFixed(4), sig.name]}
              labelFormatter={(label) => `t = ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={sig.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
