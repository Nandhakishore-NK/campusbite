"use client";

import { useEffect, useState } from "react";

type Related<T> = T | T[] | null;
type KitchenOrder = {
  id: number;
  total: number;
  status: "placed" | "preparing" | "ready";
  wallets: Related<{ name: string }>;
  pickup_slots: Related<{ slot_time: string }>;
  order_items: { quantity: number; menu_items: Related<{ name: string }> }[];
};

function related<T>(value: Related<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

const columns: { status: KitchenOrder["status"]; title: string; next: "preparing" | "ready" | "collected"; button: string }[] = [
  { status: "placed", title: "New orders", next: "preparing", button: "Start preparing" },
  { status: "preparing", title: "Preparing", next: "ready", button: "Mark ready" },
  { status: "ready", title: "Ready for pickup", next: "collected", button: "Collected" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/kitchen", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load kitchen orders");
      setOrders(data.orders);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load kitchen orders");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);

  async function advance(order: KitchenOrder, status: string) {
    try {
      const response = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update order");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CampusBite kitchen</h1>
          <p className="text-sm text-slate-400">Live order board · refreshes every 3 seconds</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">● Live</span>
      </header>
      {error && <p className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section key={column.status} className="rounded-xl bg-slate-900 p-4">
            <h2 className="mb-3 font-semibold">{column.title} <span className="text-sm text-slate-500">({orders.filter((order) => order.status === column.status).length})</span></h2>
            <div className="space-y-3">
              {orders.filter((order) => order.status === column.status).map((order) => {
                const student = related(order.wallets);
                const slot = related(order.pickup_slots);
                return (
                  <article key={order.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Order #{order.id}</h3>
                      <span className="text-sm text-amber-300">{slot?.slot_time?.slice(0, 5) ?? "—"}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{student?.name ?? order.id}</p>
                    <p className="mt-3 text-sm text-slate-200">{order.order_items.map((item) => `${item.quantity} × ${related(item.menu_items)?.name ?? "item"}`).join(", ")}</p>
                    <p className="mt-2 text-sm font-medium">Rs {order.total}</p>
                    <button onClick={() => advance(order, column.next)} className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">{column.button}</button>
                  </article>
                );
              })}
              {orders.filter((order) => order.status === column.status).length === 0 && <p className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">No orders</p>}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
