import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Plus,
  Trash2,
  Edit3,
  Activity,
  Users,
  Sparkles,
  Building2,
  MapPin,
  AlertTriangle,
  UserPlus,
  Play,
  ClipboardCheck
} from 'lucide-react';

// === INTERFACCE ALLINEATE AL BACK-END ===

interface Address {
  street: string;
  number?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface ClubProfile {
  id: string;
  user_id: string;
  name: string;
  email_contact: string;
  phone_number: string;
  address: Address;
  logo_url?: string;
  latitude: number;
  longitude: number;
}

interface GeoSearchResult {
  display_name: string;
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface MotorTestMetric {
  id: string;
  name: string;
  unit: string;
}

interface CourseMotorTest {
  id: string;
  name: string;
  unit?: string;
  metrics: MotorTestMetric[];
}

interface PhysicalTestItem {
  id?: string;
  test_type: string;
  unit?: string;
  score_value: number;
  date?: string;
}

interface EvaluationSessionRecord {
  id: string;
  course_id: string;
  child_id: string;
  trimester_id: string;
  date: string;
  creativity_score: number;
  teamwork_score: number;
  stress_management_score: number;
  leadership_score?: number;
  game_reading_score?: number;
  motivation_score?: number;
  coach_notes: string;
  ai_recommended_sport: string;
  physical_tests: PhysicalTestItem[];
}

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  from_athlos: boolean;
  skills: string[];
}

interface ClubCourse {
  id: string;
  clubs_id: string;
  name: string;
  sport_category: string;
  min_age: number;
  max_age: number;
  motor_tests: CourseMotorTest[];
  athletes: Athlete[];
}

// === DATI INIZIALI REALISTICI ===

const INITIAL_CLUB: ClubProfile = {
  id: 'club-uuid-01',
  user_id: 'user-club-01',
  name: 'Polisportiva Punta Etnea',
  email_contact: 'segreteria@puntaetnea.it',
  phone_number: '+39 095 7418520',
  address: {
    street: 'Via Roma',
    number: '45',
    city: 'San Giovanni La Punta',
    province: 'CT',
    postal_code: '95037',
    country: 'Italy'
  },
  logo_url: '',
  latitude: 37.5794,
  longitude: 15.0956
};

// All'inizio ogni corso ha 0 test motori configurati: verranno aggiunti dal club in base allo sport
const INITIAL_COURSES: ClubCourse[] = [
  {
    id: 'corso-basket-6-10',
    clubs_id: 'club-uuid-01',
    name: 'Corso Basket',
    sport_category: 'Basket',
    min_age: 6,
    max_age: 10,
    motor_tests: [],
    athletes: [
      {
        id: 'uuid-1',
        first_name: 'Lorenzo',
        last_name: 'Mazzone',
        date_of_birth: '2018-04-12',
        age: 8,
        gender: 'M',
        from_athlos: true,
        skills: ['Riflessi rapidi', 'Coordinazione']
      },
      {
        id: 'uuid-2',
        first_name: 'Matteo',
        last_name: 'Greco',
        date_of_birth: '2017-09-22',
        age: 9,
        gender: 'M',
        from_athlos: false,
        skills: ['Spirito di squadra', 'Resistenza']
      },
      {
        id: 'uuid-3',
        first_name: 'Edoardo',
        last_name: 'Ferretti',
        date_of_birth: '2019-01-15',
        age: 7,
        gender: 'M',
        from_athlos: true,
        skills: ['Agilità', 'Creatività']
      }
    ]
  },
  {
    id: 'corso-pallavolo-7-10',
    clubs_id: 'club-uuid-01',
    name: 'Corso Pallavolo Pulcini',
    sport_category: 'Pallavolo',
    min_age: 7,
    max_age: 10,
    motor_tests: [],
    athletes: [
      {
        id: 'uuid-4',
        first_name: 'Sofia',
        last_name: 'Mazzone',
        date_of_birth: '2018-02-18',
        age: 8,
        gender: 'F',
        from_athlos: true,
        skills: ['Elevazione', 'Gioco di squadra']
      },
      {
        id: 'uuid-5',
        first_name: 'Chiara',
        last_name: 'Bellini',
        date_of_birth: '2017-06-30',
        age: 9,
        gender: 'F',
        from_athlos: false,
        skills: ['Leadership', 'Precisione']
      },
      {
        id: 'uuid-6',
        first_name: 'Giorgia',
        last_name: 'Lombardo',
        date_of_birth: '2018-11-05',
        age: 8,
        gender: 'F',
        from_athlos: true,
        skills: ['Riflessi', 'Equilibrio']
      }
    ]
  },
  {
    id: 'corso-calcio-6-10',
    clubs_id: 'club-uuid-01',
    name: 'Scuola Calcio Primi Calci',
    sport_category: 'Calcio',
    min_age: 6,
    max_age: 10,
    motor_tests: [],
    athletes: [
      {
        id: 'uuid-7',
        first_name: 'Alessandro',
        last_name: 'Russo',
        date_of_birth: '2017-11-05',
        age: 9,
        gender: 'M',
        from_athlos: true,
        skills: ['Scatto veloce', 'Dribbling']
      },
      {
        id: 'uuid-8',
        first_name: 'Davide',
        last_name: 'Conti',
        date_of_birth: '2018-08-19',
        age: 8,
        gender: 'M',
        from_athlos: false,
        skills: ['Visione di gioco', 'Cooperazione']
      }
    ]
  }
];

const INITIAL_CHILD_PHYSICAL_TESTS: Record<string, PhysicalTestItem[]> = {};

const INITIAL_EVALUATIONS: Record<string, EvaluationSessionRecord> = {
  'uuid-1': {
    id: 'form-1',
    course_id: 'corso-basket-6-10',
    child_id: 'uuid-1',
    trimester_id: 'Autunno',
    date: '2026-09-15',
    creativity_score: 8,
    teamwork_score: 5,
    stress_management_score: 6,
    leadership_score: 6,
    game_reading_score: 8,
    motivation_score: 9,
    coach_notes: 'Riflessi eccellenti e grande creatività, ma patisce le dinamiche di squadra.',
    physical_tests: [],
    ai_recommended_sport: `1.  SPORT CONSIGLIATO: Scherma
2.  OBIETTIVO MOTORIO: La crescita a 8 anni richiede un affinamento della coordinazione oculo-manuale. La scherma esalta i suoi eccellenti riflessi permettendogli di canalizzare lo stress individualmente, compensando le difficoltà nelle dinamiche di squadra.
3.  CONSIGLIO PER I GENITORI: Non forzatelo a fare il 'giocatore di squadra' in questa fase. La sua tranquillità emotiva nella pedana è una dote rara: valorizzatela.`
  }
};

// Unità di misura standard selezionabili da menu a tendina
const STANDARD_UNITS = [
  { value: 'sec', label: 'Secondi (sec)' },
  { value: 'm', label: 'Metri (m)' },
  { value: 'cm', label: 'Centimetri (cm)' },
  { value: 'rip', label: 'Ripetizioni (rip)' },
  { value: 'pt', label: 'Punti (pt)' }
];

const FALLBACK_GEO_SUGGESTIONS: GeoSearchResult[] = [
  {
    display_name: 'Via Roma 45, San Giovanni La Punta (CT)',
    street: 'Via Roma 45',
    city: 'San Giovanni La Punta',
    province: 'CT',
    postal_code: '95037',
    country: 'Italy',
    latitude: 37.5794,
    longitude: 15.0956
  },
  {
    display_name: 'Via Santa Sofia 111, Catania (CT)',
    street: 'Via Santa Sofia 111',
    city: 'Catania',
    province: 'CT',
    postal_code: '95123',
    country: 'Italy',
    latitude: 37.5295,
    longitude: 15.0683
  },
  {
    display_name: 'Viale Tiziano 74, Roma (RM)',
    street: 'Viale Tiziano 74',
    city: 'Roma',
    province: 'RM',
    postal_code: '00196',
    country: 'Italy',
    latitude: 41.9288,
    longitude: 12.4663
  },
  {
    display_name: 'Piazzale Lotto 15, Milano (MI)',
    street: 'Piazzale Lotto 15',
    city: 'Milano',
    province: 'MI',
    postal_code: '20148',
    country: 'Italy',
    latitude: 45.4793,
    longitude: 9.1419
  }
];

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

const generateLocalAIPassport = (
  athlete: Athlete,
  currentCourseName: string,
  creativity: number,
  teamwork: number,
  stress: number,
  leadership: number,
  gameReading: number,
  motivation: number,
  physicalTests: PhysicalTestItem[],
  coachNotes: string
): string => {
  let recommended = 'Ginnastica Artistica';
  let objective = '';
  let tip = '';

  if (leadership >= 8 && gameReading >= 7) {
    recommended = currentCourseName.toLowerCase().includes('basket') ? 'Pallavolo' : 'Mini-Basket';
    objective = `A ${athlete.age} anni, ${athlete.first_name} mostra spiccate doti di leadership (${leadership}/10), intelligenza tattica (${gameReading}/10) e spirito di squadra (${teamwork}/10). Uno sport di situazione come ${recommended} permetterà di esaltare la sua capacità di lettura e guida dei compagni.`;
    tip = `Incoraggiate il suo ruolo propositivo nel gruppo senza caricarlo di responsabilità premature: il gioco deve rimanere divertimento e condivisione.`;
  } else if (teamwork >= 7 && creativity >= 7) {
    recommended = currentCourseName.toLowerCase().includes('basket') ? 'Pallavolo' : 'Mini-Basket';
    objective = `A ${athlete.age} anni, ${athlete.first_name} mostra spiccate doti di creatività (${creativity}/10) e spirito di squadra (${teamwork}/10). Provare anche ${recommended} aiuterà a sviluppare ancora meglio la visione di gioco e la collaborazione con i compagni.`;
    tip = `Incoraggiate la sua naturale propensione al gioco di gruppo e all'iniziativa personale, lasciandolo divertire senza pressioni sul risultato.`;
  } else if (stress >= 8 && teamwork <= 5) {
    recommended = 'Scherma';
    objective = `Dai test emerge un ottimo autocontrollo (${stress}/10) e una preferenza per le attività individuali. La Scherma valorizza la rapidità di riflessi e la precisione senza metterlo a disagio nelle dinamiche di squadra.`;
    tip = `Rispettate i suoi tempi di socializzazione: praticare uno sport individuale strutturato rafforzerà la sua fiducia in sé stesso.`;
  } else if (motivation >= 8 && stress <= 5) {
    recommended = 'Judo';
    objective = `L'altissima motivazione (${motivation}/10) unita all'esigenza di canalizzare lo stress e l'emotività (${stress}/10) trova nel Judo la disciplina ideale per equilibrio, rispetto delle regole e autoconsapevolezza corporea.`;
    tip = `Valorizzate ogni piccolo progresso nel rispetto dei turni e delle regole: sarà una bellissima palestra di crescita personale.`;
  } else {
    recommended = 'Nuoto Formativo';
    objective = `Unendo i ${physicalTests.length} test motori svolti in campo con le osservazioni dell'allenatore (motivazione ${motivation}/10, intelligenza tattica ${gameReading}/10), si consiglia di arricchire il percorso con il Nuoto Formativo per sviluppare coordinazione e armonia motoria.`;
    tip = `Accompagnate ${athlete.first_name} nella scoperta di più sport: variare movimento a questa età è il modo migliore per crescere sani e felici.`;
  }

  if (coachNotes.trim()) {
    objective += ` Nota dell'allenatore: "${coachNotes.trim()}".`;
  }

  return `1.  SPORT CONSIGLIATO: ${recommended}\n2.  OBIETTIVO MOTORIO: ${objective}\n3.  CONSIGLIO PER I GENITORI: ${tip}`;
};

const getSportEmoji = (sport: string) => {
  const s = sport.toLowerCase();
  if (s.includes('basket')) return '🏀';
  if (s.includes('pallavolo') || s.includes('volley')) return '🏐';
  if (s.includes('calcio')) return '⚽';
  if (s.includes('nuoto')) return '🏊';
  if (s.includes('tennis')) return '🎾';
  if (s.includes('scherma')) return '🤺';
  if (s.includes('ginnastica')) return '🤸';
  if (s.includes('judo') || s.includes('marziali') || s.includes('karate')) return '🥋';
  return '🏅';
};

export default function ClubDashboard({ onLogout }: { onLogout: () => void }) {
  const [club, setClub] = useState<ClubProfile>(INITIAL_CLUB);
  const [courses, setCourses] = useState<ClubCourse[]>(INITIAL_COURSES);
  const [childPhysicalTests, setChildPhysicalTests] = useState<Record<string, PhysicalTestItem[]>>(
    INITIAL_CHILD_PHYSICAL_TESTS
  );
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationSessionRecord>>(
    INITIAL_EVALUATIONS
  );

  // Navigazione principale tra le 3 sezioni
  const [activeTab, setActiveTab] = useState<'courses' | 'motor-tests' | 'psych-form'>('courses');

  // Modali
  const [activeModal, setActiveModal] = useState<
    'none' | 'profile' | 'course-form' | 'analysis' | 'add-athlete'
  >('none');

  // Messaggio di conferma rapido (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3500);
  };

