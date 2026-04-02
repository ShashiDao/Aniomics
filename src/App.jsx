import React, { useState, useEffect } from 'react';
import { 
  Library, Sparkles, Smartphone, 
  Moon, Sun, Wand2, Globe, Loader2,
  Users, Zap, ShieldCheck,
  MessageCircle, Send as TelegramIcon, Mail,
  ChevronDown, HelpCircle, ArrowRight
} from 'lucide-react';

const Atmosphere = ({ phase }) => {
  const isNight = phase === 'night';
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'bg-[#0b0b0b]/90' : 'bg-transparent'}`} />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #E6C35C 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
    </div>
  );
};

const FAQS = [
  { q: "What is Sanctifying?", a: "It is our mystical ritual that strips intrusive ads and trackers from external links, wrapping the content in our aesthetic sanctuary." },
  { q: "Is the Sanctuary free?", a: "Yes. The gates of Aniomics are open to all seekers. We believe stories should be experienced without the clutter of the void." },
  { q: "How do I sync my progress?", a: "Simply sign in with your Soul ID inside the App. Your scrolls and ranks will be inscribed across all your devices instantly." },
  { q: "Can I suggest a new feature?", a: "Of course. Join our Discord or Telegram community. The Archivist always listens to the whispers of the seekers." }
];

export default function App() {
  const [phase, setPhase] = useState('night');
  const [urlInput, setUrlInput] = useState("");
  const [isSanctifying, setIsSanctifying] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showTop, setShowTop] = useState(false);

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#0b0b0b]' : 'bg-[#DCD4B8]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]',
    accent: '#E6C35C',
    glass: isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
  };

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSanctify = (e) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsSanctifying(true);
    setTimeout(() => { setIsSanctifying(false); setUrlInput(""); }, 2000);
  };

  return (
    <div className={`min-h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 flex flex-col font-sans overflow-x-hidden relative`}>
      <Atmosphere phase={phase} />

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-current/5">
        <div className="flex items-center gap-2">
          <Library size={22} className="text-[#E6C35C]" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold">Aniomics</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60">
             {isNight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-32 pb-12 px-6 flex flex-col items-center text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-4 text-[#E6C35C] animate-pulse">
          <Sparkles size={12} />
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Universal Aesthetic Shell</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif uppercase tracking-tight leading-[1.1] mb-6">
          The Sanctuary <br /><span className="text-[#E6C35C]">For Every Story</span>
        </h1>
        <form onSubmit={handleSanctify} className="w-full max-w-md relative mb-12 px-4">
          <div className={`flex items-center p-1.5 rounded-full border ${theme.glass} backdrop-blur-2xl shadow-2xl`}>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste scroll link..." 
              className="bg-transparent flex-1 outline-none text-[13px] px-4 font-sans placeholder:opacity-30"
            />
            <button type="submit" className="bg-[#E6C35C] text-black h-10 w-10 rounded-full flex items-center justify-center active:scale-90 shadow-lg transition-transform">
              {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </form>
      </header>

      {/* --- STATS SECTION --- */}
      <section className="px-8 py-4 z-10 max-w-md mx-auto w-full mb-12">
         <div className="flex justify-center gap-12 opacity-60">
            <div className="flex flex-col items-center text-center">
               <Users size={18} className="text-[#E6C35C] mb-1" />
               <span className="text-xl font-serif tracking-widest leading-none">1,204</span>
               <span className="text-[7px] uppercase tracking-widest font-bold mt-1">Active Souls</span>
            </div>
            <div className="flex flex-col items-center text-center">
               <Zap size={18} className="text-[#E6C35C] mb-1" />
               <span className="text-xl font-serif tracking-widest leading-none">42k</span>
               <span className="text-[7px] uppercase tracking-widest font-bold mt-1">Cleansed</span>
            </div>
         </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="px-6 py-12 z-10 max-w-md mx-auto w-full mb-24">
         <div className="flex items-center gap-2 text-[#E6C35C] mb-8 justify-center">
            <HelpCircle size={14} />
            <span className="text-[9px] uppercase font-black tracking-[0.3em]">Scrolls of Inquiry</span>
         </div>
         <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className={`rounded-2xl border ${theme.glass} overflow-hidden transition-all duration-500`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 flex justify-between items-center text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-tight leading-tight pr-4">{f.q}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 opacity-40 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-[10px] opacity-60 leading-relaxed animate-in fade-in slide-in-from-top-2">
                    <div className="pt-4 border-t border-white/5">{f.a}</div>
                  </div>
                )}
              </div>
            ))}
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="mt-auto pt-16 pb-32 border-t border-current/5 flex flex-col items-center z-10 bg-black/40 backdrop-blur-md">
        <div className="flex gap-8 mb-10 opacity-60">
          <a href="https://discord.gg/5FHVw9wDfh" target="_blank" rel="noreferrer" className="hover:text-[#E6C35C] transition-colors"><MessageCircle size={22} /></a>
          <a href="https://t.me/AniOmics" target="_blank" rel="noreferrer" className="hover:text-[#E6C35C] transition-colors"><TelegramIcon size={22} /></a>
          <a href="mailto:support@aniomics.art" className="hover:text-[#E6C35C] transition-colors"><Mail size={22} /></a>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 px-6 mb-8 max-w-xs text-center">
          {['ABOUT', 'FEEDBACK', 'HELP', 'TERMS', 'PRIVACY', 'DMCA', 'CONTACT'].map((link, i) => (
            <React.Fragment key={link}>
              <button className="text-[10px] font-bold tracking-[0.1em] opacity-40 hover:opacity-100 transition-opacity">{link}</button>
              {i < 6 && <span className="text-[10px] opacity-10">|</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[9px] uppercase tracking-[0.3em] font-black text-[#E6C35C] mb-12">support@aniomics.art</p>
        <div className="flex items-center gap-2 opacity-10 scale-75">
          <Library size={18} />
          <span className="text-[11px] uppercase tracking-[0.4em] font-bold">Aniomics Sanctuary © 2026</span>
        </div>
      </footer>

      {/* --- MINI APP BUTTON (40% SMALLER) --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-[160px] px-2">
        <button className="w-full h-10 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-between px-1.5 pr-4 shadow-2xl active:scale-95 transition-all group overflow-hidden">
          <div className="flex items-center gap-2">
             <div className="h-7 w-7 bg-[#E6C35C] rounded-lg flex items-center justify-center text-black shadow-inner">
               <Library size={14} />
             </div>
             <span className="text-white text-[10px] font-bold tracking-wider">Get App</span>
          </div>
          <ArrowRight className="text-white/40 group-hover:text-white transition-colors" size={12} />
        </button>
      </div>

      {/* --- TOP BUTTON --- */}
      {showTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="fixed bottom-8 right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl z-[151] active:scale-90 transition-transform animate-in fade-in zoom-in"
        >
          <span className="text-[8px] font-black tracking-tighter">TOP</span>
        </button>
      )}
    </div>
  );
}

