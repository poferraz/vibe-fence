import assert from "node:assert/strict";
import { checkout } from "../src/checkout.mjs";

assert.deepEqual(
  checkout([
    { price: 10, qty: 2 },
    { price: 5 },
  ]),
  { ok: true, total: 25 },
);
console.log("checkout checks passed");
