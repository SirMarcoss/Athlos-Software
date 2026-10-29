// Client HTTP centralizzato per collegare il Front-End React al Back-End FastAPI

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_STORAGE_KEY = 'athlos_token';
const ADMIN_TOKEN_STORAGE_KEY = 'athlos_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

// === TIPI CONDIVISI ALLINEATI AGLI SCHEMI PYDANTIC DEL BACK-END ===

export interface ApiAddress {
  street: string;
  number?: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface ApiUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'parent' | 'club' | 'admin';
  created_at: string;
}

export interface ApiParentCreate {
  first_name: string;
  last_name: string;
  phone_number: string;
  fiscal_code: string;
  info?: string | null;
  address?: ApiAddress | null;
  referral_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ApiParentResponse extends ApiParentCreate {
  id: string;
  user_id: string;
}

export interface ApiChildCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  sport: string;
  skills: string[];
  fiscal_code: string;
  medical_notes?: string | null;
  info?: string | null;
}

export interface ApiChildResponse extends ApiChildCreate {
  id: string;
  parent_id: string;
}

export interface ApiClubCreate {
  name: string;
  email_contact: string;
  address?: ApiAddress | null;
  phone_number: string;
  logo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ApiClubResponse extends ApiClubCreate {
  id: string;
  user_id: string;
  stripe_account_id?: string | null;
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
}

export interface ApiCourseCreate {
  name: string;
  min_age: number;
  max_age: number;
  price_cents?: number;
  max_participants?: number | null;
  billing_period?: 'trimestrale' | 'mensile' | 'annuale' | 'quota_unica';
}

export interface ApiCourseResponse extends ApiCourseCreate {
  id: string;
  clubs_id: string;
  distance_km?: number | null;
  enrolled_count?: number;
}

export type PaymentLifecycleStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface ApiStripeConnectStatus {
  stripe_account_id: string | null;
  account_type: 'standard' | 'express';
  onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  fiscal_code_or_vat?: string | null;
  iban_last4?: string | null;
  requirements_due: string[];
}

export interface ApiCheckoutSessionRequest {
  course_id: string;
  child_id: string;
}

export interface ApiCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
  payment_id: string;
  expires_at?: string;
}

export interface ApiPaymentRecord {
  id: string;
  parent_id: string;
  parent_name?: string;
  parent_fiscal_code?: string;
  parent_email?: string;
  child_id: string;
  child_name: string;
  child_fiscal_code: string;
  course_id: string;
  course_name: string;
  club_id: string;
  club_name: string;
  club_fiscal_code?: string;
  amount_cents: number;
  currency: string;
  billing_period?: string;
  status: PaymentLifecycleStatus;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id?: string | null;
  stripe_event_id?: string | null;
  receipt_number?: string;
  created_at: string;
  completed_at?: string | null;
}

export interface ApiPhysicalTestCreate {
  test_type: string;
  score_value: number;
}

export interface ApiPhysicalTestResponse extends ApiPhysicalTestCreate {
  id: string;
  course_id: string;
  child_id: string;
  trimester_id: string;
  date: string;
}

export interface ApiPsychologicalFormCreate {
  creativity_score: number;
  teamwork_score: number;
  stress_management_score: number;
  leadership_score?: number;
  game_reading_score?: number;
  motivation_score?: number;
}

export interface ApiPsychologicalFormResponse extends ApiPsychologicalFormCreate {
  id: string;
  course_id: string;
  child_id: string;
  trimester_id: string;
  coach_notes?: string | null;
  date: string;
  ai_recommended_sport?: string | null;
}

export interface ApiEvaluationSessionCreate {
  session_id: string;
  physical_tests: ApiPhysicalTestCreate[];
  psychological_form: ApiPsychologicalFormCreate;
  coach_notes?: string | null;
}

export interface ApiEvaluationSessionResponse {
  session_id: string;
  child_id: string;
  physical_tests_saved: number;
  psychological_form_id: string;
  ai_recommendation?: string | null;
}

