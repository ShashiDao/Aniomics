import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, Layers, ChevronLeft, 
  Target, ChevronRight, CheckCircle2, Star, Flame
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
  { id: 2, title: 'Initiate', minXp: 100, color: 'text-emerald-600', bar: 'bg-emerald-600' },
  { id: 3, title: 'Seeker', minXp: 500, color: 'text-blue-600', bar: 'bg-blue-600' },
  { id: 4, title: 'Scholar', minXp: 1500, color: 'text-purple-600', bar: 'bg-purple-600' },
  { id: 5, title: 'Arch-Librarian', minXp: 5000, color: 'text-[#A08B63]', bar: 'bg-[#A08B63]' }
];

const DAILY_QUESTS = [
  { id: 'q1', title: 'Consult the Archives', xp: 50, desc: 'View the Motion or Ink library.' },
  { id: 'q2', title: 'Starlight Meditation', xp: 20, desc: 'Enter the Sanctuary today.' },
  { id: 'q3', title: 'Seeker of Truth', xp: 100, desc: 'Discover 3 new titles. (Claimable)' }
];

// --- ATMOSPHERE COMPONENTS ---
const Candlelight = () => (
  <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
    <div className="w-[150vw] h-[150vh] bg-[radial-gradient(circle_at_center,rgba(160,139,99,0.08)_0%,transparent_60%)] animate-flicker mix-blend-screen" />
  </div>
);

