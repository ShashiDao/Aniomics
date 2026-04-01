import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { 
  Library, Sparkles, X, Send, Heart, ChevronLeft, Zap, Star, 
  Ghost, CloudRain, Scroll, Globe, Layers, ShieldAlert, BookOpen
} from 'lucide-react';

// --- ✨ YOUR BINDED FIREBASE SOUL ---
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

// Initialize the Stacks
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DB_PATH = 'aniomics_v1';

// --- 📜 THE 7 RANKS OF ASCENSION ---
const RANKS = [
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-slate-400' },
  { id: 2, title: 'Seeker', minXp: 500, color: 'text-orange-400' },
  { id: 3, title: 'Scribe', minXp: 1500, color: 'text-blue-300' },
  { id: 4, title: 'Chronicler', minXp: 4000, color: 'text-amber-400' },
  { id: 5, title: 'Scholar', minXp: 10000, color: 'text-indigo-400' },
  { id: 6, title: 'High Sage', minXp: 25000, color: 'text-fuchsia-400' },
  { id: 7, title: 'Arch-Librarian', minXp: 60000, color: 'text-yellow-200' }
];

// --- 🌌 ATMOSPHERE ENGINE ---
const Atmosphere = ({ chamber, isStardust }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animation;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    const particles = Array.from({ length: 60 }, () => ({ 
      x: Math.random() * canvas.width, 
      y: Math.random() * canvas.height, 
      s: Math.random() * 2 + 0.5,
      v: Math.random() * 2 + 1
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isStardust ? 'rgba(254, 240, 138, 0.5)' : (chamber === 'ink' ? 'rgba(139, 92, 71, 0.25)' : 'rgba(56, 189, 248, 0.2)');
      particles.forEach(p => {
        if (chamber === 'motion') ctx.fillRect(p.x, p.y, 1, p.s * 8);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); }
        p.y += p.v; if (p.y > canvas.height) p.y = -20;
      });
      animation = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animation); };
  }, [chamber, isStardust]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', xp: 0, lang: 'en' });
  const [stage, setStage] = useState('entrance');
  const [chamber, setChamber] = useState(null);
  const [aisle, setAisle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const currentRank = [...RANKS].reverse().find(r => profile.xp >= r.minXp) || RANKS[0];

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error("Auth Failed", e));
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, DB_PATH, 'users', u.uid, 'profile'));
        if (snap.exists()) {
          setProfile(snap.data());
          setStage('hall');
        }
      }
    });
  }, []);

  const handleRitual = async () => {
    const n = prompt("By what name shall the archives record you?");
    if (!n) return;
    const initialProfile = { name: n, xp: 0, lang: 'en', joinedAt: new Date().toISOString() };
    setProfile(initialProfile);
    setStage('hall');
    if (user) await setDoc(doc(db, DB_PATH, 'users', user.uid, 'profile'), initialProfile);
  };

  const fetchData = async (type, country = null) => {
    setLoading(true);
    const query = `query($t: MediaType, $c: String){ Page(perPage: 15){ media(type: $t, countryOfOrigin: $c, sort: TRENDING_DESC){ id title { english romaji } coverImage { extraLarge } } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { t: type === 'motion' ? 'ANIME' : 'MANGA', c: country } })
      });
      const d = await res.json();
      setData(d?.data?.Page?.media || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full bg-[#050505] text-white font-serif overflow-hidden relative">
      <Atmosphere chamber={chamber} />
      
      {stage === 'entrance' ? (
        <div className="h-full flex flex-col items-center justify-center z-10 relative p-10 text-center">
          <Library size={64} className="text-amber-600/40 mb-8 animate-pulse" />
          <h1 className="text-4xl tracking-[0.6em] font-light mb-2">ANIOMICS</h1>
          <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">The Grand Library Sanctuary</p>
          <button onClick={handleRitual} className="mt-20 px-12 py-3 border border-amber-500/30 rounded-full text-[10px] tracking-widest hover:bg-amber-500/10 transition-all">ENTER SANCTUARY</button>
        </div>
      ) : (
        <div className="h-full flex flex-col z-10 relative">
          <header className="p-8 pt-12 flex justify-between items-start bg-gradient-to-b from-black to-transparent">
            <div>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${currentRank.color}`}>{currentRank.title} • LVL {currentRank.id}</p>
              <h2 className="text-sm tracking-widest uppercase mt-1 font-light">{profile.name}</h2>
              <div className="w-24 h-[1px] bg-white/10 mt-2"><div className="h-full bg-amber-500" style={{width: `${(profile.xp % 500)/5}%`}} /></div>
            </div>
            <button onClick={() => {setStage('hall'); setChamber(null); setAisle(null);}} className="p-3 bg-white/5 rounded-full border border-white/10"><Layers size={18} className="opacity-40"/></button>
          </header>

          <main className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide">
            {stage === 'hall' && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="text-center opacity-20 text-[10px] tracking-[0.5em] uppercase mb-10">— The Great Hall —</div>
                <div onClick={() => {setChamber('motion'); setStage('sanctuary'); fetchData('motion');}} className="h-56 rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-transparent p-
          
