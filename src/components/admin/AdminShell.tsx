"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Briefcase,
  FileEdit,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Самбар", icon: LayoutDashboard },
  { href: "/site-content", label: "Вэб агуулга", icon: FileEdit },
  { href: "/orders", label: "Захиалга", icon: ShoppingBag },
  { href: "/sales-ads", label: "Борлуулалтын зар", icon: Megaphone },
  { href: "/jobs", label: "Ажлын зар", icon: Briefcase },
  { href: "/chat", label: "Чат", icon: MessageCircle },
];

const titles: Record<string, string> = {
  "/dashboard": "Самбар",
  "/site-content": "Вэб агуулга",
  "/orders": "Захиалга",
  "/sales-ads": "Борлуулалтын зар",
  "/jobs": "Ажлын зар",
  "/chat": "Шууд чат",
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Foodcity Admin";

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50 dark:bg-zinc-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-14 items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center rounded-md px-1 py-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Image
              src="/fclogo.png"
              alt="Food City"
              width={160}
              height={56}
              className="h-9 w-auto max-w-[148px] object-contain object-left"
              priority
            />
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
