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
}

export interface ApiCourseCreate {
  name: string;
  min_age: number;
  max_age: number;
}

export interface ApiCourseResponse extends ApiCourseCreate {
  id: string;
  clubs_id: string;
  distance_km?: number | null;
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
