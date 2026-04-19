"use client";

import { useEffect, useRef, useState } from "react";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, getPublicFrontOrigin, getSocketBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { ImageIcon, Loader2, Upload } from "lucide-react";

function previewUrl(path: string): string {
  const p = path.trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/upload/")) {
    return `${getSocketBaseUrl()}${p}`;
  }
  if (p.startsWith("/")) {
    return `${getPublicFrontOrigin()}${p}`;
  }
  return p;
}

export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/upload"),
    withClientAdminAuth({
      method: "POST",
      body: fd,
    }),
  );
  const gate = await ensureClientAuthorized(res);
  if (gate === "forbidden") {
    throw new Error(PERMISSION_DENIED_MN);
  }
  if (gate !== "ok") {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Upload failed");
  }
  const json = (await res.json()) as { data?: { path?: string } };
  const path = json.data?.path;
  if (!path) throw new Error("Invalid response");
  return path;
}

type Props = {
  value: string;
  onChange: (path: string) => void;
  /** Show remove row button (e.g. slide list) */
  showRemove?: boolean;
  onRemove?: () => void;
  /**
   * Both preserve aspect ratio (`object-contain`). `cover` allows a taller preview (slides);
   * `contain` uses a smaller cap (logos, marks).
   * @default "cover"
   */
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
  /** Instant preview while upload runs; cleared once parent `value` matches uploaded path */
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
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
    const local = URL.createObjectURL(file);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return local;
    });
    setBusy(true);
    try {
      const path = await uploadImageFile(file);
      pendingPathRef.current = path;
      onChange(path);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Алдаа");
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

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700/90 dark:bg-zinc-950">
      <div
        className={`flex w-full items-center justify-center overflow-hidden bg-linear-to-b from-zinc-50 to-zinc-100/90 p-3 dark:from-zinc-900 dark:to-zinc-950 sm:p-4 ${
          previewFit === "contain" ? "min-h-[140px] sm:min-h-[160px]" : "min-h-[180px] sm:min-h-[220px]"
        }`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic CMS URLs
          <img
            key={blobUrl ?? (value || "empty")}
            src={src}
            alt=""
            decoding="async"
            fetchPriority={blobUrl ? "high" : "auto"}
            className={
              previewFit === "contain"
                ? "h-auto max-h-[min(50vh,280px)] w-full max-w-full object-contain object-center"
                : "h-auto max-h-[min(85vh,1200px)] w-full max-w-full object-contain object-center"
            }
          />
        ) : (
          <div
            className="flex w-full flex-col items-center justify-center gap-2 px-6 py-12 text-center text-zinc-400 dark:text-zinc-500"
          >
            <div className="rounded-full bg-zinc-200/80 p-4 dark:bg-zinc-800/80">
              <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Зураг оруулна уу</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:px-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
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
          Зураг оруулах
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
