"use client";

import { useCallback, useEffect, useState } from "react";
import { withClientAdminAuth } from "@/lib/adminClientAuth";
import { getApiBaseUrl } from "@/lib/api";

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
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const base = getApiBaseUrl();

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${base}/api/v1/admin/orders`, withClientAdminAuth());
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: OrderRow[] };
      setOrders(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(
        `${base}/api/v1/admin/orders/${id}`,
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }

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
              <th className="px-4 py-3 font-medium">Овог нэр / Утас</th>
              <th className="px-4 py-3 font-medium">Дүн</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
              <th className="px-4 py-3 font-medium">Огноо</th>
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
                <td className="px-4 py-3 tabular-nums">₮{o.totalAmount?.toLocaleString?.() ?? o.totalAmount}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Захиалга алга
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
