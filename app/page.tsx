"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import Link from "next/link";
import MenuPanel from "@/components/MenuPanel";
import WalletOrders from "@/components/WalletOrders";

/*
 * HOME PAGE
 * Left: the agent chat. Right: the data the agent works on (here: tasks).
 * YOUR JOB: replace TaskList with your own data view (orders, tickets, claims, ...)
 * and add more pages under app/ (for example app/orders/page.tsx).
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the list on the right reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">CampusBite · SRM canteen ordering agent</h1>
          <p className="text-sm text-slate-500">Order food in plain English and pick it up between classes.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/kitchen" className="text-sm text-emerald-700 hover:text-emerald-900">Open kitchen screen</Link>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">Log out</button>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-5">
        <section className="md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="md:col-span-2">
          <div className="space-y-4">
            <WalletOrders refreshKey={refreshKey} />
            <MenuPanel refreshKey={refreshKey} />
          </div>
        </section>
      </div>
    </main>
  );
}
