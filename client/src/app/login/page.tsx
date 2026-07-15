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
    <div className="min-h-screen flex bg-[#F3F5F8]">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#8CB369] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -left-10 bottom-10 w-56 h-56 rounded-full bg-white/10" />

        <div className="flex items-center gap-2 relative">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="5" cy="6" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="19" cy="18" r="2" />
            <path d="M6.6 7.2L10.6 11M6.6 16.8L10.6 13M13.4 11L17.4 7.2M13.4 13L17.4 16.8" />
          </svg>
          <span className="text-2xl font-semibold text-white">SF Booking</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold text-white leading-[1.15] mb-4">
            Every room,
            <br />
            on the record.
          </h1>
          <p className="text-white/85 text-sm max-w-xs">
            Sign in to reserve classrooms, courts, and halls and keep track of every request in one place.
          </p>
        </div>

        <p className="text-white/70 text-xs relative">© {new Date().getFullYear()} SF Booking</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <span className="text-2xl font-semibold">
              <span className="text-[#1F2937]">SF </span>
              <span className="text-[#8CB369]">Booking</span>
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-[#1F2937] mb-1">Sign in</h2>
          <p className="text-sm text-[#8A93A0] mb-8">Enter the credentials your school issued.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
              />
            </div>

            {error && (
              <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8CB369] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#739955] transition disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-[#8A93A0] mt-8 text-center">
            New here?{" "}
            <Link href="/register" className="text-[#8CB369] font-medium hover:underline">
              Register with your join code
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
