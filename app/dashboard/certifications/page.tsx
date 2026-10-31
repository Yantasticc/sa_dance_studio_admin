"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../../../lib/toast";
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  Award,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Certification {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  imageUrl: string | null;
  photoId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const res = await fetch(`${API_BASE}/upload?context=certifications`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Upload failed");
  return body.data.url as string;
}

function extractPhotoId(url: string): string | null {
  const match = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  return match ? match[1] : null;
}

async function apiCall(path: string, options?: RequestInit) {
  const token = localStorage.getItem("sa_admin_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  return res.json();
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 px-4" onClick={onClose}>
      <motion.div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#ECEAE6]">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#111111]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-[#111111] hover:bg-[#ECEAE6] transition-colors border-0 bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Certification Form ───────────────────────────────────────────────────────

function CertificationForm({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: Certification;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [photoId, setPhotoId] = useState(initial?.photoId ?? "");
  const [imgUploading, setImgUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const url = await uploadSingleImage(file);
      const id = extractPhotoId(url);
      setImageUrl(url);
      setPhotoId(id ?? "");
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        photoId: photoId || null,
        sortOrder: Number(sortOrder) || 0,
        isPublished,
      };

      let body;
      if (initial) {
        body = await apiCall(`/certifications/admin/${initial.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        body = await apiCall("/certifications/admin", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (body.success) {
        toast.success(initial ? "Certification updated." : "Certification added.");
        onSuccess();
      } else {
        toast.error(body.message || "Failed to save.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Zumba Instructor Certification 2024"
          className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10"
          disabled={saving}
        />
      </div>
      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this certification..."
          rows={2}
          className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 resize-none"
          disabled={saving}
        />
      </div>
      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Certificate Image</label>
        <div className="space-y-2">
          {imageUrl && (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#ECEAE6]">
              <img src={imageUrl} alt="Certification preview" className="w-full h-full object-contain bg-[#F7F5F0]" />
              <button
                type="button"
                onClick={() => { setImageUrl(""); setPhotoId(""); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center border-0 cursor-pointer hover:bg-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={imgUploading || saving}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#D8D5CF] hover:border-[#E91E8C] rounded-lg text-[#9E9A93] hover:text-[#E91E8C] font-display text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent disabled:opacity-50"
          >
            {imgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {imgUploading ? "Uploading…" : imageUrl ? "Replace Image" : "Upload Image"}
          </button>
          <input ref={imgInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
            className="w-full font-body text-sm border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C]"
            disabled={saving}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-10 h-6 rounded-full transition-colors ${isPublished ? "bg-[#E91E8C]" : "bg-[#D8D5CF]"}`}
              onClick={() => setIsPublished((v) => !v)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="font-display text-xs font-bold uppercase tracking-wide text-[#5C5850]">{isPublished ? "Published" : "Draft"}</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving || imgUploading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initial ? "Save Changes" : "Add Certification"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Certification | null>(null);

  const fetchCerts = async () => {
    try {
      const body = await apiCall("/certifications/admin");
      if (body.success) setCerts(body.data || []);
    } catch {
      toast.error("Failed to load certifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, []);

  const handleTogglePublish = async (cert: Certification) => {
    try {
      const body = await apiCall(`/certifications/admin/${cert.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: !cert.isPublished }),
      });
      if (body.success) {
        toast.success(cert.isPublished ? "Hidden from website." : "Published to website.");
        fetchCerts();
      }
    } catch {
      toast.error("Failed to update.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const body = await apiCall(`/certifications/admin/${deleteConfirm.id}`, { method: "DELETE" });
      if (body.success) {
        toast.success("Certification deleted.");
        setDeleteConfirm(null);
        fetchCerts();
      } else {
        toast.error(body.message || "Delete failed.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-[#111111] m-0">
            Certifications
          </h1>
          <p className="font-body text-sm text-[#5C5850] mt-1">
            Manage S&A Dance Studio certifications and achievements shown on the public website.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer shadow-lg shadow-[#E91E8C]/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#E91E8C]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && certs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#ECEAE6]">
          <Award className="w-14 h-14 text-[#ECEAE6] mb-4" />
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-[#111111] mb-2">No Certifications Yet</h2>
          <p className="font-body text-sm text-[#9E9A93] mb-6 max-w-xs">
            Add your first certification to showcase S&A Dance Studio's achievements on the website.
          </p>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">
            <Plus className="w-4 h-4" /> Add First Certification
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && certs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((cert, i) => (
            <motion.div
              key={cert.id}
              className="bg-white rounded-xl border border-[#ECEAE6] overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {/* Image */}
              <div className="relative w-full h-44 bg-[#F7F5F0] flex items-center justify-center overflow-hidden">
                {cert.imageUrl ? (
                  <img src={cert.imageUrl} alt={cert.title} className="w-full h-full object-contain p-3" />
                ) : (
                  <Award className="w-12 h-12 text-[#D8D5CF]" />
                )}
                {/* Status badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cert.isPublished ? "bg-green-100 text-green-700" : "bg-[#ECEAE6] text-[#9E9A93]"}`}>
                  {cert.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display text-sm font-extrabold text-[#111111] uppercase tracking-wide leading-tight">{cert.title}</h3>
                {cert.description && <p className="font-body text-xs text-[#9E9A93] mt-1 line-clamp-2">{cert.description}</p>}

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[#ECEAE6]">
                  <button
                    onClick={() => handleTogglePublish(cert)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-[#ECEAE6] text-[#9E9A93] hover:text-[#111111] font-display text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent"
                    title={cert.isPublished ? "Hide from website" : "Publish to website"}
                  >
                    {cert.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {cert.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => { setEditing(cert); setFormOpen(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ECEAE6] text-[#9E9A93] hover:text-[#111111] hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cert)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ECEAE6] text-[#9E9A93] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer bg-transparent"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {formOpen && (
          <Modal
            title={editing ? "Edit Certification" : "Add Certification"}
            onClose={() => { setFormOpen(false); setEditing(null); }}
          >
            <CertificationForm
              initial={editing ?? undefined}
              onClose={() => { setFormOpen(false); setEditing(null); }}
              onSuccess={() => { setFormOpen(false); setEditing(null); fetchCerts(); }}
            />
          </Modal>
        )}
        {deleteConfirm && (
          <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
            <p className="font-body text-sm text-[#5C5850] mb-6">
              Delete certification <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
