import React, { useState, useEffect } from 'react';
import logo from './Assets/logo.png'; 
import { 
  Sparkles, Moon, Sun, Wand2, Loader2,
  ChevronDown, ArrowRight, LayoutGrid, Clock, 
  Library, Settings, Search, Plus, Bookmark, 
  Play, BookOpen, ChevronLeft
} from 'lucide-react';

const Atmosphere = ({ phase }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === 'night' ? 'bg-[#050505]/95' : 'bg-[#DCD4B8]/50'}`} />
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #E6C35C 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
  </div>
);

export default function App() {
  const [phase, setPhase] = useState('night');
  const [isApp, setIsApp] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isSanctifying, setIsSanctifying] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [openFaq, setOpenFaq] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [readerData, setReaderData] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsApp(isStandalone);
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleSanctify = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput) return;

    setIsSanctifying(true);
    const gProxy = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";

    try {
      const url = new URL(urlInput);
      let foundImages = [];

      // --- MANGADEX HANDLER (DIRECT API - NO PROXY) ---
      if (url.hostname.includes('mangadex.org')) {
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const chapterId = pathSegments[pathSegments.indexOf('chapter') + 1];

        if (!chapterId) throw new Error("ID not found");

        // MangaDex API supports CORS natively. Direct fetch is safer.
        const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
        const data = await res.json();
        
        if (data.chapter) {
          const { baseUrl, hash, data: pages } = data.chapter;
          foundImages = pages.map(p => `${gProxy}${encodeURIComponent(`${baseUrl}/data/${hash}/${p}`)}`);
        }
      } 
      // --- GENERIC SCRAPER (USING CORS-ANYWHERE BACKUP) ---
      else {
        // Fallback for non-API sites
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`);
        const json = await res.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(json.contents, 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img'));
        
        imgs.forEach(img => {
          const src = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src');
          if (src && !/logo|icon|avatar|banner|ads/i.test(src)) {
            let fullSrc = src.trim();
            if (fullSrc.startsWith('//')) fullSrc = 'https:' + fullSrc;
            else if (fullSrc.startsWith('/')) fullSrc = url.origin + fullSrc;
            foundImages.push(`${gProxy}${encodeURIComponent(fullSrc)}`);
          }
        });
      }

      if (foundImages.length > 0) {
        setReaderData({ images: [...new Set(foundImages)] });
      } else {
        alert("Void detected. No pages found.");
      }
    } catch (err) {
      alert("Sanctification failed. Ensure the link is a direct chapter.");
    } finally {
      setIsSanctifying(false);
      setUrlInput("");
    }
  };

  const isNight = phase === 'night';
  const theme = {
    bg: isNight ? 'bg-[#050505]' : 'bg-[#DCD4B8]',
    text: isNight ? 'text-[#F3E5AB]' : 'text-[#2D1F16]',
    card: isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
  };

  if (readerData) {
    return (
      <div className="min-h-screen bg-black flex flex-col z-[300]">
        <nav className="fixed top-0 w-full h-14 bg-black/95 backdrop-blur-md flex items-center px-4 justify-between border-b border-white/10 z-[301]">
          <button onClick={() => setReaderData(null)} className="text-[#E6C35C] flex items-center gap-2">
            <ChevronLeft size={20} />
            <span className="text-[10px] uppercase font-black tracking-widest">Exit</span>
          </button>
          <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{readerData.images.length} Pages</span>
        </nav>
        <main className="pt-14 flex flex-col items-center bg-black min-h-screen">
          {readerData.images.map((img, i) => (
            <div key={i} className="w-full max-w-3xl min-h-[300px] flex items-center justify-center relative bg-black">
              <img src={img} alt="" className="w-full h-auto relative z-10" loading="lazy" referrerPolicy="no-referrer" />
              <Loader2 className="absolute animate-spin text-[#E6C35C]/20" size={24} />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col font-sans transition-colors duration-700 relative overflow-x-hidden`}>
      <Atmosphere phase={phase} />
      <nav className="fixed top-0 w-full h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={logo} className="h-9 w-9 rounded-full border border-[#E6C35C]/30 p-0.5" alt="L" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold text-[#E6C35C]">Aniomics</span>
        </div>
        <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60">
           {isNight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </nav>

      <header className="pt-32 pb-12 px-6 flex flex-col items-center text-center z-10">
        <h1 className="text-4xl md:text-6xl font-serif uppercase tracking-tight leading-[1.1] mb-6">
          The Sanctuary <br /><span className="text-[#E6C35C]">For Every Story</span>
        </h1>
        <form onSubmit={handleSanctify} className="w-full max-w-md relative px-4">
          <div className={`flex items-center p-1.5 rounded-full border ${theme.card} backdrop-blur-2xl shadow-2xl`}>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste chapter link..." 
              className="bg-transparent flex-1 outline-none text-[13px] px-4"
            />
            <button type="submit" className="bg-[#E6C35C] text-black h-10 w-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </form>
      </header>
      
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-[160px] px-2">
        <button onClick={() => { if(deferredPrompt) deferredPrompt.prompt(); }} className="w-full h-11 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-between px-1.5 pr-4 shadow-2xl">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-[#E6C35C] rounded-full flex items-center justify-center p-1.5">
               <img src={logo} className="h-full w-full object-cover brightness-0" alt="" />
             </div>
             <span className="text-white text-[10px] font-black uppercase">Get App</span>
          </div>
          <ArrowRight className="text-white/40" size={12} />
        </button>
      </div>
    </div>
  );
}

