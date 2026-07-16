"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getMyBookings, cancelBooking, updateBooking, Booking } from "@/services/bookings.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import Badge, { statusColor } from "@/components/Badge";
import Pagination from "@/components/Pagination";
import { SkeletonTableRows } from "@/components/Skeleton";
import { PencilIcon, TrashIcon } from "@/components/icons";

const PAGE_SIZE = 7;

export default function StudentBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState({ startTime: "", endTime: "", purpose: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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
    setBusyId(id);
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setBusyId(null);
    }
  }

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEdit(b: Booking) {
    setEditing(b);
    setForm({
      startTime: toLocalInput(b.startTime),
      endTime: toLocalInput(b.endTime),
      purpose: b.purpose,
    });
    setFormError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!form.startTime || !form.endTime || !form.purpose.trim()) {
      setFormError("Fill in every field.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateBooking(editing.id, {
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        purpose: form.purpose.trim(),
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === editing.id
            ? { ...b, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), purpose: form.purpose.trim() }
            : b
        )
      );
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update booking.");
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <StudentSidebar />
      <div className="flex-1">
        <StudentTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">My Bookings</h1>

          {loading ? (
            <SkeletonTableRows rows={5} columns={4} />
          ) : error ? (
            <p className="text-sm text-[#B23A3A]">{error}</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden max-w-5xl">
              <div className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.6fr] px-6 py-4 bg-[#F3F5F8] text-sm font-semibold text-[#1F2937]">
                <span>Facility</span>
                <span>Description</span>
                <span>Date Registered</span>
                <span>Status</span>
              </div>

              {paged.length === 0 ? (
                <p className="text-sm text-[#8A93A0] px-6 py-6">
                  No bookings yet — head to Facilities to request one.
                </p>
              ) : (
                paged.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.6fr] items-center px-6 py-5 border-b border-[#F3F5F8] last:border-0"
                  >
                    <span className="text-sm font-medium text-[#1F2937]">{b.facilityName}</span>
                    <span className="text-sm text-[#6B7280]">{b.purpose}</span>
                    <span className="text-sm text-[#6B7280]">
                      {new Date(b.startTime).toLocaleDateString()} -{" "}
                      {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge color={statusColor(b.status)}>{b.status}</Badge>
                      {b.status === "Pending" && (
                        <button
                          onClick={() => openEdit(b)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#EEF0F3] text-[#6B7280] hover:bg-[#E5E9EF] transition"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                      {(b.status === "Pending" || b.status === "Approved") && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={busyId === b.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#B23A3A] text-white hover:bg-[#962F2F] transition disabled:opacity-50"
                          title="Cancel booking"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </main>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-1">Edit booking</h2>
            <p className="text-sm text-[#8A93A0] mb-5">{editing.facilityName}</p>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Start</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">End</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Purpose</label>
                <input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                />
              </div>
              {formError && <p className="text-xs text-[#B23A3A]">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#E5E9EF] text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-[#8CB369] text-white text-sm font-medium hover:bg-[#739955] transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}