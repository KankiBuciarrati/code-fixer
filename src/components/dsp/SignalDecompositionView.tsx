import React, { useState } from 'react';
import { SIGNALS } from '@/signals';
import { linspace } from '@/utils/signalAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

// Signaux de base pour la décomposition
const BASE_SIGNALS = {
  'Rect(t)': (t: number) => Math.abs(t) < 0.5 ? 1 : 0,
  'Tri(t)': (t: number) => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0,
  'U(t)': (t: number) => t >= 0 ? 1 : 0,
  'δ(t)': (t: number) => {
    const eps = 0.01;
    return (1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (t / eps) ** 2);
  },
  'R(t)': (t: number) => t > 0 ? t : 0,
};

// Décompositions connues pour chaque signal
interface DecompositionStep {
  description: string;
  formula: string;
  evaluate: (t: number) => number;
}

interface SignalDecomposition {
  original: string;
  steps: DecompositionStep[];
  finalFormula: string;
}

const DECOMPOSITIONS: Record<string, SignalDecomposition> = {
  'x1(t)': {
    original: '2Rect(2t-1)',
    steps: [
      {
        description: 'Rect(t) centré en 0, largeur 1',
        formula: 'Rect(t)',
        evaluate: (t) => Math.abs(t) < 0.5 ? 1 : 0,
      },
      {
        description: 'Compression temporelle : Rect(2t) → largeur 1/2',
        formula: 'Rect(2t)',
        evaluate: (t) => Math.abs(2 * t) < 0.5 ? 1 : 0,
      },
      {
        description: 'Décalage : Rect(2t-1) = Rect(2(t-0.5)) → centré en t=0.5',
        formula: 'Rect(2t-1)',
        evaluate: (t) => Math.abs(2 * t - 1) < 0.5 ? 1 : 0,
      },
      {
        description: 'Amplification : 2×Rect(2t-1)',
        formula: '2Rect(2t-1)',
        evaluate: (t) => 2 * (Math.abs(2 * t - 1) < 0.5 ? 1 : 0),
      },
    ],
    finalFormula: '2 × Rect(2t - 1)',
  },
  'x2(t)': {
    original: 'sin(πt)Rect(t/2)',
    steps: [
      {
        description: 'Rect(t/2) → fenêtre de largeur 2 centrée en 0',
        formula: 'Rect(t/2)',
        evaluate: (t) => Math.abs(t / 2) < 0.5 ? 1 : 0,
      },
      {
        description: 'sin(πt) → sinusoïde de fréquence 1/2',
        formula: 'sin(πt)',
        evaluate: (t) => Math.sin(Math.PI * t),
      },
      {
        description: 'Produit : sin(πt) × Rect(t/2) → sinusoïde fenêtrée',
        formula: 'sin(πt)Rect(t/2)',
        evaluate: (t) => Math.sin(Math.PI * t) * (Math.abs(t / 2) < 0.5 ? 1 : 0),
      },
    ],
    finalFormula: 'sin(πt) × Rect(t/2)',
  },
  'x3(t)': {
    original: 'Tri(2t)',
    steps: [
      {
        description: 'Tri(t) → triangle de largeur 2 centré en 0',
        formula: 'Tri(t)',
        evaluate: (t) => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0,
      },
      {
        description: 'Compression : Tri(2t) → triangle de largeur 1',
        formula: 'Tri(2t)',
        evaluate: (t) => { const s = 2 * t; return Math.abs(s) < 1 ? 1 - Math.abs(s) : 0; },
      },
    ],
    finalFormula: 'Tri(2t)',
  },
  'x4(t)': {
    original: 'U(t-2)',
    steps: [
      {
        description: 'U(t) → échelon unitaire en t=0',
        formula: 'U(t)',
        evaluate: (t) => t >= 0 ? 1 : 0,
      },
      {
        description: 'Décalage : U(t-2) → échelon à partir de t=2',
        formula: 'U(t-2)',
        evaluate: (t) => t >= 2 ? 1 : 0,
      },
    ],
    finalFormula: 'U(t - 2)',
  },
  'x5(t)': {
    original: 'U(3-t)',
    steps: [
      {
        description: 'U(t) → échelon unitaire',
        formula: 'U(t)',
        evaluate: (t) => t >= 0 ? 1 : 0,
      },
      {
        description: 'Retournement : U(-t) → échelon inversé',
        formula: 'U(-t)',
        evaluate: (t) => -t >= 0 ? 1 : 0,
      },
      {
        description: 'Décalage : U(3-t) = U(-(t-3)) → actif pour t ≤ 3',
        formula: 'U(3-t)',
        evaluate: (t) => t <= 3 ? 1 : 0,
      },
    ],
    finalFormula: 'U(3 - t)',
  },
  'x7(t)': {
    original: 'Rect((t-1)/2)-Rect((t+1)/2)',
    steps: [
      {
        description: 'Rect((t-1)/2) → rectangle centré en t=1, largeur 2',
        formula: 'Rect((t-1)/2)',
        evaluate: (t) => Math.abs((t - 1) / 2) < 0.5 ? 1 : 0,
      },
      {
        description: 'Rect((t+1)/2) → rectangle centré en t=-1, largeur 2',
        formula: 'Rect((t+1)/2)',
        evaluate: (t) => Math.abs((t + 1) / 2) < 0.5 ? 1 : 0,
      },
      {
        description: 'Différence des deux rectangles',
        formula: 'Rect((t-1)/2) - Rect((t+1)/2)',
        evaluate: (t) => (Math.abs((t - 1) / 2) < 0.5 ? 1 : 0) - (Math.abs((t + 1) / 2) < 0.5 ? 1 : 0),
      },
    ],
    finalFormula: 'Rect((t-1)/2) - Rect((t+1)/2)',
  },
  'x8(t)': {
    original: 'Tri(t-1)-Tri(t+1)',
    steps: [
      {
        description: 'Tri(t-1) → triangle centré en t=1',
        formula: 'Tri(t-1)',
        evaluate: (t) => { const s = t - 1; return Math.abs(s) < 1 ? 1 - Math.abs(s) : 0; },
      },
      {
        description: 'Tri(t+1) → triangle centré en t=-1',
        formula: 'Tri(t+1)',
        evaluate: (t) => { const s = t + 1; return Math.abs(s) < 1 ? 1 - Math.abs(s) : 0; },
      },
      {
        description: 'Différence : Tri(t-1) - Tri(t+1)',
        formula: 'Tri(t-1) - Tri(t+1)',
        evaluate: (t) => {
          const a = t - 1, b = t + 1;
          return (Math.abs(a) < 1 ? 1 - Math.abs(a) : 0) - (Math.abs(b) < 1 ? 1 - Math.abs(b) : 0);
        },
      },
    ],
    finalFormula: 'Tri(t-1) - Tri(t+1)',
  },
  'x9(t)': {
    original: 'Rect(t/2)-Tri(t)',
    steps: [
      {
        description: 'Rect(t/2) → rectangle de largeur 2',
        formula: 'Rect(t/2)',
        evaluate: (t) => Math.abs(t / 2) < 0.5 ? 1 : 0,
      },
      {
        description: 'Tri(t) → triangle de largeur 2',
        formula: 'Tri(t)',
        evaluate: (t) => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0,
      },
      {
        description: 'Différence : Rect(t/2) - Tri(t)',
        formula: 'Rect(t/2) - Tri(t)',
        evaluate: (t) => (Math.abs(t / 2) < 0.5 ? 1 : 0) - (Math.abs(t) < 1 ? 1 - Math.abs(t) : 0),
      },
    ],
    finalFormula: 'Rect(t/2) - Tri(t)',
  },
  'x10(t)': {
    original: 'exp(-t)U(t-2)',
    steps: [
      {
        description: 'U(t-2) → échelon à partir de t=2',
        formula: 'U(t-2)',
        evaluate: (t) => t >= 2 ? 1 : 0,
      },
      {
        description: 'exp(-t) → exponentielle décroissante',
        formula: 'exp(-t)',
        evaluate: (t) => Math.exp(-t),
      },
      {
        description: 'Produit : exp(-t) × U(t-2)',
        formula: 'exp(-t)U(t-2)',
        evaluate: (t) => Math.exp(-t) * (t >= 2 ? 1 : 0),
      },
    ],
    finalFormula: 'exp(-t) × U(t - 2)',
  },
  'x12(t)': {
    original: 'R(t+1)-2R(t)+R(t-1)',
    steps: [
      {
        description: 'R(t+1) → rampe décalée à t=-1',
        formula: 'R(t+1)',
        evaluate: (t) => t + 1 > 0 ? t + 1 : 0,
      },
      {
        description: '-2R(t) → rampe inversée ×2 à t=0',
        formula: '-2R(t)',
        evaluate: (t) => -2 * (t > 0 ? t : 0),
      },
      {
        description: 'R(t-1) → rampe décalée à t=1',
        formula: 'R(t-1)',
        evaluate: (t) => t - 1 > 0 ? t - 1 : 0,
      },
      {
        description: 'Somme : R(t+1) - 2R(t) + R(t-1) = Tri(t)',
        formula: 'R(t+1) - 2R(t) + R(t-1)',
        evaluate: (t) => (t + 1 > 0 ? t + 1 : 0) - 2 * (t > 0 ? t : 0) + (t - 1 > 0 ? t - 1 : 0),
      },
    ],
    finalFormula: 'R(t+1) - 2R(t) + R(t-1)',
  },
  'x6(t)': {
    original: '2δ(t+1)-δ(t-2)+δ(t)-2δ(t-1)',
    steps: [
      {
        description: '2δ(t+1) → Dirac d\'amplitude 2 en t=-1',
        formula: '2δ(t+1)',
        evaluate: (t) => {
          const eps = 0.01;
          return 2 * (1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((t + 1) / eps) ** 2);
        },
      },
      {
        description: '-δ(t-2) → Dirac négatif en t=2',
        formula: '-δ(t-2)',
        evaluate: (t) => {
          const eps = 0.01;
          return -(1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((t - 2) / eps) ** 2);
        },
      },
      {
        description: 'δ(t) → Dirac en t=0',
        formula: 'δ(t)',
        evaluate: (t) => {
          const eps = 0.01;
          return (1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (t / eps) ** 2);
        },
      },
      {
        description: '-2δ(t-1) → Dirac d\'amplitude -2 en t=1',
        formula: '-2δ(t-1)',
        evaluate: (t) => {
          const eps = 0.01;
          return -2 * (1 / (eps * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((t - 1) / eps) ** 2);
        },
      },
    ],
    finalFormula: '2δ(t+1) - δ(t-2) + δ(t) - 2δ(t-1)',
  },
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 90%, 60%)',
  'hsl(340, 80%, 55%)',
  'hsl(150, 70%, 45%)',
  'hsl(45, 90%, 55%)',
];

