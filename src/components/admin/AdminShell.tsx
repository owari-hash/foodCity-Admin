"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Briefcase,
  FileEdit,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  adminClientHasPermission,
  clearClientAdminToken,
  readClientAdminProfile,
  readClientAdminToken,
  type AdminPermissionKey,
} from "@/lib/adminClientAuth";
import { ADMIN_BASE_PATH, pathnameWithoutBase } from "@/lib/adminBasePath";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  perm: AdminPermissionKey;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Самбар", icon: LayoutDashboard, perm: "dashboard" },
  { href: "/site-content", label: "Вэб агуулга", icon: FileEdit, perm: "site-content" },
  { href: "/orders", label: "Захиалга", icon: ShoppingBag, perm: "orders" },
  { href: "/sales-ads", label: "Борлуулалтын зар", icon: Megaphone, perm: "sales-ads" },
  { href: "/jobs", label: "Ажлын зар", icon: Briefcase, perm: "jobs" },
  { href: "/chat", label: "Чат", icon: MessageCircle, perm: "chat" },
  { href: "/users", label: "Админ хэрэглэгчид", icon: Users, perm: "admin-users" },
];

const titles: Record<string, string> = {
  "/dashboard": "Самбар",
  "/site-content": "Вэб агуулга",
  "/orders": "Захиалга",
  "/sales-ads": "Борлуулалтын зар",
  "/jobs": "Ажлын зар",
  "/chat": "Шууд чат",
  "/users": "Админ хэрэглэгчид",
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = pathnameWithoutBase(usePathname());
  const title = titles[pathname] ?? "Админ хуудас";
  const [navOpen, setNavOpen] = useState(false);
  const [perms, setPerms] = useState<string[]>([]);
  const [who, setWho] = useState<string>("");

  useEffect(() => {
    const prof = readClientAdminProfile();
    if (prof?.permissions?.length) {
      setPerms(prof.permissions);
      setWho(prof.displayName || prof.username);
      return;
    }
    if (readClientAdminToken()) {
      setPerms(["*"]);
      setWho("Админ");
    }
  }, []);

  const visibleNav = navItems.filter((item) => adminClientHasPermission(perms, item.perm));

  async function logout() {
    try {
      await fetch(`${ADMIN_BASE_PATH}/api/auth/logout`, { method: "POST" });
    } finally {
      clearClientAdminToken();
      router.replace("/login");
      router.refresh();
    }
  }

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className="flex min-h-dvh flex-1 overflow-x-hidden bg-zinc-50 dark:bg-zinc-900">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Цэс хаах"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,92vw)] shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
          navOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative flex min-h-17 items-center justify-center border-b border-zinc-200 px-12 py-3 dark:border-zinc-800 lg:px-3">
          <Link
            href="/dashboard"
            className="flex max-w-full items-center justify-center rounded-md px-2 py-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600"
            onClick={() => setNavOpen(false)}
          >
            <Image
              src={`${ADMIN_BASE_PATH}/fclogo.png`}
              alt="Food City"
              width={240}
              height={84}
              className="h-14 w-auto max-w-[min(100%,220px)] object-contain sm:h-16 sm:max-w-[min(100%,240px)]"
              priority
            />
          </Link>
          <button
            type="button"
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 shrink-0 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Цэс хаах"
            onClick={() => setNavOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
                onClick={() => setNavOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:gap-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Цэс нээх"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
              {title}
            </h1>
            {who ? (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{who}</p>
            ) : null}
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Гарах</span>
          </button>
        </header>
        <main className="flex min-h-0 flex-1 overflow-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
