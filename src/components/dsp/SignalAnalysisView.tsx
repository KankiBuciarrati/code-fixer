import React, { useState } from 'react';
import { SignalPlotView } from './SignalPlotView';
import { EnergyClassificationView } from './EnergyClassificationView';
import { PowerCalculationView } from './PowerCalculationView';
import { motion } from 'framer-motion';

type TabType = 'plot' | 'energy' | 'power';

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'plot', label: 'Visualisation', icon: '📊' },
  { id: 'energy', label: 'Classification Énergétique', icon: '⚡' },
  { id: 'power', label: 'Calcul de Puissance', icon: '🔋' },
];

export const SignalAnalysisView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('plot');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signaux et Analyse Énergétique</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analyse des signaux mathématiques et classification énergétique
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="signal-card p-6">
        {activeTab === 'plot' && <SignalPlotView />}
        {activeTab === 'energy' && <EnergyClassificationView />}
        {activeTab === 'power' && <PowerCalculationView />}
      </div>
    </motion.div>
  );
};
