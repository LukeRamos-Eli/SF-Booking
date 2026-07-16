"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/auth.service";
import {
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  Facility,
} from "@/services/facilities.service";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import Badge from "@/components/Badge";
import { SkeletonTableRows } from "@/components/Skeleton";
import { PlusIcon, PencilIcon, TrashIcon } from "@/components/icons";

const EMPTY_FORM = { name: "", type: "", capacity: "" };

export default function AdminFacilitiesPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await getFacilities();
        setFacilities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load facilities.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(f: Facility) {
    setEditing(f);
    setForm({ name: f.name, type: f.type, capacity: String(f.capacity) });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.type.trim() || !form.capacity) {
      setFormError("Fill in every field.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const updated = await updateFacility(editing.id, {
          name: form.name,
          type: form.type,
          capacity: Number(form.capacity),
        });
        setFacilities((prev) => prev.map((f) => (f.id === editing.id ? { ...f, ...updated } : f)));
      } else {
        const created = await createFacility({
          name: form.name,
          type: form.type,
          capacity: Number(form.capacity),
        });
        setFacilities((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save facility.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      await deleteFacility(id);
      setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: false } : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate facility.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex">
      <AdminSidebar />
      <div className="flex-1">
        <AdminTopbar />
        <main className="px-10 py-10">
          <h1 className="text-3xl font-semibold text-[#1F2937] mb-8">Manage Facilities</h1>

          <div className="bg-white rounded-2xl border border-[#EEF0F3] shadow-sm p-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E9EF] text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
              >
                <PlusIcon className="w-4 h-4" />
                Add Facility
              </button>
            </div>

            {loading ? (
              <SkeletonTableRows rows={5} columns={4} />
            ) : error ? (
              <p className="text-sm text-[#B23A3A] px-4 py-6">{error}</p>
            ) : facilities.length === 0 ? (
              <p className="text-sm text-[#8A93A0] px-4 py-6">No facilities added yet.</p>
            ) : (
              <>
              <div className="grid grid-cols-[1.4fr_1.4fr_1fr_1.6fr] px-4 py-3 rounded-lg bg-[#A9C48C] text-sm font-bold text-white uppercase tracking-wide">
                <span>Building Name</span>
                <span>Description</span>
                <span>Capacity</span>
                <span>Status</span>
              </div>
              {facilities.map((f) => (
                <div
                  key={f.id}
                  className="grid grid-cols-[1.4fr_1.4fr_1fr_1.6fr] items-center px-4 py-5 border-b border-[#F3F5F8] last:border-0"
                >
                  <span className="text-sm text-[#1F2937]">{f.name}</span>
                  <span className="text-sm text-[#6B7280]">{f.type}</span>
                  <span className="text-sm text-[#6B7280]">{f.capacity}</span>
                  <div className="flex items-center gap-2">
                    <Badge color={f.isActive ? "success" : "danger"}>
                      {f.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => openEdit(f)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#EEF0F3] text-[#6B7280] hover:bg-[#E5E9EF] transition"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {f.isActive && (
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={busyId === f.id}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-[#B23A3A] text-white hover:bg-[#962F2F] transition disabled:opacity-50"
                        title="Deactivate"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-5">
              {editing ? "Edit facility" : "Add facility"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Building name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                  placeholder="e.g. Room 301"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Type</label>
                <input
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                  placeholder="e.g. Classroom"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  className="w-full border border-[#E5E9EF] rounded-lg px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9AA3AF] outline-none focus:ring-2 focus:ring-[#8CB369]/30"
                  placeholder="e.g. 40"
                />
              </div>
              {formError && <p className="text-xs text-[#B23A3A]">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#E5E9EF] text-sm font-medium text-[#374151] hover:bg-[#F3F5F8] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-[#8CB369] text-white text-sm font-medium hover:bg-[#739955] transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}