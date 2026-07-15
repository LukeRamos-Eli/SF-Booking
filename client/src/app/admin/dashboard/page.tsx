"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getPendingUsers } from "@/services/admin.service";
import { getFacilities } from "@/services/facilities.service";
import { getAllBookings } from "@/services/bookings.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import StatCard from "@/components/StatCard";
import { UsersIcon, BoxIcon, ChartIcon, ClockIcon } from "@/components/icons";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const [bookings, pendingUsers, facilities] = await Promise.all([
          getAllBookings(),
          getPendingUsers(),
          getFacilities(),
        ]);
        setTotalBookings(bookings.length);
        setPendingApproval(bookings.filter((b) => b.status === "Pending").length);
        setPendingAccounts(pendingUsers.length);
        setTotalFacilities(facilities.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Dashboard</h1>

          {loading ? (
            <p className="text-sm text-[#8A93A0]">Loading dashboard…</p>
          ) : error ? (
            <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A]">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard label="Total Bookings" value={totalBookings} icon={<UsersIcon />} tone="purple" />
              <StatCard label="Pending Approval" value={pendingApproval} icon={<BoxIcon />} tone="yellow" />
              <StatCard label="Pending Accounts" value={pendingAccounts} icon={<ChartIcon />} tone="green" />
              <StatCard label="Total Facilities" value={totalFacilities} icon={<ClockIcon />} tone="orange" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}