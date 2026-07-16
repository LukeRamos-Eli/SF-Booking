"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Missing or invalid reset link. Request a new one.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reset password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#122E24] relative overflow-hidden p-6">
      <div className="absolute -top-16 right-1/3 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-24 right-10 w-72 h-72 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full border border-white/10" />

      <div className="w-full max-w-[400px] relative z-10">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#8CB369]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="5" cy="6" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="19" cy="18" r="2" />
            <path d="M6.6 7.2L10.6 11M6.6 16.8L10.6 13M13.4 11L17.4 7.2M13.4 13L17.4 16.8" />
          </svg>
          <span className="text-2xl font-semibold text-white">SF Booking</span>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-8">
          {done ? (
            <>
              <h2 className="text-2xl font-semibold text-white pb-2 border-b-2 border-[#8CB369] inline-block mb-1">
                Password reset
              </h2>
              <p className="text-sm text-white/60 mb-6 mt-3">You can now sign in with your new password.</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[#8CB369] text-[#122E24] rounded-full py-3.5 text-sm font-bold tracking-wide hover:bg-[#9CC17F] transition"
              >
                GO TO SIGN IN
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white pb-2 border-b-2 border-[#8CB369] inline-block mb-1">
                Reset password
              </h2>
              <p className="text-white/60 text-sm mb-6 mt-3">Choose a new password for your account.</p>

              {!token && (
                <div className="border border-[#F2A65A]/30 bg-[#F2A65A]/10 rounded-lg px-4 py-3 text-sm text-[#F2A65A] mb-4">
                  This link is missing its reset token. Use the link from your email exactly as sent, or{" "}
                  <Link href="/forgot-password" className="underline font-medium">request a new one</Link>.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>
                {error && (
                  <div className="border border-[#F87171]/30 bg-[#F87171]/10 rounded-lg px-4 py-3 text-sm text-[#FCA5A5]">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#8CB369] text-[#122E24] rounded-full py-3.5 text-sm font-bold tracking-wide hover:bg-[#9CC17F] transition disabled:opacity-50"
                >
                  {submitting ? "RESETTING…" : "RESET PASSWORD"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}