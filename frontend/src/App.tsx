import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParentDashboard from './ParentDashboard';
import ClubDashboard from './ClubDashboard';
import {
  loginWithPassword,
  registerParentUser,
  registerClubUser,
  createParentProfile,
  createClubProfile,
  getCurrentUser,
  getAllUsers,
  impersonateUser,
  requestPasswordReset,
  confirmPasswordReset,
  getToken,
  setToken,
  clearToken,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  autocompleteGeo,
  type ApiUserResponse,
  type ApiGeoSearchResult
} from './api';
import { 
  MapPin,
  X,
  ArrowLeft,
  ArrowRight,
  Mail,
  Check,
  Users,
  GraduationCap,
  Trophy,
  Sparkles,
  Clock,
  Compass
} from 'lucide-react';


const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

// Link al questionario 'Passaporto Sportivo' per le famiglie (sostituire con il link reale, es. Typeform, Tally, Google Forms)
const PARENT_FORM_URL = "https://progettoathlos.netlify.app/";

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
  let targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
  if (id === 'top') targetPosition = 0;
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
  // const [selectedTown, setSelectedTown] = useState("Catania");

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authSelection, setAuthSelection] = useState<'none' | 'parent' | 'club'>('none');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('register');

  // STATO DI SESSIONE REALE ('none' | 'parent' | 'club' | 'admin')
  const [isLoggedInAs, setIsLoggedInAs] = useState<'none' | 'parent' | 'club' | 'admin'>('none');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Stato Recupero Password (comune a Genitore e Club)
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Stato Console Admin & Impersonation
  const [adminUsers, setAdminUsers] = useState<ApiUserResponse[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<'all' | 'parent' | 'club'>('all');
  const [impersonatedUser, setImpersonatedUser] = useState<ApiUserResponse | null>(null);
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState(false);

  // Campi Form Login condivisi
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campi Form Registrazione Genitore
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentFiscalCode, setParentFiscalCode] = useState('');
  const [parentStreet, setParentStreet] = useState('');
  const [parentPostalCode, setParentPostalCode] = useState('');
  const [parentCity, setParentCity] = useState('');
  const [parentProvince, setParentProvince] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentReferral, setParentReferral] = useState('');

  // Campi Form Registrazione Club Sportivo
  const [clubRespFirstName, setClubRespFirstName] = useState('');
  const [clubRespLastName, setClubRespLastName] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubPhone, setClubPhone] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [clubStreet, setClubStreet] = useState('');
  const [clubPostalCode, setClubPostalCode] = useState('');
  const [clubCity, setClubCity] = useState('');
  const [clubProvince, setClubProvince] = useState('');
  const [clubLogoUrl, setClubLogoUrl] = useState('');
  const [clubPassword, setClubPassword] = useState('');

  // Autocomplete indirizzi per Genitore e Club
  const [parentGeoResults, setParentGeoResults] = useState<ApiGeoSearchResult[]>([]);
  const [clubGeoResults, setClubGeoResults] = useState<ApiGeoSearchResult[]>([]);

  const handleParentGeoSearch = async (query: string) => {
    setParentStreet(query);
    if (query.trim().length < 2) {
      setParentGeoResults([]);
      return;
    }
    try {
      const results = await autocompleteGeo(query, 5, {
        city: parentCity,
        postal_code: parentPostalCode,
        province: parentProvince
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
    setParentStreet(geo.street || geo.display_name.split(',')[0]?.trim() || '');
    setParentCity(geo.city || '');
    setParentProvince(geo.province ? geo.province.toUpperCase() : '');
    if (geo.postal_code && /^\d{5}$/.test(geo.postal_code)) {
      setParentPostalCode(geo.postal_code);
    }
    setParentGeoResults([]);
  };

  const handleClubGeoSearch = async (query: string) => {
    setClubStreet(query);
    if (query.trim().length < 2) {
      setClubGeoResults([]);
      return;
    }
    try {
      const results = await autocompleteGeo(query, 5, {
        city: clubCity,
        postal_code: clubPostalCode,
        province: clubProvince
      });
      if (results && results.length > 0) {
        setClubGeoResults(results);
        return;
      }
    } catch {
      // Fallback
    }
    setClubGeoResults([]);
  };

  const selectClubGeo = (geo: ApiGeoSearchResult) => {
    setClubStreet(geo.street || geo.display_name.split(',')[0]?.trim() || '');
    setClubCity(geo.city || '');
    setClubProvince(geo.province ? geo.province.toUpperCase() : '');
    if (geo.postal_code && /^\d{5}$/.test(geo.postal_code)) {
      setClubPostalCode(geo.postal_code);
    }
    setClubGeoResults([]);
  };

  const loadAdminUsers = async () => {
    setIsAdminLoading(true);
    try {
      const users = await getAllUsers();
      setAdminUsers(users);
    } catch {
      // Ignora errori se non admin
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Ripristino automatico della sessione al caricamento della pagina se esiste un token JWT valido
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) return;

    getCurrentUser()
      .then(user => {
        if (user.role === 'admin') {
          setIsLoggedInAs('admin');
          loadAdminUsers();
        } else if (user.role === 'club') {
          setIsLoggedInAs('club');
        } else {
          setIsLoggedInAs('parent');
        }
      })
      .catch(() => {
        clearToken();
        clearAdminToken();
      });
  }, []);

  // Intercettore sessione scaduta (401 da backend durante l'uso)
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      clearToken();
      clearAdminToken();
      setImpersonatedUser(null);
      setIsAdminPreviewMode(false);
      setIsLoggedInAs('none');
      setAuthError(
        customEvent.detail?.message || 'La tua sessione è scaduta per inattività. Effettua nuovamente il login.'
      );
      setAuthMode('login');
      setAuthSelection('none');
      setAuthModalOpen(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('athlos-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('athlos-session-expired', handleSessionExpired);
    };
  }, []);

  const openAuth = (selection?: 'none' | 'parent' | 'club', mode: 'login' | 'register' = 'register') => {
    setAuthError(null);
    setAuthSelection(selection || 'none');
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleReturnToAdmin = () => {
    const savedAdminToken = getAdminToken();
    if (savedAdminToken) {
      setToken(savedAdminToken);
      clearAdminToken();
    }
    setImpersonatedUser(null);
    setIsAdminPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsLoggedInAs('admin');
    loadAdminUsers();
  };

  const handleLogout = () => {
    // Se l'Admin stava impersonando un utente o visualizzando un'anteprima, "Esci" riporta alla Console Admin
    if (getAdminToken() || isAdminPreviewMode) {
      handleReturnToAdmin();
      return;
    }
    clearToken();
    clearAdminToken();
    setImpersonatedUser(null);
    setIsAdminPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsLoggedInAs('none');
    setAuthModalOpen(false);
  };

  const handleImpersonate = async (targetUser: ApiUserResponse) => {
    try {
      const currentAdminJwt = getToken();
      if (currentAdminJwt && !getAdminToken()) {
        setAdminToken(currentAdminJwt);
      }
      const tokenRes = await impersonateUser(targetUser.id);
      setToken(tokenRes.access_token);
      setImpersonatedUser(targetUser);
      setIsAdminPreviewMode(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsLoggedInAs(targetUser.role === 'club' ? 'club' : 'parent');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossibile impersonare utente');
    }
  };

  const handleAdminPreviewInterface = (role: 'parent' | 'club') => {
    setIsAdminPreviewMode(true);
    setImpersonatedUser(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsLoggedInAs(role);
  };

  const handleLoginSubmit = async (e: React.FormEvent, expectedRole: 'parent' | 'club') => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await loginWithPassword(loginEmail.trim(), loginPassword);
      const user = await getCurrentUser();
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (user.role === 'admin') {
        clearAdminToken();
        setImpersonatedUser(null);
        setIsAdminPreviewMode(false);
        setIsLoggedInAs('admin');
        loadAdminUsers();
      } else {
        const targetRole = user.role === 'club' ? 'club' : 'parent';
        setIsLoggedInAs(targetRole);
      }
      setAuthModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante il login';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        // Fallback automatico per testare l'interfaccia anche quando il server FastAPI è spento
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsLoggedInAs(expectedRole);
        setAuthModalOpen(false);
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await registerParentUser({
        email: parentEmail.trim(),
        password: parentPassword,
        first_name: parentFirstName.trim(),
        last_name: parentLastName.trim()
      });
      await loginWithPassword(parentEmail.trim(), parentPassword);
      await createParentProfile({
        first_name: parentFirstName.trim(),
        last_name: parentLastName.trim(),
        phone_number: parentPhone.trim(),
        fiscal_code: parentFiscalCode.trim().toUpperCase(),
        address:
          parentStreet.trim() && parentCity.trim() && parentProvince.trim() && parentPostalCode.trim()
            ? {
                street: parentStreet.trim(),
                city: parentCity.trim(),
                province: parentProvince.trim().toUpperCase(),
                postal_code: parentPostalCode.trim(),
                country: 'Italy'
              }
            : null,
        referral_code: parentReferral.trim() || null
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsLoggedInAs('parent');
      setAuthModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante la registrazione';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsLoggedInAs('parent');
        setAuthModalOpen(false);
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await registerClubUser({
        email: clubEmail.trim(),
        password: clubPassword,
        first_name: clubRespFirstName.trim() || clubName.trim(),
        last_name: clubRespLastName.trim() || 'Club'
      });
      await loginWithPassword(clubEmail.trim(), clubPassword);
      await createClubProfile({
        name: clubName.trim(),
        email_contact: clubEmail.trim(),
        phone_number: clubPhone.trim(),
        logo_url: clubLogoUrl.trim() || null,
        address:
          clubStreet.trim() && clubCity.trim() && clubProvince.trim() && clubPostalCode.trim()
            ? {
                street: clubStreet.trim(),
                city: clubCity.trim(),
                province: clubProvince.trim().toUpperCase(),
                postal_code: clubPostalCode.trim(),
                country: 'Italy'
              }
            : null
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsLoggedInAs('club');
      setAuthModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante la registrazione del club';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsLoggedInAs('club');
        setAuthModalOpen(false);
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const openForgotPassword = () => {
    setAuthError(null);
    setAuthSuccess(null);
    setResetEmail(loginEmail.trim());
    setResetToken('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetStep('request');
    setAuthMode('forgot-password');
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      setAuthSuccess(
        res.message ||
          "Se l'indirizzo email è registrato, ti abbiamo inviato un codice/token di recupero."
      );
      setResetStep('confirm');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Errore nella richiesta di recupero password');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (resetNewPassword.length < 8) {
      setAuthError('La nuova password deve contenere almeno 8 caratteri.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError('Le due password non coincidono.');
      return;
    }
    setIsAuthLoading(true);
    try {
      const res = await confirmPasswordReset({
        email: resetEmail,
        token: resetToken,
        new_password: resetNewPassword
      });
      setLoginEmail(resetEmail);
      setLoginPassword('');
      setAuthMode('login');
      setAuthSuccess(
        res.message || 'Password aggiornata con successo! Ora puoi effettuare il login.'
      );
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Codice non valido o scaduto.');
    } finally {
      setIsAuthLoading(false);
    }
  };



  // 1. Data Source: Available Clubs & Courses
  /* 
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
*/

  // 2. Dynamic Recommendation Engine
  // 2. TRUE AI Dynamic Recommendation Engine (Euclidean Distance Algorithm)
  const recommendation: Recommendation = useMemo(() => {
    // 3D Space Sports Database: [Agility(a), Teamwork(t), Discipline(d)]
    const db = [
      { sport: "Ginnastica Artistica", a: 10, t: 2, d: 10, tag: "Perfezione Biomeccanica", tagColor: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200", reason: "Eccelle nel controllo del corpo e nella disciplina rigorosa, preferendo un lavoro individuale." },
      { sport: "Ginnastica Ritmica", a: 9, t: 4, d: 9, tag: "Eleganza e Controllo", tagColor: "bg-pink-50 text-pink-800 border-pink-200", reason: "Movenze armoniche e altissima adesione alle regole, con una minima interazione coordinata." },
      { sport: "Tuffi", a: 10, t: 1, d: 8, tag: "Esplosività e Coraggio", tagColor: "bg-cyan-50 text-cyan-800 border-cyan-200", reason: "Massima reattività isolata, assenza totale di ansia da prestazione di gruppo." },
      { sport: "Arrampicata Sportiva", a: 9, t: 1, d: 6, tag: "Verticalità Istintiva", tagColor: "bg-amber-50 text-amber-800 border-amber-200", reason: "Grande agilità e totale indipendenza. Non ama le classiche regole di campo." },
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
      { sport: "Tennis (Singolare)", a: 8, t: 2, d: 8, tag: "Equilibrio Totale", tagColor: "bg-lime-50 text-lime-800 border-lime-200", reason: "Classico bilanciamento perfetto. Sa stare in campo da solo gestendo la pressione." },
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
         : "Il nostro sistema unisce i risultati pratici alle inclinazioni del bambino, confrontandoli con diverse discipline per suggerire lo sport in cui si divertirà e crescerà di più."
    };
  }, [childName, childAge, agility, teamwork, discipline]);

  const filteredAdminUsers = adminUsers.filter(u => {
    if (adminRoleFilter !== 'all' && u.role !== adminRoleFilter) return false;
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence mode="wait">
      {isLoggedInAs === 'admin' ? (
        <motion.div
          key="admin-console"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen bg-[#F8FAFC] text-[#1E2046] font-sans pb-20"
        >
          {/* HEADER ADMIN */}
          <div className="bg-gradient-to-br from-[#1E2046] via-[#0a254f] to-[#E52B6D] text-white px-6 sm:px-12 py-10 shadow-xl">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Console Sviluppatore & Admin
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Controllo Totale Piattaforma
                </h1>
                <p className="text-sky-200 text-sm font-medium mt-1">
                  Entra in qualsiasi interfaccia o impersona qualsiasi Genitore o Centro Sportivo registrato.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-full font-bold text-sm text-white transition-colors cursor-pointer"
              >
                Esci da Admin
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 sm:px-12 mt-8 space-y-8">
            {/* ACCESSO RAPIDO ANTEPRIMA INTERFACCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#E52B6D]">
                    Accesso Rapido UI
                  </span>
                  <h2 className="text-xl font-black text-[#1E2046] mt-1">
                    Interfaccia Famiglia / Genitore
                  </h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">
                    Apri subito la dashboard genitore anche senza selezionare un account specifico.
                  </p>
                </div>
                <button
                  onClick={() => handleAdminPreviewInterface('parent')}
                  className="px-5 py-3 rounded-2xl bg-[#1E2046] hover:bg-[#2a2d5e] text-white font-bold text-sm shrink-0 transition-colors cursor-pointer flex items-center gap-2"
                >
                  Apri Vista <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-sky-600">
                    Accesso Rapido UI
                  </span>
                  <h2 className="text-xl font-black text-[#1E2046] mt-1">
                    Interfaccia Centro Sportivo
                  </h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">
                    Apri subito la dashboard club anche senza selezionare un account specifico.
                  </p>
                </div>
                <button
                  onClick={() => handleAdminPreviewInterface('club')}
                  className="px-5 py-3 rounded-2xl bg-[#E52B6D] hover:bg-[#c9205b] text-white font-bold text-sm shrink-0 transition-colors cursor-pointer flex items-center gap-2"
                >
                  Apri Vista <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LISTA UTENTI REALE CON IMPERSONATION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1E2046]">
                    Account Registrati nel Database ({adminUsers.length})
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">
                    Clicca su "Entra come questo utente" per generare un token JWT reale e operare nel suo profilo.
                  </p>
                </div>
                <button
                  onClick={loadAdminUsers}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAdminLoading ? 'Aggiornamento...' : 'Aggiorna Lista'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  placeholder="Cerca per nome, cognome o email..."
                  className="flex-1 min-w-[240px] px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] text-sm font-medium"
                />
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {(['all', 'parent', 'club'] as const).map(roleTab => (
                    <button
                      key={roleTab}
                      onClick={() => setAdminRoleFilter(roleTab)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        adminRoleFilter === roleTab
                          ? 'bg-white text-[#1E2046] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {roleTab === 'all' ? 'Tutti' : roleTab === 'parent' ? 'Genitori' : 'Club Sportivi'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAdminUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  Nessun utente trovato con questi filtri.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAdminUsers.map(u => (
                    <div
                      key={u.id}
                      className="py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 px-3 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm ${
                            u.role === 'club'
                              ? 'bg-gradient-to-br from-sky-500 to-blue-700'
                              : u.role === 'admin'
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                              : 'bg-gradient-to-br from-[#1E2046] to-[#E52B6D]'
                          }`}
                        >
                          {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#1E2046]">
                              {u.first_name} {u.last_name}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                u.role === 'club'
                                  ? 'bg-sky-100 text-sky-700'
                                  : u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-pink-100 text-[#E52B6D]'
                              }`}
                            >
                              {u.role === 'club' ? 'Club' : u.role === 'admin' ? 'Admin' : 'Genitore'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleImpersonate(u)}
                          className="px-4 py-2.5 rounded-xl bg-[#1E2046] hover:bg-[#E52B6D] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
                        >
                          Entra come questo {u.role === 'club' ? 'Club' : 'Genitore'}{' '}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : isLoggedInAs === 'parent' ? (
        <motion.div key="parent-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
          <ParentDashboard onLogout={handleLogout} />
          {(impersonatedUser || isAdminPreviewMode || getAdminToken()) && (
            <div className="fixed bottom-5 right-5 z-50 bg-[#1E2046] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-4">
              <div className="text-xs">
                <span className="font-black text-amber-300 uppercase tracking-wider block">
                  Modalità Admin Attiva
                </span>
                <span className="text-slate-200 font-medium">
                  {impersonatedUser
                    ? `Stai operando come: ${impersonatedUser.first_name} ${impersonatedUser.last_name} (${impersonatedUser.email})`
                    : 'Anteprima Interfaccia Genitore'}
                </span>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="px-3.5 py-2 rounded-xl bg-[#E52B6D] hover:bg-[#FF4F8B] text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Torna ad Admin
              </button>
            </div>
          )}
        </motion.div>
      ) : isLoggedInAs === 'club' ? (
        <motion.div key="club-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
          <ClubDashboard onLogout={handleLogout} />
          {(impersonatedUser || isAdminPreviewMode || getAdminToken()) && (
            <div className="fixed bottom-5 right-5 z-50 bg-[#1E2046] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-4">
              <div className="text-xs">
                <span className="font-black text-amber-300 uppercase tracking-wider block">
                  Modalità Admin Attiva
                </span>
                <span className="text-slate-200 font-medium">
                  {impersonatedUser
                    ? `Stai operando come: ${impersonatedUser.first_name} ${impersonatedUser.last_name} (${impersonatedUser.email})`
                    : 'Anteprima Interfaccia Club'}
                </span>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="px-3.5 py-2 rounded-xl bg-[#E52B6D] hover:bg-[#FF4F8B] text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Torna ad Admin
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div key="landing-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-h-screen text-white font-sans antialiased relative selection:bg-[#E52B6D] selection:text-white">
      {/* FIXED CONTINUOUS BACKGROUND */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/bg1.png')" }}></div>
        {/* Dark overlay to ensure text is always readable against the bright pink waves */}
        <div className="absolute inset-0 bg-[#1E2046]/85 backdrop-blur-[2px]"></div>
      </div>

      
      <div id="top" className="absolute top-0 w-full h-1"></div>
      {/* MINIMAL NAVBAR */}
      <header className="fixed top-0 w-full z-40 bg-[#1E2046]/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => customSmoothScrollTo('top')} className="hover:opacity-80 transition-opacity cursor-pointer border-none bg-transparent p-0">
            <img src="/logo-light.png" alt="Athlos Logo" className="h-16 w-auto object-contain" />
          </button>
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-slate-200">
            <a href="#manifesto" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('manifesto'); }} className="hover:text-[#E52B6D] transition-colors">Il Progetto</a>
            <a href="#simulatore" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('simulatore'); }} className="hover:text-[#E52B6D] transition-colors">L'Algoritmo</a>
            <a href="#passaporto-sportivo" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('passaporto-sportivo'); }} className="hover:text-[#E52B6D] transition-colors">Passaporto</a>
            {/* <a href="#vicino-a-te" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('vicino-a-te'); }} className="hover:text-[#E52B6D] transition-colors">Club Vicini</a> */}
            <a href="#club-sportivi" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('club-sportivi'); }} className="hover:text-[#E52B6D] transition-colors">Area Club</a>
            <a href="#benefici" onClick={(e) => { e.preventDefault(); customSmoothScrollTo('benefici'); }} className="hover:text-[#E52B6D] transition-colors">Benefici</a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => openAuth('none', 'login')}
              className="text-[14px] font-bold text-white hover:opacity-70 transition-opacity cursor-pointer"
            >
              Accedi
            </button>
            <button 
              onClick={() => openAuth('none', 'register')}
              className="px-5 py-2.5 rounded-full bg-[#E52B6D] hover:bg-[#FF4F8B] text-white shadow-lg text-[14px] font-bold transition-colors cursor-pointer"
            >
              Registrati
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 px-6 overflow-hidden bg-gradient-to-b from-transparent to-[#1E2046]/40">
        
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-[75px] lg:text-[90px] font-black text-white leading-[0.95] tracking-tighter drop-shadow-sm">
              La piattaforma che consente ai tuoi figli <br/>di trovare lo sport migliore per loro.
            </motion.h1>
            
            <motion.p variants={fadeUp} className="mt-8 text-xl sm:text-2xl text-slate-200 font-medium leading-tight max-w-2xl mx-auto drop-shadow-md text-center">
              Mettiamo in contatto scuole e genitori con i club sportivi locali. I piccoli atleti partecipano ad attività trimestrali. Noi proponiamo le attività che potrebbero essere più di loro interesse
            </motion.p>
            
            {/* 
<motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row items-center gap-4 max-w-xl">
              <div className="flex-1 w-full relative group shadow-sm rounded-full bg-transparent">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-[#E52B6D] transition-colors pointer-events-none" />
                <select 
                  value={selectedTown} 
                  onChange={(e) => setSelectedTown(e.target.value)}
                  className="w-full bg-transparent border-2 border-transparent hover:border-slate-100 rounded-full pl-12 pr-6 py-4 text-lg font-bold text-white appearance-none focus:outline-none focus:border-[#E52B6D] transition-all cursor-pointer"
                >
                  <option value="Catania">Catania</option>
                  <option value="Roma">Roma</option>
                  <option value="Milano">Milano</option>
                </select>
              </div>
              <button 
                onClick={() => customSmoothScrollTo('vicino-a-te')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#E52B6D] hover:bg-[#1E2046] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 group"
              >
                Esplora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
*/}
          </motion.div>
        </div>

        {/* SCROLL INDICATOR */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer hover:text-white group"
          onClick={() => customSmoothScrollTo('manifesto')}
        >
          <span className="text-white/50 group-hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Esplora</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-white transition-colors"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </motion.div>
        </motion.div>
      </section>
      
      {/* MANIFESTO SECTION */}
      
      {/* PUNTO DI PARTENZA */}
      <section id="manifesto" className="relative py-24 sm:py-32 overflow-hidden text-white bg-gradient-to-b from-[#1E2046]/40 via-[#1E2046]/60 to-transparent">
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-150px" }} variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}>
            <div className="inline-block px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-white text-[#1E2046] shadow-xl font-black tracking-[0.2em] text-xl sm:text-3xl uppercase mb-12 transform hover:scale-105 transition-transform">
              Punto di Partenza
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-8">
              L'intuizione di base è che ogni individuo tende a praticare solo ciò a cui è stato esposto...
            </h2>
            <p className="text-xl text-sky-100/80 font-medium leading-relaxed max-w-3xl mx-auto">
              escludendo inconsapevolmente opzioni che potrebbero rivelarsi più adatte alle proprie capacità naturali e attitudini.
            </p>
          </motion.div>
        </div>
      </section>

      {/* PROBLEMI */}
      <section className="relative py-24 sm:py-32 overflow-hidden text-white bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-150px" }} variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-lg">Gli Ostacoli Attuali</h2>
            <p className="mt-4 text-xl text-slate-200 font-medium drop-shadow-md">Le barriere che limitano il potenziale sportivo italiano.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { t: "Mancanza di esposizione", d: "La scelta sportiva è fortemente condizionata da tradizione culturale e familiare: molti talenti rimangono inespressi." },
              { t: "Scuola e sport separati", d: "Le scuole non offrono reali opportunità di sperimentare discipline diverse in maniera stabile." },
              { t: "Disparità territoriali", d: "Nel Nord Italia si pratica più sport rispetto al Sud." },
              { t: "Danni economici e sociali", d: "La mancata diversificazione dello sport riduce numero di praticanti e indotto economico legato ad ogni disciplina." }
            ].map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, transition: { duration: 0.2, delay: 0 } }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white p-8 sm:p-10 rounded-[32px] shadow-xl shadow-slate-900/15 hover:shadow-2xl transition-shadow duration-300 group transform-gpu"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#f4f8fc] text-[#E52B6D] flex items-center justify-center text-2xl font-black mb-6 group-hover:bg-[#E52B6D] group-hover:text-white transition-colors">
                  {i+1}
                </div>
                <h3 className="text-2xl font-black text-[#1E2046] mb-4">{p.t}</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">{p.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VISIONE E MISSIONE */}
      <section className="relative py-24 sm:py-32 overflow-hidden text-white bg-gradient-to-b from-transparent via-[#1E2046]/60 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-center gap-10 sm:gap-16 mb-24"
          >
            <div className="w-full md:w-1/3">
              <h2 className="text-6xl sm:text-7xl font-black text-[#E52B6D] tracking-tighter opacity-90 drop-shadow-xl leading-none">01</h2>
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mt-[-10px] relative z-10">La Nostra<br/>Visione</h3>
            </div>
            <div className="w-full md:w-2/3">
              <p className="text-xl sm:text-2xl text-slate-200 font-medium leading-relaxed drop-shadow-md">
                Creare una generazione in cui <strong className="text-white drop-shadow-md">ogni bambino abbia la possibilità di scoprire e sviluppare il proprio talento sportivo, senza barriere.</strong> Un futuro in cui lo sport sia accessibile, diversificato e integrato nell'educazione, contribuendo allo sviluppo di nuove industrie e alla crescita economica del territorio.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row-reverse items-center gap-10 sm:gap-16"
          >
            <div className="w-full md:w-1/3 md:text-right">
              <h2 className="text-6xl sm:text-7xl font-black text-[#E52B6D] tracking-tighter opacity-90 drop-shadow-xl leading-none">02</h2>
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mt-[-10px] relative z-10">La Nostra<br/>Missione</h3>
            </div>
            <div className="w-full md:w-2/3 md:text-right">
              <p className="text-xl sm:text-2xl text-slate-200 font-medium leading-relaxed drop-shadow-md">
                <strong className="text-white drop-shadow-md">Migliorare l'offerta educativa scolastica</strong> esponendo i bambini a una vasta gamma di sport, individuare i loro talenti e promuovere l'attività sportiva a livello nazionale evitando la limitazione a sport tradizionali, che fa perdere preziose opportunità di crescita personale ed economica.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SIMULATOR */}
      <section id="simulatore" className="relative py-24 sm:py-32 overflow-hidden text-white bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
              Oltre i semplici gol.
            </h2>
            <p className="mt-6 text-lg text-slate-200 font-medium max-w-xl drop-shadow-md">
              La nostra tecnologia, unita all'esperienza degli istruttori, suggerisce ai tuoi figli il prossimo sport da provare sulla base delle proprie inclinazioni.
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
                   <h3 className="text-xl font-bold text-white">Test Fisici e Motori</h3>
                   <span className="text-3xl font-black text-sky-400">{agility}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={agility}
                   onChange={(e) => setAgility(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-sky-400 hover:accent-[#1E2046] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-200 font-bold uppercase tracking-widest">
                   <span>(Es. Scatto, Salto)</span>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                   <h3 className="text-xl font-bold text-white">Creatività e Gruppo</h3>
                   <span className="text-3xl font-black text-[#E52B6D]">{teamwork}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={teamwork}
                   onChange={(e) => setTeamwork(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#E52B6D] hover:accent-[#1E2046] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-200 font-bold uppercase tracking-widest">
                   <span>(Form Trimestrale)</span>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                   <h3 className="text-xl font-bold text-white">Gestione Stress/Regole</h3>
                   <span className="text-3xl font-black text-amber-400">{discipline}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" value={discipline}
                   onChange={(e) => setDiscipline(Number(e.target.value))}
                   className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-400 hover:accent-[#1E2046] transition-all"
                 />
                 <div className="flex justify-between text-xs text-slate-200 font-bold uppercase tracking-widest">
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
               <div className="relative bg-white rounded-[2rem] p-8 sm:p-12 shadow-2xl border border-slate-100 min-h-[420px] flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={recommendation.sport}
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -8 }}
                     transition={{ duration: 0.18, ease: "easeOut" }}
                     className="space-y-8 transform-gpu"
                   >
                     <div>
                       <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${recommendation.tagColor} mb-4 transition-colors`}>
                         {recommendation.tag}
                       </span>
                       <h4 className="text-3xl sm:text-4xl font-black text-[#1E2046] leading-tight tracking-tight transition-all">
                         {recommendation.sport}
                       </h4>
                       <p className="mt-3 text-sm text-slate-500 font-medium">
                         Elaborazione AI basata su parametri biomeccanici e attitudinali
                       </p>
                     </div>
                     
                     <div className="space-y-6">
                       <div>
                         <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Osservazione Tecnica</h5>
                         <p className="text-lg text-slate-700 leading-relaxed font-medium">
                           {recommendation.reason}
                         </p>
                       </div>
                       <div className="pt-6 border-t border-slate-100">
                         <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nota per la Famiglia</h5>
                         <p className="text-xl text-[#1E2046] leading-relaxed font-bold">
                           "{recommendation.parentTip}"
                         </p>
                       </div>
                       <div className="pt-4 border-t border-slate-200">
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                           <strong className="text-slate-600">Avvertenza:</strong> Athlos raccoglie un insieme di osservazioni qualificate sul campo per aiutarti a orientarti verso lo sport più adatto. La piattaforma non produce né sostituisce alcuna diagnosi medica o psicologica professionale.
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
      {/* VICINO A TE HIDDEN TEMPORARILY 
<section id="vicino-a-te" ...
      </section>
*/}

      {/* PASSAPORTO SPORTIVO - FORM GENITORI */}
      <section id="passaporto-sportivo" className="relative py-24 sm:py-32 text-white bg-gradient-to-b from-transparent via-[#081812]/80 to-transparent overflow-hidden">
        {/* Glow decorative orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-[#cbe859]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* LEFT COLUMN: Narrative & Benefits */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-8"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#cbe859] text-xs sm:text-sm font-black tracking-wider uppercase">
                <Sparkles className="w-4 h-4 text-[#cbe859]" />
                <span>Passaporto Sportivo • Per Famiglie</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
                Dalla simulazione<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-[#cbe859] to-lime-300">
                  alla realtà.
                </span>
              </h2>

              <p className="text-lg text-slate-300 font-medium leading-relaxed">
                Hai visto come lavora il nostro algoritmo nel simulatore. Ora bastano <strong>6 veloci risposte</strong> per generare la prima mappatura attitudinale di tuo figlio e assicurargli l'accesso prioritario ai corsi pilota della tua città.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#cbe859]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Solo 60 secondi</h4>
                    <p className="text-slate-400 text-sm font-medium">Sei domande veloci ed intuitive, completabili comodamente da smartphone.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#cbe859]">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Profilo sportivo su misura</h4>
                    <p className="text-slate-400 text-sm font-medium">L'AI analizza predisposizioni motorie, spirito di squadra e gestione delle regole.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#cbe859]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Lista d'attesa prioritaria</h4>
                    <p className="text-slate-400 text-sm font-medium">Entri con precedenza nella prima fase di sperimentazione attiva nella tua città.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <a 
                  href={PARENT_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#cbe859] to-lime-400 text-[#0c231a] hover:from-white hover:to-white font-black text-lg transition-all shadow-xl shadow-lime-500/15 hover:shadow-lime-500/30 hover:scale-105 active:scale-95 group"
                >
                  <span>Compila il questionario (60s)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <span className="text-xs text-slate-400 font-medium">
                  ✓ 100% Gratuito • Nessun impegno
                </span>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Realistic Interactive Preview of the Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-6 flex justify-center"
            >
              <div className="w-full max-w-sm sm:max-w-md relative group">
                {/* Ambient dynamic glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-[#cbe859]/25 to-teal-500/20 rounded-[42px] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Form Screen Mockup */}
                <div className="relative rounded-[36px] bg-[#0c231a] border border-emerald-700/40 p-7 sm:p-9 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[490px]">
                  {/* Subtle Grid texture */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}
                  />

                  {/* Top Bar: Athlos. + Progress bar */}
                  <div className="relative z-10 flex items-center justify-between gap-4 pb-6">
                    <div className="text-2xl font-black text-white tracking-tight">
                      Athlos<span className="text-[#cbe859]">.</span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 max-w-[170px] justify-end">
                      <div className="h-1.5 bg-white/10 rounded-full flex-1 overflow-hidden">
                        <div className="h-full w-2 bg-[#cbe859]/60 rounded-full" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 shrink-0">0/6</span>
                    </div>
                  </div>

                  {/* Body Content from user's screen */}
                  <div className="relative z-10 py-6 space-y-4">
                    <span className="inline-block text-xs font-black tracking-widest text-[#cbe859] uppercase">
                      PASSAPORTO SPORTIVO
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                      Scopri lo sport giusto per tuo figlio in 60 secondi
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
                      Sei domande veloci, nessun impegno. Alla fine ricevi il profilo sportivo del tuo bambino e puoi entrare nella lista d'attesa della fase pilota nella tua città.
                    </p>
                  </div>

                  {/* Action Button styled identically to user's screen */}
                  <div className="relative z-10 pt-4">
                    <a 
                      href={PARENT_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-6 rounded-2xl bg-[#cbe859] hover:bg-[#d8f566] text-[#0c231a] font-black text-base sm:text-lg text-center transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 hover:scale-[1.02] active:scale-[0.99] group/btn"
                    >
                      <span>Prova il primo suggerimento AI</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                    <p className="text-center text-[11px] text-emerald-200/50 font-medium mt-3 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#cbe859]" />
                      <span>Fase pilota attiva su Catania</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CLUBS SECTION */}
      <section id="club-sportivi" className="relative py-24 sm:py-32 text-white bg-gradient-to-b from-transparent to-[#1E2046]/90 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#E52B6D] rounded-full pointer-events-none transform-gpu"
        />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="inline-block px-5 py-2 rounded-full bg-[#E52B6D]/15 border border-[#E52B6D]/30 text-[#FF4F8B] text-xs sm:text-sm font-black uppercase tracking-wider mb-6">
              Per i centri sportivi
            </span>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.95]">
              I test che fai,<br/>valorizzati.
            </h2>
            <p className="mt-8 text-xl text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
              Un'area gestionale dove inserire i test fisici settimanali e un form caratteriale veloce a fine trimestre. L'AI fa il resto.
            </p>
            <div className="mt-10">
              <button 
                onClick={() => openAuth('club', 'register')}
                className="px-8 py-4 rounded-full bg-[#1E2046] border border-white/20 text-white hover:bg-[#E52B6D] hover:border-[#E52B6D] hover:text-white font-black text-lg transition-all shadow-xl hover:scale-105"
              >
                Registra il tuo Club
              </button>
            </div>
          </motion.div>
        </div>

        {/* 
          Recensione Salvo R. - rimossa temporaneamente in attesa di una recensione verificata:
          <div className="bg-transparent/5 border border-slate-100 p-10 sm:p-12 rounded-[2rem] backdrop-blur-md">
            <p className="text-2xl text-slate-200 font-bold leading-tight italic">
              "Ora i genitori vedono i risultati scritti di tutti quegli esercizi sulla rapidità e attenzione che facciamo in campo. Hanno smesso di chiederci solo quanti gol hanno fatto."
            </p>
            <div className="mt-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#E52B6D] flex items-center justify-center font-black text-xl">
                S
              </div>
              <div>
                <div className="text-lg font-black">Salvo R.</div>
                <div className="text-slate-200 font-bold text-sm">Responsabile Scuola Calcio</div>
              </div>
            </div>
          </div>
        */}
      </section>

      {/* BENEFICI SECTION */}
      <section id="benefici" className="relative py-24 sm:py-32 text-white bg-gradient-to-b from-[#1E2046]/90 via-[#1E2046] to-[#1E2046] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <span className="inline-block px-5 py-2 rounded-full bg-[#E52B6D]/15 border border-[#E52B6D]/30 text-[#FF4F8B] text-xs sm:text-sm font-black uppercase tracking-wider mb-6">
              I Benefici di Athlos
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-lg leading-tight">
              Un valore per tutto l'ecosistema.
            </h2>
            <p className="mt-6 text-xl text-slate-200 font-medium max-w-2xl mx-auto drop-shadow-md">
              Scuole, società sportive e famiglie: una sinergia completa per orientare e valorizzare i giovani atleti.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* PER LE FAMIGLIE */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.2, delay: 0 } }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl transition-shadow duration-300 flex flex-col h-full border border-slate-100 group transform-gpu"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f4f8fc] text-[#E52B6D] flex items-center justify-center mb-6 group-hover:bg-[#E52B6D] group-hover:text-white transition-colors">
                <Users className="w-7 h-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#E52B6D] mb-2 block">
                Famiglie & Atleti
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1E2046] tracking-tight mb-6">
                Per le Famiglie
              </h3>
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    Offre un programma in cui i bambini sperimentano discipline diverse, acquisendone i valori oltre che le abilità
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    L'AI propone i prossimi step basandosi solo sulle attitudini dei piccoli atleti
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    Permette ai bambini di trovare la disciplina che più apprezzano
                  </p>
                </li>
              </ul>
            </motion.div>

            {/* PER LE SCUOLE */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.2, delay: 0 } }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl transition-shadow duration-300 flex flex-col h-full border border-slate-100 group transform-gpu"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f4f8fc] text-[#E52B6D] flex items-center justify-center mb-6 group-hover:bg-[#E52B6D] group-hover:text-white transition-colors">
                <GraduationCap className="w-7 h-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#E52B6D] mb-2 block">
                Istituti Scolastici
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1E2046] tracking-tight mb-6">
                Per le Scuole
              </h3>
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    Offre la possibilità di inserire il programma come attività extracurriculare, migliorando l'offerta formativa
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    Esenta la scuola da qualunque attività burocratica, totalmente gestite da Athlos
                  </p>
                </li>
              </ul>
            </motion.div>

            {/* PER I CLUB SPORTIVI */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.2, delay: 0 } }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl transition-shadow duration-300 flex flex-col h-full border border-slate-100 group transform-gpu"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f4f8fc] text-[#E52B6D] flex items-center justify-center mb-6 group-hover:bg-[#E52B6D] group-hover:text-white transition-colors">
                <Trophy className="w-7 h-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#E52B6D] mb-2 block">
                Società Sportive
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1E2046] tracking-tight mb-6">
                Per i Club Sportivi
              </h3>
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E52B6D]/10 text-[#E52B6D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                    Offre l'accesso a una clientela aggiuntiva, diversificata e continua nel tempo
                  </p>
                </li>
              </ul>
            </motion.div>

          </div>
        </div>
      </section>

            {/* FOOTER */}
      <footer className="py-12 text-center border-t border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <button onClick={() => customSmoothScrollTo('top')} className="mb-6 inline-block hover:opacity-80 transition-opacity cursor-pointer border-none bg-transparent p-0">
            <img src="/logo-light.png" alt="Athlos Logo" className="h-16 w-auto object-contain" />
          </button>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10">
            <a href="https://instagram.com/athlos.it" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-[#1E2046]/10 text-white hover:border-[#E52B6D] hover:text-[#E52B6D] hover:bg-transparent/5 transition-all group font-bold shadow-sm">
              <InstagramIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>@athlos.it</span>
            </a>
            
            <a href="https://www.facebook.com/profile.php?id=61570873401132&sk=directory_intro" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-[#1E2046]/10 text-white hover:border-[#E52B6D] hover:text-[#E52B6D] hover:bg-transparent/5 transition-all group font-bold shadow-sm">
              <FacebookIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Athlos</span>
            </a>
            
            <a href="mailto:progetto.athlos@gmail.com" className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-[#1E2046]/10 text-white hover:border-[#E52B6D] hover:text-[#E52B6D] hover:bg-transparent/5 transition-all group font-bold shadow-sm">
              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>progetto.athlos@gmail.com</span>
            </a>
          </div>

          <p className="text-slate-300 font-medium text-sm">
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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex flex-col md:flex-row w-full h-full bg-[#1E2046]/95 backdrop-blur-xl overflow-y-auto md:overflow-hidden"
          >
            
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="fixed md:absolute top-6 right-6 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-[#1E2046] shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {authSelection !== 'none' && (
                <motion.button 
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setAuthSelection('none')}
                  className="fixed md:absolute top-6 left-6 z-[100] px-5 py-3 rounded-full bg-white border border-slate-200 text-[#1E2046] shadow-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> Indietro
                </motion.button>
              )}
            </AnimatePresence>

            {/* LEFT HALF: PARENT */}
            <motion.div
              animate={{
                flexBasis: authSelection === 'none' ? "50%" : authSelection === 'parent' ? "100%" : "0%",
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`relative min-h-[50vh] md:h-full bg-transparent flex flex-col items-center justify-center cursor-pointer overflow-hidden group border-b md:border-b-0 md:border-r border-slate-100/20 py-16 md:py-0 ${
                authSelection === 'club' ? 'hidden md:flex md:pointer-events-none' : 'flex'
              }`}
              onClick={() => authSelection === 'none' && setAuthSelection('parent')}
            >
              <div className="absolute inset-0 bg-transparent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <motion.div 
                animate={{ opacity: authSelection === 'club' ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full max-w-lg lg:max-w-xl px-6 sm:px-8 text-center"
              >
                <AnimatePresence mode="wait">
                  {authSelection === 'none' && (
                    <motion.div key="parent-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} className="w-full">
                      <div className="bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 lg:p-14 border border-slate-100 shadow-2xl group-hover:border-[#E52B6D]/50 group-hover:shadow-[0_25px_60px_-15px_rgba(229,43,109,0.3)] transition-all duration-300 transform group-hover:-translate-y-2">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#f4f8fc] text-[#E52B6D] flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:bg-[#E52B6D] group-hover:text-white transition-colors duration-300 shadow-sm">
                          <Users className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-[#1E2046] mb-6 sm:mb-8 text-center tracking-tight">Genitore</h2>
                        <ul className="text-left space-y-4 sm:space-y-5 text-slate-600 font-bold text-base sm:text-lg">
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E52B6D] mt-2 shrink-0"></div>
                            <span>Conosci i club del territorio</span>
                          </li>
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E52B6D] mt-2 shrink-0"></div>
                            <span>Iscrivi i tuoi figli alle attività</span>
                          </li>
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E52B6D] mt-2 shrink-0"></div>
                            <span>Ottieni i suggerimenti personalizzati</span>
                          </li>
                        </ul>
                        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-100 flex items-center justify-between text-[#1E2046] font-black text-sm sm:text-base group-hover:text-[#E52B6D] transition-colors">
                          <span>Accedi o Registrati</span>
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1E2046]/5 flex items-center justify-center group-hover:bg-[#E52B6D] group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {authSelection === 'parent' && (
                    <motion.div 
                      key={authMode}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-4"
                    >
                      <div className="p-8 sm:p-10 bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl text-left cursor-default max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {authError && (
                          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                            {authError}
                          </div>
                        )}
                        {authSuccess && (
                          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
                            {authSuccess}
                          </div>
                        )}
                        
                        {authMode === 'register' ? (
                          <form onSubmit={handleRegisterParentSubmit}>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-4">Crea account famiglia</h3>
                            <div className="flex gap-3 mb-3">
                              <input type="text" required value={parentFirstName} onChange={e => setParentFirstName(e.target.value)} placeholder="Nome" className="w-1/2 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                              <input type="text" required value={parentLastName} onChange={e => setParentLastName(e.target.value)} placeholder="Cognome" className="w-1/2 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            </div>
                            <div className="flex gap-3 mb-3">
                              <input type="tel" required value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="Telefono" className="w-1/2 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                              <input type="text" required value={parentFiscalCode} onChange={e => setParentFiscalCode(e.target.value.toUpperCase())} placeholder="Codice Fiscale" className="w-1/2 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800 uppercase" />
                            </div>

                            {/* Indirizzo Unificato per Genitore */}
                            <div className="relative mb-3">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#E52B6D]" /> Via e Numero Civico
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  value={parentStreet}
                                  onChange={e => handleParentGeoSearch(e.target.value)}
                                  placeholder="Scrivi via, civico e città (es. Via Imperia 25, San Giovanni la Punta)..."
                                  className="w-full px-4 py-3 pl-9 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800 text-sm"
                                />
                                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                              </div>
                              {parentGeoResults.length > 0 && (
                                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
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

                            <div className="grid grid-cols-6 gap-2.5 mb-3">
                              <input type="text" required value={parentCity} onChange={e => setParentCity(e.target.value)} placeholder="Città" className="col-span-3 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                              <input type="text" required pattern="\d{5}" value={parentPostalCode} onChange={e => setParentPostalCode(e.target.value)} placeholder="CAP" className="col-span-2 px-3 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                              <input type="text" required minLength={2} maxLength={2} value={parentProvince} onChange={e => setParentProvince(e.target.value.toUpperCase())} placeholder="Prov" className="col-span-1 px-2 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800 uppercase text-center" />
                            </div>
                            <input type="email" required value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="Indirizzo Email" className="w-full mb-3 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            <input type="password" required minLength={8} value={parentPassword} onChange={e => setParentPassword(e.target.value)} placeholder="Scegli una password (min. 8 caratteri)" className="w-full mb-3 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            <input type="text" value={parentReferral} onChange={e => setParentReferral(e.target.value)} placeholder="Codice Invito (Opzionale)" className="w-full mb-5 px-4 py-3 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                              {isAuthLoading ? 'Registrazione in corso...' : 'Registrati ora'}
                            </button>
                            <p className="mt-5 text-sm text-center text-slate-500 font-medium">
                              Hai già un account? <span className="text-[#E52B6D] font-bold cursor-pointer hover:underline" onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('login'); }}>Accedi</span>
                            </p>
                          </form>
                        ) : authMode === 'login' ? (
                          <form onSubmit={(e) => handleLoginSubmit(e, 'parent')}>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-6">Bentornato</h3>
                            <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Indirizzo Email" className="w-full mb-4 px-5 py-4 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" className="w-full mb-2 px-5 py-4 rounded-xl bg-transparent border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800" />
                            <div className="flex justify-end mb-5">
                              <button
                                type="button"
                                onClick={openForgotPassword}
                                className="text-xs font-bold text-[#E52B6D] hover:underline cursor-pointer"
                              >
                                Password dimenticata?
                              </button>
                            </div>
                            <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#1E2046] hover:bg-[#E52B6D] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                              {isAuthLoading ? 'Accesso in corso...' : 'Accedi'}
                            </button>
                            <p className="mt-6 text-sm text-center text-slate-500 font-medium">
                              Non hai un account? <span className="text-[#E52B6D] font-bold cursor-pointer hover:underline" onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('register'); }}>Registrati</span>
                            </p>
                          </form>
                        ) : (
                          <div>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-2">Recupera Password</h3>
                            {resetStep === 'request' ? (
                              <form onSubmit={handleForgotPasswordRequest}>
                                <p className="text-sm text-slate-500 font-medium mb-5">
                                  Inserisci l'indirizzo email del tuo account. Ti invieremo un codice di sicurezza per scegliere una nuova password.
                                </p>
                                <input
                                  type="email"
                                  required
                                  value={resetEmail}
                                  onChange={e => setResetEmail(e.target.value)}
                                  placeholder="La tua email registrata"
                                  className="w-full mb-4 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800"
                                />
                                <button
                                  type="submit"
                                  disabled={isAuthLoading}
                                  className="w-full py-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-base cursor-pointer"
                                >
                                  {isAuthLoading ? 'Invio in corso...' : 'Invia Codice di Recupero'}
                                </button>
                                <div className="mt-4 flex items-center justify-between text-xs font-bold">
                                  <button
                                    type="button"
                                    onClick={() => { setAuthError(null); setAuthSuccess(null); setResetStep('confirm'); }}
                                    className="text-slate-500 hover:text-[#1E2046] cursor-pointer"
                                  >
                                    Ho già un codice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('login'); }}
                                    className="text-[#E52B6D] hover:underline cursor-pointer"
                                  >
                                    Torna al Login
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <form onSubmit={handleResetPasswordConfirm}>
                                <p className="text-sm text-slate-500 font-medium mb-4">
                                  Inserisci il codice ricevuto via email e scegli la tua nuova password.
                                </p>
                                <input
                                  type="email"
                                  required
                                  value={resetEmail}
                                  onChange={e => setResetEmail(e.target.value)}
                                  placeholder="Indirizzo Email"
                                  className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800"
                                />
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  required
                                  value={resetToken}
                                  onChange={e => setResetToken(e.target.value)}
                                  placeholder="Codice a 6 cifre ricevuto via email (es. 482910)"
                                  className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-mono font-bold tracking-widest text-center text-lg text-slate-800"
                                />
                                <input
                                  type="password"
                                  required
                                  minLength={8}
                                  value={resetNewPassword}
                                  onChange={e => setResetNewPassword(e.target.value)}
                                  placeholder="Nuova Password (min. 8 caratteri)"
                                  className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800"
                                />
                                <input
                                  type="password"
                                  required
                                  minLength={8}
                                  value={resetConfirmPassword}
                                  onChange={e => setResetConfirmPassword(e.target.value)}
                                  placeholder="Conferma Nuova Password"
                                  className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800"
                                />
                                <button
                                  type="submit"
                                  disabled={isAuthLoading}
                                  className="w-full py-4 bg-[#1E2046] hover:bg-[#E52B6D] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-base cursor-pointer"
                                >
                                  {isAuthLoading ? 'Aggiornamento...' : 'Salva Nuova Password'}
                                </button>
                                <div className="mt-4 flex items-center justify-between text-xs font-bold">
                                  <button
                                    type="button"
                                    onClick={() => { setAuthError(null); setAuthSuccess(null); setResetStep('request'); }}
                                    className="text-slate-500 hover:text-[#1E2046] cursor-pointer"
                                  >
                                    Richiedi nuovo codice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('login'); }}
                                    className="text-[#E52B6D] hover:underline cursor-pointer"
                                  >
                                    Torna al Login
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
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
                flexBasis: authSelection === 'none' ? "50%" : authSelection === 'club' ? "100%" : "0%",
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`relative min-h-[50vh] md:h-full bg-[#1E2046] flex flex-col items-center justify-center cursor-pointer overflow-hidden group py-16 md:py-0 ${
                authSelection === 'parent' ? 'hidden md:flex md:pointer-events-none' : 'flex'
              }`}
              onClick={() => { if (authSelection === 'none') { setAuthError(null); setAuthSelection('club'); } }}
            >
              <div className="absolute inset-0 bg-[#E52B6D]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <motion.div 
                animate={{ opacity: authSelection === 'parent' ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full max-w-lg lg:max-w-xl px-6 sm:px-8 text-center"
              >
                <AnimatePresence mode="wait">
                  {authSelection === 'none' && (
                    <motion.div key="club-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} className="w-full">
                      <div className="bg-[#E52B6D] text-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 lg:p-14 shadow-2xl group-hover:border-[#FF4F8B]/50 group-hover:shadow-[0_25px_60px_-15px_rgba(255,79,139,0.5)] transition-all duration-300 transform group-hover:-translate-y-2 border border-transparent">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white/15 text-white flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:bg-white group-hover:text-[#E52B6D] transition-colors duration-300 shadow-sm">
                          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 sm:mb-8 text-center tracking-tight">Club Sportivo</h2>
                        <ul className="text-left space-y-4 sm:space-y-5 text-pink-50 font-bold text-base sm:text-lg">
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-white mt-2 shrink-0"></div>
                            <span>Fatti conoscere dai nuovi clienti</span>
                          </li>
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-white mt-2 shrink-0"></div>
                            <span>Analizza le nuove iscrizioni</span>
                          </li>
                          <li className="flex items-start gap-3 sm:gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-white mt-2 shrink-0"></div>
                            <span>Visualizza i test</span>
                          </li>
                        </ul>
                        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/20 flex items-center justify-between text-white font-black text-sm sm:text-base">
                          <span>Accedi o Affiliati</span>
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white group-hover:text-[#E52B6D] transition-all">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {authSelection === 'club' && (
                    <motion.div 
                      key={authMode}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-4"
                    >
                      <div className="p-8 sm:p-10 bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl text-left cursor-default max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {authError && (
                          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                            {authError}
                          </div>
                        )}
                        {authSuccess && (
                          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
                            {authSuccess}
                          </div>
                        )}
                        
                        {authMode === 'register' ? (
                          <form onSubmit={handleRegisterClubSubmit}>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-4">Affilia la tua Società</h3>
                            <div className="flex gap-3 mb-3">
                              <input type="text" required value={clubRespFirstName} onChange={e => setClubRespFirstName(e.target.value)} placeholder="Nome Resp." className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                              <input type="text" required value={clubRespLastName} onChange={e => setClubRespLastName(e.target.value)} placeholder="Cognome Resp." className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            </div>
                            <input type="text" required value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Nome Società Sportiva" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            <div className="flex gap-3 mb-3">
                              <input type="tel" required value={clubPhone} onChange={e => setClubPhone(e.target.value)} placeholder="Telefono Club" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                              <input type="email" required value={clubEmail} onChange={e => setClubEmail(e.target.value)} placeholder="Email ufficiale" className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            </div>
                            {/* Indirizzo Unificato per Club */}
                            <div className="relative mb-3">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#E52B6D]" /> Sede della Società (Via e Civico)
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  value={clubStreet}
                                  onChange={e => handleClubGeoSearch(e.target.value)}
                                  placeholder="Scrivi via, civico e città della struttura..."
                                  className="w-full px-4 py-3 pl-9 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#E52B6D] font-medium text-slate-800 text-sm"
                                />
                                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                              </div>
                              {clubGeoResults.length > 0 && (
                                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                                  {clubGeoResults.map((g, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => selectClubGeo(g)}
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

                            <div className="grid grid-cols-6 gap-2.5 mb-3">
                              <input type="text" required value={clubCity} onChange={e => setClubCity(e.target.value)} placeholder="Città" className="col-span-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                              <input type="text" required pattern="\d{5}" value={clubPostalCode} onChange={e => setClubPostalCode(e.target.value)} placeholder="CAP" className="col-span-2 px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                              <input type="text" required minLength={2} maxLength={2} value={clubProvince} onChange={e => setClubProvince(e.target.value.toUpperCase())} placeholder="Prov" className="col-span-1 px-2 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium uppercase text-center" />
                            </div>
                            <input type="url" value={clubLogoUrl} onChange={e => setClubLogoUrl(e.target.value)} placeholder="Link Logo Società (Opzionale, es. https://...)" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            <input type="password" required minLength={8} value={clubPassword} onChange={e => setClubPassword(e.target.value)} placeholder="Scegli una password (min. 8 caratteri)" className="w-full mb-5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                              {isAuthLoading ? 'Affiliazione in corso...' : 'Richiedi Affiliazione'}
                            </button>
                            <p className="mt-5 text-sm text-center text-slate-500 font-medium">
                              Già affiliato? <span className="text-[#E52B6D] font-bold cursor-pointer hover:underline" onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('login'); }}>Accedi al gestionale</span>
                            </p>
                          </form>
                        ) : authMode === 'login' ? (
                          <form onSubmit={(e) => handleLoginSubmit(e, 'club')}>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-6">Area Riservata Club</h3>
                            <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Indirizzo Email" className="w-full mb-4 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" className="w-full mb-2 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium" />
                            <div className="flex justify-end mb-5">
                              <button
                                type="button"
                                onClick={openForgotPassword}
                                className="text-xs font-bold text-slate-500 hover:text-[#E52B6D] transition-colors cursor-pointer"
                              >
                                Password dimenticata?
                              </button>
                            </div>
                            <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#1E2046] hover:bg-[#E52B6D] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                              {isAuthLoading ? 'Accesso in corso...' : 'Accedi'}
                            </button>
                            <p className="mt-6 text-sm text-center text-slate-500 font-medium">
                              Nuova società? <span className="text-[#E52B6D] font-bold cursor-pointer hover:underline" onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('register'); }}>Affiliati ad Athlos</span>
                            </p>
                          </form>
                        ) : (
                          <div>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-2">Recupera Password Club</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                              {resetStep === 'request'
                                ? 'Inserisci l\'email ufficiale del tuo club per ricevere il codice di recupero.'
                                : 'Inserisci il codice ricevuto via email e scegli la nuova password.'}
                            </p>
                            {resetStep === 'request' ? (
                              <form onSubmit={handleForgotPasswordRequest}>
                                <input
                                  type="email"
                                  required
                                  value={resetEmail}
                                  onChange={e => setResetEmail(e.target.value)}
                                  placeholder="Email ufficiale Club"
                                  className="w-full mb-5 px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium"
                                />
                                <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#E52B6D] hover:bg-[#1E2046] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                                  {isAuthLoading ? 'Invio in corso...' : 'Invia Codice di Recupero'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setAuthError(null); setAuthSuccess(null); setResetStep('confirm'); }}
                                  className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-[#1E2046] transition-colors cursor-pointer"
                                >
                                  Hai già un codice? Inseriscilo qui
                                </button>
                              </form>
                            ) : (
                              <form onSubmit={handleResetPasswordConfirm}>
                                <input
                                  type="email"
                                  required
                                  value={resetEmail}
                                  onChange={e => setResetEmail(e.target.value)}
                                  placeholder="Email ufficiale Club"
                                  className="w-full mb-3 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium text-sm"
                                />
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  required
                                  value={resetToken}
                                  onChange={e => setResetToken(e.target.value)}
                                  placeholder="Codice a 6 cifre ricevuto via email (es. 482910)"
                                  className="w-full mb-3 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-mono font-bold tracking-widest text-center text-lg"
                                />
                                <input
                                  type="password"
                                  required
                                  minLength={8}
                                  value={resetNewPassword}
                                  onChange={e => setResetNewPassword(e.target.value)}
                                  placeholder="Nuova Password (min. 8 caratteri)"
                                  className="w-full mb-3 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium text-sm"
                                />
                                <input
                                  type="password"
                                  required
                                  minLength={8}
                                  value={resetConfirmPassword}
                                  onChange={e => setResetConfirmPassword(e.target.value)}
                                  placeholder="Conferma Nuova Password"
                                  className="w-full mb-5 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E52B6D] font-medium text-sm"
                                />
                                <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#1E2046] hover:bg-[#E52B6D] disabled:opacity-60 transition-colors text-white rounded-xl font-bold text-lg cursor-pointer">
                                  {isAuthLoading ? 'Aggiornamento...' : 'Salva Nuova Password'}
                                </button>
                              </form>
                            )}
                            <p className="mt-5 text-sm text-center text-slate-500 font-medium">
                              <span className="text-[#E52B6D] font-bold cursor-pointer hover:underline" onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('login'); }}>← Torna al Login</span>
                            </p>
                          </div>
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
