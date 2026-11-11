import { NextResponse } from "next/server";
import { CURRENT_STUDENT_ID } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [{ data: wallet, error: walletError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("wallets").select("student_id, name, balance").eq("student_id", CURRENT_STUDENT_ID).single(),
    supabase
      .from("orders")
      .select("id, total, status, created_at, pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (walletError || ordersError) {
    const message = walletError?.message ?? ordersError?.message ?? "Could not load student data";
    console.error("[GET /api/me]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ wallet, orders });
}
