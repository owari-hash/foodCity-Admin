import { cookies } from "next/headers";
import { fetchAdminStats, apiGet } from "@/lib/apiServer";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  ShoppingBag,
  Clock,
  Package,
  MessageCircle,
  Users,
  ArrowRight,
  Plus,
  FileEdit,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { adminTranslations, AdminTranslations } from "@/lib/admin-translations";

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "emerald",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: "emerald" | "blue" | "amber" | "rose" | "violet";
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{trend}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-700"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-1 dark:text-zinc-600" />
    </Link>
  );
}

function SectionCard({
  title,
  href,
  children,
  actionLabel,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: AdminTranslations }) {
  const statusConfig: Record<string, { label: string; icon: LucideIcon; className: string }> = {
    pending: {
      label: t.orders.statuses.pending,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    confirmed: {
      label: t.orders.statuses.confirmed,
      icon: CheckCircle2,
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    },
    preparing: {
      label: t.orders.statuses.preparing,
      icon: Package,
      className: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    },
    delivered: {
      label: t.orders.statuses.delivered,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    cancelled: {
      label: t.orders.statuses.cancelled,
      icon: AlertCircle,
      className: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function formatCurrency(amount: number, lang: string): string {
  return new Intl.NumberFormat(lang === "mn" ? "mn-MN" : "en-US", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string, lang: string): string {
  return new Date(date).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Order = {
  _id: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

type Conversation = {
  _id: string;
  displayName?: string;
  guestId: string;
  humanMode: boolean;
  status: string;
  updatedAt: string;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("admin-lang")?.value || "mn") as "mn" | "en";
  const t = adminTranslations[lang];

  const statsResult = await fetchAdminStats();
  const stats = statsResult.data;

  let recentOrders: Order[] = [];
  let recentConversations: Conversation[] = [];

  try {
    const ordersRes = await apiGet<{ data: Order[] }>(`/api/v1/admin/orders?limit=5&lang=${lang}`);
    recentOrders = ordersRes.data.slice(0, 5);
  } catch {
    recentOrders = [];
  }

  try {
    const convRes = await apiGet<{ data: Conversation[] }>(`/api/v1/admin/conversations?limit=5&lang=${lang}`);
    recentConversations = convRes.data.slice(0, 5);
  } catch {
    recentConversations = [];
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {!stats && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-400">
            {statsResult.error === "unauthorized"
              ? t.dashboard.alerts.unauthorized
              : statsResult.error === "forbidden"
                ? t.dashboard.alerts.forbidden
                : t.dashboard.alerts.notLoaded}
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t.dashboard.stats.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t.dashboard.stats.pendingOrders}
            value={stats ? String(stats.pendingOrders) : "—"}
            icon={Clock}
            trend={stats ? t.dashboard.stats.totalOrders(stats.totalOrders || 0) : undefined}
            color="amber"
          />
          <StatCard
            label={t.dashboard.stats.openChats}
            value={stats ? String(stats.openConversations ?? 0) : "—"}
            icon={MessageCircle}
            trend={stats && stats.humanModeChats ? t.dashboard.stats.humanRequests(stats.humanModeChats) : undefined}
            color="blue"
          />
          <StatCard
            label={t.dashboard.stats.activeContent}
            value={stats ? String((stats.activeSalesAds || 0) + (stats.activeJobs || 0)) : "—"}
            icon={Megaphone}
            trend={stats ? t.dashboard.stats.contentDetail(stats.activeSalesAds, stats.activeJobs) : undefined}
            color="violet"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t.dashboard.quickActions.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/orders"
            label={t.dashboard.quickActions.orders.label}
            description={t.dashboard.quickActions.orders.desc}
            icon={ShoppingBag}
          />
          <QuickAction
            href="/chat"
            label={t.dashboard.quickActions.chat.label}
            description={t.dashboard.quickActions.chat.desc}
            icon={MessageCircle}
          />
          <QuickAction
            href="/sales-ads"
            label={t.dashboard.quickActions.sales.label}
            description={t.dashboard.quickActions.sales.desc}
            icon={Plus}
          />
          <QuickAction
            href="/site-content"
            label={t.dashboard.quickActions.content.label}
            description={t.dashboard.quickActions.content.desc}
            icon={FileEdit}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t.dashboard.recentOrders.title} href="/orders" actionLabel={t.dashboard.recentOrders.viewAll}>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t.dashboard.recentOrders.empty}
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <div
                  key={order._id || i}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {order.customerName}
                      </p>
                      <StatusBadge status={order.status} t={t} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(order.createdAt, lang)} · {order.phone}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(order.totalAmount, lang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t.dashboard.recentChats.title} href="/chat" actionLabel={t.dashboard.recentOrders.viewAll}>
          {recentConversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t.dashboard.recentChats.empty}
            </p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conv, i) => (
                <div
                  key={conv._id || i}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {conv.displayName || t.dashboard.recentChats.guest(conv.guestId.slice(0, 8))}
                      </p>
                      {conv.humanMode && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                          <Users className="h-3 w-3" />
                          {t.dashboard.recentChats.connectHuman}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(conv.updatedAt, lang)} · {conv.status === "open" ? t.dashboard.recentChats.open : t.dashboard.recentChats.closed}
                    </p>
                  </div>
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      conv.status === "open" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
