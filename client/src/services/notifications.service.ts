import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AppNotification {
  id: number;
  bookingId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const response = await fetch(`${API_URL}/api/notifications`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load notifications");
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load unread count");
  return data.unreadCount;
}

export async function markAsRead(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to mark as read");
  return data;
}

export async function markAllAsRead(): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to mark all as read");
  return data;
}