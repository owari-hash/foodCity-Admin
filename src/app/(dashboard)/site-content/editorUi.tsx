"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser } from "lucide-react";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

/** Shared form styles for the site-content editor (distinct from rest of admin). */
export const scInput =
  "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600/80 dark:bg-slate-950 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-500";

export const scTextarea = (minH = "min-h-[100px]") =>
  `${scInput} ${minH} resize-y`;

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
}: {
  tabs: TabDef[];
  active: string;
  onSelect: (id: TabDef["id"]) => void;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 hidden items-center gap-2 lg:flex">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {t.nav.siteContent}
          </p>
        </div>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 pb-2"
        aria-label={t.siteContent.selectPage}
      >
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
                <span className="block text-sm font-semibold leading-tight">
                  {label}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] leading-snug ${
                    isActive
                      ? "text-indigo-100/90"
                      : "text-slate-500 group-hover:text-slate-600 dark:text-slate-500"
                  }`}
                >
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
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
  const { t } = useAdminLanguage();
  return (
    <div className="lg:hidden">
      <label htmlFor="site-content-tab" className="sr-only">
        {t.siteContent.selectPage}
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
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/80 to-indigo-50/30 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10"
        aria-hidden
      />
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}

/** Collapsible block — cuts vertical scroll; use with `id` for SectionTOC / jump. */
export function EditorSection({
  id,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      id={id}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200/85 bg-white/95 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/75"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/90 dark:hover:bg-slate-800/60 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500"
          aria-hidden
        />
      </summary>
      <div className="space-y-5 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5">
        {children}
      </div>
    </details>
  );
}

export function SectionTOC({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const { t } = useAdminLanguage();
  if (items.length === 0) return null;
  return (
    <nav
      className="hidden w-[12rem] shrink-0 2xl:block"
      aria-label="Table of Contents"
    >
      <div className="sticky top-2 max-h-[min(72vh,calc(100dvh-7rem))] overflow-y-auto rounded-xl border border-slate-200/80 bg-white/95 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t.siteContent.title} (TOC)
        </p>
        <ul className="space-y-0.5">
          {items.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="block rounded-lg px-2 py-1.5 text-xs leading-snug text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-900 dark:text-slate-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-100"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function SectionJumpSelect({
  items,
  selectKey,
}: {
  items: { id: string; label: string }[];
  /** e.g. tab id — resets the control when switching pages */
  selectKey: string;
}) {
  const { t } = useAdminLanguage();
  if (items.length === 0) return null;
  const jumpId = `site-content-jump-${selectKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return (
    <div className="2xl:hidden">
      <label htmlFor={jumpId} className="sr-only">
        Jump to section
      </label>
      <select
        id={jumpId}
        key={selectKey}
        defaultValue=""
        onChange={(e) => {
          const id = e.target.value;
          if (id) {
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="" disabled>
          {t.siteContent.selectPage}...
        </option>
        {items.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Full-width row: main column + optional sticky TOC (2xl+). */
export function EditorBody({
  sectionItems,
  sectionJumpKey = "",
  children,
}: {
  sectionItems?: { id: string; label: string }[];
  /** Resets the mobile section jump when switching tabs (e.g. `tab` id). */
  sectionJumpKey?: string;
  children: React.ReactNode;
}) {
  const items = sectionItems ?? [];
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:gap-8">
      <div className="min-w-0 w-full flex-1 space-y-4">
        {items.length > 0 ? (
          <SectionJumpSelect items={items} selectKey={sectionJumpKey} />
        ) : null}
        {children}
      </div>
      {items.length > 0 ? <SectionTOC items={items} /> : null}
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
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
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
      {hint ? (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      ) : null}
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

export function FormattingToolbar({
  onAction,
}: {
  onAction: (action: string, value?: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("bold"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("italic"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-3 bg-slate-200 mx-1 dark:bg-slate-700" />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("justifyLeft"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("justifyCenter"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("justifyRight"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("justifyFull"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Justify"
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-3 bg-slate-200 mx-1 dark:bg-slate-700" />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onAction("removeFormat"); }}
        className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Clear Formatting"
      >
        <Eraser className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function VisualEditor({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const handleAction = (action: string, val?: string) => {
    document.execCommand(action, false, val);
  };

  return (
    <div className="flex flex-col h-full">
      <FormattingToolbar onAction={handleAction} />
      <div
        contentEditable
        suppressContentEditableWarning
        className={`w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:text-slate-100 ${multiline ? "min-h-[100px] overflow-y-auto" : "whitespace-nowrap overflow-x-auto"}`}
        onBlur={(e) => {
          let html = e.currentTarget.innerHTML;
          if (html === "<br>" || html === "<p><br></p>" || html.trim() === "") {
            html = "";
          }
          onChange(html);
        }}
        dangerouslySetInnerHTML={{ __html: value }}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
          }
        }}
      />
      {!value && placeholder && (
        <span className="pointer-events-none absolute left-3.5 top-[38px] text-sm text-slate-400 opacity-50">
          {placeholder}
        </span>
      )}
    </div>
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

export function DualInput({
  label,
  mnValue,
  enValue,
  onChangeMN,
  onChangeEN,
  required = false,
}: {
  label: string;
  mnValue: string;
  enValue: string;
  onChangeMN: (val: string) => void;
  onChangeEN: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-indigo-100/50 bg-white dark:border-indigo-900/30 dark:bg-slate-950">
          <VisualEditor value={mnValue} onChange={onChangeMN} placeholder="Монгол" />
          <span className="absolute right-3 top-[38px] select-none text-[10px] font-bold text-slate-300 dark:text-slate-700">
            MN
          </span>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-amber-100/50 bg-white dark:border-amber-900/30 dark:bg-slate-950">
          <VisualEditor value={enValue} onChange={onChangeEN} placeholder="English" />
          <span className="absolute right-3 top-[38px] select-none text-[10px] font-bold text-slate-300 dark:text-slate-700">
            EN
          </span>
        </div>
      </div>
    </div>
  );
}

export function DualTextarea({
  label,
  mnValue,
  enValue,
  onChangeMN,
  onChangeEN,
  rows = 4,
  required = false,
}: {
  label: string;
  mnValue: string;
  enValue: string;
  onChangeMN: (val: string) => void;
  onChangeEN: (val: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-indigo-100/50 bg-white dark:border-indigo-900/30 dark:bg-slate-950">
          <VisualEditor value={mnValue} onChange={onChangeMN} placeholder="Монгол" multiline />
          <span className="absolute right-3 top-[38px] select-none text-[10px] font-bold text-slate-300 dark:text-slate-700">
            MN
          </span>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-amber-100/50 bg-white dark:border-amber-900/30 dark:bg-slate-950">
          <VisualEditor value={enValue} onChange={onChangeEN} placeholder="English" multiline />
          <span className="absolute right-3 top-[38px] select-none text-[10px] font-bold text-slate-300 dark:text-slate-700">
            EN
          </span>
        </div>
      </div>
    </div>
  );
}


export function ListRow({ children }: { children: React.ReactNode }) {
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

export function MoveControls({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isFirst}
        onClick={onMoveUp}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
        title="Move Up"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={onMoveDown}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
        title="Move Down"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-indigo-600 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-indigo-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    </div>
  );
}
