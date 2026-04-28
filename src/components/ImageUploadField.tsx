"use client";

import { useEffect, useRef, useState } from "react";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import {
  getApiBaseUrl,
  getPublicFrontOrigin,
  getSocketBaseUrl,
  joinBackendRequestUrl,
} from "@/lib/api";
import { ImageIcon, Loader2, Upload } from "lucide-react";

/** Match backend `UPLOAD_MAX_MB` (default 15). Set `NEXT_PUBLIC_UPLOAD_MAX_MB` to keep UI in sync. */
const UPLOAD_MAX_MB =
  Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB ?? "15") || 15;
const UPLOAD_MAX_BYTES = Math.max(1, UPLOAD_MAX_MB) * 1024 * 1024;

const MSG_TOO_LARGE = `Файлын хэмжээ хэтэрсэн (хамгийн ихдээ ~${UPLOAD_MAX_MB} МБ). Жижигрүүлээд оролдоно уу.`;

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg|avi)(\?.*)?$/i;
function isVideo(src: string) {
  return VIDEO_EXTS.test(src);
}

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/jpg,video/mp4,video/webm,video/quicktime,video/ogg,video/x-msvideo";

function previewUrl(path: string): string {
  const p = path.trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/upload/")) return `${getSocketBaseUrl()}${p}`;
  if (p.startsWith("/")) return `${getPublicFrontOrigin()}${p}`;
  return p;
}

export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/upload"),
    withClientAdminAuth({ method: "POST", body: fd }),
  );
  const gate = await ensureClientAuthorized(res);
  if (gate === "forbidden") throw new Error(PERMISSION_DENIED_MN);
  if (gate !== "ok") throw new Error("Unauthorized");
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 413) throw new Error(MSG_TOO_LARGE);
    try {
      const j = JSON.parse(t) as {
        error?: { code?: string; message?: string };
      };
      if (j?.error?.code === "FILE_TOO_LARGE") throw new Error(MSG_TOO_LARGE);
      if (j?.error?.message) throw new Error(j.error.message);
    } catch (e) {
      if (e instanceof Error && e.message === MSG_TOO_LARGE) throw e;
    }
    throw new Error(t.slice(0, 200) || "Алдаа");
  }
  const json = (await res.json()) as { data?: { path?: string } };
  const path = json.data?.path;
  if (!path) throw new Error("Invalid response");
  return path;
}

type Props = {
  value: string;
  onChange: (path: string) => void;
  showRemove?: boolean;
  onRemove?: () => void;
  previewFit?: "cover" | "contain";
};

export default function ImageUploadField({
  value,
  onChange,
  showRemove,
  onRemove,
  previewFit = "cover",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobIsVideo, setBlobIsVideo] = useState(false);
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    const pending = pendingPathRef.current;
    if (!pending || !blobUrl) return;
    if (value.trim() === pending.trim()) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      pendingPathRef.current = null;
    }
  }, [value, blobUrl]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    if (file.size > UPLOAD_MAX_BYTES) {
      setErr(MSG_TOO_LARGE);
      return;
    }
    const local = URL.createObjectURL(file);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return local;
    });
    setBlobIsVideo(file.type.startsWith("video/"));
    setBusy(true);
    try {
      const path = await uploadImageFile(file);
      pendingPathRef.current = path;
      onChange(path);
    } catch (x) {
      const failedFetch =
        x instanceof TypeError && String(x.message).includes("fetch");
      setErr(
        failedFetch
          ? "Сүлжээний алдаа эсвэл файлын хэмжээ хэтэрсэн байж магадгүй. Дахин оролдоно уу."
          : x instanceof Error
            ? x.message
            : "Алдаа",
      );
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      pendingPathRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  const remoteSrc = previewUrl(value);
  const src = blobUrl ?? remoteSrc;
  const showVideo = src && (blobUrl ? blobIsVideo : isVideo(src));

  const previewClass =
    previewFit === "contain"
      ? "h-auto max-h-[min(50vh,280px)] w-full max-w-full object-contain object-center"
      : "h-auto max-h-[min(85vh,1200px)] w-full max-w-full object-contain object-center";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700/90 dark:bg-zinc-950">
      <div
        className={`flex w-full items-center justify-center overflow-hidden bg-linear-to-b from-zinc-50 to-zinc-100/90 p-3 dark:from-zinc-900 dark:to-zinc-950 sm:p-4 ${
          previewFit === "contain"
            ? "min-h-[140px] sm:min-h-[160px]"
            : "min-h-[180px] sm:min-h-[220px]"
        }`}
      >
        {src ? (
          showVideo ? (
            <video
              key={blobUrl ?? (value || "empty")}
              src={src}
              muted
              loop
              autoPlay
              playsInline
              className={previewClass}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic CMS URLs
            <img
              key={blobUrl ?? (value || "empty")}
              src={src}
              alt=""
              decoding="async"
              fetchPriority={blobUrl ? "high" : "auto"}
              className={previewClass}
            />
          )
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-2 px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
            <div className="rounded-full bg-zinc-200/80 p-4 dark:bg-zinc-800/80">
              <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Зураг эсвэл видео оруулна уу
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:px-4">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onPick}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-none sm:justify-start"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {busy ? "Байршуулж байна..." : "Зураг / Видео оруулах"}
        </button>
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-200/90 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Устгах
          </button>
        )}
      </div>

      {err && (
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-red-600 dark:border-zinc-800 dark:text-red-400">
          {err}
        </p>
      )}
    </div>
  );
}
