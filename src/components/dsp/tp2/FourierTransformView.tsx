import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { linspace } from '@/utils/signalAnalysis';

// --- Primitive signals ---
const Rect = (t: number): number => Math.abs(t) < 0.5 ? 1 : (Math.abs(t) === 0.5 ? 0.5 : 0);
const Tri = (t: number): number => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0;

// --- Signals ---
const x = (t: number) => Math.cos(6 * Math.PI * t);
const x1 = (t: number) => Tri(2 * t);
const x2 = (t: number) => Rect((t - 1) / 2) - Rect((t + 1) / 2);
const x3 = (t: number) => Tri(t - 1) - Tri(t + 1);
const x4 = (t: number) => Rect(t / 2) - Tri(t);

// --- Fourier Transforms (analytical, via properties) ---
// TF[cos(2πf₀t)] = ½[δ(f-f₀) + δ(f+f₀)], f₀=3
// For plotting we use sinc-based approximations for continuous spectra

// sinc(x) = sin(πx)/(πx)
const sinc = (x: number): number => {
  if (Math.abs(x) < 1e-10) return 1;
  return Math.sin(Math.PI * x) / (Math.PI * x);
};

// TF[Rect(t)] = sinc(f)
// TF[Tri(t)] = sinc²(f)
// Properties used:
// Changement d'échelle: x(at) -> (1/|a|)X(f/a)
// Décalage temporel: x(t-t₀) -> X(f)·e^{-j2πft₀}
// Linéarité: ax(t)+by(t) -> aX(f)+bY(f)

// X(f) = cos(6πt) -> ½[δ(f-3)+δ(f+3)]  (impulses, shown as tall spikes)
// X1(f) = Tri(2t) -> (1/2)sinc²(f/2)
// X2(f) = Rect((t-1)/2) - Rect((t+1)/2)
//       = 2sinc(2f)e^{-j2πf} - 2sinc(2f)e^{j2πf}
//       = 2sinc(2f)·(-2j·sin(2πf)) = -4j·sinc(2f)·sin(2πf)
//       |X2| = 4|sinc(2f)·sin(2πf)|, phase = -π/2 sign(sin(2πf))
// X3(f) = sinc²(f)e^{-j2πf} - sinc²(f)e^{j2πf} = -2j·sinc²(f)·sin(2πf)
//       |X3| = 2|sinc²(f)·sin(2πf)|
// X4(f) = 2sinc(2f) - sinc²(f)

interface SignalDef {
  name: string;
  label: string;
  formula: string;
  tfFormula: string;
  tfProperties: string[];
  timeFn: (t: number) => number;
  ampFn: (f: number) => number;
  phaseFn: (f: number) => number;
  hasImpulse?: boolean;
  impulses?: { f: number; weight: number }[];
}

