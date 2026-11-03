// Minimal checkout stub: totals a cart, no external calls.
export function checkout(cart) {
  if (!Array.isArray(cart)) throw new Error("cart must be an array");
  const total = cart.reduce((sum, item) => sum + (item.price ?? 0) * (item.qty ?? 1), 0);
  return { ok: true, total };
}
