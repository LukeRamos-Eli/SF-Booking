"use client";

import { useEffect, useMemo, useState } from "react";
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
import Badge, { statusColor } from "@/components/Badge";
import Pagination from "@/components/Pagination";
import { SkeletonTableRows } from "@/components/Skeleton";
import { FunnelIcon, ChevronDownIcon, SearchIcon } from "@/components/icons";

const FILTERS = ["All", "Pending", "Active", "Inactive"] as const;
type Filter = (typeof FILTERS)[number];
const ROLES = ["Student", "Faculty", "Manager", "Admin"] as const;
const PAGE_SIZE = 7;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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

  function changeFilter(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesFilter = filter === "All" || u.status === filter;
      const matchesSearch =
        query === "" ||
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [users, filter, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">User Management</h1>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="inline-flex items-stretch bg-white rounded-xl border border-[#EEF0F3] overflow-hidden">
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

            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <SearchIcon className="w-4 h-4 text-[#9AA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-white border border-[#EEF0F3] rounded-full pl-11 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTableRows rows={7} columns={4} />
          ) : error ? (
            <p className="text-sm text-[#B23A3A]">{error}</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1.3fr_1.6fr_1.4fr_1.8fr] px-6 py-4 bg-[#A9C48C] text-sm font-bold text-white uppercase tracking-wide">
                <span>Name</span>
                <span>Email</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {paged.length === 0 ? (
                <p className="text-sm text-[#8A93A0] px-6 py-6">
                  No users match {search.trim() ? "your search" : "this filter"}.
                </p>
              ) : (
                paged.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1.3fr_1.6fr_1.4fr_1.8fr] items-center px-6 py-5 border-b border-[#F3F5F8] last:border-0"
                  >
                    <span className="text-sm font-medium text-[#1F2937]">{u.fullName}</span>
                    <a
                      href={`mailto:${u.email}`}
                      className="text-sm text-[#5B8CD6] underline underline-offset-2 truncate"
                    >
                      {u.email}
                    </a>

                    {/* Read-only badges - deliberately separated from the action buttons below */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color="role" tone="soft">{u.role}</Badge>
                      <Badge color={statusColor(u.status)} tone="soft">{u.status}</Badge>
                    </div>

                    {/* Clickable actions - visually distinct pill buttons with real hover states */}
                    <div className="flex items-center gap-2 flex-wrap relative">
                      {u.status === "Pending" && (
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={busyId === u.id}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B4D3E] text-white hover:bg-[#153D31] transition disabled:opacity-50"
                        >
                          {busyId === u.id ? "…" : "Approve"}
                        </button>
                      )}

                      {u.status === "Active" && (
                        <>
                          <button
                            onClick={() => setRoleMenuId(roleMenuId === u.id ? null : u.id)}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#A9AFB8] text-[#1F2937] hover:bg-[#98A0AB] transition"
                          >
                            Change Role
                            <ChevronDownIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            disabled={busyId === u.id}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#B23A3A] text-white hover:bg-[#962F2F] transition disabled:opacity-50"
                          >
                            {busyId === u.id ? "…" : "Deactivate"}
                          </button>
                        </>
                      )}

                      {u.status === "Inactive" && (
                        <span className="text-xs text-[#9AA3AF] italic">No actions available</span>
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

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}