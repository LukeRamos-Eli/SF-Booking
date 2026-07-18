"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, verifyJoinCode } from "@/services/auth.service";
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, CalendarPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  
  // States from your auth service logic
  const [joinCode, setJoinCode] = useState("");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // UI Interactive state
  const [showPassword, setShowPassword] = useState(false);

  // Verification Logic using your service helper
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

  // Registration Submission Logic using your service helper
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
      router.push("/login");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#202715] text-white flex items-center justify-center lg:justify-between px-4 sm:px-8 lg:px-16">
      
      {/* Background Glows (Matching your original design exactly) */}
      <div className="absolute left-[-150px] top-[-100px] h-[350px] w-[350px] rounded-full bg-green-700/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-yellow-400/10 blur-3xl animate-pulse" />

      {/* Decorative Geometry */}
      <div className="absolute left-8 top-8 h-28 w-28 rounded-full border border-white/10 hidden lg:block" />
      <div className="absolute bottom-10 left-1/3 h-32 w-32 rounded-full border border-white/10 hidden lg:block" />

      {/* Logo & Navigation */}
      <div className="absolute top-8 left-6 sm:left-8 flex items-center gap-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/20 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-white text-xs font-semibold leading-none tracking-wide">SF BOOKING</p>
            <p className="text-white/40 text-[9px] mt-0.5">Smart Facility Management</p>
          </div>
        </div>
      </div>

      {/* Left Column: Polished Mockup Illustrations (Preserved completely identical) */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10 max-w-2xl h-full pr-8">
        {/* Abstract Floating Vector Elements */}
        <div className="absolute top-12 left-1/4 flex gap-1 opacity-40">
          <div className="w-8 h-8 rounded-full bg-green-600/20 blur-sm" />
          <div className="w-12 h-12 rounded-full bg-green-600/20 blur-sm -ml-3" />
        </div>

        {/* Component Display 1 */}
        <div className="bg-white/95 rounded-2xl p-6 w-64 shadow-2xl rotate-[-3deg] border border-white/20 transition-all hover:rotate-0 hover:scale-105 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-[#202715]/10">
              <CalendarPlus className="w-4 h-4 text-[#202715]" />
            </div>
            <span className="text-xs font-bold text-gray-800">JOIN CODE</span>
          </div>
          <div className="h-2 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-2 w-1/2 bg-gray-200 rounded mb-4" />
          <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            QR62DKRI
          </span>
        </div>

        {/* Component Display 2 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 w-48 shadow-2xl absolute translate-x-28 translate-y-16 rotate-[4deg] border border-white/10 transition-all hover:rotate-0 hover:scale-105 duration-300">
          <div className="h-2 w-2/3 bg-white/30 rounded mb-2" />
          <div className="h-2 w-1/2 bg-white/20 rounded mb-4" />
          <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
            <div className="w-2/3 h-full bg-[#D99A3F]" />
          </div>
        </div>

        {/* Component Display 3 */}
        <div className="bg-white/90 rounded-2xl p-4 w-36 shadow-2xl absolute -translate-x-32 translate-y-28 rotate-[-6deg] transition-all hover:rotate-0 duration-300">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-3 shadow-inner"
            style={{ background: "conic-gradient(#D99A3F 0deg 160deg, #4b5e30 160deg 280deg, #d1d5db 280deg 360deg)" }}
          />
          <div className="h-1.5 w-full bg-gray-200 rounded mb-1.5" />
          <div className="h-1.5 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Right Column: Premium Form Interface */}
      <div className="w-full lg:w-230 flex items-center justify-center relative z-10 lg:ml-auto">
        <div className="w-full max-w-md bg-white/8 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-10 shadow-2xl">
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Register Account</h2>
            <p className="text-gray-300 text-sm">Create an account to manage your spaces.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Join Code Input with Verify Action Button */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 tracking-wide uppercase">Join Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  disabled={submitting || verifying || !!orgName}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. QR62DKRI"
                  className={`flex-1 bg-black/20 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition disabled:opacity-50 ${
                    orgName ? "border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20" : "border-white/10 focus:border-[#D99A3F] focus:ring-2 focus:ring-[#D99A3F]/20"
                  }`}
                />
                <button
                  type="button"
                  disabled={verifying || !!orgName || !joinCode.trim()}
                  onClick={handleVerify}
                  className={`border px-4 text-xs font-semibold rounded-xl transition uppercase tracking-wider min-w-[85px] active:scale-[0.98] disabled:opacity-40 ${
                    orgName 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                      : "bg-transparent border-white/10 hover:bg-white/5 text-gray-300"
                  }`}
                >
                  {verifying ? "..." : orgName ? "Verified" : "Verify"}
                </button>
              </div>
              {orgName && (
                <p className="mt-1.5 text-[11px] text-emerald-400 font-medium">
                  ✓ Connected to organization: <span className="underline">{orgName}</span>
                </p>
              )}
              {joinCodeError && (
                <p className="mt-1.5 text-[11px] text-red-400 font-medium">
                  {joinCodeError}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 tracking-wide uppercase">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D99A3F] focus:ring-2 focus:ring-[#D99A3F]/20 transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email Address */}
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
                  placeholder="name@university.edu"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D99A3F] focus:ring-2 focus:ring-[#D99A3F]/20 transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 tracking-wide uppercase">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D99A3F] focus:ring-2 focus:ring-[#D99A3F]/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Render block */}
            {submitError && (
              <div className="border border-red-500/20 bg-red-500/10 rounded-xl px-4 py-3 text-xs text-red-300 font-medium tracking-wide">
                {submitError}
              </div>
            )}

            {/* Control Form Trigger */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#D99A3F] text-white rounded-xl py-3.5 text-sm font-bold tracking-wide hover:bg-[#E8A948] transition active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-[#D99A3F]/10 uppercase mt-2"
            >
              {submitting ? "Registering…" : "Sign Up"}
            </button>
          </form>

          {/* Bottom Redirect Row */}
          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#D99A3F] font-bold hover:underline ml-1">
              Login Here
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}