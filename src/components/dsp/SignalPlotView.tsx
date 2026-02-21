import React, { useState } from 'react';
import { SIGNALS } from '@/signals';
import { linspace } from '@/utils/signalAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SignalPlotView: React.FC = () => {
  const [selectedSignal, setSelectedSignal] = useState(Object.keys(SIGNALS)[0]);
  const [tStart, setTStart] = useState(-5);
  const [tEnd, setTEnd] = useState(5);

  const signal = SIGNALS[selectedSignal];
  const t = linspace(tStart, tEnd, 500);
  const values = signal.func(t);

  const data = t.map((ti, i) => ({
    t: parseFloat(ti.toFixed(3)),
    value: isFinite(values[i]) ? values[i] : null,
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signal</label>
          <select
            value={selectedSignal}
            onChange={(e) => setSelectedSignal(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {Object.keys(SIGNALS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

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
          <div className="w-full px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <span className="text-xs text-muted-foreground block">Formule</span>
            <span className="font-mono text-sm font-semibold text-primary">{signal.formula}</span>
          </div>
        </div>
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
              formatter={(value: number) => [value?.toFixed(4), selectedSignal]}
              labelFormatter={(label) => `t = ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
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
