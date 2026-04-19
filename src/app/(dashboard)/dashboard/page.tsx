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
  actionLabel = "Бүгдийг харах",
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  actionLabel?: string;
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

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; icon: LucideIcon; className: string }> = {
    pending: {
      label: "Хүлээгдэж буй",
      icon: Clock3,
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    confirmed: {
      label: "Баталгаажсан",
      icon: CheckCircle2,
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    },
    preparing: {
      label: "Бэлтгэгдэж буй",
      icon: Package,
      className: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    },
    delivered: {
      label: "Хүргэгдсэн",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    cancelled: {
      label: "Цуцлагдсан",
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("mn-MN", {
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
  const statsResult = await fetchAdminStats();
  const stats = statsResult.data;

  let recentOrders: Order[] = [];
  let recentConversations: Conversation[] = [];

  try {
    const ordersRes = await apiGet<{ data: Order[] }>("/api/v1/admin/orders?limit=5");
    recentOrders = ordersRes.data.slice(0, 5);
  } catch {
    recentOrders = [];
  }

  try {
    const convRes = await apiGet<{ data: Conversation[] }>("/api/v1/admin/conversations?limit=5");
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
              ? "Статистик ачаалагдсангүй. Серверийн нэвтрэх эрх хүчингүй байна — дахин нэвтэрнэ үү. Үргэлжилбэл: admin болон API дээрх ADMIN_JWT_SECRET ижил эсэх, серверээс API руу зөв хаяг (API_INTERNAL_URL) ашиглаж байгаа эсэхийг шалгана уу."
              : "Статистик ачаалагдаагүй. API холболт болон backend статусыг шалгана уу."}
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Статистик</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          
          <StatCard
            label="Хүлээгдэж буй захиалга"
            value={stats ? String(stats.pendingOrders) : "—"}
            icon={Clock}
            trend={stats ? `Нийт ${stats.totalOrders || 0} захиалга` : undefined}
            color="amber"
          />
          <StatCard
            label="Нээлттэй чат"
            value={stats ? String(stats.openConversations ?? 0) : "—"}
            icon={MessageCircle}
            trend={stats && stats.humanModeChats ? `${stats.humanModeChats} хүнтэй холбогдох хүсэлттэй` : undefined}
            color="blue"
          />
          <StatCard
            label="Идэвхтэй контент"
            value={stats ? String((stats.activeSalesAds || 0) + (stats.activeJobs || 0)) : "—"}
            icon={Megaphone}
            trend={stats ? `${stats.activeSalesAds} зар, ${stats.activeJobs} ажлын байр` : undefined}
            color="violet"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Хурдан үйлдэл</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/orders"
            label="Захиалгууд"
            description="Хүлээгдэж буй захиалгыг харах"
            icon={ShoppingBag}
          />
          <QuickAction
            href="/chat"
            label="Чат"
            description="Харилцагчтай чатлах"
            icon={MessageCircle}
          />
          <QuickAction
            href="/sales-ads"
            label="Борлуулалтын зар"
            description="Шинэ зар нэмэх"
            icon={Plus}
          />
          <QuickAction
            href="/site-content"
            label="Вэб агуулга"
            description="Сайтын мэдээлэл засах"
            icon={FileEdit}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Сүүлийн захиалгууд" href="/orders">
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Одоогоор захиалга байхгүй
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {order.customerName}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(order.createdAt)} · {order.phone}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Сүүлийн чатууд" href="/chat">
          {recentConversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Одоогоор идэвхтэй чат байхгүй
            </p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div
                  key={conv._id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {conv.displayName || `Зочин ${conv.guestId.slice(0, 8)}`}
                      </p>
                      {conv.humanMode && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                          <Users className="h-3 w-3" />
                          Хүн холбох
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(conv.updatedAt)} · {conv.status === "open" ? "Нээлттэй" : "Хаасан"}
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