const signals: SignalDef[] = [
  {
    name: 'x',
    label: 'x(t) = cos(6πt)',
    formula: 'x(t) = cos(2π·3·t)',
    tfFormula: 'X(f) = ½[δ(f−3) + δ(f+3)]',
    tfProperties: ['Directe: TF[cos(2πf₀t)] = ½[δ(f−f₀) + δ(f+f₀)]'],
    timeFn: x,
    ampFn: () => 0, // continuous part is zero
    phaseFn: () => 0,
    hasImpulse: true,
    impulses: [{ f: 3, weight: 0.5 }, { f: -3, weight: 0.5 }],
  },
  {
    name: 'x1',
    label: 'x₁(t) = Tri(2t)',
    formula: 'x₁(t) = Tri(2t)',
    tfFormula: 'X₁(f) = ½ sinc²(f/2)',
    tfProperties: [
      'TF[Tri(t)] = sinc²(f)',
      'Changement d\'échelle: x(at) → (1/|a|)X(f/a)',
      'Donc TF[Tri(2t)] = (1/2)sinc²(f/2)',
    ],
    timeFn: x1,
    ampFn: (f: number) => 0.5 * sinc(f / 2) ** 2,
    phaseFn: () => 0,
  },
  {
    name: 'x2',
    label: 'x₂(t) = Rect((t−1)/2) − Rect((t+1)/2)',
    formula: 'x₂(t) = Rect((t−1)/2) − Rect((t+1)/2)',
    tfFormula: 'X₂(f) = −4j·sinc(2f)·sin(2πf)',
    tfProperties: [
      'TF[Rect(t)] = sinc(f)',
      'Changement d\'échelle: Rect(t/2) → 2sinc(2f)',
      'Décalage: x(t−t₀) → X(f)·e^{−j2πft₀}',
      'X₂ = 2sinc(2f)[e^{−j2πf} − e^{j2πf}] = −4j·sinc(2f)·sin(2πf)',
    ],
    timeFn: x2,
    ampFn: (f: number) => 4 * Math.abs(sinc(2 * f) * Math.sin(2 * Math.PI * f)),
    phaseFn: (f: number) => {
      const val = sinc(2 * f) * Math.sin(2 * Math.PI * f);
      if (Math.abs(val) < 1e-10) return 0;
      return val > 0 ? -90 : 90; // -π/2 or π/2
    },
  },
  {
    name: 'x3',
    label: 'x₃(t) = Tri(t−1) − Tri(t+1)',
    formula: 'x₃(t) = Tri(t−1) − Tri(t+1)',
    tfFormula: 'X₃(f) = −2j·sinc²(f)·sin(2πf)',
    tfProperties: [
      'TF[Tri(t)] = sinc²(f)',
      'Décalage: x(t−t₀) → X(f)·e^{−j2πft₀}',
      'X₃ = sinc²(f)[e^{−j2πf} − e^{j2πf}] = −2j·sinc²(f)·sin(2πf)',
    ],
    timeFn: x3,
    ampFn: (f: number) => 2 * Math.abs(sinc(f) ** 2 * Math.sin(2 * Math.PI * f)),
    phaseFn: (f: number) => {
      const val = sinc(f) ** 2 * Math.sin(2 * Math.PI * f);
      if (Math.abs(val) < 1e-10) return 0;
      return val > 0 ? -90 : 90;
    },
  },
  {
    name: 'x4',
    label: 'x₄(t) = Rect(t/2) − Tri(t)',
    formula: 'x₄(t) = Rect(t/2) − Tri(t)',
    tfFormula: 'X₄(f) = 2sinc(2f) − sinc²(f)',
    tfProperties: [
      'TF[Rect(t)] = sinc(f), TF[Tri(t)] = sinc²(f)',
      'Changement d\'échelle: Rect(t/2) → 2sinc(2f)',
      'Linéarité: X₄ = 2sinc(2f) − sinc²(f)',
    ],
    timeFn: x4,
    ampFn: (f: number) => Math.abs(2 * sinc(2 * f) - sinc(f) ** 2),
    phaseFn: (f: number) => {
      const val = 2 * sinc(2 * f) - sinc(f) ** 2;
      if (Math.abs(val) < 1e-10) return 0;
      return val < 0 ? 180 : 0;
    },
  },
];

const CHART_STYLE = {
  grid: 'rgba(255,255,255,0.06)',
  axis: 'rgba(255,255,255,0.4)',
  ref: 'rgba(255,255,255,0.15)',
  tooltip: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
};

