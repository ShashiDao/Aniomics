import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star,
  Moon, Sun, Home, Search as SearchIcon, MessageSquare, BookMarked,
  ArrowUpDown, X, Wand2, Menu, Gamepad2, Trophy, Wallet, Gift, Settings, MoveLeft, Send, Loader2
} from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBlPdWgHqNAfxQ3sot8hRGdY1SomzsPOlk",
  authDomain: "excel-gam-zon.firebaseapp.com",
  databaseURL: "https://excel-gam-zon.firebaseio.com",
  projectId: "excel-gam-zon",
  storageBucket: "excel-gam-zon.firebasestorage.app",
  messagingSenderId: "849616610846",
  appId: "1:849616610846:web:cada0d004958ec3862700f",
  measurementId: "G-8Q6W427J8R"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const RANKS = [
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-white/40', bar: 'bg-white/40' },
  { id: 2, title: 'Initiate', minXp: 100, color: 'text-[#F3E5AB]/60', bar: 'bg-[#F3E5AB]/60' },
  { id: 3, title: 'Seeker', minXp: 500, color: 'text-[#F3E5AB]/80', bar: 'bg-[#F3E5AB]/80' },
  { id: 4, title: 'Scholar', minXp: 1500, color: 'text-[#F3E5AB]', bar: 'bg-[#F3E5AB]' },
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
  const particles = useMemo(() => Array.from({ length: isNight ? 80 : 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isNight ? `${Math.random() * 0.4 + 0.4}s` : `${Math.random() * 12 + 6}s`,
    delay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.3 + 0.1,
    size: isNight ? '1px' : `${Math.random() * 3 + 1}px`,
    height: isNight ? `${Math.random() * 25 + 10}px` : `${Math.random() * 3 + 1}px`,
  })), [phase]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className={`absolute transition-colors duration-1000 ${isNight ? 'animate-rain' : 'animate-sandstorm'}`}
          style={{ backgroundColor: color, left: p.left, top: isNight ? '-30px' : p.top, width: p.size, height: p.height, opacity: p.opacity, animationDuration: p.duration, animationDelay: p.delay, filter: !isNight ? 'blur(1px)' : 'none' }} />
      ))}
    </div>
  );
};

