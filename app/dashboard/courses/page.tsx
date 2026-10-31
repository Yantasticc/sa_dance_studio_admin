"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";
import ImagePicker from "../../../components/ImagePicker";

interface Course {
  id: string;
  name: string;
  description: string;
  image: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const fetchCourses = async () => {
    try {
      const res = await apiRequest<Course[]>("/courses");
      if (res.success) {
        setCourses(res.data || []);
      } else {
        toast.error(res.message || "Failed to load courses.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database connectivity issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenForm = (course?: Course) => {
    if (course) {
      setEditingId(course.id);
      setName(course.name);
      setDescription(course.description);
      setImage(course.image);
      setStatus(course.status);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setImage("/images/classes/dance-classes-poster.jpg");
      setStatus("ACTIVE");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !image.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await apiRequest(`/courses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name, description, image, status }),
        });
      } else {
        res = await apiRequest("/courses", {
          method: "POST",
          body: JSON.stringify({ name, description, image, status }),
        });
      }

      if (res.success) {
        toast.success(editingId ? "Course details updated." : "Course created successfully!");
        setIsOpen(false);
        fetchCourses();
      } else {
        toast.error(res.message || "Failed to save course.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error saving course.");
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await apiRequest(`/courses/${course.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.success) {
        toast.success(`Course ${course.name} is now ${nextStatus.toLowerCase()}.`);
        fetchCourses();
      } else {
        toast.error(res.message || "Failed to update course status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error toggling status.");
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-black/10 rounded w-48" /><div className="h-64 bg-black/10 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Courses</h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">Manage S&A dance styles and classes</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
          <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Course Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-brand-neutral-100/20">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={course.image} alt={course.name} className="w-12 h-12 rounded object-cover border border-brand-neutral-200" />
                </td>
                <td className="px-6 py-4 font-bold whitespace-nowrap">{course.name}</td>
                <td className="px-6 py-4 max-w-xs truncate">{course.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    course.status === "ACTIVE" ? "bg-[#4ECDC4]/10 text-[#4ECDC4]" : "bg-red-500/10 text-red-500"
                  }`}>
                    {course.status === "ACTIVE" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleOpenForm(course)}
                    className="p-2 text-brand-neutral-600 hover:bg-[#F7F5F0] rounded cursor-pointer border-0 bg-transparent"
                    title="Edit course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(course)}
                    className={`p-2 rounded cursor-pointer border-0 bg-transparent ${
                      course.status === "ACTIVE" ? "text-red-500 hover:bg-red-50" : "text-[#4ECDC4] hover:bg-[#4ECDC4]/10"
                    }`}
                    title={course.status === "ACTIVE" ? "Deactivate course" : "Activate course"}
                  >
                    {course.status === "ACTIVE" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-neutral-200 z-10 p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-brand-neutral-200">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#111111] m-0">
                {editingId ? "Edit Course" : "Add New Course"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-brand-neutral-400 hover:text-[#111111] bg-transparent border-0 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Course Name *</label>
                <input
                  type="text"
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Description *</label>
                <textarea
                  rows={4}
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <ImagePicker value={image} onChange={setImage} />

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
