"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import {
  getFacilities,
  getFacilityBookings,
  Facility,
  FacilityBookingSlot,
  FACILITY_CATEGORIES,
  categoryLabel,
} from "@/services/facilities.service";
import { createBooking } from "@/services/bookings.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import Badge, { statusColor } from "@/components/Badge";
import { SkeletonCards } from "@/components/Skeleton";
import { CalendarPlusIcon } from "@/components/icons";

const EMPTY_FORM = { startTime: "", endTime: "", purpose: "" };

export default function StudentFacilitiesPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [booking, setBooking] = useState<Facility | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [existingBookings, setExistingBookings] = useState<FacilityBookingSlot[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await getFacilities();
        setFacilities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load facilities.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function openBooking(f: Facility) {
    setBooking(f);
    setForm(EMPTY_FORM);
    setFormError("");
    setDone(false);
    setExistingBookings([]);
    setLoadingBookings(true);
    try {
      const slots = await getFacilityBookings(f.id);
      setExistingBookings(slots);
    } catch {
      // Non-critical - the booking form still works even if this fails,
      // it just won't show the "already taken" reference list.
    } finally {
      setLoadingBookings(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    if (!form.startTime || !form.endTime || !form.purpose.trim()) {
      setFormError("Fill in every field.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createBooking({
        facilityId: booking.id,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        purpose: form.purpose.trim(),
      });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = s.toDateString() === e.toDateString();
    const dateStr = s.toLocaleDateString([], { month: "short", day: "numeric" });
    const startStr = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endStr = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return sameDay ? `${dateStr}, ${startStr} – ${endStr}` : `${dateStr} ${startStr} – ${e.toLocaleDateString([], { month: "short", day: "numeric" })} ${endStr}`;
  }

  const filteredFacilities = useMemo(() => {
    if (categoryFilter === "All") return facilities;
    return facilities.filter((f) => f.category === categoryFilter);
  }, [facilities, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <StudentSidebar />
      <div className="flex-1">
        <StudentTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-6">Facilities</h1>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setCategoryFilter("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                categoryFilter === "All"
                  ? "bg-[#1B4D3E] text-white"
                  : "bg-white text-[#6B7280] border border-[#EEF0F3] hover:bg-[#F3F5F8]"
              }`}
            >
              All
            </button>
            {FACILITY_CATEGORIES.map((key) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  categoryFilter === key
                    ? "bg-[#1B4D3E] text-white"
                    : "bg-white text-[#6B7280] border border-[#EEF0F3] hover:bg-[#F3F5F8]"
                }`}
              >
                {categoryLabel(key)}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonCards count={6} />
          ) : error ? (
            <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
              {error}
            </div>
          ) : filteredFacilities.length === 0 ? (
            <p className="text-sm text-[#8A93A0]">
              {facilities.length === 0
                ? "No facilities have been added yet."
                : "No facilities in this category."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFacilities.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm p-6 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-[#1F2937] leading-tight">
                      {f.name}
                    </h2>
                    <p className="text-sm text-[#8A93A0] mt-1">
                      {f.type} | Capacity {f.capacity}
                    </p>
                    <p className="text-xs text-[#8CB369] font-medium mt-1">{categoryLabel(f.category)}</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <Badge color={f.isActive ? "success" : "danger"}>
                      {f.isActive ? "Available" : "Unavailable"}
                    </Badge>
                    <div>
                      <button
                        onClick={() => openBooking(f)}
                        disabled={!f.isActive}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E3E1FA] text-[#1F2937] text-sm font-medium hover:bg-[#D5D2F5] transition disabled:opacity-40"
                      >
                        <CalendarPlusIcon className="w-4 h-4" />
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {booking && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
            {done ? (
              <div className="p-7">
                <h2 className="text-lg font-semibold text-[#1F2937] mb-2">Request submitted</h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  Your booking for {booking.name} is pending approval. You can track it from My bookings.
                </p>
                <button
                  onClick={() => setBooking(null)}
                  className="w-full py-2.5 rounded-lg bg-[#8CB369] text-white text-sm font-medium hover:bg-[#739955] transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr]">
                {/* Left: existing bookings for this facility, so the user isn't guessing */}
                <div className="bg-[#F3F5F8] p-6 border-r border-[#EEF0F3]">
                  <h3 className="text-sm font-semibold text-[#1F2937] mb-1">Already reserved</h3>
                  <p className="text-xs text-[#8A93A0] mb-4">{booking.name} · upcoming Pending/Approved slots</p>

                  {loadingBookings ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-lg bg-[#E9ECF1] animate-pulse" />
                      ))}
                    </div>
                  ) : existingBookings.length === 0 ? (
                    <p className="text-xs text-[#8A93A0]">No upcoming reservations — the whole calendar is open.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {existingBookings.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-white rounded-lg px-3 py-2.5 border border-[#EEF0F3] flex items-center justify-between gap-2"
                        >
                          <span className="text-xs text-[#374151]">{formatRange(slot.startTime, slot.endTime)}</span>
                          <Badge color={statusColor(slot.status)} tone="soft" className="shrink-0">
                            {slot.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: the booking form itself */}
                <div className="p-7">
                  <h2 className="text-lg font-semibold text-[#1F2937] mb-1">Book {booking.name}</h2>
                  <p className="text-sm text-[#8A93A0] mb-5">
                    {booking.type} · Capacity {booking.capacity}
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Start</label>
                        <input
                          type="datetime-local"
                          value={form.startTime}
                          onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                          className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">End</label>
                        <input
                          type="datetime-local"
                          value={form.endTime}
                          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                          className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Purpose</label>
                      <input
                        value={form.purpose}
                        onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                        placeholder="Study session, practice, event…"
                        className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                      />
                    </div>
                    {formError && <p className="text-xs text-[#B23A3A]">{formError}</p>}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setBooking(null)}
                        className="flex-1 py-2.5 rounded-lg border border-[#E5E9EF] text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-lg bg-[#8CB369] text-white text-sm font-medium hover:bg-[#739955] transition disabled:opacity-50"
                      >
                        {submitting ? "Submitting…" : "Submit request"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}