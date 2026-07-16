"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { GridIcon, BuildingIcon, BookmarkIcon, GearIcon, PowerIcon } from "./icons";

const LINKS = [
  { href: "/dashboard", icon: GridIcon, label: "Dashboard" },
  { href: "/facilities", icon: BuildingIcon, label: "Facilities" },
  { href: "/bookings", icon: BookmarkIcon, label: "My bookings" },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="w-20 shrink-0 min-h-screen bg-[#B7CFA0] flex flex-col items-center justify-between pt-32 pb-6">
      <nav className="flex flex-col items-center gap-3">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition ${
                active ? "bg-[#1B4D3E] text-white" : "text-[#2F5233] hover:bg-white/40"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-[#1B4D3E]" />
              )}
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/dashboard/profile"
          title="Settings"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-[#2F5233] hover:bg-white/40 transition"
        >
          <GearIcon className="w-5 h-5" />
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-[#2F5233] hover:bg-white/40 transition"
        >
          <PowerIcon className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}