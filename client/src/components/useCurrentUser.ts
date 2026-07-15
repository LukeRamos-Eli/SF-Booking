"use client";

import { useSyncExternalStore } from "react";
import { getUser } from "@/services/auth.service";

type User = ReturnType<typeof getUser>;

let cachedRaw: string | null = null;
let cachedUser: User = null;

function readUser(): User {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  cachedUser = raw ? JSON.parse(raw) : null;
  return cachedUser;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): User {
  return null;
}

// Reads the logged-in user from localStorage. Server render and the client's
// first render both return null (no mismatch); the real value swaps in
// immediately after mount, and updates if another tab logs in/out.
export function useCurrentUser(): User {
  return useSyncExternalStore(subscribe, readUser, getServerSnapshot);
}