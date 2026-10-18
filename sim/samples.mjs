// Writes docs/samples.md: a few families, each lived with the parent's own values and with a player's.
import { writeFileSync } from "node:fs";
import { compare, toMarkdown } from "./run.mjs";

const runs = [["sample-1", "dictator"], ["sample-7", "keeper"], ["sample-11", "heretic"]];
const head = `# シミュレーションの出力例

\`node sim/samples.mjs\` で生成。出来事は [events/](events/)、仕組みは [design.md](design.md)、統計は [statistics.md](statistics.md)。

- 同じ家族を、親のもともとの価値観（左）と、プレイヤーの価値観（右）で一度ずつ生きる。偶然（出来事が起きるか、結果、死）は両方で同じ乱数を使う。
- 〔親〕は親の判断、〔子〕は大人になった子の判断。分かれ目には、プレイヤーの答えを添える（最大4か所）。
- 確率や重みは仮の値。親のもともとの価値観は、世界価値観調査のデータをつなぐまでの仮の作り方（人間開発指数から傾向をつけ、個人差を足す）。

`;
writeFileSync(new URL("../docs/samples.md", import.meta.url), head + runs.map(([s, p]) => toMarkdown(compare(s, p))).join("\n"));
console.log("wrote docs/samples.md");
