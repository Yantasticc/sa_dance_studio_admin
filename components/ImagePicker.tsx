"use client";

import { useState, useRef } from "react";
import { toast } from "../lib/toast";
import { Image as ImageIcon, Upload, X } from "lucide-react";

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
}

const PRESET_GALLERY = [
  "/images/classes/dance-classes-poster.jpg",
  "/images/classes/zumba-poster.png",
  "/images/events/garba-workshop-poster.jpg",
  "/images/events/admissions-open-poster.jpg",
  "/images/gallery/gallery-dance.jpg",
  "/images/gallery/gallery-zumba.jpg"
];

export default function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be 2 MB or less. Please reduce the image size and try again.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("token") || localStorage.getItem("sa_admin_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      
      const res = await fetch(`${apiBase}/upload?context=courses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onChange(data.data.url);
        toast.success("Image uploaded successfully.");
      } else {
        toast.error(data.message || "Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">
        Course Image *
      </label>

      {value ? (
        <div className="relative w-full overflow-hidden rounded border border-brand-neutral-200 bg-brand-neutral-100 group">
          <img 
            src={value} 
            alt="Course preview" 
            className="w-full h-48 object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="px-3 py-1.5 bg-white text-brand-black text-xs font-bold uppercase rounded cursor-pointer border-0"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold uppercase rounded cursor-pointer border-0"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full border-2 border-dashed border-brand-neutral-200 rounded p-8 flex flex-col items-center justify-center gap-4 bg-brand-neutral-100/50">
          <ImageIcon className="w-8 h-8 text-brand-neutral-400" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="px-4 py-2 bg-white border border-brand-neutral-200 rounded text-brand-neutral-600 text-xs font-bold uppercase cursor-pointer hover:bg-brand-neutral-100"
            >
              Choose from Gallery
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#E91E8C] border border-[#E91E8C] text-white rounded text-xs font-bold uppercase cursor-pointer hover:bg-[#E91E8C]/90 flex items-center gap-1.5 disabled:opacity-50"
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading..." : "Browse Files"}
            </button>
          </div>
        </div>
      )}

      <input 
        type="file" 
        accept="image/jpeg,image/png,image/webp,image/gif" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowGallery(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 z-10 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-brand-neutral-200">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#111111] m-0">
                Select from Gallery
              </h3>
              <button onClick={() => setShowGallery(false)} className="text-brand-neutral-400 hover:text-[#111111] bg-transparent border-0 cursor-pointer font-bold">✕</button>
            </div>
            
            <div className="overflow-y-auto flex-grow pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PRESET_GALLERY.map((img) => (
                  <div 
                    key={img} 
                    className="relative cursor-pointer group rounded overflow-hidden border border-brand-neutral-200"
                    onClick={() => {
                      onChange(img);
                      setShowGallery(false);
                    }}
                  >
                    <img src={img} alt="Gallery item" className="w-full h-32 object-cover object-center group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