export interface ApiGeoSearchResult {
  display_name: string;
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// === FUNZIONE BASE FETCH CON GESTIONE JWT ED ERRORI FASTAPI ===

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (!(options.body instanceof URLSearchParams) && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    // Intercetta la scadenza del token o autenticazione invalida (401), escludendo il form di login stesso
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearToken();
      clearAdminToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('athlos-session-expired', {
            detail: {
              message: 'La tua sessione è scaduta per inattività. Effettua nuovamente il login.'
            }
          })
        );
      }
    }

    let errorMessage = `Errore del server (${response.status})`;
    try {
      const errBody = await response.json();
      if (typeof errBody.detail === 'string') {
        errorMessage = errBody.detail;
      } else if (Array.isArray(errBody.detail) && errBody.detail.length > 0) {
        errorMessage = errBody.detail
          .map((item: { msg?: string; loc?: string[] }) => item.msg || 'Dato non valido')
          .join(', ');
      }
    } catch {
      // Nessun JSON nel body di errore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// === 1. ENDPOINT AUTENTICAZIONE (/auth) ===

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string }> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const data = await apiFetch<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body: formData
  });

  setToken(data.access_token);
  return data;
}

export async function registerParentUser(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<ApiUserResponse> {
  return apiFetch<ApiUserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function registerClubUser(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<ApiUserResponse> {
  return apiFetch<ApiUserResponse>('/auth/register-club', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getCurrentUser(): Promise<ApiUserResponse> {
  return apiFetch<ApiUserResponse>('/auth/me');
}

export async function getAllUsers(): Promise<ApiUserResponse[]> {
  return apiFetch<ApiUserResponse[]>('/auth/users');
}

export async function impersonateUser(
  userId: string
): Promise<{ access_token: string; token_type: string }> {
  return apiFetch<{ access_token: string; token_type: string }>(`/auth/impersonate/${userId}`, {
    method: 'POST'
  });
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() })
  });
}

export async function confirmPasswordReset(payload: {
  email: string;
  token: string;
  new_password: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim(),
      token: payload.token.trim(),
      new_password: payload.new_password
    })
  });
}

// === 2. ENDPOINT GENITORE (/parent) ===

