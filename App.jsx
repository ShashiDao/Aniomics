import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star,
  Moon, Sun, Home, Search, MessageSquare, BookMarked
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
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

// --- RPG LOGIC & CONSTANTS ---
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
  { id: 'q3', title: 'Seeker of Truth', xp: 100, desc: 'Discover 3 new titles. (Claimable)' }
];

// --- 3D STARDUST COMPONENT ---
const Stardust = ({ color }) => {
  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => {
    const size = Math.random() * 3 + 0.5;
    const duration = Math.random() * 15 + 10;
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${duration}s`,
      animationDelay: `${Math.random() * 10}s`,
      size: `${size}px`,
      opacity: Math.random() * 0.5 + 0.1,
      blur: size > 2 ? 'blur-[1px]' : 'blur-none'
    };
  }), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(s => (
        <div 
          key={s.id} 
          className="absolute rounded-full opacity-0 animate-stardust transition-colors duration-1000"
          style={{ 
            backgroundColor: color,
            left: s.left, 
            width: s.size, 
            height: s.size, 
            animationDuration: s.animationDuration, 
            animationDelay: s.delay,
            boxShadow: `0 0 ${parseFloat(s.size) * 2}px ${color}`
          }} 
        />
      ))}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [phase, setPhase] = useState('night'); // night | day
  const [activeTab, setActiveTab] = useState('hall'); // hall | search | forum | sanctum
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, questsCompleted: [] });
  const [stage, setStage] = useState('entrance'); // entrance | sanctuary | quests
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Theme Calculation
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
          const dataSnap = snap.data();
          setProfile({ ...dataSnap, questsCompleted: dataSnap.questsCompleted || [] }); 
          setStage('hall'); 
          if (!dataSnap.questsCompleted?.includes('q2')) handleQuestCompletion('q2', 20, dataSnap);
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name upon the obsidian:");
    if (!n) return;
    const p = { name: n, xp: 0, questsCompleted: ['q2'] }; 
    setProfile(p);
    setStage('hall');
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), p);
  };

  const handleQuestCompletion = async (questId, xpReward, currentProfile = profile) => {
    if (currentProfile.questsCompleted?.includes(questId)) return;
    const newProfile = { 
      ...currentProfile, 
      xp: currentProfile.xp + xpReward, 
      questsCompleted: [...(currentProfile.questsCompleted || []), questId] 
    };
    setProfile(newProfile);
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), newProfile, { merge: true });
  };

  const fetchData = async (type) => {
    setLoading(true);
    setStage('sanctuary');
    handleQuestCompletion('q1', 50);
    const query = `query($t: MediaType){ Page(perPage: 10){ media(type: $t, sort: TRENDING_DESC){ id title { english romaji } coverImage { extraLarge } } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { t: type.toUpperCase() } })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const xpProgress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

  // Nav Item Component
  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setStage('hall'); }}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === id ? 'opacity-100 scale-110 text-[#E6C35C]' : 'opacity-40 hover:opacity-70'}`}
    >
      <Icon size={20} />
      <span className="text-[8px] tracking-widest uppercase font-serif font-bold">{label}</span>
    </button>
  );

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} transition-colors duration-1000 overflow-hidden relative flex flex-col items-center justify-center font-inter`}>
      
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
        .font-inter { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      <Stardust color={theme.particle} />

      {/* Day/Night Toggle */}
      <button 
        onClick={() => setPhase(isNight ? 'day' : 'night')}
        className={`fixed top-6 right-6 z-[60] p-3 rounded-full border backdrop-blur-xl transition-all duration-700 active:scale-90 ${theme.glass}`}
      >
        {isNight ? <Moon size={20} className="animate-pulse" /> : <Sun size={20} className="animate-spin-slow" />}
      </button>

      <div className="z-10 w-full h-full flex flex-col relative max-w-lg">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-1000">
            <div className={`border rounded-t-full pt-20 pb-12 px-10 flex flex-col items-center relative backdrop-blur-xl transition-all duration-1000 ${theme.glass}`}>
              <Library size={56} className={`${theme.accent} mb-6 relative z-10 drop-shadow-md`} />
              <h1 className="text-4xl tracking-[0.3em] font-cinzel font-semibold">ANIOMICS</h1>
              <div className="w-[1px] h-16 bg-gradient-to-b from-current to-transparent opacity-20 mx-auto my-6" />
              <p className={`text-[10px] tracking-[0.3em] uppercase font-light mb-12 ${theme.subText}`}>The Grand Library</p>
              <button onClick={handleRitual} className={`px-8 py-4 border rounded-sm text-[10px] tracking-[0.3em] uppercase backdrop-blur-md font-cinzel transition-all ${theme.glass} ${theme.accent} hover:scale-105`}>
                Initiate Ritual
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-12 animate-in fade-in duration-700">
            
            {/* Header with RPG Progress */}
            <header className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className={currentRank.color} />
                    <p className={`text-[10px] font-bold tracking-[0.3em] uppercase font-cinzel ${currentRank.color}`}>
                      {currentRank.title}
                    </p>
                  </div>
                  <h2 className="text-xl tracking-[0.3em] uppercase font-cinzel">{profile.name}</h2>
                </div>
                <div className="text-right">
                  <p className={`text-[9px] tracking-[0.3em] uppercase mb-1 font-inter ${theme.subText}`}>Knowledge</p>
                  <p className={`text-sm tracking-[0.2em] font-cinzel ${theme.accent}`}>{profile.xp} <span className="opacity-30 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              <div className="h-[2px] w-full bg-current/10 overflow-hidden shadow-inner rounded-full">
                <div className={`h-full ${currentRank.bar} transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor]`} style={{ width: `${xpProgress}%` }} />
              </div>
            </header>

            {/* Content Swapper based on activeTab and stage */}
            <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
              
              {activeTab === 'hall' && (
                <>
                  {stage === 'hall' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                      <p className={`text-[10px] tracking-[0.3em] uppercase text-center font-cinzel mb-4 ${theme.subText}`}>Select a Chamber</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => fetchData('ANIME')} className={`h-56 rounded-t-full border p-4 flex flex-col items-center justify-end relative overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-105 ${theme.glass}`}>
                          <Zap size={24} className={`${theme.accent} mb-4`} />
                          <h3 className="text-lg tracking-[0.3em] uppercase font-cinzel mb-2">Motion</h3>
                          <p className={`text-[9px] tracking-[0.2em] uppercase mb-4 font-inter ${theme.subText}`}>Anime Archives</p>
                        </div>
                        <div onClick={() => fetchData('MANGA')} className={`h-56 rounded-t-full border p-4 flex flex-col items-center justify-end relative overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-105 ${theme.glass}`}>
                          <Scroll size={24} className={`${theme.accent} mb-4`} />
                          <h3 className="text-lg tracking-[0.3em] uppercase font-cinzel mb-2">Ink</h3>
                          <p className={`text-[9px] tracking-[0.2em] uppercase mb-4 font-inter ${theme.subText}`}>Comic Archives</p>
                        </div>
                      </div>
                      <div onClick={() => setStage('quests')} className={`mt-6 h-16 border px-5 flex items-center justify-between cursor-pointer transition-all rounded-sm ${theme.glass}`}>
                        <div className="flex items-center gap-4">
                          <Target size={18} className={theme.accent} />
                          <h3 className="text-xs tracking-[0.3em] uppercase font-cinzel">Sacred Directives</h3>
                        </div>
                        <ChevronRight size={16} className="opacity-20" />
                      </div>
                    </div>
                  )}

                  {stage === 'sanctuary' && (
                    <div className="animate-in fade-in duration-500">
                      <button onClick={() => setStage('hall')} className={`flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase mb-6 hover:opacity-70 transition-colors font-cinzel ${theme.subText}`}>
                        <ChevronLeft size={14} /> Depart Chamber
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        {loading ? (
                          <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-40">
                            <Sparkles className="animate-pulse mb-4" size={32} />
                            <p className="text-[10px] tracking-[0.3em] uppercase font-cinzel">Consulting Tomes...</p>
                          </div>
                        ) : (
                          data.map(item => (
                            <div key={item.id} className={`aspect-[2/3] rounded-t-full overflow-hidden border relative group ${theme.glass}`}>
                              <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="c" />
                              <div className={`absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t ${isNight ? 'from-[#050505]' : 'from-[#F3E5AB]'} via-transparent to-transparent opacity-90`}>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] line-clamp-2 text-center font-cinzel">{item.title.english || item.title.romaji}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {stage === 'quests' && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <button onClick={() => setStage('hall')} className={`flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase mb-6 hover:opacity-70 transition-colors font-cinzel ${theme.subText}`}>
                        <ChevronLeft size={14} /> Return to Hall
                      </button>
                      <div className="space-y-4">
                        <p className={`text-[10px] tracking-[0.3em] uppercase font-cinzel text-center border-b pb-3 border-current/10 mb-4 ${theme.subText}`}>Active Directives</p>
                        {DAILY_QUESTS.map(quest => {
                          const isCompleted = profile.questsCompleted?.includes(quest.id);
                          return (
                            <div key={quest.id} className={`p-5 border transition-all duration-500 rounded-sm ${theme.glass} ${isCompleted ? 'border-current/40' : ''}`}>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={`text-xs tracking-[0.2em] uppercase font-cinzel ${isCompleted ? 'opacity-40' : ''}`}>{quest.title}</h4>
                                <span className={`text-[9px] font-inter border px-2 py-1 ${theme.accent} border-current/20 rounded-sm`}>+{quest.xp} XP</span>
                              </div>
                              <p className={`text-[10px] tracking-wide mb-5 font-inter leading-relaxed ${theme.subText}`}>{quest.desc}</p>
                              {isCompleted ? (
                                <div className={`flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-cinzel ${theme.accent}`}>
                                  <CheckCircle2 size={14} /> Fulfilled
                                </div>
                              ) : (
                                <button onClick={() => handleQuestCompletion(quest.id, quest.xp)} className="w-full py-3 border border-current/20 text-[9px] tracking-[0.3em] uppercase hover:bg-current/5 transition-all font-cinzel">
                                  Claim Knowledge
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'search' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                  <div className={`flex items-center gap-4 p-4 border rounded-sm ${theme.glass}`}>
                    <Search size={18} className="opacity-40" />
                    <input type="text" placeholder="QUERY THE VOID..." className="bg-transparent border-none outline-none flex-1 text-[10px] tracking-[0.3em] uppercase font-cinzel placeholder:opacity-20" />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 text-center gap-4">
                    <Sparkles size={40} />
                    <p className="text-[10px] tracking-[0.3em] font-cinzel uppercase">Type to summon results</p>
                  </div>
                </div>
              )}

              {activeTab === 'forum' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <p className={`text-[10px] tracking-[0.3em] uppercase text-center font-cinzel mb-6 border-b border-current/10 pb-4 ${theme.subText}`}>Community Lore</p>
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`p-4 border rounded-sm ${theme.glass} space-y-2`}>
                      <h4 className="text-[11px] font-cinzel tracking-widest uppercase">Ancient Scroll #{i}</h4>
                      <p className={`text-[10px] font-inter leading-relaxed ${theme.subText}`}>Seeking companions for the deep archive explorations. Knowledge awaits the brave.</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'sanctum' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                  <div className="text-center space-y-2 border-b border-current/10 pb-6 mb-4">
                    <h3 className="text-lg font-cinzel tracking-widest uppercase">The Sanctum</h3>
                    <p className={`text-[9px] tracking-widest uppercase font-cinzel ${theme.subText}`}>Your personal bound collection</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 text-center gap-4">
                    <BookMarked size={40} />
                    <p className="text-[10px] tracking-[0.3em] font-cinzel uppercase italic">The shelves remain empty...</p>
                  </div>
                </div>
              )}

            </main>

            {/* Bottom Floating Navigation */}
            <nav className={`fixed bottom-6 left-6 right-6 h-16 border rounded-full backdrop-blur-2xl z-[70] flex items-center justify-around px-4 transition-all duration-1000 ${theme.glass}`}>
              <NavItem id="hall" icon={Home} label="Hall" />
              <NavItem id="search" icon={Search} label="Search" />
              <NavItem id="forum" icon={MessageSquare} label="Forum" />
              <NavItem id="sanctum" icon={BookMarked} label="Sanctum" />
            </nav>

          </div>
        )}
      </div>
    </div>
  );
}

