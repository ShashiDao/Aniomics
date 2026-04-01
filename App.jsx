import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, Layers, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star
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
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-slate-400', bar: 'bg-slate-400' },
  { id: 2, title: 'Initiate', minXp: 100, color: 'text-emerald-400', bar: 'bg-emerald-400' },
  { id: 3, title: 'Seeker', minXp: 500, color: 'text-blue-400', bar: 'bg-blue-400' },
  { id: 4, title: 'Scholar', minXp: 1500, color: 'text-purple-400', bar: 'bg-purple-400' },
  { id: 5, title: 'Arch-Librarian', minXp: 5000, color: 'text-amber-400', bar: 'bg-amber-400' }
];

const DAILY_QUESTS = [
  { id: 'q1', title: 'Consult the Archives', xp: 50, desc: 'View the Motion or Ink library.' },
  { id: 'q2', title: 'Starlight Meditation', xp: 20, desc: 'Enter the Sanctuary today.' },
  { id: 'q3', title: 'Seeker of Truth', xp: 100, desc: 'Discover 3 new titles. (Claimable)' }
];

// --- STARDUST COMPONENT ---
const Stardust = () => {
  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 4 + 3}s`,
    animationDelay: `${Math.random() * 5}s`,
    size: `${Math.random() * 2 + 1}px`,
    opacity: Math.random() * 0.5 + 0.2
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(s => (
        <div 
          key={s.id} 
          className="absolute bg-white rounded-full opacity-0 animate-stardust"
          style={{ 
            left: s.left, 
            width: s.size, 
            height: s.size, 
            animationDuration: s.animationDuration, 
            animationDelay: s.animationDelay,
            boxShadow: `0 0 ${s.size}px rgba(255,255,255,${s.opacity})`
          }} 
        />
      ))}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, questsCompleted: [] });
  const [stage, setStage] = useState('entrance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'aniomics_v1', 'users', u.uid, 'profile'));
        if (snap.exists()) { 
          const data = snap.data();
          setProfile({ ...data, questsCompleted: data.questsCompleted || [] }); 
          setStage('hall'); 
          
          // Auto-complete login quest if not done
          if (!data.questsCompleted?.includes('q2')) {
            handleQuestCompletion('q2', 20, data);
          }
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("Enter your Name to bind your soul:");
    if (!n) return;
    const p = { name: n, xp: 0, questsCompleted: ['q2'] }; // Auto-complete login quest
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
    if (user) {
      await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), newProfile, { merge: true });
    }
  };

  const fetchData = async (type) => {
    setLoading(true);
    setStage('sanctuary');
    
    // Trigger "Consult the Archives" quest
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

  // Calculate RPG Stats
  const currentRank = RANKS.slice().reverse().find(r => profile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > profile.xp) || currentRank;
  const xpProgress = nextRank.id === currentRank.id ? 100 : ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100;

  return (
    <div className="h-screen w-full bg-[#050505] text-white overflow-hidden relative flex flex-col items-center justify-center font-sans">
      
      {/* Injecting CSS for Stardust Animation */}
      <style>{`
        @keyframes stardust {
          0% { transform: translateY(-10vh) translateX(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px) scale(1.5); opacity: 0; }
        }
        .animate-stardust { animation-name: stardust; animation-timing-function: linear; animation-iteration-count: infinite; }
      `}</style>
      
      <Stardust />

      {/* Z-10 ensures content is above the stardust */}
      <div className="z-10 w-full h-full flex flex-col relative">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <Library size={64} className="text-amber-600/40 mb-8 mx-auto animate-pulse" />
            <h1 className="text-4xl tracking-[0.5em] font-light bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">ANIOMICS</h1>
            <p className="text-[10px] tracking-widest text-white/30 mt-4 uppercase">The Grand Library</p>
            <button onClick={handleRitual} className="mt-16 px-10 py-4 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors rounded-full text-[10px] tracking-widest uppercase backdrop-blur-sm">
              Enter Sanctuary
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-12">
            
            {/* RPG Header */}
            <header className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className={currentRank.color} />
                    <p className={`text-[10px] font-bold tracking-widest uppercase ${currentRank.color}`}>
                      {currentRank.title}
                    </p>
                  </div>
                  <h2 className="text-lg tracking-widest uppercase font-light">{profile.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mb-1">Experience</p>
                  <p className="text-sm tracking-widest font-mono">{profile.xp} <span className="text-white/30 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full ${currentRank.bar} transition-all duration-1000 ease-out`} 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-10 hide-scrollbar">
              
              {/* STAGE: HALL */}
              {stage === 'hall' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <p className="text-[10px] tracking-widest text-white/30 uppercase mb-6">Select a Wing</p>
                  
                  <div onClick={() => fetchData('ANIME')} className="h-36 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-transparent p-6 flex flex-col justify-end relative overflow-hidden backdrop-blur-md cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <Zap size={24} className="text-blue-400/60 mb-2" />
                    <h3 className="text-xl tracking-widest uppercase font-light">Motion</h3>
                    <p className="text-[9px] tracking-widest text-white/40 uppercase mt-1">Anime Archives</p>
                  </div>
                  
                  <div onClick={() => fetchData('MANGA')} className="h-36 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-transparent p-6 flex flex-col justify-end relative overflow-hidden backdrop-blur-md cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <Scroll size={24} className="text-orange-400/60 mb-2" />
                    <h3 className="text-xl tracking-widest uppercase font-light">Ink</h3>
                    <p className="text-[9px] tracking-widest text-white/40 uppercase mt-1">Manga Archives</p>
                  </div>

                  {/* Quests Entry */}
                  <div onClick={() => setStage('quests')} className="mt-8 h-20 rounded-2xl border border-purple-500/20 bg-purple-900/10 p-5 flex items-center justify-between backdrop-blur-md cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-500/10 rounded-full">
                        <Target size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xs tracking-widest uppercase">Daily Quests</h3>
                        <p className="text-[9px] tracking-widest text-white/40 uppercase mt-1">Earn Experience</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </div>
                </div>
              )}

              {/* STAGE: SANCTUARY (Library View) */}
              {stage === 'sanctuary' && (
                <div className="animate-in fade-in duration-500">
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-widest text-white/50 uppercase mb-6 hover:text-white transition-colors">
                    <ChevronLeft size={14} /> Return to Hall
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-50">
                        <Sparkles className="animate-spin mb-4 text-amber-500/50" />
                        <p className="text-[10px] tracking-widest uppercase">Consulting Archives...</p>
                      </div>
                    ) : (
                      data.map(item => (
                        <div key={item.id} className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 relative group">
                          <img src={item.coverImage.extraLarge} alt="cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent">
                            <p className="text-[9px] font-bold uppercase tracking-wider line-clamp-2 leading-relaxed">{item.title.english || item.title.romaji}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* STAGE: QUESTS */}
              {stage === 'quests' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-widest text-white/50 uppercase mb-6 hover:text-white transition-colors">
                    <ChevronLeft size={14} /> Return to Hall
                  </button>

                  <div className="space-y-4">
                    <p className="text-[10px] tracking-widest text-white/30 uppercase mb-2">Active Directives</p>
                    
                    {DAILY_QUESTS.map(quest => {
                      const isCompleted = profile.questsCompleted?.includes(quest.id);
                      return (
                        <div key={quest.id} className={`p-5 rounded-2xl border transition-all duration-500 ${isCompleted ? 'border-emerald-500/20 bg-emerald-900/10' : 'border-white/10 bg-white/5'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-xs tracking-widest uppercase ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>{quest.title}</h4>
                            <span className="text-[9px] font-mono bg-white/10 px-2 py-1 rounded text-amber-400">+{quest.xp} XP</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wide mb-4">{quest.desc}</p>
                          
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-[10px] tracking-widest text-emerald-500/80 uppercase">
                              <CheckCircle2 size={14} /> Completed
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleQuestCompletion(quest.id, quest.xp)}
                              className="w-full py-2 border border-white/10 rounded-lg text-[9px] tracking-widest uppercase hover:bg-white/10 transition-colors"
                            >
                              Claim (Debug)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </main>
          </div>
        )}
      </div>
    </div>
  );
      }
