"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
                Check your email
              </h2>
              <p className="text-sm text-white/60 mb-6 mt-3">
                If <strong className="text-white">{email}</strong> is registered, a password reset link is on its way. It&apos;ll expire in 30 minutes.
              </p>
              <Link href="/login" className="text-sm font-medium text-[#8CB369] hover:underline">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white pb-2 border-b-2 border-[#8CB369] inline-block mb-1">
                Forgot password?
              </h2>
              <p className="text-white/60 text-sm mb-6 mt-3">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
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
                  {submitting ? "SENDING…" : "SEND RESET LINK"}
                </button>
              </form>
              <p className="text-sm text-white/60 mt-6 text-center">
                <Link href="/login" className="text-[#8CB369] font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}