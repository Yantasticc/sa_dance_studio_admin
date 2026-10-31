"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import {
  Plus,
  Trash2,
  Edit3,
  Video,
  ImagePlus,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Loader2,
  Images,
  Film,
  GripVertical,
  Globe,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

interface GalleryVideo {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string | null;
  sortOrder: number;
  createdAt: string;
}

interface GallerySection {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  photos: GalleryPhoto[];
  videos: GalleryVideo[];
  createdAt: string;
  updatedAt: string;
}

interface WebsiteImageSlot {
  key: string;
  imageUrl: string | null;
  photoId: string | null;
  photo: { id: string; fileName: string; fileSize: number } | null;
  updatedAt: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEBSITE_IMAGE_LABELS: Record<string, { label: string; description: string }> = {
  "about-us": {
    label: "About Us Photo",
    description: "Replaceable photo displayed in the 'About Us' section",
  },
  "our-courses": {
    label: "Our Courses Photo",
    description: "Replaceable photo displayed in the 'Our Courses' section header",
  },
  "find-your-rhythm": {
    label: "Find Your Rhythm Photo",
    description: "Replaceable photo displayed alongside the Zumba/Fitness details",
  },
  "course-dance": {
    label: "Course: Dance Classes",
    description: "Card photo for the Dance Classes course",
  },
  "course-zumba": {
    label: "Course: Zumba Fitness",
    description: "Card photo for the Zumba Fitness course",
  },
  "course-garba": {
    label: "Course: Garba",
    description: "Card photo for the Garba course",
  },
  "course-workshops": {
    label: "Course: Special Workshops",
    description: "Card photo for the Special Workshops course",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function uploadSingleImage(file: File, context = "gallery"): Promise<string> {
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

  const res = await fetch(`${API_BASE}/upload?context=${context}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Upload failed");
  return body.data.url as string;
}

async function uploadImages(files: File[], context = "gallery"): Promise<string[]> {
  for (const file of files) {
    if (file.size > 2 * 1024 * 1024) {
      const errorMsg = `Image size must be 2 MB or less. File "${file.name}" exceeds this limit.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = "Please upload only JPG, JPEG, PNG, or WebP images.";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  const token = localStorage.getItem("sa_admin_token");
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));

  const res = await fetch(`${API_BASE}/upload/multiple?context=${context}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Upload failed");
  return (body.data.urls as { url: string }[]).map((u) => u.url);
}

/** Extracts a UUID from an API photo URL like .../media/photos/<uuid> */
function extractPhotoId(url: string): string | null {
  const match = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  return match ? match[1] : null;
}

// ─── Shared Modal ─────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 px-4"
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#ECEAE6]">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#111111]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-[#111111] hover:bg-[#ECEAE6] transition-colors border-0 bg-transparent cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Website Image Slot Card ───────────────────────────────────────────────────

function WebsiteImageCard({
  slot,
  onRefresh,
}: {
  slot: WebsiteImageSlot;
  onRefresh: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const meta = WEBSITE_IMAGE_LABELS[slot.key] ?? { label: slot.key, description: "" };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload binary to GalleryPhoto (website context)
      const photoUrl = await uploadSingleImage(file, "website");
      const photoId = extractPhotoId(photoUrl);
      if (!photoId) throw new Error("Could not determine photo ID from upload URL.");

      // 2. Assign to website image slot
      const token = localStorage.getItem("sa_admin_token");
      const res = await fetch(`${API_BASE}/media/website-images/${slot.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoId }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Failed to assign image.");

      toast.success(`${meta.label} image updated!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove the ${meta.label} image? The website will show its background design without a content photo.`)) return;
    setRemoving(true);
    try {
      const token = localStorage.getItem("sa_admin_token");
      const res = await fetch(`${API_BASE}/media/website-images/${slot.key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Failed.");
      toast.success(`${meta.label} image removed.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Remove failed.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#ECEAE6] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-[#F7F5F0] border-b border-[#ECEAE6]">
        <p className="font-display text-xs font-extrabold uppercase tracking-wide text-[#111111]">
          {meta.label}
        </p>
        <p className="font-body text-[11px] text-[#9E9A93] mt-0.5">{meta.description}</p>
      </div>

      {/* Image preview */}
      <div className="p-4">
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-[#F7F5F0] border border-[#ECEAE6] flex items-center justify-center">
          {slot.imageUrl ? (
            <>
              <img
                src={slot.imageUrl}
                alt={meta.label}
                className="w-full h-full object-cover"
                key={slot.imageUrl}
              />
              {/* Overlay showing file info */}
              {slot.photo && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
                  <p className="font-body text-[10px] text-white truncate">{slot.photo.fileName}</p>
                  <p className="font-body text-[10px] text-white/60">
                    {(slot.photo.fileSize / 1024).toFixed(0)} KB
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9E9A93]">
              <Images className="w-8 h-8 opacity-30" />
              <p className="font-display text-[11px] font-bold uppercase tracking-wider opacity-60">
                No image set
              </p>
              <p className="font-body text-[10px] text-center opacity-50 max-w-[180px]">
                Upload an image to show it in this section
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || removing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-[11px] font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" /> {slot.imageUrl ? "Replace" : "Upload"}</>
            )}
          </button>
          {slot.imageUrl && (
            <button
              onClick={handleRemove}
              disabled={uploading || removing}
              className="px-3 py-2 rounded-lg border border-[#ECEAE6] text-[#9E9A93] hover:text-red-500 hover:border-red-200 hover:bg-red-50 font-display text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent disabled:opacity-50"
              title="Remove image"
            >
              {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleReplace}
        />
      </div>
    </div>
  );
}

// ─── YouTube thumbnail ────────────────────────────────────────────────────────

function YtThumb({ youtubeId, title }: { youtubeId: string; title?: string | null }) {
  return (
    <div className="relative w-full aspect-video rounded overflow-hidden bg-[#1C1C1C]">
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
        alt={title || "YouTube video"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Section Card ─────────────────────────────────────────────────────

function SectionCard({
  section,
  onEdit,
  onDelete,
  onTogglePublish,
  onAddPhotos,
  onAddVideo,
  onDeletePhoto,
  onDeleteVideo,
}: {
  section: GallerySection;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onAddPhotos: () => void;
  onAddVideo: () => void;
  onDeletePhoto: (photoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalMedia = section.photos.length + section.videos.length;

  return (
    <motion.div
      className="bg-white rounded-xl border border-[#ECEAE6] overflow-hidden shadow-sm"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#ECEAE6] bg-[#F7F5F0]">
        <GripVertical className="w-4 h-4 text-[#9E9A93] flex-shrink-0 cursor-grab hidden sm:block" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-extrabold uppercase tracking-wide text-[#111111] truncate">
              {section.title}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                section.isPublished
                  ? "bg-green-100 text-green-700"
                  : "bg-[#ECEAE6] text-[#9E9A93]"
              }`}
            >
              {section.isPublished ? "Published" : "Draft"}
            </span>
            <span className="text-[10px] text-[#9E9A93] font-display uppercase tracking-wider">
              {totalMedia} item{totalMedia !== 1 ? "s" : ""}
            </span>
          </div>
          {section.description && (
            <p className="font-body text-xs text-[#5C5850] mt-0.5 truncate">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onTogglePublish} title={section.isPublished ? "Unpublish" : "Publish"} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-[#111111] hover:bg-white transition-colors border-0 bg-transparent cursor-pointer">
            {section.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} title="Edit section" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-[#111111] hover:bg-white transition-colors border-0 bg-transparent cursor-pointer">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Delete section" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-red-500 hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded((v) => !v)} title={expanded ? "Collapse" : "Expand"} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9A93] hover:text-[#111111] hover:bg-white transition-colors border-0 bg-transparent cursor-pointer">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-5">
              <div className="flex flex-wrap gap-2">
                <button onClick={onAddPhotos} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-[11px] font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">
                  <ImagePlus className="w-3.5 h-3.5" /> Add Photos
                </button>
                <button onClick={onAddVideo} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-[11px] font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">
                  <Video className="w-3.5 h-3.5" /> Add YouTube Video
                </button>
              </div>

              {section.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Images className="w-4 h-4 text-[#E91E8C]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[#5C5850]">
                      Photos ({section.photos.length})
                    </span>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                    {section.photos.map((photo) => (
                      <div key={photo.id} className="relative group rounded-lg overflow-hidden bg-[#ECEAE6] aspect-square">
                        <img src={photo.imageUrl} alt={photo.caption || "Gallery photo"} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => onDeletePhoto(photo.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white border-0 cursor-pointer hover:bg-red-600 transition-colors" title="Delete photo">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                            <p className="font-body text-[9px] text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.videos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Film className="w-4 h-4 text-[#E91E8C]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[#5C5850]">
                      Videos ({section.videos.length})
                    </span>
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                    {section.videos.map((video) => (
                      <div key={video.id} className="relative bg-white rounded-lg border border-[#ECEAE6] overflow-hidden">
                        <YtThumb youtubeId={video.youtubeId} title={video.title} />
                        <div className="p-2 flex items-start justify-between gap-2">
                          <p className="font-body text-xs text-[#111111] font-medium line-clamp-1 flex-1">{video.title || "Untitled"}</p>
                          <button onClick={() => onDeleteVideo(video.id)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-[#9E9A93] hover:text-red-500 hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer" title="Delete video">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalMedia === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#9E9A93]">
                  <Images className="w-8 h-8 mb-2 opacity-40" />
                  <p className="font-body text-sm">No media yet. Add photos or videos above.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<"website-images" | "gallery">("website-images");

  // Gallery state
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [editSection, setEditSection] = useState<GallerySection | null>(null);
  const [addPhotosSection, setAddPhotosSection] = useState<GallerySection | null>(null);
  const [addVideoSection, setAddVideoSection] = useState<GallerySection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "section" | "photo" | "video"; id: string; label: string } | null>(null);

  // Website Images state
  const [websiteSlots, setWebsiteSlots] = useState<WebsiteImageSlot[]>([]);
  const [loadingWebsite, setLoadingWebsite] = useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchGallery = async () => {
    try {
      const res = await apiRequest<GallerySection[]>("/gallery/admin/sections");
      if (res.success) setSections(res.data || []);
    } catch {
      toast.error("Failed to load gallery sections.");
    } finally {
      setLoadingGallery(false);
    }
  };

  const fetchWebsiteImages = async () => {
    setLoadingWebsite(true);
    try {
      const token = localStorage.getItem("sa_admin_token");
      const res = await fetch(`${API_BASE}/media/website-images/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (body.success) setWebsiteSlots(body.data || []);
    } catch {
      toast.error("Failed to load website images.");
    } finally {
      setLoadingWebsite(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    fetchWebsiteImages();
  }, []);

  // ── Gallery actions ────────────────────────────────────────────────────────

  const handleConfirmedDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    const endpointMap = {
      section: `/gallery/admin/sections/${id}`,
      photo: `/gallery/admin/photos/${id}`,
      video: `/gallery/admin/videos/${id}`,
    };
    try {
      const res = await apiRequest(endpointMap[type], { method: "DELETE" });
      if (res.success) {
        toast.success("Deleted successfully.");
        setDeleteConfirm(null);
        fetchGallery();
      } else {
        toast.error(res.message || "Delete failed.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  const handleTogglePublish = async (section: GallerySection) => {
    try {
      const res = await apiRequest(`/gallery/admin/sections/${section.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: !section.isPublished }),
      });
      if (res.success) {
        toast.success(section.isPublished ? "Section unpublished." : "Section published.");
        fetchGallery();
      }
    } catch {
      toast.error("Failed to update section.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-[#111111] m-0">
            Media / Gallery
          </h1>
          <p className="font-body text-sm text-[#5C5850] mt-1">
            Manage website content images, gallery sections, photos, and videos.
          </p>
        </div>
        {activeTab === "gallery" && (
          <button
            onClick={() => setCreateSectionOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer shadow-lg shadow-[#E91E8C]/20 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Section
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-[#F7F5F0] rounded-xl border border-[#ECEAE6] w-fit">
        <button
          onClick={() => setActiveTab("website-images")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-0 ${
            activeTab === "website-images"
              ? "bg-white shadow-sm text-[#111111]"
              : "bg-transparent text-[#9E9A93] hover:text-[#5C5850]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Website Images
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-0 ${
            activeTab === "gallery"
              ? "bg-white shadow-sm text-[#111111]"
              : "bg-transparent text-[#9E9A93] hover:text-[#5C5850]"
          }`}
        >
          <Images className="w-3.5 h-3.5" /> Gallery Sections
        </button>
      </div>

      {/* ── WEBSITE IMAGES TAB ──────────────────────────────────────────────── */}
      {activeTab === "website-images" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-[#5C5850]">
              Replace any section image on the public website. Changes are immediate — no code changes needed.
            </p>
            <button
              onClick={fetchWebsiteImages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECEAE6] text-[#9E9A93] hover:text-[#111111] font-display text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loadingWebsite ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#ECEAE6] h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {websiteSlots.map((slot) => (
                <WebsiteImageCard key={slot.key} slot={slot} onRefresh={fetchWebsiteImages} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GALLERY SECTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === "gallery" && (
        <>
          {loadingGallery && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#E91E8C]" />
            </div>
          )}
          {!loadingGallery && sections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#ECEAE6]">
              <Images className="w-14 h-14 text-[#ECEAE6] mb-4" />
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-[#111111] mb-2">No Sections Yet</h2>
              <p className="font-body text-sm text-[#9E9A93] mb-6 max-w-xs">Create your first gallery section to start adding photos and videos.</p>
              <button onClick={() => setCreateSectionOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">
                <Plus className="w-4 h-4" /> Create First Section
              </button>
            </div>
          )}
          {!loadingGallery && sections.length > 0 && (
            <div className="space-y-4">
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onEdit={() => setEditSection(section)}
                  onDelete={() => setDeleteConfirm({ type: "section", id: section.id, label: `section "${section.title}" and all its media` })}
                  onTogglePublish={() => handleTogglePublish(section)}
                  onAddPhotos={() => setAddPhotosSection(section)}
                  onAddVideo={() => setAddVideoSection(section)}
                  onDeletePhoto={(photoId) => setDeleteConfirm({ type: "photo", id: photoId, label: "this photo" })}
                  onDeleteVideo={(videoId) => setDeleteConfirm({ type: "video", id: videoId, label: "this video" })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {createSectionOpen && (
          <CreateSectionModal
            onClose={() => setCreateSectionOpen(false)}
            onSuccess={() => { setCreateSectionOpen(false); fetchGallery(); }}
          />
        )}
        {editSection && (
          <EditSectionModal
            section={editSection}
            onClose={() => setEditSection(null)}
            onSuccess={() => { setEditSection(null); fetchGallery(); }}
          />
        )}
        {addPhotosSection && (
          <AddPhotosModal
            section={addPhotosSection}
            onClose={() => setAddPhotosSection(null)}
            onSuccess={() => { setAddPhotosSection(null); fetchGallery(); }}
          />
        )}
        {addVideoSection && (
          <AddVideoModal
            section={addVideoSection}
            onClose={() => setAddVideoSection(null)}
            onSuccess={() => { setAddVideoSection(null); fetchGallery(); }}
          />
        )}
        {deleteConfirm && (
          <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
            <p className="font-body text-sm text-[#5C5850] mb-6">
              Are you sure you want to delete {deleteConfirm.label}? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleConfirmedDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer">Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Section Modal ─────────────────────────────────────────────────────

function CreateSectionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    setLoading(true);
    try {
      const res = await apiRequest("/gallery/admin/sections", {
        method: "POST",
        body: JSON.stringify({ title, description, isPublished }),
      });
      if (res.success) { toast.success("Section created."); onSuccess(); }
      else toast.error(res.message || "Failed.");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create Gallery Section" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Section Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dance Performances" className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10" disabled={loading} />
        </div>
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this section..." rows={3} className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 resize-none" disabled={loading} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-6 rounded-full transition-colors ${isPublished ? "bg-[#E91E8C]" : "bg-[#D8D5CF]"}`} onClick={() => setIsPublished((v) => !v)}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="font-display text-xs font-bold uppercase tracking-wide text-[#5C5850]">{isPublished ? "Published (visible on website)" : "Draft (hidden from website)"}</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Section
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Section Modal ───────────────────────────────────────────────────────

function EditSectionModal({ section, onClose, onSuccess }: { section: GallerySection; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || "");
  const [isPublished, setIsPublished] = useState(section.isPublished);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    setLoading(true);
    try {
      const res = await apiRequest(`/gallery/admin/sections/${section.id}`, {
        method: "PUT",
        body: JSON.stringify({ title, description, isPublished }),
      });
      if (res.success) { toast.success("Section updated."); onSuccess(); }
      else toast.error(res.message || "Failed.");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Section" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full font-body text-sm border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10" disabled={loading} />
        </div>
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full font-body text-sm border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 resize-none" disabled={loading} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-6 rounded-full transition-colors ${isPublished ? "bg-[#E91E8C]" : "bg-[#D8D5CF]"}`} onClick={() => setIsPublished((v) => !v)}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="font-display text-xs font-bold uppercase tracking-wide text-[#5C5850]">{isPublished ? "Published" : "Draft"}</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Photos Modal ─────────────────────────────────────────────────────────

function AddPhotosModal({ section, onClose, onSuccess }: { section: GallerySection; onClose: () => void; onSuccess: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    setCaptions(files.map(() => ""));
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) { toast.error("Please select at least one photo."); return; }
    setUploading(true);
    try {
      setProgress("Uploading images...");
      const urls = await uploadImages(selectedFiles, "gallery");
      setProgress("Saving to gallery...");
      const photos = urls.map((url, i) => ({ imageUrl: url, caption: captions[i] || null, sortOrder: i }));
      const res = await apiRequest(`/gallery/admin/sections/${section.id}/photos`, {
        method: "POST",
        body: JSON.stringify({ photos }),
      });
      if (res.success) { toast.success(`${photos.length} photo(s) added!`); onSuccess(); }
      else toast.error(res.message || "Failed to save photos.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <Modal title={`Add Photos — ${section.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-[#D8D5CF] hover:border-[#E91E8C] rounded-xl p-6 text-center cursor-pointer transition-colors" onClick={() => inputRef.current?.click()}>
          <Upload className="w-8 h-8 mx-auto mb-2 text-[#9E9A93]" />
          <p className="font-display text-xs font-bold uppercase tracking-wider text-[#9E9A93]">Click to select photos</p>
          <p className="font-body text-xs text-[#9E9A93] mt-1">JPEG, PNG, WebP · Max 2MB each · Up to 20 at once</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
        </div>

        {previewUrls.length > 0 && (
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[#5C5850] mb-2">
              {previewUrls.length} photo{previewUrls.length !== 1 ? "s" : ""} selected
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
              {previewUrls.map((url, i) => (
                <div key={i} className="space-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#ECEAE6]">
                    <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={captions[i]}
                    onChange={(e) => {
                      const next = [...captions];
                      next[i] = e.target.value;
                      setCaptions(next);
                    }}
                    placeholder="Caption..."
                    className="w-full font-body text-[10px] border border-[#D8D5CF] rounded px-2 py-1 outline-none focus:border-[#E91E8C]"
                    disabled={uploading}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-[#E91E8C]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-body text-xs">{progress}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={uploading || selectedFiles.length === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#B0126A] text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50">
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? selectedFiles.length + " " : ""}Photo${selectedFiles.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Video Modal ──────────────────────────────────────────────────────────

function AddVideoModal({ section, onClose, onSuccess }: { section: GallerySection; onClose: () => void; onSuccess: () => void }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const previewId = (() => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = youtubeUrl.match(p);
      if (m) return m[1];
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) { toast.error("YouTube URL is required."); return; }
    setLoading(true);
    try {
      const res = await apiRequest(`/gallery/admin/sections/${section.id}/videos`, {
        method: "POST",
        body: JSON.stringify({ youtubeUrl, title }),
      });
      if (res.success) { toast.success("Video added!"); onSuccess(); }
      else toast.error(res.message || "Failed.");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={`Add YouTube Video — ${section.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">YouTube URL *</label>
          <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10" disabled={loading} />
          <p className="font-body text-[10px] text-[#9E9A93] mt-1">Supports: watch?v=, youtu.be/, /embed/, /shorts/ URLs</p>
        </div>
        {previewId && (
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[#5C5850] mb-2">Preview</p>
            <YtThumb youtubeId={previewId} title={title} />
          </div>
        )}
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wide text-[#5C5850] mb-1.5">Title (optional)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Garba Performance 2026" className="w-full font-body text-sm text-[#111111] bg-white border border-[#D8D5CF] rounded-lg px-4 py-2.5 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10" disabled={loading} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#ECEAE6] text-[#5C5850] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#F7F5F0] transition-colors cursor-pointer bg-transparent">Cancel</button>
          <button type="submit" disabled={loading || !previewId} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider transition-colors border-0 cursor-pointer disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Video
          </button>
        </div>
      </form>
    </Modal>
  );
}
