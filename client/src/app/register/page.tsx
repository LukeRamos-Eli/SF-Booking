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
            One code gets
            <br />
            you on the roster.
          </h1>
          <p className="text-white/85 text-sm max-w-xs">
            Your school's join code links your account to its facilities, calendar, and approvals.
          </p>
        </div>

        <p className="text-white/70 text-xs relative">© {new Date().getFullYear()} SF Booking</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="text-2xl font-semibold">
              <span className="text-[#1F2937]">SF </span>
              <span className="text-[#8CB369]">Booking</span>
            </span>
          </div>

          {done ? (
            <div className="border border-[#8CB369]/30 bg-[#8CB369]/10 rounded-2xl px-5 py-5">
              <p className="text-lg font-semibold text-[#4E7A38] mb-1">Request submitted</p>
              <p className="text-sm text-[#374151]">
                Your account is pending admin approval at {orgName}. You'll be able to sign in once it's approved.
              </p>
              <Link href="/login" className="inline-block mt-4 text-sm font-medium text-[#8CB369] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-[#1F2937] mb-1">Register</h2>
              <p className="text-sm text-[#8A93A0] mb-6">Enter your school's join code to get started.</p>

              <div className="mb-5">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Join code</label>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value);
                      setOrgName(null);
                    }}
                    placeholder="e.g. QR62DKRI"
                    className="flex-1 border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm font-mono tracking-wider uppercase text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying || !joinCode.trim()}
                    className="px-5 rounded-xl border border-[#8CB369] text-sm font-medium text-[#8CB369] hover:bg-[#8CB369] hover:text-white transition disabled:opacity-40"
                  >
                    {verifying ? "…" : "Verify"}
                  </button>
                </div>
                {orgName && (
                  <div className="mt-2">
                    <Badge variant="success">{orgName}</Badge>
                  </div>
                )}
                {joinCodeError && <p className="mt-2 text-xs text-[#B23A3A]">{joinCodeError}</p>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Full name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    className="w-full border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@example.com"
                    className="w-full border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full border border-[#E5E9EF] bg-white rounded-xl px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#8CB369] focus:ring-2 focus:ring-[#8CB369]/25 transition"
                  />
                </div>

                {/* Live badge preview */}
                <div className="border border-dashed border-[#E5E9EF] rounded-xl p-4 flex items-center gap-3">
                  <Avatar name={fullName.trim() || "?"} size={44} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F2937] truncate">{fullName.trim() || "Your name"}</p>
                    <p className="text-xs text-[#8A93A0] truncate">{orgName || "Verify a join code"} · Student · Pending</p>
                  </div>
                </div>

                {submitError && (
                  <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#8CB369] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#739955] transition disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Create account"}
                </button>
              </form>

              <p className="text-sm text-[#8A93A0] mt-6 text-center">
                Already registered?{" "}
                <Link href="/login" className="text-[#8CB369] font-medium hover:underline">
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
