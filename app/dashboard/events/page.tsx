"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Plus, Edit2, Trash2, Upload, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function uploadSingleImage(file: File): Promise<string> {
  // Enforce 2MB size limit on Frontend
  if (file.size > 2 * 1024 * 1024) {
    const errorMsg = "Image size must be 2 MB or less. Please reduce the image size and try again.";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Enforce accepted types on Frontend
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    const errorMsg = "Please upload a JPG, JPEG, PNG, or WebP image.";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  const token = localStorage.getItem("sa_admin_token");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/upload?context=events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Upload failed");
  return body.data.url as string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  image: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">("UPCOMING");

  const fetchEvents = async () => {
    try {
      const res = await apiRequest<Event[]>("/events");
      if (res.success) {
        setEvents(res.data || []);
      } else {
        toast.error(res.message || "Failed to load events.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to events API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenForm = (event?: Event) => {
    if (event) {
      setEditingId(event.id);
      setName(event.name);
      setDescription(event.description);
      setDate(event.date ? event.date.split("T")[0] : "");
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location);
      setImage(event.image);
      setStatus(event.status);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("10:00");
      setEndTime("12:00");
      setLocation("S&A Dance Studio, Akola");
      setImage("/images/events/garba-workshop-poster.jpg");
      setStatus("UPCOMING");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !date || !startTime.trim() || !endTime.trim() || !location.trim() || !image.trim()) {
      toast.error("All fields are mandatory.");
      return;
    }

    try {
      let res;
      const payload = { name, description, date, startTime, endTime, location, image, status };

      if (editingId) {
        res = await apiRequest(`/events/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        toast.success(editingId ? "Event updated successfully." : "New event published!");
        setIsOpen(false);
        fetchEvents();
      } else {
        toast.error(res.message || "Failed to save event.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error saving event.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await apiRequest(`/events/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Event deleted.");
        fetchEvents();
      } else {
        toast.error(res.message || "Failed to delete event.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error deleting event.");
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-black/10 rounded w-48" /><div className="h-64 bg-black/10 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Workshops & Events</h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">Publish special workshops and events visible on the main page</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
          <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Event Name</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-brand-neutral-100/20">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={event.image} alt={event.name} className="w-12 h-12 rounded object-cover border border-brand-neutral-200" />
                </td>
                <td className="px-6 py-4 font-bold whitespace-nowrap">{event.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <p className="font-bold m-0">{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="text-brand-neutral-400 m-0">{event.startTime} - {event.endTime}</p>
                </td>
                <td className="px-6 py-4 max-w-xs truncate">{event.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    event.status === "UPCOMING"
                      ? "bg-[#4ECDC4]/10 text-[#4ECDC4]"
                      : event.status === "COMPLETED"
                      ? "bg-brand-neutral-400/10 text-brand-neutral-500"
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleOpenForm(event)}
                    className="p-2 text-brand-neutral-600 hover:bg-[#F7F5F0] rounded cursor-pointer border-0 bg-transparent"
                    title="Edit event"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded cursor-pointer border-0 bg-transparent"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Event Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-neutral-200 z-10 p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-brand-neutral-200">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#111111] m-0">
                {editingId ? "Edit Workshop / Event" : "Create Studio Event"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-brand-neutral-400 hover:text-brand-black border-0 bg-transparent cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Event Name *</label>
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
                  rows={3}
                  className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Date *</label>
                  <input type="date" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Start Time *</label>
                  <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="10:00" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">End Time *</label>
                  <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="12:00" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Location *</label>
                <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Poster Image *</label>
                <div className="flex flex-col gap-2">
                  {image && (
                    <img src={image} alt="Event poster" className="w-full h-32 object-cover rounded border border-brand-neutral-200" />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => imgInputRef.current?.click()}
                      disabled={imgUploading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-neutral-200 rounded text-sm font-display font-bold uppercase tracking-wide text-brand-neutral-600 hover:bg-[#F7F5F0] cursor-pointer bg-white disabled:opacity-50"
                    >
                      {imgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {imgUploading ? "Uploading…" : image ? "Replace Image" : "Upload Image"}
                    </button>
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImgUploading(true);
                        try {
                          const url = await uploadSingleImage(file);
                          setImage(url);
                          toast.success("Image uploaded!");
                        } catch (err: any) {
                          toast.error(err.message || "Upload failed.");
                        } finally {
                          setImgUploading(false);
                          if (imgInputRef.current) imgInputRef.current.value = "";
                        }
                      }}
                    />
                  </div>
                  {!image && <p className="font-body text-xs text-brand-neutral-400">Upload a poster image for this event.</p>}
                </div>
              </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Status</label>
                  <select className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-neutral-200">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#F7F5F0] text-brand-neutral-600 font-display text-xs font-bold uppercase cursor-pointer bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
