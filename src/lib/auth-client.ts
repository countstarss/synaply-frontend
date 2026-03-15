export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string;
};

export const AUTH_TOKEN_STORAGE_KEY = 'tuneadmin.auth.token';
const DEFAULT_BACKEND_URL = 'http://localhost:5678';

export function getBackendBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
  return rawUrl.replace(/\/$/, '');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function registerWithEmailPassword(
  data: RegisterPayload,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: data,
  });
}

export async function loginWithEmailPassword(
  data: LoginPayload,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: data,
  });
}

export async function fetchMe(token: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    token,
  });
}
