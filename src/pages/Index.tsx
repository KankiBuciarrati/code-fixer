import React, { useState } from 'react';
import { DspSidebar } from '@/components/dsp/DspSidebar';
import { DspTopbar } from '@/components/dsp/DspTopbar';
import { DspDashboard } from '@/components/dsp/DspDashboard';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getExerciseById } from '@/config/navigation';

const Index = () => {
  const [activeTP, setActiveTP] = useState<string | null>(null);
  const [activeExo, setActiveExo] = useState<string | null>(null);

  const handleTPChange = (tpId: string) => {
    setActiveTP(tpId);
    setActiveExo(null);
  };

  const handleExoChange = (tpId: string, exoId: string) => {
    setActiveTP(tpId);
    setActiveExo(exoId);
  };

  const handleBackToDashboard = () => {
    setActiveTP(null);
    setActiveExo(null);
  };

  const currentExo = activeTP && activeExo ? getExerciseById(activeTP, activeExo) : null;
  const ExerciseComponent = currentExo?.component;

  return (
    <div className="flex h-screen bg-background relative">
      <AnimatedBackground />
      <DspSidebar
        activeTP={activeTP || ''}
        activeExo={activeExo || ''}
        onTPChange={handleTPChange}
        onExoChange={handleExoChange}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DspTopbar
          activeTP={activeTP}
          activeExo={activeExo}
          onBackToDashboard={handleBackToDashboard}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            {ExerciseComponent ? (
              <ExerciseComponent />
            ) : (
              <DspDashboard onSelectExercise={handleExoChange} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