// --- AI LIBRARIAN LOGIC ---
const callGemini = async (prompt, userProfile) => {
  const apiKey = ""; // Your Gemini Key
  const sys = `You are "The Archivist" of Aniomics. User: ${userProfile.name}, Rank: ${userProfile.title}. Poetic, brief, mystical.`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The archives are hazy...";
  } catch { return "A cosmic storm blocks our path."; }
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
  
  // Search Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const [searchSort, setSearchSort] = useState("TRENDING_DESC");
  const chatEndRef = useRef(null);

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#F3E5AB]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#402615]',
    subText: isNight ? 'text-white/40' : 'text-[#402615]/70',
    glass: isNight ? 'bg-white/5 border-[#F3E5AB]/20 shadow-2xl' : 'bg-black/5 border-[#402615]/20 shadow-2xl',
    accent: isNight ? 'text-[#E6C35C]' : 'text-[#8B5E3C]',
    particle: isNight ? '#F3E5AB' : '#8B5E3C'
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
    const unsub = onSnapshot(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), (snap) => {
      if (snap.exists()) { setProfile(snap.data()); setStage('active'); }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name:");
    if (n && user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), { name: n, xp: 0, questsCompleted: ['q2'] });
  };

  const resetToHome = () => {
    setStage('active');
    setActiveTab('hall');
    setChamberType(null);
    setIsMenuOpen(false);
    setIsLibrarianOpen(false);
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600&display=swap');
        @keyframes rain { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes sandstorm { 0% { transform: translateX(-10vw); opacity: 0; } 100% { transform: translateX(110vw); opacity: 0; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
        .animate-rain { animation: rain linear infinite; }
        .animate-sandstorm { animation: sandstorm linear infinite; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Atmosphere phase={phase} color={theme.particle} />

      {/* TOP HEADER */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between">
        <button onClick={resetToHome} className="flex flex-col items-start gap-1 pointer-events-auto">
          <Library size={42} className={`${theme.accent} drop-shadow-lg`} />
          {stage !== 'quests' && <span className="text-[11px] tracking-[0.3em] font-serif font-bold uppercase opacity-80">Aniomics</span>}
          {stage === 'quests' && <div className="mt-2 text-[18px] opacity-60"><MoveLeft /></div>}
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90`}>
            {isNight ? <Moon size={16} className="animate-pulse" /> : <Sun size={16} />}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90`}><Menu size={22} /></button>
        </div>
      </div>

      {/* LIBRARIAN CHAT */}
      {isLibrarianOpen && (
        <div className={`fixed inset-0 z-[220] backdrop-blur-3xl flex flex-col p-6 ${isNight ? 'bg-black/95' : 'bg-[#F3E5AB]/98'}`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-current/10">
            <h2 className="text-xl font-serif tracking-widest uppercase">The Archivist</h2>
            <button onClick={() => setIsLibrarianOpen(false)}><X size={30} /></button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 mb-6">
            {chatHistory.map((c, i) => (
              <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-serif leading-relaxed ${c.role === 'user' ? 'bg-white/10 border border-current/20' : 'bg-black/5 border border-current/10'}`}>{c.content}</div>
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

      {/* TOOLS DRAWER */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-[200] backdrop-blur-3xl p-8 ${isNight ? 'bg-black/90' : 'bg-[#F3E5AB]/95'}`}>
          <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-serif tracking-widest uppercase text-center w-full">Archon's Tools</h2><button onClick={() => setIsMenuOpen(false)} className="absolute right-8"><X size={30} /></button></div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass}`}><Gamepad2 size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Trials</span></div>
            <div onClick={() => { setStage('quests'); setIsMenuOpen(false); }} className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass} cursor-pointer`}><Target size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Directives</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass}`}><Trophy size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Rankings</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass}`}><Wallet size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Essence</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass}`}><Gift size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Runes</span></div>
            <div className={`p-6 border rounded-2xl flex flex-col items-center gap-3 ${theme.glass}`}><Settings size={26} className={theme.accent} /><span className="text-[9px] uppercase font-bold">Sanctuary</span></div>
          </div>
        </div>
      )}

      <div className="z-10 w-full h-full max-w-lg flex flex-col relative pb-24">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6"><button onClick={handleRitual} className={`px-10 py-5 border-2 rounded-sm font-serif tracking-[0.5em] uppercase hover:bg-white/10`}>Inscribe Name</button></div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-24 overflow-hidden">
            <header className="mb-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2"><Star size={10} className={currentRank.color} /><span className={`text-[10px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span></div>
              <h2 className="text-2xl tracking-[0.3em] font-serif uppercase">{profile.name}</h2>
              <div className="mt-2 text-[10px] tracking-[0.2em] font-bold uppercase ${theme.subText}">Knowledge: <span className={theme.accent}>{profile.xp}</span> / {nextRank.minXp}</div>
              <div className="h-[3px] w-4/5 bg-current/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${currentRank.bar} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${progress}%` }} /></div>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-10">
              {activeTab === 'hall' && !chamberType && (
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div onClick={() => { setChamberType("ANIME"); executeSearch("ANIME"); }} className={`h-72 rounded-t-full border-2 p-8 flex flex-col items-center justify-end group hover:scale-[1.03] transition-all ${theme.glass}`}><Zap size={32} className="text-[#E6C35C] mb-4" /><h3 className="text-xl tracking-[0.3em] font-cinzel uppercase">Motion</h3><p className="text-[9px] opacity-40 uppercase tracking-widest">Anime</p></div>
                  <div onClick={() => { setChamberType("MANGA"); executeSearch("MANGA"); }} className={`h-72 rounded-t-full border-2 p-8 flex flex-col items-center justify-end group hover:scale-[1.03] transition-all ${theme.glass}`}><Scroll size={32} className="text-[#E6C35C] mb-4" /><h3 className="text-xl tracking-[0.3em] font-cinzel uppercase">Ink</h3><p className="text-[9px] opacity-40 uppercase tracking-widest">Manga</p></div>
                </div>
              )}
              {activeTab === 'search' && (
                <div className="flex flex-col gap-6 pt-2 animate-in fade-in">
                  <div className={`flex items-center gap-4 p-4 border rounded-2xl ${theme.glass}`}><SearchIcon size={18} className="opacity-30" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSearch()} placeholder="Query the Void..." className="bg-transparent outline-none flex-1 text-[11px] font-serif tracking-widest uppercase" /></div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    <button onClick={() => { const t = searchFilter === 'ANIME' ? 'MANGA' : 'ANIME'; setSearchFilter(t); executeSearch(t); }} className={`px-5 py-2.5 rounded-full border text-[9px] uppercase tracking-widest font-bold ${theme.glass} ${theme.accent}`}>{searchFilter === 'ANIME' ? 'Motion' : 'Ink'}</button>
                    <button onClick={() => { const s = searchSort === 'TRENDING_DESC' ? 'POPULARITY_DESC' : 'TRENDING_DESC'; setSearchSort(s); executeSearch(); }} className={`px-5 py-2.5 rounded-full border text-[9px] uppercase tracking-widest font-bold ${theme.glass}`}>Sort: {searchSort === 'TRENDING_DESC' ? 'Trend' : 'Popular'}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div> :
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass}`}><img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" /><div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#F3E5AB]'} to-transparent text-[9px] font-bold uppercase line-clamp-2 text-center font-serif tracking-widest leading-tight`}>{item.title.english || item.title.romaji}</div></div>))
                    }
                  </div>
                </div>
              )}
              {stage === 'quests' && (
                <div className="mt-24 space-y-4 animate-in slide-in-from-bottom-6">
                  {DAILY_QUESTS.map(q => {
                    const done = profile.questsCompleted.includes(q.id);
                    return (
                      <div key={q.id} className={`p-6 border rounded-sm ${theme.glass} ${done ? 'opacity-40 grayscale' : ''}`}>
                        <div className="flex justify-between mb-2"><h4 className="text-xs uppercase font-serif tracking-widest">{q.title}</h4><span className={`text-[10px] font-bold ${theme.accent}`}>+{q.xp} XP</span></div>
                        <p className={`text-[9px] leading-relaxed mb-6 ${theme.subText}`}>{q.desc}</p>
                        {!done && <button onClick={() => handleQuestCompletion(q.id, q.xp)} className="w-full py-3 border border-current/20 text-[9px] uppercase font-bold tracking-widest hover:bg-current/5">Claim Knowledge</button>}
                        {done && <div className={`flex items-center gap-2 text-[9px] font-bold uppercase ${theme.accent}`}><CheckCircle2 size={12} /> Fulfilled</div>}
                      </div>
                    )
                  })}
                </div>
              )}
              {chamberType && !activeTab !== 'search' && (
                <div className="animate-in fade-in duration-500 pb-10">
                  <button onClick={() => setChamberType(null)} className={`flex items-center gap-2 text-[10px] uppercase mb-8 font-serif ${theme.subText}`}><ChevronLeft size={16} /> Close Archives</button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20 animate-pulse"><Loader2 size={32} /></div> : 
                      data.map(item => (<div key={item.id} className={`aspect-[2/3] rounded-t-full 
