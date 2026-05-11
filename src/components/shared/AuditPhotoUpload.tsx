"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  entityType: "APPLICATION" | "DISBURSEMENT" | "DISTRIBUTION";
  entityId:   string;
}

interface Photo {
  id:       string;
  file_url: string;
  taken_at: string;
  latitude?: number;
  longitude?: number;
}

export default function AuditPhotoUpload({ entityType, entityId }: Props) {
  const [photos,   setPhotos]   = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/admin/audit-photos?entityType=${entityType}&entityId=${entityId}`)
      .then((r) => r.json())
      .then((data) => setPhotos(data ?? []))
      .catch(() => {});
  }, [entityType, entityId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // Get geolocation
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // geolocation denied — proceed without it
    }

    try {
      // Upload to Supabase Storage
      const supabase = createClient();
      const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`;
      const { data: upload, error: uploadErr } = await supabase.storage
        .from("audit-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { publicUrl } } = supabase.storage
        .from("audit-photos")
        .getPublicUrl(upload.path);

      // Save metadata
      const res = await fetch("/api/admin/audit-photos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ entityType, entityId, fileUrl: publicUrl, latitude: lat, longitude: lng }),
      });
      if (!res.ok) throw new Error("Failed to save photo metadata.");

      const newPhoto = await res.json();
      setPhotos((prev) => [newPhoto, ...prev]);
    } catch (err) {
      setError((err as Error).message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide font-semibold">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} on record
        </p>
        <label className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-colors
          ${uploading
            ? "bg-gray-100 text-gray-400 cursor-wait"
            : "bg-makati-blue text-white hover:bg-blue-800"}`}
        >
          <Camera className="w-3.5 h-3.5" />
          {uploading ? "Uploading…" : "Add Photo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer"
              className="relative group overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-slate-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.file_url}
                alt="Audit photo"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
              {(p.latitude && p.longitude) && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] flex items-center gap-0.5 px-1 py-0.5 rounded">
                  <MapPin className="w-2.5 h-2.5" />
                  {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic">No photos uploaded yet.</p>
      )}
    </div>
  );
}