const CornerAccents = () => (
  <div className="fixed inset-4 pointer-events-none z-20">
    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#A08B63]/40" />
    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#A08B63]/40" />
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#A08B63]/40" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#A08B63]/40" />
  </div>
);

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
          
          if (!data.questsCompleted?.includes('q2')) {
            handleQuestCompletion('q2', 20, data);
          }
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("Inscribe your Name upon the parchment:");
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
    if (user) {
      await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), newProfile, { merge: true });
    }
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

  return (
    <div className="h-screen w-full bg-[#0C0E0C] text-[#A08B63] overflow-hidden relative flex flex-col items-center justify-center font-['Inter',_sans-serif]">
      
      {/* Injecting Fonts & CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600&display=swap');
        
        @keyframes flicker {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.02); }
          25%, 75% { opacity: 0.7; transform: scale(0.98); }
        }
        .animate-flicker { animation: flicker 4s ease-in-out infinite alternate; }
        
        .font-cinzel { font-family: 'Cinzel', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <Candlelight />
      <CornerAccents />

      <div className="z-10 w-full h-full flex flex-col relative">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {/* Sacred Archway Motif */}
            <div className="border border-[#A08B63]/30 rounded-t-full pt-16 pb-10 px-8 flex flex-col items-center relative bg-gradient-to-b from-[#A08B63]/5 to-transparent shadow-[0_0_30px_rgba(160,139,99,0.05)]">
              <Flame size={48} className="text-[#A08B63]/60 mb-6 animate-pulse" />
              <h1 className="text-4xl tracking-[0.3em] font-cinzel font-semibold text-[#A08B63] drop-shadow-md">ANIOMICS</h1>
              
              <div className="w-[1px] h-16 bg-gradient-to-b from-[#A08B63]/50 to-transparent mx-auto my-6" />
              
              <p className="text-[10px] tracking-[0.2em] text-[#A08B63]/50 uppercase font-light mb-10">The Grand Library</p>
              
              <button onClick={handleRitual} className="px-8 py-3 border border-[#A08B63]/40 bg-[#A08B63]/10 hover:bg-[#A08B63]/20 transition-colors rounded-sm text-[10px] tracking-[0.2em] uppercase backdrop-blur-sm font-cinzel">
                Initiate Ritual
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-12">
            
            {/* RPG Header */}
            <header className="mb-8 border-b border-[#A08B63]/20 pb-4">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className={currentRank.color} />
                    <p className={`text-[10px] font-bold tracking-widest uppercase ${currentRank.color}`}>
                      {currentRank.title}
                    </p>
                  </div>
                  <h2 className="text-xl tracking-widest uppercase font-cinzel text-[#A08B63]">{profile.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[9px] tracking-widest text-[#A08B63]/50 uppercase mb-1">Knowledge</p>
                  <p className="text-sm tracking-widest font-cinzel">{profile.xp} <span className="text-[#A08B63]/40 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="h-[2px] w-full bg-[#333223] overflow-hidden">
                <div 
                  className={`h-full ${currentRank.bar} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(160,139,99,0.5)]`} 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-10 hide-scrollbar">
              
              {/* STAGE: HALL */}
              {stage === 'hall' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <p className="text-[10px] tracking-[0.2em] text-[#A08B63]/50 uppercase text-center font-cinzel mb-4">Select a Chamber</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Motion Chamber */}
                    <div onClick={() => fetchData('ANIME')} className="h-56 rounded-t-full border border-[#A08B63]/30 bg-gradient-to-br from-[#2A3A2F] to-transparent p-4 flex flex-col items-center justify-end relative overflow-hidden backdrop-blur-md cursor-pointer group hover:border-[#A08B63]/60 transition-all">
                      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#A08B63]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Zap size={24} className="text-[#A08B63]/60 mb-4" />
                      <h3 className="text-lg tracking-widest uppercase font-cinzel mb-1">Motion</h3>
                      <p className="text-[8px] tracking-widest text-[#A08B63]/50 uppercase mb-4">Anime Archives</p>
                    </div>
                    
                    {/* Ink Chamber */}
                    <div onClick={() => fetchData('MANGA')} className="h-56 rounded-t-full border border-[#A08B63]/30 bg-gradient-to-br from-[#333223] to-transparent p-4 flex flex-col items-center justify-end relative overflow-hidden backdrop-blur-md cursor-pointer group hover:border-[#A08B63]/60 transition-all">
                      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#A08B63]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Scroll size={24} className="text-[#A08B63]/60 mb-4" />
                      <h3 className="text-lg tracking-widest uppercase font-cinzel mb-1">Ink</h3>
                      <p className="text-[8px] tracking-widest text-[#A08B63]/50 uppercase mb-4">Manga Archives</p>
                    </div>
                  </div>

                  {/* Quests Entry */}
                  <div onClick={() => setStage('quests')} className="mt-6 h-16 border-y border-[#A08B63]/20 bg-[#A08B63]/5 px-4 flex items-center justify-between backdrop-blur-md cursor-pointer hover:bg-[#A08B63]/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <Target size={16} className="text-[#A08B63]/70" />
                      <div>
                        <h3 className="text-xs tracking-widest uppercase font-cinzel">Sacred Directives</h3>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#A08B63]/40" />
                  </div>
                </div>
              )}

              {/* STAGE: SANCTUARY (Library View) */}
              {stage === 'sanctuary' && (
                <div className="animate-in fade-in duration-500">
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-widest text-[#A08B63]/60 uppercase mb-6 hover:text-[#A08B63] transition-colors font-cinzel">
                    <ChevronLeft size={14} /> Depart Chamber
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-70">
                        <Flame className="animate-pulse mb-4 text-[#A08B63]" size={32} />
                        <p className="text-[10px] tracking-[0.2em] uppercase font-cinzel">Consulting Tomes...</p>
                      </div>
                    ) : (
                      data.map(item => (
                        <div key={item.id} className="aspect-[2/3] rounded-t-full overflow-hidden border border-[#A08B63]/20 bg-[#333223]/30 relative group">
                          <img src={item.coverImage.extraLarge} alt="cover" className="w-full h-full object-cover opacity-50 group-hover:opacity-90 transition-opacity duration-700 sepia-[.3]" />
                          <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-[#0C0E0C] via-[#0C0E0C]/60 to-transparent">
                            <p className="text-[9px] font-bold uppercase tracking-wider line-clamp-2 leading-relaxed font-cinzel text-[#A08B63] text-center mb-2">{item.title.english || item.title.romaji}</p>
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
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-widest text-[#A08B63]/60 uppercase mb-6 hover:text-[#A08B63] transition-colors font-cinzel">
                    <ChevronLeft size={14} /> Return to Hall
                  </button>

                  <div className="space-y-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#A08B63]/50 uppercase mb-4 font-cinzel text-center border-b border-[#A08B63]/20 pb-2">Active Directives</p>
                    
                    {DAILY_QUESTS.map(quest => {
                      const isCompleted = profile.questsCompleted?.includes(quest.id);
                      return (
                        <div key={quest.id} className={`p-5 border transition-all duration-500 ${isCompleted ? 'border-[#A08B63]/40 bg-[#A08B63]/10' : 'border-[#A08B63]/10 bg-[#333223]/20'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-xs tracking-widest uppercase font-cinzel ${isCompleted ? 'text-[#A08B63]' : 'text-[#A08B63]/80'}`}>{quest.title}</h4>
                            <span className="text-[9px] font-mono bg-[#0C0E0C] border border-[#A08B63]/20 px-2 py-1 text-[#A08B63]">+{quest.xp} XP</span>
                          </div>
                          <p className="text-[10px] text-[#A08B63]/60 tracking-wide mb-4">{quest.desc}</p>
                          
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-[10px] tracking-widest text-[#A08B63] uppercase font-cinzel">
                              <CheckCircle2 size={14} /> Fulfilled
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleQuestCompletion(quest.id, quest.xp)}
                              className="w-full py-2 border border-[#A08B63]/20 text-[9px] tracking-[0.2em] uppercase hover:bg-[#A08B63]/10 transition-colors font-cinzel"
                            >
                              Claim Knowledge
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
