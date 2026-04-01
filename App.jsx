import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Library, Sparkles, X, Zap, Scroll, Layers, BookOpen, ChevronLeft
} from 'lucide-react';

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
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-slate-400' },
  { id: 2, title: 'Seeker', minXp: 500, color: 'text-orange-400' },
  { id: 7, title: 'Arch-Librarian', minXp: 60000, color: 'text-yellow-200' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0 });
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
          setProfile(snap.data()); 
          setStage('hall'); 
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("Enter your Name:");
    if (!n) return;
    const p = { name: n, xp: 0 };
    setProfile(p);
    setStage('hall');
    if (user) await setDoc(doc(db, 'aniomics_v1', 'users', user.uid, 'profile'), p);
  };

  const fetchData = async (type) => {
    setLoading(true);
    setStage('sanctuary');
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

  return (
    <div className="h-screen w-full bg-[#050505] text-white overflow-hidden relative flex flex-col items-center justify-center">
      {stage === 'entrance' ? (
        <div className="text-center p-10">
          <Library size={64} className="text-amber-600/40 mb-8 mx-auto" />
          <h1 className="text-4xl tracking-[0.5em] font-light">ANIOMICS</h1>
          <button onClick={handleRitual} className="mt-12 px-10 py-3 border border-amber-500/20 rounded-full text-[10px] tracking-widest">ENTER SANCTUARY</button>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col p-8">
          <header className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-amber-500">WANDERER</p>
              <h2 className="text-sm tracking-widest uppercase">{profile.name}</h2>
            </div>
            <button onClick={() => setStage('hall')} className="p-2 bg-white/5 rounded-full"><Layers size={20}/></button>
          </header>

          <main className="flex-1 overflow-y-auto pb-20">
            {stage === 'hall' ? (
              <div className="space-y-6">
                <div onClick={() => fetchData('ANIME')} className="h-40 rounded-3xl border border-blue-500/20 bg-blue-900/10 p-8 flex flex-col justify-end">
                  <Zap size={24} className="text-blue-500/40 mb-2" />
                  <h3 className="text-xl tracking-widest uppercase">Motion</h3>
                </div>
                <div onClick={() => fetchData('MANGA')} className="h-40 rounded-3xl border border-orange-500/20 bg-orange-900/10 p-8 flex flex-col justify-end">
                  <Scroll size={24} className="text-orange-500/40 mb-2" />
                  <h3 className="text-xl tracking-widest uppercase">Ink</h3>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {loading ? <p className="col-span-2 text-center text-[10px] opacity-30 mt-20">CONSULTING ARCHIVES...</p> : 
                  data.map(item => (
                    <div key={item.id} className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 relative">
                      <img src={item.coverImage.extraLarge} className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                        <p className="text-[8px] font-bold uppercase truncate">{item.title.english || item.title.romaji}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
          }
