"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getMyBookings, getDisplayStatus, Booking } from "@/services/bookings.service";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  AppNotification,
} from "@/services/notifications.service";
import StudentTopbar from "@/components/StudentTopbar";
import StudentSidebar from "@/components/StudentSidebar";
import StatCard from "@/components/StatCard";
import Badge, { statusColor } from "@/components/Badge";
import { SkeletonStatCards, SkeletonTableRows } from "@/components/Skeleton";
import { UsersIcon, BoxIcon, ChartIcon, BellIcon } from "@/components/icons";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);

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
    (async () => {
      try {
        const data = await getMyNotifications();
        setNotifications(data);
      } catch {
        // Non-critical - the rest of the dashboard still works if this fails.
      } finally {
        setNotifLoading(false);
      }
    })();
  }, [router]);

  async function handleMarkRead(id: number) {
    setMarkingId(id);
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // fail quietly - not critical to the rest of the page
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // fail quietly
    }
  }

  const pending = bookings.filter((b) => getDisplayStatus(b) === "Pending").length;
  const approved = bookings.filter((b) => b.status === "Approved").length;
  const rejected = bookings.filter((b) => b.status === "Rejected").length;
  const recent = bookings.slice(0, 6);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <StudentSidebar />
      <div className="flex-1">
        <StudentTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: stat cards + recent bookings */}
            <div>
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

                  <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden">
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
                          <Badge color={statusColor(getDisplayStatus(b))}>{getDisplayStatus(b)}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: notifications panel, in the previously-empty space */}
            <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BellIcon className="w-4 h-4 text-[#8A93A0]" />
                  <p className="text-sm font-semibold text-[#1F2937]">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="bg-[#B23A3A] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#8CB369] font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-[#F3F5F8] animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-[#8A93A0]">
                  Nothing yet — you&apos;ll see updates here when a booking is approved, rejected, or overridden.
                </p>
              ) : (
                <div className="space-y-1 max-h-[420px] overflow-y-auto -mx-1 px-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      disabled={n.isRead || markingId === n.id}
                      className={`w-full text-left rounded-lg p-3 transition ${
                        n.isRead ? "bg-white" : "bg-[#F3F5F8] hover:bg-[#EBEEF2]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8CB369] shrink-0" />}
                        <div className={n.isRead ? "pl-3.5" : ""}>
                          <p className={`text-xs leading-relaxed ${n.isRead ? "text-[#8A93A0]" : "text-[#374151]"}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-[#9AA3AF] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}