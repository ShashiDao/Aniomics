import React, { useState, useEffect } from 'react';
import logo from './Assets/logo.png'; 
import { 
  Moon, Sun, Download, Smartphone, 
  ShieldCheck, Zap, Globe, ChevronRight,
  Play, Clapperboard, Tv, Layout
} from 'lucide-react';

const Atmosphere = ({ phase }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === 'night' ? 'bg-[#050505]/95' : 'bg-[#DCD4B8]/50'}`} />
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #E6C35C 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
  </div>
);

export default function App() {
  const [phase, setPhase] = useState('night');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]',
    card: isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10',
    accent: '#E6C35C'
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans transition-colors duration-700 relative overflow-x-hidden`}>
      <Atmosphere phase={phase} />

      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full h-20 px-6 md:px-12 flex items-center justify-between z-[100] backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={logo} className="h-10 w-10 rounded-full border border-[#E6C35C]/30 p-0.5" alt="Aniomics" />
          <span className="text-lg font-serif tracking-[0.3em] uppercase font-bold text-[#E6C35C]">Aniomics</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 hover:scale-110 transition-transform">
             {isNight ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="hidden md:block text-[10px] tracking-widest uppercase font-black border border-[#E6C35C]/50 px-4 py-2 rounded-full hover:bg-[#E6C35C] hover:text-black transition-all">
            Join Discord
          </button>
        </div>
      </nav>

      {/* Hero Section - Watcher Focused */}
      <main className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6C35C]/10 border border-[#E6C35C]/20 text-[#E6C35C] text-[10px] font-black uppercase tracking-tighter mb-6">
          <Clapperboard size={12} /> Cinema in your pocket
        </div>
        
        <h1 className="text-5xl md:text-8xl font-serif uppercase tracking-tighter leading-[0.9] mb-8">
          Beyond <span className="italic">Streaming.</span> <br />
          <span className="text-[#E6C35C]">True Freedom.</span>
        </h1>
        
        <p className="max-w-xl text-sm md:text-base opacity-70 mb-10 font-light leading-relaxed">
          The ultimate sanctuary for Anime, Movies, and Series. 
          No trackers. No interruptions. Just pure visual storytelling in 4K.
        </p>

        {/* Primary Action - Download Portal */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => { if(deferredPrompt) deferredPrompt.prompt(); }}
            className="flex-1 h-14 bg-[#E6C35C] text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(230,195,92,0.3)] hover:scale-105 transition-transform"
          >
            <Download size={18} /> Download App
          </button>
          <button className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest backdrop-blur-xl hover:bg-white/10 transition-all">
            <Play size={18} /> Preview UI
          </button>
        </div>
      </main>

      {/* App Features Grid */}
      <section className="relative z-10 px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <FeatureCard 
          icon={<Tv color={theme.accent} />} 
          title="Dual Engine" 
          desc="Switch between Obsidian and Velvet modes with zero lag." 
          theme={theme} 
        />
        <FeatureCard 
          icon={<ShieldCheck color={theme.accent} />} 
          title="Incognito" 
          desc="Watch what you love without leaving a single trace." 
          theme={theme} 
        />
        <FeatureCard 
          icon={<Zap color={theme.accent} />} 
          title="Extensible" 
          desc="Add your own sources via our modern extension manager." 
          theme={theme} 
        />
      </section>

      {/* Footer Branding */}
      <footer className="relative z-10 py-12 border-t border-white/5 text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] opacity-30 font-black">
          Built for the Cinematic Elite • Aniomics 2026
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, theme }) {
  return (
    <div className={`p-8 rounded-3xl border ${theme.card} backdrop-blur-sm group hover:border-[#E6C35C]/30 transition-all`}>
      <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-serif mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-xs opacity-50 leading-relaxed">{desc}</p>
    </div>
  );
}
