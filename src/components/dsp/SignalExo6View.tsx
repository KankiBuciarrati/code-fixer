import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { linspace, calculateEnergy } from '@/utils/signalAnalysis';
import { motion } from 'framer-motion';
import { BarChart2, BookOpen } from 'lucide-react';

// ─── Signal y(t) ──────────────────────────────────────────────────────────────
// y(t) = -(t+1) pour -1 ≤ t ≤ 0  →  0 à t=-1, -1 à t=0
//        (1-t)   pour  0 ≤ t ≤ 1  →  1 à t=0,   0 à t=1
//        0 ailleurs
const yFunc = (ti: number): number => {
  if (ti >= -1 && ti <= 0) return -(ti + 1);   // descend de 0 à -1
  if (ti > 0 && ti <= 1)   return 1 - ti;       // descend de 1 à 0
  return 0;
};

const QUESTIONS = [
  {
    num: 1,
    question: 'Classifier ce signal.',
    answer:
      'y(t) est à support borné (nul hors de [−1, 1]). Son énergie est finie → signal à énergie finie (signal énergie).',
  },
  {
    num: 2,
    question: "Déterminer l'expression analytique du signal.",
    answer:
      'y(t) = −(t+1)[u(t+1)−u(t)] + (1−t)[u(t)−u(t−1)]\n= R(t+1) − 2R(t) + R(t−1)  avec R(t) = t·u(t) (rampe)',
  },
  {
    num: 3,
    question: 'Calculer son énergie.',
    answer: '',   // calculé dynamiquement ci-dessous
  },
  {
    num: 4,
    question: 'Peut-on exprimer ce signal en fonction de Ramp et échelon ?',
    answer:
      'Oui : y(t) = R(t+1) − 2R(t) + R(t−1)\noù R(t) = t·u(t) est la rampe unitaire.\nCela correspond à la dérivée de la fonction triangle Tri(t).',
  },
  {
    num: 5,
    question:
      'Comment peut-on transformer y(t) en signal périodique ? (justifier)',
    answer:
      "On effectue une répétition périodique par convolution avec un peigne de Dirac :\n  y_p(t) = y(t) * Σ δ(t − nT)  avec T = 2\nOu par la relation : y_p(t) = Σ y(t − nT).\nLa période naturelle est T = 2 (durée du support de y).",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SignalExo6View: React.FC = () => {
  const tArr = useMemo(() => linspace(-3, 3, 1200), []);

  const data = useMemo(
    () =>
      tArr.map((t) => ({
        t: parseFloat(t.toFixed(4)),
        y: yFunc(t),
      })),
    [],
  );

  // Énergie analytique = 1/3 + 1/3 = 2/3
  const energyAnalytic = 2 / 3;
  const energyNumeric = useMemo(() => {
    const vals = tArr.map(yFunc);
    const dt = tArr[1] - tArr[0];
    return calculateEnergy(vals, dt, 'simpson');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <BarChart2 className="text-primary mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-foreground">
            Exercice 6 — Signal y(t)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Signal triangulaire asymétrique défini sur [−1, 1], nul ailleurs.
          </p>
          <p className="font-mono text-sm text-primary mt-2">
            y(t) = −(t+1)·[u(t+1)−u(t)] + (1−t)·[u(t)−u(t−1)]
          </p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm font-semibold text-foreground">Tracé du signal y(t)</span>
        </div>
        <div className="p-4 bg-background">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="t"
                type="number"
                domain={[-3, 3]}
                ticks={[-3, -2, -1, 0, 1, 2, 3]}
                tickFormatter={(v) => v.toFixed(0)}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 't', position: 'insideRight', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
              />
              <YAxis
                domain={[-1.2, 1.2]}
                ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
                tickFormatter={(v) => v.toFixed(2)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'y(t)', angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                width={55}
              />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.5} strokeWidth={1.5} />
              <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.5} strokeWidth={1.5} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [v.toFixed(4), 'y(t)']}
                labelFormatter={(l) => `t = ${Number(l).toFixed(3)}`}
              />
              <Line
                type="linear"
                dataKey="y"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <BookOpen size={15} />
          Questions &amp; Réponses
        </div>

        {QUESTIONS.map((q, idx) => (
          <motion.div
            key={q.num}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            {/* Question header */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {q.num}
              </span>
              <span className="text-sm font-medium text-foreground">{q.question}</span>
            </div>

            {/* Answer */}
            <div className="px-4 py-3 bg-background">
              {q.num === 3 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Calcul analytique :
                  </p>
                  <div className="font-mono text-xs bg-muted/30 rounded-lg p-3 space-y-1 text-foreground">
                    <p>E = ∫₋₁⁰ (t+1)² dt  +  ∫₀¹ (1−t)² dt</p>
                    <p>  = [<sup>(t+1)³</sup>/<sub>3</sub>]₋₁⁰  +  [−<sup>(1−t)³</sup>/<sub>3</sub>]₀¹</p>
                    <p>  = 1/3  +  1/3  = <strong>2/3 ≈ {energyAnalytic.toFixed(4)}</strong></p>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-semibold">
                      E analytique = {energyAnalytic.toFixed(6)}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground font-mono">
                      E numérique ≈ {energyNumeric.toFixed(6)}
                    </span>
                  </div>
                </div>
              ) : (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {q.answer}
                </pre>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
