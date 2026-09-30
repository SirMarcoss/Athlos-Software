import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MapPin, Shield, ChevronRight, X, Copy, CheckCircle2, User as UserIcon, Phone, MapPin as MapPinIcon, Info } from 'lucide-react';

// === INTERFACCE ===
interface Child {
  id: string;
  first_name: string;
  last_name: string;
  sport: string; 
}

interface PsychForm {
  id: string;
  date: string;
  creativity_score: number;
  teamwork_score: number;
  stress_management_score: number;
  ai_recommended_sport: string;
  coach_notes: string;
  course_id: string; 
}

interface Course {
  name: string;
  age_range: string;
  sport: string;
}

interface Club {
  name: string;
  address: string;
  distance: string;
  courses: Course[];
}

const MOCK_CHILDREN: Child[] = [
  { id: 'uuid-1', first_name: 'Lorenzo', last_name: 'Mazzone', sport: 'Basket' },
  { id: 'uuid-2', first_name: 'Sofia', last_name: 'Mazzone', sport: 'Nuoto' }
];

const MOCK_LATEST_FORMS: Record<string, PsychForm> = {
  'uuid-1': {
    id: 'form-1',
    date: '2026-09-15',
    creativity_score: 8,
    teamwork_score: 5,
    stress_management_score: 6,
    ai_recommended_sport: `1.  SPORT CONSIGLIATO: Scherma
2.  OBIETTIVO MOTORIO: La crescita a 8 anni richiede un affinamento della coordinazione oculo-manuale. La scherma esalta i suoi eccellenti riflessi permettendogli di canalizzare lo stress individualmente, compensando le difficoltà nelle dinamiche di squadra.
3.  CONSIGLIO PER I GENITORI: Non forzatelo a fare il 'giocatore di squadra' in questa fase. La sua tranquillità emotiva nella pedana è una dote rara: valorizzatela.`,
    coach_notes: 'Riflessi eccellenti, ma patisce le dinamiche di squadra.',
    course_id: 'corso-basket-1'
  }
};

const MOCK_CLUBS: Club[] = [
  { 
    name: "Polisportiva Punta Etnea", 
    address: "Via Roma 45, San Giovanni La Punta", 
    distance: "0.8 km",
    courses: [
      { name: "Scuola Calcio Base", age_range: "6-12", sport: "Calcio" },
      { name: "Mini-Basket", age_range: "5-10", sport: "Basket" }
    ]
  },
  { 
    name: "Centro Nuoto & Scherma Jonica", 
    address: "Corso Italia 112, Acireale", 
    distance: "7.2 km",
    courses: [
      { name: "Nuoto Formativo", age_range: "4-14", sport: "Nuoto" },
      { name: "Scherma Agonistica", age_range: "8-16", sport: "Scherma" }
    ]
  },
];

const parseGeminiAnalysis = (text: string | undefined) => {
  if (!text) return { sportName: 'N/A', objective: null, tip: null };
  const sportMatch = text.match(/1\.\s*\s*SPORT CONSIGLIATO:\s*(.*?)(?=\n2\.|$)/s);
  const objectiveMatch = text.match(/2\.\s*\s*OBIETTIVO MOTORIO:\s*(.*?)(?=\n3\.|$)/s);
  const tipMatch = text.match(/3\.\s*\s*CONSIGLIO PER I GENITORI:\s*(.*?)(?=$)/s);

  return {
    sportName: sportMatch ? sportMatch[1].trim() : text.split('\n')[0].replace('1.  SPORT CONSIGLIATO: ', '').trim(),
    objective: objectiveMatch ? objectiveMatch[1].trim() : null,
    tip: tipMatch ? tipMatch[1].trim() : null,
  };
};

