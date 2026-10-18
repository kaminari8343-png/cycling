// Turns docs/events/*.md into sim/events.json.
// The markdown stays the source of truth; this reads its fixed shape.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "docs", "events");
const VALUES = ["自律", "刺激", "快楽", "達成", "権力", "安全", "同調", "伝統", "慈善", "普遍"];

function parseTiming(line) {
  const t = { who: "self", min: 18, max: 90, conds: [] };
  const cond = [...line.matchAll(/〔条件：([^〕]+)〕/g)].map((m) => m[1]);
  t.conds = cond.flatMap((c) => c.split(/。/).map((s) => s.trim()).filter(Boolean));
  const m = line.match(/(親|子)\s*(\d+)〜(\d+)歳/);
  if (m) {
    t.who = m[1] === "子" ? "child" : "self";
    t.min = +m[2];
    t.max = +m[3];
  } else if (/どの年齢でも/.test(line)) {
    t.min = 0;
    t.max = 120;
  }
  return t;
}

function parseOption(line) {
  const body = line.replace(/^\s*-\s*/, "");
  const [head, result = ""] = body.split("→");
  const weights = {};
  const paren = head.match(/（([^）]*)）/);
  if (paren) {
    for (const m of paren[1].matchAll(/(自律|刺激|快楽|達成|権力|安全|同調|伝統|慈善|普遍)([＋−])/g)) {
      weights[m[1]] = (weights[m[1]] || 0) + (m[2] === "＋" ? 1 : -1);
    }
  }
  const conds = [...head.matchAll(/〔条件：([^〕]+)〕/g)].map((m) => m[1]);
  const text = head.replace(/（[^）]*）/g, "").replace(/〔[^〕]*〕/g, "").trim();
  const outcomes = result
    .split("。")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const p = s.match(/（(\d+)割）/);
      const prob = p ? +p[1] / 10 : /統計に連動/.test(s) ? null : 1;
      return { text: s.replace(/（[^）]*）/g, "").trim(), prob };
    });
  return { text, weights, conds, outcomes };
}

const events = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  const domain = file.replace(/^\d+-|\.md$/g, "");
  const blocks = readFileSync(join(dir, file), "utf8").split(/^### /m).slice(1);
  for (const b of blocks) {
    const lines = b.split("\n");
    const [id, ...titleParts] = lines[0].trim().split(/\s+|　/);
    const ev = { id, domain, title: titleParts.join("").trim(), timing: null, likely: "", situation: "", options: [], example: "" };
    let inOptions = false;
    for (const line of lines.slice(1)) {
      if (/^- \*\*時期\*\*/.test(line)) ev.timing = parseTiming(line);
      else if (/^- \*\*起きやすさ\*\*/.test(line)) ev.likely = line.replace(/^- \*\*起きやすさ\*\*：/, "").trim();
      else if (/^- \*\*状況\*\*/.test(line)) ev.situation = line.replace(/^- \*\*状況\*\*：/, "").trim();
      else if (/^- \*\*選択肢\*\*/.test(line)) inOptions = true;
      else if (/^- \*\*年表\*\*/.test(line)) { inOptions = false; ev.example = line.replace(/^- \*\*年表\*\*：/, "").replace(/[「」]/g, "").trim(); }
      else if (inOptions && /^\s{2,}-\s/.test(line)) ev.options.push(parseOption(line));
    }
    if (!ev.timing) ev.timing = parseTiming("");
    events.push(ev);
  }
}

const bad = events.filter((e) => e.options.length < 2 || e.options.some((o) => !Object.keys(o.weights).length));
writeFileSync(join(root, "sim", "events.json"), JSON.stringify(events, null, 1));
console.log(`events: ${events.length}, options: ${events.reduce((s, e) => s + e.options.length, 0)}, with problems: ${bad.length}`);
for (const e of bad) console.log("  check", e.id, e.title);
