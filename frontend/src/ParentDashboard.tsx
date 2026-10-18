import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  MapPin,
  Shield,
  ChevronRight,
  X,
  Copy,
  CheckCircle2,
  User as UserIcon,
  Phone,
  Info,
  Plus
} from 'lucide-react';
import {
  getToken,
  getMyParentProfile,
  updateMyParentProfile,
  getMyReferral,
  getMyNearbyClubs,
  getCatalogCourses,
  getMyChildren,
  createChild,
  getChildEvaluations,
  getChildPhysicalTests,
  type ApiAddress,
  type ApiPhysicalTestResponse
} from './api';

// === INTERFACCE ===
interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  sport: string;
  fiscal_code?: string;
  skills?: string[];
}

interface ParentProfileState {
  first_name: string;
  last_name: string;
  phone: string;
  fiscal_code: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  extra_notes: string;
}

interface PsychForm {
  id: string;
  date: string;
  creativity_score: number;
  teamwork_score: number;
  stress_management_score: number;
  leadership_score?: number;
  game_reading_score?: number;
  motivation_score?: number;
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

const parseGeminiAnalysis = (text: string | undefined) => {
  if (!text) return { sportName: 'N/A', objective: null, tip: null };
  const sportMatch = text.match(/1\.\s*(?:🏅\s*)?SPORT CONSIGLIATO:\s*(.*?)(?=\n2\.|$)/s);
  const objectiveMatch = text.match(/2\.\s*(?:🎯\s*)?OBIETTIVO MOTORIO:\s*(.*?)(?=\n3\.|$)/s);
  const tipMatch = text.match(/3\.\s*(?:💡\s*)?CONSIGLIO PER I GENITORI:\s*(.*?)(?=$)/s);

  return {
    sportName: sportMatch
      ? sportMatch[1].trim()
      : text.split('\n')[0].replace(/1\.\s*(?:🏅\s*)?SPORT CONSIGLIATO:\s*/, '').trim(),
    objective: objectiveMatch ? objectiveMatch[1].trim() : null,
    tip: tipMatch ? tipMatch[1].trim() : null
  };
};

export default function ParentDashboard({ onLogout }: { onLogout: () => void }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [forms, setForms] = useState<Record<string, PsychForm>>({});
  const [physicalTestsByChild, setPhysicalTestsByChild] = useState<
    Record<string, ApiPhysicalTestResponse[]>
  >({});
  const [nearbyClubs, setNearbyClubs] = useState<Club[]>([]);

  const [parentProfile, setParentProfile] = useState<ParentProfileState>({
    first_name: '',
    last_name: '',
    phone: '',
    fiscal_code: '',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    extra_notes: ''
  });

  const [activeModal, setActiveModal] = useState<
    'none' | 'referral' | 'profile' | 'analysis' | 'add-child'
  >('none');
  const [selectedAnalysisChildId, setSelectedAnalysisChildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [myReferralLink, setMyReferralLink] = useState('');

  // Stato nuovo figlio
  const [newChildFirstName, setNewChildFirstName] = useState('');
  const [newChildLastName, setNewChildLastName] = useState('');
  const [newChildDob, setNewChildDob] = useState('2018-05-10');
  const [newChildGender, setNewChildGender] = useState('M');
  const [newChildSport, setNewChildSport] = useState('Basket');
  const [newChildFiscalCode, setNewChildFiscalCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast di conferma con cleanup del timer
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  };

  // === CARICAMENTO DATI REALI DAL BACK-END FASTAPI ===
  useEffect(() => {
    if (!getToken()) return;

    // 1. Profilo Genitore
    getMyParentProfile()
      .then(profile => {
        setParentProfile({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone_number,
          fiscal_code: profile.fiscal_code,
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          province: profile.address?.province || '',
          postal_code: profile.address?.postal_code || '',
          extra_notes: profile.info || ''
        });
        setNewChildLastName(profile.last_name);
        if (profile.referral_code) {
          setMyReferralCode(profile.referral_code);
          setMyReferralLink(`https://athlos.it/register?ref=${profile.referral_code}`);
        }
      })
      .catch(() => {});

    // 2. Link Referral
    getMyReferral()
      .then(refData => {
        setMyReferralCode(refData.referral_code);
        setMyReferralLink(refData.link);
      })
      .catch(() => {});

    // 3. Figli + Valutazioni Trimestrali + Test Motori
    getMyChildren()
      .then(async apiChildren => {
        const mappedChildren: Child[] = apiChildren.map(c => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          date_of_birth: c.date_of_birth,
          gender: c.gender,
          sport: c.sport,
          fiscal_code: c.fiscal_code,
          skills: c.skills
        }));
        setChildren(mappedChildren);

        const loadedForms: Record<string, PsychForm> = {};
        const loadedTests: Record<string, ApiPhysicalTestResponse[]> = {};

        await Promise.all(
          mappedChildren.map(async child => {
            try {
              const evals = await getChildEvaluations(child.id);
              if (evals.length > 0) {
                const latest = evals[evals.length - 1];
                loadedForms[child.id] = {
                  id: latest.id,
                  date: latest.date ? latest.date.split('T')[0] : '',
                  creativity_score: latest.creativity_score,
                  teamwork_score: latest.teamwork_score,
                  stress_management_score: latest.stress_management_score,
                  ai_recommended_sport: latest.ai_recommended_sport || 'N/A',
                  coach_notes: latest.coach_notes || '',
                  course_id: latest.course_id
                };
              }
            } catch {
              // Nessuna scheda psicologica trovata
            }

            try {
              const pTests = await getChildPhysicalTests(child.id);
              loadedTests[child.id] = pTests;
            } catch {
              // Nessun test fisico trovato
            }
          })
        );

        setForms(loadedForms);
        setPhysicalTestsByChild(loadedTests);
      })
      .catch(() => {});

    // 4. Club Vicini e Corsi Disponibili
    Promise.all([getMyNearbyClubs(), getCatalogCourses()])
      .then(([clubsRes, coursesRes]) => {
        if (clubsRes.length > 0) {
          const mappedClubs: Club[] = clubsRes.map(cl => {
            const clubCourses = coursesRes.filter(cr => cr.clubs_id === cl.id);
            const minDistance = clubCourses.find(cr => cr.distance_km != null)?.distance_km;
            const addrParts = [cl.address?.street, cl.address?.city].filter(Boolean);
            return {
              name: cl.name,
              address: addrParts.join(', ') || 'Indirizzo del centro',
              distance: minDistance != null ? `${minDistance} km` : 'Vicino a te',
              courses: clubCourses.map(cr => ({
                name: cr.name,
                age_range: `${cr.min_age}-${cr.max_age}`,
                sport: cr.name
              }))
            };
          });
          setNearbyClubs(mappedClubs);
        }
      })
      .catch(() => {});
  }, []);