export const FourierTransformView: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const sig = signals[selected];

  const timeData = useMemo(() => {
    const t = linspace(-3, 3, 800);
    return t.map(ti => ({
      t: parseFloat(ti.toFixed(4)),
      value: sig.timeFn(ti),
    }));
  }, [sig]);

  const freqData = useMemo(() => {
    const f = linspace(-6, 6, 800);
    return f.map(fi => ({
      f: parseFloat(fi.toFixed(4)),
      amplitude: sig.ampFn(fi),
      phase: sig.phaseFn(fi),
    }));
  }, [sig]);

  // For impulse signals, create spike data
  const impulseData = useMemo(() => {
    if (!sig.hasImpulse || !sig.impulses) return [];
    const pts: { f: number; amplitude: number }[] = [];
    sig.impulses.forEach(imp => {
      pts.push({ f: imp.f - 0.001, amplitude: 0 });
      pts.push({ f: imp.f, amplitude: imp.weight });
      pts.push({ f: imp.f + 0.001, amplitude: 0 });
    });
    return pts.sort((a, b) => a.f - b.f);
  }, [sig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              TP2 – Exo 2
            </Badge>
            <CardTitle className="text-lg">Transformée de Fourier – Propriétés</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Calculer et visualiser la TF en utilisant uniquement les propriétés
          </p>
        </CardHeader>
      </Card>

      {/* Signal selector */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap gap-2">
            {signals.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSelected(i)}
                className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${
                  selected === i
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50'
                }`}
              >
                {s.name}(t)
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-sm font-mono text-foreground">{sig.formula}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="time" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="time">Signal</TabsTrigger>
          <TabsTrigger value="amplitude">|X(f)|</TabsTrigger>
          <TabsTrigger value="phase">Phase</TabsTrigger>
          <TabsTrigger value="properties">Propriétés</TabsTrigger>
        </TabsList>

        {/* Signal temporel */}
        <TabsContent value="time">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Signal temporel {sig.name}(t)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="t" stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }}
                    label={{ value: 't (s)', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={CHART_STYLE.ref} />
                  <ReferenceLine x={0} stroke={CHART_STYLE.ref} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} />
                  <Line type="monotone" dataKey="value" stroke="#14d296" strokeWidth={2} dot={false} name={sig.name + '(t)'} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spectre d'amplitude */}
        <TabsContent value="amplitude">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spectre d'amplitude |{sig.name.toUpperCase()}(f)|</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{sig.tfFormula}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={sig.hasImpulse ? impulseData : freqData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="f" stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }}
                    label={{ value: 'f (Hz)', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={CHART_STYLE.ref} />
                  <ReferenceLine x={0} stroke={CHART_STYLE.ref} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} />
                  <Line type="monotone" dataKey="amplitude" stroke="#f97316" strokeWidth={2} dot={false} name="|X(f)|" />
                </LineChart>
              </ResponsiveContainer>
              {sig.hasImpulse && (
                <div className="mt-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note :</strong> Le spectre contient des impulsions de Dirac à f = ±3 Hz (poids ½).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spectre de phase */}
        <TabsContent value="phase">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spectre de phase ∠{sig.name.toUpperCase()}(f) (°)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={freqData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="f" stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }}
                    label={{ value: 'f (Hz)', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fontSize: 11 }} domain={[-200, 200]} />
                  <ReferenceLine y={0} stroke={CHART_STYLE.ref} />
                  <ReferenceLine x={0} stroke={CHART_STYLE.ref} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} />
                  <Line type="stepAfter" dataKey="phase" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Phase (°)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Propriétés utilisées */}
        <TabsContent value="properties">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Propriétés de la TF utilisées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm font-mono text-foreground mb-2">{sig.formula}</p>
                <p className="text-sm font-mono text-emerald-400">{sig.tfFormula}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Étapes de calcul :</p>
                {sig.tfProperties.map((prop, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                    <Badge variant="secondary" className="min-w-[24px] justify-center mt-0.5">{i + 1}</Badge>
                    <p className="text-sm font-mono text-muted-foreground">{prop}</p>
                  </div>
                ))}
              </div>

              {/* Properties table */}
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Table des propriétés de la TF</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">Propriété</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">Temporel</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">Fréquentiel</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {[
                        ['Linéarité', 'ax(t)+by(t)', 'aX(f)+bY(f)'],
                        ['Décalage temporel', 'x(t±t₀)', 'X(f)·e^{±j2πft₀}'],
                        ['Décalage fréquentiel', 'x(t)e^{±j2πf₀t}', 'X(f∓f₀)'],
                        ['Convolution', 'x(t)*y(t)', 'X(f)·Y(f)'],
                        ['Dérivée', 'dⁿx(t)/dtⁿ', '(j2πf)ⁿX(f)'],
                        ['Modulation', 'x(t)cos(2πf₀t)', '½[X(f−f₀)+X(f+f₀)]'],
                        ['Dualité', 'X(t)', 'x(−f)'],
                        ['Changement d\'échelle', 'x(at)', '(1/|a|)X(f/a)'],
                      ].map(([prop, temp, freq]) => (
                        <tr key={prop} className="border-b border-border/10">
                          <td className="py-1.5 px-3 text-foreground text-sm font-sans">{prop}</td>
                          <td className="py-1.5 px-3 text-orange-400">{temp}</td>
                          <td className="py-1.5 px-3 text-emerald-400">{freq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
