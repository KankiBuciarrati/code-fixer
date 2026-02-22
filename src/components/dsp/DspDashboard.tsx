import React, { useEffect, useRef } from 'react';
import { TP_SECTIONS } from '@/config/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Animated waveform SVG logo
const SignalLabLogo: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 120, height: 120,
                    background: 'radial-gradient(circle, rgba(20,210,150,0.15) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Middle ring */}
            <motion.div
                className="absolute rounded-full border border-emerald-400/20"
                style={{ width: 90, height: 90 }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            {/* Core circle */}
            <motion.div
                className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, #0d9e6e 0%, #14d296 50%, #00f5c4 100%)',
                    boxShadow: '0 0 30px rgba(20,210,150,0.4), 0 0 60px rgba(20,210,150,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                animate={{ boxShadow: [
                        '0 0 30px rgba(20,210,150,0.4), 0 0 60px rgba(20,210,150,0.15)',
                        '0 0 50px rgba(20,210,150,0.6), 0 0 90px rgba(20,210,150,0.25)',
                        '0 0 30px rgba(20,210,150,0.4), 0 0 60px rgba(20,210,150,0.15)',
                    ]}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05, rotate: 3 }}
            >
                {/* Waveform SVG */}
                <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                    <motion.path
                        d="M2 14 L8 14 L10 4 L14 24 L18 8 L22 20 L26 10 L30 18 L34 6 L36 14 L42 14"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
                    />
                </svg>
            </motion.div>
        </div>
    );
};

// Animated sine wave background strip
const WaveStrip: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let t = 0;
        let animId: number;
        const draw = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const w = canvas.width;
            const h = canvas.height;
            // Multiple wave layers
            const waves = [
                { amp: 18, freq: 0.018, speed: 0.025, color: 'rgba(20,210,150,0.15)', width: 2 },
                { amp: 10, freq: 0.03, speed: 0.04, color: 'rgba(20,210,150,0.08)', width: 1.5 },
                { amp: 25, freq: 0.012, speed: 0.015, color: 'rgba(0,245,196,0.06)', width: 3 },
            ];
            waves.forEach(wave => {
                ctx.beginPath();
                ctx.strokeStyle = wave.color;
                ctx.lineWidth = wave.width;
                for (let x = 0; x <= w; x++) {
                    const y = h / 2 + Math.sin(x * wave.freq + t * wave.speed * 60) * wave.amp;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
            t++;
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animId);
    }, []);
    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
};

interface DspDashboardProps {
    onSelectExercise: (tpId: string, exoId: string) => void;
}

const tpColors = [
    {
        gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        border: 'border-emerald-500/20',
        accent: '#14d296',
        glow: 'rgba(20,210,150,0.3)',
        badge: 'bg-emerald-500/15 text-emerald-400',
        headerGrad: 'from-emerald-900/80 to-teal-900/60',
    },
    {
        gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
        border: 'border-blue-500/20',
        accent: '#38bdf8',
        glow: 'rgba(56,189,248,0.3)',
        badge: 'bg-blue-500/15 text-blue-400',
        headerGrad: 'from-blue-900/80 to-cyan-900/60',
    },
];

