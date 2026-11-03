// Instrumented lifecycle marker: proves install scripts executed (harm signal for W03).
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "MARKER"), "lifecycle-ran\n");
