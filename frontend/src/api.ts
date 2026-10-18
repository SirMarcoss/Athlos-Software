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
  latitude: number;
  longitude: number;
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

// === 7. ENDPOINT GEOLOCALIZZAZIONE (/geo) ===

export async function autocompleteGeo(
  query: string,
  limit = 5
): Promise<ApiGeoSearchResult[]> {
  return apiFetch<ApiGeoSearchResult[]>(
    `/geo/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}
