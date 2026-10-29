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
  Plus,
  Trash2,
  CreditCard,
  FileText,
  AlertTriangle,
  Loader2,
  Printer,
  Download,
  AlertCircle,
  Clock,
  Receipt,
  Users
} from 'lucide-react';
import {
  getToken,
  getMyParentProfile,
  updateMyParentProfile,
  updateChild,
  getMyReferral,
  getMyNearbyClubs,
  getCatalogCourses,
  getMyChildren,
  createChild,
  deleteChild,
  getChildEvaluations,
  getChildPhysicalTests,
  autocompleteGeo,
  createCourseCheckoutSession,
  verifyCheckoutSessionStatus,
  getMyParentPayments,
  getSavedCoursePricing,
  getSavedClubStripeStatus,
  getLocalPaymentsLedger,
  saveLocalPaymentRecord,
  updateLocalPaymentStatus,
  getLocalEnrollments,
  addLocalEnrollment,
  formatEuroFromCents,
  formatBillingPeriodLabel,
  formatPaymentStatusLabel,
  type ApiAddress,
  type ApiPhysicalTestResponse,
  type ApiGeoSearchResult,
  type ApiPaymentRecord,
  type LocalEnrollmentEntry
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
  id?: string;
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
  id: string;
  club_id: string;
  club_name: string;
  club_fiscal_code?: string;
  name: string;
  min_age: number;
  max_age: number;
  age_range: string;
  sport: string;
  price_cents: number;
  billing_period: 'trimestrale' | 'mensile' | 'annuale' | 'quota_unica';
  max_participants: number;
  enrolled_count: number;
  stripe_charges_enabled: boolean;
}

interface Club {
  id: string;
  name: string;
  address: string;
  distance: string;
  stripe_charges_enabled: boolean;
  fiscal_code_or_vat?: string;
  courses: Course[];
}

const DEMO_FALLBACK_CLUBS: Club[] = [
  {
    id: 'demo-club-1',
    name: 'Polisportiva Etna Sport A.S.D.',
    address: 'Via Etnea 240, Catania',
    distance: '2.4 km',
    stripe_charges_enabled: true,
    fiscal_code_or_vat: '93048210874',
    courses: [
      {
        id: 'demo-course-basket',
        club_id: 'demo-club-1',
        club_name: 'Polisportiva Etna Sport A.S.D.',
        club_fiscal_code: '93048210874',
        name: 'Mini-Basket Giovanile',
        min_age: 6,
        max_age: 11,
        age_range: '6-11',
        sport: 'Basket',
        price_cents: 15000,
        billing_period: 'trimestrale',
        max_participants: 20,
        enrolled_count: 14,
        stripe_charges_enabled: true
      },
      {
        id: 'demo-course-volley',
        club_id: 'demo-club-1',
        club_name: 'Polisportiva Etna Sport A.S.D.',
        club_fiscal_code: '93048210874',
        name: 'Pallavolo Avviamento',
        min_age: 7,
        max_age: 13,
        age_range: '7-13',
        sport: 'Pallavolo',
        price_cents: 13500,
        billing_period: 'trimestrale',
        max_participants: 18,
        enrolled_count: 11,
        stripe_charges_enabled: true
      }
    ]
  },
  {
    id: 'demo-club-2',
    name: 'Centro Nuoto & Scherma Trinacria S.S.D.',
    address: 'Viale Ruggero di Lauria 85, Catania',
    distance: '4.1 km',
    stripe_charges_enabled: true,
    fiscal_code_or_vat: '05482910872',
    courses: [
      {
        id: 'demo-course-nuoto',
        club_id: 'demo-club-2',
        club_name: 'Centro Nuoto & Scherma Trinacria S.S.D.',
        club_fiscal_code: '05482910872',
        name: 'Scuola Nuoto Ragazzi',
        min_age: 5,
        max_age: 12,
        age_range: '5-12',
        sport: 'Nuoto',
        price_cents: 18000,
        billing_period: 'trimestrale',
        max_participants: 16,
        enrolled_count: 12,
        stripe_charges_enabled: true
      },
      {
        id: 'demo-course-scherma',
        club_id: 'demo-club-2',
        club_name: 'Centro Nuoto & Scherma Trinacria S.S.D.',
        club_fiscal_code: '05482910872',
        name: 'Fioretto & Spada Giovani',
        min_age: 7,
        max_age: 13,
        age_range: '7-13',
        sport: 'Scherma',
        price_cents: 16500,
        billing_period: 'trimestrale',
        max_participants: 12,
        enrolled_count: 8,
        stripe_charges_enabled: true
      }
    ]
  }
];

const calculateAgeFromDob = (dob?: string): number => {
  if (!dob) return 8;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 8;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 3 && age <= 18 ? age : 8;
};

