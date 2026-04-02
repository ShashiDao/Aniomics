import React, { useState, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Library, Sparkles, Smartphone, 
  Moon, Sun, Wand2, Globe, Loader2,
  Trophy, Star, Users, Zap, ShieldCheck
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBlPdWgHqNAfxQ3sot8hRGdY1SomzsPOlk",
  authDomain: "excel-gam-zon.firebaseapp.com",
  projectId: "excel-gam-zon",
  storageBucket: "excel-gam-zon.firebasestorage.app",
  messagingSenderId: "849616610846",
  appId: "1:849616610846:web:cada0d004958ec3862700f",
  measurementId: "G-8Q6W427J8R"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const RANKS = [
  { title: 'Wanderer', desc: 'Lost in the void', color: 'text-white/40' },
  { title: 'Initiate', desc: 'First ritual complete', color: 'text-[#E6C35C]/60' },
  { title: 'Scholar', desc: 'Keeper of 100 scrolls', color: 'text-[#E6C35C]' },
  { title: 'Arch-Librarian', desc: 'Master of the Sanctuary', color: 'text-orange-400' }
];

const Atmosphere = ({ phase }) => {
  const isNight = phase === 'night';
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'bg-black/70' : 'bg-transparent'}`} />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #E6C35C 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
    </div>
  );
};

export default function App() {
  const [phase, setPhase] = useState('night');
  const [urlInput, setUrlInput] = useState("");
  const [isSanctifying, setIsSanctifying] = useState(false);

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]',
    accent: '#E6C35C'
  };

  return (
    <div className={`min-h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 flex flex-col font-sans overflow-x-hidden pb-20`}>
      <Atmosphere phase={phase} />

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-current/5">
        <div className="flex items-center gap-2">
          <Library size={24} className="text-[#E6C35C]" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold">Aniomics</span>
        </div>
        <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60">
          {isNight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-32 pb-16 px-6 flex flex-col items-center text-center z-10">
        <div className="flex items-center gap-2 mb-4 text-[#E6C35C] animate-pulse">
          <Sparkles size={12} />
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold">The Universal Shell</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-serif uppercase tracking-tight leading-[1.1] mb-6">
          Sanctify <br /> <span className="text-[#E6C35C]">Your Journey</span>
        </h1>
        
        <p className="text-xs max-w-xs opacity-60 leading-relaxed mb-10">
          Paste any link to cleanse the ads and transform the void into your private sanctuary.
        </p>

        {/* SANCTIFIER BAR */}
        <div className="w-full max-w-md relative mb-12">
          <div className={`flex items-center p-1.5 rounded-full border ${isNight ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/10'} backdrop-blur-xl`}>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste scroll link..." 
              className="bg-transparent flex-1 outline-none text-[13px] px-4 font-sans placeholder:opacity-30"
            />
            <button 
              onClick={() => { setIsSanctifying(true); setTimeout(() => setIsSanctifying(false), 2000); }}
              className="bg-[#E6C35C] text-black h-10 w-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* --- ASCENSION PATH (NEW) --- */}
      <section className="px-6 py-10 z-10">
        <div className="flex items-center gap-2 mb-8 justify-center opacity-40 uppercase text-[9px] tracking-[0.3em] font-bold">
          <Trophy size={14} />
          <span>The Ascension Path</span>
        </div>
        
        <div className="flex overflow-x-auto gap-4 hide-scrollbar px-4 snap-x">
          {RANKS.map((rank, i) => (
            <div key={i} className={`min-w-[200px] snap-center p-6 rounded-3xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} flex flex-col items-center text-center`}>
              <Star size={24} className={`${rank.color} mb-4`} />
              <h4 className="text-[11px] uppercase font-bold tracking-widest mb-1">{rank.title}</h4>
              <p className="text-[9px] opacity-50 italic">{rank.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SOUL PULSE (NEW) --- */}
      <section className="px-10 py-16 z-10">
        <div className={`p-8 rounded-[2.5rem] border ${isNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/10'} text-center space-y-6`}>
           <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center">
                 <Users size={20} className="text-[#E6C35C] mb-2" />
                 <span className="text-xl font-serif tracking-widest">1,204</span>
                 <span className="text-[8px] uppercase opacity-40 font-bold">Souls Active</span>
              </div>
              <div className="flex flex-col items-center">
                 <Zap size={20} className="text-[#E6C35C] mb-2" />
                 <span className="text-xl font-serif tracking-widest">42k</span>
                 <span className="text-[8px] uppercase opacity-40 font-bold">Cleansed</span>
              </div>
           </div>
           <div className="h-[1px] w-full bg-current opacity-5" />
           <p className="text-[10px] leading-relaxed opacity-60">The Sanctuary is alive. Join the global resonance and experience stories as they were meant to be.</p>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="px-6 py-10 text-center z-10 flex flex-col items-center gap-6">
          <button className="w-full max-w-xs h-14 bg-[#E6C35C] text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(230,195,92,0.3)] active:scale-95 transition-all">
            <Smartphone size={18} />
            Enter the Sanctuary App
          </button>
          <div className="flex items-center gap-2 opacity-30 text-[9px] font-bold uppercase">
             <ShieldCheck size={12} />
             <span>Zero Intrusive Ads. Forever.</span>
          </div>
      </section>

    </div>
  );
}


