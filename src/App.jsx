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
    // Detect PWA Status
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsApp(isStandalone);
    if (isStandalone) setPhase('night');

    // Install Prompt Listener
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
    try {
      // Calls your Vercel Serverless Function
      const res = await fetch(`/api/sanctify?url=${encodeURIComponent(urlInput)}`);
      const data = await res.json();
      
      if (data.success && data.images.length > 0) {
        setReaderData(data);
      } else {
        alert("The void is too strong. No images found at this link.");
      }
    } catch (err) {
      alert("Sanctification failed. Check your connection.");
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

  // --- 1. READER VIEW (Activated when content is found) ---
  if (readerData) {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col z-[300]`}>
        <nav className="fixed top-0 w-full h-14 bg-black/90 backdrop-blur-md flex items-center px-4 justify-between border-b border-white/10 z-[301]">
          <button onClick={() => setReaderData(null)} className="text-[#E6C35C] flex items-center gap-2">
            <ChevronLeft size={20} />
            <span className="text-[10px] uppercase font-black tracking-widest">Exit</span>
          </button>
          <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{readerData.images.length} Pages</span>
        </nav>
        <main className="pt-14 flex flex-col items-center bg-black">
          {readerData.images.map((img, i) => (
            <img key={i} src={img} alt={`Page ${i+1}`} className="w-full max-w-3xl h-auto" loading="lazy" />
          ))}
        </main>
      </div>
    );
  }

  // --- 2. APP DASHBOARD (Shown when running as PWA) ---
  if (isApp) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col font-sans transition-colors duration-700`}>
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
          <div className={`p-1.5 rounded-full border ${theme.card} shadow-2xl backdrop-blur-2xl flex items-center`}>
            <div className="pl-4 pr-2 opacity-30"><Search size={16} /></div>
            <input 
              placeholder="Paste manga link..." 
              className="bg-transparent flex-1 outline-none text-xs font-medium"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button onClick={handleSanctify} className="h-9 w-9 bg-[#E6C35C] rounded-full flex items-center justify-center text-black shadow-lg">
              {isSanctifying ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            </button>
          </div>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-5">Your Library</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`aspect-[2/3] rounded-2xl border ${theme.card} relative overflow-hidden group shadow-xl bg-black/20`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10"><Plus size={32} /></div>
                  <div className="absolute bottom-4 left-4 right-4"><p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Empty</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
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

  // --- 3. PORTAL (Default Web View) ---
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col font-sans relative overflow-x-hidden`}>
      <Atmosphere phase={phase} />
      <nav className="fixed top-0 w-full h-16 px-6 flex items-center justify-between z-[100] backdrop-blur-xl border-b border-current/5">
        <div className="flex items-center gap-3">
          <img src={logo} className="h-9 w-9 rounded-full border border-[#E6C35C]/30 p-0.5" alt="L" />
          <span className="text-sm font-serif tracking-[0.2em] uppercase font-bold text-[#E6C35C]">Aniomics</span>
        </div>
        <button onClick={() => setPhase(isNight ? 'day' : 'night')} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
           {isNight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </nav>

      <header className="pt-32 pb-12 px-6 flex flex-col items-center text-center z-10">
        <div className="flex items-center gap-2 mb-4 text-[#E6C35C] animate-pulse">
          <Sparkles size={12} /><span className="text-[9px] uppercase tracking-[0.4em] font-bold">Universal Aesthetic Shell</span>
        </div>
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

      <section className="px-6 py-12 max-w-md mx-auto w-full z-10 mb-32">
         <h2 className="text-center text-[10px] uppercase font-black tracking-[0.4em] text-[#E6C35C] mb-8">Scrolls of Inquiry</h2>
         <div className="space-y-3">
            {[
              { q: "What is Sanctifying?", a: "Stripping ads and re-rendering content in our shell." },
              { q: "Is it truly free?", a: "The gates of Aniomics are open to all seekers of clean stories." }
            ].map((f, i) => (
              <div key={i} className={`rounded-2xl border ${theme.card} overflow-hidden`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-5 flex justify-between items-center text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{f.q}</span>
                  <ChevronDown size={14} className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-[10px] opacity-50 border-t border-white/5 pt-4 leading-relaxed">{f.a}</div>}
              </div>
            ))}
         </div>
      </section>

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

      <footer className="mt-auto py-12 border-t border-white/5 flex flex-col items-center opacity-40">
        <p className="text-[8px] uppercase tracking-[0.5em] font-black text-[#E6C35C]">support@aniomics.art</p>
      </footer>
    </div>
  );
}