  // --- STATO SEZIONE 2: TEST MOTORI (SPECIFICI PER CORSO) ---
  const [motorCourseId, setMotorCourseId] = useState<string>(INITIAL_COURSES[0].id);
  const [selectedMotorTestId, setSelectedMotorTestId] = useState<string>('');
  const [newMotorTestName, setNewMotorTestName] = useState<string>('');
  const [newTestMetrics, setNewTestMetrics] = useState<MotorTestMetric[]>([
    { id: 'm1', name: 'Misura Principale', unit: 'sec' }
  ]);
  const [addingMetricToTestId, setAddingMetricToTestId] = useState<string | null>(null);
  const [extraMetricName, setExtraMetricName] = useState<string>('');
  const [extraMetricUnit, setExtraMetricUnit] = useState<string>('sec');
  const [batchScores, setBatchScores] = useState<Record<string, string>>({});

  // Helper per ottenere le misure di un test motorio (retrocompatibile con test vecchi)
  const getTestMetrics = (test: CourseMotorTest | null | undefined): MotorTestMetric[] => {
    if (!test) return [];
    if (test.metrics && test.metrics.length > 0) return test.metrics;
    return [{ id: 'default-metric', name: 'Misura', unit: test.unit || 'sec' }];
  };

  // --- STATO SEZIONE 3: FORM FINE TRIMESTRE ---
  const [psychCourseId, setPsychCourseId] = useState<string>(INITIAL_COURSES[0].id);
  const [psychChildId, setPsychChildId] = useState<string>(INITIAL_COURSES[0].athletes[0].id);
  const [sessionId, setSessionId] = useState<string>('Autunno');
  const [creativityScore, setCreativityScore] = useState<number>(8);
  const [teamworkScore, setTeamworkScore] = useState<number>(7);
  const [stressScore, setStressScore] = useState<number>(7);
  const [leadershipScore, setLeadershipScore] = useState<number>(7);
  const [gameReadingScore, setGameReadingScore] = useState<number>(7);
  const [motivationScore, setMotivationScore] = useState<number>(8);
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isSubmittingEval, setIsSubmittingEval] = useState<boolean>(false);

  // --- STATO MODALE ANALISI AI ---
  const [analysisAthleteId, setAnalysisAthleteId] = useState<string | null>(null);

  // --- STATO MODALE PROFILO CENTRO ---
  const [profileForm, setProfileForm] = useState<ClubProfile>(INITIAL_CLUB);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<GeoSearchResult[]>([]);
  const [confirmDeleteClub, setConfirmDeleteClub] = useState(false);

  // --- STATO MODALE CREA / MODIFICA CORSO ---
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseSportCategory, setCourseSportCategory] = useState('Basket');
  const [courseMinAge, setCourseMinAge] = useState(6);
  const [courseMaxAge, setCourseMaxAge] = useState(10);
  const [courseFormError, setCourseFormError] = useState<string | null>(null);

  // --- STATO MODALE AGGIUNGI BAMBINO ---
  const [targetCourseForAthlete, setTargetCourseForAthlete] = useState<string | null>(null);
  const [newAthleteFirstName, setNewAthleteFirstName] = useState('');
  const [newAthleteLastName, setNewAthleteLastName] = useState('');
  const [newAthleteAge, setNewAthleteAge] = useState(8);
  const [newAthleteFromAthlos, setNewAthleteFromAthlos] = useState(true);

  // Riferimenti correnti
  const motorCourse = courses.find(c => c.id === motorCourseId) || courses[0];
  const courseMotorTests = motorCourse?.motor_tests || [];
  const activeCourseTest =
    courseMotorTests.find(t => t.id === selectedMotorTestId) || courseMotorTests[0] || null;

  const psychCourse = courses.find(c => c.id === psychCourseId) || courses[0];
  const psychAthlete =
    psychCourse?.athletes.find(a => a.id === psychChildId) || psychCourse?.athletes[0] || null;

  const analysisAthlete =
    courses.flatMap(c => c.athletes).find(a => a.id === analysisAthleteId) || null;
  const analysisEval = analysisAthleteId ? evaluations[analysisAthleteId] : null;

  // === HANDLERS SEZIONE 2: TEST MOTORI PER SINGOLO CORSO ===

  const handleGoToMotorTestForCourse = (courseIdToStart: string) => {
    const targetCourse = courses.find(c => c.id === courseIdToStart);
    setMotorCourseId(courseIdToStart);
    setSelectedMotorTestId(targetCourse?.motor_tests[0]?.id || '');
    setBatchScores({});
    setActiveTab('motor-tests');
  };

  const handleAddMotorTestToCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorCourse) return;
    const trimmedName = newMotorTestName.trim();
    if (!trimmedName) {
      showToast('Inserisci il nome del test motorio.');
      return;
    }

    const exists = motorCourse.motor_tests.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      showToast('Questo test è già presente per questo corso.');
      return;
    }

    const cleanMetrics = newTestMetrics
      .map((m, idx) => ({
        id: m.id || `metric-${idx}-${crypto.randomUUID()}`,
        name: m.name.trim() || `Misura ${idx + 1}`,
        unit: m.unit || 'sec'
      }))
      .filter(m => m.name.length > 0);

    if (cleanMetrics.length === 0) {
      showToast('Aggiungi almeno una misura per il test.');
      return;
    }

    const newTest: CourseMotorTest = {
      id: `mtest-${crypto.randomUUID()}`,
      name: trimmedName,
      unit: cleanMetrics[0].unit,
      metrics: cleanMetrics
    };

    setCourses(prev =>
      prev.map(c =>
        c.id === motorCourse.id ? { ...c, motor_tests: [...c.motor_tests, newTest] } : c
      )
    );
    setSelectedMotorTestId(newTest.id);
    setNewMotorTestName('');
    setNewTestMetrics([{ id: 'm1', name: 'Misura Principale', unit: 'sec' }]);
    setBatchScores({});
    showToast(`Test "${newTest.name}" creato con ${cleanMetrics.length} misura/e!`);
  };

  const handleAddMetricToExistingTest = (testId: string) => {
    if (!motorCourse || !extraMetricName.trim()) return;
    const metricToAdd: MotorTestMetric = {
      id: `metric-${crypto.randomUUID()}`,
      name: extraMetricName.trim(),
      unit: extraMetricUnit
    };
    setCourses(prev =>
      prev.map(c => {
        if (c.id !== motorCourse.id) return c;
        return {
          ...c,
          motor_tests: c.motor_tests.map(t => {
            if (t.id !== testId) return t;
            const currentMetrics = getTestMetrics(t);
            return {
              ...t,
              metrics: [...currentMetrics, metricToAdd]
            };
          })
        };
      })
    );
    setExtraMetricName('');
    setAddingMetricToTestId(null);
    showToast(`Misura "${metricToAdd.name} (${metricToAdd.unit})" aggiunta al test!`);
  };

  const handleDeleteMotorTestFromCourse = (testId: string, testName: string) => {
    if (!motorCourse) return;
    const remaining = motorCourse.motor_tests.filter(t => t.id !== testId);
    setCourses(prev =>
      prev.map(c => (c.id === motorCourse.id ? { ...c, motor_tests: remaining } : c))
    );
    if (selectedMotorTestId === testId) {
      setSelectedMotorTestId(remaining[0]?.id || '');
    }
    showToast(`Test "${testName}" rimosso dal corso.`);
  };

  const handleSaveBatchMotorTests = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorCourse || !activeCourseTest) return;

    const metrics = getTestMetrics(activeCourseTest);
    const today = new Date().toISOString().split('T')[0];
    let savedCount = 0;

    const updatedTests = { ...childPhysicalTests };
    motorCourse.athletes.forEach(athlete => {
      metrics.forEach(metric => {
        const key = `${athlete.id}_${metric.id}`;
        const rawVal = batchScores[key];
        if (rawVal !== undefined && rawVal.trim() !== '') {
          const numVal = parseFloat(rawVal.replace(',', '.'));
          if (!isNaN(numVal) && numVal >= 0) {
            // Strada A: codifichiamo nome test e sottomisura con unità
            const testTypeName =
              metrics.length > 1
                ? `${activeCourseTest.name} - ${metric.name} (${metric.unit})`
                : `${activeCourseTest.name} (${metric.unit})`;

            const newItem: PhysicalTestItem = {
              id: `pt-${crypto.randomUUID()}-${athlete.id}-${metric.id}`,
              test_type: testTypeName,
              unit: metric.unit,
              score_value: numVal,
              date: today
            };
            updatedTests[athlete.id] = [...(updatedTests[athlete.id] || []), newItem];
            savedCount++;
          }
        }
      });
    });

    if (savedCount === 0) {
      showToast('Inserisci almeno un risultato valido per salvare il test.');
      return;
    }

    setChildPhysicalTests(updatedTests);
    setBatchScores({});
    showToast(`Salvate ${savedCount} misure per "${activeCourseTest.name}"!`);
  };

  const handleRemoveSinglePhysicalTest = (childId: string, testIndex: number) => {
    setChildPhysicalTests(prev => ({
      ...prev,
      [childId]: (prev[childId] || []).filter((_, idx) => idx !== testIndex)
    }));
  };

  // === HANDLERS SEZIONE 3: FORM FINE TRIMESTRE ===

  const selectChildForPsychForm = (courseId: string, athlete: Athlete) => {
    setPsychCourseId(courseId);
    setPsychChildId(athlete.id);
    const existing = evaluations[athlete.id];
    if (existing) {
      setSessionId(existing.trimester_id);
      setCreativityScore(existing.creativity_score);
      setTeamworkScore(existing.teamwork_score);
      setStressScore(existing.stress_management_score);
      setLeadershipScore(existing.leadership_score ?? 7);
      setGameReadingScore(existing.game_reading_score ?? 7);
      setMotivationScore(existing.motivation_score ?? 8);
      setCoachNotes(existing.coach_notes);
    } else {
      setSessionId('Autunno');
      setCreativityScore(7);
      setTeamworkScore(7);
      setStressScore(7);
      setLeadershipScore(7);
      setGameReadingScore(7);
      setMotivationScore(8);
      setCoachNotes('');
    }
    setActiveTab('psych-form');
  };

  const handleSubmitPsychForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!psychCourse || !psychAthlete) return;

    setIsSubmittingEval(true);
    const athleteTests = childPhysicalTests[psychAthlete.id] || [];

    setTimeout(() => {
      const aiVerdict = generateLocalAIPassport(
        psychAthlete,
        psychCourse.name,
        creativityScore,
        teamworkScore,
        stressScore,
        leadershipScore,
        gameReadingScore,
        motivationScore,
        athleteTests,
        coachNotes
      );

      const newRecord: EvaluationSessionRecord = {
        id: `eval-${crypto.randomUUID()}`,
        course_id: psychCourse.id,
        child_id: psychAthlete.id,
        trimester_id: sessionId,
        date: new Date().toISOString().split('T')[0],
        creativity_score: creativityScore,
        teamwork_score: teamworkScore,
        stress_management_score: stressScore,
        leadership_score: leadershipScore,
        game_reading_score: gameReadingScore,
        motivation_score: motivationScore,
        coach_notes: coachNotes.trim() || 'Buon impegno e partecipazione durante il trimestre.',
        ai_recommended_sport: aiVerdict,
        physical_tests: athleteTests
      };

      setEvaluations(prev => ({
        ...prev,
        [psychAthlete.id]: newRecord
      }));
      setIsSubmittingEval(false);
      setAnalysisAthleteId(psychAthlete.id);
      setActiveModal('analysis');
      showToast(`Valutazione salvata per ${psychAthlete.first_name}!`);
    }, 400);
  };

  // === HANDLERS PROFILO E CORSI ===

  const handleGeoSearch = async (query: string) => {
    setGeoQuery(query);
    if (query.trim().length < 2) {
      setGeoResults([]);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8000/geo/autocomplete?q=${encodeURIComponent(query)}&limit=5`
      );
      if (res.ok) {
        const data: GeoSearchResult[] = await res.json();
        setGeoResults(data);
        return;
      }
    } catch {
      // Fallback silenzioso
    }
    const filtered = FALLBACK_GEO_SUGGESTIONS.filter(item =>
      item.display_name.toLowerCase().includes(query.toLowerCase())
    );
    setGeoResults(filtered.length > 0 ? filtered : FALLBACK_GEO_SUGGESTIONS.slice(0, 2));
  };

  const selectGeoResult = (geo: GeoSearchResult) => {
    setProfileForm(prev => ({
      ...prev,
      address: {
        street: geo.street || prev.address.street,
        number: prev.address.number,
        city: geo.city || prev.address.city,
        province: geo.province || prev.address.province,
        postal_code:
          geo.postal_code && /^\d{5}$/.test(geo.postal_code)
            ? geo.postal_code
            : prev.address.postal_code,
        country: geo.country || 'Italy'
      },
      latitude: Number(geo.latitude.toFixed(4)),
      longitude: Number(geo.longitude.toFixed(4))
    }));
    setGeoQuery(geo.display_name);
    setGeoResults([]);
  };

  const handleSaveClubProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setClub(profileForm);
    setActiveModal('none');
    showToast('Dati del centro sportivo salvati!');
  };

  const openCreateCourseModal = () => {
    setEditingCourseId(null);
    setCourseName('');
    setCourseSportCategory('Basket');
    setCourseMinAge(6);
    setCourseMaxAge(10);
    setCourseFormError(null);
    setActiveModal('course-form');
  };

  const openEditCourseModal = (course: ClubCourse) => {
    setEditingCourseId(course.id);
    setCourseName(course.name);
    setCourseSportCategory(course.sport_category);
    setCourseMinAge(course.min_age);
    setCourseMaxAge(course.max_age);
    setCourseFormError(null);
    setActiveModal('course-form');
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError(null);

    if (!courseName.trim()) {
      setCourseFormError('Inserisci il nome del corso.');
      return;
    }
    if (courseMinAge < 5 || courseMaxAge > 13 || courseMinAge > courseMaxAge) {
      setCourseFormError("L'età deve essere compresa tra 5 e 13 anni.");
      return;
    }

    const duplicate = courses.find(
      c => c.name.toLowerCase() === courseName.trim().toLowerCase() && c.id !== editingCourseId
    );
    if (duplicate) {
      setCourseFormError('Esiste già un corso con questo nome.');
      return;
    }

    if (editingCourseId) {
      setCourses(prev =>
        prev.map(c =>
          c.id === editingCourseId
            ? {
                ...c,
                name: courseName.trim(),
                sport_category: courseSportCategory,
                min_age: courseMinAge,
                max_age: courseMaxAge
              }
            : c
        )
      );
      showToast(`Corso "${courseName.trim()}" modificato!`);
    } else {
      const newCourse: ClubCourse = {
        id: `corso-${crypto.randomUUID()}`,
        clubs_id: club.id,
        name: courseName.trim(),
        sport_category: courseSportCategory,
        min_age: courseMinAge,
        max_age: courseMaxAge,
        motor_tests: [],
        athletes: []
      };
      setCourses(prev => [...prev, newCourse]);
      showToast(`Corso "${newCourse.name}" creato!`);
    }
    setActiveModal('none');
  };

  const handleDeleteCourse = (courseId: string, name: string) => {
    const remaining = courses.filter(c => c.id !== courseId);
    setCourses(remaining);
    if (motorCourseId === courseId) {
      setMotorCourseId(remaining[0]?.id || '');
      setSelectedMotorTestId(remaining[0]?.motor_tests[0]?.id || '');
      setBatchScores({});
    }
    if (psychCourseId === courseId) {
      setPsychCourseId(remaining[0]?.id || '');
      setPsychChildId(remaining[0]?.athletes[0]?.id || '');
    }
    showToast(`Corso "${name}" rimosso.`);
  };

  const openAddAthleteModal = (courseId: string) => {
    setTargetCourseForAthlete(courseId);
    setNewAthleteFirstName('');
    setNewAthleteLastName('');
    setNewAthleteAge(8);
    setNewAthleteFromAthlos(true);
    setActiveModal('add-athlete');
  };

  const handleAddAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseForAthlete || !newAthleteFirstName.trim() || !newAthleteLastName.trim())
      return;

    const birthYear = new Date().getFullYear() - newAthleteAge;
    const newAthlete: Athlete = {
      id: `athlete-${crypto.randomUUID()}`,
      first_name: newAthleteFirstName.trim(),
      last_name: newAthleteLastName.trim(),
      date_of_birth: `${birthYear}-05-15`,
      age: newAthleteAge,
      gender: 'M',
      from_athlos: newAthleteFromAthlos,
      skills: []
    };

    setCourses(prev =>
      prev.map(c =>
        c.id === targetCourseForAthlete ? { ...c, athletes: [...c.athletes, newAthlete] } : c
      )
    );
    setActiveModal('none');
    showToast(`${newAthlete.first_name} ${newAthlete.last_name} aggiunto al corso!`);
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

      {/* Sfondo Superiore Curvo */}
      <div className="absolute top-0 left-0 w-full h-[460px] bg-gradient-to-br from-[#1E2046] via-[#0a254f] to-[#E52B6D] rounded-b-[40px] z-0 overflow-hidden shadow-2xl pointer-events-none">
        <div className="absolute top-20 -left-10 w-96 h-96 bg-[#0055aa] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-10 -right-10 w-96 h-96 bg-[#0088ff] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>

      {/* HEADER */}
      <header className="relative z-10 p-8 sm:px-12 flex flex-wrap justify-between items-center gap-4 text-white">
        <button
          onClick={onLogout}
          className="text-left group cursor-pointer flex flex-col items-start hover:opacity-85 transition-opacity"
        >
          <img src="/logo-light.png" alt="Athlos Logo" className="h-16 w-auto object-contain" />
          <p className="text-sky-200 font-medium text-sm group-hover:text-white transition-colors mt-2">
            Area Centro Sportivo • {club.name}
          </p>
        </button>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <button
            onClick={openCreateCourseModal}
            className="px-5 py-2.5 bg-[#E52B6D] hover:bg-[#FF4F8B] backdrop-blur-md border border-pink-400/40 rounded-full font-bold transition-colors text-sm flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuovo Corso
          </button>
          <button
            onClick={() => {
              setProfileForm(club);
              setGeoQuery('');
              setGeoResults([]);
              setConfirmDeleteClub(false);
              setActiveModal('profile');
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold transition-colors text-sm cursor-pointer"
          >
            Profilo Centro
          </button>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md border border-rose-400/50 rounded-full font-bold transition-colors text-sm text-white cursor-pointer"
          >
            Esci
          </button>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="relative z-10 px-8 sm:px-12 mt-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
              Il Tuo Centro Sportivo
            </h2>
            <p className="text-sky-100 text-lg font-medium">
              Gestisci i corsi, crea i test motori per ogni disciplina e compila la scheda di fine trimestre.
            </p>
          </div>

          {/* Menu delle 3 Sezioni */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex flex-nowrap items-center shrink-0 overflow-x-auto whitespace-nowrap gap-1.5">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-5 py-3 rounded-xl font-black text-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'courses'
                  ? 'bg-white text-[#1E2046] shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 text-[#E52B6D]" />
              I Miei Corsi
            </button>
            <button
              onClick={() => setActiveTab('motor-tests')}
              className={`px-5 py-3 rounded-xl font-black text-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'motor-tests'
                  ? 'bg-white text-[#1E2046] shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-4 h-4 text-[#E52B6D]" />
              Test Motori
            </button>
            <button
              onClick={() => setActiveTab('psych-form')}
              className={`px-5 py-3 rounded-xl font-black text-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'psych-form'
                  ? 'bg-white text-[#1E2046] shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-[#E52B6D]" />
              Form Fine Trimestre
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* =====================================================================
              SEZIONE 1: I MIEI CORSI (TUTTI I BAMBINI + TAG "ATHLOS")
          ===================================================================== */}
          {activeTab === 'courses' && (
            <motion.div
              key="tab-courses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {courses.map((course, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, transition: { duration: 0.2, delay: 0 } }}
                    transition={{ delay: idx * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    key={course.id}
                    className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#E52B6D]/10 hover:shadow-2xl hover:shadow-[#E52B6D]/15 transition-shadow duration-300 border border-sky-50 relative overflow-hidden group flex flex-col justify-between transform-gpu"
                  >
                    {/* Decorazione angolo con z-0 (evita bug di sfarfallio stacking context con -z-10) */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full z-0 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="absolute top-6 right-6 text-5xl opacity-15 select-none pointer-events-none z-0">
                      {getSportEmoji(course.sport_category || course.name)}
                    </div>

                    <div className="relative z-10">
                      {/* Intestazione Corso */}
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                            {getSportEmoji(course.sport_category || course.name)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-sky-100 text-[#E52B6D] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">
                                {course.sport_category} • {course.min_age}-{course.max_age} anni
                              </span>
                              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">
                                {course.motor_tests.length} test configurati
                              </span>
                            </div>
                            <h3 className="text-2xl font-black text-[#1E2046] mt-1.5 leading-tight">
                              {course.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditCourseModal(course)}
                            title="Modifica Corso"
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-[#1E2046] border border-slate-200/80 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id, course.name)}
                            title="Elimina Corso"
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Elenco di tutti i bambini iscritti al corso */}
                      <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#E52B6D]" />
                            Bambini Iscritti ({course.athletes.length})
                          </h4>
                          <button
                            onClick={() => openAddAthleteModal(course.id)}
                            className="text-xs font-black text-[#E52B6D] hover:text-[#1E2046] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> + Aggiungi Bambino
                          </button>
                        </div>

                        {course.athletes.length > 0 ? (
                          <div className="divide-y divide-slate-200/70">
                            {course.athletes.map(athlete => {
                              const tests = childPhysicalTests[athlete.id] || [];
                              const evalRec = evaluations[athlete.id];

                              return (
                                <div
                                  key={athlete.id}
                                  className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#1E2046] text-white font-black flex items-center justify-center text-sm shrink-0">
                                      {athlete.first_name.charAt(0)}
                                      {athlete.last_name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-[#1E2046] text-base">
                                          {athlete.first_name} {athlete.last_name}
                                        </span>
                                        {athlete.from_athlos && (
                                          <span className="px-2.5 py-0.5 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] border border-[#E52B6D]/25 text-[11px] font-black tracking-wide">
                                            Athlos
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mt-0.5">
                                        <span>{athlete.age} anni</span>
                                        <span>•</span>
                                        <span className="text-sky-600 font-bold">
                                          {tests.length} test svolti
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {evalRec && (
                                      <button
                                        onClick={() => {
                                          setAnalysisAthleteId(athlete.id);
                                          setActiveModal('analysis');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#1E2046] font-bold text-xs transition-colors cursor-pointer"
                                      >
                                        Vedi Scheda
                                      </button>
                                    )}
                                    <button
                                      onClick={() => selectChildForPsychForm(course.id, athlete)}
                                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#E52B6D] text-[#1E2046] font-bold text-xs transition-colors cursor-pointer"
                                    >
                                      Valuta
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-slate-400 font-medium mb-3">
                              Nessun bambino ancora iscritto in questo corso.
                            </p>
                            <button
                              onClick={() => openAddAthleteModal(course.id)}
                              className="px-4 py-2 rounded-xl bg-[#1E2046] text-white text-xs font-bold hover:bg-[#E52B6D] transition-colors cursor-pointer"
                            >
                              + Aggiungi Bambino
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pulsante diretto per gestire e registrare i test del corso */}
                    <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
                      <button
                        onClick={() => handleGoToMotorTestForCourse(course.id)}
                        className="w-full py-3 px-4 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Gestisci e Inserisci Test Motori ({course.motor_tests.length})
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* =====================================================================
              SEZIONE 2: TEST MOTORI (SPECIFICI PER OGNI CORSO, PARTENDO DA ZERO)
          ===================================================================== */}
          {activeTab === 'motor-tests' && (
            <motion.div
              key="tab-motor-tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#E52B6D]/10 border border-sky-50">
                <div className="pb-6 border-b border-slate-100">
                  <span className="bg-sky-100 text-[#E52B6D] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Specifici per ogni disciplina
                  </span>
                  <h3 className="text-3xl font-black text-[#1E2046] mt-2">
                    Test Motori del Corso
                  </h3>
                  <p className="text-slate-500 font-medium mt-1">
                    Ogni sport ha le proprie prove. Seleziona il corso, aggiungi i test motori specifici per quella disciplina e inserisci i risultati dei bambini.
                  </p>
                </div>

                {/* PASSO 1: Scelta del Corso */}
                <div className="mt-6">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                    1. Seleziona il Corso
                  </label>
                  <select
                    value={motorCourseId}
                    onChange={e => {
                      const nextCourseId = e.target.value;
                      const nextCourse = courses.find(c => c.id === nextCourseId);
                      setMotorCourseId(nextCourseId);
                      setSelectedMotorTestId(nextCourse?.motor_tests[0]?.id || '');
                      setBatchScores({});
                    }}
                    className="w-full md:w-1/2 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-black text-[#1E2046] text-base focus:outline-none focus:border-[#E52B6D]"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {getSportEmoji(c.sport_category)} {c.name} ({c.sport_category} • {c.min_age}-{c.max_age} anni)
                      </option>
                    ))}
                  </select>
                </div>

                {/* PASSO 2: Gestione e Aggiunta dei Test Motori specifici per questo Corso */}
                <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-[#1E2046]">
                        2. Test Motori di {motorCourse?.name} ({courseMotorTests.length})
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Crea i test specifici per questo corso scegliendo il nome e l'unità di misura.
                      </p>
                    </div>
                  </div>

                  {/* Form per creare un nuovo test motorio per il corso selezionato con misure multiple */}
                  <form
                    onSubmit={handleAddMotorTestToCourse}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
                  >
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Nome del Nuovo Test per {motorCourse?.sport_category || 'questo corso'}
                      </label>
                      <input
                        type="text"
                        placeholder={`Es. Percorso Agilità e Precisione, Salto in Lungo, Prova di ${motorCourse?.sport_category || 'questo sport'}...`}
                        value={newMotorTestName}
                        onChange={e => setNewMotorTestName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[#1E2046] text-sm focus:bg-white focus:outline-none focus:border-[#E52B6D]"
                      />
                    </div>

                    {/* Lista Misure e Unità di Misura del test */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                          Misure / Parametri da rilevare ({newTestMetrics.length})
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setNewTestMetrics(prev => [
                              ...prev,
                              {
                                id: `metric-${prev.length + 1}-${crypto.randomUUID()}`,
                                name: `Misura ${prev.length + 1}`,
                                unit: 'sec'
                              }
                            ])
                          }
                          className="text-xs font-black text-[#E52B6D] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Aggiungi altra misura (con altra unità)
                        </button>
                      </div>

                      <div className="space-y-2">
                        {newTestMetrics.map((metric, idx) => (
                          <div
                            key={metric.id}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                          >
                            <span className="text-xs font-black text-slate-400 w-6 text-center shrink-0">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="Nome misura (es. Tempo, Distanza, Bersagli centrati...)"
                              value={metric.name}
                              onChange={e => {
                                const val = e.target.value;
                                setNewTestMetrics(prev =>
                                  prev.map((m, i) => (i === idx ? { ...m, name: val } : m))
                                );
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-[#1E2046] text-xs focus:outline-none focus:border-[#E52B6D]"
                            />
                            <select
                              value={metric.unit}
                              onChange={e => {
                                const val = e.target.value;
                                setNewTestMetrics(prev =>
                                  prev.map((m, i) => (i === idx ? { ...m, unit: val } : m))
                                );
                              }}
                              className="w-44 px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-[#1E2046] text-xs focus:outline-none focus:border-[#E52B6D] shrink-0"
                            >
                              {STANDARD_UNITS.map(u => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                            {newTestMetrics.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setNewTestMetrics(prev => prev.filter((_, i) => i !== idx))
                                }
                                className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                                title="Rimuovi questa misura"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-6 rounded-xl bg-[#E52B6D] hover:bg-[#1E2046] text-white font-black text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Crea Test Motorio per {motorCourse?.name}
                    </button>
                  </form>

                  {/* Elenco dei test motori già aggiunti a questo corso */}
                  {courseMotorTests.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                          Seleziona quale test compilare ora:
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {courseMotorTests.map(test => {
                          const isSelected = activeCourseTest?.id === test.id;
                          const metrics = getTestMetrics(test);
                          return (
                            <div
                              key={test.id}
                              className={`inline-flex items-center rounded-2xl border transition-colors ${
                                isSelected
                                  ? 'bg-[#1E2046] text-white border-[#1E2046] shadow-md'
                                  : 'bg-white text-[#1E2046] border-slate-200 hover:border-[#E52B6D]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMotorTestId(test.id);
                                  setBatchScores({});
                                  setAddingMetricToTestId(null);
                                }}
                                className="px-4 py-2.5 font-black text-sm flex items-center gap-2 cursor-pointer flex-wrap"
                              >
                                <span>{test.name}</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {metrics.map(m => (
                                    <span
                                      key={m.id}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                                        isSelected
                                          ? 'bg-white/15 text-sky-200'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {m.name}: {m.unit}
                                    </span>
                                  ))}
                                </div>
                              </button>

                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddingMetricToTestId(
                                      addingMetricToTestId === test.id ? null : test.id
                                    )
                                  }
                                  title="Aggiungi un'altra misura a questo test"
                                  className="px-2 py-2 text-xs font-black text-sky-300 hover:text-white flex items-center gap-0.5 cursor-pointer border-l border-white/20"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Misura
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteMotorTestFromCourse(test.id, test.name)}
                                title="Rimuovi test dal corso"
                                className={`pr-3 pl-2 py-2.5 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-white/60 hover:text-rose-300'
                                    : 'text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Box per aggiungere al volo una misura ad un test esistente */}
                      {addingMetricToTestId && (
                        <div className="mt-3 p-3.5 bg-sky-50 rounded-2xl border border-sky-200 flex flex-wrap items-center gap-3">
                          <span className="text-xs font-black text-sky-900">
                            Aggiungi una nuova misura a "{activeCourseTest?.name}":
                          </span>
                          <input
                            type="text"
                            placeholder="Nome misura (es. Tempo, Precisione...)"
                            value={extraMetricName}
                            onChange={e => setExtraMetricName(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 font-bold text-xs text-[#1E2046] focus:outline-none"
                          />
                          <select
                            value={extraMetricUnit}
                            onChange={e => setExtraMetricUnit(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 font-bold text-xs text-[#1E2046] focus:outline-none"
                          >
                            {STANDARD_UNITS.map(u => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddMetricToExistingTest(addingMetricToTestId)}
                            className="px-4 py-1.5 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-black text-xs cursor-pointer transition-colors"
                          >
                            Salva Misura
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingMetricToTestId(null)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                          >
                            Annulla
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-300 text-center">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-black text-[#1E2046]">
                        Nessun test motorio ancora presente per {motorCourse?.name}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Usa il modulo qui sopra per aggiungere il primo test specifico di questo corso.
                      </p>
                    </div>
                  )}
                </div>

                {/* PASSO 3: Inserimento risultati per ciascun bambino (visibile quando c'è almeno un test nel corso) */}
                {activeCourseTest && (
                  <form onSubmit={handleSaveBatchMotorTests} className="mt-8">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-black text-[#1E2046]">
                            3. Risultati dei Bambini — {activeCourseTest.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            Inserisci le misure per ciascun bambino iscritto a{' '}
                            <strong>
                              {motorCourse?.name} ({motorCourse?.min_age}-{motorCourse?.max_age} anni)
                            </strong>
                            : {getTestMetrics(activeCourseTest).map(m => `${m.name} (${m.unit})`).join(' • ')}
                          </p>
                        </div>
                      </div>

                      {motorCourse && motorCourse.athletes.length > 0 ? (
                        <div className="space-y-3">
                          {motorCourse.athletes.map(athlete => {
                            const previousTests = childPhysicalTests[athlete.id] || [];
                            const metrics = getTestMetrics(activeCourseTest);

                            return (
                              <div
                                key={athlete.id}
                                className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs"
                              >
                                <div className="flex items-start sm:items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white font-black flex items-center justify-center text-sm shrink-0">
                                    {athlete.first_name.charAt(0)}
                                    {athlete.last_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-black text-[#1E2046] text-lg">
                                        {athlete.first_name} {athlete.last_name}
                                      </span>
                                      <span className="text-xs font-bold text-slate-400">
                                        ({athlete.age} anni)
                                      </span>
                                      {athlete.from_athlos && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] text-[10px] font-black">
                                          Athlos
                                        </span>
                                      )}
                                    </div>

                                    {previousTests.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {previousTests.map((pt, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#1E2046] text-[11px] font-bold"
                                          >
                                            {pt.test_type}: <strong>{pt.score_value}</strong>{' '}
                                            {pt.unit || ''}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveSinglePhysicalTest(athlete.id, idx)
                                              }
                                              className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                              title="Elimina risultato"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 font-medium mt-1">
                                        Nessun risultato ancora registrato
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Input per ogni misura definita nel test */}
                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                  {metrics.map(metric => {
                                    const key = `${athlete.id}_${metric.id}`;
                                    return (
                                      <div key={metric.id} className="flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                          {metric.name}
                                        </span>
                                        <div className="flex items-stretch w-full sm:w-44">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Valore..."
                                            value={batchScores[key] || ''}
                                            onChange={e =>
                                              setBatchScores(prev => ({
                                                ...prev,
                                                [key]: e.target.value
                                              }))
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-l-xl bg-slate-50 border border-r-0 border-slate-200 focus:bg-white focus:outline-none focus:border-[#E52B6D] font-black text-[#1E2046] text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <div className="px-3 rounded-r-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-[#1E2046] uppercase select-none shrink-0">
                                            {metric.unit}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-slate-400 py-6">
                          Nessun bambino iscritto in questo corso.
                        </p>
                      )}

                      <div className="mt-6 flex justify-end">
                        <button
                          type="submit"
                          className="px-8 py-4 rounded-2xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-black text-base transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Salva Misure di {activeCourseTest.name}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* =====================================================================
              SEZIONE 3: FORM FINE TRIMESTRE (SOLO I CAMPI DEL BACK-END)
          ===================================================================== */}
          {activeTab === 'psych-form' && (
            <motion.div
              key="tab-psych-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Colonna Sinistra: Scelta Corso e Bambino */}
              <div className="lg:col-span-4 bg-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-[#E52B6D]/10 border border-sky-50 h-fit space-y-6">
                <div>
                  <span className="bg-sky-100 text-[#E52B6D] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Valutazione Finale
                  </span>
                  <h3 className="text-2xl font-black text-[#1E2046] mt-2">Scegli il Bambino</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">
                    Seleziona il corso e il bambino per compilare la scheda di fine trimestre.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Corso
                  </label>
                  <select
                    value={psychCourseId}
                    onChange={e => {
                      const newCId = e.target.value;
                      setPsychCourseId(newCId);
                      const found = courses.find(c => c.id === newCId);
                      if (found && found.athletes[0]) {
                        selectChildForPsychForm(newCId, found.athletes[0]);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-black text-[#1E2046] text-sm"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {getSportEmoji(c.sport_category)} {c.name} ({c.min_age}-{c.max_age} anni)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                    Bambini Iscritti ({psychCourse?.athletes.length || 0})
                  </label>
                  {psychCourse?.athletes.map(athlete => {
                    const isSelected = psychAthlete?.id === athlete.id;
                    const isDone = Boolean(evaluations[athlete.id]);
                    return (
                      <button
                        key={athlete.id}
                        type="button"
                        onClick={() => selectChildForPsychForm(psychCourse.id, athlete)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E2046] text-white border-[#1E2046] shadow-lg'
                            : 'bg-slate-50 hover:bg-sky-50 text-[#1E2046] border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#E52B6D] text-white' : 'bg-white text-[#1E2046]'
                            }`}
                          >
                            {athlete.first_name.charAt(0)}
                            {athlete.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm">
                                {athlete.first_name} {athlete.last_name}
                              </span>
                              {athlete.from_athlos && (
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-[#E52B6D]/10 text-[#E52B6D]'
                                  }`}
                                >
                                  Athlos
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[11px] font-bold ${
                                isSelected ? 'text-sky-200' : 'text-slate-400'
                              }`}
                            >
                              {athlete.age} anni • {(childPhysicalTests[athlete.id] || []).length} test
                              motori
                            </div>
                          </div>
                        </div>
                        {isDone && (
                          <CheckCircle2
                            className={`w-5 h-5 shrink-0 ${
                              isSelected ? 'text-emerald-400' : 'text-emerald-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colonna Destra: Form di Fine Trimestre (3 slider + Note dell'Allenatore) */}
              <div className="lg:col-span-8 bg-white rounded-[32px] p-8 shadow-xl shadow-[#E52B6D]/10 border border-sky-50">
                {psychAthlete && psychCourse ? (
                  <form onSubmit={handleSubmitPsychForm} className="space-y-7">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg">
                          {psychAthlete.first_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-sky-100 text-[#E52B6D] px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                              {psychCourse.name}
                            </span>
                            {psychAthlete.from_athlos && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] text-xs font-black">
                                Athlos
                              </span>
                            )}
                          </div>
                          <h3 className="text-3xl font-black text-[#1E2046] mt-1">
                            {psychAthlete.first_name} {psychAthlete.last_name}
                          </h3>
                        </div>
                      </div>

                      {/* Selezione Periodo Semplice: Autunno, Inverno, Primavera */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          Periodo / Trimestre
                        </label>
                        <select
                          value={sessionId}
                          onChange={e => setSessionId(e.target.value)}
                          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-[#1E2046] text-sm focus:outline-none focus:border-[#E52B6D]"
                        >
                          <option value="Autunno">Autunno</option>
                          <option value="Inverno">Inverno</option>
                          <option value="Primavera">Primavera</option>
                        </select>
                      </div>
                    </div>

                    {/* Riepilogo automatico dei Test Motori già svolti dal bambino */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider block">
                          Test Motori svolti da {psychAthlete.first_name} (
                          {(childPhysicalTests[psychAthlete.id] || []).length})
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(childPhysicalTests[psychAthlete.id] || []).length > 0 ? (
                            (childPhysicalTests[psychAthlete.id] || []).map((pt, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#1E2046]"
                              >
                                {pt.test_type}:{' '}
                                <strong className="text-[#E52B6D]">{pt.score_value}</strong>{' '}
                                {pt.unit || ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Nessun test motorio ancora inserito per {psychAthlete.first_name}.
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGoToMotorTestForCourse(psychCourse.id)}
                        className="text-xs font-black text-[#E52B6D] hover:underline cursor-pointer"
                      >
                        + Vai ai Test Motori
                      </button>
                    </div>

                      {/* I 6 Punteggi del Form Trimestrale (scala 0 - 10) */}
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                        Valutazione dell'Allenatore (da 0 a 10)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Creatività e Iniziativa
                            </span>
                            <span className="text-2xl font-black text-[#E52B6D]">
                              {creativityScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={creativityScore}
                            onChange={e => setCreativityScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E52B6D]"
                          />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Spirito di Squadra
                            </span>
                            <span className="text-2xl font-black text-sky-600">
                              {teamworkScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={teamworkScore}
                            onChange={e => setTeamworkScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Gestione Stress e Regole
                            </span>
                            <span className="text-2xl font-black text-amber-500">
                              {stressScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={stressScore}
                            onChange={e => setStressScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Leadership e Influenza
                            </span>
                            <span className="text-2xl font-black text-purple-600">
                              {leadershipScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={leadershipScore}
                            onChange={e => setLeadershipScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Intelligenza Tattica
                            </span>
                            <span className="text-2xl font-black text-emerald-600">
                              {gameReadingScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={gameReadingScore}
                            onChange={e => setGameReadingScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-[#1E2046] uppercase tracking-wider">
                              Coinvolgimento e Grinta
                            </span>
                            <span className="text-2xl font-black text-rose-500">
                              {motivationScore}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={motivationScore}
                            onChange={e => setMotivationScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Note dell'allenatore */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Note dell'Allenatore (Opzionale)
                        </label>
                        <span className="text-xs font-bold text-slate-400">
                          {coachNotes.length}/255
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={255}
                        placeholder="Scrivi qui un commento sul percorso del bambino durante il trimestre..."
                        value={coachNotes}
                        onChange={e => setCoachNotes(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#E52B6D] text-sm font-medium text-[#1E2046]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingEval}
                      className="w-full py-4 bg-gradient-to-r from-[#1E2046] to-[#E52B6D] hover:opacity-95 transition-opacity text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5" />
                      {isSubmittingEval
                        ? 'Salvataggio in corso...'
                        : 'Salva Valutazione di Fine Trimestre'}
                    </button>
                  </form>
                ) : (
                  <p className="text-center text-slate-400 py-12">
                    Seleziona un bambino dalla lista a sinistra per compilare la scheda.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* === MODALI CON ANIMAZIONE FLUIDA === */}
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
              className={`bg-white rounded-[32px] p-8 w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto transform-gpu ${
                activeModal === 'analysis' ? 'max-w-4xl' : 'max-w-xl'
              }`}
            >
              <button
                onClick={() => setActiveModal('none')}
                className="absolute top-6 right-6 text-slate-400 hover:text-[#1E2046] transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* MODALE PROFILO CENTRO SPORTIVO (SEMPLICE E INTUITIVO) */}
              {activeModal === 'profile' && (
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center shadow-md overflow-hidden shrink-0">
                      {profileForm.logo_url ? (
                        <img
                          src={profileForm.logo_url}
                          alt={profileForm.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#1E2046]">Profilo Centro Sportivo</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Informazioni e recapiti della tua struttura
                      </p>
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={handleSaveClubProfile}>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Nome del Centro Sportivo
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={profileForm.email_contact}
                            onChange={e =>
                              setProfileForm({ ...profileForm, email_contact: e.target.value })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
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
                            value={profileForm.phone_number}
                            onChange={e =>
                              setProfileForm({ ...profileForm, phone_number: e.target.value })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        URL Logo Centro (Opzionale)
                      </label>
                      <input
                        type="url"
                        value={profileForm.logo_url || ''}
                        onChange={e => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                        placeholder="https://esempio.it/logo.png"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                      />
                    </div>

                    {/* Sezione Indirizzo semplice e pulita */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#E52B6D]" />
                        Indirizzo del Centro
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={geoQuery}
                          onChange={e => handleGeoSearch(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="Cerca il tuo indirizzo (es. Via Roma 45, Catania)..."
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#E52B6D] text-sm font-medium text-[#1E2046]"
                        />
                      </div>

                      {geoResults.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-100 overflow-hidden">
                          {geoResults.map((g, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectGeoResult(g)}
                              className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <MapPin className="w-4 h-4 text-[#E52B6D] shrink-0" />
                              <span className="text-sm font-bold text-[#1E2046] truncate">
                                {g.display_name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Via e Numero
                          </label>
                          <input
                            type="text"
                            value={profileForm.address.street}
                            onChange={e =>
                              setProfileForm({
                                ...profileForm,
                                address: { ...profileForm.address, street: e.target.value }
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-[#1E2046]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Città
                          </label>
                          <input
                            type="text"
                            value={profileForm.address.city}
                            onChange={e =>
                              setProfileForm({
                                ...profileForm,
                                address: { ...profileForm.address, city: e.target.value }
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-[#1E2046]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Provincia
                          </label>
                          <input
                            type="text"
                            value={profileForm.address.province}
                            onChange={e =>
                              setProfileForm({
                                ...profileForm,
                                address: { ...profileForm.address, province: e.target.value }
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-[#1E2046]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            CAP
                          </label>
                          <input
                            type="text"
                            pattern="\d{5}"
                            value={profileForm.address.postal_code}
                            onChange={e =>
                              setProfileForm({
                                ...profileForm,
                                address: { ...profileForm.address, postal_code: e.target.value }
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-[#1E2046]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 mt-2 bg-[#E52B6D] hover:bg-[#1E2046] transition-colors text-white rounded-xl font-bold text-lg cursor-pointer"
                    >
                      Salva Modifiche
                    </button>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      {!confirmDeleteClub ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteClub(true)}
                          className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Elimina profilo centro sportivo
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-rose-50 p-3 rounded-xl border border-rose-200">
                          <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Confermi l'eliminazione?
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteClub(false)}
                              className="px-3 py-1 rounded-lg bg-white text-slate-600 text-xs font-bold border border-slate-200 cursor-pointer"
                            >
                              Annulla
                            </button>
                            <button
                              type="button"
                              onClick={onLogout}
                              className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Conferma
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* MODALE CREA / MODIFICA CORSO */}
              {activeModal === 'course-form' && (
                <div className="pt-2">
                  <h3 className="text-2xl font-black text-[#1E2046] mb-1">
                    {editingCourseId ? 'Modifica Corso' : 'Nuovo Corso'}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">
                    Inserisci il nome del corso, lo sport e la fascia d'età dei bambini.
                  </p>

                  {courseFormError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                      {courseFormError}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSaveCourse}>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Nome del Corso
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Es. Corso Basket, Pallavolo Pulcini..."
                        value={courseName}
                        onChange={e => setCourseName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Sport
                      </label>
                      <select
                        value={courseSportCategory}
                        onChange={e => setCourseSportCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-bold text-[#1E2046]"
                      >
                        <option value="Basket">🏀 Basket</option>
                        <option value="Pallavolo">🏐 Pallavolo</option>
                        <option value="Calcio">⚽ Calcio</option>
                        <option value="Scherma">🤺 Scherma</option>
                        <option value="Nuoto">🏊 Nuoto</option>
                        <option value="Ginnastica">🤸 Ginnastica</option>
                        <option value="Judo">🥋 Judo / Arti Marziali</option>
                        <option value="Tennis">🎾 Tennis</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Età Minima (5-13 anni)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={13}
                          required
                          value={courseMinAge}
                          onChange={e => setCourseMinAge(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-black text-[#1E2046] text-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Età Massima (5-13 anni)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={13}
                          required
                          value={courseMaxAge}
                          onChange={e => setCourseMaxAge(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-black text-[#1E2046] text-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 mt-4 bg-[#E52B6D] hover:bg-[#1E2046] transition-colors text-white rounded-xl font-bold text-lg cursor-pointer"
                    >
                      {editingCourseId ? 'Salva Corso' : 'Crea Corso'}
                    </button>
                  </form>
                </div>
              )}

              {/* MODALE AGGIUNGI BAMBINO AL CORSO */}
              {activeModal === 'add-athlete' && (
                <div className="pt-2">
                  <h3 className="text-2xl font-black text-[#1E2046] mb-1">
                    Aggiungi Bambino al Corso
                  </h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">
                    Inserisci i dati del bambino iscritto al corso.
                  </p>
                  <form className="space-y-4" onSubmit={handleAddAthlete}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Nome
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Es. Gabriele"
                          value={newAthleteFirstName}
                          onChange={e => setNewAthleteFirstName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                          Cognome
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Es. Bianchi"
                          value={newAthleteLastName}
                          onChange={e => setNewAthleteLastName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-[#1E2046]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Età
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={13}
                        required
                        value={newAthleteAge}
                        onChange={e => setNewAthleteAge(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-black text-[#1E2046]"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAthleteFromAthlos}
                        onChange={e => setNewAthleteFromAthlos(e.target.checked)}
                        className="w-4 h-4 accent-[#E52B6D] rounded"
                      />
                      <span className="text-sm font-bold text-[#1E2046]">
                        Iscritto tramite Athlos (mostra il tag Athlos accanto al nome)
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-4 mt-4 bg-[#E52B6D] hover:bg-[#1E2046] transition-colors text-white rounded-xl font-bold text-lg cursor-pointer"
                    >
                      Aggiungi al Corso
                    </button>
                  </form>
                </div>
              )}

              {/* MODALE SCHEDA PASSAPORTO AI */}
              {activeModal === 'analysis' &&
                analysisAthlete &&
                analysisEval &&
                (() => {
                  const aiData = parseGeminiAnalysis(analysisEval.ai_recommended_sport);
                  const livePhysicalTests =
                    childPhysicalTests[analysisAthlete.id]?.length
                      ? childPhysicalTests[analysisAthlete.id]
                      : analysisEval.physical_tests;
                  return (
                    <div className="pt-2">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2046] to-[#E52B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                              {analysisAthlete.first_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-3xl font-black text-[#1E2046]">
                                  {analysisAthlete.first_name} {analysisAthlete.last_name}
                                </h3>
                                {analysisAthlete.from_athlos && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] text-xs font-black">
                                    Athlos
                                  </span>
                                )}
                              </div>
                              <p className="text-sky-600 font-bold text-sm tracking-wide uppercase">
                                Scheda Fine Trimestre • {analysisEval.trimester_id}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                              Valutazione Trimestrale
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Creatività
                                </div>
                                <div className="text-2xl font-black text-[#E52B6D]">
                                  {analysisEval.creativity_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Squadra
                                </div>
                                <div className="text-2xl font-black text-sky-600">
                                  {analysisEval.teamwork_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Stress
                                </div>
                                <div className="text-2xl font-black text-amber-500">
                                  {analysisEval.stress_management_score}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Leadership
                                </div>
                                <div className="text-2xl font-black text-purple-600">
                                  {analysisEval.leadership_score ?? 7}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Tattica
                                </div>
                                <div className="text-2xl font-black text-emerald-600">
                                  {analysisEval.game_reading_score ?? 7}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 truncate">
                                  Grinta
                                </div>
                                <div className="text-2xl font-black text-rose-500">
                                  {analysisEval.motivation_score ?? 8}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                              Test Motori Svolti ({livePhysicalTests.length})
                            </h4>
                            {livePhysicalTests.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2.5">
                                {livePhysicalTests.map((pt, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex justify-between items-center"
                                  >
                                    <span className="text-xs font-bold text-slate-500">
                                      {pt.test_type}
                                    </span>
                                    <span className="text-sm font-black text-[#1E2046]">
                                      {pt.score_value} {pt.unit || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                Nessun test motorio registrato.
                              </p>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                              Note dell'Allenatore
                            </h4>
                            <div className="bg-[#1E2046] rounded-xl p-5 text-white shadow-inner">
                              <p className="text-sm text-slate-200 font-medium italic">
                                "{analysisEval.coach_notes}"
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6 flex flex-col justify-between">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                Sport Consigliato
                              </h4>
                              <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 flex items-center justify-between">
                                <span className="text-2xl font-black text-[#E52B6D]">
                                  {aiData.sportName}
                                </span>
                                <Brain className="w-8 h-8 text-sky-400" />
                              </div>
                            </div>

                            {aiData.objective && (
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                  Obiettivo di Crescita
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
                                  Consiglio per la Famiglia
                                </h4>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                                  <p className="text-amber-800 font-medium leading-relaxed">
                                    {aiData.tip}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveModal('none')}
                            className="w-full py-3.5 bg-[#1E2046] hover:bg-[#E52B6D] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                          >
                            Chiudi Scheda
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
