"use client";

import type { LucideIcon } from "lucide-react";
import { RefreshCw, Sparkles } from "lucide-react";

/** Shared form styles for the site-content editor (distinct from rest of admin). */
export const scInput =
  "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/80 dark:bg-slate-950 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-500";

export const scTextarea = (minH = "min-h-[100px]") => `${scInput} ${minH} resize-y`;

export function EditorAlerts({
  error,
  saved,
}: {
  error: string | null;
  saved: string | null;
}) {
  if (!error && !saved) return null;
  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200/90 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100"
        >
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-xs font-bold text-rose-900 dark:bg-rose-900/80 dark:text-rose-100">
            !
          </span>
          <span className="min-w-0 leading-relaxed">{error}</span>
        </div>
      )}
      {saved && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100"
        >
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-100">
            ✓
          </span>
          <span className="min-w-0 leading-relaxed">{saved}</span>
        </div>
      )}
    </div>
  );
}

type TabDef = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

export function EditorTabRail({
  tabs,
  active,
  onSelect,
  onReload,
  loading,
  saving,
}: {
  tabs: TabDef[];
  active: string;
  onSelect: (id: TabDef["id"]) => void;
  onReload: () => void;
  loading: boolean;
  saving: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 hidden items-center gap-2 lg:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Редактор
          </p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            Хуудасны агуулга
          </p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 pb-2" aria-label="Хуудас сонгох">
        {tabs.map(({ id, label, hint, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                isActive
                  ? "border-indigo-300/80 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 dark:border-indigo-500/50 dark:bg-indigo-600"
                  : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{label}</span>
                <span
                  className={`mt-0.5 block text-[11px] leading-snug ${
                    isActive ? "text-indigo-100/90" : "text-slate-500 group-hover:text-slate-600 dark:text-slate-500"
                  }`}
                >
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onReload}
        disabled={loading || saving}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
        {loading ? "Уншиж байна…" : "Дахин ачаалах"}
      </button>
    </div>
  );
}

export function EditorTabSelect({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabDef[];
  active: string;
  onSelect: (id: TabDef["id"]) => void;
}) {
  return (
    <div className="lg:hidden">
      <label htmlFor="site-content-tab" className="sr-only">
        Хуудас сонгох
      </label>
      <select
        id="site-content-tab"
        value={active}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        {tabs.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EditorSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[min(70vh,560px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/30 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10"
        aria-hidden
      />
      <div className="relative p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/60 sm:p-5">
      <header className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {hint ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
      {children}
    </div>
  );
}

export function PrimarySave({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex justify-end border-t border-slate-200/80 bg-gradient-to-t from-white via-white to-transparent px-4 pb-1 pt-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onClick()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-indigo-900/40"
      >
        {children}
      </button>
    </div>
  );
}

export function GhostButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400 ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerMini({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border border-rose-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/50 ${className}`}
    >
      {children}
    </button>
  );
}

export function ListRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      {children}
    </div>
  );
}

export function SubCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      {children}
    </div>
  );
}
