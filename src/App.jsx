import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, getDocs, query, limit } from 'firebase/firestore';
import { 
  Library, Sparkles, Smartphone, ArrowRight, 
  Flame, Moon, Sun, Menu, X, Wand2, 
  Zap, Scroll, Search, Globe, ShieldCheck, Cpu
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
  const particles = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${Math.random() * 10 + 5}s`,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-[#E6C35C] opacity-10 animate-pulse"
          style={{ left: p.left, top: p.top, width: '2px', height: '2px', animationDuration: p.duration }} />
      ))}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'bg-black/40' : 'bg-transparent'}`} />
    </div>
  );
};

export default function App() {
  const [phase, setPhase] = useState('night');
  const [urlInput, setUrlInput] = useState("");
  const [isSanctifying, setIsSanctifying] = useState(false);
  const [userCount, setUserCount] = useState(1204); // Simulated for "Portal" feel
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    // Simulation of the "Ritual"
    setTimeout(() => {
      alert("The link is Sanctified! Download the Aniomics App to enter the Grand Theatre.");
      setIsSanctifying(false);
    }, 2000);
  };

  return (
    <div className={`min-h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 flex flex-col font-sans selection:bg-[#E6C35C] selection:text-black`}>
      <Atmosphere phase={phase} />

      {/* --- TOP PORTAL NAV --- */}
      <nav className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-[100] backdrop-blur-md border-b border-current/5">
        <div className="flex items-center gap-3">
          <Library size={32} className="text-[#E6C35C]" />
          <span className="text-lg font-serif tracking-[0.4em] uppercase font-bold">Aniomics</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase font-bold tracking-widest opacity-60">
          <a href="#features" className="hover:text-[#E6C35C] transition-colors">The Ritual</a>
          <a href="#app" className="hover:text-[#E6C35C] transition-colors">The App</a>
          <a href="#pulse" className="hover:text-[#E6C35C] transition-colors">The Pulse</a>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
              {isNight ? <Moon size={18} /> : <Sun size={18} />}
           </button>
           <button className="px-6 py-2 bg-[#E6C35C] text-black text-[10px] uppercase font-black tracking-widest rounded-full shadow-lg active:scale-95 transition-transform">Get App</button>
        </div>
      </nav>

      {/* --- HERO SECTION: THE GATE --- */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 px-6 text-center z-10">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center justify-center gap-2 mb-6 text-[#E6C35C]">
            <Sparkles size={16} />
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Universal Aesthetic Shell</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif uppercase tracking-tighter leading-none mb-6">
            The Sanctuary for <br /> <span className="text-[#E6C35C]">Every Story</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base opacity-60 font-light leading-relaxed mb-12">
            Paste any scroll (link) to cleanse the void of intrusive ads and transform your reading or watching into a divine ritual.
          </p>

          {/* THE SANCTIFIER BAR */}
          <form onSubmit={handleSanctify} className="w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#E6C35C] to-orange-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className={`relative flex items-center p-2 rounded-full border-2 ${isNight ? 'bg-black/50 border-white/10' : 'bg-white/50 border-black/10'} backdrop-blur-xl`}>
              <div className="pl-4 pr-2 text-[#E6C35C]"><Globe size={20} /></div>
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste your link here..." 
                className="bg-transparent flex-1 outline-none text-sm font-sans placeholder:opacity-30"
              />
              <button 
                disabled={isSanctifying}
                className="bg-[#E6C35C] text-black px-8 py-3 rounded-full text-[11px] uppercase font-black tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
              >
                {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isSanctifying ? "Sanctifying..." : "Sanctify"}
              </button>
            </div>
          </form>
        </div>

        {/* --- APP CTA PREVIEW --- */}
        <section id="app" className="mt-32 w-full max-w-5xl">
           <div className={`grid md:grid-cols-2 gap-12 items-center p-12 rounded-[3rem] border ${isNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} backdrop-blur-3xl`}>
              <div className="text-left space-y-6">
                 <div className="h-12 w-12 rounded-2xl bg-[#E6C35C]/10 flex items-center justify-center text-[#E6C35C]"><Smartphone size={24} /></div>
                 <h3 className="text-3xl font-serif uppercase tracking-widest">Full Immersion <br /> On Mobile</h3>
                 <p className="text-sm opacity-60 leading-relaxed">The web is just the lobby. Download the Aniomics App to unlock the Grand Theatre, Haptic Page-Turns, and Local Library Syncing.</p>
                 <div className="flex gap-4 pt-4">
                    <button className="flex-1 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                       <div className="text-left"><p className="text-[8px] opacity-40 leading-none">Download on</p><p className="text-sm font-bold">App Store</p></div>
                    </button>
                    <button className="flex-1 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                       <div className="text-left"><p className="text-[8px] opacity-40 leading-none">Get it on</p><p className="text-sm font-bold">Google Play</p></div>
                    </button>
                 </div>
              </div>
              <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                 <img src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-50" alt="App Preview" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left">
                    <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-[#E6C35C] mb-2">Theatre Mode</span>
                    <p className="text-xs opacity-80 uppercase tracking-widest">Cinematic 3D Environment</p>
                 </div>
              </div>
           </div>
        </section>

        {/* --- STATS / PULSE --- */}
        <section id="pulse" className="my-32 flex flex-wrap justify-center gap-16 md:gap-32">
           <div className="text-center">
              <p className="text-4xl font-serif mb-2">{userCount.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-bold">Active Souls</p>
           </div>
           <div className="text-center">
              <p className="text-4xl font-serif mb-2">420K</p>
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-bold">Links Sanctified</p>
           </div>
           <div className="text-center">
              <p className="text-4xl font-serif mb-2">0</p>
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-bold">Intrusive Ads</p>
           </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-current/5 flex flex-col items-center gap-6 z-10">
         <div className="flex items-center gap-2 opacity-40">
            <Library size={16} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Aniomics Sanctuary © 2026</span>
         </div>
         <div className="flex gap-8 opacity-40 text-[9px] uppercase font-bold tracking-widest">
            <span>Twitter</span>
            <span>Discord</span>
            <span>Privacy Scrolls</span>
         </div>
      </footer>
    </div>
  );
}


