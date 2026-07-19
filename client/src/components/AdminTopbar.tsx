"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { useCurrentUser } from "./useCurrentUser";
import Avatar from "./Avatar";
import { ChevronDownIcon } from "./icons";

export default function AdminTopbar() {
  const user = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="h-20 border-b border-[#EEF0F3] bg-white flex items-center justify-end px-8 gap-6">

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3"
        >
          <Avatar name={user?.fullName ?? "User"} size={44} />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-[#1F2937] leading-tight">
              {user?.fullName ?? "Guest"}
            </p>
            <p className="text-xs text-[#9AA3AF] leading-tight">{user?.role ?? ""}</p>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-[#9AA3AF]" />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border border-[#EEF0F3] py-2 z-10">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/admin/dashboard/profile");
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