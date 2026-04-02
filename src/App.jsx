import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Library, Zap, Scroll, ChevronLeft, 
  Target, Star, Moon, Sun, Home, 
  Search as SearchIcon, MessageSquare, BookMarked,
  X, Wand2, Menu, Send, Loader2, CheckCircle2, 
  Flame, Wind, Coffee, Volume2, VolumeX, Calendar
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
const db = getFirestore(app);
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- ATMOSPHERE ---
const Atmosphere = ({ phase, isReading, color }) => {
  const isNight = phase === 'night';
  // If reading, we use calmer "Fireflies" instead of heavy rain
  const count = isReading ? 30 : (isNight ? 80 : 40);
  
  const particles = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isReading ? `${Math.random() * 5 + 5}s` : (isNight ? `${Math.random() * 0.4 + 0.3}s` : `${Math.random() * 15 + 5}s`),
    size: isReading ? '4px' : (isNight ? '1px' : '3px'),
  })), [isNight, isReading]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} 
          className={`absolute rounded-full transition-all duration-1000 ${isReading ? 'animate-pulse' : (isNight ? 'animate-rain' : 'animate-sandstorm')}`}
          style={{ 
            backgroundColor: isReading ? '#F3E5AB' : color, 
            left: p.left, 
            top: p.top, 
            width: p.size, 
            height: isNight && !isReading ? '25px' : p.size, 
            opacity: 0.3,
            animationDuration: p.duration,
            filter: isReading ? 'blur(2px)' : 'none'
          }} 
        />
      ))}
    </div>
  );
};

