"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getMyBookings, cancelBooking, Booking } from "@/services/bookings.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import Badge, { statusVariant } from "@/components/Badge";

export default function StudentBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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
        setError(err instanceof Error ? err.message : "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleCancel(id: number) {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8]">
      <StudentTopbar />
      <div className="flex">
        <StudentSidebar />
        <main className="flex-1 px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">My Bookings</h1>

          <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden max-w-5xl">
            <div className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.4fr] px-6 py-4 bg-[#F3F5F8] text-sm font-semibold text-[#1F2937]">
              <span>Facility</span>
              <span>Description</span>
              <span>Date Registered</span>
              <span>Status</span>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A93A0] px-6 py-6">Loading bookings…</p>
            ) : error ? (
              <p className="text-sm text-[#B23A3A] px-6 py-6">{error}</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-[#8A93A0] px-6 py-6">
                No bookings yet — head to Facilities to request one.
              </p>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.4fr] items-center px-6 py-5 border-b border-[#F3F5F8] last:border-0"
                >
                  <span className="text-sm font-medium text-[#1F2937]">{b.facilityName}</span>
                  <span className="text-sm text-[#6B7280]">{b.purpose}</span>
                  <span className="text-sm text-[#6B7280]">
                    {new Date(b.startTime).toLocaleDateString()} -{" "}
                    {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    {(b.status === "Pending" || b.status === "Approved") && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#B23A3A] text-white hover:bg-[#962F2F] transition disabled:opacity-50"
                      >
                        {cancellingId === b.id ? "…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
