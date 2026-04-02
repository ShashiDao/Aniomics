import React, { useState, useEffect } from 'react';
import logo from './Assets/logo.png'; 
import { 
  Sparkles, Moon, Sun, Wand2, Loader2,
  Users, Zap, MessageCircle, Send as TelegramIcon, 
  Mail, ChevronDown, HelpCircle, ArrowRight,
  LayoutGrid, Clock, Library, Settings, Search,
  Plus, Bookmark, Play, BookOpen, ChevronLeft
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
    if (isStandalone) setPhase('night');

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert("To Install: \n1. Tap 'Share' or 'Menu'\n2. Choose 'Add to Home Screen'");
    }
  };

  const handleSanctify = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput) return;

    setIsSanctifying(true);
    // Google Proxy to bypass Hotlink/CORS for images
    const imgProxy = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";
    // Reliable CORS Bridge for HTML/API
    const corsBridge = "https://corsproxy.io/?"; 

    try {
      const url = new URL(urlInput);
      let foundImages = [];

      // --- BRANCH A: MANGADEX (API Based) ---
      if (url.hostname.includes('mangadex.org')) {
        const parts = url.pathname.split('/');
        const chapterId = parts[parts.indexOf('chapter') + 1];
        
        if (!chapterId) throw new Error("Invalid Link");

        // We fetch the server info via the CORS bridge
        const res = await fetch(`${corsBridge}${encodeURIComponent(`https://api.mangadex.org/at-home/server/${chapterId}`)}`);
        const data = await res.json();
        
        if (data.chapter) {
          const { baseUrl, hash, data: pages } = data.chapter;
          foundImages = pages.map(p => `${imgProxy}${encodeURIComponent(`${baseUrl}/data/${hash}/${p}`)}`);
        }
      } 
      // --- BRANCH B: GENERIC (Scraper Based) ---
      else {
        const res = await fetch(`${corsBridge}${encodeURIComponent(urlInput)}`);
        const html = await res.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img'));
        
        imgs.forEach(img => {
          const src = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src');
          if (src && !/logo|icon|avatar|banner|ads/i.test(src)) {
            let fullSrc = src.trim();
            if (fullSrc.startsWith('//')) fullSrc = 'https:' + fullSrc;
            else if (fullSrc.startsWith('/')) fullSrc = url.origin + fullSrc;
            else if (!fullSrc.startsWith('http')) fullSrc = url.origin + '/' + fullSrc;
            
            foundImages.push(`${imgProxy}${encodeURIComponent(fullSrc)}`);
          }
        });
      }

      if (foundImages.length > 2) {
        setReaderData({ images: [...new Set(foundImages)] });
      } else {
        alert("The void is too strong. No pages found. Ensure this is a direct chapter link.");
      }
    } catch (err) {
      alert("Sanctification failed. The site might be blocked by Cloudflare or the link is incorrect.");
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
            <span className="text-[10px] uppercase font-black tracking-widest">Exit Sanctuary</span>
          </button>
          <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{readerData.images.length} Pages</span>
        </nav>
        <main className="pt-14 flex flex-col items-center bg-black min-h-screen overflow-y-auto">
          {readerData.images.map((img, i) => (
            <div key={i} className="w-full max-w-3xl min-h-[300px] flex items-center justify-center relative bg-black">
              <img 
                src={img} 
                alt={`Page ${i+1}`} 
                className="w-full h-auto relative z-10" 
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Loader2 className="animate-spin text-[#E6C35C]" size={24} />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  // APP DASHBOARD VIEW
  if (isApp) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col font-sans transition-colors duration-700 relative`}>
        <Atmosphere phase={phase} />
        <header className="fixed top-0 w-full p-5 flex justify-between items-center z-[100] backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
             <img src={logo} className="h-8 w-8 rounded-full border border-[#E6C35C]/30 p-0.5" alt="L" />
             <span className="font-serif uppercase tracking-[0.3em] text-[10px] font-black text-[#E6C35C]">Sanctuary</span>
          </div>
          <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 bg-white/5 rounded-full border border-white/10">
            {isNight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </header>

        <main className="flex-1 pt-24 px-6 pb-32 space-y-8 z-10">
          <form onSubmit={handleSanctify} className={`p-1.5 rounded-full border ${theme.card} shadow-2xl backdrop-blur-2xl flex items-center`}>
            <div className="pl-4 pr-2 opacity-30"><Search size={16} /></div>
            <input 
              placeholder="Paste manga link..." 
              className="bg-transparent flex-1 outline-none text-xs font-medium"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button type="submit" className="h-9 w-9 bg-[#E6C35C] rounded-full flex items-center justify-center text-black shadow-lg">
              {isSanctifying ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            </button>
          </form>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-5">Your Library</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`aspect-[2/3] rounded-2xl border ${theme.card} relative overflow-hidden group shadow-xl bg-black/20 flex items-center justify-center`}>
                  <Plus size={32} className="opacity-10" />
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3 text-center">
             <button className={`p-4 rounded-2xl border ${theme.card} flex flex-col items-center gap-2`}><Bookmark size={18} className="text-[#E6C35C]" /><span className="text-[8px] font-bold uppercase">Saved</span></button>
             <button className={`p-4 rounded-2xl border ${theme.card} flex flex-col items-center gap-2`}><Play size={18} className="text-[#E6C35C]" /><span className="text-[8px] font-bold uppercase">Watch</span></button>
             <button className={`p-4 rounded-2xl border ${theme.card} flex flex-col items-center gap-2`}><BookOpen size={18} className="text-[#E6C35C]" /><span className="text-[8px] font-bold uppercase">Read</span></button>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-8 flex justify-around items-center z-[200]">
          {[{ id: 'home', icon: LayoutGrid, label: 'Portal' }, { id: 'library', icon: Library, label: 'Library' }, { id: 'history', icon: Clock, label: 'History' }, { id: 'settings', icon: Settings, label: 'Soul' }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-[#E6C35C] scale-110' : 'opacity-30'}`}>
              <item.icon size={20} /><span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              {activeTab === item.id && <div className="h-1 w-1 bg-[#E6C35C] rounded-full shadow-[0_0_8px_#E6C35C]" />}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // WEB PORTAL VIEW
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col font-sans relative overflow-x-hidden`}>
      <Atmosphere phase={phase} />
      <nav className="fixed top-0 w-full h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-current/5">
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
        <form onSubmit={handleSanctify} className="w-full max-w-md relative mb-24 px-4">
          <div className={`flex items-center p-1.5 rounded-full border ${theme.card} backdrop-blur-2xl shadow-2xl`}>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste scroll link to enter..." 
              className="bg-transparent flex-1 outline-none text-[13px] px-4 font-sans placeholder:opacity-30"
            />
            <button type="submit" className="bg-[#E6C35C] text-black h-10 w-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              {isSanctifying ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </form>
      </header>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-[160px] px-2">
        <button onClick={handleInstallClick} className="w-full h-11 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-between px-1.5 pr-4 shadow-2xl active:scale-95 transition-all">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-[#E6C35C] rounded-full flex items-center justify-center p-1.5">
               <img src={logo} className="h-full w-full object-cover brightness-0" alt="" />
             </div>
             <span className="text-white text-[10px] font-black uppercase tracking-widest">Get App</span>
          </div>
          <ArrowRight className="text-white/40" size={12} />
        </button>
      </div>
    </div>
  );
}

