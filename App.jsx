import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star,
  Moon, Sun, Home, Search as SearchIcon, MessageSquare, BookMarked,
  Filter, ArrowUpDown, X
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

const Stardust = ({ color }) => {
  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 10}s`,
    size: `${Math.random() * 3 + 0.5}px`,
    opacity: Math.random() * 0.5 + 0.1,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(s => (
        <div 
          key={s.id} 
          className="absolute rounded-full opacity-0 animate-stardust transition-colors duration-1000"
          style={{ 
            backgroundColor: color,
            left: s.left, width: s.size, height: s.size,
            animationDuration: s.duration, animationDelay: s.delay,
            boxShadow: `0 0 5px ${color}`
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
  const [profile, setProfile] = useState({ name: '', xp: 0, questsCompleted: [] });
  const [stage, setStage] = useState('entrance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [chamberType, setChamberType] = useState(null);

  // Search Logic States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME"); // ANIME | MANGA
  const [searchSort, setSearchSort] = useState("TRENDING_DESC"); // TRENDING_DESC | POPULARITY_DESC

  // Librarian Logic States
  const [libOpen, setLibOpen] = useState(false);
  const [libMsg, setLibMsg] = useState("Greetings, Seeker. How may I guide your path?");

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#F3E5AB]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#402615]',
    subText: isNight ? 'text-white/50' : 'text-black/40',
    glass: isNight ? 'bg-white/5 border-[#F3E5AB]/20 shadow-[0_0_30px_rgba(243,229,171,0.05)]' : 'bg-black/5 border-[#402615]/20 shadow-[0_0_30px_rgba(64,38,21,0.05)]',
    accent: isNight ? 'text-[#E6C35C]' : 'text-[#8B5E3C]',
    particle: isNight ? '#F3E5AB' : '#8B5E3C'
  };

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'aniomics_v1', 'users', u.uid, 'profile'));
        if (snap.exists()) {
          const d = snap.data();
          setProfile({ ...d, questsCompleted: d.questsCompleted || [] });
          setStage('active');
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name:");
    if (!n) return;
    const p = { name: n, xp: 0, questsCompleted: ['q2'] };
    setProfile(p);
    setStage('active');
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), p);
  };

  const handleQuestCompletion = async (id, xp) => {
    if (profile.questsCompleted.includes(id)) return;
    const up = { ...profile, xp: profile.xp + xp, questsCompleted: [...profile.questsCompleted, id] };
    setProfile(up);
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), up, { merge: true });
  };

  const executeSearch = async (queryOverride = null) => {
    setLoading(true);
    const q = queryOverride !== null ? queryOverride : searchQuery;
    const apiQuery = `
      query($search: String, $type: MediaType, $sort: [MediaSort]){
        Page(perPage: 12){
          media(search: $search, type: $type, sort: $sort){
            id title { english romaji } coverImage { extraLarge } averageScore
          }
        }
      }`;
    
    const variables = {
      search: q || undefined,
      type: searchFilter,
      sort: [searchSort]
    };

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: apiQuery, variables })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
      if (q) handleQuestCompletion('q1', 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const progress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

  const updateLibrarian = () => {
    setLibOpen(!libOpen);
    if (!libOpen) {
      const msgs = [
        `Archon ${profile.name}, your knowledge is ${profile.xp} units strong.`,
        "Seeking scrolls of ink or motion today?",
        "I have prepared the archives for your arrival.",
        "The stars are aligned for a rare discovery.",
        `Only ${nextRank.minXp - profile.xp} more XP until you become a ${nextRank.title}.`
      ];
      setLibMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setChamberType(null); setData([]); setSearchQuery(""); }}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === id ? 'opacity-100 scale-110 text-[#E6C35C]' : 'opacity-40 hover:opacity-70'}`}
    >
      <Icon size={20} />
      <span className="text-[8px] tracking-[0.2em] uppercase font-serif font-bold">{label}</span>
    </button>
  );

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-hidden relative flex flex-col items-center font-sans`}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600&display=swap');
        @keyframes stardust {
          0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-stardust { animation-name: stardust; animation-timing-function: linear; animation-iteration-count: infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Stardust color={theme.particle} />

      {/* PHASE TOGGLE */}
      <button 
        onClick={() => setPhase(isNight ? 'day' : 'night')}
        className={`fixed top-6 right-6 z-[60] p-3 rounded-full border backdrop-blur-xl transition-all duration-700 active:scale-90 ${theme.glass}`}
      >
        {isNight ? <Moon size={18} className="animate-pulse" /> : <Sun size={18} className="animate-spin-slow" />}
      </button>

      {/* LIBRARIAN FLOATING SYSTEM */}
      {stage === 'active' && (
        <div className="fixed bottom-28 left-6 z-[80] flex items-end gap-3 pointer-events-none">
          <button 
            onClick={updateLibrarian}
            className={`pointer-events-auto p-4 rounded-full border backdrop-blur-3xl shadow-2xl transition-all active:scale-95 ${theme.glass} ${libOpen ? 'border-[#E6C35C]/50' : ''}`}
          >
            <Sparkles size={24} className={libOpen ? 'text-[#E6C35C]' : 'opacity-60'} />
          </button>
          
          {libOpen && (
            <div className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-3xl max-w-[200px] animate-in slide-in-from-left-4 fade-in duration-300 mb-2 ${theme.glass}`}>
              <p className="text-[10px] font-serif tracking-widest leading-relaxed">{libMsg}</p>
            </div>
          )}
        </div>
      )}

      <div className="z-10 w-full h-full max-w-lg flex flex-col relative pb-24">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-1000">
            <div className={`border rounded-t-full pt-20 pb-12 px-10 backdrop-blur-xl transition-all duration-1000 ${theme.glass}`}>
              <Library size={56} className="text-[#E6C35C] mb-6 mx-auto" />
              <h1 className="text-4xl tracking-[0.3em] font-serif font-semibold">ANIOMICS</h1>
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-40 mt-6 mb-12">The Grand Library</p>
              <button onClick={handleRitual} className={`px-8 py-4 border rounded-sm text-[10px] tracking-[0.3em] uppercase font-serif hover:bg-[#E6C35C] hover:text-[#050505] transition-all`}>Initiate Ritual</button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-12 animate-in fade-in duration-700 overflow-hidden">
            
            <header className="mb-6 flex-shrink-0">
              <div className="flex justify-between items-end mb-4 font-serif">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={10} className={currentRank.color} />
                    <span className={`text-[9px] tracking-widest uppercase font-bold ${currentRank.color}`}>{currentRank.title}</span>
                  </div>
                  <h2 className="text-xl tracking-widest uppercase">{profile.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[8px] tracking-widest uppercase opacity-40 mb-1">Knowledge</p>
                  <p className="text-sm text-[#E6C35C] font-serif">{profile.xp} <span className="opacity-30 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              <div className="h-[2px] w-full bg-current/10 rounded-full overflow-hidden">
                <div className={`h-full ${currentRank.bar} transition-all duration-1000`} style={{ width: `${progress}%` }} />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar">
              
              {/* HALL TAB */}
              {activeTab === 'hall' && !chamberType && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <p className="text-[9px] tracking-widest uppercase text-center opacity-40 font-serif mb-4">Select a Chamber</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => { setSearchFilter("ANIME"); setChamberType("ANIME"); executeSearch(); }} className={`h-52 rounded-t-full border p-4 flex flex-col items-center justify-end cursor-pointer group transition-all hover:scale-[1.02] ${theme.glass}`}>
                      <Zap size={24} className="text-[#E6C35C] mb-4" />
                      <h3 className="text-lg tracking-widest font-serif uppercase">Motion</h3>
                      <p className="text-[8px] opacity-40 tracking-widest uppercase">Anime Archives</p>
                    </div>
                    <div onClick={() => { setSearchFilter("MANGA"); setChamberType("MANGA"); executeSearch(); }} className={`h-52 rounded-t-full border p-4 flex flex-col items-center justify-end cursor-pointer group transition-all hover:scale-[1.02] ${theme.glass}`}>
                      <Scroll size={24} className="text-[#E6C35C] mb-4" />
                      <h3 className="text-lg tracking-widest font-serif uppercase">Ink</h3>
                      <p className="text-[8px] opacity-40 tracking-widest uppercase">Comic Archives</p>
                    </div>
                  </div>
                  <div onClick={() => setStage('quests')} className={`h-16 border px-5 flex items-center justify-between rounded-sm cursor-pointer ${theme.glass}`}>
                    <div className="flex items-center gap-4">
                      <Target size={18} className="text-[#E6C35C]" />
                      <h3 className="text-xs tracking-widest font-serif uppercase">Sacred Directives</h3>
                    </div>
                    <ChevronRight size={16} className="opacity-20" />
                  </div>
                </div>
              )}

              {/* CHAMBER VIEW */}
              {chamberType && (
                <div className="animate-in fade-in duration-500">
                  <button onClick={() => setChamberType(null)} className="flex items-center gap-2 text-[9px] tracking-widest opacity-40 mb-6 font-serif uppercase hover:opacity-100 transition-opacity">
                    <ChevronLeft size={14} /> Back to Hall
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-30 gap-4">
                        <Sparkles className="animate-pulse" size={32} />
                        <p className="text-[9px] tracking-widest font-serif uppercase">Summoning Scrolls...</p>
                      </div>
                    ) : (
                      data.map(item => (
                        <div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass}`}>
                          <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="c" />
                          <div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-[#050505]' : 'from-[#F3E5AB]'} via-transparent to-transparent`}>
                            <p className="text-[9px] font-bold tracking-widest text-center font-serif uppercase leading-tight line-clamp-2">{item.title.english || item.title.romaji}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SEARCH TAB (AniList Style Filtered) */}
              {activeTab === 'search' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                  {/* SEARCH BAR */}
                  <div className={`flex items-center gap-4 p-3 border rounded-xl ${theme.glass}`}>
                    <SearchIcon size={16} className="opacity-30" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                      placeholder="QUERY THE VOID..." 
                      className="bg-transparent border-none outline-none flex-1 text-[10px] tracking-widest uppercase font-serif placeholder:opacity-20" 
                    />
                    {searchQuery && <X size={14} className="opacity-30" onClick={() => setSearchQuery("")} />}
                  </div>

                  {/* FILTERS & SORT */}
                  <div className="flex gap-2 items-center">
                    <div className={`flex flex-1 rounded-lg border p-1 ${theme.glass}`}>
                      <button 
                        onClick={() => setSearchFilter("ANIME")}
                        className={`flex-1 py-1 text-[8px] uppercase tracking-widest rounded-md transition-all ${searchFilter === 'ANIME' ? 'bg-[#E6C35C] text-black font-bold' : 'opacity-40'}`}
                      >Motion</button>
                      <button 
                        onClick={() => setSearchFilter("MANGA")}
                        className={`flex-1 py-1 text-[8px] uppercase tracking-widest rounded-md transition-all ${searchFilter === 'MANGA' ? 'bg-[#E6C35C] text-black font-bold' : 'opacity-40'}`}
                      >Ink</button>
                    </div>
                    <button 
                      onClick={() => setSearchSort(searchSort === 'TRENDING_DESC' ? 'POPULARITY_DESC' : 'TRENDING_DESC')}
                      className={`p-2 border rounded-lg ${theme.glass} flex items-center gap-2 text-[8px] uppercase tracking-widest transition-all ${searchSort === 'POPULARITY_DESC' ? 'text-[#E6C35C]' : 'opacity-40'}`}
                    >
                      <ArrowUpDown size={12} /> {searchSort.includes('TREND') ? 'Trend' : 'Pop'}
                    </button>
                    <button 
                      onClick={() => executeSearch()}
                      className={`p-2 border rounded-lg ${theme.glass} text-[#E6C35C] hover:bg-[#E6C35C] hover:text-black transition-all`}
                    >
                      <SearchIcon size={12} />
                    </button>
                  </div>

                  {/* SEARCH RESULTS */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {loading ? (
                      <div className="col-span-2 py-20 flex justify-center opacity-30"><Sparkles className="animate-spin" /></div>
                    ) : (
                      data.length > 0 ? data.map(item => (
                        <div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass} animate-in fade-in duration-300`}>
                          <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60" alt="s" />
                          <div className={`absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-black' : 'from-[#F3E5AB]'} to-transparent`}>
                            <p className="text-[8px] font-bold tracking-widest text-center font-serif uppercase line-clamp-1">{item.title.english || item.title.romaji}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-20 text-center opacity-20">
                          <p className="text-[10px] tracking-widest font-serif uppercase italic">Enter a query to summon scrolls</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* FORUM & SANCTUM - Same placeholders but themed */}
              {activeTab === 'forum' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <p className="text-[9px] tracking-widest uppercase text-center opacity-40 font-serif mb-6 border-b border-current/10 pb-4">Community Lore</p>
                  {[1, 2].map(i => (
                    <div key={i} className={`p-4 border rounded-sm ${theme.glass}`}>
                      <h4 className="text-[10px] font-serif tracking-widest uppercase mb-1">Archive Entry {i}</h4>
                      <p className="text-[9px] opacity-50 font-inter leading-relaxed">The stars suggest a high-level ritual taking place in the eastern wing...</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'sanctum' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                  <div className="text-center space-y-2 border-b border-current/10 pb-6 mb-4">
                    <h3 className="text-lg font-serif tracking-widest uppercase">The Sanctum</h3>
                    <p className="text-[9px] tracking-widest opacity-40 uppercase font-serif">Bound scrolls and favored items</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 text-center gap-4 italic">
                    <BookMarked size={40} />
                    <p className="text-[9px] tracking-[0.3em] font-serif uppercase">Your shelves are currently empty</p>
                  </div>
                </div>
              )}

            </main>
          </div>
        )}
      </div>

      <nav className={`fixed bottom-6 left-6 right-6 h-16 border rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-1000 ${theme.glass} shadow-2xl`}>
        <NavItem id="hall" icon={Home} label="Hall" />
        <NavItem id="search" icon={SearchIcon} label="Search" />
        <NavItem id="forum" icon={MessageSquare} label="Forum" />
        <NavItem id="sanctum" icon={BookMarked} label="Sanctum" />
      </nav>
      
    </div>
  );
}

