"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { useCurrentUser } from "./useCurrentUser";
import Avatar from "./Avatar";
import { ChevronDownIcon } from "./icons";

export default function StudentTopbar() {
  const user = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="h-24 bg-white border-b border-[#EEF0F3] flex items-center justify-between px-8">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#8CB369]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="5" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M6.6 7.2L10.6 11M6.6 16.8L10.6 13M13.4 11L17.4 7.2M13.4 13L17.4 16.8" />
        </svg>
        <div>
          <span className="text-2xl font-semibold leading-none">
            <span className="text-[#1F2937]">SF </span>
            <span className="text-[#8CB369]">Booking</span>
          </span>
          <p className="text-xs text-[#9AA3AF] mt-0.5">{user?.organizationName ?? "Organization"}</p>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3">
          <ChevronDownIcon className="w-4 h-4 text-[#9AA3AF]" />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1F2937] leading-tight">{user?.fullName ?? "Guest"}</p>
            <p className="text-xs text-[#9AA3AF] leading-tight">{user?.role ?? ""}</p>
          </div>
          <Avatar name={user?.fullName ?? "User"} size={44} />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border border-[#EEF0F3] py-2 z-10">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/profile");
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F5F8]"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-[#B23A3A] hover:bg-[#F3F5F8]"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}