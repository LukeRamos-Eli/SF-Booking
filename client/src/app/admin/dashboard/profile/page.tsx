"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import { getMyProfile, updateMyProfile, changePassword, UserProfile } from "@/services/users.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loadError, setLoadError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    getMyProfile()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setEmail(data.email);
      })
      .catch((err) => setLoadError(err.message));
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile(fullName, email);
      setProfile(updated);
      setProfileMsg("Profile updated successfully.");
      setEditing(false);
    } catch (err: unknown) {
      setProfileErr(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordErr("");

    if (newPassword !== confirmPassword) {
      setPasswordErr("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordErr(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }  
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <AdminTopbar />

        <main className="px-10 py-10 flex-1 overflow-y-auto">
          {loadError ? (
            <div className="border border-[#B23A3A]/30 bg-[#B23A3A]/10 rounded-xl px-4 py-3 text-sm text-[#B23A3A] max-w-3xl mx-auto">
              {loadError}
            </div>
          ) : !profile ? (
            <p className="text-sm text-[#8A93A0] text-center pt-10">Loading...</p>
          ) : (
            /* Main Content Stack - Centered and clean */
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Profile Title Header */}
              <div>
                <h1 className="text-3xl font-bold text-[#374151] tracking-tight">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-[#6B7280] font-medium mt-1">
                  {profile.role} · {profile.organizationName}
                </p>
              </div>

              {/* Account Information Card */}
              <div className="bg-[#EAECEF] rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#374151]">Account Information</h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-sm font-semibold text-green-700 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="divide-y divide-gray-300/50">
                    <div className="flex justify-between items-center py-4">
                      <span className="text-sm font-medium text-[#6B7280]">Full Name</span>
                      <span className="text-sm font-bold text-[#1F2937]">{profile.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-sm font-medium text-[#6B7280]">Email</span>
                      <span className="text-sm font-bold text-[#1F2937] underline">{profile.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-sm font-medium text-[#6B7280]">Organization</span>
                      <span className="text-sm font-bold text-[#1F2937]">{profile.organizationName}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-sm font-medium text-[#6B7280]">Status</span>
                      <span
                        className={`text-xs font-bold px-6 py-1.5 rounded-full text-white ${
                          profile.status === "Active" ? "bg-[#005A1C]" : "bg-gray-400"
                        }`}
                      >
                        {profile.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSave} className="space-y-3 pt-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border-0 rounded-lg px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-green-600 shadow-sm"
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border-0 rounded-lg px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-green-600 shadow-sm"
                      required
                    />
                    {profileErr && <p className="text-xs text-red-600">{profileErr}</p>}
                    {profileMsg && <p className="text-xs text-green-700">{profileMsg}</p>}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-green-700 text-white rounded-full px-5 py-2 text-xs font-bold hover:bg-green-800 disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setFullName(profile.fullName);
                          setEmail(profile.email);
                        }}
                        className="text-xs font-semibold text-[#6B7280] px-3 py-2 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Change Password Card */}
              <div className="bg-[#EAECEF] rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-[#374151] mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="flex flex-col items-center gap-4 w-full">
                  <div className="w-full max-w-md space-y-3">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      className="w-full bg-white border-0 rounded-lg px-4 py-3 text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (At least 8 characters)"
                      className="w-full bg-white border-0 rounded-lg px-4 py-3 text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                      required
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full bg-white border-0 rounded-lg px-4 py-3 text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                      required
                    />

                    {passwordErr && <p className="text-xs text-red-600 text-center">{passwordErr}</p>}
                    {passwordMsg && <p className="text-xs text-green-700 text-center">{passwordMsg}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-[#7E8287] text-white rounded-xl px-12 py-3 text-xs font-bold hover:bg-[#6C7075] disabled:opacity-50 mt-3 transition shadow-sm"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}