import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_STUDENT_ID } from "../campusbite";

const getMenu = defineTool({
  name: "getMenu",
  description: "Use this when the student wants to browse today's available menu. You can filter by category, vegetarian items, or maximum price.",
  schema: z.object({
    category: z.enum(["meal", "snack", "drink", "sweet"]).optional(),
    veg_only: z.boolean().optional().describe("Only vegetarian items"),
    max_price: z.number().int().positive().optional().describe("Maximum price in rupees"),
  }),
  run: async ({ category, veg_only, max_price }) => {
    let query = getSupabase()
      .from("menu_items")
      .select("id, name, category, price, is_veg, stock, prep_minutes, description")
      .gt("stock", 0)
      .order("category")
      .order("price");
    if (category) query = query.eq("category", category);
    if (veg_only) query = query.eq("is_veg", true);
    if (max_price) query = query.lte("price", max_price);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { count: data.length, items: data };
  },
});

const getWalletBalance = defineTool({
  name: "getWalletBalance",
  description: "Use this when the student asks about their wallet balance or whether they can afford an order.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("wallets")
      .select("student_id, name, balance")
      .eq("student_id", CURRENT_STUDENT_ID)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const getPickupSlots = defineTool({
  name: "getPickupSlots",
  description: "Use this when the student asks for pickup times or before placing an order. Returns slots with free places.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("pickup_slots")
      .select("id, slot_time, capacity, booked")
      .order("slot_time");
    if (error) throw new Error(error.message);
    return {
      slots: data
        .filter((slot) => slot.booked < slot.capacity)
        .map((slot) => ({ ...slot, free_places: slot.capacity - slot.booked })),
    };
  },
});

const getMyOrders = defineTool({
  name: "getMyOrders",
  description: "Use this when the student asks about their recent orders or needs an order id for cancellation.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, total, status, created_at, pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return { orders: data };
  },
});

const placeOrder = defineTool({
  name: "placeOrder",
  description: "Use this when the student has confirmed food and a pickup time. Call getMenu, getWalletBalance and getPickupSlots first when needed. Never place an order without a slot id.",
  writes: true,
  schema: z.object({
    slot_id: z.number().int().positive().describe("Pickup slot id from getPickupSlots"),
    items: z.array(z.object({
      menu_item_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })).min(1).max(5),
  }),
  run: async ({ slot_id, items }) => {
    const { data, error } = await getSupabase().rpc("place_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_slot_id: slot_id,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const cancelOrder = defineTool({
  name: "cancelOrder",
  description: "Use this when the student asks to cancel one of their orders. Call getMyOrders first if the order id is unknown. Cancellation is allowed only before cooking starts.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().positive().describe("The student's order id"),
  }),
  run: async ({ order_id }) => {
    const { data, error } = await getSupabase().rpc("cancel_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_order_id: order_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tools: AgentTool[] = [
  getMenu,
  getWalletBalance,
  getPickupSlots,
  getMyOrders,
  placeOrder,
  cancelOrder,
];
