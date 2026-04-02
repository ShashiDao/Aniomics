import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  Library, Zap, Scroll, ChevronLeft, 
  Target, Star, Moon, Sun, Home, 
  Search as SearchIcon, MessageSquare, BookMarked,
  X, Wand2, Menu, Gamepad2, Trophy, 
  Wallet, Gift, Settings, MoveLeft, Send, Loader2, CheckCircle2, Activity, Sparkles
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

// --- ATMOSPHERE ---
const Atmosphere = ({ phase, color }) => {
  const isNight = phase === 'night';
  const particles = useMemo(() => Array.from({ length: isNight ? 80 : 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: isNight ? `${Math.random() * 0.4 + 0.3}s` : `${Math.random() * 15 + 5}s`,
    delay: `${Math.random() * 5}s`,
    opacity: isNight ? Math.random() * 0.3 + 0.1 : Math.random() * 0.2 + 0.05,
    size: isNight ? '1px' : `${Math.random() * 3 + 1}px`,
    height: isNight ? `${Math.random() * 30 + 10}px` : `${Math.random() * 3 + 1}px`,
  })), [isNight]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className={`absolute transition-colors duration-1000 ${isNight ? 'animate-rain' : 'animate-sandstorm'}`}
          style={{ backgroundColor: color, left: p.left, top: isNight ? '-40px' : p.top, width: p.size, height: p.height, opacity: p.opacity, animationDuration: p.duration, animationDelay: p.delay, filter: !isNight ? 'blur(1px)' : 'none' }} />
      ))}
    </div>
  );
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
  const [linkedSoul, setLinkedSoul] = useState(null);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const chatEndRef = useRef(null);

  const isNight = phase === 'night';
  const theme = {
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
      if (snap.exists()) { 
        const d = snap.data();
        setProfile({ ...d, affinity: d.affinity || {} });
        setStage('active'); 
        checkSoulResonance(d.affinity || {});
      }
    });
  }, [user]);

  // Logic to find a "Linked Soul"
  const checkSoulResonance = async (myAffinity) => {
    if (!user || Object.keys(myAffinity).length === 0) return;
    const usersRef = collection(db, 'aniomics_v1', 'users');
    const q = query(usersRef, limit(5)); // Simplified for performance
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
      if (doc.id !== user.uid) {
        const peer = doc.data().profile;
        if (peer && peer.affinity) {
          // Compare top genre
          const myTop = Object.entries(myAffinity).sort((a,b) => b[1]-a[1])[0][0];
          const peerTop = Object.entries(peer.affinity).sort((a,b) => b[1]-a[1])[0]?.[0];
          if (myTop === peerTop) setLinkedSoul(peer);
        }
      }
    });
  };

  const updateAffinity = async (genres) => {
    if (!user || !genres) return;
    const newAffinity = { ...profile.affinity };
    genres.forEach(g => { newAffinity[g] = (newAffinity[g] || 0) + 1; });
    await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), { affinity: newAffinity }, { merge: true });
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
    const q = `query($s:String,$t:MediaType){Page(perPage:12){media(search:$s,type:$t){id title{english romaji}genres coverImage{extraLarge}}}}`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, variables: { s: searchQuery || undefined, t: t || searchFilter } })
      });
      const d = await res.json();
      const results = d?.data?.Page?.media || [];
      setData(results);
      // Harvest genres from the first result as an example of interest
      if (results.length > 0) updateAffinity(results[0].genres);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetToHome = () => {
    setStage('active'); setActiveTab('hall'); setChamberType(null); setGateOpening(null);
    setIsMenuOpen(false); setIsLibrarianOpen(false);
  };

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-hidden relative flex flex-col items-center font-sans`}>
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
      
      <Atmosphere phase={phase} color={theme.particle} />

      {/* TOP HEADER */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between">
        <button onClick={resetToHome} className="flex flex-col items-start gap-1">
          <Library size={48} className={`${theme.accent} drop-shadow-xl active:scale-90`} />
          <span className="text-[11px] tracking-[0.3em] font-serif font-bold uppercase opacity-80">Aniomics</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border ${theme.glass} shadow-sm opacity-80`}><Moon size={16} /></button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border ${theme.glass} shadow-lg`}><Menu size={24} /></button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="z-10 w-full h-full max-w-lg flex flex-col relative pb-24">
        <div className="w-full h-full flex flex-col p-6 pt-24 overflow-hidden">
          
          {/* Rank & User Info (Always visible in Hall) */}
          {activeTab === 'hall' && (
            <header className="mb-8 flex flex-col items-center text-center animate-in fade-in">
              <div className="flex items-center gap-2 mb-2 font-serif"><Star size={10} className={currentRank.color} /><span className={`text-[10px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span></div>
              <h2 className="text-2xl tracking-[0.3em] font-serif uppercase">{profile.name}</h2>
              <div className="h-[3px] w-4/5 bg-current/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${currentRank.bar} transition-all duration-1000 shadow-lg`} style={{ width: `${progress}%` }} /></div>
            </header>
          )}

          <main className="flex-1 overflow-y-auto hide-scrollbar pb-10 flex flex-col">
            
            {/* HALL TAB: GATE UI */}
            {activeTab === 'hall' && !chamberType && (
              <div className="flex-1 grid grid-cols-2 gap-4 py-8">
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

            {/* SEARCH TAB */}
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

            {/* SANCTUM TAB: SOUL LINK & AFFINITY */}
            {activeTab === 'sanctum' && (
              <div className="flex-1 flex flex-col gap-8 pt-4 animate-in slide-in-from-bottom-6">
                <div className="text-center">
                  <h3 className="text-lg tracking-widest font-serif uppercase mb-2">Soul Affinity</h3>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">Your resonance with the genres of the void</p>
                </div>

                {/* Affinity Stats */}
                <div className={`p-6 border rounded-2xl ${theme.glass} space-y-4`}>
                  {Object.entries(profile.affinity).length === 0 ? (
                    <p className="text-[10px] text-center opacity-40 italic">Search the archives to build your affinity...</p>
                  ) : (
                    Object.entries(profile.affinity).sort((a,b) => b[1]-a[1]).slice(0,4).map(([genre, count]) => (
                      <div key={genre} className="space-y-1">
                        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest"><span>{genre}</span><span>{count} Resonance</span></div>
                        <div className="h-1 bg-current/5 w-full rounded-full overflow-hidden"><div className={`h-full ${theme.accent} bg-current opacity-60`} style={{ width: `${Math.min(count * 10, 100)}%` }} /></div>
                      </div>
                    ))
                  )}
                </div>

                {/* RESONANCE ENGINE (SOUL LINK) */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-4 justify-center"><Activity size={14} className={theme.accent} /><h4 className="text-[11px] uppercase tracking-[0.3em] font-bold">Resonance Engine</h4></div>
                  {linkedSoul ? (
                    <div className={`p-6 border-2 border-dashed ${theme.accent} rounded-3xl flex flex-col items-center gap-4 bg-current/5 animate-pulse`}>
                      <Sparkles className={theme.accent} />
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest opacity-60">Soul Resonating With</p>
                        <p className="text-xl font-serif tracking-widest uppercase mt-1">{linkedSoul.name}</p>
                        <p className={`text-[8px] uppercase tracking-widest mt-2 px-3 py-1 rounded-full border border-current/20 inline-block`}>Same {Object.entries(profile.affinity).sort((a,b) => b[1]-a[1])[0][0]} Frequency</p>
                      </div>
                      <button className={`mt-2 px-6 py-2 border rounded-full text-[9px] uppercase font-bold tracking-widest bg-current ${isNight ? 'text-black' : 'text-white'}`}>Join Spirits</button>
                    </div>
                  ) : (
                    <div className={`p-8 border rounded-2xl ${theme.glass} flex flex-col items-center gap-3 opacity-40`}>
                      <Loader2 size={24} className="animate-spin-slow" />
                      <p className="text-[10px] uppercase tracking-widest">Searching the reaches of the sanctuary...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className={`fixed bottom-6 left-6 right-6 h-16 border-2 rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-700 ${theme.glass} shadow-2xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={activeTab === 'hall' ? theme.accent : 'opacity-40'}><Home size={28} /></button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? theme.accent : 'opacity-40'}><SearchIcon size={28} /></button>
        <button onClick={() => setActiveTab('forum')} className={activeTab === 'forum' ? theme.accent : 'opacity-40'}><MessageSquare size={28} /></button>
        <button onClick={() => setActiveTab('sanctum')} className={activeTab === 'sanctum' ? theme.accent : 'opacity-40'}><BookMarked size={28} /></button>
      </nav>
    </div>
  );
}


                
