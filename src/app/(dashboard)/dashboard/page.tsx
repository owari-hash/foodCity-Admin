import { fetchAdminStats, getApiBaseUrl } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Megaphone,
  ShoppingBag,
  Clock,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/50">
          <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await fetchAdminStats();
  const apiBase = getApiBaseUrl();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="break-words text-sm text-zinc-600 dark:text-zinc-400">
          API:{" "}
          <code className="inline-block max-w-full break-all rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
            {apiBase}
          </code>
        </p>
        {!stats && (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Статистик ачаалагдаагүй. MongoDB болон backend асаасан эсэхийг шалгана уу (
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">MONGODB_URI</code>,{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">npm run dev</code>).
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Өнөөдрийн захиалга"
          value={stats ? String(stats.ordersToday) : "—"}
          icon={ShoppingBag}
        />
        <StatCard
          label="Хүлээгдэж буй захиалга"
          value={stats ? String(stats.pendingOrders) : "—"}
          icon={Clock}
        />
        <StatCard
          label="Идэвхтэй борлуулалтын зар"
          value={stats ? String(stats.activeSalesAds) : "—"}
          icon={Megaphone}
        />
        <StatCard
          label="Идэвхтэй ажлын зар"
          value={stats ? String(stats.activeJobs) : "—"}
          icon={Briefcase}
        />
      </div>
    </div>
  );
}
