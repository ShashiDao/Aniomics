import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star,
  Moon, Sun, Home, Search as SearchIcon, MessageSquare, BookMarked,
  ArrowUpDown, X, Wand2, Menu, Gamepad2, Trophy, Wallet, Gift, Settings, MoveLeft, Send, Loader2
} from 'lucide-react';

// --- CONFIG & INITIALIZATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'aniomics-sanctuary';
const apiKey = ""; // Provided by environment

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
  const count = isNight ? 80 : 50;

  const particles = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isNight ? `${Math.random() * 0.5 + 0.5}s` : `${Math.random() * 10 + 5}s`,
    delay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.4 + 0.1,
    size: isNight ? '1px' : `${Math.random() * 3 + 1}px`,
    height: isNight ? `${Math.random() * 20 + 10}px` : `${Math.random() * 3 + 1}px`,
  })), [phase, count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id} 
          className={`absolute transition-colors duration-1000 ${isNight ? 'animate-rain' : 'animate-sandstorm'}`}
          style={{ 
            backgroundColor: color,
            left: p.left, 
            top: isNight ? '-20px' : p.top,
            width: p.size, 
            height: p.height, 
            opacity: p.opacity,
            animationDuration: p.duration, 
            animationDelay: p.delay,
            filter: !isNight ? 'blur(1px)' : 'none',
            boxShadow: isNight ? 'none' : `0 0 4px ${color}`
          }} 
        />
      ))}
    </div>
  );
};

