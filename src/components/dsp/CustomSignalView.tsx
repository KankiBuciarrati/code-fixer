import React, { useState, useEffect } from 'react';
import { parseFormula, validateFormula, availableFunctions, formulaExamples } from '@/utils/formulaParser';
import { linspace } from '@/utils/signalAnalysis';
import { AlertCircle, Info, Zap, Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomSignalView: React.FC = () => {
  const [formula, setFormula] = useState('2*rect(2*t-1)');
  const [tStart, setTStart] = useState(-5);
  const [tEnd, setTEnd] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [signalData, setSignalData] = useState<{ t: number[]; values: number[] } | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [classification, setClassification] = useState('');

  const calculateSignal = () => {
    const validation = validateFormula(formula);
    if (!validation.valid) {
      setError(validation.error || 'Formule invalide');
      setSignalData(null);
      return;
    }
    setError(null);
    try {
      const t = linspace(tStart, tEnd, 500);
      const signalFunc = parseFormula(formula);
      const values = signalFunc(t);
      setSignalData({ t, values });

      const dt = (tEnd - tStart) / 500;
      const calculatedEnergy = values.reduce((sum, val) => sum + val * val * dt, 0);
      setEnergy(calculatedEnergy);

      const threshold = 1e10;
      if (calculatedEnergy < threshold && isFinite(calculatedEnergy)) {
        setClassification('Signal à énergie finie');
      } else {
        const avgPower = calculatedEnergy / (tEnd - tStart);
        if (avgPower < threshold && isFinite(avgPower)) {
          setClassification('Signal à puissance moyenne finie');
        } else {
          setClassification('Signal à puissance infinie');
        }
      }
    } catch {
      setError('Erreur lors du calcul du signal');
      setSignalData(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(calculateSignal, 500);
    return () => clearTimeout(timer);
  }, [formula, tStart, tEnd]);

  const chartData = signalData
      ? signalData.t.map((ti, i) => ({
        t: parseFloat(ti.toFixed(3)),
        value: isFinite(signalData.values[i]) ? signalData.values[i] : null,
      }))
      : [];

  const isEnergySignal = classification === 'Signal à énergie finie';

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
      >
        {/* Header */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-signal-green to-primary text-primary-foreground">
          <h2 className="text-2xl font-bold">Signal Personnalisé</h2>
          <p className="text-white/70 text-sm mt-1">Créez et analysez vos propres signaux avec des formules mathématiques</p>
        </div>

        {/* Formula Input */}
        <div className="signal-card p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Formule du signal x(t)
              </label>
              <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-primary hover:opacity-80 text-xs flex items-center gap-1 font-medium transition-opacity"
              >
                <Info size={14} />
                {showHelp ? "Masquer l'aide" : 'Aide'}
              </button>
            </div>
            <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex: 2*sin(pi*t)*rect(t/2)"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl font-mono text-base focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {error && (
                <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
            )}
          </div>

          <AnimatePresence>
            {showHelp && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                  <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-2">Fonctions de signal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {availableFunctions.signals.map((func, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <code className="px-2 py-0.5 bg-card rounded text-primary text-xs font-mono">{func.name}</code>
                              <span className="text-muted-foreground text-xs">{func.description}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-2">Exemples</h4>
                      <div className="flex flex-wrap gap-2">
                        {formulaExamples.map((example, i) => (
                            <button
                                key={i}
                                onClick={() => setFormula(example)}
                                className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 text-xs font-mono text-foreground transition-colors"
                            >
                              {example}
                            </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Interval Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">t_start</label>
              <input
                  type="number"
                  value={tStart}
                  onChange={(e) => setTStart(parseFloat(e.target.value))}
                  step={0.5}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">t_end</label>
              <input
                  type="number"
                  value={tEnd}
                  onChange={(e) => setTEnd(parseFloat(e.target.value))}
                  step={0.5}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                  onClick={calculateSignal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-semibold"
              >
                <ArrowRight size={16} />
                Calculer
              </button>
            </div>
          </div>
        </div>

        {/* Results — redesigned cards */}
        <AnimatePresence>
          {signalData && (
              <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Énergie card */}
                <div className="relative overflow-hidden rounded-2xl border border-signal-amber/30 bg-gradient-to-br from-signal-amber/10 via-signal-amber/5 to-transparent p-6">
                  {/* Glow accent */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-signal-amber/20 blur-2xl pointer-events-none" />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-signal-amber/20">
                      <Zap className="text-signal-amber" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-signal-amber uppercase tracking-widest">Énergie</p>
                      <p className="text-xs text-muted-foreground">E = ∫|x(t)|² dt</p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-signal-amber font-mono tracking-tight">
                    {energy !== null ? energy.toExponential(4) : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Joules (J)</p>
                </div>

                {/* Classification card */}
                <div className={`relative overflow-hidden rounded-2xl border p-6 ${
                    isEnergySignal
                        ? 'border-signal-green/30 bg-gradient-to-br from-signal-green/10 via-signal-green/5 to-transparent'
                        : 'border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent'
                }`}>
                  {/* Glow accent */}
                  <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
                      isEnergySignal ? 'bg-signal-green/20' : 'bg-primary/20'
                  }`} />

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                        isEnergySignal ? 'bg-signal-green/20' : 'bg-primary/20'
                    }`}>
                      <TrendingUp className={isEnergySignal ? 'text-signal-green' : 'text-primary'} size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${
                          isEnergySignal ? 'text-signal-green' : 'text-primary'
                      }`}>Classification</p>
                      <p className="text-xs text-muted-foreground">Type de signal</p>
                    </div>
                  </div>

                  <p className={`text-xl font-bold tracking-tight ${
                      isEnergySignal ? 'text-signal-green' : 'text-primary'
                  }`}>
                    {classification}
                  </p>

                  {/* Badge */}
                  <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      isEnergySignal
                          ? 'bg-signal-green/15 text-signal-green'
                          : 'bg-primary/15 text-primary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isEnergySignal ? 'bg-signal-green' : 'bg-primary'}`} />
                    {isEnergySignal ? 'Énergie finie' : 'Puissance finie'}
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Chart */}
        {signalData && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="signal-card p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Graphique: <span className="font-mono text-primary">x(t) = {formula}</span>
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                      formatter={(value: number) => [value?.toFixed(4), 'x(t)']}
                      labelFormatter={(label) => `t = ${label}`}
                  />
                  <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--signal-green))"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
        )}
      </motion.div>
  );
};