export const DspDashboard: React.FC<DspDashboardProps> = ({ onSelectExercise }) => {
    return (
        <div className="space-y-12 pb-8">

            {/* ═══ HERO ═══ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative text-center py-16 px-6 rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(13,158,110,0.08) 0%, rgba(10,20,30,0.6) 50%, rgba(56,189,248,0.05) 100%)',
                    border: '1px solid rgba(20,210,150,0.12)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {/* Animated waves behind */}
                <WaveStrip />

                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(20,210,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,210,150,1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Corner accents */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-emerald-400/30 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-400/30 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-400/30 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-emerald-400/30 rounded-br-lg" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">

                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                        className="mb-8"
                    >
                        <SignalLabLogo />
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <h1
                            className="text-6xl font-black tracking-tight leading-none"
                            style={{ fontFamily: "'Courier New', monospace" }}
                        >
                            <span className="text-white">Signal</span>
                            <span
                                className="ml-3"
                                style={{
                                    background: 'linear-gradient(90deg, #14d296, #00f5c4, #38bdf8)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                Lab
              </span>
                        </h1>

                        {/* Subtitle line */}
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400/50" />
                            <p className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-emerald-400/70">
                                DSP Platform
                            </p>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400/50" />
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-base text-white/40 mt-5 max-w-sm leading-relaxed"
                    >
                        Analyse, visualisation et traitement des signaux mathématiques
                    </motion.p>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="flex items-center gap-8 mt-8"
                    >
                        {[
                            { value: `${TP_SECTIONS.length}`, label: 'TPs' },
                            { value: `${TP_SECTIONS.reduce((a, tp) => a + tp.exercises.length, 0)}`, label: 'Exercices' },
                            { value: '∞', label: 'Signaux' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <p
                                    className="text-2xl font-black font-mono"
                                    style={{ color: '#14d296' }}
                                >
                                    {stat.value}
                                </p>
                                <p className="text-xs text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* ═══ TP SECTIONS ═══ */}
            <div className="space-y-8">
                {TP_SECTIONS.map((tp, tpIdx) => {
                    const colors = tpColors[tpIdx % tpColors.length];
                    return (
                        <motion.div
                            key={tp.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: tpIdx * 0.15 + 0.4 }}
                            className={`rounded-2xl border overflow-hidden ${colors.border}`}
                            style={{ background: 'rgba(10,15,25,0.7)', backdropFilter: 'blur(12px)' }}
                        >
                            {/* TP Header */}
                            <div
                                className={`relative px-7 py-5 bg-gradient-to-r ${colors.headerGrad} overflow-hidden`}
                                style={{ borderBottom: `1px solid ${colors.accent}18` }}
                            >
                                {/* Waveform decoration */}
                                <svg className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10" width="120" height="40" viewBox="0 0 120 40">
                                    <path d="M0 20 L10 20 L15 5 L20 35 L25 10 L30 30 L35 15 L40 25 L45 8 L50 20 L60 20 L65 5 L70 35 L75 12 L80 28 L85 18 L90 22 L95 6 L100 20 L120 20"
                                          stroke={colors.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
                                </svg>

                                <div className="relative flex items-center gap-4">
                                    <div
                                        className="flex items-center justify-center w-11 h-11 rounded-xl font-black text-sm"
                                        style={{
                                            background: `${colors.accent}18`,
                                            border: `1px solid ${colors.accent}30`,
                                            color: colors.accent,
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        T{tp.number}
                                    </div>
                                    <div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: `${colors.accent}80` }}>
                      TP {tp.number}
                    </span>
                                        <h2 className="text-lg font-bold text-white mt-0.5">{tp.title}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Exercises Grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tp.exercises.map((exo, exoIdx) => (
                                    <motion.button
                                        key={exo.id}
                                        onClick={() => onSelectExercise(tp.id, exo.id)}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: tpIdx * 0.1 + exoIdx * 0.06 + 0.5 }}
                                        whileHover={{ y: -3, scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group relative text-left p-5 rounded-xl overflow-hidden transition-all duration-300"
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: `1px solid rgba(255,255,255,0.06)`,
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.border = `1px solid ${colors.accent}30`;
                                            (e.currentTarget as HTMLElement).style.background = `${colors.accent}06`;
                                            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${colors.glow}20`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.06)';
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Exo number badge */}
                                        <div className="flex items-start justify-between mb-4">
                      <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black font-mono"
                          style={{
                              background: `${colors.accent}15`,
                              color: colors.accent,
                              border: `1px solid ${colors.accent}25`,
                          }}
                      >
                        #{exo.number}
                      </span>
                                            <motion.div
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                animate={{ x: [0, 3, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <ArrowRight size={16} style={{ color: colors.accent }} />
                                            </motion.div>
                                        </div>

                                        <h3
                                            className="font-bold text-white/80 group-hover:text-white transition-colors text-sm leading-snug"
                                        >
                                            {exo.title}
                                        </h3>
                                        <p className="text-xs text-white/30 mt-2 line-clamp-2 leading-relaxed">
                                            {exo.description}
                                        </p>

                                        {/* Bottom accent line */}
                                        <div
                                            className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};