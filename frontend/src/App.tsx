import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParentDashboard from './ParentDashboard';
import { 
  MapPin, 
  ArrowRight,
  X,
  ArrowLeft
} from 'lucide-react';

interface Recommendation {
  sport: string;
  altSport: string;
  tag: string;
  tagColor: string;
  reason: string;
  parentTip: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const customSmoothScrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  
  const navbarHeight = 80;
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 1200; // Super smooth 1.2s scroll
  let start: number | null = null;

  const animation = (currentTime: number) => {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    
    // Easing: easeInOutQuart (very elegant, slow start and end)
    const ease = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    const run = ease(Math.min(timeElapsed / duration, 1));
    
    window.scrollTo(0, startPosition + distance * run);
    
    if (timeElapsed < duration) requestAnimationFrame(animation);
  };
  
  requestAnimationFrame(animation);
};

export default function App() {
  // Simulator State
  const childName = "Lorenzo";
  const childAge = 8;

  
  const [agility, setAgility] = useState(7);
  const [teamwork, setTeamwork] = useState(8);
  const [discipline, setDiscipline] = useState(6);

  // Search simulator state
  const [selectedTown, setSelectedTown] = useState("Catania");

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authSelection, setAuthSelection] = useState<'none' | 'parent' | 'club'>('none');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  
  // STATO PER SIMULARE IL LOGIN AVVENUTO
  const [isLoggedInAs, setIsLoggedInAs] = useState<'none' | 'parent' | 'club'>('none');


  const openAuth = (selection?: 'none' | 'parent' | 'club', mode: 'login' | 'register' = 'register') => {
    setAuthSelection(selection || 'none');
    setAuthMode(mode);
    setAuthModalOpen(true);
  };



  // 1. Data Source: Available Clubs & Courses
  const nearbyClubs = useMemo(() => {
    switch (selectedTown) {
      case "Roma":
        return [
          { name: "Roma Sport Center", address: "Viale Tiziano 74", distance: 1.2, travelTime: 5, courses: ["Mini-Basket", "Nuoto Formativo"] },
          { name: "Aurelia Scherma", address: "Via Aurelia 105", distance: 4.5, travelTime: 12, courses: ["Scherma"] },
          { name: "Eur Sport & Salute", address: "Viale Europa 12", distance: 6.8, travelTime: 18, courses: ["Scuola Calcio", "Ginnastica Artistica"] }
        ];
      case "Milano":
        return [
          { name: "Milano Sport Junior", address: "Via Fatebenefratelli 11", distance: 0.9, travelTime: 3, courses: ["Judo", "Ginnastica Artistica"] },
          { name: "Idroscalo Club", address: "Circonvallazione Idroscalo", distance: 8.5, travelTime: 20, courses: ["Nuoto Formativo", "Scuola Calcio"] },
          { name: "Olimpia Milano Basket", address: "Piazzale Lotto", distance: 5.2, travelTime: 14, courses: ["Mini-Basket"] }
        ];
      default: // Catania
        return [
          { name: "Cus Catania", address: "Via Santa Sofia 111", distance: 2.1, travelTime: 6, courses: ["Scuola Calcio", "Mini-Basket"] },
          { name: "Accademia Giovanile Catania", address: "Via Etnea 540", distance: 1.5, travelTime: 4, courses: ["Judo", "Ginnastica Artistica"] },
          { name: "Centro Nuoto Jonica", address: "Viale Ruggero di Lauria", distance: 4.2, travelTime: 10, courses: ["Nuoto Formativo", "Scherma"] }
        ];
    }
  }, [selectedTown]);

  // 2. Dynamic Recommendation Engine
  // 2. TRUE AI Dynamic Recommendation Engine (Euclidean Distance Algorithm)
  const recommendation: Recommendation = useMemo(() => {
    // 3D Space Sports Database: [Agility(a), Teamwork(t), Discipline(d)]
    const db = [
      { sport: "Ginnastica Artistica", a: 10, t: 2, d: 10, tag: "Perfezione Biomeccanica", tagColor: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200", reason: "Eccelle nel controllo del corpo e nella disciplina rigorosa, preferendo un lavoro individuale." },
      { sport: "Ginnastica Ritmica", a: 9, t: 4, d: 9, tag: "Eleganza e Controllo", tagColor: "bg-pink-50 text-pink-800 border-pink-200", reason: "Movenze armoniche e altissima adesione alle regole, con una minima interazione coordinata." },
      { sport: "Tuffi", a: 10, t: 1, d: 8, tag: "Esplosività e Coraggio", tagColor: "bg-cyan-50 text-cyan-800 border-cyan-200", reason: "Massima reattività isolata, assenza totale di ansia da prestazione di gruppo." },
      { sport: "Arrampicata Sportiva", a: 9, t: 1, d: 6, tag: "Verticalità Istintiva", tagColor: "bg-slate-50 text-slate-800 border-slate-200", reason: "Grande agilità e totale indipendenza. Non ama le classiche regole di campo." },
      { sport: "Scherma (Spada)", a: 9, t: 2, d: 8, tag: "Riflessi Tattici", tagColor: "bg-sky-50 text-sky-800 border-sky-200", reason: "Mente fredda, tempi di reazione eccezionali, protezione dalle logiche di spogliatoio." },
      { sport: "Scherma (Sciabola)", a: 10, t: 2, d: 6, tag: "Esplosività Pura", tagColor: "bg-red-50 text-red-800 border-red-200", reason: "Estremamente rapido, impulsivo. La sciabola premia chi attacca subito." },
      { sport: "Karate (Kumite)", a: 8, t: 2, d: 7, tag: "Contatto e Riflessi", tagColor: "bg-orange-50 text-orange-800 border-orange-200", reason: "Canalizza l'irruenza fisica all'interno di regole marziali." },
      { sport: "Karate (Kata)", a: 7, t: 1, d: 10, tag: "Controllo Assoluto", tagColor: "bg-amber-50 text-amber-800 border-amber-200", reason: "Rispetto assoluto della forma e totale distacco dalle dinamiche di gruppo." },
      { sport: "Judo", a: 7, t: 4, d: 9, tag: "Rispetto e Contatto", tagColor: "bg-yellow-50 text-yellow-800 border-yellow-200", reason: "Perfetto equilibrio tra fisicità, rispetto del tatami e disciplina pura." },
      { sport: "Basket (Playmaker)", a: 8, t: 9, d: 7, tag: "Visione ed Esecuzione", tagColor: "bg-orange-50 text-orange-800 border-orange-200", reason: "Vede tutto, si muove veloce ed esalta i compagni gestendo bene la pressione." },
      { sport: "Basket (Guardia)", a: 9, t: 8, d: 5, tag: "Dinamismo Puro", tagColor: "bg-rose-50 text-rose-800 border-rose-200", reason: "Reattivo e creativo, ama il gruppo ma ogni tanto prende l'iniziativa ignorando gli schemi." },
      { sport: "Mini-Basket", a: 6, t: 8, d: 6, tag: "Sinergia Dinamica", tagColor: "bg-orange-50 text-orange-800 border-orange-200", reason: "Ottimo sport di situazione per coordinazione base e buon spirito di squadra." },
      { sport: "Calcio (Fantasista)", a: 9, t: 7, d: 3, tag: "Creatività Pura", tagColor: "bg-sky-50 text-sky-800 border-sky-200", reason: "Talento immenso ma refrattario alla tattica rigida. Ha bisogno di inventare." },
      { sport: "Calcio (Centrocampista)", a: 7, t: 9, d: 8, tag: "Sacrificio e Tattica", tagColor: "bg-blue-50 text-blue-800 border-blue-200", reason: "Grande attenzione e spirito di sacrificio, il vero motore in campo." },
      { sport: "Calcio a 5 (Futsal)", a: 8, t: 8, d: 4, tag: "Intensità Condivisa", tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200", reason: "Campo piccolo, continui scambi. Ideale per chi ha poca attenzione ma ama il team." },
      { sport: "Pallavolo (Attaccante)", a: 8, t: 9, d: 6, tag: "Potenza Esplosiva", tagColor: "bg-cyan-50 text-cyan-800 border-cyan-200", reason: "Ottima elevazione e dinamiche di squadra ma con picchi individualisti." },
      { sport: "Pallavolo (Libero)", a: 9, t: 10, d: 8, tag: "Spirito di Sacrificio", tagColor: "bg-teal-50 text-teal-800 border-teal-200", reason: "Agilità felina messa al servizio totale e umile del collettivo." },
      { sport: "Pallavolo (Palleggiatore)", a: 7, t: 10, d: 9, tag: "Regia e Sincronia", tagColor: "bg-indigo-50 text-indigo-800 border-indigo-200", reason: "Il cervello della squadra. Coordinato, altruista e precisissimo." },
      { sport: "Rugby", a: 6, t: 10, d: 9, tag: "Sostegno e Lealtà", tagColor: "bg-green-50 text-green-800 border-green-200", reason: "Disposizione totale al sacrificio per il team. Rispetto cieco dell'arbitro." },
      { sport: "Pallanuoto", a: 8, t: 10, d: 8, tag: "Gladiatore dell'Acqua", tagColor: "bg-blue-50 text-blue-800 border-blue-200", reason: "Resistenza nel gruppo, rispetto degli schemi e della fatica estrema." },
      { sport: "Nuoto Agonistico", a: 7, t: 2, d: 9, tag: "Resistenza Mentale", tagColor: "bg-blue-50 text-blue-800 border-blue-200", reason: "Lavoro durissimo contro il cronometro e se stessi." },
      { sport: "Nuoto Formativo", a: 3, t: 3, d: 5, tag: "Ambiente Protetto", tagColor: "bg-blue-50 text-blue-800 border-blue-200", reason: "Ideale per lo sviluppo motorio base senza pressione sociale." },
      { sport: "Nuoto Sincronizzato", a: 8, t: 9, d: 10, tag: "Geometria Liquida", tagColor: "bg-purple-50 text-purple-800 border-purple-200", reason: "Massima flessibilità unita a regole ferree e perfezione sincronizzata." },
      { sport: "Canottaggio", a: 6, t: 9, d: 10, tag: "Sincronia Perfetta", tagColor: "bg-indigo-50 text-indigo-800 border-indigo-200", reason: "La fatica pura condivisa con il team, senza necessità di cambi di direzione." },
      { sport: "Tennis (Singolare)", a: 8, t: 2, d: 8, tag: "Equilibrio Totale", tagColor: "bg-[#f8fafc] text-[#081a36] border-slate-200", reason: "Classico bilanciamento perfetto. Sa stare in campo da solo gestendo la pressione." },
      { sport: "Padel", a: 7, t: 6, d: 4, tag: "Competizione Rapida", tagColor: "bg-lime-50 text-lime-800 border-lime-200", reason: "Reattivo e divertente, il punteggio si azzera in fretta senza tattiche ansiogene." },
      { sport: "Tennistavolo", a: 9, t: 3, d: 5, tag: "Prontezza Oculomanuale", tagColor: "bg-sky-50 text-sky-800 border-sky-200", reason: "Ottimi riflessi visivi e socialità moderata al chiuso." },
      { sport: "Tiro con l'Arco", a: 2, t: 1, d: 10, tag: "Concentrazione Zen", tagColor: "bg-teal-50 text-teal-800 border-teal-200", reason: "Altissima disciplina. L'assenza di contrasti fisici lo rende perfetto." },
      { sport: "Equitazione", a: 5, t: 4, d: 8, tag: "Sensibilità e Cura", tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200", reason: "Il rapporto esclusivo con l'animale compensa la fatica relazionale." },
      { sport: "Skateboard", a: 8, t: 3, d: 2, tag: "Sfida Individuale", tagColor: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200", reason: "Sport moderno in cui l'unica regola è superare i propri limiti." },
      { sport: "Breakdance", a: 9, t: 4, d: 3, tag: "Ritmo ed Esplosività", tagColor: "bg-pink-50 text-pink-800 border-pink-200", reason: "Usa l'espressione musicale per darsi regole al di fuori delle federazioni." },
      { sport: "Atletica (Velocità)", a: 10, t: 2, d: 6, tag: "Sfida al Cronometro", tagColor: "bg-yellow-50 text-yellow-800 border-yellow-200", reason: "Potenza esplosiva lineare in corsia." },
      { sport: "Atletica (Fondo)", a: 6, t: 3, d: 9, tag: "Resistenza e Metodo", tagColor: "bg-amber-50 text-amber-800 border-amber-200", reason: "Capacità di soffrire e gestire lo sforzo sul lungo periodo." },
      { sport: "Baseball / Softball", a: 6, t: 8, d: 9, tag: "Squadra e Metodo", tagColor: "bg-violet-50 text-violet-800 border-violet-200", reason: "Sport di attese e scatti, regole complesse e team solidale." },
      { sport: "Dodgeball", a: 7, t: 8, d: 2, tag: "Caos Creativo", tagColor: "bg-rose-50 text-rose-800 border-rose-200", reason: "Animale da branco! Movimento istintivo senza limitazioni tattiche." }
    ];

    let bestMatch = db[0];
    let minDistance = Infinity;

    // L'algoritmo calcola la Distanza Euclidea nello spazio 3D tra il punteggio attuale e i 35 sport del database
    for (const sport of db) {
      const distance = Math.sqrt(
        Math.pow(sport.a - agility, 2) + 
        Math.pow(sport.t - teamwork, 2) + 
        Math.pow(sport.d - discipline, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = sport;
      }
    }

    return {
      sport: childAge <= 5 ? "Psicomotricità Infantile" : bestMatch.sport,
      altSport: childAge <= 5 ? "Nuoto Formativo" : "Vedi alternative nei club limitrofi",
      tag: childAge <= 5 ? "Sviluppo Schemi Base" : bestMatch.tag,
      tagColor: childAge <= 5 ? "bg-amber-100 text-amber-800 border-amber-200" : bestMatch.tagColor,
      reason: childAge <= 5 
         ? `Sotto i 6 anni l'unica regola è esplorare! L'algoritmo rileva un'età prescolare: sconsigliamo la specializzazione precoce. ${childName} ha bisogno di percorsi polisportivi giocosi per imparare a saltare, rotolare e stare in equilibrio.`
         : `I punteggi rilevati si allineano matematicamente con questo sport. ${bestMatch.reason}`,
      parentTip: childAge <= 5 
         ? "Non cercate il 'campione' a questa età. Premia i sorrisi e lo sforzo, non i risultati." 
         : "L'algoritmo calcola in tempo reale la Distanza Euclidea tra i test e le metriche ottimali di 35 sport."
    };
  }, [childName, childAge, agility, teamwork, discipline]);

  return (
    <AnimatePresence mode="wait">
      {isLoggedInAs === 'parent' ? (
        <motion.div key="parent-dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
          <ParentDashboard onLogout={() => { setIsLoggedInAs('none'); setAuthModalOpen(false); }} />
        </motion.div>
      ) : (
        <motion.div key="landing-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="min-h-screen bg-[#fafcff] text-[#081a36] font-sans antialiased selection:bg-sky-200 selection:text-[#081a36]">
      
      {/* MINIMAL NAVBAR */}
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-2xl font-black tracking-tighter text-[#081a36] hover:opacity-80 transition-opacity">
            ATHLOS.
          </a>
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-slate-500">
            <a href="#simulatore" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('simulatore'); }} className="hover:text-[#081a36] transition-colors">L'Algoritmo</a>
            <a href="#vicino-a-te" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('vicino-a-te'); }} className="hover:text-[#081a36] transition-colors">Club Vicini</a>
            <a href="#club-sportivi" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('club-sportivi'); }} className="hover:text-[#081a36] transition-colors">Area Club</a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => openAuth('none', 'login')}
              className="text-[14px] font-bold text-[#081a36] hover:opacity-70 transition-opacity"
            >
              Accedi
            </button>
            <button 
              onClick={() => openAuth('none', 'register')}
              className="px-5 py-2.5 rounded-full bg-[#081a36] hover:bg-[#0066cc] text-white text-[14px] font-bold transition-all"
            >
              Inizia
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 sm:pt-44 sm:pb-32 px-6 overflow-hidden bg-gradient-to-br from-blue-50 via-[#f8fafc] to-sky-100">
        
        {/* FLOATING SPORTS ELEMENTS */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] right-[15%] text-6xl opacity-70 transform-gpu hidden md:block">
             🏀
           </motion.div>
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, 25, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[45%] left-[8%] text-7xl opacity-60 transform-gpu hidden md:block">
             ⚽
           </motion.div>
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] right-[25%] text-6xl opacity-70 transform-gpu hidden md:block">
             🏊‍♂️
           </motion.div>
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, 30, 0], rotate: [0, -20, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-[15%] left-[30%] text-5xl opacity-40 transform-gpu hidden md:block">
             🎾
           </motion.div>
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }} transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-[10%] left-[40%] text-6xl opacity-50 transform-gpu hidden lg:block">
             🥋
           </motion.div>
           <motion.div style={{ willChange: "transform" }} animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }} transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }} className="absolute top-[60%] right-[8%] text-6xl opacity-50 transform-gpu hidden lg:block">
             🤺
           </motion.div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="max-w-4xl"
          >
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-[75px] lg:text-[90px] font-black text-[#081a36] leading-[0.95] tracking-tighter drop-shadow-sm">
              Lo sport non è <br/>una scommessa.
            </motion.h1>
            
            <motion.p variants={fadeUp} className="mt-8 text-xl sm:text-2xl text-slate-500 font-medium leading-tight max-w-2xl">
              Un bambino su tre abbandona per noia o trasferte impossibili.
              Athlos incrocia i test degli allenatori con le reali disponibilità dei club locali.
            </motion.p>
            
            <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row items-center gap-4 max-w-xl">
              <div className="flex-1 w-full relative group shadow-sm rounded-full bg-white">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-[#0066cc] transition-colors pointer-events-none" />
                <select 
                  value={selectedTown} 
                  onChange={(e) => setSelectedTown(e.target.value)}
                  className="w-full bg-transparent border-2 border-transparent hover:border-sky-100 rounded-full pl-12 pr-6 py-4 text-lg font-bold text-[#081a36] appearance-none focus:outline-none focus:border-[#0066cc] transition-all cursor-pointer"
                >
                  <option value="Catania">Catania</option>
                  <option value="Roma">Roma</option>
                  <option value="Milano">Milano</option>
                </select>
              </div>
              <button 
                onClick={() => customSmoothScrollTo('vicino-a-te')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0066cc] hover:bg-[#081a36] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 group"
              >
                Esplora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SIMULATOR */}
      <section id="simulatore" className="py-24 sm:py-32 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-t border-slate-100 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-[#081a36] tracking-tighter leading-tight">
              Oltre i semplici gol.
            </h2>
            <p className="mt-6 text-lg text-slate-400 font-medium max-w-xl">
              Nessun tracciamento maniacale delle partite. Simuliamo l'algoritmo usando i test motori e le valutazioni psicologiche a fine trimestre redatte dal tecnico.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* LEFT: SLIDERS */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 space-y-12"
            >
               <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                   <h3 className="text-xl font-bold text-[#081a36]">Test Fisici e Motori</h3>
                   <span className="text-3xl font-black text-[#0066cc]">{agility}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={agility}
                   onChange={(e) => setAgility(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0066cc] hover:accent-[#081a36] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                   <span>(Es. Scatto, Salto)</span>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                   <h3 className="text-xl font-bold text-[#081a36]">Creatività e Gruppo</h3>
                   <span className="text-3xl font-black text-[#00a2ff]">{teamwork}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={teamwork}
                   onChange={(e) => setTeamwork(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#00a2ff] hover:accent-[#081a36] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                   <span>(Form Trimestrale)</span>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                   <h3 className="text-xl font-bold text-[#081a36]">Gestione Stress/Regole</h3>
                   <span className="text-3xl font-black text-emerald-500">{discipline}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={discipline}
                   onChange={(e) => setDiscipline(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-[#081a36] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                   <span>(Form Trimestrale)</span>
                 </div>
               </div>
            </motion.div>

            {/* RIGHT: PASSPORT */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7"
            >
               <div className="relative bg-white rounded-[2rem] p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[420px] flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={recommendation.sport}
                     initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
                     animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                     exit={{ opacity: 0, filter: "blur(8px)", y: -15, transition: { duration: 0.05 } }}
                     transition={{ duration: 0.4, ease: "easeOut" }}
                     className="space-y-8"
                   >
                     <div>
                       <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${recommendation.tagColor} mb-4 transition-colors`}>
                         {recommendation.tag}
                       </span>
                       <h4 className="text-3xl sm:text-4xl font-black text-[#081a36] leading-tight tracking-tight transition-all">
                         {recommendation.sport}
                       </h4>
                       <p className="mt-3 text-sm text-slate-400 font-medium">
                         Elaborazione AI basata su parametri biomeccanici e attitudinali
                       </p>
                     </div>
                     
                     <div className="space-y-6">
                       <div>
                         <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Osservazione Tecnica</h5>
                         <p className="text-lg text-slate-600 leading-relaxed font-medium">
                           {recommendation.reason}
                         </p>
                       </div>
                       <div className="pt-6 border-t border-slate-100">
                         <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Nota per la Famiglia</h5>
                         <p className="text-xl text-[#081a36] leading-relaxed font-bold">
                           "{recommendation.parentTip}"
                         </p>
                       </div>
                       <div className="pt-4 border-t border-slate-100/50">
                         <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                           <strong className="text-slate-500">Avvertenza:</strong> Athlos raccoglie un insieme di osservazioni qualificate sul campo per aiutarti a orientarti verso lo sport più adatto. La piattaforma non produce né sostituisce alcuna diagnosi medica o psicologica professionale.
                         </p>
                       </div>
                     </div>
                   </motion.div>
                 </AnimatePresence>
               </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* VICINO A TE */}
      <section id="vicino-a-te" className="py-24 sm:py-32 bg-gradient-to-t from-sky-50/40 to-white border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16"
          >
            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl font-black text-[#081a36] tracking-tighter leading-tight">
                Il raggio protetto.
              </h2>
              <p className="mt-6 text-xl text-slate-400 font-medium">
                Iscriviti solo in strutture entro 20 km. Nessuna corsa nel traffico, più tempo libero per te.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-wrap gap-2">
               {["Catania", "Roma", "Milano"].map((town) => (
                  <button
                    key={town}
                    onClick={() => setSelectedTown(town)}
                    className={`px-5 py-3 rounded-full text-sm font-bold transition-all ${
                      selectedTown === town 
                        ? "bg-[#081a36] text-white shadow-lg" 
                        : "bg-slate-50 text-slate-400 hover:text-[#081a36] hover:bg-slate-100"
                    }`}
                  >
                    {town}
                  </button>
               ))}
            </div>
          </motion.div>

          <div className="border-t border-slate-100">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={selectedTown}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.3 }}
               >
                 {nearbyClubs.map((club, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, y: 15 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: idx * 0.1 }}
                     className="group flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-slate-100 hover:px-4 transition-all duration-300 gap-6 cursor-pointer"
                     onClick={() => openAuth('parent', 'register')}
                   >
                     <div className="flex-1">
                       <div className="flex items-center gap-3 mb-3">
                         <span className="text-lg font-black text-[#0066cc]">
                           {club.distance} km
                         </span>
                         <span className="text-sm font-bold text-slate-300">
                           {club.travelTime} min auto
                         </span>
                       </div>
                       <h3 className="text-2xl sm:text-3xl font-black text-[#081a36] group-hover:text-[#0066cc] transition-colors tracking-tight">
                         {club.name}
                       </h3>
                       <p className="mt-1 text-lg text-slate-400 font-medium">
                         {club.address}
                       </p>
                     </div>
                     <div className="flex-1 md:text-right">
                        <ul className="space-y-2 inline-block text-left md:text-right">
                          {club.courses.map((course, cIdx) => (
                            <li key={cIdx} className="text-lg text-slate-600 font-bold">
                              {course}
                            </li>
                          ))}
                        </ul>
                     </div>
                     <div className="shrink-0 flex justify-end">
                       <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-[#081a36] group-hover:border-[#081a36] group-hover:text-white transition-all text-slate-300">
                         <ArrowRight className="w-6 h-6" />
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* CLUBS SECTION */}
      <section id="club-sportivi" className="py-24 sm:py-32 bg-[#081a36] text-white overflow-hidden relative">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#0066cc] rounded-full pointer-events-none transform-gpu"
        />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.95]">
                I test che fai,<br/>valorizzati.
              </h2>
              <p className="mt-8 text-xl text-slate-400 font-medium leading-tight max-w-md">
                Un'area gestionale dove inserire i test fisici settimanali e un form psicologico veloce a fine trimestre. L'AI fa il resto.
              </p>
              <div className="mt-12">
                <button 
                  onClick={() => openAuth('club', 'register')}
                  className="px-8 py-4 rounded-full bg-white text-[#081a36] hover:bg-[#0066cc] hover:text-white font-black text-lg transition-all"
                >
                  Registra il tuo Club
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 border border-white/10 p-10 sm:p-12 rounded-[2rem] backdrop-blur-md"
            >
              <p className="text-2xl text-slate-200 font-bold leading-tight italic">
                "Ora i genitori vedono i risultati scritti di tutti quegli esercizi sulla rapidità e attenzione che facciamo in campo. Hanno smesso di chiederci solo quanti gol hanno fatto."
              </p>
              <div className="mt-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-[#0066cc] flex items-center justify-center font-black text-xl">
                  S
                </div>
                <div>
                  <div className="text-lg font-black">Salvo R.</div>
                  <div className="text-slate-400 font-bold text-sm">Responsabile Scuola Calcio</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 py-12 text-center border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-3xl font-black text-[#081a36] tracking-tighter mb-4 block hover:opacity-80 transition-opacity">ATHLOS.</a>
          <p className="text-slate-400 font-medium text-sm">
            © 2026 Athlos S.r.l. — Conforme alle Linee Guida Attività Motoria Giovanile CONI.
          </p>
        </div>
      </footer>

      {/* SPLIT SCREEN AUTH MODAL */}
      <AnimatePresence>
        {authModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.3 } }}
            className="fixed inset-0 z-50 flex w-full h-full bg-white overflow-hidden"
          >
            
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-6 right-6 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#081a36] shadow-lg hover:scale-105 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {authSelection !== 'none' && (
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setAuthSelection('none')}
                  className="absolute top-6 left-6 z-[100] px-5 py-3 rounded-full bg-white text-[#081a36] shadow-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" /> Indietro
                </motion.button>
              )}
            </AnimatePresence>

            {/* LEFT HALF: PARENT */}
            <motion.div
              animate={{
                width: authSelection === 'none' ? "50%" : authSelection === 'parent' ? "100%" : "0%",
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full bg-sky-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group border-r border-sky-100"
              onClick={() => authSelection === 'none' && setAuthSelection('parent')}
            >
              <div className="absolute inset-0 bg-[#0066cc]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <motion.div 
                animate={{ opacity: authSelection === 'club' ? 0 : 1 }}
                className="relative z-10 w-full max-w-md px-8 text-center"
              >
                {authSelection === 'none' && (
                  <>
                    <h2 className="text-4xl sm:text-5xl font-black text-[#081a36] mb-3">Genitore</h2>
                    <p className="text-lg text-slate-500 font-medium">Invita altri genitori e segui lo sviluppo</p>
                  </>
                )}
                
                <AnimatePresence mode="wait">
                  {authSelection === 'parent' && (
                    <motion.div 
                      key={authMode}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4"
                    >
                      <div className="p-8 bg-white rounded-3xl shadow-xl shadow-sky-900/5 text-left cursor-default" onClick={e => e.stopPropagation()}>
                        
                        {authMode === 'register' ? (
                          <>
                            <h3 className="text-2xl font-bold text-[#081a36] mb-4">Crea account famiglia</h3>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Nome" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                              <input type="text" placeholder="Cognome" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="tel" placeholder="Telefono" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                              <input type="text" placeholder="Codice Fiscale" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36] uppercase" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Via e civico" className="w-2/3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                              <input type="text" placeholder="CAP" className="w-1/3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Città" className="w-3/4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                              <input type="text" placeholder="Prov" className="w-1/4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            </div>
                            <input type="email" placeholder="Indirizzo Email" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            <input type="password" placeholder="Scegli una password" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            <input type="text" placeholder="Codice Invito (Opzionale)" className="w-full mb-5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            <button onClick={(e) => { e.preventDefault(); setIsLoggedInAs('parent'); setAuthModalOpen(false); }} className="w-full py-4 bg-[#0066cc] hover:bg-[#081a36] transition-colors text-white rounded-xl font-bold text-lg">Registrati ora</button>
                            <p className="mt-5 text-sm text-center text-slate-500 font-medium">
                              Hai già un account? <span className="text-[#0066cc] font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('login')}>Accedi</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-2xl font-bold text-[#081a36] mb-6">Bentornato</h3>
                            <input type="email" placeholder="Indirizzo Email" className="w-full mb-4 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            <input type="password" placeholder="Password" className="w-full mb-6 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                            <button onClick={(e) => { e.preventDefault(); setIsLoggedInAs('parent'); setAuthModalOpen(false); }} className="w-full py-4 bg-[#081a36] hover:bg-[#0066cc] transition-colors text-white rounded-xl font-bold text-lg">Accedi</button>
                            <p className="mt-6 text-sm text-center text-slate-500 font-medium">
                              Non hai un account? <span className="text-[#0066cc] font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('register')}>Registrati</span>
                            </p>
                          </>
                        )}
                        
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* RIGHT HALF: CLUB */}
            <motion.div
              animate={{
                width: authSelection === 'none' ? "50%" : authSelection === 'club' ? "100%" : "0%",
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full bg-[#081a36] flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
              onClick={() => authSelection === 'none' && setAuthSelection('club')}
            >
              <div className="absolute inset-0 bg-[#0066cc]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <motion.div 
                animate={{ opacity: authSelection === 'parent' ? 0 : 1 }}
                className="relative z-10 w-full max-w-md px-8 text-center"
              >
                {authSelection === 'none' && (
                  <>
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">Club Sportivo</h2>
                    <p className="text-lg text-slate-400 font-medium">Inserisci i test e compila i form</p>
                  </>
                )}
                
                <AnimatePresence mode="wait">
                  {authSelection === 'club' && (
                    <motion.div 
                      key={authMode}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4"
                    >
                      <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl text-left cursor-default" onClick={e => e.stopPropagation()}>
                        
                        {authMode === 'register' ? (
                          <>
                            <h3 className="text-2xl font-bold text-white mb-4">Affilia la tua Società</h3>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Nome Resp." className="w-1/2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                              <input type="text" placeholder="Cognome Resp." className="w-1/2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            </div>
                            <input type="text" placeholder="Nome Società Sportiva" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            <div className="flex gap-3 mb-3">
                              <input type="tel" placeholder="Telefono Club" className="w-1/2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                              <input type="email" placeholder="Email ufficiale" className="w-1/2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Via e civico" className="w-2/3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                              <input type="text" placeholder="CAP" className="w-1/3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="text" placeholder="Città" className="w-3/4 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                              <input type="text" placeholder="Prov" className="w-1/4 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            </div>
                            <input type="password" placeholder="Scegli una password" className="w-full mb-5 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            <button className="w-full py-4 bg-white hover:bg-[#0066cc] hover:text-white transition-colors text-[#081a36] rounded-xl font-bold text-lg">Richiedi Affiliazione</button>
                            <p className="mt-5 text-sm text-center text-slate-400 font-medium">
                              Già affiliato? <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('login')}>Accedi al gestionale</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-2xl font-bold text-white mb-6">Area Riservata Club</h3>
                            <input type="email" placeholder="Indirizzo Email" className="w-full mb-4 px-5 py-4 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            <input type="password" placeholder="Password" className="w-full mb-6 px-5 py-4 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc] font-medium" />
                            <button className="w-full py-4 bg-[#0066cc] hover:bg-white hover:text-[#081a36] transition-colors text-white rounded-xl font-bold text-lg">Accedi</button>
                            <p className="mt-6 text-sm text-center text-slate-400 font-medium">
                              Nuova società? <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('register')}>Affiliati ad Athlos</span>
                            </p>
                          </>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