export const SignalDecompositionView: React.FC = () => {
  const signalNames = Object.keys(DECOMPOSITIONS);
  const [selectedSignal, setSelectedSignal] = useState(signalNames[0]);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [showOriginal, setShowOriginal] = useState(true);

  const decomp = DECOMPOSITIONS[selectedSignal];
  const originalSignal = SIGNALS[selectedSignal];

  const tStart = -5;
  const tEnd = 5;
  const t = linspace(tStart, tEnd, 500);

  const originalValues = originalSignal.func(t);

  const data = t.map((ti, idx) => {
    const point: Record<string, number | null> = {
      t: parseFloat(ti.toFixed(3)),
    };
    if (showOriginal) {
      point['original'] = isFinite(originalValues[idx]) ? originalValues[idx] : null;
    }
    visibleSteps.forEach((stepIdx) => {
      const val = decomp.steps[stepIdx].evaluate(ti);
      point[`step_${stepIdx}`] = isFinite(val) ? val : null;
    });
    return point;
  });

  const toggleStep = (idx: number) => {
    setVisibleSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const showAllSteps = () => {
    setVisibleSteps(decomp.steps.map((_, i) => i));
  };

  const resetView = () => {
    setVisibleSteps([]);
    setShowOriginal(true);
  };

  // Reset visible steps when signal changes
  const handleSignalChange = (name: string) => {
    setSelectedSignal(name);
    setVisibleSteps([]);
    setShowOriginal(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Décomposition en Signaux Élémentaires</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Exprimez chaque signal en fonction des signaux de base : Rect, Tri, U, δ, R
        </p>
      </div>

      {/* Signal selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Signal à décomposer
          </label>
          <select
            value={selectedSignal}
            onChange={(e) => handleSignalChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {signalNames.map((name) => (
              <option key={name} value={name}>
                {name} = {DECOMPOSITIONS[name].original}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="w-full px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <span className="text-xs text-muted-foreground block">Décomposition finale</span>
            <span className="font-mono text-sm font-semibold text-primary">{decomp.finalFormula}</span>
          </div>
        </div>
      </div>

      {/* Step toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Étapes de décomposition</h3>
          <div className="flex gap-2">
            <button
              onClick={showAllSteps}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              Tout afficher
            </button>
            <button
              onClick={resetView}
              className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {decomp.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => toggleStep(idx)}
              className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                visibleSteps.includes(idx)
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[(idx + 1) % COLORS.length] }}
                />
                <span className="font-mono text-xs font-semibold text-primary">{step.formula}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">{step.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle original */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-all ${
            showOriginal
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
          Afficher le signal original {selectedSignal}
        </button>
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
            />
            <Legend />
            {showOriginal && (
              <Line
                type="monotone"
                dataKey="original"
                name={`${selectedSignal} (original)`}
                stroke={COLORS[0]}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
            )}
            {visibleSteps.map((stepIdx) => (
              <Line
                key={stepIdx}
                type="monotone"
                dataKey={`step_${stepIdx}`}
                name={decomp.steps[stepIdx].formula}
                stroke={COLORS[(stepIdx + 1) % COLORS.length]}
                strokeWidth={2}
                dot={false}
                strokeDasharray={stepIdx < decomp.steps.length - 1 ? '5 3' : undefined}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Base signals reference */}
      <div className="bg-muted/30 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">📚 Signaux de base utilisés</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(BASE_SIGNALS).map(([name]) => (
            <div key={name} className="text-center p-2 rounded-lg bg-background border border-border">
              <span className="font-mono text-sm font-semibold text-primary">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
