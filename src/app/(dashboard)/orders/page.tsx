"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

type OrderRow = {
  id: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  status: string;
  createdAt?: string;
};

const statuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"] as const;

export default function OrdersPage() {
  const { lang, t } = useAdminLanguage();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/orders?lang=${lang}`),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: OrderRow[] };
      setOrders(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    }
  }, [lang, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/orders/${id}?lang=${lang}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === "mn" ? "mn-MN" : "en-US", {
      style: "currency",
      currency: "MNT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(lang === "mn" ? "mn-MN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-none space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white touch-pan-x dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">{t.orders.table.namePhone}</th>
              <th className="px-4 py-3 font-medium">{t.orders.table.amount}</th>
              <th className="px-4 py-3 font-medium">{t.orders.table.status}</th>
              <th className="px-4 py-3 font-medium">{t.orders.table.date}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-zinc-100 dark:border-zinc-800/80"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">
                    {o.customerName}
                  </div>
                  <div className="text-zinc-500">{o.phone}</div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(o.totalAmount)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t.orders.statuses[s as keyof typeof t.orders.statuses] || s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {o.createdAt ? formatDate(o.createdAt) : "—"}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  {t.orders.table.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
