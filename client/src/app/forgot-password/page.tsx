"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, KeyRound } from "lucide-react";

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
    <main className="relative h-screen w-screen overflow-hidden bg-[#202715] text-white flex items-center justify-center p-4">
      
      {/* Background Glows */}
      <div className="absolute left-[-150px] top-[-100px] h-[350px] w-[350px] rounded-full bg-green-700/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-yellow-400/5 blur-3xl pointer-events-none" />

      {/* Main Form Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 max-h-[90vh] flex flex-col justify-center">
        
        {done ? (
          /* Success View Block Structure */
          <div className="space-y-5 py-2">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Check your email</h2>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                If <strong className="text-white font-bold">{email}</strong> is registered, a password reset link is on its way. It&apos;ll expire in 30 minutes.
              </p>
            </div>

            <div className="pt-2 text-center">
              <Link href="/login" className="text-sm font-bold text-[#D99A3F] hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Request Reset Link Initial Form Structure */
          <>
            {/* Form Header */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#D99A3F]/10 flex items-center justify-center border border-[#D99A3F]/20 mb-4">
                <KeyRound className="w-5 h-5 text-[#D99A3F]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">Forgot password?</h2>
              <p className="text-gray-300 text-sm mt-2">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D99A3F] focus:ring-2 focus:ring-[#D99A3F]/20 transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Error Log Block */}
              {error && (
                <div className="border border-red-500/20 bg-red-500/10 rounded-xl px-4 py-2.5 text-xs text-red-300 font-medium tracking-wide">
                  {error}
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#D99A3F] text-white rounded-xl py-3.5 text-sm font-bold tracking-wide hover:bg-[#E8A948] transition active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-[#D99A3F]/10 uppercase mt-1"
              >
                {submitting ? "SENDING…" : "SEND RESET LINK"}
              </button>
            </form>

            {/* Bottom Redirect Row */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <Link href="/login" className="text-[#D99A3F] font-bold hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}

      </div>
    </main>
  );
}