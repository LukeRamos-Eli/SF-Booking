"use client";

import { useState } from "react";
import Link from "next/link";
import { register, verifyJoinCode } from "@/services/auth.service";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";

export default function RegisterPage() {
  const [joinCode, setJoinCode] = useState("");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  async function handleVerify() {
    if (!joinCode.trim()) return;
    setVerifying(true);
    setJoinCodeError("");
    setOrgName(null);
    try {
      const org = await verifyJoinCode(joinCode.trim().toUpperCase());
      setOrgName(org.name);
    } catch (err) {
      setJoinCodeError(err instanceof Error ? err.message : "Invalid join code.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName) {
      setJoinCodeError("Verify your join code first.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await register(fullName, email, password, joinCode.trim().toUpperCase());
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center bg-[#122E24] relative overflow-hidden">
      <div className="absolute -top-16 left-1/3 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-24 left-10 w-72 h-72 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 right-10 w-64 h-64 rounded-full border border-white/10" />

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
          <p className="text-white/50 text-[10px] mt-0.5">One code gets you on the roster</p>
        </div>
      </div>

      <div className="hidden lg:flex order-2 flex-1 items-center justify-center relative z-10">
        <div className="absolute top-10 right-1/4 flex">
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div className="w-14 h-14 rounded-full bg-white/20 -ml-4" />
          <div className="w-8 h-8 rounded-full bg-white/20 -ml-4 mt-3" />
        </div>
        <div className="absolute top-24 left-16 flex">
          <div className="w-7 h-7 rounded-full bg-white/15" />
          <div className="w-10 h-10 rounded-full bg-white/15 -ml-3" />
        </div>

        <div className="absolute right-4 bottom-16 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#8CB369]/40 mb-1" />
          <div className="w-10 h-10 rounded-full bg-[#8CB369]/30 -mt-4 -mr-6" />
          <div className="w-1 h-10 bg-white/20 mt-1" />
        </div>
        <div className="absolute left-6 bottom-24 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-[#8CB369]/40 mb-1" />
          <div className="w-1 h-14 bg-white/20 mt-1" />
        </div>

        <div className="bg-white/95 rounded-2xl p-6 w-64 shadow-2xl rotate-[3deg]">
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#1B4D3E]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <rect x="5" y="4" width="14" height="17" rx="2" />
              <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
            </svg>
            <span className="text-sm font-semibold text-[#1F2937]">Join code</span>
          </div>
          <div className="h-9 rounded-lg bg-[#F3F5F8] flex items-center px-3 mb-4">
            <span className="font-mono text-sm tracking-widest text-[#6B7280]">QR62DKRI</span>
          </div>
          <span className="inline-block text-xs bg-[#D1FAE5] text-[#047857] px-3 py-1 rounded-full font-medium">Verified</span>
        </div>
        <div className="bg-white/90 rounded-2xl p-5 w-48 shadow-2xl absolute -translate-x-28 translate-y-20 rotate-[-4deg]">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#8CB369] mb-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <rect x="4" y="3" width="16" height="18" rx="1" />
            <path d="M9 8h1M14 8h1M9 12h1M14 12h1" />
          </svg>
          <div className="h-2 w-2/3 bg-[#E9ECF1] rounded mb-2" />
          <div className="h-2 w-1/2 bg-[#E9ECF1] rounded" />
        </div>
        <div className="bg-white/90 rounded-2xl p-4 w-36 shadow-2xl absolute translate-x-32 translate-y-28 rotate-[6deg]">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-2"
            style={{ background: "conic-gradient(#8CB369 0deg 140deg, #F2A65A 140deg 230deg, #5B8CD6 230deg 360deg)" }}
          />
          <div className="h-1.5 w-full bg-[#E9ECF1] rounded mb-1.5" />
          <div className="h-1.5 w-2/3 bg-[#E9ECF1] rounded" />
        </div>
      </div>

      <div className="order-1 w-full lg:w-[580px] flex items-center justify-center p-6 lg:p-14 relative z-10">
        <div className="w-full max-w-[500px] bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-8">
          {done ? (
            <div>
              <p className="text-lg font-semibold text-[#8CB369] mb-2">Request submitted</p>
              <p className="text-sm text-white/70">
                Your account is pending admin approval at {orgName}. You&apos;ll be able to sign in once it&apos;s approved.
              </p>
              <Link href="/login" className="inline-block mt-4 text-sm font-medium text-[#8CB369] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white pb-2 border-b-2 border-[#8CB369] inline-block mb-1">
                Register
              </h2>
              <p className="text-white/60 text-sm mb-6 mt-3">Enter your school&apos;s join code to get started.</p>

              <div className="mb-5">
                <label className="block text-xs font-medium text-white/70 mb-1.5">Join code</label>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value);
                      setOrgName(null);
                    }}
                    placeholder="e.g. QR62DKRI"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm font-mono tracking-wider uppercase text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying || !joinCode.trim()}
                    className="px-5 rounded-lg border border-[#8CB369] text-sm font-medium text-[#8CB369] hover:bg-[#8CB369] hover:text-[#122E24] transition disabled:opacity-40"
                  >
                    {verifying ? "…" : "Verify"}
                  </button>
                </div>
                {orgName && (
                  <div className="mt-2">
                    <Badge color="success" tone="soft">{orgName}</Badge>
                  </div>
                )}
                {joinCodeError && <p className="mt-2 text-xs text-[#FCA5A5]">{joinCodeError}</p>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">Full name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>
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
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>

                <div className="border border-dashed border-white/20 rounded-xl p-4 flex items-center gap-3">
                  <Avatar name={fullName.trim() || "?"} size={44} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{fullName.trim() || "Your name"}</p>
                    <p className="text-xs text-white/50 truncate">{orgName || "Verify a join code"} · Student · Pending</p>
                  </div>
                </div>

                {submitError && (
                  <div className="border border-[#F87171]/30 bg-[#F87171]/10 rounded-lg px-4 py-3 text-sm text-[#FCA5A5]">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#8CB369] text-[#122E24] rounded-full py-3.5 text-sm font-bold tracking-wide hover:bg-[#9CC17F] transition disabled:opacity-50"
                >
                  {submitting ? "SUBMITTING…" : "REGISTER"}
                </button>
              </form>

              <p className="text-sm text-white/60 mt-6 text-center">
                Already registered?{" "}
                <Link href="/login" className="text-[#8CB369] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}