// --- GEMINI AI LIBRARIAN LOGIC ---
const callGemini = async (prompt, userProfile) => {
  const systemInstruction = `You are "The Archivist", a mystical and wise AI Librarian of the Aniomics Sanctuary. 
  The Sanctuary is a grand, cathedral-like library for Anime (Motion) and Manga (Ink). 
  Current User: ${userProfile.name}, Rank: ${userProfile.title}, Knowledge: ${userProfile.xp} XP.
  Use poetic, elevated language. Refer to titles as "scrolls" or "tomes".
  Keep responses concise but immersive. Use markdown for lists. Do not mention being an AI or a model.`;

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });
      if (!response.ok) throw new Error('API Error');
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "The stars are silent. Try again, Seeker.";
    } catch (err) {
      if (i === 4) return "A celestial storm blocks our connection. Please wait, Seeker.";
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

// --- MAIN APP COMPONENT ---
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

  // Search Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const [searchSort, setSearchSort] = useState("TRENDING_DESC");
  const [searchStatus, setSearchStatus] = useState("FINISHED");

  // AI Librarian State
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#F3E5AB]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#402615]',
    subText: isNight ? 'text-white/40' : 'text-[#402615]/60',
    glass: isNight ? 'bg-white/5 border-[#F3E5AB]/20 shadow-2xl' : 'bg-black/5 border-[#402615]/20 shadow-2xl',
    accent: isNight ? 'text-[#E6C35C]' : 'text-[#8B5E3C]',
    particle: isNight ? '#F3E5AB' : '#8B5E3C'
  };

  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const progress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ ...d, questsCompleted: d.questsCompleted || [] });
        setStage('active');
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name:");
    if (!n || !user) return;
    const p = { name: n, xp: 0, questsCompleted: ['q2'] };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile'), p);
  };

  const handleQuestCompletion = async (id, xp) => {
    if (profile.questsCompleted.includes(id) || !user) return;
    const up = { ...profile, xp: profile.xp + xp, questsCompleted: [...profile.questsCompleted, id] };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile'), up, { merge: true });
  };

  const executeSearch = async (typeOverride = null) => {
    setLoading(true);
    const finalType = typeOverride || searchFilter;
    const apiQuery = `query($search: String, $type: MediaType, $sort: [MediaSort], $status: MediaStatus){ Page(perPage: 12){ media(search: $search, type: $type, sort: $sort, status: $status){ id title { english romaji } coverImage { extraLarge } averageScore } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: apiQuery, 
          variables: { 
            search: searchQuery || undefined, 
            type: finalType, 
            sort: [searchSort],
            status: searchStatus
          } 
        })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
      handleQuestCompletion('q1', 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetToHome = () => {
    setStage('active');
    setActiveTab('hall');
    setChamberType(null);
    setIsMenuOpen(false);
    setIsLibrarianOpen(false);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput("");
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
        @keyframes sandstorm { 0% { transform: translateX(-10vw) translateY(0); opacity: 0; } 20% { opacity: 0.3; } 80% { opacity: 0.3; } 100% { transform: translateX(110vw) translateY(20px); opacity: 0; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        .animate-rain { animation: rain linear infinite; }
        .animate-sandstorm { animation: sandstorm linear infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Atmosphere phase={phase} color={theme.particle} />

      {/* TOP SYSTEM BAR */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button onClick={resetToHome} className="flex flex-col items-start gap-1 group">
             <Library size={32} className={`${theme.accent} transition-transform group-hover:scale-110 active:scale-95`} />
             {stage !== 'quests' && (
                <span className={`text-[10px] tracking-[0.3em] font-serif font-bold uppercase ${theme.text} opacity-80 animate-in fade-in`}>
                  Aniomics
                </span>
             )}
          </button>
          {stage === 'quests' && (
             <button onClick={() => setStage('active')} className={`p-1 mt-2 ${theme.text} opacity-70 active:scale-95 animate-in slide-in-from-top-1 fade-in`}>
               <MoveLeft size={22} />
             </button>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-sm opacity-80`}>
            {isNight ? <Moon size={14} className="animate-pulse" /> : <Sun size={14} className="animate-spin-slow" />}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-lg`}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* AI LIBRARIAN MODAL */}
      {isLibrarianOpen && (
        <div className={`fixed inset-0 z-[210] backdrop-blur-3xl animate-in fade-in zoom-in duration-300 flex flex-col p-6 ${isNight ? 'bg-black/90' : 'bg-[#F3E5AB]/95'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Wand2 className={theme.accent} size={24} />
              <h2 className={`text-xl font-serif tracking-widest uppercase ${theme.text}`}>The Archivist</h2>
            </div>
            <button onClick={() => setIsLibrarianOpen(false)} className={`p-2 ${theme.text} opacity-50`}><X size={28} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 mb-6 px-2">
            {chatHistory.length === 0 && (
              <p className={`text-sm italic font-serif text-center mt-20 opacity-40 ${theme.text}`}>Seek knowledge, Seeker. The archives await your question.</p>
            )}
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-serif ${chat.role === 'user' ? `${theme.accent} bg-white/10 border border-current/20` : `${theme.text} border border-current/10 bg-white/5 shadow-inner`}`}>
                  {chat.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-2xl bg-white/5 border border-current/10 ${theme.text}`}>
                  <Loader2 className="animate-spin" size={16} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className={`flex items-center gap-3 p-3 border rounded-2xl ${theme.glass}`}>
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Query the Archivist..." 
              className={`bg-transparent border-none outline-none flex-1 text-xs tracking-widest font-serif placeholder:${theme.subText}`} 
            />
            <button onClick={handleSendMessage} className={`p-2 ${theme.accent} active:scale-90`}><Send size={18} /></button>
          </div>
        </div>
      )}

      {/* ARCHON'S DRAWER */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-[200] backdrop-blur-3xl animate-in fade-in zoom-in duration-300 flex flex-col p-8 ${isNight ? 'bg-black/90' : 'bg-[#F3E5AB]/95'}`}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-serif tracking-widest uppercase text-center w-full">Archon's Tools</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 opacity-50 absolute right-8"><X size={28} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Gamepad2 className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Trials</span></button>
            <button onClick={() => { setStage('quests'); setIsMenuOpen(false); }} className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Target className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Directives</span></button>
            <button className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Trophy className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Rankings</span></button>
            <button className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Wallet className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Essence</span></button>
            <button className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Gift className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Runes</span></button>
            <button className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 ${theme.glass}`}><Settings className={theme.accent} size={24} /><span className="text-[8px] uppercase font-bold text-center">Sanctuary</span></button>
          </div>
          <div className={`mt-auto p-5 border rounded-2xl ${theme.glass} flex items-center justify-center gap-4`}>
             <Star size={20} className={theme.accent} />
             <div className="text-center">
               <p className="text-[8px] tracking-widest uppercase opacity-40">Current Patron</p>
               <p className="text-md font-serif tracking-widest">{profile.name}</p>
             </div>
          </div>
        </div>
      )}

      {/* FLOATING LIBRARIAN TRIGGER */}
      {stage === 'active' && !isMenuOpen && (
        <div className="fixed bottom-28 left-6 z-[100] pointer-events-none">
          <button 
            onClick={() => setIsLibrarianOpen(true)} 
            className={`pointer-events-auto p-4 rounded-full border backdrop-blur-3xl animate-breathe ${theme.glass} shadow-2xl transition-all active:scale-90`}
          >
            <Wand2 size={24} className={theme.accent} />
          </button>
        </div>
      )}

      <div className="z-10 w-full h-full max-w-lg flex flex-col relative pb-24">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
            <div className={`border rounded-t-full pt-20 pb-12 px-10 backdrop-blur-xl ${theme.glass} text-center`}>
              <Library size={56} className="text-[#E6C35C] mb-6 mx-auto" />
              <h1 className="text-4xl tracking-[0.3em] font-serif font-semibold">ANIOMICS</h1>
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-40 mt-6 mb-12">The Grand Library</p>
              <button onClick={handleRitual} className={`px-8 py-4 border rounded-sm text-[10px] tracking-widest uppercase font-serif hover:bg-[#E6C35C] hover:text-[#050505] transition-all`}>Initiate Ritual</button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-24 animate-in fade-in duration-700 overflow-hidden">
            <header className="mb-6 flex flex-col items-center text-center">
              <div className="w-full flex flex-col items-center mb-4 font-serif">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={10} className={currentRank.color} />
                  <span className={`text-[9px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span>
                </div>
                <h2 className="text-xl tracking-[0.2em] uppercase">{profile.name}</h2>
                <div className="mt-2">
                  <p className="text-[8px] tracking-widest uppercase opacity-40 mb-1 font-bold">Knowledge</p>
                  <p className="text-sm text-[#E6C35C] font-bold">{profile.xp} <span className="opacity-30 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              <div className="h-[2.5px] w-4/5 bg-current/10 rounded-full overflow-hidden mx-auto shadow-inner">
                <div className={`h-full ${currentRank.bar} transition-all duration-1000`} style={{ width: `${progress}%` }} />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-10">
              {activeTab === 'hall' && !chamberType && (
                <div className="grid grid-cols-2 gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div onClick={() => { setChamberType("ANIME"); setSearchFilter("ANIME"); executeSearch("ANIME"); }} className={`h-64 rounded-t-full border p-6 flex flex-col items-center justify-end cursor-pointer transition-all hover:scale-[1.02] ${theme.glass}`}>
                    <Zap size={28} className="text-[#E6C35C] mb-4" />
                    <h3 className="text-xl tracking-widest font-serif uppercase text-center">Motion</h3>
                    <p className="text-[9px] opacity-40 tracking-widest uppercase text-center font-bold">Anime Archives</p>
                  </div>
                  <div onClick={() => { setChamberType("MANGA"); setSearchFilter("MANGA"); executeSearch("MANGA"); }} className={`h-64 rounded-t-full border p-6 flex flex-col items-center justify-end cursor-pointer transition-all hover:scale-[1.02] ${theme.glass}`}>
                    <Scroll size={28} className="text-[#E6C35C] mb-4" />
                    <h3 className="text-xl tracking-widest font-serif uppercase text-center">Ink</h3>
                    <p className="text-[9px] opacity-40 tracking-widest uppercase text-center font-bold">Comic Archives</p>
                  </div>
                </div>
              )}

              {chamberType && (
                <div className="animate-in fade-in duration-500 pb-10">
                  <button onClick={() => setChamberType(null)} className={`flex items-center gap-2 text-[9px] tracking-widest uppercase mb-6 font-serif ${theme.subText}`}><ChevronLeft size={14} /> Back to Hall</button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20 animate-pulse"><Loader2 size={32} /></div> : 
                      data.map(item => (
                        <div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass}`}>
                          <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" alt="c" />
                          <div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#F3E5AB]'} to-transparent`}>
                            <p className="text-[9px] font-bold tracking-widest text-center font-serif uppercase line-clamp-2 leading-tight">{item.title.english || item.title.romaji}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                  <div className={`flex items-center gap-3 p-4 border rounded-2xl ${theme.glass}`}>
                    <SearchIcon size={16} className="opacity-30" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch()} placeholder="SEARCH THE VOID..." className="bg-transparent border-none outline-none flex-1 text-[10px] tracking-widest uppercase font-serif placeholder:opacity-10" />
                  </div>
                  
                  {/* AESTHETIC FILTERS (AniList Style) */}
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    <button onClick={() => { setSearchFilter(searchFilter === 'ANIME' ? 'MANGA' : 'ANIME'); executeSearch(searchFilter === 'ANIME' ? 'MANGA' : 'ANIME'); }} className={`flex-shrink-0 px-4 py-2 rounded-full border text-[9px] tracking-widest uppercase transition-all ${theme.glass} ${theme.accent}`}>
                      {searchFilter === 'ANIME' ? 'Motion' : 'Ink'}
                    </button>
                    <button onClick={() => { setSearchSort(searchSort === 'TRENDING_DESC' ? 'POPULARITY_DESC' : 'TRENDING_DESC'); executeSearch(); }} className={`flex-shrink-0 px-4 py-2 rounded-full border text-[9px] tracking-widest uppercase transition-all ${theme.glass} opacity-60`}>
                      {searchSort === 'TRENDING_DESC' ? 'Trending' : 'Popular'}
                    </button>
                    <button onClick={() => { setSearchStatus(searchStatus === 'FINISHED' ? 'RELEASING' : 'FINISHED'); executeSearch(); }} className={`flex-shrink-0 px-4 py-2 rounded-full border text-[9px] tracking-widest uppercase transition-all ${theme.glass} opacity-60`}>
                      {searchStatus === 'FINISHED' ? 'Completed' : 'Airing'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <div className="col-span-2 flex justify-center py-20 animate-pulse"><Loader2 size={32} /></div> : 
                      data.map(item => (
                        <div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative ${theme.glass}`}>
                          <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" alt="s" />
                          <div className={`absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#F3E5AB]'} to-transparent`}>
                            <p className="text-[8px] font-bold tracking-widest text-center uppercase line-clamp-1">{item.title.english || item.title.romaji}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'forum' && <div className="py-20 text-center opacity-20 italic font-serif uppercase text-[10px] tracking-widest">The community whispers are silent...</div>}
              {activeTab === 'sanctum' && <div className="py-20 text-center opacity-20 italic font-serif uppercase text-[10px] tracking-widest">Your bound collection is empty...</div>}

              {stage === 'quests' && (
                <div className="fixed inset-0 z-[140] flex flex-col p-8 pt-12 animate-in fade-in" style={{ backgroundColor: isNight ? '#050505' : '#F3E5AB' }}>
                   <div className="space-y-4 max-w-lg mx-auto w-full mt-24">
                     <p className={`text-[10px] tracking-widest uppercase text-center border-b pb-3 border-current/10 mb-6 ${theme.subText}`}>Active Directives</p>
                     {DAILY_QUESTS.map(quest => {
                       const isDone = profile.questsCompleted?.includes(quest.id);
                       return (
                         <div key={quest.id} className={`p-5 border rounded-sm ${theme.glass} ${isDone ? 'opacity-40' : ''}`}>
                           <div className="flex justify-between mb-2">
                             <h4 className="text-xs tracking-widest uppercase font-serif">{quest.title}</h4>
                             <span className={`text-[9px] ${theme.accent}`}>+{quest.xp} XP</span>
                           </div>
                           <p className={`text-[9px] leading-relaxed mb-4 ${theme.subText}`}>{quest.desc}</p>
                           {!isDone && <button onClick={() => handleQuestCompletion(quest.id, quest.xp)} className={`w-full py-2.5 border text-[9px] tracking-widest uppercase ${theme.text}`}>Claim</button>}
                         </div>
                       )
                     })}
                   </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      <nav className={`fixed bottom-6 left-6 right-6 h-16 border rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-1000 ${theme.glass} shadow-xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'hall' ? theme.accent : 'opacity-40'}`}><Home size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Hall</span></button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'search' ? theme.accent : 'opacity-40'}`}><SearchIcon size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Search</span></button>
        <button onClick={() => setActiveTab('forum')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'forum' ? theme.accent : 'opacity-40'}`}><MessageSquare size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Forum</span></button>
        <button onClick={() => setActiveTab('sanctum')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'sanctum' ? theme.accent : 'opacity-40'}`}><BookMarked size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Sanctum</span></button>
      </nav>
    </div>
  );
}

