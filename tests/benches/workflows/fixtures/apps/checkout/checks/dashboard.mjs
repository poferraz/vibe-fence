import assert from "node:assert/strict";
import { renderChart } from "../src/dashboard.mjs";

const svg = renderChart([{ label: "a", value: 2 }]);
assert.ok(svg.includes("<svg"), "chart renders svg");
assert.ok(svg.includes("rect"), "chart renders bars");
console.log("dashboard checks passed");
