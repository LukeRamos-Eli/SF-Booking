import { getToken } from './auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  organizationName: string;
  createdAt: string;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to load profile');
  return data;
}

// Still needed from backend: PUT /api/users/me — expects { fullName, email }
export async function updateMyProfile(fullName: string, email: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ fullName, email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update profile');
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to change password');
  return data;
}
