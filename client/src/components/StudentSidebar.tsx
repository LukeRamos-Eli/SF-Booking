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

  // Check if the Profile/Settings route is active
  const isProfileActive = pathname === "/dashboard/profile";

  return (
    <aside className="w-20 shrink-0 min-h-screen bg-[#B7CFA0] flex flex-col items-center justify-between pt-32 pb-6">
      <nav className="flex flex-col items-center gap-3">
        {LINKS.map(({ href, icon: Icon, label }) => {
          // FIX: If profile is active, turn off the highlight for the general dashboard link
          const active = isProfileActive ? false : pathname === href || pathname?.startsWith(href + "/");
          
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
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-md bg-[#1B4D3E]" />
              )}
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3">
        {/* Settings/Profile Link Container */}
        <Link
          href="/dashboard/profile"
          title="Settings"
          className={`relative w-14 h-14 flex items-center justify-center transition duration-200 ${
            isProfileActive 
              ? "bg-[#1B4D3E] text-white rounded-2xl shadow-md shadow-black/5" 
              : "text-[#2F5233] rounded-xl hover:bg-white/40"
          }`}
        >
          {/* Active indicator bar on the left edge if profile is open */}
          {isProfileActive && (
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-[#1B4D3E]" />
          )}
          
          <GearIcon className="w-5 h-5 currentColor" />
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