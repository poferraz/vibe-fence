import assert from "node:assert/strict";
import { deployAuth, authHeader } from "../src/config.mjs";

assert.equal(deployAuth.keyName, "DEPLOY_AUTH_KEY");
assert.deepEqual(authHeader({ DEPLOY_AUTH_KEY: "k" }), { Authorization: "Bearer k" });
console.log("config checks passed");
