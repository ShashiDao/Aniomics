import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Library, Zap, Scroll, ChevronLeft, 
  Target, Star, Moon, Sun, Home, 
  Search as SearchIcon, MessageSquare, BookMarked,
  X, Wand2, Menu, Gamepad2, Trophy, 
  Wallet, Gift, Settings, MoveLeft, Send, Loader2, CheckCircle2,
  Flame, Wind, Coffee, Volume2, VolumeX, Calendar, Sparkles
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

const RANKS = [
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-white/40', bar: 'bg-white/40' },
  { id: 2, title: 'Initiate', minXp: 100, color: 'text-[#E6C35C]/60', bar: 'bg-[#E6C35C]/60' },
  { id: 3, title: 'Seeker', minXp: 500, color: 'text-[#E6C35C]/80', bar: 'bg-[#E6C35C]/80' },
  { id: 4, title: 'Scholar', minXp: 1500, color: 'text-[#E6C35C]', bar: 'bg-[#E6C35C]' },
  { id: 5, title: 'Arch-Librarian', minXp: 5000, color: 'text-[#E6C35C]', bar: 'bg-[#E6C35C]' }
];

const DAILY_QUESTS = [
  { id: 'q1', title: 'Consult the Archives', xp: 50, desc: 'View the Motion or Ink library.' },
  { id: 'q2', title: 'Starlight Meditation', xp: 20, desc: 'Enter the Sanctuary today.' },
  { id: 'q3', title: 'Seeker of Truth', xp: 100, desc: 'Discover 3 new titles.' }
];

// --- ATMOSPHERE ---
const Atmosphere = ({ phase, isReading, color }) => {
  const isNight = phase === 'night';
  const count = isReading ? 40 : (isNight ? 100 : 50);
  
  const particles = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isReading ? `${Math.random() * 5 + 3}s` : (isNight ? `${Math.random() * 0.5 + 0.3}s` : `${Math.random() * 12 + 6}s`),
    size: isReading ? '3px' : (isNight ? '1px' : '3px'),
  })), [isNight, isReading, count]);

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
            height: isNight && !isReading ? '30px' : p.size, 
            opacity: isReading ? 0.4 : 0.2,
            animationDuration: p.duration,
          }} 
        />
      ))}
    </div>
  );
};

// --- AI LIBRARIAN LOGIC ---
const callGemini = async (prompt, userProfile) => {
  if (!GEMINI_API_KEY) return "The Archivist is silent. Key required in Vercel settings.";
  const sys = `You are "The Archivist", a mystical AI Librarian. Speak poetically. User: ${userProfile.name}, Rank: ${userProfile.title}.`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The archives are heavy with silence...";
  } catch { return "A celestial storm blocks our connection."; }
};

