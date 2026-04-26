import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Legend, ScatterChart, Scatter,
} from 'recharts';
import { callPython } from '@/lib/pyodideRuntime';
import { usePyodide } from '@/hooks/usePyodide';

const T = 2; // période

interface TimePoint { t: number; original: number; reconstructed: number; }
interface SpectrumPoint { n: number; amplitude: number; phase: number; }
interface TrigoPoint { n: number; a_n: number; b_n: number; A_n: number; phi_n: number; }

export const SawtoothFourierView: React.FC = () => {
  const [numHarmonics, setNumHarmonics] = useState(10);
  const [timeData, setTimeData] = useState<TimePoint[]>([]);
  const [spectrumData, setSpectrumData] = useState<SpectrumPoint[]>([]);
  const [trigoCoeffs, setTrigoCoeffs] = useState<TrigoPoint[]>([]);
  const [powerNumeric, setPowerNumeric] = useState(0);
  const [powerAnalytic, setPowerAnalytic] = useState(1 / 3);
  const py = usePyodide();

  useEffect(() => {
    if (!py.ready) return;
    let cancelled = false;
    (async () => {
      const recon = await callPython<{ t: number[]; original: number[]; reconstructed: number[] }>(
        'sawtooth_reconstruct', [-1, 5, 1200, numHarmonics, T]
      );
      const spec = await callPython<SpectrumPoint[]>('sawtooth_spectrum', [numHarmonics]);
      const trigo = await callPython<TrigoPoint[]>('sawtooth_trigo_coeffs', [numHarmonics]);
      const pow = await callPython<{ numeric: number; analytic: number }>('sawtooth_power', [numHarmonics]);
      if (cancelled) return;
      setTimeData(recon.t.map((t, i) => ({
        t: parseFloat(t.toFixed(4)),
        original: recon.original[i],
        reconstructed: recon.reconstructed[i],
      })));
      setSpectrumData(spec);
      setTrigoCoeffs(trigo);
      setPowerNumeric(pow.numeric);
      setPowerAnalytic(pow.analytic);
    })();
    return () => { cancelled = true; };
  }, [numHarmonics, py.ready]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              TP2 – Exo 1
            </Badge>
            <CardTitle className="text-lg">Signal Dent de Scie – Analyse de Fourier</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dent de scie périodique x(t) de période T = {T}s, amplitude [0, 1]
          </p>
        </CardHeader>
      </Card>

      {/* Harmonics slider */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Harmoniques N =
            </span>
            <Slider
              value={[numHarmonics]}
              onValueChange={v => setNumHarmonics(v[0])}
              min={1}
              max={50}
              step={1}
              className="flex-1"
            />
            <Badge variant="secondary" className="min-w-[40px] justify-center font-mono">
              {numHarmonics}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signal" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="signal">Signal</TabsTrigger>
          <TabsTrigger value="spectrum">Spectres</TabsTrigger>
          <TabsTrigger value="trigo">Trigonométrique</TabsTrigger>
          <TabsTrigger value="harmonic">Harmonique</TabsTrigger>
          <TabsTrigger value="power">Puissance</TabsTrigger>
        </TabsList>

        {/* 1) Signal + reconstruction */}
        <TabsContent value="signal">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                1) Représentation exponentielle complexe – Reconstruction
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                x(t) = Σ c_n · e^(jnω₀t) avec c₀ = ½, c_n = j/(2πn)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="t" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} label={{ value: 't (s)', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="original" stroke="#14d296" strokeWidth={2} dot={false} name="Original x(t)" />
                  <Line type="monotone" dataKey="reconstructed" stroke="#f97316" strokeWidth={1.5} dot={false} name={`Fourier (N=${numHarmonics})`} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm font-mono text-muted-foreground">
                  <strong className="text-foreground">Coefficients :</strong>{' '}
                  c₀ = 1/2 , c_n = j/(2πn) pour n ≠ 0
                </p>
                <p className="text-sm font-mono text-muted-foreground mt-1">
                  <strong className="text-foreground">Reconstruction :</strong>{' '}
                  x(t) = 1/2 − Σ sin(nω₀t)/(πn)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2) Spectres */}
        <TabsContent value="spectrum">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spectre d'amplitude |c_n|</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={spectrumData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="n" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} label={{ value: 'n', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="amplitude" fill="#14d296" name="|c_n|" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spectre de phase ∠c_n (°)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="n" type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} name="n" label={{ value: 'n', position: 'insideBottomRight', offset: -5, style: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} domain={[-100, 100]} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                    <Scatter data={spectrumData.filter(d => d.n !== 0)} fill="#f97316" name="Phase (°)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3) Forme trigonométrique */}
        <TabsContent value="trigo">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">3) Forme trigonométrique</CardTitle>
              <p className="text-xs text-muted-foreground">
                x(t) = a₀/2 + Σ [aₙcos(nω₀t) + bₙsin(nω₀t)]
              </p>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30 mb-4">
                <p className="text-sm font-mono text-muted-foreground">
                  <strong className="text-foreground">a₀ = 1</strong> , aₙ = 0 ∀n≥1 , bₙ = −1/(πn)
                </p>
                <p className="text-sm font-mono text-muted-foreground mt-2">
                  <strong className="text-foreground">x(t) = 1/2 − Σ sin(nω₀t)/(πn)</strong>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">n</th>
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">aₙ</th>
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">bₙ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trigoCoeffs.map(c => (
                      <tr key={c.n} className="border-b border-border/10">
                        <td className="py-1.5 px-3 font-mono text-foreground">{c.n}</td>
                        <td className="py-1.5 px-3 font-mono text-muted-foreground">0</td>
                        <td className="py-1.5 px-3 font-mono text-orange-400">{c.b_n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4) Forme harmonique */}
        <TabsContent value="harmonic">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">4) Forme harmonique</CardTitle>
              <p className="text-xs text-muted-foreground">
                x(t) = A₀ + Σ Aₙcos(nω₀t + φₙ)
              </p>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30 mb-4">
                <p className="text-sm font-mono text-muted-foreground">
                  <strong className="text-foreground">A₀ = 1/2</strong> , Aₙ = 1/(πn) , φₙ = π/2 (90°)
                </p>
                <p className="text-sm font-mono text-muted-foreground mt-2">
                  <strong className="text-foreground">x(t) = 1/2 + Σ cos(nω₀t + π/2)/(πn)</strong>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">n</th>
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">Aₙ</th>
                      <th className="py-2 px-3 text-left text-muted-foreground font-medium">φₙ (°)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trigoCoeffs.map(c => (
                      <tr key={c.n} className="border-b border-border/10">
                        <td className="py-1.5 px-3 font-mono text-foreground">{c.n}</td>
                        <td className="py-1.5 px-3 font-mono text-emerald-400">{c.A_n}</td>
                        <td className="py-1.5 px-3 font-mono text-blue-400">{c.phi_n}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5) Puissance moyenne */}
        <TabsContent value="power">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">5) Puissance moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Analytique (Parseval)</p>
                  <p className="text-3xl font-black font-mono text-emerald-400">
                    {powerAnalytic.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    P = (1/T)∫|x(t)|²dt = 1/3
                  </p>
                </div>
                <div className="p-5 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Numérique (N={numHarmonics})</p>
                  <p className="text-3xl font-black font-mono text-orange-400">
                    {powerNumeric.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    P ≈ Σ|cₙ|² = {powerNumeric.toFixed(6)}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Théorème de Parseval :</strong>{' '}
                  P = Σ|cₙ|² converge vers 1/3 quand N → ∞.
                  Erreur actuelle : {Math.abs(powerAnalytic - powerNumeric).toExponential(3)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
