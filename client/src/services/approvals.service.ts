import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApprovalRecord {
  id: number;
  bookingId: number;
  facilityName: string;
  requestedByName: string;
  reviewedById: number;
  reviewedByName: string;
  decision: string;
  remarks: string | null;
  isOverride: boolean;
  reviewedAt: string;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getApprovalHistory(): Promise<ApprovalRecord[]> {
  const response = await fetch(`${API_URL}/api/approvals`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load approval history");
  return data;
}

export async function approveBooking(
  bookingId: number,
  remarks?: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/approvals/${bookingId}/approve`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to approve booking");
  return data;
}

export async function rejectBooking(
  bookingId: number,
  remarks: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/approvals/${bookingId}/reject`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reject booking");
  return data;
}

export async function overrideBooking(
  bookingId: number,
  remarks: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/approvals/${bookingId}/override`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to override booking");
  return data;
}