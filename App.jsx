import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star,
  Moon, Sun, Home, Search as SearchIcon, MessageSquare, BookMarked,
  ArrowUpDown, X, Wand2, Menu, Gamepad2, Trophy, Wallet, Gift, Settings, MoveLeft
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

const Typewriter = ({ text, speed = 40 }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayedText}</span>;
};

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
        <div key={s.id} className="absolute rounded-full opacity-0 animate-stardust transition-colors duration-1000"
          style={{ backgroundColor: color, left: s.left, width: s.size, height: s.size, animationDuration: s.duration, animationDelay: s.delay, boxShadow: `0 0 5px ${color}` }} />
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("ANIME");
  const [searchSort, setSearchSort] = useState("TRENDING_DESC");

  const [libOpen, setLibOpen] = useState(false);
  const [libMsg, setLibMsg] = useState("");

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#F3E5AB]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#402615]',
    subText: isNight ? 'text-white/50' : 'text-black/40',
    glass: isNight ? 'bg-white/5 border-[#F3E5AB]/20 shadow-2xl' : 'bg-black/5 border-[#402615]/20 shadow-2xl',
    accent: isNight ? 'text-[#E6C35C]' : 'text-[#8B5E3C]',
    particle: isNight ? '#F3E5AB' : '#8B5E3C'
  };

  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const progress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

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

  const resetToHome = () => {
    setStage('active');
    setActiveTab('hall');
    setChamberType(null);
    setIsMenuOpen(false);
  }

  const handleQuestCompletion = async (id, xp) => {
    if (profile.questsCompleted.includes(id)) return;
    const up = { ...profile, xp: profile.xp + xp, questsCompleted: [...profile.questsCompleted, id] };
    setProfile(up);
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), up, { merge: true });
  };

  const executeSearch = async (typeOverride = null) => {
    setLoading(true);
    const finalType = typeOverride || searchFilter;
    const apiQuery = `query($search: String, $type: MediaType, $sort: [MediaSort]){ Page(perPage: 12){ media(search: $search, type: $type, sort: $sort){ id title { english romaji } coverImage { extraLarge } averageScore } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: apiQuery, variables: { search: searchQuery || undefined, type: finalType, sort: [searchSort] } })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
      handleQuestCompletion('q1', 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleLibrarian = () => {
    if (!libOpen) {
      const dialogues = {
        hall: [`Archon ${profile.name}, the archives are steady.`, "Seek your focus, Seeker.", "The stars recognize your current rank."],
        search: ["Find your truth.", "Precision unlocks the vault."],
        sanctum: ["Your bound collection is secure."]
      };
      const pool = dialogues[activeTab] || dialogues.hall;
      setLibMsg(pool[Math.floor(Math.random() * pool.length)]);
    }
    setLibOpen(!libOpen);
  };

  const MenuIcon = ({ icon: Icon, label, onClick }) => (
    <div onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-2xl transition-all active:scale-90 cursor-pointer ${theme.glass}`}>
      <Icon size={24} className={theme.accent} />
      <span className="text-[8px] tracking-widest uppercase font-serif font-bold text-center">{label}</span>
    </div>
  );

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-hidden relative flex flex-col items-center font-sans`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600&display=swap');
        @keyframes stardust { 0% { transform: translateY(-10vh); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        .animate-stardust { animation: stardust linear infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Stardust color={theme.particle} />

      {/* FIXED TOP SYSTEM BAR */}
      <div className="fixed top-6 left-6 right-6 z-[160] flex items-start justify-between">
        {/* LOGO AREA - MADE CLICKABLE TO RESET TO HOME AND RESIZED */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button onClick={resetToHome} className="flex flex-col items-start gap-1 group">
             {/* Logo Icon made bigger (size 30) */}
             <Library size={30} className={`${theme.accent} transition-transform group-hover:scale-110 active:scale-95`} />
             
             {/* Text title logic updated to only show when not in directives stage */}
             {stage !== 'quests' && (
                <span className="text-[10px] tracking-[0.3em] font-serif font-bold uppercase ${theme.text} opacity-80 animate-in fade-in">
                  Aniomics
                </span>
             )}
          </button>
          
          {/* BACK ARROW - Only shown during Quests stage */}
          {stage === 'quests' && (
             <button onClick={() => setStage('active')} className={`p-1 mt-2 ${theme.text} opacity-70 active:scale-95 animate-in slide-in-from-top-1 fade-in`}>
               <MoveLeft size={20} />
             </button>
          )}
        </div>

        {/* CONTROLS AREA (TOP RIGHT) */}
        <div className="flex items-center gap-3 mt-1">
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className={`p-2.5 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-sm opacity-80`}>
            {isNight ? <Moon size={14} className="animate-pulse" /> : <Sun size={14} className="animate-spin-slow" />}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`p-3 rounded-full border backdrop-blur-xl ${theme.glass} active:scale-90 shadow-lg`}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ARCHON'S DRAWER */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-[200] backdrop-blur-3xl animate-in fade-in zoom-in duration-300 flex flex-col p-8 ${isNight ? 'bg-black/90' : 'bg-[#F3E5AB]/95'}`}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-serif tracking-widest uppercase text-center w-full">Archon's Tools</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 opacity-50 absolute right-8"><X size={28} /></button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            <MenuIcon icon={Gamepad2} label="Trials" />
            <MenuIcon icon={Target} label="Directives" onClick={() => { setStage('quests'); setIsMenuOpen(false); }} />
            <MenuIcon icon={Trophy} label="Rankings" />
            <MenuIcon icon={Wallet} label="Essence" />
            <MenuIcon icon={Gift} label="Runes" />
            <MenuIcon icon={Settings} label="Sanctuary" />
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

      {/* THE ARCHIVIST (LIBRARIAN) */}
      {stage === 'active' && !isMenuOpen && (
        <div className="fixed bottom-28 left-6 z-[100] flex items-end gap-3 pointer-events-none">
          <button onClick={toggleLibrarian} className={`pointer-events-auto p-4 rounded-full border backdrop-blur-3xl animate-breathe ${theme.glass} ${libOpen ? 'border-[#E6C35C]' : ''}`}>
            <Wand2 size={22} className={libOpen ? 'text-[#E6C35C]' : 'opacity-60'} />
          </button>
          {libOpen && (
            <div className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-3xl max-w-[180px] animate-in slide-in-from-left-4 fade-in duration-500 mb-2 ${theme.glass}`}>
              <p className="text-[10px] font-serif tracking-widest leading-relaxed italic"><Typewriter text={libMsg} /></p>
            </div>
          )}
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
          <div className="w-full h-full flex flex-col p-6 pt-20 animate-in fade-in duration-700 overflow-hidden">
            
            {/* KNOWLEDGE HEADER - CENTERED */}
            <header className="mb-6 flex flex-col items-center text-center">
              <div className="w-full flex flex-col items-center mb-4 font-serif">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={10} className={currentRank.color} />
                  <span className={`text-[9px] tracking-widest font-bold uppercase ${currentRank.color}`}>{currentRank.title}</span>
                </div>
                <h2 className="text-xl tracking-[0.2em] uppercase">{profile.name}</h2>
                <div className="mt-2">
                  <p className="text-[8px] tracking-widest uppercase opacity-40 mb-1">Knowledge</p>
                  <p className="text-sm text-[#E6C35C]">{profile.xp} <span className="opacity-30 text-[10px]">/ {nextRank.minXp}</span></p>
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
                    <p className="text-[9px] opacity-40 tracking-widest uppercase text-center">Anime Archives</p>
                  </div>
                  <div onClick={() => { setChamberType("MANGA"); setSearchFilter("MANGA"); executeSearch("MANGA"); }} className={`h-64 rounded-t-full border p-6 flex flex-col items-center justify-end cursor-pointer transition-all hover:scale-[1.02] ${theme.glass}`}>
                    <Scroll size={28} className="text-[#E6C35C] mb-4" />
                    <h3 className="text-xl tracking-widest font-serif uppercase text-center">Ink</h3>
                    <p className="text-[9px] opacity-40 tracking-widest uppercase text-center">Comic Archives</p>
                  </div>
                </div>
              )}

              {chamberType && (
                <div className="animate-in fade-in duration-500 pb-10">
                  <button onClick={() => setChamberType(null)} className="flex items-center gap-2 text-[9px] tracking-widest opacity-40 mb-6 font-serif uppercase">
                    <ChevronLeft size={14} /> Back to Hall
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? <Sparkles className="animate-pulse mx-auto col-span-2 py-20" /> : 
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
                  <div className={`flex rounded-xl border p-1 ${theme.glass}`}>
                    <button onClick={() => setSearchFilter("ANIME")} className={`flex-1 py-2 text-[8px] uppercase tracking-widest rounded-lg ${searchFilter === 'ANIME' ? 'bg-[#E6C35C] text-black font-bold' : 'opacity-40'}`}>Motion</button>
                    <button onClick={() => setSearchFilter("MANGA")} className={`flex-1 py-2 text-[8px] uppercase tracking-widest rounded-lg ${searchFilter === 'MANGA' ? 'bg-[#E6C35C] text-black font-bold' : 'opacity-40'}`}>Ink</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.map(item => (
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

              {activeTab === 'forum' && (
                <div className="py-20 text-center opacity-20 italic animate-in fade-in">
                  <MessageSquare size={40} className="mx-auto mb-4" />
                  <p className="text-[9px] tracking-widest uppercase">The community hall is currently silent</p>
                </div>
              )}

              {activeTab === 'sanctum' && (
                <div className="py-20 text-center opacity-20 italic animate-in fade-in">
                  <BookMarked size={40} className="mx-auto mb-4" />
                  <p className="text-[9px] tracking-widest uppercase">Your inner sanctum awaits its first scroll</p>
                </div>
              )}

              {stage === 'quests' && (
                <div className="fixed inset-0 z-[140] flex flex-col p-8 pt-12 animate-in fade-in" style={{ backgroundColor: isNight ? '#050505' : '#F3E5AB' }}>
                   {/* Spacing updated to clear the logo/controls area */}
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
                           {!isDone && <button onClick={() => handleQuestCompletion(quest.id, quest.xp)} className="w-full py-2.5 border text-[9px] tracking-widest uppercase">Claim</button>}
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

      {/* BOTTOM NAV */}
      <nav className={`fixed bottom-6 left-6 right-6 h-16 border rounded-full backdrop-blur-3xl z-[90] flex items-center justify-around px-4 transition-all duration-1000 ${theme.glass} shadow-xl`}>
        <button onClick={() => { setActiveTab('hall'); setChamberType(null); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'hall' ? theme.accent : 'opacity-40'}`}><Home size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Hall</span></button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'search' ? theme.accent : 'opacity-40'}`}><SearchIcon size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Search</span></button>
        <button onClick={() => setActiveTab('forum')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'forum' ? theme.accent : 'opacity-40'}`}><MessageSquare size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Forum</span></button>
        <button onClick={() => setActiveTab('sanctum')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'sanctum' ? theme.accent : 'opacity-40'}`}><BookMarked size={20} /><span className="text-[7px] uppercase font-bold tracking-tighter">Sanctum</span></button>
      </nav>
      
    </div>
  );
}


