"use client";

import { useEffect, useState } from "react";

type MenuItem = { id: number; name: string; category: string; price: number; is_veg: boolean; stock: number };
const groups = ["meal", "snack", "sweet", "drink"];

export default function MenuPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load menu");
        if (active) {
          setItems(result.items);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load menu");
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
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Today&apos;s menu</h2>
        <p className="text-xs text-slate-500">Live stock · refreshes every 5 seconds</p>
      </div>
      {error && <p className="p-4 text-sm text-red-600">{error}</p>}
      {!error && groups.map((group) => {
        const groupItems = items.filter((item) => item.category === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="border-b border-slate-100 last:border-0">
            <h3 className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}s</h3>
            <ul className="divide-y divide-slate-50">
              {groupItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="min-w-0 flex-1">{item.name}</span>
                  {item.stock === 0 ? <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Sold out</span> : item.stock <= 3 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Only {item.stock} left</span> : null}
                  <span className="font-medium">Rs {item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
