"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getMyBookings, Booking } from "@/services/bookings.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import StatCard from "@/components/StatCard";
import Badge, { statusColor } from "@/components/Badge";
import { SkeletonStatCards, SkeletonTableRows } from "@/components/Skeleton";
import { UsersIcon, BoxIcon, ChartIcon } from "@/components/icons";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const pending = bookings.filter((b) => b.status === "Pending").length;
  const approved = bookings.filter((b) => b.status === "Approved").length;
  const rejected = bookings.filter((b) => b.status === "Rejected").length;
  const recent = bookings.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <StudentSidebar />
      <div className="flex-1">
        <StudentTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Dashboard</h1>

          {loading ? (
            <>
              <SkeletonStatCards count={3} />
              <div className="h-6" />
              <SkeletonTableRows rows={4} columns={3} />
            </>
          ) : error ? (
            <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard label="Pending Bookings" value={pending} icon={<UsersIcon />} tone="purple" />
                <StatCard label="Approved Bookings" value={approved} icon={<BoxIcon />} tone="yellow" />
                <StatCard label="Rejected Bookings" value={rejected} icon={<ChartIcon />} tone="green" />
              </div>

              <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden max-w-3xl">
                <div className="grid grid-cols-[2fr_1.6fr_1fr] px-5 py-3 bg-[#F3F5F8] text-xs font-semibold uppercase tracking-wide text-[#1F2937]">
                  <span>Facility</span>
                  <span>Date - Time</span>
                  <span>Status</span>
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-[#8A93A0] px-5 py-6">
                    No bookings yet — head to Facilities to request one.
                  </p>
                ) : (
                  recent.map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-[2fr_1.6fr_1fr] items-center px-5 py-4 border-b border-[#F3F5F8] last:border-0"
                    >
                      <p className="text-sm font-medium text-[#1F2937]">{b.facilityName}</p>
                      <p className="text-sm text-[#6B7280]">
                        {new Date(b.startTime).toLocaleDateString()} -{" "}
                        {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Badge color={statusColor(b.status)}>{b.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}