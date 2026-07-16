"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { useCurrentUser } from "@/components/useCurrentUser";
import { getAllBookings, Booking } from "@/services/bookings.service";
import { approveBooking, rejectBooking, overrideBooking } from "@/services/approvals.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import Badge, { statusColor } from "@/components/Badge";
import Pagination from "@/components/Pagination";
import { SkeletonTableRows } from "@/components/Skeleton";
import { FunnelIcon } from "@/components/icons";

const FILTERS = ["All", "Pending", "Approved", "Rejected"] as const;
type Filter = (typeof FILTERS)[number];
const PAGE_SIZE = 7;

export default function AdminApprovalsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [remarksFor, setRemarksFor] = useState<{ booking: Booking; action: "reject" | "override" } | null>(null);
  const [remarksText, setRemarksText] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await getAllBookings();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = useMemo(() => {
    if (filter === "All") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeFilter(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await approveBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Approved" } : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve booking.");
    } finally {
      setBusyId(null);
    }
  }

  function openRemarks(booking: Booking, action: "reject" | "override") {
    setRemarksFor({ booking, action });
    setRemarksText("");
    setRemarksError("");
  }

  async function submitRemarks() {
    if (!remarksFor) return;
    if (!remarksText.trim()) {
      setRemarksError("Remarks are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { booking, action } = remarksFor;
      if (action === "reject") {
        await rejectBooking(booking.id, remarksText.trim());
      } else {
        await overrideBooking(booking.id, remarksText.trim());
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "Rejected" } : b))
      );
      setRemarksFor(null);
    } catch (err) {
      setRemarksError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  const isAdmin = user?.role === "Admin";

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Approvals</h1>

          <div className="inline-flex items-stretch bg-white rounded-xl border border-[#EEF0F3] mb-6 overflow-hidden">
            <div className="px-4 flex items-center border-r border-[#EEF0F3] text-[#9AA3AF]">
              <FunnelIcon className="w-4 h-4" />
            </div>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`px-6 py-3 text-sm font-medium border-r border-[#EEF0F3] last:border-r-0 transition ${
                  filter === f ? "text-[#1F2937] bg-[#A9C48C]" : "text-[#8A93A0] hover:bg-[#F9FAFB]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonTableRows rows={7} columns={5} />
          ) : error ? (
            <p className="text-sm text-[#B23A3A]">{error}</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1.1fr_1.5fr_1.4fr_1fr_1.6fr] px-6 py-4 bg-[#A9C48C] text-sm font-bold text-white uppercase tracking-wide">
                <span>Requested by</span>
                <span>Facility &amp; time</span>
                <span>Purpose</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {paged.length === 0 ? (
                <p className="text-sm text-[#8A93A0] px-6 py-6">No bookings match this filter.</p>
              ) : (
                paged.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-[1.1fr_1.5fr_1.4fr_1fr_1.6fr] items-center px-6 py-5 border-b border-[#F3F5F8] last:border-0"
                  >
                    <span className="text-sm font-medium text-[#1F2937]">{b.requestedByName}</span>
                    <div>
                      <p className="text-sm text-[#1F2937]">{b.facilityName}</p>
                      <p className="text-xs text-[#9AA3AF] mt-0.5">
                        {new Date(b.startTime).toLocaleDateString()} ·{" "}
                        {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-sm text-[#6B7280]">{b.purpose}</span>

                    {/* Read-only status badge - deliberately its own column, separate from actions */}
                    <div>
                      <Badge color={statusColor(b.status)} tone="soft">
                        {b.status}
                      </Badge>
                    </div>

                    {/* Clickable actions - visually distinct pill buttons, own column */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(b.id)}
                            disabled={busyId === b.id}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B4D3E] text-white hover:bg-[#153D31] transition disabled:opacity-50"
                          >
                            {busyId === b.id ? "…" : "Approve"}
                          </button>
                          <button
                            onClick={() => openRemarks(b, "reject")}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#B23A3A] text-white hover:bg-[#962F2F] transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === "Approved" && isAdmin && (
                        <button
                          onClick={() => openRemarks(b, "override")}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F2A65A] text-white hover:bg-[#DC9147] transition"
                        >
                          Override
                        </button>
                      )}

                      {(b.status === "Rejected" || (b.status === "Approved" && !isAdmin)) && (
                        <span className="text-xs text-[#9AA3AF] italic">No actions available</span>
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

      {remarksFor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-1">
              {remarksFor.action === "reject" ? "Reject booking" : "Override approval"}
            </h2>
            <p className="text-sm text-[#8A93A0] mb-5">
              {remarksFor.booking.facilityName} · {remarksFor.booking.requestedByName}
            </p>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Remarks <span className="text-[#B23A3A]">(required)</span>
            </label>
            <textarea
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              rows={3}
              placeholder="Explain the reason…"
              className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30 resize-none"
            />
            {remarksError && <p className="text-xs text-[#B23A3A] mt-2">{remarksError}</p>}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setRemarksFor(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#E5E9EF] text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRemarks}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-[#B23A3A] text-white text-sm font-medium hover:bg-[#962F2F] transition disabled:opacity-50"
              >
                {submitting ? "Submitting…" : remarksFor.action === "reject" ? "Reject" : "Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}