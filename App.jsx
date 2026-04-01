import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Library, Sparkles, X, Send, Heart, ChevronLeft, Zap, Star, 
  Ghost, CloudRain, Scroll, Globe, Layers, ShieldAlert 
} from 'lucide-react';

// --- Firebase Setup (Add your config here) ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DB_PATH = 'aniomics_v1';

// --- Localization ---
const TRANSLATIONS = {
  en: { welcome: "Welcome, Traveler", enter: "Enter Sanctuary", motion: "Chamber of Motion", ink: "Chamber of Ink", rank: "Rank", manga: "Manga", manhwa: "Manhwa", manhua: "Manhua" },
  jp: { welcome: "旅人よ、ようこそ", enter: "聖域に入る", motion: "動きの間", ink: "墨の間", rank: "位階", manga: "漫画", manhwa: "マンファ", manhua: "マンホア" }
};

const RANKS = [
  { id: 1, title: 'Wanderer', minXp: 0, color: 'text-slate-400' },
  { id: 2, title: 'Seeker', minXp: 500, color: 'text-orange-400' },
  { id: 3, title: 'Scribe', minXp: 1500, color: 'text-blue-300' },
  { id: 4, title: 'Chronicler', minXp: 4000, color: 'text-amber-400' },
  { id: 5, title: 'Scholar', minXp: 10000, color: 'text-indigo-400' },
  { id: 6, title: 'High Sage', minXp: 25000, color: 'text-fuchsia-400' },
  { id: 7, title: 'Arch-Librarian', minXp: 60000, color: 'text-yellow-200' }
];

// --- Atmosphere Component ---
const Atmosphere = ({ chamber, isStardust }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animation;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    const particles = Array.from({ length: 50 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 2 + 1 }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isStardust ? 'rgba(254, 240, 138, 0.4)' : (chamber === 'ink' ? 'rgba(139, 92, 71, 0.2)' : 'rgba(56, 189, 248, 0.2)');
      particles.forEach(p => {
        if (chamber === 'motion') ctx.fillRect(p.x, p.y, 1, 10);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); }
        p.y += 2; if (p.y > canvas.height) p.y = -10;
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
  const [isStardust, setIsStardust] = useState(false);

  const t = (key) => TRANSLATIONS[profile.lang]?.[key] || TRANSLATIONS.en[key];
  const currentRank = [...RANKS].reverse().find(r => profile.xp >= r.minXp) || RANKS[0];

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, (u) => setUser(u
        