export default function ParentDashboard({ onLogout }: { onLogout: () => void }) {
  const [children] = useState<Child[]>(MOCK_CHILDREN);
  const [forms] = useState<Record<string, PsychForm>>(MOCK_LATEST_FORMS);
  
  const [activeModal, setActiveModal] = useState<'none' | 'referral' | 'profile' | 'analysis'>('none');
  const [selectedAnalysisChildId, setSelectedAnalysisChildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const myReferralCode = "ATH-A1B2C3"; 
  
  const selectedChild = selectedAnalysisChildId ? children.find(c => c.id === selectedAnalysisChildId) : null;
  const selectedForm = selectedAnalysisChildId ? forms[selectedAnalysisChildId] : null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://athlos.it/register?ref=${myReferralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fc] font-sans pb-32 relative overflow-x-hidden">
      
      {/* Sfondo Astratto */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-br from-[#081a36] via-[#0a254f] to-[#0066cc] rounded-b-[40px] z-0 overflow-hidden shadow-2xl">
        <div className="absolute top-20 -left-10 w-96 h-96 bg-[#0055aa] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-10 -right-10 w-96 h-96 bg-[#0088ff] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <header className="relative z-10 p-8 sm:px-12 flex justify-between items-center text-white">
        <button onClick={onLogout} className="text-left group cursor-pointer flex flex-col items-start hover:opacity-80 transition-opacity">
          <img src="/logo-light.png" alt="Athlos Logo" className="h-16 w-auto object-contain" />
          <p className="text-sky-200 font-medium text-sm group-hover:text-white transition-colors mt-2">Area Famiglia</p>
        </button>
        <div className="flex gap-4">
          <button onClick={() => setActiveModal('referral')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold transition-all text-sm">
             Invita un altro Genitore
          </button>
          <button onClick={() => setActiveModal('profile')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold transition-all text-sm">
             Profilo
          </button>
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md border border-rose-400/50 rounded-full font-bold transition-all text-sm text-white">
            Esci
          </button>
        </div>
      </header>

      {/* MODALI FRONT-END */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081a36]/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-[32px] p-8 w-full shadow-2xl relative my-8 ${activeModal === 'analysis' ? 'max-w-4xl' : 'max-w-lg'}`}
            >
              <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-slate-400 hover:text-[#081a36]">
                <X className="w-6 h-6" />
              </button>

              {activeModal === 'referral' && (
                <div className="text-center pt-4">
                  <div className="text-6xl mb-4"></div>
                  <h3 className="text-3xl font-black text-[#081a36] mb-2">Invita un Genitore</h3>
                  <p className="text-slate-500 font-medium mb-8">Condividi questo link con i tuoi amici. Quando iscriveranno i loro figli, riceverete entrambi un mese gratuito su Athlos!</p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between mb-4">
                    <span className="font-mono font-bold text-[#0066cc] truncate">athlos.it/register?ref={myReferralCode}</span>
                    <button onClick={copyToClipboard} className="ml-4 p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-sky-50 text-[#081a36]">
                      {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="pt-2">
                  <h3 className="text-2xl font-black text-[#081a36] mb-6">Modifica Profilo</h3>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setActiveModal('none'); }}>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nome</label>
                        <div className="relative">
                          <UserIcon className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input type="text" defaultValue="Marco" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Cognome</label>
                        <input type="text" defaultValue="Mazzone" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Telefono</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input type="tel" defaultValue="+39 333 1234567" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Indirizzo Completo</label>
                      <div className="relative">
                        <MapPinIcon className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input type="text" defaultValue="Via Roma 1, Catania" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Info Mediche / Extra (Opzionale)</label>
                      <div className="relative">
                        <Info className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <textarea rows={2} defaultValue="" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0066cc] font-medium text-[#081a36]" />
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 mt-4 bg-[#0066cc] hover:bg-[#081a36] transition-colors text-white rounded-xl font-bold text-lg">
                      Salva Modifiche
                    </button>
                  </form>
                </div>
              )}

              {activeModal === 'analysis' && selectedChild && selectedForm && (() => {
                const aiData = parseGeminiAnalysis(selectedForm.ai_recommended_sport);
                return (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* COLONNA SINISTRA */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-6">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#081a36] to-[#0066cc] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                            {selectedChild.first_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-[#081a36]">{selectedChild.first_name} {selectedChild.last_name}</h3>
                            <p className="text-sky-600 font-bold text-sm tracking-wide uppercase">Analisi Dettagliata</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Punteggi Trimestre</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Creatività</div>
                              <div className="text-3xl font-black text-[#081a36]">{selectedForm.creativity_score}</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Gruppo</div>
                              <div className="text-3xl font-black text-[#081a36]">{selectedForm.teamwork_score}</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Stress</div>
                              <div className="text-3xl font-black text-[#081a36]">{selectedForm.stress_management_score}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Note del Tecnico</h4>
                          <div className="bg-[#081a36] rounded-xl p-5 text-white shadow-inner relative overflow-hidden">
                            <p className="text-lg text-slate-200 font-medium italic relative z-10">
                              "{selectedForm.coach_notes}"
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Questo referto è generato dall'Intelligenza Artificiale incrociando l'osservazione sul campo del tecnico con i test motori.
                          </p>
                        </div>
                      </div>

                      {/* COLONNA DESTRA */}
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sport Ideale Identificato</h4>
                          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 flex items-center justify-between">
                            <span className="text-2xl font-black text-[#0066cc]">{aiData.sportName}</span>
                            <Brain className="w-8 h-8 text-sky-300" />
                          </div>
                        </div>

                        {aiData.objective && (
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Obiettivo di Crescita e Motorio</h4>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                              <p className="text-slate-600 font-medium leading-relaxed">{aiData.objective}</p>
                            </div>
                          </div>
                        )}

                        {aiData.tip && (
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Consiglio Pratico</h4>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                              <p className="text-amber-800 font-medium leading-relaxed">{aiData.tip}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 px-8 sm:px-12 mt-10 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">I Tuoi Campioni</h2>
          <p className="text-sky-100 text-lg font-medium">Monitora i progressi e scopri il potenziale nascosto.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {children.map((child, idx) => {
            const form = forms[child.id];

            return (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 102, 204, 0.2)" }}
                transition={{ delay: idx * 0.15, duration: 0.4, ease: "easeOut" }}
                key={child.id} 
                className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#0066cc]/10 border border-sky-50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute top-6 right-6 text-5xl opacity-20">
                  {child.sport === 'Basket' || child.sport === 'Mini-Basket' ? '' : 
                   child.sport === 'Calcio' || child.sport === 'Scuola Calcio' ? '' :
                   child.sport === 'Nuoto' ? '' : 
                   child.sport === 'Tennis' ? '' :
                   child.sport === 'Scherma' ? '' :
                   child.sport === 'Ginnastica' ? '' :
                   child.sport === 'Arti Marziali' || child.sport === 'Judo' ? '' : ''}
                </div>

                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#081a36] to-[#0066cc] text-white flex items-center justify-center font-black text-2xl shadow-lg">
                    {child.first_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#081a36]">{child.first_name} {child.last_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-sky-100 text-[#0066cc] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {child.sport}
                      </span>
                      <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Non iscritto
                      </span>
                    </div>
                  </div>
                </div>

                {form ? (
                  <div className="bg-gradient-to-br from-[#081a36] to-[#0a254f] rounded-2xl p-6 text-white shadow-inner relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Brain className="w-32 h-32" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <p className="text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">Ultimo Passaporto AI</p>
                        <h4 className="text-xl font-black">Sport Consigliato: <span className="text-[#00ccff]">{parseGeminiAnalysis(form.ai_recommended_sport).sportName}</span></h4>
                      </div>
                      <span className="text-sky-200/50 text-sm font-medium">{form.date}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-1">Creatività</div>
                        <div className="text-2xl font-black">{form.creativity_score}<span className="text-sm text-sky-200/50 font-medium">/10</span></div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-1">Gruppo</div>
                        <div className="text-2xl font-black">{form.teamwork_score}<span className="text-sm text-sky-200/50 font-medium">/10</span></div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-1">Stress</div>
                        <div className="text-2xl font-black">{form.stress_management_score}<span className="text-sm text-sky-200/50 font-medium">/10</span></div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedAnalysisChildId(child.id); setActiveModal('analysis'); }}
                      className="w-full py-3 bg-white hover:bg-sky-50 text-[#081a36] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 relative z-10"
                    >
                      Leggi Analisi Completa <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                    <Shield className="w-10 h-10 text-slate-300 mb-3" />
                    <h4 className="text-slate-600 font-bold mb-1">Nessuna valutazione</h4>
                    <p className="text-slate-400 text-sm font-medium">Il club non ha ancora inviato il passaporto trimestrale.</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* SEZIONE: ESPLORA E ISCRIVI (CLUB LIMITROFI) */}
        <section className="mt-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black text-[#081a36] tracking-tight">Club Vicino a Te</h2>
              <p className="text-slate-500 font-medium mt-1">Scopri dove iscrivere i tuoi figli per esplorare nuovi sport.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CLUBS.map((club, i) => (
              <div key={i} className="bg-white rounded-[24px] border border-slate-200 p-6 hover:shadow-xl hover:shadow-[#0066cc]/10 transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {i === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-[#0066cc] bg-sky-100 px-3 py-1 rounded-full mb-3 inline-block"> PIÙ VICINO (1° SCELTA)</span>}
                    <h3 className="text-xl font-bold text-[#081a36] leading-tight">{club.name}</h3>
                  </div>
                  <span className="bg-slate-100 text-[#081a36] font-black text-sm px-3 py-1 rounded-full whitespace-nowrap">{club.distance}</span>
                </div>
                
                <p className="text-slate-500 text-sm flex items-center gap-2 mb-6">
                  <MapPin className="w-4 h-4 text-slate-400" /> {club.address}
                </p>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Corsi Disponibili</h4>
                  <div className="space-y-3">
                    {club.courses.map((course, cIdx) => (
                      <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center hover:border-[#0066cc] transition-colors">
                        <div>
                          <p className="font-bold text-[#081a36] text-sm">{course.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Età: {course.age_range} anni</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
