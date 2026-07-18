import Link from 'next/link';
import {
  CalendarPlus,
  Shield,
  BarChart3,
  CircleCheck,
} from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#202715] text-white">

      {/* Background Glow */}
      <div className="absolute left-[-150px] top-[-100px] h-[350px] w-[350px] rounded-full bg-green-700/20 blur-3xl" />
      <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-yellow-400/10 blur-3xl" />

      {/* Decorative Circles */}
      <div className="absolute left-8 top-8 h-28 w-28 rounded-full border border-white/10" />
      <div className="absolute bottom-10 left-1/2 h-32 w-32 rounded-full border border-white/10" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-8">

        <div className="w-full max-w-6xl">

          {/* Hero */}
          <h1 className="text-6xl font-black tracking-tight">
            Smart Facility Booking
          </h1>

          <p className="mt-4 max-w-xl text-lg text-gray-300">
            Book your campus <span className="text-yellow-400">space</span>,
            on your own time.
          </p>

          {/* Functional Navigation Links with First Code's Styling */}
          <div className="mt-10 flex gap-5">
            <Link 
              href="/login" 
              className="rounded-full bg-white/10 px-8 py-3 font-semibold backdrop-blur hover:bg-white/20 transition inline-block text-center"
            >
              Sign in
            </Link>

            <Link 
              href="/register" 
              className="rounded-full bg-[#D99A3F] px-8 py-3 font-semibold text-white hover:bg-[#E8A948] transition inline-block text-center"
            >
              Register
            </Link>
          </div>

          {/* Cards */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">

            {/* Card */}
            <div className="rounded-3xl border border-white/5 bg-white/8 p-8 backdrop-blur">

              <div className="mb-6 flex justify-between">
                <h2 className="text-2xl font-bold leading-tight">
                  Real-Time <br /> Availability
                </h2>

                <CalendarPlus className="h-10 w-10 text-gray-200" />
              </div>

              <p className="text-gray-300">
                See open slots instantly
              </p>

            </div>

            {/* Card */}
            <div className="rounded-3xl border border-white/5 bg-white/8 p-8 backdrop-blur">

              <div className="mb-6 flex justify-between">

                <h2 className="text-2xl font-bold">
                  Zero <br /> double-bookings
                </h2>

                <Shield className="h-10 w-10 text-gray-200" />

              </div>

              <p className="text-gray-300">
                Auto conflict detection
              </p>

            </div>

            {/* Card */}
            <div className="relative rounded-3xl border border-white/5 bg-white/8 p-8 backdrop-blur">

              <CircleCheck className="absolute right-5 top-5 h-7 w-7 rounded-full bg-lime-400 p-1 text-black"/>

              <div className="mb-6 flex justify-between">

                <h2 className="text-2xl font-bold">
                  Usage <br /> Insights
                </h2>

                <BarChart3 className="h-10 w-10 text-gray-200"/>

              </div>

              <p className="text-gray-300">
                Data-driven decisions
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}