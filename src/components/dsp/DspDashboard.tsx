import React from 'react';
import { TP_SECTIONS } from '@/config/navigation';
import { ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface DspDashboardProps {
  onSelectExercise: (tpId: string, exoId: string) => void;
}

export const DspDashboard: React.FC<DspDashboardProps> = ({ onSelectExercise }) => {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
          <Activity size={32} className="text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Signal <span className="gradient-text">Lab</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-md mx-auto">
          Plateforme d'analyse et de traitement des signaux
        </p>
      </motion.div>

      {/* TP Sections */}
      <div className="space-y-8">
        {TP_SECTIONS.map((tp, tpIdx) => (
          <motion.div
            key={tp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: tpIdx * 0.1 + 0.2 }}
            className="signal-card overflow-hidden"
          >
            {/* TP Header */}
            <div className="relative p-6 bg-gradient-to-r from-primary to-signal-blue overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAyMGgyME0yMCAwdjIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-50" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white/70 tracking-widest uppercase">TP {tp.number}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{tp.title}</h2>
                <p className="text-white/70 text-sm mt-1">{tp.description}</p>
              </div>
            </div>

            {/* Exercises Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tp.exercises.map((exo, exoIdx) => (
                <motion.button
                  key={exo.id}
                  onClick={() => onSelectExercise(tp.id, exo.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: tpIdx * 0.1 + exoIdx * 0.05 + 0.3 }}
                  className="group text-left p-5 rounded-xl border border-border/60 bg-background hover:border-primary/30 transition-all duration-300"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                      Exo {exo.number}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {exo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {exo.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