export async function createParentProfile(payload: ApiParentCreate): Promise<ApiParentResponse> {
  return apiFetch<ApiParentResponse>('/parent/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getMyParentProfile(): Promise<ApiParentResponse> {
  return apiFetch<ApiParentResponse>('/parent/me');
}

export async function updateMyParentProfile(
  payload: Partial<ApiParentCreate>
): Promise<ApiParentResponse> {
  return apiFetch<ApiParentResponse>('/parent/me', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function getMyReferral(): Promise<{ referral_code: string; link: string }> {
  return apiFetch<{ referral_code: string; link: string }>('/parent/me/referral');
}

export async function getMyNearbyClubs(): Promise<ApiClubResponse[]> {
  return apiFetch<ApiClubResponse[]>('/parent/me/nearby-clubs');
}

// === 3. ENDPOINT FIGLI (/child) ===

export async function getMyChildren(): Promise<ApiChildResponse[]> {
  return apiFetch<ApiChildResponse[]>('/child/');
}

export async function createChild(payload: ApiChildCreate): Promise<ApiChildResponse> {
  return apiFetch<ApiChildResponse>('/child/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateChild(
  childId: string,
  payload: Partial<ApiChildCreate>
): Promise<ApiChildResponse> {
  return apiFetch<ApiChildResponse>(`/child/${childId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteChild(childId: string): Promise<void> {
  return apiFetch<void>(`/child/${childId}`, {
    method: 'DELETE'
  });
}

export async function getChildByFiscalCode(fiscalCode: string): Promise<ApiChildResponse> {
  return apiFetch<ApiChildResponse>(
    `/child/by-fiscal-code/${encodeURIComponent(fiscalCode.trim().toUpperCase())}`
  );
}

// === 4. ENDPOINT CLUB SPORTIVO (/club) ===

export async function createClubProfile(payload: ApiClubCreate): Promise<ApiClubResponse> {
  return apiFetch<ApiClubResponse>('/club/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getMyClubProfile(): Promise<ApiClubResponse> {
  return apiFetch<ApiClubResponse>('/club/me');
}

export async function updateMyClubProfile(
  payload: Partial<ApiClubCreate>
): Promise<ApiClubResponse> {
  return apiFetch<ApiClubResponse>('/club/me', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteMyClubProfile(): Promise<void> {
  return apiFetch<void>('/club/me', {
    method: 'DELETE'
  });
}

// === 5. ENDPOINT CORSI (/courses) ===

export async function getCatalogCourses(params?: {
  latitude?: number;
  longitude?: number;
  max_distance_km?: number;
}): Promise<ApiCourseResponse[]> {
  const searchParams = new URLSearchParams();
  if (params?.latitude !== undefined) searchParams.set('latitude', String(params.latitude));
  if (params?.longitude !== undefined) searchParams.set('longitude', String(params.longitude));
  if (params?.max_distance_km !== undefined)
    searchParams.set('max_distance_km', String(params.max_distance_km));

  const qs = searchParams.toString();
  return apiFetch<ApiCourseResponse[]>(`/courses/${qs ? `?${qs}` : ''}`);
}

export async function getMyClubCourses(): Promise<ApiCourseResponse[]> {
  return apiFetch<ApiCourseResponse[]>('/courses/my');
}

export async function createClubCourse(payload: ApiCourseCreate): Promise<ApiCourseResponse> {
  return apiFetch<ApiCourseResponse>('/courses/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateClubCourse(
  courseId: string,
  payload: Partial<ApiCourseCreate>
): Promise<ApiCourseResponse> {
  return apiFetch<ApiCourseResponse>(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteClubCourse(courseId: string): Promise<void> {
  return apiFetch<void>(`/courses/${courseId}`, {
    method: 'DELETE'
  });
}

export async function getCourseAthletes(courseId: string): Promise<ApiChildResponse[]> {
  return apiFetch<ApiChildResponse[]>(`/courses/${courseId}/athletes`);
}

export async function enrollAthleteInCourse(
  courseId: string,
  childId: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/courses/${courseId}/athletes/${childId}`, {
    method: 'POST'
  });
}

export async function unenrollAthleteFromCourse(
  courseId: string,
  childId: string
): Promise<void> {
  return apiFetch<void>(`/courses/${courseId}/athletes/${childId}`, {
    method: 'DELETE'
  });
}

// === 6. ENDPOINT VALUTAZIONI AI (/evaluations) ===

export async function submitEvaluationSession(
  courseId: string,
  childId: string,
  payload: ApiEvaluationSessionCreate
): Promise<ApiEvaluationSessionResponse> {
  return apiFetch<ApiEvaluationSessionResponse>(
    `/evaluations/course/${courseId}/child/${childId}/session`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function getChildEvaluations(
  childId: string
): Promise<ApiPsychologicalFormResponse[]> {
  return apiFetch<ApiPsychologicalFormResponse[]>(`/evaluations/child/${childId}`);
}

export async function getChildPhysicalTests(
  childId: string
): Promise<ApiPhysicalTestResponse[]> {
  return apiFetch<ApiPhysicalTestResponse[]>(`/evaluations/child/${childId}/physical`);
}

export async function getCourseEvaluations(
  courseId: string
): Promise<ApiPsychologicalFormResponse[]> {
  return apiFetch<ApiPsychologicalFormResponse[]>(`/evaluations/course/${courseId}`);
}

export async function getCoursePhysicalTests(
  courseId: string
): Promise<ApiPhysicalTestResponse[]> {
  return apiFetch<ApiPhysicalTestResponse[]>(`/evaluations/course/${courseId}/physical`);
}

export async function sendEvaluationEmail(
  evaluationId: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/evaluations/${evaluationId}/send-email`, {
    method: 'POST'
  });
}

// === 7. ENDPOINT GEOLOCALIZZAZIONE (/geo) ===

const ITALIAN_PROVINCE_MAP: Record<string, string> = {
  agrigento: 'AG', alessandria: 'AL', ancona: 'AN', aosta: 'AO', "valle d'aosta": 'AO',
  arezzo: 'AR', 'ascoli piceno': 'AP', asti: 'AT', avellino: 'AV', bari: 'BA',
  'barletta-andria-trani': 'BT', belluno: 'BL', benevento: 'BN', bergamo: 'BG',
  biella: 'BI', bologna: 'BO', bolzano: 'BZ', bozen: 'BZ', brescia: 'BS',
  brindisi: 'BR', cagliari: 'CA', caltanissetta: 'CL', campobasso: 'CB',
  caserta: 'CE', catania: 'CT', catanzaro: 'CZ', chieti: 'CH', como: 'CO',
  cosenza: 'CS', cremona: 'CR', crotone: 'KR', cuneo: 'CN', enna: 'EN',
  fermo: 'FM', ferrara: 'FE', firenze: 'FI', foggia: 'FG', 'forlì-cesena': 'FC',
  'forli-cesena': 'FC', frosinone: 'FR', genova: 'GE', gorizia: 'GO', grosseto: 'GR',
  imperia: 'IM', isernia: 'IS', "l'aquila": 'AQ', 'la spezia': 'SP', latina: 'LT',
  lecce: 'LE', lecco: 'LC', livorno: 'LI', lodi: 'LO', lucca: 'LU',
  macerata: 'MC', mantova: 'MN', 'massa-carrara': 'MS', 'massa carrara': 'MS',
  matera: 'MT', messina: 'ME', milano: 'MI', modena: 'MO', 'monza e della brianza': 'MB',
  'monza e brianza': 'MB', monza: 'MB', napoli: 'NA', novara: 'NO', nuoro: 'NU',
  oristano: 'OR', padova: 'PD', palermo: 'PA', parma: 'PR', pavia: 'PV',
  perugia: 'PG', 'pesaro e urbino': 'PU', 'pesaro-urbino': 'PU', pescara: 'PE',
  piacenza: 'PC', pisa: 'PI', pistoia: 'PT', pordenone: 'PN', potenza: 'PZ',
  prato: 'PO', ragusa: 'RG', ravenna: 'RA', 'reggio calabria': 'RC',
  'reggio di calabria': 'RC', 'reggio emilia': 'RE', "reggio nell'emilia": 'RE',
  rieti: 'RI', rimini: 'RN', roma: 'RM', rovigo: 'RO', salerno: 'SA',
  sassari: 'SS', savona: 'SV', siena: 'SI', siracusa: 'SR', sondrio: 'SO',
  'sud sardegna': 'SU', 'gallura nord-est sardegna': 'SS', taranto: 'TA', teramo: 'TE',
  terni: 'TR', torino: 'TO', trapani: 'TP', trento: 'TN', treviso: 'TV',
  trieste: 'TS', udine: 'UD', varese: 'VA', venezia: 'VE', 'verbano-cusio-ossola': 'VB',
  vercelli: 'VC', verona: 'VR', 'vibo valentia': 'VV', vicenza: 'VI', viterbo: 'VT'
};

function toProvinceCode(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw.trim();
  if (/^[A-Za-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();
  let lower = cleaned.toLowerCase();
  for (const prefix of ['provincia di ', 'città metropolitana di ', 'libero consorzio comunale di ']) {
    if (lower.startsWith(prefix)) {
      lower = lower.slice(prefix.length).trim();
    }
  }
  if (ITALIAN_PROVINCE_MAP[lower]) return ITALIAN_PROVINCE_MAP[lower];
  for (const [name, code] of Object.entries(ITALIAN_PROVINCE_MAP)) {
    if (lower.includes(name)) return code;
  }
  return cleaned.slice(0, 2).toUpperCase();
}

let activeGeoAbortController: AbortController | null = null;

function parseArcGisSuggestionText(
  rawText: string,
  userHouseNumber?: string
): { street: string; postal_code: string; city: string; province: string; display_name: string } | null {
  const parts = rawText
    .split(',')
    .map(p => p.trim())
    .filter(p => p && p.toUpperCase() !== 'ITA' && p.toLowerCase() !== 'italia');

  if (parts.length < 2) return null;

  let street = parts[0];
  if (userHouseNumber && !/\b\d+[a-zA-Z]?\b/.test(street)) {
    street = `${street} ${userHouseNumber}`.trim();
  }

  let postal = '';
  let city = '';
  let rawProvince = '';

  if (/^\d{5}$/.test(parts[1])) {
    postal = parts[1];
    city = parts[2] || '';
    rawProvince = parts[3] || city;
  } else {
    city = parts[1] || '';
    rawProvince = parts[2] || city;
  }

  const provCode = toProvinceCode(rawProvince || city);
  let cityPart = postal ? `${postal} ${city}`.trim() : city;
  if (provCode) cityPart = `${cityPart} (${provCode})`.trim();

  const displayName =
    street && cityPart && street.toLowerCase() !== city.toLowerCase()
      ? `${street} — ${cityPart}`
      : rawText;

  return {
    street,
    postal_code: postal,
    city,
    province: provCode,
    display_name: displayName
  };
}

export async function autocompleteGeo(
  query: string,
  limit = 5,
  context?: { city?: string; postal_code?: string; province?: string }
): Promise<ApiGeoSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Annulla immediatamente qualsiasi richiesta precedente in corso (elimina race condition tra tasti)
  if (activeGeoAbortController) {
    activeGeoAbortController.abort();
  }
  const controller = new AbortController();
  activeGeoAbortController = controller;

  // Estrae l'eventuale numero civico digitato dall'utente (es. "25" o "14A") per preservarlo
  const houseMatch = trimmed.match(/\b(\d{1,4}[a-zA-Z]?)\b/);
  const userHouseNum = houseMatch && houseMatch[1].length < 5 ? houseMatch[1] : undefined;

  // Estrae le parole chiave principali della via (escludendo "via", "viale", "piazza", numeri)
  const stopWords = new Set(['via', 'viale', 'piazza', 'corso', 'largo', 'vicolo', 'contrada', 'strada', 'san', 'santa', 'de', 'di', 'del', 'della']);
  const streetTokens = trimmed
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !/^\d+$/.test(w) && !stopWords.has(w));

  try {
    // 1. Ricerca diretta sulla stringa digitata dall'utente (filtrata rigorosamente su category=Address)
    const directUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=${encodeURIComponent(
      trimmed
    )}&category=Address&countryCode=ITA&f=json&maxSuggestions=${limit}`;

    const requests: Promise<Response>[] = [fetch(directUrl, { signal: controller.signal })];

    // Se l'utente ha scritto solo il nome della via (es. "Via Roma 10") e nel form c'è già un CAP/Città,
    // eseguiamo in parallelo anche una ricerca contestuale verificando che il nome della via combaci
    const hasContext = Boolean(context?.postal_code?.trim() || context?.city?.trim());
    if (hasContext) {
      const ctxStr = [context?.postal_code?.trim(), context?.city?.trim()].filter(Boolean).join(' ');
      if (ctxStr && !trimmed.toLowerCase().includes((context?.city || '___').trim().toLowerCase())) {
        const ctxUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=${encodeURIComponent(
          `${trimmed}, ${ctxStr}`
        )}&category=Address&countryCode=ITA&f=json&maxSuggestions=3`;
        requests.push(fetch(ctxUrl, { signal: controller.signal }));
      }
    }

    const responses = await Promise.allSettled(requests);
    if (controller.signal.aborted) return [];

    const directSuggestions: Array<{ text: string; magicKey?: string }> = [];
    const contextSuggestions: Array<{ text: string; magicKey?: string }> = [];

    if (responses[0]?.status === 'fulfilled' && responses[0].value.ok) {
      const d0 = await responses[0].value.json();
      directSuggestions.push(...(d0.suggestions || []));
    }
    if (responses[1]?.status === 'fulfilled' && responses[1].value.ok) {
      const d1 = await responses[1].value.json();
      for (const s of d1.suggestions || []) {
        const firstPart = (s.text || '').split(',')[0].toLowerCase();
        // Accetta il suggerimento contestuale SOLO se la via contiene effettivamente la parola cercata
        if (streetTokens.length === 0 || streetTokens.some(tok => firstPart.includes(tok))) {
          contextSuggestions.push(s);
        }
      }
    }

    // Unisce i risultati mettendo in cima eventuali match esatti del comune attuale, poi i match diretti
    const combined = [...contextSuggestions, ...directSuggestions];
    const seen = new Set<string>();
    const results: ApiGeoSearchResult[] = [];

    for (const s of combined) {
      const parsed = parseArcGisSuggestionText(s.text, userHouseNum);
      if (!parsed) continue;
      const key = `${parsed.street.toLowerCase()}|${parsed.postal_code}|${parsed.city.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        display_name: parsed.display_name,
        street: parsed.street,
        city: parsed.city,
        province: parsed.province,
        postal_code: parsed.postal_code,
        country: 'Italia'
      });
      if (results.length >= limit) break;
    }

    if (results.length > 0) {
      return results;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return [];
  }

  return [];
}

// === 8. ENDPOINT PAGAMENTI STRIPE (/payments) & FALLBACK SIMULATO PRE-BACKEND ===

export interface LocalCoursePricingMeta {
  price_cents: number;
  max_participants: number;
  billing_period: 'trimestrale' | 'mensile' | 'annuale' | 'quota_unica';
  sport_category?: string;
}

const COURSE_PRICING_STORAGE_KEY = 'athlos_course_pricing_map';
const CLUB_STRIPE_STORAGE_KEY = 'athlos_club_stripe_map';
const PAYMENTS_LEDGER_STORAGE_KEY = 'athlos_payments_ledger';
const LOCAL_ENROLLMENTS_STORAGE_KEY = 'athlos_local_course_enrollments';

export function formatEuroFromCents(cents: number | undefined | null): string {
  const safeCents = typeof cents === 'number' && !isNaN(cents) ? cents : 15000;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(safeCents / 100);
}

export function formatBillingPeriodLabel(
  period?: 'trimestrale' | 'mensile' | 'annuale' | 'quota_unica' | string | null
): string {
  switch (period) {
    case 'mensile':
      return 'Mensile';
    case 'annuale':
      return 'Annuale';
    case 'quota_unica':
      return 'Quota Unica';
    case 'trimestrale':
    default:
      return 'Trimestrale';
  }
}

export function formatPaymentStatusLabel(
  status?: PaymentLifecycleStatus | string | null
): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'Pagato';
    case 'PENDING':
      return 'In attesa';
    case 'FAILED':
      return 'Non riuscito';
    case 'REFUNDED':
      return 'Rimborsato';
    case 'EXPIRED':
      return 'Annullato';
    case 'DISPUTED':
      return 'Contestato';
    case 'DRAFT':
      return 'In corso';
    default:
      return status || 'In corso';
  }
}

export function getSavedCoursePricing(courseId: string): LocalCoursePricingMeta {
  try {
    const raw = localStorage.getItem(COURSE_PRICING_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, LocalCoursePricingMeta>;
      if (map[courseId]) return map[courseId];
    }
  } catch {
    // ignore
  }
  return {
    price_cents: 15000, // Default 150,00 €
    max_participants: 20,
    billing_period: 'trimestrale'
  };
}

export function saveCoursePricing(courseId: string, meta: LocalCoursePricingMeta): void {
  try {
    const raw = localStorage.getItem(COURSE_PRICING_STORAGE_KEY);
    const map: Record<string, LocalCoursePricingMeta> = raw ? JSON.parse(raw) : {};
    map[courseId] = meta;
    localStorage.setItem(COURSE_PRICING_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getSavedClubStripeStatus(clubId?: string): ApiStripeConnectStatus {
  const key = clubId || 'default_club';
  try {
    const raw = localStorage.getItem(CLUB_STRIPE_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, ApiStripeConnectStatus>;
      if (map[key]) return map[key];
      if (map['default_club']) return map['default_club'];
    }
  } catch {
    // ignore
  }
  return {
    stripe_account_id: 'acct_1AthlosStdClubIT',
    account_type: 'standard',
    onboarding_completed: true,
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    fiscal_code_or_vat: '93048210874',
    iban_last4: '4892',
    requirements_due: []
  };
}

export function saveClubStripeStatus(
  clubId: string | undefined,
  status: ApiStripeConnectStatus
): void {
  try {
    const raw = localStorage.getItem(CLUB_STRIPE_STORAGE_KEY);
    const map: Record<string, ApiStripeConnectStatus> = raw ? JSON.parse(raw) : {};
    if (clubId) map[clubId] = status;
    map['default_club'] = status;
    localStorage.setItem(CLUB_STRIPE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export interface LocalEnrollmentEntry {
  course_id: string;
  course_name: string;
  club_id: string;
  club_name: string;
  child_id: string;
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: string;
  child_fiscal_code: string;
  payment_id: string;
  enrolled_at: string;
}

export function getLocalEnrollments(): LocalEnrollmentEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENROLLMENTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalEnrollmentEntry[]) : [];
  } catch {
    return [];
  }
}

export function addLocalEnrollment(entry: LocalEnrollmentEntry): void {
  try {
    const current = getLocalEnrollments().filter(
      e => !(e.course_id === entry.course_id && e.child_id === entry.child_id)
    );
    current.push(entry);
    localStorage.setItem(LOCAL_ENROLLMENTS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function removeLocalEnrollment(courseId: string, childId: string): void {
  try {
    const current = getLocalEnrollments().filter(
      e => !(e.course_id === courseId && e.child_id === childId)
    );
    localStorage.setItem(LOCAL_ENROLLMENTS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getLocalPaymentsLedger(): ApiPaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_LEDGER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ApiPaymentRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalPaymentRecord(record: ApiPaymentRecord): void {
  try {
    const current = getLocalPaymentsLedger().filter(p => p.id !== record.id);
    current.unshift(record);
    localStorage.setItem(PAYMENTS_LEDGER_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function updateLocalPaymentStatus(
  paymentId: string,
  status: PaymentLifecycleStatus
): ApiPaymentRecord | null {
  try {
    const current = getLocalPaymentsLedger();
    let updated: ApiPaymentRecord | null = null;
    const next = current.map(p => {
      if (p.id === paymentId) {
        updated = {
          ...p,
          status,
          completed_at:
            status === 'SUCCEEDED' ? new Date().toISOString() : p.completed_at
        };
        return updated;
      }
      return p;
    });
    localStorage.setItem(PAYMENTS_LEDGER_STORAGE_KEY, JSON.stringify(next));
    return updated;
  } catch {
    return null;
  }
}

// Chiamate API reali verso FastAPI (/payments/...)
export async function createStripeConnectOnboardingLink(
  accountType: 'standard' | 'express' = 'standard'
): Promise<{ onboarding_url: string; stripe_account_id: string }> {
  return apiFetch<{ onboarding_url: string; stripe_account_id: string }>(
    '/payments/connect/onboard',
    {
      method: 'POST',
      body: JSON.stringify({ account_type: accountType })
    }
  );
}

export async function getStripeConnectStatus(): Promise<ApiStripeConnectStatus> {
  return apiFetch<ApiStripeConnectStatus>('/payments/connect/status');
}

export async function createCourseCheckoutSession(
  payload: ApiCheckoutSessionRequest
): Promise<ApiCheckoutSessionResponse> {
  return apiFetch<ApiCheckoutSessionResponse>('/payments/checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyCheckoutSessionStatus(
  sessionId: string
): Promise<ApiPaymentRecord> {
  return apiFetch<ApiPaymentRecord>(
    `/payments/verify/${encodeURIComponent(sessionId)}`
  );
}

export async function getMyParentPayments(): Promise<ApiPaymentRecord[]> {
  return apiFetch<ApiPaymentRecord[]>('/payments/parent/me');
}

export async function getMyClubPayments(): Promise<ApiPaymentRecord[]> {
  return apiFetch<ApiPaymentRecord[]>('/payments/club/me');
}

export async function refundClubPayment(
  paymentId: string
): Promise<ApiPaymentRecord> {
  return apiFetch<ApiPaymentRecord>(`/payments/${paymentId}/refund`, {
    method: 'POST'
  });
}

