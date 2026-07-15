import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load users");
  return data;
}

export async function getPendingUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_URL}/api/users/pending`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load pending accounts");
  return data;
}

export async function approveUser(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/users/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to approve account");
  return data;
}

export async function deactivateUser(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/users/${id}/deactivate`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to deactivate account");
  return data;
}

export async function changeUserRole(
  id: number,
  role: "Student" | "Faculty" | "Manager" | "Admin"
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/users/${id}/role`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to change role");
  return data;
}