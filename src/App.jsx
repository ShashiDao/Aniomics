import React, { useState, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { 
  Library, Sparkles, Smartphone, 
  Moon, Sun, Wand2, Globe, Loader2,
  Zap, ShieldCheck, Cpu, Download
} from 'lucide-react';

// --- FIREBASE & CONFIG ---
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
const db = getFirestore(app);

// --- ATMOSPHERE ---
const Atmosphere = ({ phase }) => {
  const isNight = phase === 'night';
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${Math.random() * 8 + 4}s`,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-[#E6C35C] opacity-10 animate-pulse"
          style={{ left: p.left, top: p.top, width: '2px', height: '2px', animationDuration: p.duration }} />
      ))}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'bg-black/60' : 'bg-transparent'}`} />
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
    <div className={`min-h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 flex flex-col font-sans overflow-x-hidden`}>
      <Atmosphere phase={phase} />

      {/* --- RESPONSIVE NAV --- */}
      <nav className="fixed top-0 left-0 right-0 h-16 px-4 md:px-8 flex items-center justify-between z-[100] backdrop-blur-lg border-b border-current/5">
        <div className="flex items-center gap-2">
          <Library size={24} className="text-[#E6C35C]" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold">Aniomics</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60">
              {isNight ? <Moon size={16} /> : <Sun size={16} />}
           </button>
           <button className="px-4 py-1.5 bg-[#E6C35C] text-black text-[9px] uppercase font-black tracking-widest rounded-full shadow-lg">Get App</button>
        </div>
      </nav>

      {/* --- HERO: CENTERED FOR MOBILE --- */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-5 text-center z-10">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-4 text-[#E6C35C]">
            <Sparkles size={12} />
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Universal Aesthetic Shell</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-serif uppercase tracking-tight leading-[1.1] mb-5">
            The Sanctuary <br /> <span className="text-[#E6C35C]">For Every Story</span>
          </h1>
          
          <p className="text-xs md:text-base opacity-60 font-light leading-relaxed mb-10 px-4">
            Paste any link to cleanse the void of ads and transform your journey into a divine ritual.
          </p>

          {/* THE SANCTIFIER BAR: RESPONSIVE FLEX */}
          <form onSubmit={handleSanctify} className="w-full relative group mb-20">
            <div className="absolute -inset-0.5 bg-[#E6C35C] rounded-full blur opacity-10"></div>
            <div className={`relative flex items-center p-1.5 rounded-full border ${isNight ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/10'} backdrop-blur-xl`}>
              <div className="pl-3 pr-2 text-[#E6C35C] hidden xs:block"><Globe size={18} /></div>
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste link here..." 
                className="bg-transparent flex-1 outline-none text-[13px] px-2 font-sans placeholder:opacity-30"
              />
              <button 
                disabled={isSanctifying}
                className="bg-[#E6C35C] text-black h-10 px-5 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-2 active:scale-95 transition-transform"
              >
                {isSanctifying ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                <span className="hidden xs:inline">{isSanctifying ? "Wait..." : "Sanctify"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* --- MOBILE APP SECTION --- */}
        <section className="w-full max-w-md">
           <div className={`flex flex-col gap-8 p-8 rounded-[2.5rem] border ${isNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} backdrop-blur-2xl`}>
              <div className="text-center space-y-4">
                 <div className="h-10 w-10 mx-auto rounded-xl bg-[#E6C35C]/10 flex items-center justify-center text-[#E6C35C]"><Smartphone size={20} /></div>
                 <h3 className="text-2xl font-serif uppercase tracking-widest leading-tight">Divine <br /> Immersion</h3>
                 <p className="text-[11px] opacity-60 leading-relaxed">Download the App to unlock the Grand Theatre, Haptic Page-Turns, and Local Library Syncing.</p>
                 <div className="flex flex-col gap-3 pt-2">
                    <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95">
                       <div className="text-center"><p className="text-[7px] opacity-40 uppercase tracking-widest">Available on</p><p className="text-xs font-bold uppercase tracking-wider">App Store</p></div>
                    </button>
                    <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95">
                       <div className="text-center"><p className="text-[7px] opacity-40 uppercase tracking-widest">Available on</p><p className="text-xs font-bold uppercase tracking-wider">Google Play</p></div>
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* --- COMPACT STATS --- */}
        <section className="mt-20 grid grid-cols-2 gap-8 w-full max-w-xs mx-auto opacity-60">
           <div className="text-center">
              <p className="text-2xl font-serif mb-1">1.2K+</p>
              <p className="text-[8px] uppercase tracking-[0.2em] font-bold">Active Souls</p>
           </div>
           <div className="text-center">
              <p className="text-2xl font-serif mb-1">0</p>
              <p className="text-[8px] uppercase tracking-[0.2em] font-bold">Intrusive Ads</p>
           </div>
        </section>
      </main>

      <footer className="py-8 border-t border-current/5 flex flex-col items-center gap-4 z-10">
         <div className="flex items-center gap-2 opacity-30">
            <Library size={14} />
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Aniomics Sanctuary © 2026</span>
         </div>
      </footer>
    </div>
  );
}

