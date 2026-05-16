import { supabase } from './supabase';

/* =========================
   BASE URL (SAFE)
========================= */
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api')
  .replace(/\/$/, '');

/* =========================
   AUTH TOKEN
========================= */
async function getToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('Session not available');
  }

  return data.session.access_token;
}

/* =========================
   API CORE
========================= */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const url = `${API_URL}/${path.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* =========================
   API ENDPOINTS
========================= */
export const api = {
  organizations: () => apiRequest('/organizations'),

  createOrganization: (payload: unknown) =>
    apiRequest('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  dashboard: (orgId: string) =>
    apiRequest(`/organizations/${orgId}/dashboard`),

  vendors: (orgId: string, query = '') =>
    apiRequest(`/organizations/${orgId}/vendors${query}`),

  createVendor: (orgId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/vendors`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateVendor: (orgId: string, vendorId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/vendors/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteVendor: (orgId: string, vendorId: string) =>
    apiRequest(`/organizations/${orgId}/vendors/${vendorId}`, {
      method: 'DELETE'
    }),

  assessments: (orgId: string) =>
    apiRequest(`/organizations/${orgId}/assessments`),

  createAssessment: (orgId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/assessments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  tasks: (orgId: string, query = '') =>
    apiRequest(`/organizations/${orgId}/tasks${query}`),

  createTask: (orgId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateTask: (orgId: string, taskId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  members: (orgId: string) =>
    apiRequest(`/organizations/${orgId}/members`),

  invite: (orgId: string, payload: unknown) =>
    apiRequest(`/organizations/${orgId}/invites`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

/* =========================
   QUERY STRING HELPER
========================= */
export function queryString(params: Record<string, string>) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '')
  );

  const value = query.toString();
  return value ? `?${value}` : '';
}
