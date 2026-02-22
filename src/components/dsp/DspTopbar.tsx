import React from 'react';
import { ChevronRight, Home, Layers } from 'lucide-react';
import { getTpById, getExerciseById } from '@/config/navigation';
import { motion } from 'framer-motion';

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

  // Dashboard state
  if (!tp || !exo) {
    return (
        <div
            className="relative flex items-center gap-3 px-6 py-4 overflow-hidden"
            style={{
              background: 'rgba(8, 15, 25, 0.7)',
              borderBottom: '1px solid rgba(20,210,150,0.1)',
              backdropFilter: 'blur(16px)',
            }}
        >
          {/* Subtle glow line at bottom */}
          <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(20,210,150,0.3), transparent)' }}
          />

          <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'rgba(20,210,150,0.1)', border: '1px solid rgba(20,210,150,0.2)' }}
          >
            <Layers size={14} style={{ color: '#14d296' }} />
          </div>
          <span
              className="font-bold text-sm tracking-wide"
              style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}
          >
          Tableau de Bord
        </span>

          {/* Right side label */}
          <div className="ml-auto flex items-center gap-2">
          <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                color: 'rgba(20,210,150,0.5)',
                background: 'rgba(20,210,150,0.05)',
                border: '1px solid rgba(20,210,150,0.1)',
              }}
          >
            Signal Lab
          </span>
          </div>
        </div>
    );
  }

  return (
      <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative px-6 py-4 overflow-hidden"
          style={{
            background: 'rgba(8, 15, 25, 0.75)',
            borderBottom: '1px solid rgba(20,210,150,0.08)',
            backdropFilter: 'blur(16px)',
          }}
      >
        {/* Bottom glow line */}
        <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(20,210,150,0.25), transparent)' }}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono mb-3">
          <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 transition-all duration-200 group"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#14d296')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <Home size={13} />
            <span>Accueil</span>
          </button>

          <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.15)' }} />

          <span style={{ color: 'rgba(255,255,255,0.35)' }}>TP {tp.number}</span>

          <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.15)' }} />

          <span
              className="px-2 py-0.5 rounded font-bold"
              style={{
                color: '#14d296',
                background: 'rgba(20,210,150,0.08)',
                border: '1px solid rgba(20,210,150,0.15)',
              }}
          >
          Exo {exo.number}
        </span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h2
                className="text-lg font-black tracking-tight leading-tight"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: "'Courier New', monospace",
                }}
            >
              {exo.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {exo.description}
            </p>
          </div>

          {/* TP badge */}
          <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0 ml-4"
              style={{
                background: 'rgba(20,210,150,0.06)',
                border: '1px solid rgba(20,210,150,0.12)',
              }}
          >
            <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#14d296', boxShadow: '0 0 6px rgba(20,210,150,0.8)' }}
            />
            <span
                className="text-xs font-bold font-mono uppercase tracking-wider"
                style={{ color: 'rgba(20,210,150,0.7)' }}
            >
            TP {tp.number}
          </span>
          </div>
        </div>
      </motion.div>
  );
};