import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Facility {
  id: number;
  name: string;
  type: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface FacilityInput {
  name: string;
  type: string;
  capacity: number;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getFacilities(): Promise<Facility[]> {
  const response = await fetch(`${API_URL}/api/facilities`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load facilities");
  return data;
}

export interface FacilityBookingSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
}

export async function getFacilityBookings(facilityId: number): Promise<FacilityBookingSlot[]> {
  const response = await fetch(`${API_URL}/api/facilities/${facilityId}/bookings`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load facility bookings");
  return data;
}

export async function createFacility(input: FacilityInput): Promise<Facility> {
  const response = await fetch(`${API_URL}/api/facilities`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create facility");
  return data;
}

export async function updateFacility(
  id: number,
  input: Partial<FacilityInput>
): Promise<Facility> {
  const response = await fetch(`${API_URL}/api/facilities/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update facility");
  return data;
}

export async function deleteFacility(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/facilities/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to deactivate facility");
  return data;
}

export async function reactivateFacility(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/facilities/${id}/reactivate`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reactivate facility");
  return data;
}