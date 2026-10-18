// Runs both lives for a family and prints them side by side as markdown.
// usage: node sim/run.mjs [seed] [profile]   (profile: dictator | keeper | heretic)
import { live, pickCountry, nativeValues, center, topValue, TYPE_NAMES, QUOTES, describeEnd, VALUES } from "./engine.mjs";

export const PROFILES = {
  dictator: { label: "独裁的支配者 ── 平等を語りながら", v: { 自律: 0.2, 刺激: -0.1, 快楽: -0.3, 達成: 0.5, 権力: 0.9, 安全: 0, 同調: -0.5, 伝統: -0.4, 慈善: -0.3, 普遍: 0.8 } },
  keeper: { label: "掟の継承者", v: { 自律: -0.7, 刺激: -0.6, 快楽: -0.5, 達成: 0, 権力: 0.1, 安全: 0.6, 同調: 0.7, 伝統: 0.9, 慈善: 0.5, 普遍: -0.2 } },
  heretic: { label: "孤高の異端者 ── 冒険に憧れながら、扉には鍵をかける", v: { 自律: 0.9, 刺激: 0.6, 快楽: 0, 達成: 0.1, 権力: -0.3, 安全: 0.6, 同調: -0.8, 伝統: -0.7, 慈善: -0.2, 普遍: 0.3 } }
};

const mkR = (seed) => (key) => { let h = 2166136261; const s = seed + "|" + key; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5; return (h >>> 0) / 4294967296; };

export function compare(seed, profileKey) {
  const prof = PROFILES[profileKey];
  const r = mkR(seed);
  const country = pickCountry(r);
  const native = nativeValues(r, country, "parentnative");
  const a = live({ seed, country, parentValues: native, label: "本来" });
  const b = live({ seed, country, parentValues: center(prof.v), label: "あなた" });
  return { seed, prof, country, native, a, b };
}

const cell = (row, who) => {
  const out = [];
  for (const n of row.notes) out.push(n);
  for (const e of row.parent) out.push(`〔親〕${e.title}：${e.choice}。${e.realized.join("。")}${e.realized.length ? "。" : ""}`);
  for (const e of row.kid) out.push(`〔子〕${e.title}：${e.choice}。${e.realized.join("。")}${e.realized.length ? "。" : ""}`);
  return out.join("<br>");
};

export function toMarkdown(res) {
  const { prof, country, native, a, b } = res;
  const lines = [];
  lines.push(`## ${country.nameJa}　あなた：${prof.label}`);
  lines.push("");
  lines.push(`- 国：${country.nameJa}（平均寿命 ${country.lifeExpectancy.toFixed(1)}歳、極度の貧困 ${country.poverty.toFixed(1)}%${country.povertyEstimated ? "（推定）" : ""}、人間開発指数 ${country.hdi}）`);
  lines.push(`- 所得の層：${["", "最も貧しい", "貧しい", "真ん中", "やや豊か", "豊か"][a.tier]}　親：${a.parent.name}（はじめ${a.rows[0].parentAge}歳）　子：${a.kid.name}`);
  lines.push(`- 本来の親：「${TYPE_NAMES[topValue(native)]}」　あなたの思想が入った親：「${prof.label}」`);
  lines.push("");
  lines.push("| 子の年齢 | 本来の人生 | あなたの思想が入った人生 |");
  lines.push("|---|---|---|");
  const n = Math.max(a.rows.length, b.rows.length);
  let quotes = 0;
  for (let i = 0; i < n; i++) {
    const ra = a.rows[i], rb = b.rows[i];
    const ca = ra ? cell(ra) : "", cb = rb ? cell(rb) : "";
    if (!ca && !cb) continue;
    let extra = "";
    if (rb && quotes < 4) {
      const diff = rb.parent.find((e) => { const o = ra && ra.parent.find((x) => x.id === e.id); return !o || o.choiceIndex !== e.choiceIndex; });
      if (diff && diff.top) { extra = `<br>── あなたの「${QUOTES[diff.top]}」に「とても似ている」という答えが、この親にそうさせた。`; quotes++; }
    }
    lines.push(`| ${(ra || rb).kidAge} | ${ca || "　"} | ${(cb || "　") + extra} |`);
  }
  lines.push("");
  lines.push("**終わり**");
  lines.push("");
  lines.push("| 本来の人生 | あなたの思想が入った人生 |");
  lines.push("|---|---|");
  const ea = describeEnd(a), eb = describeEnd(b);
  for (let i = 0; i < ea.length; i++) lines.push(`| ${ea[i]} | ${eb[i]} |`);
  lines.push("");
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const seed = process.argv[2] || "sample-1";
  const prof = process.argv[3] || "dictator";
  console.log(toMarkdown(compare(seed, prof)));
}
