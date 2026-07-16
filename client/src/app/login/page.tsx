"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      saveToken(data.token, {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        organizationName: data.organizationName,
      });
      router.push(data.role === "Admin" || data.role === "Manager" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center bg-[#122E24] relative overflow-hidden">
      {/* Decorative background circles, matching the reference composition */}
      <div className="absolute -top-16 right-1/3 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-24 right-10 w-72 h-72 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full border border-white/10" />

      {/* Logo, top-left */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#8CB369]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="5" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M6.6 7.2L10.6 11M6.6 16.8L10.6 13M13.4 11L17.4 7.2M13.4 13L17.4 16.8" />
        </svg>
        <div>
          <p className="text-white text-sm font-semibold leading-none">SF Booking</p>
          <p className="text-white/50 text-[10px] mt-0.5">Every room, on the record</p>
        </div>
      </div>

      {/* Illustration side */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        {/* Clouds */}
        <div className="absolute top-10 left-1/4 flex">
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div className="w-14 h-14 rounded-full bg-white/20 -ml-4" />
          <div className="w-8 h-8 rounded-full bg-white/20 -ml-4 mt-3" />
        </div>
        <div className="absolute top-24 right-16 flex">
          <div className="w-7 h-7 rounded-full bg-white/15" />
          <div className="w-10 h-10 rounded-full bg-white/15 -ml-3" />
        </div>

        {/* Plants flanking the card stack */}
        <div className="absolute left-4 bottom-16 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#8CB369]/40 mb-1" />
          <div className="w-10 h-10 rounded-full bg-[#8CB369]/30 -mt-4 -ml-6" />
          <div className="w-1 h-10 bg-white/20 mt-1" />
        </div>
        <div className="absolute right-6 bottom-24 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-[#8CB369]/40 mb-1" />
          <div className="w-1 h-14 bg-white/20 mt-1" />
        </div>

        <div className="bg-white/95 rounded-2xl p-6 w-64 shadow-2xl rotate-[-3deg]">
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#1B4D3E]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            <span className="text-sm font-semibold text-[#1F2937]">Room 301</span>
          </div>
          <div className="h-2 w-3/4 bg-[#E9ECF1] rounded mb-2" />
          <div className="h-2 w-1/2 bg-[#E9ECF1] rounded mb-4" />
          <span className="inline-block text-xs bg-[#D1FAE5] text-[#047857] px-3 py-1 rounded-full font-medium">Approved</span>
        </div>
        <div className="bg-white/90 rounded-2xl p-5 w-48 shadow-2xl absolute translate-x-28 translate-y-16 rotate-[4deg]">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#8CB369] mb-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <rect x="4" y="3" width="16" height="18" rx="1" />
            <path d="M9 8h1M14 8h1M9 12h1M14 12h1" />
          </svg>
          <div className="h-2 w-2/3 bg-[#E9ECF1] rounded mb-2" />
          <div className="h-2 w-1/2 bg-[#E9ECF1] rounded" />
        </div>
        {/* Third floating card - small analytics/pie chart mockup */}
        <div className="bg-white/90 rounded-2xl p-4 w-36 shadow-2xl absolute -translate-x-32 translate-y-28 rotate-[-6deg]">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-2"
            style={{ background: "conic-gradient(#8CB369 0deg 140deg, #F2A65A 140deg 230deg, #5B8CD6 230deg 360deg)" }}
          />
          <div className="h-1.5 w-full bg-[#E9ECF1] rounded mb-1.5" />
          <div className="h-1.5 w-2/3 bg-[#E9ECF1] rounded" />
        </div>
      </div>

      {/* Frosted glass card */}
      <div className="w-full lg:w-[540px] flex items-center justify-center p-6 lg:p-14 relative z-10">
        <div className="w-full max-w-[460px] bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-white pb-2 border-b-2 border-[#8CB369] inline-block mb-1">
            Login
          </h2>
          <p className="text-white/60 text-sm mb-8 mt-3">Welcome onboard with us!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
              />
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-xs text-white/60 hover:text-[#8CB369] transition">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="border border-[#F87171]/30 bg-[#F87171]/10 rounded-lg px-4 py-3 text-sm text-[#FCA5A5]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8CB369] text-[#122E24] rounded-full py-3.5 text-sm font-bold tracking-wide hover:bg-[#9CC17F] transition disabled:opacity-50"
            >
              {loading ? "SIGNING IN…" : "LOGIN"}
            </button>
          </form>

          <p className="text-sm text-white/60 mt-6 text-center">
            New to SF Booking?{" "}
            <Link href="/register" className="text-[#8CB369] font-semibold hover:underline">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}