const parseGeminiAnalysis = (text: string | undefined) => {
  if (!text) return { sportName: 'N/A', objective: null, tip: null };
  const cleaned = text.trim().replace(/^["']|["']$/g, '');

  const cleanMd = (t: string | undefined | null) => {
    if (!t) return null;
    return t
      .replace(/#{1,6}\s*/g, '')
      .replace(/---/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\s*[0-9]\.\s*/gm, '')
      .trim();
  };

  const sportMatch = cleaned.match(/(?:SPORT CONSIGLIATO|Sport consigliato)[:\s*]+([^\n\r]+)/i);
  const overviewMatch = cleaned.match(
    /(?:PANORAMICA ABILIT[AÀ]|OBIETTIVO MOTORIO)[:\s*]+(.*?)(?=(?:CONSIGLIO PER (?:I GENITORI|LA FAMIGLIA)|### 3\.|$))/is
  );
  const tipMatch = cleaned.match(/(?:CONSIGLIO PER (?:I GENITORI|LA FAMIGLIA))[:\s*]+(.*)$/is);

  let rawSport = sportMatch ? sportMatch[1].split('*(')[0].split('---')[0] : cleaned.split('\n')[0];
  rawSport = cleanMd(rawSport) || 'Attività Consigliata';

  const overview = cleanMd(overviewMatch ? overviewMatch[1] : null);
  const tip = cleanMd(tipMatch ? tipMatch[1] : null);

  return {
    sportName: rawSport,
    objective: overview || (cleaned && !tip ? cleanMd(cleaned) : null),
    tip: tip
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
    id: '',
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
    | 'none'
    | 'referral'
    | 'profile'
    | 'analysis'
    | 'add-child'
    | 'enroll-course'
    | 'stripe-checkout'
    | 'payments-history'
    | 'receipt-preview'
  >('none');
  const [selectedAnalysisChildId, setSelectedAnalysisChildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [myReferralLink, setMyReferralLink] = useState('');

  // --- STATO ISCRIZIONE CORSO E PAGAMENTI STRIPE ---
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [selectedChildForEnrollId, setSelectedChildForEnrollId] = useState<string>('');
  const [enrollAcceptTerms, setEnrollAcceptTerms] = useState<boolean>(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<boolean>(false);
  const [activePendingPayment, setActivePendingPayment] = useState<ApiPaymentRecord | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'webhook-polling' | 'succeeded' | 'failed'>('form');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('424');
  const [parentPayments, setParentPayments] = useState<ApiPaymentRecord[]>(() =>
    getLocalPaymentsLedger()
  );
  const [localEnrollments, setLocalEnrollments] = useState<LocalEnrollmentEntry[]>(() =>
    getLocalEnrollments()
  );
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<ApiPaymentRecord | null>(
    null
  );

  // Stato nuovo figlio
  const [newChildFirstName, setNewChildFirstName] = useState('');
  const [newChildLastName, setNewChildLastName] = useState('');
  const [newChildDob, setNewChildDob] = useState('2018-05-10');
  const [newChildGender, setNewChildGender] = useState('M');
  const [newChildSport, setNewChildSport] = useState('Nessuno');
  const [newChildFiscalCode, setNewChildFiscalCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Autocomplete indirizzi OpenStreetMap per Profilo Genitore
  const [parentGeoResults, setParentGeoResults] = useState<ApiGeoSearchResult[]>([]);

  const handleParentGeoSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setParentGeoResults([]);
      return;
    }
    try {
      const results = await autocompleteGeo(query, 5, {
        city: parentProfile.city,
        postal_code: parentProfile.postal_code,
        province: parentProfile.province
      });
      if (results && results.length > 0) {
        setParentGeoResults(results);
        return;
      }
    } catch {
      // Fallback
    }
    setParentGeoResults([]);
  };

  const selectParentGeo = (geo: ApiGeoSearchResult) => {
    setParentProfile(prev => ({
      ...prev,
      street: geo.street || geo.display_name.split(',')[0]?.trim() || prev.street,
      city: geo.city || prev.city,
      province: geo.province ? geo.province.toUpperCase() : prev.province,
      postal_code: geo.postal_code && /^\d{5}$/.test(geo.postal_code) ? geo.postal_code : prev.postal_code
    }));
    setParentGeoResults([]);
  };

  const mapBackendClubsToUi = (clubsRes: any[], coursesRes: any[]): Club[] => {
    const currentLocalEnrollments = getLocalEnrollments();
    return clubsRes.map(cl => {
      const clubStripe = getSavedClubStripeStatus(cl.id);
      const chargesEnabled =
        cl.stripe_charges_enabled ??
        (clubStripe.onboarding_completed && clubStripe.charges_enabled);
      const clubCourses = coursesRes.filter(cr => cr.clubs_id === cl.id);
      const minDistance = clubCourses.find(cr => cr.distance_km != null)?.distance_km;
      const addrParts = [cl.address?.street, cl.address?.city].filter(Boolean);
      return {
        id: cl.id,
        name: cl.name,
        address: addrParts.join(', ') || 'Indirizzo del centro sportivo',
        distance: minDistance != null ? `${minDistance} km` : 'Vicino a te',
        stripe_charges_enabled: chargesEnabled,
        fiscal_code_or_vat: clubStripe.fiscal_code_or_vat || '93048210874',
        courses: clubCourses.map(cr => {
          const pricing = getSavedCoursePricing(cr.id);
          const extraEnrolled = currentLocalEnrollments.filter(e => e.course_id === cr.id).length;
          return {
            id: cr.id,
            club_id: cl.id,
            club_name: cl.name,
            club_fiscal_code: clubStripe.fiscal_code_or_vat || '93048210874',
            name: cr.name,
            min_age: cr.min_age,
            max_age: cr.max_age,
            age_range: `${cr.min_age}-${cr.max_age}`,
            sport: pricing.sport_category || cr.name,
            price_cents: cr.price_cents ?? pricing.price_cents,
            billing_period: cr.billing_period ?? pricing.billing_period,
            max_participants: cr.max_participants ?? pricing.max_participants,
            enrolled_count: (cr.enrolled_count ?? 4) + extraEnrolled,
            stripe_charges_enabled: chargesEnabled
          };
        })
      };
    });
  };

  const loadClubsAndCourses = async () => {
    let clubsRes: any[] = [];
    let coursesRes: any[] = [];
    try {
      clubsRes = await getMyNearbyClubs();
    } catch {
      // Nessun club limitrofo trovato o indirizzo non impostato
    }

    try {
      coursesRes = await getCatalogCourses();
    } catch {
      // Corsi generali non trovati
    }

    if (clubsRes.length > 0) {
      setNearbyClubs(mapBackendClubsToUi(clubsRes, coursesRes));
    } else {
      setNearbyClubs(DEMO_FALLBACK_CLUBS);
    }
  };

  // Toast di conferma con cleanup del timer
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3500);
  };

  // === CARICAMENTO DATI REALI DAL BACK-END FASTAPI ===
  useEffect(() => {
    // Gestione ritorno da Stripe Checkout reale (?payment=success&session_id=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const sessionId = params.get('session_id');
      if (paymentStatus === 'success') {
        if (sessionId) {
          verifyCheckoutSessionStatus(sessionId)
            .then(record => {
              saveLocalPaymentRecord(record);
              setParentPayments(getLocalPaymentsLedger());
              showToast('Pagamento confermato da Stripe! Tuo figlio è iscritto al corso.');
            })
            .catch(() => {
              showToast('Pagamento completato con successo! Iscrizione confermata.');
            });
        } else {
          showToast('Pagamento completato con successo! Iscrizione confermata.');
        }
        window.history.replaceState({}, '', window.location.pathname);
      } else if (paymentStatus === 'cancelled') {
        showToast('Pagamento annullato. Nessun addebito è stato effettuato.');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    if (!getToken()) {
      setNearbyClubs(DEMO_FALLBACK_CLUBS);
      return;
    }

    // 1. Profilo Genitore
    getMyParentProfile()
      .then(profile => {
        setParentProfile({
          id: profile.id,
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
        setCardHolderName(`${profile.first_name} ${profile.last_name}`);
        if (profile.referral_code) {
          setMyReferralCode(profile.referral_code);
          setMyReferralLink(`${window.location.origin}/?ref=${profile.referral_code}`);
        }
      })
      .catch(() => {});

    // 1b. Storico Pagamenti Genitore dal backend (con fallback locale)
    getMyParentPayments()
      .then(records => {
        if (records && records.length > 0) {
          setParentPayments(records);
        }
      })
      .catch(() => {
        setParentPayments(getLocalPaymentsLedger());
      });

    // 2. Link Referral
    getMyReferral()
      .then(refData => {
        setMyReferralCode(refData.referral_code);
        setMyReferralLink(`${window.location.origin}/?ref=${refData.referral_code}`);
      })
      .catch(() => {});

    // 3. Figli + Valutazioni Trimestrali + Test Motori
    getMyChildren()
      .then(async apiChildren => {
        const currentEnrollments = getLocalEnrollments();
        const mappedChildren: Child[] = apiChildren.map(c => {
          const latestEnrollment = currentEnrollments.find(e => e.child_id === c.id);
          return {
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            date_of_birth: c.date_of_birth,
            gender: c.gender,
            sport: latestEnrollment ? latestEnrollment.course_name : c.sport,
            fiscal_code: c.fiscal_code,
            skills: c.skills
          };
        });
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
                  leadership_score: latest.leadership_score,
                  game_reading_score: latest.game_reading_score,
                  motivation_score: latest.motivation_score,
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
    loadClubsAndCourses();
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

    const cleanFiscalCode = newChildFiscalCode.trim().toUpperCase();
    if (cleanFiscalCode.length !== 16) {
      showToast('Il Codice Fiscale deve essere composto esattamente da 16 caratteri.');
      return;
    }

    setIsSaving(true);
    try {
      let newChildId = '';
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
        newChildId = createdApi.id;
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
        const localId = `child-${crypto.randomUUID()}`;
        newChildId = localId;
        const createdLocal: Child = {
          id: localId,
          first_name: newChildFirstName.trim(),
          last_name: newChildLastName.trim(),
          date_of_birth: newChildDob,
          gender: newChildGender,
          sport: newChildSport,
          fiscal_code: cleanFiscalCode
        };
        setChildren(prev => [...prev, createdLocal]);
      }

      const childName = newChildFirstName.trim();
      setNewChildFirstName('');
      setNewChildFiscalCode('');

      if (selectedCourseForEnroll) {
        setSelectedChildForEnrollId(newChildId);
        setActiveModal('enroll-course');
        showToast(`${childName} registrato con successo! Procedi ora con l'iscrizione.`);
      } else {
        setActiveModal('none');
        showToast(`${childName} aggiunto con successo!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'aggiunta del figlio";
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare ${childName}? Questa operazione cancellerà il profilo del bambino e lo storico delle sue valutazioni.`
      )
    ) {
      return;
    }
    try {
      await deleteChild(childId);
      setChildren(prev => prev.filter(c => c.id !== childId));
      showToast(`${childName} rimosso con successo.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Errore durante l'eliminazione del figlio");
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
      loadClubsAndCourses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio profilo';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // === HANDLERS ISCRIZIONE CORSO E CHECKOUT STRIPE ===

  const isChildAlreadyEnrolledInCourse = (courseId: string, childId: string): boolean => {
    return localEnrollments.some(e => e.course_id === courseId && e.child_id === childId);
  };

  const openEnrollCourseModal = (course: Course) => {
    setSelectedCourseForEnroll(course);

    if (children.length === 0) {
      showToast('Aggiungi prima tuo figlio per poterlo iscrivere a questo corso.');
      setActiveModal('add-child');
      return;
    }

    setEnrollAcceptTerms(true);

    // Pre-seleziona il primo figlio compatibile per età e non ancora iscritto
    const compatibleChild = children.find(ch => {
      const age = calculateAgeFromDob(ch.date_of_birth);
      const already = isChildAlreadyEnrolledInCourse(course.id, ch.id);
      return !already && age >= course.min_age && age <= course.max_age;
    });

    setSelectedChildForEnrollId(compatibleChild ? compatibleChild.id : children[0].id);
    setActiveModal('enroll-course');
  };

  const handleProceedToStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnroll || !selectedChildForEnrollId) return;

    const targetChild = children.find(c => c.id === selectedChildForEnrollId);
    if (!targetChild) return;

    const childAge = calculateAgeFromDob(targetChild.date_of_birth);
    if (
      childAge < selectedCourseForEnroll.min_age ||
      childAge > selectedCourseForEnroll.max_age
    ) {
      showToast(
        `L'età di ${targetChild.first_name} (${childAge} anni) non rientra nella fascia ${selectedCourseForEnroll.min_age}-${selectedCourseForEnroll.max_age} anni del corso.`
      );
      return;
    }

    if (isChildAlreadyEnrolledInCourse(selectedCourseForEnroll.id, targetChild.id)) {
      showToast(`${targetChild.first_name} risulta già iscritto a questo corso.`);
      return;
    }

    setIsCreatingCheckout(true);

    // 1. Creiamo il record Payment in stato PENDING (con blocco temporaneo del posto per 15 min)
    const sessionRand = Math.random().toString(36).slice(2, 12);
    const pendingPayment: ApiPaymentRecord = {
      id: `pay_${crypto.randomUUID()}`,
      parent_id: parentProfile.id || 'parent-local',
      parent_name:
        parentProfile.first_name && parentProfile.last_name
          ? `${parentProfile.first_name} ${parentProfile.last_name}`
          : 'Genitore Athlos',
      parent_fiscal_code: parentProfile.fiscal_code || 'MZZMRC85A01C351X',
      child_id: targetChild.id,
      child_name: `${targetChild.first_name} ${targetChild.last_name}`,
      child_fiscal_code: targetChild.fiscal_code || 'MZZGBR18E10C351K',
      course_id: selectedCourseForEnroll.id,
      course_name: selectedCourseForEnroll.name,
      club_id: selectedCourseForEnroll.club_id,
      club_name: selectedCourseForEnroll.club_name,
      club_fiscal_code: selectedCourseForEnroll.club_fiscal_code || '93048210874',
      amount_cents: selectedCourseForEnroll.price_cents,
      currency: 'eur',
      billing_period: selectedCourseForEnroll.billing_period,
      status: 'PENDING',
      stripe_checkout_session_id: `cs_test_${sessionRand}`,
      stripe_payment_intent_id: `pi_3Athlos${sessionRand}`,
      receipt_number: `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString()
    };

    try {
      // Prova a chiamare l'endpoint reale del Backend FastAPI (quando lo implementeremo)
      const apiSession = await createCourseCheckoutSession({
        course_id: selectedCourseForEnroll.id,
        child_id: targetChild.id
      });
      if (apiSession.checkout_url) {
        saveLocalPaymentRecord(pendingPayment);
        window.location.href = apiSession.checkout_url;
        return;
      }
    } catch {
      // Il backend /payments/checkout-session non è ancora attivo: apriamo l'esperienza Hosted Stripe Checkout integrata
    } finally {
      setIsCreatingCheckout(false);
    }

    saveLocalPaymentRecord(pendingPayment);
    setParentPayments(getLocalPaymentsLedger());
    setActivePendingPayment(pendingPayment);
    setCardHolderName(
      parentProfile.first_name
        ? `${parentProfile.first_name} ${parentProfile.last_name}`
        : 'Marco Mazzone'
    );
    setCheckoutStep('form');
    setActiveModal('stripe-checkout');
  };

  const handleSimulateStripeWebhookCompletion = async (
    outcome: 'SUCCEEDED' | 'FAILED'
  ) => {
    if (!activePendingPayment || !selectedCourseForEnroll) return;

    if (outcome === 'FAILED') {
      updateLocalPaymentStatus(activePendingPayment.id, 'FAILED');
      setParentPayments(getLocalPaymentsLedger());
      setCheckoutStep('failed');
      showToast('Pagamento rifiutato dalla banca: nessun addebito effettuato.');
      return;
    }

    // 1. Mostra lo stato di attesa conferma Webhook server-to-server (idempotente)
    setCheckoutStep('webhook-polling');

    window.setTimeout(async () => {
      // 2. Aggiorna lo stato del pagamento a SUCCEEDED
      const updated = updateLocalPaymentStatus(activePendingPayment.id, 'SUCCEEDED');
      const targetChild = children.find(c => c.id === activePendingPayment.child_id);

      if (targetChild) {
        // 3. Registra l'iscrizione atomica in CourseEnrollment
        const enrollmentEntry: LocalEnrollmentEntry = {
          course_id: selectedCourseForEnroll.id,
          course_name: selectedCourseForEnroll.name,
          club_id: selectedCourseForEnroll.club_id,
          club_name: selectedCourseForEnroll.club_name,
          child_id: targetChild.id,
          child_first_name: targetChild.first_name,
          child_last_name: targetChild.last_name,
          child_date_of_birth: targetChild.date_of_birth || '2018-05-10',
          child_gender: targetChild.gender || 'M',
          child_fiscal_code: targetChild.fiscal_code || 'MZZGBR18E10C351K',
          payment_id: activePendingPayment.id,
          enrolled_at: new Date().toISOString()
        };
        addLocalEnrollment(enrollmentEntry);
        setLocalEnrollments(getLocalEnrollments());

        // 4. Aggiorna lo sport del figlio su stato React e (se loggato) su Backend
        setChildren(prev =>
          prev.map(ch =>
            ch.id === targetChild.id
              ? { ...ch, sport: selectedCourseForEnroll.name }
              : ch
          )
        );
        if (getToken()) {
          updateChild(targetChild.id, { sport: selectedCourseForEnroll.name }).catch(() => {});
        }
      }

      // 5. Incrementa il contatore iscritti del corso nella UI
      setNearbyClubs(prev =>
        prev.map(cl => ({
          ...cl,
          courses: cl.courses.map(cr =>
            cr.id === selectedCourseForEnroll.id
              ? { ...cr, enrolled_count: cr.enrolled_count + 1 }
              : cr
          )
        }))
      );

      if (updated) {
        setActivePendingPayment(updated);
      }
      setParentPayments(getLocalPaymentsLedger());
      setCheckoutStep('succeeded');
      showToast(
        `Iscrizione confermata! ${activePendingPayment.child_name} è ora iscritto a ${selectedCourseForEnroll.name}.`
      );
    }, 1600);
  };

  const handleCancelStripeCheckout = () => {
    if (activePendingPayment && checkoutStep === 'form') {
      updateLocalPaymentStatus(activePendingPayment.id, 'EXPIRED');
      setParentPayments(getLocalPaymentsLedger());
      showToast('Sessione di checkout annullata. Il posto bloccato è stato liberato.');
    }
    setActiveModal('none');
  };

  const handleDownloadReceiptHtml = (payment: ApiPaymentRecord) => {
    const el = document.getElementById('printable-receipt');
    if (!el) return;
    const safeReceiptNo = (payment.receipt_number || '2026_01').replace('/', '_');
    const safeChildName = (payment.child_name || 'Atleta').replace(/\s+/g, '_');
    const printDoc = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Ricevuta_Pagamento_${safeReceiptNo}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }
    .receipt-container { max-width: 820px; margin: 0 auto; border: 2px solid #cbd5e1; border-radius: 16px; padding: 36px; box-sizing: border-box; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
    th { text-align: left; background: #f8fafc; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 2px solid #cbd5e1; }
    td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .no-print { display: none !important; }
    @media print { body { padding: 0; } .receipt-container { border: none; padding: 0; } }
  </style>
</head>
<body onload="window.print()">
  <div class="receipt-container">
    ${el.innerHTML}
  </div>
</body>
</html>`;
    const blob = new Blob([printDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ricevuta_${safeChildName}_${safeReceiptNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Ricevuta scaricata! Clicca sul file per visualizzarla o salvarla in PDF.');
  };

  return (
    <div className="min-h-screen bg-[#f4f8fc] font-sans pb-32 relative overflow-x-hidden">
      {/* Notifica di avviso/conferma con priorità z-index massima (sopra ogni modale) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[99999] bg-[#1E2046] text-white px-7 py-4 rounded-2xl shadow-2xl shadow-black/50 border-2 border-amber-300 flex items-center gap-3.5 font-bold text-sm pointer-events-auto max-w-md text-center sm:text-left"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
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
            onClick={() => {
              setParentPayments(getLocalPaymentsLedger());
              setActiveModal('payments-history');
            }}
            className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 rounded-full font-bold transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>I Miei Pagamenti</span>
            {parentPayments.filter(p => p.status === 'SUCCEEDED').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#1E2046] text-xs font-black">
                {parentPayments.filter(p => p.status === 'SUCCEEDED').length}
              </span>
            )}
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
              className={`bg-white rounded-[32px] p-8 w-full shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto transform-gpu ${
                activeModal === 'analysis' ||
                activeModal === 'stripe-checkout' ||
                activeModal === 'payments-history' ||
                activeModal === 'receipt-preview'
                  ? 'max-w-4xl'
                  : 'max-w-xl'
              }`}
            >
              <button
                onClick={() =>
                  activeModal === 'stripe-checkout'
                    ? handleCancelStripeCheckout()
                    : setActiveModal('none')
                }
                className="absolute top-6 right-6 text-slate-400 hover:text-[#1E2046] transition-colors cursor-pointer z-20"
              >
                <X className="w-6 h-6" />
              </button>

              {/* =================================================================
                  MODALE 1: ISCRIVI FIGLIO AL CORSO (SCELTA FIGLIO & RIEPILOGO)
              ================================================================= */}
              {activeModal === 'enroll-course' && selectedCourseForEnroll && (
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      🏅
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E52B6D] bg-rose-50 px-2.5 py-0.5 rounded-full">
                        Iscrizione Diretta • {selectedCourseForEnroll.club_name}
                      </span>
                      <h3 className="text-2xl font-black text-[#1E2046]">
                        Iscrivi tuo figlio a {selectedCourseForEnroll.name}
                      </h3>
                    </div>
                  </div>

                  <form onSubmit={handleProceedToStripeCheckout} className="space-y-5">
                    {/* Scelta del Figlio con controllo automatico dell'età */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">
                        1. Seleziona quale figlio iscrivere (Fascia richiesta:{' '}
                        {selectedCourseForEnroll.min_age}-{selectedCourseForEnroll.max_age} anni)
                      </label>
                      <div className="space-y-2.5">
                        {children.map(child => {
                          const age = calculateAgeFromDob(child.date_of_birth);
                          const isCompatible =
                            age >= selectedCourseForEnroll.min_age &&
                            age <= selectedCourseForEnroll.max_age;
                          const alreadyEnrolled = isChildAlreadyEnrolledInCourse(
                            selectedCourseForEnroll.id,
                            child.id
                          );
                          const isSelected = selectedChildForEnrollId === child.id;

                          return (
                            <button
                              key={child.id}
                              type="button"
                              disabled={!isCompatible || alreadyEnrolled}
                              onClick={() => setSelectedChildForEnrollId(child.id)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                alreadyEnrolled
                                  ? 'bg-emerald-50/60 border-emerald-200 opacity-75 cursor-not-allowed'
                                  : !isCompatible
                                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-[#1E2046] text-white border-[#1E2046] shadow-lg cursor-pointer'
                                      : 'bg-slate-50 hover:bg-sky-50 text-[#1E2046] border-slate-200 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 ${
                                    isSelected
                                      ? 'bg-[#E52B6D] text-white'
                                      : 'bg-white text-[#1E2046] border border-slate-200'
                                  }`}
                                >
                                  {child.first_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-black text-base flex items-center gap-2 flex-wrap">
                                    <span>
                                      {child.first_name} {child.last_name}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                        isSelected
                                          ? 'bg-white/15 text-sky-200'
                                          : 'bg-slate-200/70 text-slate-600'
                                      }`}
                                    >
                                      {age} anni
                                    </span>
                                  </div>
                                  <div
                                    className={`text-xs font-mono mt-0.5 ${
                                      isSelected ? 'text-sky-200' : 'text-slate-400'
                                    }`}
                                  >
                                    CF: {child.fiscal_code || 'Non specificato'}
                                  </div>
                                </div>
                              </div>

                              <div>
                                {alreadyEnrolled ? (
                                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                                    ✓ Già Iscritto
                                  </span>
                                ) : !isCompatible ? (
                                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                                    Età richiesta: {selectedCourseForEnroll.min_age}-
                                    {selectedCourseForEnroll.max_age} anni
                                  </span>
                                ) : isSelected ? (
                                  <span className="px-3 py-1 rounded-full bg-[#E52B6D] text-white text-xs font-black">
                                    Selezionato
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">
                                    Clicca per scegliere
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Riepilogo Transazione Cliente -> Club Sportivo */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2.5">
                        <span>Riepilogo Iscrizione</span>
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pagamento Diretto al Club
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Associazione / Società Sportiva:</span>
                        <span className="font-black text-[#1E2046]">
                          {selectedCourseForEnroll.club_name}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Corso e Frequenza:</span>
                        <span className="font-bold text-[#1E2046]">
                          {selectedCourseForEnroll.name} (
                          {formatBillingPeriodLabel(selectedCourseForEnroll.billing_period)})
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Posti liberi nel corso:</span>
                        <span className="font-bold text-emerald-600">
                          {Math.max(
                            0,
                            selectedCourseForEnroll.max_participants -
                              selectedCourseForEnroll.enrolled_count
                          )}{' '}
                          liberi su {selectedCourseForEnroll.max_participants}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">
                          Intestazione Ricevuta:
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-700">
                          CF: {parentProfile.fiscal_code || 'Da profilo genitore'}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-400 uppercase block">
                            Totale Quota Iscrizione
                          </span>
                        </div>
                        <span className="text-3xl font-black text-[#E52B6D]">
                          {formatEuroFromCents(selectedCourseForEnroll.price_cents)}
                        </span>
                      </div>
                    </div>

                    {/* Blocco temporaneo posto (Hold 15 min) */}
                    <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center gap-3 text-xs text-sky-900 font-medium">
                      <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>
                        Il posto per tuo figlio viene <strong>riservato per 15 minuti</strong> per consentirti di completare la procedura.
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={enrollAcceptTerms}
                        onChange={e => setEnrollAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#E52B6D] rounded"
                      />
                      <span>
                        Confermo l'iscrizione di mio figlio presso{' '}
                        <strong>{selectedCourseForEnroll.club_name}</strong> e richiedo l'emissione automatica della ricevuta di pagamento.
                      </span>
                    </label>

                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={isCreatingCheckout || !selectedChildForEnrollId}
                        className="w-full py-4 bg-[#1E2046] hover:bg-[#E52B6D] disabled:opacity-50 transition-colors text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        {isCreatingCheckout ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                        <span>
                          Procedi al Pagamento ({formatEuroFromCents(selectedCourseForEnroll.price_cents)})
                        </span>
                      </button>
                      <p className="text-center text-xs text-slate-400 font-medium">
                        Puoi pagare con Carta di Credito, Debito, Bancomat, Apple Pay o Google Pay
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {/* =================================================================
                  MODALE 2: PAGINA HOSTED STRIPE CHECKOUT + CONFERMA WEBHOOK
              ================================================================= */}
              {activeModal === 'stripe-checkout' &&
                activePendingPayment &&
                selectedCourseForEnroll && (
                  <div className="pt-1">
                    {checkoutStep === 'form' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Colonna Sinistra: Riepilogo Iscrizione */}
                        <div className="lg:col-span-5 bg-[#1E2046] text-white rounded-3xl p-6 flex flex-col justify-between">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-sky-200">
                                Riepilogo Iscrizione
                              </span>
                              <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                                In attesa di pagamento
                              </span>
                            </div>

                            <div>
                              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider">
                                Quota intestata a
                              </p>
                              <h4 className="text-xl font-black mt-0.5">
                                {activePendingPayment.club_name}
                              </h4>
                              <p className="text-3xl font-black text-white mt-3">
                                {formatEuroFromCents(activePendingPayment.amount_cents)}
                              </p>
                              <p className="text-xs text-sky-200/80 mt-0.5">
                                Quota {formatBillingPeriodLabel(activePendingPayment.billing_period)}
                              </p>
                            </div>

                            <div className="bg-white/10 rounded-2xl p-4 space-y-2.5 text-xs border border-white/10">
                              <div className="flex justify-between">
                                <span className="text-sky-200">Corso:</span>
                                <span className="font-bold">{activePendingPayment.course_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sky-200">Atleta:</span>
                                <span className="font-bold">{activePendingPayment.child_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sky-200">CF Atleta:</span>
                                <span className="font-mono font-bold">
                                  {activePendingPayment.child_fiscal_code}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sky-200">Genitore:</span>
                                <span className="font-bold">
                                  {activePendingPayment.parent_name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/10 mt-6 space-y-2 text-xs text-sky-200/90">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Pagamento per <strong>{activePendingPayment.club_name}</strong> gestito tramite la piattaforma Athlos.</span>
                            </div>
                            <div className="text-[11px] text-sky-300/80">
                              Ricevuta rilasciata subito al termine del pagamento.
                            </div>
                          </div>
                        </div>

                        {/* Colonna Destra: Inserimento Carta / Apple Pay e Simulazione Webhook */}
                        <div className="lg:col-span-7 space-y-5">
                          <div>
                            <h3 className="text-2xl font-black text-[#1E2046]">
                              Metodo di Pagamento
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Scegli come completare il pagamento della quota d'iscrizione.
                            </p>
                          </div>

                          {/* Express Checkout Wallet Button */}
                          <button
                            type="button"
                            onClick={() => handleSimulateStripeWebhookCompletion('SUCCEEDED')}
                            className="w-full py-3.5 rounded-xl bg-black hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                          >
                            <span> Pay</span>
                            <span className="text-white/40">|</span>
                            <span>G Pay • Paga con un click</span>
                          </button>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">
                              oppure con carta o bancomat
                            </span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                Nome intestatario carta
                              </label>
                              <input
                                type="text"
                                value={cardHolderName}
                                onChange={e => setCardHolderName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[#1E2046] text-sm"
                                placeholder="es. Mario Rossi"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                Numero Carta
                              </label>
                              <div className="relative">
                                <CreditCard className="w-4 h-4 text-[#E52B6D] absolute left-3.5 top-3" />
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={e => setCardNumber(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-[#1E2046] text-sm"
                                  placeholder="•••• •••• •••• ••••"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                  Scadenza (MM/AA)
                                </label>
                                <input
                                  type="text"
                                  value={cardExpiry}
                                  onChange={e => setCardExpiry(e.target.value)}
                                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-[#1E2046] text-sm"
                                  placeholder="12/28"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                  CVV / CVC
                                </label>
                                <input
                                  type="text"
                                  value={cardCvc}
                                  onChange={e => setCardCvc(e.target.value)}
                                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-[#1E2046] text-sm"
                                  placeholder="123"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => handleSimulateStripeWebhookCompletion('SUCCEEDED')}
                              className="w-full py-4 bg-[#E52B6D] hover:bg-[#FF4F8B] text-white rounded-xl font-black text-base shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CreditCard className="w-5 h-5" />
                              <span>
                                Paga {formatEuroFromCents(activePendingPayment.amount_cents)}
                              </span>
                            </button>

                            <div className="flex justify-between items-center pt-2">
                              <button
                                type="button"
                                onClick={handleCancelStripeCheckout}
                                className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                              >
                                ← Annulla e torna indietro
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSimulateStripeWebhookCompletion('FAILED')}
                                className="text-[11px] text-slate-400 hover:text-rose-500 font-medium transition-colors cursor-pointer"
                              >
                                Test: simula carta non valida
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: ELABORAZIONE DEL PAGAMENTO */}
                    {checkoutStep === 'webhook-polling' && (
                      <div className="py-16 text-center space-y-4">
                        <Loader2 className="w-14 h-14 text-[#E52B6D] animate-spin mx-auto" />
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-[#E52B6D] font-black text-xs uppercase">
                          Elaborazione in corso
                        </span>
                        <h3 className="text-2xl font-black text-[#1E2046]">
                          Conferma del pagamento in corso...
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
                          Un attimo di pazienza, stiamo completando la registrazione dell'iscrizione di tuo figlio.
                        </p>
                      </div>
                    )}

                    {/* STEP 3: PAGAMENTO CONFERMATO */}
                    {checkoutStep === 'succeeded' && (
                      <div className="py-8 text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-wider">
                            Pagamento Confermato
                          </span>
                          <h3 className="text-3xl font-black text-[#1E2046] mt-2">
                            Iscrizione Completata con Successo!
                          </h3>
                          <p className="text-slate-500 text-sm font-medium mt-1">
                            <strong>{activePendingPayment.child_name}</strong> è ufficialmente iscritto al corso{' '}
                            <strong>{activePendingPayment.course_name}</strong> presso{' '}
                            <strong>{activePendingPayment.club_name}</strong>.
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 max-w-lg mx-auto text-left space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Ricevuta di Pagamento:</span>
                            <span className="font-mono font-black text-[#1E2046]">
                              #{activePendingPayment.receipt_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Importo pagato:</span>
                            <span className="font-black text-emerald-600">
                              {formatEuroFromCents(activePendingPayment.amount_cents)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Corso registrato:</span>
                            <span className="font-black text-[#E52B6D]">
                              {activePendingPayment.course_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptPayment(activePendingPayment);
                              setActiveModal('receipt-preview');
                            }}
                            className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-[#1E2046] text-[#1E2046] font-black text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Printer className="w-4 h-4 text-[#E52B6D]" />
                            Visualizza Ricevuta
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModal('none')}
                            className="px-6 py-3 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-black text-sm cursor-pointer shadow-sm"
                          >
                            Torna alla Dashboard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CASO CARTA RIFIUTATA */}
                    {checkoutStep === 'failed' && (
                      <div className="py-10 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                          <AlertTriangle className="w-9 h-9" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-xs uppercase">
                          Pagamento Non Riuscito
                        </span>
                        <h3 className="text-2xl font-black text-[#1E2046]">
                          La carta non è andata a buon fine
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          La transazione non è stata autorizzata dalla tua banca. Nessun importo è stato addebitato.
                        </p>
                        <div className="flex justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutStep('form')}
                            className="px-6 py-3 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-black text-sm cursor-pointer"
                          >
                            Riprova con un altro metodo
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModal('none')}
                            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm cursor-pointer"
                          >
                            Chiudi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* =================================================================
                  MODALE 3: STORICO PAGAMENTI & RICEVUTE
              ================================================================= */}
              {activeModal === 'payments-history' && (
                <div className="pt-2 space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#E52B6D] bg-rose-50 px-3 py-1 rounded-full">
                      Iscrizioni & Ricevute
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#1E2046] mt-2">
                      I Tuoi Pagamenti e Ricevute
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                      Visualizza lo storico dei pagamenti e scarica le ricevute rilasciate dai centri sportivi.
                    </p>
                  </div>

                  {parentPayments.length > 0 ? (
                    <div className="space-y-3">
                      {parentPayments.map(payment => (
                        <div
                          key={payment.id}
                          className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  payment.status === 'SUCCEEDED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : payment.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : payment.status === 'REFUNDED'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {formatPaymentStatusLabel(payment.status)}
                              </span>
                              <span className="font-black text-[#1E2046] text-base">
                                {payment.course_name}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                • {payment.club_name}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              Atleta: <strong>{payment.child_name}</strong> • Data:{' '}
                              {new Date(payment.created_at).toLocaleDateString('it-IT')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-black text-[#1E2046]">
                                {formatEuroFromCents(payment.amount_cents)}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">
                                {formatBillingPeriodLabel(payment.billing_period)}
                              </div>
                            </div>

                            {payment.status === 'SUCCEEDED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceiptPayment(payment);
                                  setActiveModal('receipt-preview');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-[#1E2046] border border-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#E52B6D]" />
                                Vedi Ricevuta
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="font-bold text-[#1E2046]">Nessun pagamento effettuato</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Scegli un corso nella sezione "Club Vicino a Te" qui sotto per iscrivere tuo figlio.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================
                  MODALE 4: ANTEPRIMA, DOWNLOAD E STAMPA RICEVUTA UFFICIALE
              ================================================================= */}
              {activeModal === 'receipt-preview' && selectedReceiptPayment && (
                <div className="pt-2 space-y-6">
                  {/* DOCUMENTO RICEVUTA UFFICIALE (ISOLATO E FORMATTATO PER STAMPA A4) */}
                  <div
                    id="printable-receipt"
                    className="p-8 sm:p-12 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 space-y-6 shadow-sm print:p-0 print:border-none print:shadow-none"
                  >
                    {/* TESTATA ENTE SPORTIVO & NUMERAZIONE QUIETANZA */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-300">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#1E2046] text-white flex items-center justify-center font-black text-2xl shrink-0 print:border print:border-slate-400">
                          {selectedReceiptPayment.club_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                            Associazione Sportiva Dilettantistica • Ente non commerciale
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black text-[#1E2046] mt-0.5 tracking-tight leading-tight">
                            {selectedReceiptPayment.club_name}
                          </h2>
                          <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                            Codice Fiscale / P.IVA: {selectedReceiptPayment.club_fiscal_code || '93048210874'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Affiliata ad Organismo Sportivo riconosciuto dal CONI
                          </p>
                        </div>
                      </div>

                      <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50 text-right min-w-[220px] shrink-0 print:bg-white">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          RICEVUTA DI PAGAMENTO
                        </div>
                        <div className="text-xl font-mono font-black text-[#1E2046] mt-0.5">
                          N° {selectedReceiptPayment.receipt_number}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          Data: {new Date(selectedReceiptPayment.created_at).toLocaleDateString('it-IT')}
                        </div>
                        <div className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          SALDATO • QUIETANZATO
                        </div>
                      </div>
                    </div>

                    {/* OGGETTO UFFICIALE */}
                    <div className="py-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                        Oggetto del documento
                      </div>
                      <p className="text-sm font-bold text-[#1E2046]">
                        Attestazione di versamento quota di partecipazione alle attività sportive giovanili per la stagione sportiva in corso.
                      </p>
                    </div>

                    {/* RIQUADRI ANAGRAFICI (PAGANTE E MINORE ISCRITTO) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70 print:bg-white">
                        <span className="font-black text-slate-500 uppercase text-[10px] block mb-1.5">
                          Soggetto Pagante (Genitore / Tutore)
                        </span>
                        <div className="font-bold text-[#1E2046] text-sm">
                          {selectedReceiptPayment.parent_name ||
                            `${parentProfile.first_name} ${parentProfile.last_name}`}
                        </div>
                        <div className="font-mono font-bold text-slate-700 mt-1">
                          Codice Fiscale: {selectedReceiptPayment.parent_fiscal_code || parentProfile.fiscal_code}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Qualifica: Esercente la potestà genitoriale
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70 print:bg-white">
                        <span className="font-black text-slate-500 uppercase text-[10px] block mb-1.5">
                          Atleta Minore Praticante
                        </span>
                        <div className="font-bold text-[#1E2046] text-sm">
                          {selectedReceiptPayment.child_name}
                        </div>
                        <div className="font-mono font-bold text-slate-700 mt-1">
                          Codice Fiscale: {selectedReceiptPayment.child_fiscal_code}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Attività: Pratica sportiva giovanile
                        </div>
                      </div>
                    </div>

                    {/* TABELLA CONTABILE DETTAGLIO QUOTA */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden mt-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                            <th className="p-3.5">Descrizione Prestazione</th>
                            <th className="p-3.5 text-center">Frequenza</th>
                            <th className="p-3.5 text-center">Metodo Pagamento</th>
                            <th className="p-3.5 text-right">Quota Versata</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3.5 font-bold text-[#1E2046]">
                              Quota iscrizione corso: {selectedReceiptPayment.course_name}
                              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                Iscrizione istituzionale alle attività sportive del club
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-semibold text-slate-700">
                              {formatBillingPeriodLabel(selectedReceiptPayment.billing_period)}
                            </td>
                            <td className="p-3.5 text-center font-medium text-slate-600">
                              Elettronico tracciabile (Carta)
                            </td>
                            <td className="p-3.5 text-right font-black text-base text-[#1E2046]">
                              {formatEuroFromCents(selectedReceiptPayment.amount_cents)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-black">
                            <td colSpan={3} className="p-3.5 text-right text-xs uppercase tracking-wider text-slate-600">
                              Totale Riscossa a Saldo:
                            </td>
                            <td className="p-3.5 text-right text-lg text-[#1E2046] font-black">
                              {formatEuroFromCents(selectedReceiptPayment.amount_cents)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* CLAUSOLA CONTABILE E FISCALE DI LEGGE */}
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-3">
                      Operazione istituzionale non soggetta ad IVA ai sensi dell'art. 148 del D.P.R. 917/1986 (TUIR) e dell'art. 4 del D.P.R. 633/1972. Pagamento tracciabile eseguito a saldo tramite circuito di pagamento elettronico registrato.
                    </p>

                    {/* DATI DI TRANSAZIONE E TRACCIABILITÀ */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-400 font-mono gap-2">
                      <span>ID Transazione: #{selectedReceiptPayment.id}</span>
                      <span>Data e Ora Contabile: {new Date(selectedReceiptPayment.created_at).toLocaleString('it-IT')}</span>
                    </div>

                    {/* TIMBRO E FIRMA PER QUIETANZA */}
                    <div className="pt-8 border-t-2 border-dashed border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                      <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center text-[10px] text-slate-600 min-w-[220px] print:bg-white">
                        <div className="font-bold uppercase tracking-wider mb-1 text-slate-500">
                          Timbro Associazione Sportiva
                        </div>
                        <div className="font-mono font-black text-[#1E2046] text-xs">
                          {selectedReceiptPayment.club_name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Quietanza Emessa Digitalmente via Athlos
                        </div>
                      </div>

                      <div className="text-right sm:min-w-[240px]">
                        <div className="w-56 border-b border-slate-400 mb-1.5 ml-auto"></div>
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          Firma del Legale Rappresentante
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Per quietanza liberatoria di avvenuto pagamento
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BARRA AZIONI (NON STAMPATA GRAZIE A NO-PRINT) */}
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2 no-print">
                    <button
                      type="button"
                      onClick={() => setActiveModal('payments-history')}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                    >
                      ← Torna allo storico
                    </button>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceiptHtml(selectedReceiptPayment)}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-300 text-[#1E2046] font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <Download className="w-4 h-4 text-[#E52B6D]" /> Scarica Ricevuta
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-6 py-2.5 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Stampa / Salva in PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'referral' && (
                <div className="text-center pt-4">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-3xl font-black text-[#1E2046] mb-2">Invita un Genitore</h3>
                  <p className="text-slate-500 font-medium mb-8">
                    Condividi questo link con i tuoi amici.
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
                  {selectedCourseForEnroll && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-amber-900">
                          Aggiungi prima tuo figlio per poterlo iscrivere a {selectedCourseForEnroll.name}
                        </h4>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Non hai ancora registrato nessun atleta nel tuo profilo. Inserisci i dati anagrafici qui sotto: una volta salvato, proseguirai subito e in automatico con l'iscrizione al corso presso <strong>{selectedCourseForEnroll.club_name}</strong>.
                        </p>
                      </div>
                    </div>
                  )}

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
                          <option value="Nessuno">⚪ Nessuno (in cerca del primo sport)</option>
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

                    {/* Indirizzo di Residenza con completamento automatico */}
                    <div className="relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-[#E52B6D] shrink-0" /> Via e Numero Civico <span className="normal-case text-slate-400 font-medium text-[11px]">(per mostrarti i club più vicini a te)</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Scrivi indirizzo"
                          value={parentProfile.street}
                          onChange={e => {
                            const val = e.target.value;
                            setParentProfile({ ...parentProfile, street: val });
                            handleParentGeoSearch(val);
                          }}
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      {parentGeoResults.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {parentGeoResults.map((g, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => selectParentGeo(g)}
                              className="w-full text-left px-4 py-2.5 hover:bg-rose-50/60 transition-colors flex items-start gap-2.5 cursor-pointer"
                            >
                              <MapPin className="w-4 h-4 text-[#E52B6D] shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-[#1E2046] leading-snug">
                                  {g.street || g.display_name}
                                </div>
                                {(g.city || g.postal_code) && (
                                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                                    {[g.postal_code, g.city, g.province ? `(${g.province})` : '']
                                      .filter(Boolean)
                                      .join(' ')}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-3">
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
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          CAP
                        </label>
                        <input
                          type="text"
                          pattern="\d{5}"
                          required
                          placeholder="95037"
                          value={parentProfile.postal_code}
                          onChange={e =>
                            setParentProfile({ ...parentProfile, postal_code: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Prov
                        </label>
                        <input
                          type="text"
                          minLength={2}
                          maxLength={2}
                          required
                          value={parentProfile.province}
                          onChange={e =>
                            setParentProfile({
                              ...parentProfile,
                              province: e.target.value.toUpperCase()
                            })
                          }
                          className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046] uppercase text-center"
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
                                Panoramica sulle Abilità di {selectedChild.first_name}
                              </h4>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
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
                                  : child.sport === 'Nessuno'
                                    ? '👟'
                                    : '🏅'}
                </div>

                <div className="flex items-center mb-8 relative z-10">
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                      {child.first_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black text-[#1E2046] truncate">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {child.sport === 'Nessuno' ? (
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            In cerca di uno sport
                          </span>
                        ) : (
                          <span className="bg-sky-100 text-[#E52B6D] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {child.sport}
                          </span>
                        )}
                        {child.fiscal_code && (
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                            CF: {child.fiscal_code}
                          </span>
                        )}
                      </div>
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

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between relative z-10">
                  <span className="text-xs text-slate-400 font-medium">Gestione atleta</span>
                  <button
                    onClick={() => handleDeleteChild(child.id, child.first_name)}
                    title={`Elimina ${child.first_name}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Elimina profilo</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SEZIONE: ESPLORA E ISCRIVI (CLUB LIMITROFI) */}
      <section className="mt-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#1E2046] tracking-tight">Club Vicino a Te</h2>
            <p className="text-slate-500 font-medium mt-1">
              Esplora i corsi disponibili, verifica i posti liberi e iscrivi subito tuo figlio.
            </p>
          </div>
          {parentPayments.length > 0 && (
            <button
              onClick={() => setActiveModal('payments-history')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#1E2046] rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
            >
              <Receipt className="w-4 h-4 text-[#E52B6D]" />
              I Miei Pagamenti ({parentPayments.filter((p) => p.status === 'SUCCEEDED').length})
            </button>
          )}
        </div>

        {nearbyClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyClubs.map((club, i) => (
              <div
                key={club.id || i}
                className="bg-white rounded-[24px] border border-slate-200 p-6 hover:shadow-xl hover:shadow-[#E52B6D]/10 transition-shadow duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    {i === 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E52B6D] bg-sky-100 px-2.5 py-1 rounded-full inline-block mb-2">
                        PIÙ VICINO (1° SCELTA)
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-[#1E2046] leading-tight">{club.name}</h3>
                  </div>
                  <span className="bg-slate-100 text-[#1E2046] font-black text-sm px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    {club.distance}
                  </span>
                </div>

                <p className="text-slate-500 text-sm flex items-center gap-2 mb-5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {club.address}
                </p>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Corsi & Quote Iscrizione</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{club.courses.length} corsi</span>
                  </h4>
                  <div className="space-y-3">
                    {club.courses.map((course, cIdx) => {
                      const spotsLeft = Math.max(0, course.max_participants - course.enrolled_count);
                      const isFull = spotsLeft <= 0;
                      const enrolledChildrenInCourse = children.filter((ch) =>
                        localEnrollments.some(
                          (enr) => enr.child_id === ch.id && enr.course_id === course.id
                        )
                      );

                      return (
                        <div
                          key={course.id || cIdx}
                          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-[#E52B6D]/40 transition-colors flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-black text-[#1E2046] text-sm leading-snug">{course.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 font-semibold">
                                  Età: {course.age_range} anni
                                </span>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={`text-[11px] font-bold flex items-center gap-1 ${
                                    isFull
                                      ? 'text-rose-600'
                                      : spotsLeft <= 3
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                  }`}
                                >
                                  <Users className="w-3 h-3" />
                                  {isFull
                                    ? 'Posti Esauriti'
                                    : `${spotsLeft} ${spotsLeft === 1 ? 'posto libero' : 'posti liberi'}`}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block font-black text-[#1E2046] text-base leading-none">
                                {formatEuroFromCents(course.price_cents)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {formatBillingPeriodLabel(course.billing_period)}
                              </span>
                            </div>
                          </div>

                          {enrolledChildrenInCourse.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                              {enrolledChildrenInCourse.map((ch) => (
                                <span
                                  key={ch.id}
                                  className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {ch.first_name} iscritto/a
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => openEnrollCourseModal(course)}
                            disabled={isFull}
                            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                              isFull
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-[#1E2046] hover:bg-[#E52B6D] text-white shadow-sm cursor-pointer'
                            }`}
                          >
                            {isFull ? (
                              <>Corso al Completo ({course.enrolled_count}/{course.max_participants})</>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5" /> Iscrivi tuo figlio con Carta o Apple Pay
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !parentProfile.street ? (
          <div className="bg-white rounded-[24px] border border-amber-200/80 bg-amber-50/20 p-8 text-center">
            <MapPin className="w-10 h-10 text-[#E52B6D] mx-auto mb-3" />
            <h4 className="font-bold text-[#1E2046] text-lg mb-1">
              Imposta il tuo indirizzo di residenza
            </h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
              Athlos calcola in tempo reale la distanza dai centri sportivi affiliati entro 15 km dalla tua abitazione.
            </p>
            <button
              onClick={() => setActiveModal('profile')}
              className="px-6 py-2.5 bg-[#E52B6D] hover:bg-[#FF4F8B] text-white font-bold text-sm rounded-xl transition-colors shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Completa Indirizzo nel Profilo
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-[#1E2046]">
              Nessun centro sportivo convenzionato registrato entro 15 km da {parentProfile.city || 'te'} al momento.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              I nuovi club che si affiliano ad Athlos nella tua zona compariranno qui automaticamente.
            </p>
          </div>
        )}
      </section>
      </main>
    </div>
  );
}