export default function App() {
  const [phase, setPhase] = useState('night');
  const [activeTab, setActiveTab] = useState('hall');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, affinity: {} });
  const [stage, setStage] = useState('active');
  const [chamberType, setChamberType] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lunarData, setLunarData] = useState([]);
  const [loading, setLoading] = useState(false);

  const isNight = phase === 'night';
  const theme = {
    bg: isReading ? 'bg-[#1a1612]' : (isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]'),
    text: isReading ? 'text-[#d4c4a8]' : (isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]'),
    glass: isNight || isReading ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10',
    accent: '#E6C35C'
  };

  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Fetch Lunar Calendar (Upcoming Anime)
  const fetchLunarSchedule = async () => {
    setLoading(true);
    const query = `query { Page(perPage: 6) { airingSchedules(notYetAired: true, sort: TIME) { airingAt media { title { english romaji } coverImage { medium } } } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const d = await res.json();
      setLunarData(d?.data?.Page?.airingSchedules || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (activeTab === 'forum') fetchLunarSchedule(); }, [activeTab]);

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-all duration-1000 overflow-hidden relative flex flex-col items-center font-sans ${isReading ? 'sepia-[0.2]' : ''}`}>
      <Atmosphere phase={phase} isReading={isReading} color={isNight ? '#F3E5AB' : '#8B7355'} />

      {/* TOP SYSTEM BAR */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Library size={40} className="text-[#E6C35C] drop-shadow-lg" onClick={() => {setIsReading(false); setActiveTab('hall');}} />
          {isReading && <span className="text-[10px] tracking-[0.3em] uppercase animate-pulse">Reading Mode</span>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-3 rounded-full border ${theme.glass}`}>
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-3 rounded-full border ${theme.glass}`}>
             {isNight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      <div className="z-10 w-full h-full max-w-lg flex flex-col p-6 pt-24">
        <main className="flex-1 overflow-y-auto hide-scrollbar">
          
          {/* LUNAR CALENDAR (FORUM TAB) */}
          {activeTab === 'forum' && (
            <div className="animate-in fade-in space-y-8">
              <div className="text-center py-4">
                <h2 className="text-2xl font-serif uppercase tracking-[0.3em]">Celestial Cycle</h2>
                <p className="text-[9px] uppercase opacity-50 mt-2">Upcoming scrolls releasing by the moon</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {lunarData.map((item, i) => (
                  <div key={i} className={`p-4 border rounded-2xl ${theme.glass} flex items-center gap-4`}>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-[#E6C35C]/20 rounded-full blur-md animate-pulse" />
                      <div className="h-12 w-12 rounded-full border-2 border-[#E6C35C] flex items-center justify-center bg-black">
                        <Moon size={20} className="text-[#E6C35C]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider line-clamp-1">{item.media.title.english || item.media.title.romaji}</h4>
                      <p className="text-[9px] opacity-60 uppercase mt-1">Airing in {Math.floor((item.airingAt - Date.now()/1000) / 3600)} hours</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* READING ROOM (SANCTUM TAB) */}
          {activeTab === 'sanctum' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-in fade-in">
               <div className={`w-64 h-64 rounded-full border-4 border-dashed border-[#E6C35C]/30 flex items-center justify-center relative ${isReading ? 'animate-spin-slow' : ''}`}>
                  <div className={`absolute inset-4 rounded-full border-2 border-[#E6C35C]/10`} />
                  <button 
                    onClick={() => setIsReading(!isReading)}
                    className={`w-40 h-40 rounded-full border-2 flex flex-col items-center justify-center gap-3 transition-all duration-700 ${isReading ? 'bg-[#E6C35C] text-black shadow-[0_0_50px_#E6C35C]' : theme.glass}`}
                  >
                    <Flame size={32} className={isReading ? 'animate-bounce' : 'opacity-40'} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isReading ? 'Extinguish' : 'Light Candle'}</span>
                  </button>
               </div>

               <div className="text-center max-w-xs">
                 <h3 className="font-serif text-xl uppercase tracking-widest">The Silent Archive</h3>
                 <p className="text-[10px] opacity-50 mt-4 leading-relaxed">Enter a state of deep focus. The atmosphere will soften, the music will rise, and the world will fade.</p>
               </div>

               {isReading && (
                 <div className="flex gap-6 animate-in slide-in-from-bottom-4">
                    <button className="flex flex-col items-center gap-2 opacity-60"><Wind size={20} /><span className="text-[8px] uppercase">Breeze</span></button>
                    <button className="flex flex-col items-center gap-2 text-[#E6C35C]"><Coffee size={20} /><span className="text-[8px] uppercase">Library</span></button>
                    <button className="flex flex-col items-center gap-2 opacity-60"><Volume2 size={20} /><span className="text-[8px] uppercase">Vinyl</span></button>
                 </div>
               )}
            </div>
          )}

          {/* DEFAULT HALL VIEW */}
          {activeTab === 'hall' && !chamberType && (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
               <h1 className="text-3xl font-serif tracking-[0.5em] mb-4">SHASHI</h1>
               <div className="flex items-center gap-4 opacity-40 uppercase text-[9px] tracking-widest font-bold">
                 <span>Knowledge: 170</span>
                 <div className="w-1 h-1 bg-current rounded-full" />
                 <span>Scholar Rank</span>
               </div>
               <div className="mt-20 grid grid-cols-2 gap-8 w-full">
                  <div onClick={() => setChamberType('ANIME')} className={`h-64 rounded-t-full border-2 flex flex-col items-center justify-center gap-4 ${theme.glass} cursor-pointer hover:scale-105 transition-transform`}>
                    <Zap className="text-[#E6C35C]" size={32} />
                    <span className="font-serif uppercase tracking-widest">Motion</span>
                  </div>
                  <div onClick={() => setChamberType('MANGA')} className={`h-64 rounded-t-full border-2 flex flex-col items-center justify-center gap-4 ${theme.glass} cursor-pointer hover:scale-105 transition-transform`}>
                    <Scroll className="text-[#E6C35C]" size={32} />
                    <span className="font-serif uppercase tracking-widest">Ink</span>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* NAVIGATION BAR */}
      <nav className={`fixed bottom-8 left-8 right-8 h-16 border-2 rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-700 ${theme.glass} shadow-2xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={activeTab === 'hall' ? 'text-[#E6C35C]' : 'opacity-40'}><Home size={24} /></button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-[#E6C35C]' : 'opacity-40'}><SearchIcon size={24} /></button>
        <button onClick={() => setActiveTab('forum')} className={activeTab === 'forum' ? 'text-[#E6C35C]' : 'opacity-40'}><Calendar size={24} /></button>
        <button onClick={() => setActiveTab('sanctum')} className={activeTab === 'sanctum' ? 'text-[#E6C35C]' : 'opacity-40'}><BookMarked size={24} /></button>
      </nav>
    </div>
  );
}


