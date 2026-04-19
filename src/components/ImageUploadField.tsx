"use client";

import { useId, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { ImageIcon, Loader2, Upload } from "lucide-react";

function previewUrl(path: string): string {
  const p = path.trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/upload/")) {
    return `${getApiBaseUrl().replace(/\/$/, "")}${p}`;
  }
  return p;
}

export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/upload`, {
    method: "POST",
    body: fd,
  });
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
   * `cover` fills the preview (may crop). `contain` shows the full image (logos, marks).
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
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const path = await uploadImageFile(file);
      onChange(path);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  const src = previewUrl(value);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={`flex h-24 w-full shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 sm:h-28 sm:w-44 ${
            previewFit === "contain" ? "items-center justify-center p-2" : ""
          }`}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic CMS URLs
            <img
              src={src}
              alt=""
              className={
                previewFit === "contain"
                  ? "max-h-full max-w-full object-contain"
                  : "h-full w-full object-cover"
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <ImageIcon className="h-10 w-10" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor={inputId} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Зам
          </label>
          <input
            id={inputId}
            type="text"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder=""
            autoComplete="off"
          />
          {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
          <div className="flex flex-wrap items-center gap-2">
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
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden />
              )}
              Зураг оруулах
            </button>
            {showRemove && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-red-600 underline dark:text-red-400"
              >
                Устгах
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
