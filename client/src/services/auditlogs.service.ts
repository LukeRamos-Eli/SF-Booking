import { getToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuditLogEntry {
  id: number;
  actorId: number;
  actorName: string;
  action: string;
  targetTable: string;
  targetId: number;
  details: string | null;
  createdAt: string;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getAuditLogs(limit?: number): Promise<AuditLogEntry[]> {
  const query = limit ? `?limit=${limit}` : "";
  const response = await fetch(`${API_URL}/api/auditlogs${query}`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load audit logs");
  return data;
}