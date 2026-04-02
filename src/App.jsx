import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Library, Zap, Scroll, ChevronLeft, 
  Target, Star, Moon, Sun, Home, 
  Search as SearchIcon, MessageSquare, BookMarked,
  X, Wand2, Menu, Gamepad2, Trophy, 
  Wallet, Gift, Settings, MoveLeft, Send, Loader2, CheckCircle2
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

// SECURE API KEY LOADING
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

// --- ATMOSPHERE COMPONENT ---
const Atmosphere = ({ phase, color }) => {
  const isNight = phase === 'night';
  const particles = useMemo(() => Array.from({ length: isNight ? 100 : 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isNight ? `${Math.random() * 0.4 + 0.3}s` : `${Math.random() * 15 + 5}s`,
    delay: `${Math.random() * 5}s`,
    opacity: isNight ? Math.random() * 0.3 + 0.1 : Math.random() * 0.2 + 0.05,
    size: isNight ? '1px' : `${Math.random() * 3 + 1}px`,
    height: isNight ? `${Math.random() * 30 + 10}px` : `${Math.random() * 3 + 1}px`,
  })), [phase]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className={`absolute transition-colors duration-1000 ${isNight ? 'animate-rain' : 'animate-sandstorm'}`}
          style={{ backgroundColor: color, left: p.left, top: isNight ? '-40px' : p.top, width: p.size, height: p.height, opacity: p.opacity, animationDuration: p.duration, animationDelay: p.delay, filter: !isNight ? 'blur(1px)' : 'none' }} />
      ))}
    </div>
  );
};

// --- AI LIBRARIAN LOGIC ---
const callGemini = async (prompt, userProfile) => {
  if (!GEMINI_API_KEY) return "The Archivist is silent. Please ensure the celestial key is inscribed in settings.";
  
  const sys = `You are "The Archivist", a mystical AI Librarian. Speak poetically and briefly. User: ${userProfile.name}, Rank: ${userProfile.title}. Refer to titles as scrolls.`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The stars are silent...";
  } catch { return "A celestial storm blocks our connection."; }
};

