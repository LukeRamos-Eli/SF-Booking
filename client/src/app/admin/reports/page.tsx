"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getAllBookings, Booking } from "@/services/bookings.service";
import { getAllUsers, AdminUser } from "@/services/admin.service";
import { getFacilities, Facility } from "@/services/facilities.service";
import { getAuditLogs, AuditLogEntry } from "@/services/auditlogs.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import StatCard from "@/components/StatCard";
import Pagination from "@/components/Pagination";
import { SkeletonStatCards, SkeletonTableRows } from "@/components/Skeleton";
import { ChartIcon, ClipboardIcon, BuildingIcon, UsersIcon } from "@/components/icons";

const PAGE_SIZE = 7;

export default function AdminReportsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const [b, u, f, l] = await Promise.all([
          getAllBookings(),
          getAllUsers(),
          getFacilities(),
          getAuditLogs(200),
        ]);
        setBookings(b);
        setUsers(u);
        setFacilities(f);
        setLogs(l);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const approvalRate = useMemo(() => {
    const decided = bookings.filter((b) => b.status === "Approved" || b.status === "Rejected");
    if (decided.length === 0) return 0;
    return Math.round((decided.filter((b) => b.status === "Approved").length / decided.length) * 100);
  }, [bookings]);

  const mostBooked = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((b) => counts.set(b.facilityName, (counts.get(b.facilityName) ?? 0) + 1));
    let top = "—";
    let max = 0;
    counts.forEach((count, name) => {
      if (count > max) {
        max = count;
        top = name;
      }
    });
    return top;
  }, [bookings]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return days.map((day) => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const count = bookings.filter((b) => {
        const created = new Date(b.createdAt);
        return created >= day && created < next;
      }).length;
      return { label: day.toLocaleDateString([], { weekday: "short" }), count };
    });
  }, [bookings]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.count));
  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Reports</h1>

          {loading ? (
            <>
              <SkeletonStatCards count={4} />
              <div className="h-6" />
              <SkeletonTableRows rows={6} columns={4} />
            </>
          ) : error ? (
            <p className="text-sm text-[#B23A3A]">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total bookings" value={bookings.length} icon={<UsersIcon />} tone="purple" />
                <StatCard label="Approval rate" value={`${approvalRate}%`} icon={<ChartIcon />} tone="green" />
                <StatCard label="Most booked facility" value={mostBooked} icon={<BuildingIcon />} tone="orange" />
                <StatCard label="Active users" value={users.filter((u) => u.status === "Active").length} icon={<UsersIcon />} tone="yellow" />
              </div>

              <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm p-6 mb-8">
                <p className="text-sm font-semibold text-[#1F2937] mb-6">Bookings this week</p>
                <div className="flex items-end justify-between gap-3 h-40">
                  {trend.map((t) => (
                    <div key={t.label} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-[#8CB369]"
                        style={{ height: `${Math.max(6, (t.count / maxTrend) * 120)}px` }}
                        title={`${t.count} booking(s)`}
                      />
                      <span className="text-xs text-[#9AA3AF]">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <ClipboardIcon className="w-4 h-4 text-[#8A93A0]" />
                <p className="text-sm font-semibold text-[#1F2937]">Audit trail</p>
                <span className="text-xs text-[#9AA3AF]">{facilities.length} facilities on record</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden">
                <div className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.2fr] px-6 py-4 bg-[#F3F5F8] text-sm font-semibold text-[#1F2937]">
                  <span>Actor</span>
                  <span>Action</span>
                  <span>Details</span>
                  <span>Date</span>
                </div>

                {pagedLogs.length === 0 ? (
                  <p className="text-sm text-[#8A93A0] px-6 py-6">No activity recorded yet.</p>
                ) : (
                  pagedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.2fr] items-center px-6 py-4 border-b border-[#F3F5F8] last:border-0"
                    >
                      <span className="text-sm font-medium text-[#1F2937]">{log.actorName}</span>
                      <span className="text-sm text-[#6B7280] font-mono">{log.action}</span>
                      <span className="text-sm text-[#6B7280] truncate">{log.details ?? "—"}</span>
                      <span className="text-sm text-[#9AA3AF]">
                        {new Date(log.createdAt).toLocaleDateString()}{" "}
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}

                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}