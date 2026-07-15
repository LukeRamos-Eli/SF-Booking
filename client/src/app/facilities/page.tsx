"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getFacilities, Facility } from "@/services/facilities.service";
import { createBooking } from "@/services/bookings.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import Badge from "@/components/Badge";
import { CalendarPlusIcon } from "@/components/icons";

const EMPTY_FORM = { startTime: "", endTime: "", purpose: "" };

export default function StudentFacilitiesPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [booking, setBooking] = useState<Facility | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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

  function openBooking(f: Facility) {
    setBooking(f);
    setForm(EMPTY_FORM);
    setFormError("");
    setDone(false);
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

  return (
    <div className="min-h-screen bg-[#F3F5F8]">
      <StudentTopbar />
      <div className="flex">
        <StudentSidebar />
        <main className="flex-1 px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Facilities</h1>

          {loading ? (
            <p className="text-sm text-[#8A93A0]">Loading facilities…</p>
          ) : error ? (
            <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
              {error}
            </div>
          ) : facilities.length === 0 ? (
            <p className="text-sm text-[#8A93A0]">No facilities have been added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {facilities.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm p-6 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-[#1F2937] leading-tight">
                      {f.name}
                    </h2>
                    <p className="text-sm text-[#8A93A0] mt-1">
                      {f.type} | Capacity {f.capacity}
                    </p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <Badge variant={f.isActive ? "success" : "danger"}>
                      {f.isActive ? "Available" : "Unavailable"}
                    </Badge>
                    <div>
                      <button
                        onClick={() => openBooking(f)}
                        disabled={!f.isActive}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EAF2E3] text-[#1F2937] text-sm font-medium hover:bg-[#DCEBCF] transition disabled:opacity-40"
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
          <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            {done ? (
              <div>
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
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}