import { NextResponse } from "next/server";
import { kitchenStatusSchema } from "@/lib/schemas";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const nextStatus: Record<string, string> = {
  placed: "preparing",
  preparing: "ready",
  ready: "collected",
};

export async function GET() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, student_id, total, status, created_at, wallets(name), pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
    .in("status", ["placed", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[GET /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = kitchenStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order status update", details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", parsed.data.order_id)
    .single();
  if (findError) {
    console.error("[POST /api/kitchen]", findError.message);
    return NextResponse.json({ error: findError.message }, { status: 404 });
  }
  if (nextStatus[order.status] !== parsed.data.status) {
    return NextResponse.json({ error: `Order can only move from ${order.status} to ${nextStatus[order.status] ?? "a valid next status"}.` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.order_id)
    .eq("status", order.status)
    .select("id, status")
    .single();
  if (error) {
    console.error("[POST /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
