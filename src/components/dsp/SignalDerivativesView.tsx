import React from 'react';
import { linspace } from '@/utils/signalAnalysis';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Customized,
} from 'recharts';
import { motion } from 'framer-motion';

// ─── Signal ───────────────────────────────────────────────────────────────────
// x14(t) = Tri(t) = 1 − |t|  pour |t| < 1,  0 sinon
const x14 = (t: number): number => (Math.abs(t) < 1 ? 1 - Math.abs(t) : 0);

// ─── 2ème dérivée : impulsions de Dirac ──────────────────────────────────────
// x14''(t) = δ(t+1) − 2δ(t) + δ(t−1)
// On représente chaque Dirac comme une flèche verticale.
// Dans un LineChart on ne peut pas les dessiner directement ;
// on construit des données spéciales pour chaque impulsion.

const DIRAC_IMPULSES: { t: number; weight: number; label: string }[] = [
  { t: -1, weight: +1, label: '+δ(t+1)' },
  { t:  0, weight: -2, label: '−2δ(t)'  },
  { t: +1, weight: +1, label: '+δ(t−1)' },
];

// ─── Datasets ─────────────────────────────────────────────────────────────────
const T = linspace(-2, 2, 2000);

const dataSignal = T.map((ti) => ({
  t: parseFloat(ti.toFixed(4)),
  'x14(t)': parseFloat(x14(ti).toFixed(6)),
}));

// Pour la dérivée, on construit un dataset épars avec points de discontinuité explicites
// pour obtenir des transitions verticales nettes avec type="linear"
// On insère des paires de points aux discontinuités (même t, valeurs différentes)
// afin de forcer le trait vertical.
const dataD1: Array<{ t: number; "x14'(t)": number | null }> = [
  { t: -2,         "x14'(t)": 0    },
  { t: -1 - 1e-6,  "x14'(t)": 0    },
  { t: -1,         "x14'(t)": null  }, // rupture
  { t: -1 + 1e-6,  "x14'(t)": 1    },
  { t: -1e-6,      "x14'(t)": 1    },
  { t: 0,          "x14'(t)": null  }, // rupture
  { t: 1e-6,       "x14'(t)": -1   },
  { t: 1 - 1e-6,   "x14'(t)": -1   },
  { t: 1,          "x14'(t)": null  }, // rupture
  { t: 1 + 1e-6,   "x14'(t)": 0    },
  { t: 2,          "x14'(t)": 0    },
];

// ─── Styles partagés ──────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: 'monospace',
};

const axisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
};

const gridProps = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
};

// ─── Layer SVG custom pour les flèches de Dirac (superposé au LineChart) ──────
// Recharts passe automatiquement xAxisMap / yAxisMap à tout composant enfant
// direct du LineChart. On s'en sert pour convertir les valeurs en px.
const DIRAC_COLOR = 'hsl(340, 80%, 55%)';
const ARROW_HEAD = 7;

interface DiracLayerProps {
  xAxisMap?: Record<string, { scale: (v: number) => number }>;
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
}

