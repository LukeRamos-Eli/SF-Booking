const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginResponse {
  message: string;
  token: string;
  id: number;
  fullName: string;
  email: string;
  role: string;
  organizationName: string;
}

export interface RegisterResponse {
  message: string;
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  organizationName: string;
}



export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  joinCode: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName,
      email,
      password,
      joinCode,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

export function saveToken(token: string, user: Omit<LoginResponse, 'token' | 'message'>) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): Omit<LoginResponse, 'token' | 'message'> | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}