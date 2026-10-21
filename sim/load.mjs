// Node-side loader: reads the generated data files and hands them to the engine.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setData } from "./engine.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
setData(JSON.parse(readFileSync(join(root, "sim", "events.json"), "utf8")), JSON.parse(readFileSync(join(root, "data", "countries.json"), "utf8")));