const DiracLayer: React.FC<DiracLayerProps> = ({ xAxisMap, yAxisMap }) => {
  if (!xAxisMap || !yAxisMap) return null;
  const xScale = xAxisMap[0]?.scale ?? xAxisMap[Object.keys(xAxisMap)[0]]?.scale;
  const yScale = yAxisMap[0]?.scale ?? yAxisMap[Object.keys(yAxisMap)[0]]?.scale;
  if (!xScale || !yScale) return null;

  const yZero = yScale(0); // px correspondant à la valeur 0 sur l'axe Y

  return (
      <g>
        {DIRAC_IMPULSES.map(({ t, weight, label }) => {
          const cx = xScale(t);

          // On utilise yScale pour positionner la pointe correctement :
          // yScale(weight) donne le px de la valeur `weight` sur l'axe Y.
          // Recharts inverse déjà l'axe (valeur haute → y petit), donc
          // weight > 0 → tipY < yZero  (flèche vers le haut) ✓
          // weight < 0 → tipY > yZero  (flèche vers le bas)  ✓
          const tipY = yScale(weight);

          // Direction en SVG : tipY < yZero → vers le haut → direction = -1
          const direction = tipY < yZero ? -1 : 1;
          const arrowBaseY = tipY - direction * ARROW_HEAD * 1.8;
          const arrowPoints = `${cx},${tipY} ${cx - ARROW_HEAD},${arrowBaseY} ${cx + ARROW_HEAD},${arrowBaseY}`;
          const weightLabel = weight > 0 ? `+${weight}` : `${weight}`;

          return (
              <g key={t}>
                {/* Trait vertical de yZero jusqu'à la base de la tête */}
                <line x1={cx} y1={yZero} x2={cx} y2={arrowBaseY}
                      stroke={DIRAC_COLOR} strokeWidth={2.5} />
                {/* Tête de flèche */}
                <polygon points={arrowPoints} fill={DIRAC_COLOR} />
                {/* Label de l'impulsion à côté de la pointe */}
                <text x={cx + 10} y={tipY}
                      fill={DIRAC_COLOR} fontSize={11} fontFamily="monospace"
                      dominantBaseline="middle">
                  {label}
                </text>
                {/* Poids en gras au-delà de la pointe */}
                <text x={cx} y={tipY - direction * 16}
                      fill={DIRAC_COLOR} fontSize={11} fontFamily="monospace"
                      fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                  {weightLabel}
                </text>
              </g>
          );
        })}
      </g>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export const SignalDerivativesView: React.FC = () => {
  return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dérivées de x₁₄(t)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualisation de la première et deuxième dérivée du signal triangle x₁₄(t) = Tri(t)
          </p>
        </div>

        {/* Formules analytiques */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3">🧮 Formules analytiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signal</p>
              <p className="font-mono text-primary">x₁₄(t) = 1 − |t|,  |t| &lt; 1</p>
              <p className="font-mono text-primary">x₁₄(t) = 0,  sinon</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">1ère dérivée</p>
              <p className="font-mono text-primary">x₁₄'(t) = +1,  −1 &lt; t &lt; 0</p>
              <p className="font-mono text-primary">x₁₄'(t) = −1,   0 &lt; t &lt; 1</p>
              <p className="font-mono text-primary">x₁₄'(t) =  0,  sinon</p>
              <p className="text-xs text-muted-foreground mt-1">Discontinuités en t = −1, 0, +1</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">2ème dérivée</p>
              <p className="font-mono text-primary text-xs leading-relaxed">
                x₁₄''(t) = δ(t+1) − 2δ(t) + δ(t−1)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Distribution : impulsions de Dirac aux points de discontinuité de la dérivée
              </p>
            </div>
          </div>
        </div>

        {/* Chart 1 : signal */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">x₁₄(t) — Signal triangle</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataSignal} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="t" {...axisProps} type="number" domain={[-2, 2]}
                     ticks={[-2, -1, 0, 1, 2]} tickFormatter={(v) => `${v}`}
                     label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis {...axisProps} domain={[-0.2, 1.3]}
                     label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} />
              <Line type="linear" dataKey="x14(t)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 : première dérivée analytique */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            x₁₄'(t) — Première dérivée <span className="text-xs font-normal">(analytique, signal porte)</span>
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataD1} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="t" {...axisProps} type="number" domain={[-2, 2]}
                     ticks={[-2, -1, 0, 1, 2]} tickFormatter={(v) => `${v}`}
                     label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis {...axisProps} domain={[-1.5, 1.5]}
                     label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} />
              {/* Marquer les discontinuités */}
              {[-1, 0, 1].map((t) => (
                  <ReferenceLine key={t} x={t} stroke="hsl(210, 90%, 60%)" strokeDasharray="4 4" strokeOpacity={0.5} />
              ))}
              <Line
                  type="linear"
                  dataKey="x14'(t)"
                  stroke="hsl(210, 90%, 60%)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center italic">
            Les lignes pointillées indiquent les discontinuités en t = −1, 0, +1
          </p>
        </div>

        {/* Chart 3 : deuxième dérivée — Recharts + layer SVG flèches Dirac */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            x₁₄''(t) — Deuxième dérivée{' '}
            <span className="text-xs font-normal">(distribution : impulsions de Dirac)</span>
          </h4>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart
                data={[{ t: -2 }, { t: 2 }]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                  dataKey="t"
                  {...axisProps}
                  type="number"
                  domain={[-2, 2]}
                  ticks={[-2, -1, 0, 1, 2]}
                  tickFormatter={(v) => `${v}`}
                  label={{ value: 't', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                  {...axisProps}
                  domain={[-3, 3]}
                  ticks={[-2, -1, 0, 1, 2]}
                  label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `t = ${l}`} />
              {/* Ligne zéro */}
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} />
              {/* Lines pointillées aux positions des Diracs */}
              {DIRAC_IMPULSES.map(({ t }) => (
                  <ReferenceLine key={t} x={t} stroke={DIRAC_COLOR} strokeDasharray="4 4" strokeOpacity={0.4} />
              ))}
              {/* Customized est le mécanisme officiel Recharts pour accéder aux scales */}
              <Customized component={(props: any) => <DiracLayer {...props} />} />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-muted-foreground mt-2 text-center italic">
            Les flèches représentent les impulsions de Dirac — hauteur proportionnelle au poids
          </p>
        </div>
      </motion.div>
  );
};