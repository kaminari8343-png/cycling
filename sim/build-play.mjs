// Copies the shared engine, text and data next to play/index.html so the page can load them.
import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const [from, to] of [["sim/engine.mjs", "engine.mjs"], ["sim/types.mjs", "types.mjs"], ["sim/events.json", "events.json"], ["data/countries.json", "countries.json"]]) {
  copyFileSync(join(root, from), join(root, "play", to));
}
console.log("play/ ready");
