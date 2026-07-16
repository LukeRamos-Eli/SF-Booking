"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { useCurrentUser } from "./useCurrentUser";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-white border-r border-[#EEF0F3] flex flex-col justify-between py-8">
      <div>
        <div className="px-7 mb-10">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#8CB369]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="5" cy="6" r="2" />
              <circle cx="5" cy="18" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="6" r="2" />
              <circle cx="19" cy="18" r="2" />
              <path d="M6.6 7.2L10.6 11M6.6 16.8L10.6 13M13.4 11L17.4 7.2M13.4 13L17.4 16.8" />
            </svg>
            <span className="text-xl font-semibold">
              <span className="text-[#1F2937]">SF </span>
              <span className="text-[#8CB369]">Booking</span>
            </span>
          </div>
          <p className="text-xs text-[#9AA3AF] mt-1 ml-8">
            {user?.organizationName ?? "Organization"}
          </p>
        </div>

        <nav className="px-4 space-y-1">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#1B4D3E] text-white"
                    : "text-[#374151] hover:bg-[#F3F5F8]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 space-y-1">
        <Link
          href="/admin/dashboard/profile"
          className="block px-4 py-3 rounded-xl text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
        >
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}