import React, { useState, useMemo } from 'react';
import { 
  Library, Sparkles, Smartphone, 
  Moon, Sun, Wand2, Globe, Loader2,
  Trophy, Star, Users, Zap, ShieldCheck,
  MessageCircle, Send as TelegramIcon, Mail
} from 'lucide-react';

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

  const handleSanctify = (e) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsSanctifying(true);
    setTimeout(() => {
      setIsSanctifying(false);
      setUrlInput("");
    }, 2000);
  };

  return (
    <div className={`min-h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 flex flex-col font-sans overflow-x-hidden pb-10`}>
      <Atmosphere phase={phase} />

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-current/5">
        <div className="flex items-center gap-2">
          <Library size={24} className="text-[#E6C35C]" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold">Aniomics</span>
        </div>
        <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60">
          {isNight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </nav>

      {/* HERO SECTION */}
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
        <form onSubmit={handleSanctify} className="w-full max-w-md relative mb-12">
          <div className={`flex items-center p-1.5 rounded-full border ${isNight ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/10'} backdrop-blur-xl`}>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste scroll link..." 
              className="bg-transparent flex-1 outline-none text-[13px] px-4 font-sans placeholder:opacity-30"
            />
            <button 
              type="submit"
              className="bg-[#E6C35C] text-black h-10 w-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </form>
      </header>

      {/* ASCENSION PATH */}
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

      {/* SOUL PULSE */}
      <section className="px-8 py-10 z-10 max-w-md mx-auto">
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
           <p className="text-[10px] leading-relaxed opacity-60">The Sanctuary is alive. Join the global resonance.</p>
        </div>
      </section>

      {/* COMMUNITY LINKS SECTION */}
      <section className="px-6 py-12 z-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h3 className="text-lg font-serif uppercase tracking-widest mb-2">Join the Coven</h3>
          <p className="text-[9px] uppercase opacity-40 tracking-widest">Connect with other seekers</p>
        </div>
        
        <div className="flex gap-4 w-full max-w-xs">
          <a href="https://discord.gg/5FHVw9wDfh" target="_blank" rel="noreferrer" className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-current/10 bg-white/5 hover:bg-[#E6C35C] hover:text-black transition-all group">
            <MessageCircle size={20} />
            <span className="text-[8px] uppercase font-bold tracking-tighter">Discord</span>
          </a>
          <a href="https://t.me/AniOmics" target="_blank" rel="noreferrer" className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-current/10 bg-white/5 hover:bg-[#E6C35C] hover:text-black transition-all">
            <TelegramIcon size={20} />
            <span className="text-[8px] uppercase font-bold tracking-tighter">Telegram</span>
          </a>
        </div>

        <button className="w-full max-w-xs h-14 bg-[#E6C35C] text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
          <Smartphone size={18} />
          Download App
        </button>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 border-t border-current/5 flex flex-col items-center gap-6 z-10 bg-black/20 backdrop-blur-sm">
         <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 opacity-30">
               <Library size={14} />
               <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Aniomics Sanctuary</span>
            </div>
            <a href="mailto:support@aniomics.art" className="flex items-center gap-2 text-[10px] opacity-60 hover:text-[#E6C35C] transition-colors">
               <Mail size={12} />
               support@aniomics.art
            </a>
         </div>
         <div className="flex gap-6 opacity-30 text-[8px] uppercase font-bold tracking-widest">
            <a href="https://discord.gg/5FHVw9wDfh">Discord</a>
            <a href="https://t.me/AniOmics">Telegram</a>
            <span>Privacy Scrolls</span>
         </div>
      </footer>
    </div>
  );
}


