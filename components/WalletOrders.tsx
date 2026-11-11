"use client";

import { useEffect, useState } from "react";

type OrderItem = { quantity: number; price: number; menu_items: { name: string } | { name: string }[] | null };
type Order = {
  id: number;
  total: number;
  status: string;
  pickup_slots: { slot_time: string } | { slot_time: string }[] | null;
  order_items: OrderItem[];
};
type MeData = { wallet: { name: string; balance: number }; orders: Order[] };

function related<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function WalletOrders({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<MeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load wallet");
        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load wallet");
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-400">CampusBite wallet</p>
        <p className="mt-1 text-3xl font-semibold">Rs {data?.wallet.balance ?? "--"}</p>
        <p className="mt-2 text-sm text-slate-300">{data?.wallet.name ?? "Loading..."}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3"><h2 className="font-semibold">My orders today</h2></div>
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {!error && data?.orders.length === 0 && <p className="p-4 text-sm text-slate-500">No orders yet.</p>}
        <ul className="divide-y divide-slate-100">
          {data?.orders.map((order) => {
            const slot = related(order.pickup_slots);
            return (
              <li key={order.id} className="space-y-2 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{order.status}</span>
                </div>
                <p className="text-xs text-slate-500">Pickup {slot?.slot_time?.slice(0, 5) ?? "—"}</p>
                <p className="text-slate-700">{order.order_items.map((item) => `${item.quantity} × ${related(item.menu_items)?.name ?? "item"}`).join(", ")}</p>
                <p className="font-medium">Rs {order.total}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