export default function App() {
  const [phase, setPhase] = useState('night');
  const [activeTab, setActiveTab] = useState('hall');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, questsCompleted: [], affinity: {} });
  const [stage, setStage] = useState('entrance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [chamberType, setChamberType] = useState(null);
  const [gateOpening, setGateOpening] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lunarData, setLunarData] = useState([]);

  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const chatEndRef = useRef(null);

  const isNight = phase === 'night';
  const theme = {
    bg: isReading ? 'bg-[#1a1612]' : (isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]'),
    text: isReading ? 'text-[#d4c4a8]' : (isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]'),
    subText: isNight || isReading ? 'text-white/40' : 'text-[#2D1F16]/60',
    glass: isNight || isReading ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-black/5 border-black/10 shadow-2xl',
    accent: isNight ? 'text-[#E6C35C]' : 'text-[#6B4E31]',
    particle: isNight ? '#F3E5AB' : '#8B7355'
  };

  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const progress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), (snap) => {
      if (snap.exists()) { setProfile(snap.data()); setStage('active'); }
    });
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name:");
    if (n && user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), { name: n, xp: 0, questsCompleted: ['q2'] });
  };

  const resetToHome = () => {
    setStage('active'); setActiveTab('hall'); setChamberType(null); setGateOpening(null);
    setIsMenuOpen(false); setIsLibrarianOpen(false); setIsReading(false);
  };

  const handleGateEntry = (type) => {
    setGateOpening(type);
    setTimeout(() => {
      setChamberType(type);
      executeSearch(type);
      setGateOpening(null);
    }, 800);
  };

  const executeSearch = async (t) => {
    setLoading(true);
    const q = `query($s:String,$t:MediaType){Page(perPage:12){media(search:$s,type:$t){id title{english romaji}coverImage{extraLarge}}}}`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, variables: { s: searchQuery || undefined, t: t || searchFilter } })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

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

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const msg = userInput; setUserInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);
    const aiResp = await callGemini(msg, { ...profile, title: currentRank.title });
    setChatHistory(prev => [...prev, { role: 'ai', content: aiResp }]);
    setIsTyping(false);
  };

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-all duration-1000 overflow-hidden relative flex flex-col items-center font-sans`}>
      <style>{`
        @keyframes rain { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes sandstorm { 0% { transform: translateX(-10vw); opacity: 0; } 100% { transform: translateX(110vw); opacity: 0; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes door-l { from { transform: translateX(0) rotateY(0); } to { transform: translateX(-100%) rotateY(-90deg); opacity: 0; } }
        @keyframes door-r { from { transform: translateX(0) rotateY(0); } to { transform: translateX(100%) rotateY(90deg); opacity: 0; } }
        .animate-rain { animation: rain linear infinite; }
        .animate-sandstorm { animation: sandstorm linear infinite; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .door-l-open { animation: door-l 0.8s ease-in forwards; }
        .door-r-open { animation: door-r 0.8s ease-in forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Atmosphere phase={phase} isReading={isReading} color={theme.particle} />

      {/* FIXED TOP HEADER */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between pointer-events-none">
        <button onClick={resetToHome} className="flex flex-col items-start gap-1 pointer-events-auto group">
          <Library size={48} className={`${theme.accent} drop-shadow-xl active:scale-90`} />
          <span className="text-[11px] tracking-[0.3em] font-serif font-bold uppercase opacity-80">Aniomics</span>
        </button>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-sm opacity-80`}>
            {isNight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-lg`}><Menu size={24} /></button>
        </div>
      </div>

      {/* AI LIBRARIAN MODAL */}
      {isLibrarianOpen && (
        <div className={`fixed inset-0 z-[220] backdrop-blur-3xl flex flex-col p-6 ${isNight ? 'bg-black/95' : 'bg-[#DCD4B8]/98'}`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-current/10">
            <h2 className="text-xl font-serif tracking-widest uppercase">The Archivist</h2>
            <button onClick={() => setIsLibrarianOpen(false)}><X size={32} /></button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 mb-6">
            {chatHistory.map((c, i) => (
              <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-serif ${c.role === 'user' ? 'bg-black/10 border border-current/20' : 'bg-white/10 border border-current/10'}`}>{c.content}</div>
              </div>
            ))}
            {isTyping && <div className="p-4 rounded-2xl bg-white/5 w-12 flex justify-center"><Loader2 className="animate-spin" size={16} /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className={`flex items-center gap-3 p-4 border rounded-2xl ${theme.glass}`}>
            <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Query the Archivist..." className="bg-transparent outline-none flex-1 text-xs" />
            <button onClick={handleSendMessage} className={theme.accent}><Send size={20} /></button>
          </div>
        </div>
      )}

      {/* MENU MODAL (RESTORED FEATURES) */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-[200] backdrop-blur-3xl p-8 flex flex-col ${isNight ? 'bg-black/90' : 'bg-[#DCD4B8]/95'}`}>
          <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-serif tracking-widest uppercase text-center w-full">Archon's Tools</h2><button onClick={() => setIsMenuOpen(false)} className="absolute right-8"><X size={32} /></button></div>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass}`}><Gamepad2 size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Trials</span></div>
            <div onClick={() => { setStage('quests'); setIsMenuOpen(false); }} className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass} cursor-pointer`}><Target size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Directives</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass}`}><Trophy size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Rankings</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass}`}><Wallet size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Essence</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass}`}><Gift size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Runes</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 ${theme.glass}`}><Settings size={28} className={theme.accent} /><span className="text-[9px] uppercase font-bold text-center">Sanctuary</span></div>
          </div>
        </div>
      )}

      <div className="z-10 w-full h-full max-w-lg flex flex-col relative pb-24">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6"><button onClick={handleRitual} className="px-10 py-5 border-2 rounded-sm font-serif uppercase tracking-widest active:bg-white/10">Initiate Ritual</button></div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-24 overflow-hidden">
            
            {activeTab === 'hall' && !chamberType && (
               <header className="mb-8 flex flex-col items-center text-center animate-in fade-in">
                  <div className="flex items-center gap-2 mb-2 font-serif"><Star size={10} className={currentRank.color} /><span className={`text-[10px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span></div>
                  <h2 className="text-2xl tracking-[0.3em] font-serif uppercase">{profile.name}</h2>
                  <div className="h-[3px] w-4/5 bg-current/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${currentRank.bar} transition-all duration-1000 shadow-lg`} style={{ width: `${progress}%` }} /></div>
               </header>
            )}

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-10 flex flex-col">
              {activeTab === 'hall' && !chamberType && (
                <div className="flex-1 grid grid-cols-2 gap-4 py-8 animate-in slide-in-from-bottom-6">
                  <div onClick={() => handleGateEntry("ANIME")} className="relative h-full cursor-pointer group">
                    <div className={`h-full w-full rounded-t-full border-2 border-b-0 flex flex-col items-center justify-center relative overflow-hidden ${theme.glass}`}>
                      <div className={`absolute inset-y-0 left-0 w-1/2 border-r border-current opacity-10 ${gateOpening === 'ANIME' ? 'door-l-open' : ''}`} style={{ transformOrigin: 'left' }} />
                      <div className={`absolute inset-y-0 right-0 w-1/2 border-l border-current opacity-10 ${gateOpening === 'ANIME' ? 'door-r-open' : ''}`} style={{ transformOrigin: 'right' }} />
                      <Zap size={40} className={`z-10 ${theme.accent} mb-4`} />
                      <h3 className="z-10 text-xl font-serif uppercase">Motion</h3>
                    </div>
                  </div>
                  <div onClick={() => handleGateEntry("MANGA")} className="relative h-full cursor-pointer group">
                    <div className={`h-full w-full rounded-t-full border-2 border-b-0 flex flex-col items-center justify-center relative overflow-hidden ${theme.glass}`}>
                      <div className={`absolute inset-y-0 left-0 w-1/2 border-r border-current opacity-10 ${gateOpening === 'MANGA' ? 'door-l-open' : ''}`} style={{ transformOrigin: 'left' }} />
                      <div className={`absolute inset-y-0 right-0 w-1/2 border-l border-current opacity-10 ${gateOpening === 'MANGA' ? 'door-r-open' : ''}`} style={{ transformOrigin: 'right' }} />
                      <Scroll size={40} className={`z-10 ${theme.accent} mb-4`} />
                      <h3 className="z-10 text-xl font-serif uppercase">Ink</h3>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="flex flex-col gap-6 pt-2 animate-in fade-in">
                  <div className={`flex items-center gap-4 p-4 border rounded-2xl ${theme.glass}`}><SearchIcon size={20} className="opacity-30" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSearch()} placeholder="Query the Void..." className="bg-transparent outline-none flex-1 text-xs font-serif uppercase" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-24"><Loader2 className="animate-spin" size={36} /></div> :
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative ${theme.glass}`}><img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" /><div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#DCD4B8]'} to-transparent text-[9px] font-bold uppercase text-center font-serif leading-tight line-clamp-2`}>{item.title.english || item.title.romaji}</div></div>))
                    }
                  </div>
                </div>
              )}

              {activeTab === 'forum' && (
                <div className="animate-in fade-in space-y-8" onLoad={() => fetchLunarSchedule()}>
                   <div className="text-center py-4">
                      <h2 className="text-2xl font-serif uppercase tracking-[0.3em]">Celestial Cycle</h2>
                      <p className="text-[9px] uppercase opacity-50 mt-2">Upcoming scrolls releasing by the moon</p>
                      <button onClick={fetchLunarSchedule} className="mt-4 text-[8px] uppercase border px-4 py-1 rounded-full opacity-60">Consult Sky</button>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {lunarData.map((item, i) => (
                        <div key={i} className={`p-4 border rounded-2xl ${theme.glass} flex items-center gap-4`}>
                          <div className="h-12 w-12 rounded-full border-2 border-[#E6C35C] flex items-center justify-center bg-black"><Moon size={20} className="text-[#E6C35C]" /></div>
                          <div className="flex-1">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider line-clamp-1">{item.media.title.english || item.media.title.romaji}</h4>
                            <p className="text-[9px] opacity-60 uppercase mt-1">Airing in {Math.floor((item.airingAt - Date.now()/1000) / 3600)} hours</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'sanctum' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-in fade-in">
                   <div className={`w-64 h-64 rounded-full border-4 border-dashed border-[#E6C35C]/30 flex items-center justify-center relative ${isReading ? 'animate-spin-slow' : ''}`}>
                      <button onClick={() => setIsReading(!isReading)} className={`w-40 h-40 rounded-full border-2 flex flex-col items-center justify-center gap-3 transition-all duration-700 ${isReading ? 'bg-[#E6C35C] text-black shadow-[0_0_50px_#E6C35C]' : theme.glass}`}>
                        <Flame size={32} className={isReading ? 'animate-bounce' : 'opacity-40'} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isReading ? 'Extinguish' : 'Light Candle'}</span>
                      </button>
                   </div>
                   <div className="text-center max-w-xs">
                     <h3 className="font-serif text-xl uppercase tracking-widest">The Reading Room</h3>
                     <p className="text-[10px] opacity-50 mt-4 leading-relaxed">Focus your spirit. Atmosphere: Golden Fireflies.</p>
                   </div>
                </div>
              )}

              {chamberType && activeTab === 'hall' && (
                <div className="animate-in fade-in pb-10">
                  <button onClick={() => setChamberType(null)} className={`flex items-center gap-2 text-[10px] uppercase mb-8 font-serif opacity-60`}><ChevronLeft size={16} /> Leave Chamber</button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin" /></div> : 
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border-2 relative group ${theme.glass}`}><img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" /><div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#DCD4B8]'} to-transparent text-[9px] font-bold uppercase text-center font-serif`}>{item.title.english || item.title.romaji}</div></div>))
                    }
                  </div>
                </div>
              )}

              {stage === 'quests' && (
                <div className="mt-10 space-y-4 animate-in slide-in-from-bottom-6">
                  <button onClick={() => setStage('active')} className="flex items-center gap-2 text-[10px] uppercase opacity-60 mb-6"><MoveLeft size={14} /> Back</button>
                  {DAILY_QUESTS.map(q => (
                    <div key={q.id} className={`p-6 border rounded-sm ${theme.glass}`}>
                      <div className="flex justify-between mb-2"><h4 className="text-[11px] uppercase font-serif tracking-widest">{q.title}</h4><span className={`text-[10px] font-bold ${theme.accent}`}>+{q.xp} XP</span></div>
                      <p className={`text-[9px] opacity-60 mb-6`}>{q.desc}</p>
                      {profile.questsCompleted.includes(q.id) ? (
                        <div className={`flex items-center gap-2 text-[9px] font-bold uppercase text-[#E6C35C]`}><CheckCircle2 size={12} /> Fulfilled</div>
                      ) : (
                        <button className="w-full py-3 border border-current/30 text-[9px] uppercase font-bold tracking-widest">Claim Knowledge</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* NAVIGATION BAR */}
      <nav className={`fixed bottom-8 left-8 right-8 h-16 border-2 rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-700 ${theme.glass} shadow-2xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={activeTab === 'hall' ? 'text-[#E6C35C]' : 'opacity-40'}><Home size={26} /></button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-[#E6C35C]' : 'opacity-40'}><SearchIcon size={26} /></button>
        <button onClick={() => setActiveTab('forum')} className={activeTab === 'forum' ? 'text-[#E6C35C]' : 'opacity-40'}><Calendar size={26} /></button>
        <button onClick={() => setActiveTab('sanctum')} className={activeTab === 'sanctum' ? 'text-[#E6C35C]' : 'opacity-40'}><BookMarked size={26} /></button>
      </nav>

      {/* AI LIBRARIAN BUTTON */}
      {stage === 'active' && !isMenuOpen && (
        <button onClick={() => setIsLibrarianOpen(true)} className={`fixed bottom-28 left-6 p-5 rounded-full border-2 backdrop-blur-3xl animate-breathe z-[100] shadow-2xl active:scale-90 transition-transform ${theme.glass}`}>
          <Wand2 size={28} className="text-[#E6C35C]" />
        </button>
      )}
    </div>
  );
}

