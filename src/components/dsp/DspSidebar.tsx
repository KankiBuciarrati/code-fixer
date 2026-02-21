import React, { useState } from 'react';
import { TP_SECTIONS } from '@/config/navigation';
import { ChevronDown, Menu, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DspSidebarProps {
  activeTP: string;
  activeExo: string;
  onTPChange: (tpId: string) => void;
  onExoChange: (tpId: string, exoId: string) => void;
}

export const DspSidebar: React.FC<DspSidebarProps> = ({
  activeTP, activeExo, onTPChange, onExoChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedTP, setExpandedTP] = useState<string | null>(activeTP);

  const toggleTP = (tpId: string) => {
    setExpandedTP(expandedTP === tpId ? null : tpId);
    onTPChange(tpId);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden bottom-6 right-6 bg-primary text-primary-foreground p-3.5 rounded-full shadow-lg z-[60] hover:opacity-90 transition-opacity"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside
        className={`
          fixed md:static left-0 top-0 h-screen
          w-72 sidebar-gradient text-sidebar-foreground
          transition-transform duration-300 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto flex flex-col
        `}
        style={{ boxShadow: 'var(--shadow-sidebar)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Activity size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Signal Lab</h1>
              <p className="text-[11px] text-white/40 font-medium tracking-wider uppercase">DSP Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {TP_SECTIONS.map((tp) => (
            <div key={tp.id}>
              <button
                onClick={() => toggleTP(tp.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg
                  transition-all duration-200 text-left group
                  ${activeTP === tp.id
                    ? 'bg-primary/15 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                  }
                `}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary tracking-wider">TP {tp.number}</span>
                  <p className="text-sm font-medium mt-0.5 truncate">{tp.title}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 flex-shrink-0 ml-2 ${
                    expandedTP === tp.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {expandedTP === tp.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-white/10 pl-4">
                      {tp.exercises.map((exo) => (
                        <button
                          key={exo.id}
                          onClick={() => {
                            onExoChange(tp.id, exo.id);
                            setIsOpen(false);
                          }}
                          className={`
                            w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                            ${activeExo === exo.id
                              ? 'bg-primary/20 text-primary font-semibold'
                              : 'text-white/45 hover:text-white/70 hover:bg-white/5'
                            }
                          `}
                        >
                          <span className="font-semibold text-primary/80">
                            Exo {exo.number}.
                          </span>{' '}
                          {exo.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-[11px] text-white/25">
          <p>Traitement du Signal</p>
          <p className="mt-0.5">2024-2025</p>
        </div>
      </aside>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 md:hidden z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
};