export default function App() {
  const [phase, setPhase] = useState('night');
  const [activeTab, setActiveTab] = useState('hall');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, questsCompleted: [] });
  const [stage, setStage] = useState('entrance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [chamberType, setChamberType] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const [searchSort, setSearchSort] = useState("TRENDING_DESC");
  const chatEndRef = useRef(null);

  const isNight = phase === 'night';
  const theme = {
    // UPDATED: Muted Day mode colors to be easier on the eyes
    bg: isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]', 
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]',
    subText: isNight ? 'text-white/40' : 'text-[#2D1F16]/60',
    glass: isNight ? 'bg-white/5 border-[#F3E5AB]/20 shadow-2xl' : 'bg-black/5 border-[#2D1F16]/10 shadow-2xl',
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
    setStage('active'); setActiveTab('hall'); setChamberType(null);
    setIsMenuOpen(false); setIsLibrarianOpen(false);
  };

  const handleQuestCompletion = async (id, xp) => {
    if (profile.questsCompleted.includes(id) || !user) return;
    await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), { ...profile, xp: profile.xp + xp, questsCompleted: [...profile.questsCompleted, id] }, { merge: true });
  };

  const executeSearch = async (t) => {
    setLoading(true);
    const q = `query($s:String,$t:MediaType,$sort:[MediaSort]){Page(perPage:12){media(search:$s,type:$t,sort:$sort){id title{english romaji}coverImage{extraLarge}}}}`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, variables: { s: searchQuery || undefined, t: t || searchFilter, sort: [searchSort] } })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
      handleQuestCompletion('q1', 50);
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
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-hidden relative flex flex-col items-center font-sans`}>
      <style>{`
        @keyframes rain { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes sandstorm { 0% { transform: translateX(-10vw); opacity: 0; } 100% { transform: translateX(110vw); opacity: 0; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }
        .animate-rain { animation: rain linear infinite; }
        .animate-sandstorm { animation: sandstorm linear infinite; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Atmosphere phase={phase} color={theme.particle} />

      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between">
        <button onClick={resetToHome} className="flex flex-col items-start gap-1 pointer-events-auto">
          <Library size={48} className={`${theme.accent} drop-shadow-xl transition-transform active:scale-90`} />
          {stage !== 'quests' && <span className="text-[11px] tracking-[0.3em] font-serif font-bold uppercase opacity-80">Aniomics</span>}
        </button>

        <div className="flex items-center gap-3">
          {stage === 'quests' && <button onClick={() => setStage('active')} className={`p-2 rounded-full ${theme.glass} active:scale-95`}><MoveLeft size={22} /></button>}
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-sm opacity-80`}>
            {isNight ? <Moon size={16} className="animate-pulse" /> : <Sun size={16} />}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-lg`}><Menu size={24} /></button>
        </div>
      </div>

      {isLibrarianOpen && (
        <div className={`fixed inset-0 z-[220] backdrop-blur-3xl flex flex-col p-6 ${isNight ? 'bg-black/95' : 'bg-[#DCD4B8]/98'}`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-current/10">
            <h2 className="text-xl font-serif tracking-widest uppercase">The Archivist</h2>
            <button onClick={() => setIsLibrarianOpen(false)}><X size={32} /></button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 mb-6">
            {chatHistory.map((c, i) => (
              <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-serif leading-relaxed ${c.role === 'user' ? 'bg-black/10 border border-current/20' : 'bg-white/10 border border-current/10'}`}>{c.content}</div>
              </div>
            ))}
            {isTyping && <div className="p-4 rounded-2xl bg-white/5 w-12 flex justify-center"><Loader2 className="animate-spin" size={16} /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className={`flex items-center gap-3 p-4 border rounded-2xl ${theme.glass}`}>
            <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask the Archivist..." className="bg-transparent outline-none flex-1 text-xs" />
            <button onClick={handleSendMessage} className={theme.accent}><Send size={20} /></button>
          </div>
        </div>
      )}

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
            <header className="mb-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2 font-serif"><Star size={10} className={currentRank.color} /><span className={`text-[10px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span></div>
              <h2 className="text-2xl tracking-[0.3em] font-serif uppercase">{profile.name}</h2>
              <div className="mt-2 text-[10px] font-bold opacity-60">Knowledge: <span className={theme.accent}>{profile.xp}</span> / {nextRank.minXp}</div>
              <div className="h-[3px] w-4/5 bg-current/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${currentRank.bar} transition-all duration-1000 shadow-lg`} style={{ width: `${progress}%` }} /></div>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-10">
              {activeTab === 'hall' && !chamberType && (
                <div className="grid grid-cols-2 gap-4 pt-6 animate-in slide-in-from-bottom-6">
                  <div onClick={() => { setChamberType("ANIME"); executeSearch("ANIME"); }} className={`h-72 rounded-t-full border-2 p-8 flex flex-col items-center justify-end transition-all hover:scale-105 active:scale-95 ${theme.glass}`}><Zap size={36} className={`${theme.accent} mb-4`} /><h3 className="text-xl font-serif uppercase">Motion</h3></div>
                  <div onClick={() => { setChamberType("MANGA"); executeSearch("MANGA"); }} className={`h-72 rounded-t-full border-2 p-8 flex flex-col items-center justify-end transition-all hover:scale-105 active:scale-95 ${theme.glass}`}><Scroll size={36} className={`${theme.accent} mb-4`} /><h3 className="text-xl font-serif uppercase">Ink</h3></div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="flex flex-col gap-6 pt-2">
                  <div className={`flex items-center gap-4 p-4 border rounded-2xl ${theme.glass}`}><SearchIcon size={20} className="opacity-30" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSearch()} placeholder="Query the Void..." className="bg-transparent outline-none flex-1 text-xs font-serif uppercase" /></div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    <button onClick={() => { const t = searchFilter === 'ANIME' ? 'MANGA' : 'ANIME'; setSearchFilter(t); executeSearch(t); }} className={`px-5 py-2.5 rounded-full border text-[9px] uppercase tracking-widest font-bold transition-all ${theme.glass} ${theme.accent}`}>{searchFilter === 'ANIME' ? 'Motion' : 'Ink'}</button>
                    <button onClick={() => { const s = searchSort === 'TRENDING_DESC' ? 'POPULARITY_DESC' : 'TRENDING_DESC'; setSearchSort(s); executeSearch(); }} className={`px-5 py-2.5 rounded-full border text-[9px] uppercase tracking-widest font-bold transition-all ${theme.glass}`}>Sort: {searchSort === 'TRENDING_DESC' ? 'Trend' : 'Pop'}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-24"><Loader2 className="animate-spin" size={36} /></div> :
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass}`}><img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-100" alt="card" /><div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#DCD4B8]'} to-transparent text-[9px] font-bold uppercase text-center font-serif leading-tight line-clamp-2`}>{item.title.english || item.title.romaji}</div></div>))
                    }
                  </div>
                </div>
              )}

              {chamberType && activeTab === 'hall' && (
                <div className="animate-in fade-in pb-10">
                  <button onClick={() => setChamberType(null)} className={`flex items-center gap-2 text-[10px] uppercase mb-8 font-serif opacity-60`}><ChevronLeft size={16} /> Close Archives</button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20 animate-pulse"><Loader2 /></div> : 
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border-2 relative group ${theme.glass}`}><img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" /><div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#DCD4B8]'} to-transparent text-[9px] font-bold uppercase text-center`}>{item.title.english || item.title.romaji}</div></div>))
                    }
                  </div>
                </div>
              )}

              {stage === 'quests' && (
                <div className="mt-10 space-y-4">
                  {DAILY_QUESTS.map(q => {
                    const done = profile.questsCompleted.includes(q.id);
                    return (
                      <div key={q.id} className={`p-6 border rounded-sm ${theme.glass} ${done ? 'opacity-40 grayscale scale-95' : ''}`}>
                        <div className="flex justify-between mb-2"><h4 className="text-[11px] uppercase font-serif tracking-widest">{q.title}</h4><span className={`text-[10px] font-bold ${theme.accent}`}>+{q.xp} XP</span></div>
                        <p className={`text-[9px] opacity-60 mb-6`}>{q.desc}</p>
                        {!done && <button onClick={() => handleQuestCompletion(q.id, q.xp)} className={`w-full py-3.5 border border-current/30 text-[9px] uppercase font-bold tracking-widest active:bg-current/10`}>Inscribe Fulfillment</button>}
                        {done && <div className={`flex items-center gap-2 text-[9px] font-bold uppercase ${theme.accent}`}><CheckCircle2 size={12} /> Fulfilled</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      <nav className={`fixed bottom-6 left-6 right-6 h-16 border-2 rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-700 ${theme.glass} shadow-2xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={activeTab === 'hall' ? theme.accent : 'opacity-40'}><Home size={28} /></button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? theme.accent : 'opacity-40'}><SearchIcon size={28} /></button>
        <button onClick={() => setActiveTab('forum')} className={activeTab === 'forum' ? theme.accent : 'opacity-40'}><MessageSquare size={28} /></button>
        <button onClick={() => setActiveTab('sanctum')} className={activeTab === 'sanctum' ? theme.accent : 'opacity-40'}><BookMarked size={28} /></button>
      </nav>

      {stage === 'active' && !isMenuOpen && (
        <button onClick={() => setIsLibrarianOpen(true)} className={`fixed bottom-28 left-6 p-5 rounded-full border-2 backdrop-blur-3xl animate-breathe z-[100] shadow-2xl active:scale-90 transition-transform`}>
          <Wand2 size={30} className={theme.accent} />
        </button>
      )}
    </div>
  );
}