  const selectedChild = selectedAnalysisChildId
    ? children.find(c => c.id === selectedAnalysisChildId)
    : null;
  const selectedForm = selectedAnalysisChildId ? forms[selectedAnalysisChildId] : null;
  const selectedPhysicalTests = selectedAnalysisChildId
    ? physicalTestsByChild[selectedAnalysisChildId] || []
    : [];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myReferralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildFirstName.trim() || !newChildLastName.trim()) return;

    const cleanFiscalCode =
      newChildFiscalCode.trim().toUpperCase().padEnd(16, 'X').slice(0, 16);

    setIsSaving(true);
    try {
      if (getToken()) {
        const createdApi = await createChild({
          first_name: newChildFirstName.trim(),
          last_name: newChildLastName.trim(),
          date_of_birth: newChildDob,
          gender: newChildGender,
          sport: newChildSport,
          skills: [],
          fiscal_code: cleanFiscalCode
        });
        setChildren(prev => [
          ...prev,
          {
            id: createdApi.id,
            first_name: createdApi.first_name,
            last_name: createdApi.last_name,
            date_of_birth: createdApi.date_of_birth,
            gender: createdApi.gender,
            sport: createdApi.sport,
            fiscal_code: createdApi.fiscal_code
          }
        ]);
      } else {
        const createdLocal: Child = {
          id: `child-${crypto.randomUUID()}`,
          first_name: newChildFirstName.trim(),
          last_name: newChildLastName.trim(),
          date_of_birth: newChildDob,
          gender: newChildGender,
          sport: newChildSport,
          fiscal_code: cleanFiscalCode
        };
        setChildren(prev => [...prev, createdLocal]);
      }
      setNewChildFirstName('');
      setNewChildFiscalCode('');
      setActiveModal('none');
      showToast(`${newChildFirstName.trim()} aggiunto con successo!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'aggiunta del figlio";
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveParentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (getToken()) {
        const addressObj: ApiAddress | null =
          parentProfile.street.trim() &&
          parentProfile.city.trim() &&
          parentProfile.province.trim().length >= 2 &&
          /^\d{5}$/.test(parentProfile.postal_code.trim())
            ? {
                street: parentProfile.street.trim(),
                city: parentProfile.city.trim(),
                province: parentProfile.province.trim().toUpperCase(),
                postal_code: parentProfile.postal_code.trim(),
                country: 'Italy'
              }
            : null;

        await updateMyParentProfile({
          first_name: parentProfile.first_name.trim(),
          last_name: parentProfile.last_name.trim(),
          phone_number: parentProfile.phone.trim(),
          info: parentProfile.extra_notes.trim() || null,
          ...(addressObj ? { address: addressObj } : {})
        });
      }
      setActiveModal('none');
      showToast('Profilo aggiornato con successo!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio profilo';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fc] font-sans pb-32 relative overflow-x-hidden">
      {/* Notifica di conferma */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E2046] text-white px-6 py-3.5 rounded-full shadow-2xl border border-white/15 flex items-center gap-3 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sfondo Astratto */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-br from-[#1E2046] via-[#0a254f] to-[#E52B6D] rounded-b-[40px] z-0 overflow-hidden shadow-2xl pointer-events-none">
        <div className="absolute top-20 -left-10 w-96 h-96 bg-[#0055aa] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-10 -right-10 w-96 h-96 bg-[#0088ff] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>

      <header className="relative z-10 p-8 sm:px-12 flex flex-wrap justify-between items-center gap-4 text-white">
        <button
          onClick={onLogout}
          className="text-left group cursor-pointer flex flex-col items-start hover:opacity-80 transition-opacity"
        >
          <img src="/logo-light.png" alt="Athlos Logo" className="h-16 w-auto object-contain" />
          <p className="text-sky-200 font-medium text-sm group-hover:text-white transition-colors mt-2">
            Area Famiglia • {parentProfile.first_name ? `${parentProfile.first_name} ${parentProfile.last_name}` : 'Genitore'}
          </p>
        </button>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <button
            onClick={() => setActiveModal('add-child')}
            className="px-5 py-2.5 bg-[#E52B6D] hover:bg-[#FF4F8B] backdrop-blur-md border border-pink-400/40 rounded-full font-bold transition-colors text-sm flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Aggiungi Figlio
          </button>
          <button
            onClick={() => setActiveModal('referral')}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold transition-colors text-sm cursor-pointer"
          >
            Invita un altro Genitore
          </button>
          <button
            onClick={() => setActiveModal('profile')}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold transition-colors text-sm cursor-pointer"
          >
            Profilo
          </button>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md border border-rose-400/50 rounded-full font-bold transition-colors text-sm text-white cursor-pointer"
          >
            Esci
          </button>
        </div>
      </header>

      {/* MODALI FRONT-END */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2046]/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`bg-white rounded-[32px] p-8 w-full shadow-2xl relative my-8 transform-gpu ${
                activeModal === 'analysis' ? 'max-w-4xl' : 'max-w-lg'
              }`}
            >
              <button
                onClick={() => setActiveModal('none')}
                className="absolute top-6 right-6 text-slate-400 hover:text-[#1E2046] transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {activeModal === 'referral' && (
                <div className="text-center pt-4">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-3xl font-black text-[#1E2046] mb-2">Invita un Genitore</h3>
                  <p className="text-slate-500 font-medium mb-8">
                    Condividi questo link con i tuoi amici. Quando iscriveranno i loro figli,
                    riceverete entrambi un mese gratuito su Athlos!
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between mb-4">
                    <span className="font-mono font-bold text-[#E52B6D] truncate">
                      athlos.it/register?ref={myReferralCode}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="ml-4 p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-sky-50 text-[#1E2046] transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'add-child' && (
                <div className="pt-2">
                  <h3 className="text-2xl font-black text-[#1E2046] mb-1">Aggiungi un Figlio</h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">
                    Inserisci i dati del tuo piccolo atleta per monitorarne il percorso.
                  </p>
                  <form className="space-y-4" onSubmit={handleAddChild}>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Nome
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Es. Gabriele"
                          value={newChildFirstName}
                          onChange={e => setNewChildFirstName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Cognome
                        </label>
                        <input
                          type="text"
                          required
                          value={newChildLastName}
                          onChange={e => setNewChildLastName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Data di Nascita
                        </label>
                        <input
                          type="date"
                          required
                          value={newChildDob}
                          onChange={e => setNewChildDob(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Genere
                        </label>
                        <select
                          value={newChildGender}
                          onChange={e => setNewChildGender(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-bold text-[#1E2046]"
                        >
                          <option value="M">Maschio (M)</option>
                          <option value="F">Femmina (F)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Codice Fiscale (16 caratteri)
                        </label>
                        <input
                          type="text"
                          required
                          minLength={16}
                          maxLength={16}
                          placeholder="RSSMRA18A01C351X"
                          value={newChildFiscalCode}
                          onChange={e => setNewChildFiscalCode(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046] uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Sport Attuale
                        </label>
                        <select
                          value={newChildSport}
                          onChange={e => setNewChildSport(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-bold text-[#1E2046]"
                        >
                          <option value="Basket">🏀 Basket</option>
                          <option value="Pallavolo">🏐 Pallavolo</option>
                          <option value="Calcio">⚽ Calcio</option>
                          <option value="Nuoto">🏊 Nuoto</option>
                          <option value="Scherma">🤺 Scherma</option>
                          <option value="Ginnastica">🤸 Ginnastica</option>
                          <option value="Judo">🥋 Judo</option>
                          <option value="Tennis">🎾 Tennis</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 mt-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer"
                    >
                      {isSaving ? 'Salvataggio...' : 'Aggiungi Figlio'}
                    </button>
                  </form>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="pt-2">
                  <h3 className="text-2xl font-black text-[#1E2046] mb-6">Modifica Profilo</h3>
                  <form className="space-y-4" onSubmit={handleSaveParentProfile}>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Nome
                        </label>
                        <div className="relative">
                          <UserIcon className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={parentProfile.first_name}
                            onChange={e =>
                              setParentProfile({ ...parentProfile, first_name: e.target.value })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Cognome
                        </label>
                        <input
                          type="text"
                          required
                          value={parentProfile.last_name}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, last_name: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Telefono
                      </label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={parentProfile.phone}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, phone: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Via e Numero
                        </label>
                        <div className="relative">
                          <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={parentProfile.street}
                            onChange={e =>
                              setParentProfile({ ...parentProfile, street: e.target.value })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          CAP
                        </label>
                        <input
                          type="text"
                          pattern="\d{5}"
                          required
                          value={parentProfile.postal_code}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, postal_code: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Città
                        </label>
                        <input
                          type="text"
                          required
                          value={parentProfile.city}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, city: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Provincia
                        </label>
                        <input
                          type="text"
                          minLength={2}
                          required
                          value={parentProfile.province}
                          onChange={e =>
                            setParentProfile({
                              ...parentProfile,
                              province: e.target.value.toUpperCase()
                            })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046] uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Info Mediche / Extra (Opzionale)
                      </label>
                      <div className="relative">
                        <Info className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <textarea
                          rows={2}
                          value={parentProfile.extra_notes}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, extra_notes: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 mt-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer"
                    >
                      {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                  </form>
                </div>
              )}

              {activeModal === 'analysis' &&
                selectedChild &&
                selectedForm &&
                (() => {
                  const aiData = parseGeminiAnalysis(selectedForm.ai_recommended_sport);
                  return (
                    <div className="pt-2">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* COLONNA SINISTRA */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                              {selectedChild.first_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-3xl font-black text-[#1E2046]">
                                {selectedChild.first_name} {selectedChild.last_name}
                              </h3>
                              <p className="text-sky-600 font-bold text-sm tracking-wide uppercase">
                                Analisi Dettagliata
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                              Punteggi Trimestre
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Creatività
                                </div>
                                <div className="text-2xl font-black text-[#E52B6D]">
                                  {selectedForm.creativity_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Squadra
                                </div>
                                <div className="text-2xl font-black text-sky-600">
                                  {selectedForm.teamwork_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Stress
                                </div>
                                <div className="text-2xl font-black text-amber-500">
                                  {selectedForm.stress_management_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Leadership
                                </div>
                                <div className="text-2xl font-black text-purple-600">
                                  {selectedForm.leadership_score ?? 7}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Tattica
                                </div>
                                <div className="text-2xl font-black text-emerald-600">
                                  {selectedForm.game_reading_score ?? 7}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Grinta
                                </div>
                                <div className="text-2xl font-black text-rose-500">
                                  {selectedForm.motivation_score ?? 8}
                                </div>
                              </div>
                            </div>
                          </div>

                          {selectedPhysicalTests.length > 0 && (
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Test Motori Svolti ({selectedPhysicalTests.length})
                              </h4>
                              <div className="grid grid-cols-2 gap-2.5">
                                {selectedPhysicalTests.map((pt, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex justify-between items-center"
                                  >
                                    <span className="text-xs font-bold text-slate-500">
                                      {pt.test_type}
                                    </span>
                                    <span className="text-sm font-black text-[#1E2046]">
                                      {pt.score_value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                              Note del Tecnico
                            </h4>
                            <div className="bg-[#1E2046] rounded-xl p-5 text-white shadow-inner relative overflow-hidden">
                              <p className="text-lg text-slate-200 font-medium italic relative z-10">
                                "{selectedForm.coach_notes}"
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                              Questo referto è generato dall'Intelligenza Artificiale incrociando
                              l'osservazione sul campo del tecnico con i test motori.
                            </p>
                          </div>
                        </div>

                        {/* COLONNA DESTRA */}
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                              Sport Ideale Identificato
                            </h4>
                            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 flex items-center justify-between">
                              <span className="text-2xl font-black text-[#E52B6D]">
                                {aiData.sportName}
                              </span>
                              <Brain className="w-8 h-8 text-sky-300" />
                            </div>
                          </div>

                          {aiData.objective && (
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Obiettivo di Crescita e Motorio
                              </h4>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <p className="text-slate-600 font-medium leading-relaxed">
                                  {aiData.objective}
                                </p>
                              </div>
                            </div>
                          )}

                          {aiData.tip && (
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Consiglio Pratico
                              </h4>
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                                <p className="text-amber-800 font-medium leading-relaxed">
                                  {aiData.tip}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 px-8 sm:px-12 mt-10 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
            I Tuoi Campioni
          </h2>
          <p className="text-sky-100 text-lg font-medium">
            Monitora i progressi e scopri il potenziale nascosto.
          </p>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-sky-100 shadow-xl max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#E52B6D] flex items-center justify-center mx-auto mb-4 font-black text-2xl">
              🏃‍♂️
            </div>
            <h3 className="text-2xl font-black text-[#1E2046] mb-2">Nessun figlio registrato</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Non hai ancora aggiunto i tuoi figli. Clicca sul pulsante qui sotto per registrarli con il loro codice fiscale e iniziare a monitorare i loro progressi sportivi.
            </p>
            <button
              onClick={() => setActiveModal('add-child')}
              className="px-6 py-3 bg-[#E52B6D] hover:bg-[#FF4F8B] text-white rounded-full font-bold text-sm shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Aggiungi Figlio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {children.map((child, idx) => {
            const form = forms[child.id];

            return (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2, delay: 0 } }}
                transition={{ delay: idx * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                key={child.id}
                className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#E52B6D]/10 hover:shadow-2xl hover:shadow-[#E52B6D]/15 transition-shadow duration-300 border border-sky-50 relative overflow-hidden group transform-gpu"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full z-0 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute top-6 right-6 text-5xl opacity-15 select-none pointer-events-none z-0">
                  {child.sport === 'Basket' || child.sport === 'Mini-Basket'
                    ? '🏀'
                    : child.sport === 'Pallavolo'
                      ? '🏐'
                      : child.sport === 'Calcio' || child.sport === 'Scuola Calcio'
                        ? '⚽'
                        : child.sport === 'Nuoto'
                          ? '🏊'
                          : child.sport === 'Tennis'
                            ? '🎾'
                            : child.sport === 'Scherma'
                              ? '🤺'
                              : child.sport === 'Ginnastica'
                                ? '🤸'
                                : child.sport === 'Arti Marziali' || child.sport === 'Judo'
                                  ? '🥋'
                                  : '🏅'}
                </div>

                <div className="flex items-center gap-5 mb-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg">
                    {child.first_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1E2046]">
                      {child.first_name} {child.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-sky-100 text-[#E52B6D] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {child.sport}
                      </span>
                      <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Iscritto tramite Athlos
                      </span>
                    </div>
                  </div>
                </div>

                {form ? (
                  <div className="bg-gradient-to-br from-[#1E2046] to-[#0a254f] rounded-2xl p-6 text-white shadow-inner relative overflow-hidden z-10">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Brain className="w-32 h-32" />
                    </div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <p className="text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
                          Ultimo Passaporto AI
                        </p>
                        <h4 className="text-xl font-black">
                          Sport Consigliato:{' '}
                          <span className="text-[#00ccff]">
                            {parseGeminiAnalysis(form.ai_recommended_sport).sportName}
                          </span>
                        </h4>
                      </div>
                      <span className="text-sky-200/50 text-sm font-medium">{form.date}</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-6 relative z-10">
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Creatività
                        </div>
                        <div className="text-xl font-black">
                          {form.creativity_score}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Squadra
                        </div>
                        <div className="text-xl font-black">
                          {form.teamwork_score}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Stress
                        </div>
                        <div className="text-xl font-black">
                          {form.stress_management_score}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Leadership
                        </div>
                        <div className="text-xl font-black">
                          {form.leadership_score ?? 7}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Tattica
                        </div>
                        <div className="text-xl font-black">
                          {form.game_reading_score ?? 7}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5 text-center">
                        <div className="text-sky-300 text-[9px] font-bold uppercase tracking-widest mb-1 truncate">
                          Grinta
                        </div>
                        <div className="text-xl font-black">
                          {form.motivation_score ?? 8}
                          <span className="text-xs text-sky-200/50 font-medium">/10</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAnalysisChildId(child.id);
                        setActiveModal('analysis');
                      }}
                      className="w-full py-3 bg-white hover:bg-sky-50 text-[#1E2046] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 relative z-10 cursor-pointer"
                    >
                      Leggi Analisi Completa <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center relative z-10">
                    <Shield className="w-10 h-10 text-slate-300 mb-3" />
                    <h4 className="text-slate-600 font-bold mb-1">Nessuna valutazione</h4>
                    <p className="text-slate-400 text-sm font-medium">
                      Il club non ha ancora inviato il passaporto trimestrale.
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SEZIONE: ESPLORA E ISCRIVI (CLUB LIMITROFI) */}
      <section className="mt-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#1E2046] tracking-tight">Club Vicino a Te</h2>
            <p className="text-slate-500 font-medium mt-1">
              Scopri dove iscrivere i tuoi figli per esplorare nuovi sport.
            </p>
          </div>
        </div>

        {nearbyClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyClubs.map((club, i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] border border-slate-200 p-6 hover:shadow-xl hover:shadow-[#E52B6D]/10 transition-shadow duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {i === 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E52B6D] bg-sky-100 px-3 py-1 rounded-full mb-3 inline-block">
                        PIÙ VICINO (1° SCELTA)
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-[#1E2046] leading-tight">{club.name}</h3>
                  </div>
                  <span className="bg-slate-100 text-[#1E2046] font-black text-sm px-3 py-1 rounded-full whitespace-nowrap">
                    {club.distance}
                  </span>
                </div>

                <p className="text-slate-500 text-sm flex items-center gap-2 mb-6">
                  <MapPin className="w-4 h-4 text-slate-400" /> {club.address}
                </p>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Corsi Disponibili
                  </h4>
                  <div className="space-y-3">
                    {club.courses.map((course, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center hover:border-[#E52B6D] transition-colors"
                      >
                        <div>
                          <p className="font-bold text-[#1E2046] text-sm">{course.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Età: {course.age_range} anni
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-[#1E2046]">Nessun centro sportivo convenzionato nelle vicinanze al momento.</p>
            <p className="text-xs text-slate-400 mt-1">I nuovi club registrati su Athlos compariranno qui automaticamente.</p>
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
