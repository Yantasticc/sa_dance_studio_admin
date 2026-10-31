"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  courseId: string;
  course: Course;
  days: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: "ACTIVE" | "INACTIVE";
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [days, setDays] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const fetchData = async () => {
    try {
      const [batchesRes, coursesRes] = await Promise.all([
        apiRequest<Batch[]>("/batches"),
        apiRequest<Course[]>("/courses"),
      ]);

      if (batchesRes.success) setBatches(batchesRes.data || []);
      if (coursesRes.success) setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedule data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (batch?: Batch) => {
    if (batch) {
      setEditingId(batch.id);
      setName(batch.name);
      setCourseId(batch.courseId);
      setDays(batch.days);
      setStartTime(batch.startTime);
      setEndTime(batch.endTime);
      setCapacity(String(batch.capacity));
      setStatus(batch.status);
    } else {
      setEditingId(null);
      setName("");
      setCourseId(courses[0]?.id || "");
      setDays("Mon, Wed, Fri");
      setStartTime("18:00");
      setEndTime("19:00");
      setCapacity("25");
      setStatus("ACTIVE");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseId || !days.trim() || !startTime.trim() || !endTime.trim() || !capacity) {
      toast.error("All fields are mandatory.");
      return;
    }

    try {
      let res;
      const payload = {
        name,
        courseId,
        days,
        startTime,
        endTime,
        capacity: Number(capacity),
        status,
      };

      if (editingId) {
        res = await apiRequest(`/batches/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest("/batches", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        toast.success(editingId ? "Batch updated successfully." : "New batch created!");
        setIsOpen(false);
        fetchData();
      } else {
        toast.error(res.message || "Failed to save schedule.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save schedule batch.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    try {
      const res = await apiRequest(`/batches/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Batch schedule removed.");
        fetchData();
      } else {
        toast.error(res.message || "Failed to delete batch.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error deleting batch.");
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-black/10 rounded w-48" /><div className="h-64 bg-black/10 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Batches</h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">Manage schedule times and student capacity limits</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Batch
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
          <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
            <tr>
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Days</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
            {batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-brand-neutral-100/20">
                <td className="px-6 py-4 font-bold whitespace-nowrap">{batch.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{batch.course?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{batch.days}</td>
                <td className="px-6 py-4 whitespace-nowrap">{batch.startTime} - {batch.endTime}</td>
                <td className="px-6 py-4 whitespace-nowrap">{batch.capacity} students</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    batch.status === "ACTIVE" ? "bg-[#4ECDC4]/10 text-[#4ECDC4]" : "bg-red-500/10 text-red-500"
                  }`}>
                    {batch.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleOpenForm(batch)}
                    className="p-2 text-brand-neutral-600 hover:bg-[#F7F5F0] rounded cursor-pointer border-0 bg-transparent"
                    title="Edit batch"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded cursor-pointer border-0 bg-transparent"
                    title="Delete batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-neutral-200 z-10 p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-brand-neutral-200">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#111111] m-0">
                {editingId ? "Edit Batch Schedule" : "Add New Batch"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-brand-neutral-400 hover:text-[#111111] bg-transparent border-0 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Batch Name *</label>
                <input
                  type="text"
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                  placeholder="e.g. Evening Batch A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Course *</label>
                <select
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">— Select a course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Days *</label>
                <input
                  type="text"
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                  placeholder="e.g. Mon, Wed, Fri"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Start Time *</label>
                  <input
                    type="text"
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                    placeholder="e.g. 18:00"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">End Time *</label>
                  <input
                    type="text"
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                    placeholder="e.g. 19:00"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Capacity *</label>
                  <input
                    type="number"
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Status</label>
                  <select
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-neutral-200">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#F7F5F0] text-brand-neutral-600 font-display text-xs font-bold uppercase cursor-pointer bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
