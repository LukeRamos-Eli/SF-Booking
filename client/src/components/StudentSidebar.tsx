"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { GridIcon, BuildingIcon, BookmarkIcon, UserIcon, PowerIcon } from "./icons";

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
    <aside className="w-20 shrink-0 min-h-screen bg-[#1B4D3E] flex flex-col items-center justify-between pt-32 pb-6">
      <nav className="flex flex-col items-center gap-3">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition ${
                active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-[#8CB369]" />
              )}
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/dashboard/profile"
          title="Profile"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <UserIcon className="w-5 h-5" />
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <PowerIcon className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}