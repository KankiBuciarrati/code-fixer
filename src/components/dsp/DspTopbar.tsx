import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { getTpById, getExerciseById } from '@/config/navigation';

interface DspTopbarProps {
  activeTP: string | null;
  activeExo: string | null;
  onBackToDashboard: () => void;
}

export const DspTopbar: React.FC<DspTopbarProps> = ({
  activeTP, activeExo, onBackToDashboard,
}) => {
  const tp = activeTP ? getTpById(activeTP) : null;
  const exo = activeTP && activeExo ? getExerciseById(activeTP, activeExo) : null;

  if (!tp || !exo) {
    return (
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-2.5 text-foreground">
        <Home size={18} className="text-primary" />
        <span className="font-semibold text-sm">Tableau de Bord</span>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home size={16} />
            <span>Accueil</span>
          </button>
          <ChevronRight size={14} className="text-border" />
          <span className="text-muted-foreground">TP {tp.number}</span>
          <ChevronRight size={14} className="text-border" />
          <span className="font-semibold text-primary">Exo {exo.number}</span>
        </div>
      </div>
      <div className="mt-2">
        <h2 className="text-xl font-bold text-foreground">{exo.title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{exo.description}</p>
      </div>
    </div>
  );
};
