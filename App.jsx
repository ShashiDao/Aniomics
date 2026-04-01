import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, Zap, Scroll, ChevronLeft, 
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
const Stardust = () => {
  const stars = Array.from({ length: 60 }).map((_, i) => {
    const size = Math.random() * 3 + 0.5; // Varying sizes for 3D depth (0.5px to 3.5px)
    const duration = Math.random() * 15 + 10; // Varying speeds (10s to 25s)
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${duration}s`,
      animationDelay: `${Math.random() * 10}s`,
      size: `${size}px`,
      opacity: Math.random() * 0.5 + 0.1,
      blur: size > 2 ? 'blur-[1px]' : 'blur-none'
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(s => (
        <div 
          key={s.id} 
          className={`absolute bg-[#F3E5AB] rounded-full opacity-0 animate-stardust ${s.blur}`}
          style={{ 
            left: s.left, 
            width: s.size, 
            height: s.size, 
            animationDuration: s.animationDuration, 
            animationDelay: s.animationDelay,
            boxShadow: `0 0 ${s.size * 2}px rgba(243,229,171,${s.opacity})`
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
          
          if (!data.questsCompleted?.includes('q2')) {
            handleQuestCompletion('q2', 20, data);
          }
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
    <div className="h-screen w-full bg-[#050505] text-[#F3E5AB] overflow-hidden relative flex flex-col items-center justify-center font-inter">
      
      {/* Injecting Fonts & CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600&display=swap');
        
        @keyframes stardust {
          0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px); opacity: 0; }
        }
        .animate-stardust { animation-name: stardust; animation-timing-function: linear; animation-iteration-count: infinite; }
        
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <Stardust />

      <div className="z-10 w-full h-full flex flex-col relative">
        {stage === 'entrance' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {/* Sacred Archway Motif with Glow */}
            <div className="border border-[#F3E5AB]/20 rounded-t-full pt-20 pb-12 px-10 flex flex-col items-center relative bg-white/5 backdrop-blur-xl shadow-[0_0_30px_rgba(243,229,171,0.05)]">
              
              {/* Soft Amber Radial Gradient (Candlelight) */}
              <div className="absolute top-16 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(230,195,92,0.25)_0%,transparent_70%)] blur-xl pointer-events-none" />
              
              <Library size={56} className="text-[#E6C35C] mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(230,195,92,0.5)]" />
              <h1 className="text-4xl tracking-[0.3em] font-cinzel font-semibold text-[#F3E5AB] relative z-10">ANIOMICS</h1>
              
              <div className="w-[1px] h-16 bg-gradient-to-b from-[#F3E5AB]/50 to-transparent mx-auto my-6" />
              
              <p className="text-[10px] tracking-[0.3em] text-white/50 uppercase font-inter font-light mb-12">The Grand Library</p>
              
              <button onClick={handleRitual} className="px-8 py-4 border border-[#F3E5AB]/30 bg-[#F3E5AB]/10 hover:bg-[#F3E5AB]/20 transition-colors rounded-sm text-[10px] tracking-[0.3em] uppercase backdrop-blur-md font-cinzel animate-pulse text-[#E6C35C] shadow-[0_0_15px_rgba(243,229,171,0.1)]">
                Initiate Ritual
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-6 pt-12">
            
            {/* RPG Header */}
            <header className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className={currentRank.color} />
                    <p className={`text-[10px] font-bold tracking-[0.3em] uppercase font-cinzel ${currentRank.color}`}>
                      {currentRank.title}
                    </p>
                  </div>
                  <h2 className="text-xl tracking-[0.3em] uppercase font-cinzel text-[#F3E5AB]">{profile.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[9px] tracking-[0.3em] text-white/50 uppercase mb-1 font-inter">Knowledge</p>
                  <p className="text-sm tracking-[0.2em] font-cinzel text-[#E6C35C]">{profile.xp} <span className="text-white/30 text-[10px]">/ {nextRank.minXp}</span></p>
                </div>
              </div>
              
              {/* Glowing XP Progress Bar */}
              <div className="h-[2px] w-full bg-white/10 overflow-hidden shadow-[0_0_25px_rgba(243,229,171,0.1)] rounded-full">
                <div 
                  className={`h-full ${currentRank.bar} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(230,195,92,0.8)]`} 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-10 hide-scrollbar">
              
              {/* STAGE: HALL */}
              {stage === 'hall' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <p className="text-[10px] tracking-[0.3em] text-white/50 uppercase text-center font-cinzel mb-4">Select a Chamber</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Motion Chamber */}
                    <div onClick={() => fetchData('ANIME')} className="h-56 rounded-t-full border border-[#F3E5AB]/20 bg-white/5 backdrop-blur-xl shadow-[0_0_25px_rgba(243,229,171,0.05)] p-4 flex flex-col items-center justify-end relative overflow-hidden cursor-pointer group hover:border-[#E6C35C]/50 hover:shadow-[0_0_30px_rgba(230,195,92,0.15)] transition-all duration-500">
                      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#F3E5AB]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Zap size={24} className="text-[#E6C35C] mb-4 drop-shadow-[0_0_10px_rgba(230,195,92,0.5)]" />
                      <h3 className="text-lg tracking-[0.3em] uppercase font-cinzel mb-2 text-[#F3E5AB]">Motion</h3>
                      <p className="text-[9px] tracking-[0.2em] text-white/50 uppercase mb-4 font-inter">Anime Archives</p>
                    </div>
                    
                    {/* Ink Chamber */}
                    <div onClick={() => fetchData('MANGA')} className="h-56 rounded-t-full border border-[#F3E5AB]/20 bg-white/5 backdrop-blur-xl shadow-[0_0_25px_rgba(243,229,171,0.05)] p-4 flex flex-col items-center justify-end relative overflow-hidden cursor-pointer group hover:border-[#E6C35C]/50 hover:shadow-[0_0_30px_rgba(230,195,92,0.15)] transition-all duration-500">
                      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#F3E5AB]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Scroll size={24} className="text-[#E6C35C] mb-4 drop-shadow-[0_0_10px_rgba(230,195,92,0.5)]" />
                      <h3 className="text-lg tracking-[0.3em] uppercase font-cinzel mb-2 text-[#F3E5AB]">Ink</h3>
                      <p className="text-[9px] tracking-[0.2em] text-white/50 uppercase mb-4 font-inter">Manga Archives</p>
                    </div>
                  </div>

                  {/* Quests Entry */}
                  <div onClick={() => setStage('quests')} className="mt-6 h-16 border border-[#F3E5AB]/20 bg-white/5 backdrop-blur-xl shadow-[0_0_25px_rgba(243,229,171,0.05)] px-5 flex items-center justify-between cursor-pointer hover:border-[#E6C35C]/40 transition-all duration-300 rounded-sm">
                    <div className="flex items-center gap-4">
                      <Target size={18} className="text-[#E6C35C]" />
                      <div>
                        <h3 className="text-xs tracking-[0.3em] uppercase font-cinzel text-[#F3E5AB]">Sacred Directives</h3>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#F3E5AB]/40" />
                  </div>
                </div>
              )}

              {/* STAGE: SANCTUARY (Library View) */}
              {stage === 'sanctuary' && (
                <div className="animate-in fade-in duration-500">
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/50 uppercase mb-6 hover:text-[#F3E5AB] transition-colors font-cinzel">
                    <ChevronLeft size={14} /> Depart Chamber
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-70">
                        <Sparkles className="animate-pulse mb-4 text-[#E6C35C] drop-shadow-[0_0_15px_rgba(230,195,92,0.5)]" size={32} />
                        <p className="text-[10px] tracking-[0.3em] uppercase font-cinzel text-[#F3E5AB]">Consulting Tomes...</p>
                      </div>
                    ) : (
                      data.map(item => (
                        <div key={item.id} className="aspect-[2/3] rounded-t-full overflow-hidden border border-[#F3E5AB]/20 bg-white/5 backdrop-blur-md relative group shadow-[0_0_15px_rgba(243,229,171,0.05)]">
                          <img src={item.coverImage.extraLarge} alt="cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                          <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] line-clamp-2 leading-relaxed font-cinzel text-[#F3E5AB] text-center mb-2 drop-shadow-md">{item.title.english || item.title.romaji}</p>
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
                  <button onClick={() => setStage('hall')} className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/50 uppercase mb-6 hover:text-[#F3E5AB] transition-colors font-cinzel">
                    <ChevronLeft size={14} /> Return to Hall
                  </button>

                  <div className="space-y-4">
                    <p className="text-[10px] tracking-[0.3em] text-white/50 uppercase mb-4 font-cinzel text-center border-b border-[#F3E5AB]/20 pb-3">Active Directives</p>
                    
                    {DAILY_QUESTS.map(quest => {
                      const isCompleted = profile.questsCompleted?.includes(quest.id);
                      return (
                        <div key={quest.id} className={`p-5 border backdrop-blur-xl shadow-[0_0_20px_rgba(243,229,171,0.03)] transition-all duration-500 rounded-sm ${isCompleted ? 'border-[#E6C35C]/40 bg-[#E6C35C]/5' : 'border-[#F3E5AB]/20 bg-white/5'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-xs tracking-[0.2em] uppercase font-cinzel ${isCompleted ? 'text-[#E6C35C]' : 'text-[#F3E5AB]'}`}>{quest.title}</h4>
                            <span className="text-[9px] font-inter bg-black/50 border border-[#F3E5AB]/20 px-2 py-1 text-[#E6C35C] rounded-sm">+{quest.xp} XP</span>
                          </div>
                          <p className="text-[10px] text-white/50 tracking-wide mb-5 font-inter leading-relaxed">{quest.desc}</p>
                          
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-[#E6C35C] uppercase font-cinzel">
                              <CheckCircle2 size={14} /> Fulfilled
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleQuestCompletion(quest.id, quest.xp)}
                              className="w-full py-3 border border-[#F3E5AB]/20 text-[9px] tracking-[0.3em] uppercase hover:bg-[#F3E5AB]/10 hover:border-[#E6C35C]/50 transition-all font-cinzel text-[#F3E5AB]"
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
