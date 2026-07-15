import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Booking {
  id: number;
  facilityId: number;
  facilityName: string;
  requestedById?: number;
  requestedByName?: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  createdAt: string;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/api/bookings/mine`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load bookings");
  return data;
}

export async function getAllBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/api/bookings`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load bookings");
  return data;
}

export interface CreateBookingInput {
  facilityId: number;
  startTime: string;
  endTime: string;
  purpose: string;
}

export async function createBooking(
  input: CreateBookingInput
): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to submit booking");
  return data;
}

export async function cancelBooking(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/bookings/${id}/cancel`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to cancel booking");
  return data;
}