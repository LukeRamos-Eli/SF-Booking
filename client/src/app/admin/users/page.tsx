"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import {
  getAllUsers,
  approveUser,
  deactivateUser,
  changeUserRole,
  AdminUser,
} from "@/services/admin.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import Badge, { statusVariant } from "@/components/Badge";
import { FunnelIcon } from "@/components/icons";

const FILTERS = ["All", "Pending", "Active", "Inactive"] as const;
type Filter = (typeof FILTERS)[number];
const ROLES = ["Student", "Faculty", "Manager", "Admin"] as const;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [roleMenuId, setRoleMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await approveUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "Active" } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve account.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeactivate(id: number) {
    setBusyId(id);
    try {
      await deactivateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "Inactive" } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate account.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleChangeRole(id: number, role: (typeof ROLES)[number]) {
    setBusyId(id);
    setRoleMenuId(null);
    try {
      await changeUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = users.filter((u) => filter === "All" || u.status === filter);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">User Management</h1>

          <div className="inline-flex items-stretch bg-white rounded-xl border border-[#EEF0F3] mb-6 overflow-hidden">
            <div className="px-4 flex items-center border-r border-[#EEF0F3] text-[#9AA3AF]">
              <FunnelIcon className="w-4 h-4" />
            </div>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 text-sm font-medium border-r border-[#EEF0F3] last:border-r-0 transition ${
                  filter === f ? "text-[#1F2937] bg-[#F3F5F8]" : "text-[#8A93A0] hover:bg-[#F9FAFB]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1.6fr_2fr] px-6 py-4 text-xs font-semibold tracking-wide text-[#1F2937] uppercase border-b border-[#EEF0F3]">
              <span>Name</span>
              <span>Email</span>
              <span>Status</span>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A93A0] px-6 py-6">Loading users…</p>
            ) : error ? (
              <p className="text-sm text-[#B23A3A] px-6 py-6">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-[#8A93A0] px-6 py-6">No users match this filter.</p>
            ) : (
              filtered.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-[1.4fr_1.6fr_2fr] items-center px-6 py-5 border-b border-[#F3F5F8] last:border-0"
                >
                  <span className="text-sm font-medium text-[#1F2937]">{u.fullName}</span>
                  <a href={`mailto:${u.email}`} className="text-sm text-[#5B8CD6] underline underline-offset-2 truncate">
                    {u.email}
                  </a>
                  <div className="flex items-center gap-2 flex-wrap relative">
                    <Badge variant="role">{u.role}</Badge>
                    <Badge variant={statusVariant(u.status)}>{u.status}</Badge>

                    {u.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={busyId === u.id}
                        className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#9CC17F] text-white hover:bg-[#83AC64] transition disabled:opacity-50"
                      >
                        {busyId === u.id ? "…" : "Approve"}
                      </button>
                    )}

                    {u.status === "Active" && (
                      <>
                        <button
                          onClick={() => setRoleMenuId(roleMenuId === u.id ? null : u.id)}
                          className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#52525B] text-white hover:bg-[#3F3F46] transition"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          disabled={busyId === u.id}
                          className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#B23A3A] text-white hover:bg-[#962F2F] transition disabled:opacity-50"
                        >
                          {busyId === u.id ? "…" : "Deactivate"}
                        </button>
                      </>
                    )}

                    {roleMenuId === u.id && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-[#EEF0F3] rounded-xl shadow-lg py-2 z-10 w-36">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleChangeRole(u.id, r)}
                            className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F5F8]"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
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