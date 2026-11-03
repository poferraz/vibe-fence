import assert from "node:assert/strict";
import { app } from "../src/app.mjs";

assert.equal(app(), "tooling-ok");
console.log("app checks passed");
