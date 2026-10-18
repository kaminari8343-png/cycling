// Simulates one family twice from the same seed: once with the parent's own values,
// once with the player's values. Only the parent's values differ; every random draw
// is keyed by (seed, who, age, event), so both lives see the same luck.
// Data is handed in with setData(), so the same code runs under node and in the browser.
let EVENTS = [];
let DATA = { countries: [] };
let fit = () => 0;
export function setData(events, data) {
  EVENTS = events;
  DATA = data;
  const known = DATA.countries.filter((c) => c.extremePoverty != null);
  const n = known.length, mx = known.reduce((s, c) => s + c.hdi, 0) / n, my = known.reduce((s, c) => s + c.extremePoverty, 0) / n;
  const b = known.reduce((s, c) => s + (c.hdi - mx) * (c.extremePoverty - my), 0) / known.reduce((s, c) => s + (c.hdi - mx) ** 2, 0);
  fit = (hdi) => Math.max(0, Math.min(90, my + b * (hdi - mx))); // poverty ~ hdi, only to fill gaps
}

export const VALUES = ["自律", "刺激", "快楽", "達成", "権力", "安全", "同調", "伝統", "慈善", "普遍"];
const GROWTH = new Set(["自律", "刺激", "快楽", "慈善", "普遍"]);
const PROTECT = new Set(["安全", "同調", "伝統", "権力"]);
export const TYPE_NAMES = {
  自律: "孤高の異端者", 刺激: "火に飛び込む冒険者", 快楽: "刹那の享楽家", 達成: "野心に燃える成功者", 権力: "独裁的支配者",
  安全: "城壁を築く守り人", 同調: "空気を読む従者", 伝統: "掟の継承者", 慈善: "身内に尽くす献身家", 普遍: "理想に殉じる革命家"
};
// One portrait item per value, quoted at turning points (from docs/questions.md).
export const QUOTES = {
  自律: "自分の考えで物事を決めることを、大切にしている人", 刺激: "危なくても、心が躍ることをしてみたい人",
  快楽: "我慢するより、今を楽しみたい人", 達成: "結果を出せない自分を、許せない人", 権力: "決められる側ではなく、決める側にいたい人",
  安全: "安心して暮らせることを、何より大事にする人", 同調: "人から変に思われることを、避けたい人",
  伝統: "昔から受け継がれてきたやり方を、守りたい人", 慈善: "仲間や身内のためなら、自分を後回しにできる人",
  普遍: "世界中のすべての人が、等しく扱われるべきだと思う人"
};

// ---- randomness -------------------------------------------------------------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return (h >>> 0) / 4294967296;
}
export const mkRand = (seed) => (key) => hash(seed + "|" + key);
const gaussFrom = (r, key) => {
  const u = Math.max(1e-9, r(key + "a")), v = r(key + "b");
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---- country ------------------------------------------------------------------
// Weighted by births, so the odds of being born somewhere match the world's births.
export function pickCountry(r) {
  const w = (c) => c.births || c.population / 50;
  const total = DATA.countries.reduce((s, c) => s + w(c), 0);
  let x = r("country") * total;
  for (const c of DATA.countries) { x -= w(c); if (x <= 0) return withPoverty(c); }
  return withPoverty(DATA.countries[0]);
}
export function countryByIso(iso) { return withPoverty(DATA.countries.find((c) => c.iso === iso)); }
const JA = { IND: "インド", CHN: "中国", USA: "アメリカ", IDN: "インドネシア", PAK: "パキスタン", NGA: "ナイジェリア", BRA: "ブラジル",
  BGD: "バングラデシュ", RUS: "ロシア", MEX: "メキシコ", ETH: "エチオピア", JPN: "日本", PHL: "フィリピン", EGY: "エジプト", COD: "コンゴ民主共和国",
  VNM: "ベトナム", IRN: "イラン", TUR: "トルコ", DEU: "ドイツ", THA: "タイ", GBR: "イギリス", TZA: "タンザニア", FRA: "フランス", ZAF: "南アフリカ",
  ITA: "イタリア", KEN: "ケニア", MMR: "ミャンマー", COL: "コロンビア", KOR: "韓国", UGA: "ウガンダ", SDN: "スーダン", ESP: "スペイン", DZA: "アルジェリア",
  IRQ: "イラク", AFG: "アフガニスタン", POL: "ポーランド", CAN: "カナダ", MAR: "モロッコ", SAU: "サウジアラビア", UKR: "ウクライナ", AGO: "アンゴラ",
  UZB: "ウズベキスタン", YEM: "イエメン", PER: "ペルー", MYS: "マレーシア", GHA: "ガーナ", MOZ: "モザンビーク", NPL: "ネパール", MDG: "マダガスカル",
  CIV: "コートジボワール", VEN: "ベネズエラ", CMR: "カメルーン", NER: "ニジェール", AUS: "オーストラリア", PRK: "北朝鮮", LKA: "スリランカ", BFA: "ブルキナファソ",
  MLI: "マリ", MWI: "マラウイ", CHL: "チリ", KAZ: "カザフスタン", ZMB: "ザンビア", GTM: "グアテマラ", ECU: "エクアドル", SYR: "シリア", NLD: "オランダ",
  SEN: "セネガル", KHM: "カンボジア", TCD: "チャド", SOM: "ソマリア", ZWE: "ジンバブエ", GIN: "ギニア", RWA: "ルワンダ", BEN: "ベナン", BDI: "ブルンジ",
  TUN: "チュニジア", BOL: "ボリビア", BEL: "ベルギー", HTI: "ハイチ", CUB: "キューバ", SSD: "南スーダン", DOM: "ドミニカ共和国", CZE: "チェコ", GRC: "ギリシャ",
  JOR: "ヨルダン", PRT: "ポルトガル", AZE: "アゼルバイジャン", SWE: "スウェーデン", HND: "ホンジュラス", ARE: "アラブ首長国連邦", HUN: "ハンガリー",
  TJK: "タジキスタン", BLR: "ベラルーシ", AUT: "オーストリア", PNG: "パプアニューギニア", SRB: "セルビア", ISR: "イスラエル", CHE: "スイス", TGO: "トーゴ",
  SLE: "シエラレオネ", LAO: "ラオス", PRY: "パラグアイ", LBY: "リビア", NIC: "ニカラグア", KGZ: "キルギス", SLV: "エルサルバドル", TKM: "トルクメニスタン",
  SGP: "シンガポール", DNK: "デンマーク", FIN: "フィンランド", COG: "コンゴ共和国", NOR: "ノルウェー", LBN: "レバノン", LBR: "リベリア", PSE: "パレスチナ",
  CAF: "中央アフリカ", MRT: "モーリタニア", ERI: "エリトリア", ARG: "アルゼンチン", ROU: "ルーマニア", NZL: "ニュージーランド", IRL: "アイルランド" };
const withPoverty = (c) => ({ ...c, nameJa: JA[c.iso] || c.name, poverty: c.extremePoverty ?? fit(c.hdi), povertyEstimated: c.extremePoverty == null });

function pickTier(r, c) {
  if (r("tier") < c.poverty / 100) return 1;
  const s = Math.max(0, Math.min(1, (c.hdi - 0.4) / 0.55));
  const g = c.gini ? Math.max(0, Math.min(1, (c.gini - 25) / 30)) : 0.5; // more unequal: more mass at the ends
  const w = [0.55 - 0.45 * s + 0.1 * g, 0.3 + 0.1 * s - 0.05 * g, 0.12 + 0.23 * s - 0.05 * g, 0.03 + 0.12 * s + 0.05 * g];
  let x = r("tier2") * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 4; i++) { x -= w[i]; if (x <= 0) return i + 2; }
  return 5;
}

// Placeholder for the parent's own values until World Values Survey data is wired in:
// poorer, lower-HDI countries lean toward conservation, richer ones toward openness
// (the direction found in cross-national value surveys), plus individual noise.
export function nativeValues(r, c, key) {
  const s = Math.max(-1, Math.min(1, (c.hdi - 0.65) / 0.3));
  const base = { 安全: 0.4 - 0.3 * s, 伝統: 0.35 - 0.35 * s, 同調: 0.3 - 0.3 * s, 慈善: 0.3, 普遍: 0.25 * s, 自律: -0.1 + 0.35 * s,
    刺激: -0.2 + 0.2 * s, 快楽: -0.2 + 0.25 * s, 達成: 0.05, 権力: -0.15 };
  const v = {};
  for (const k of VALUES) v[k] = base[k] + 0.35 * gaussFrom(r, key + k);
  return center(v);
}
export function center(v) {
  const m = VALUES.reduce((s, k) => s + v[k], 0) / VALUES.length;
  const o = {};
  for (const k of VALUES) o[k] = v[k] - m;
  return o;
}
export const topValue = (v) => VALUES.reduce((a, b) => (v[b] > v[a] ? b : a));

// ---- names ----------------------------------------------------------------------
const NAMES = {
  IND: ["アーラヴ", "プリヤ", "ヴィクラム", "アナニャ", "ラフル", "ミーラ"], CHN: ["ウェイ", "リン", "ハオ", "メイ", "ジュン", "ファン"],
  NGA: ["チディ", "アマカ", "トゥンデ", "ンゴジ", "エメカ", "フンケ"], PAK: ["アリ", "アイシャ", "ハムザ", "ファティマ", "ビラル", "サナ"],
  IDN: ["ブディ", "シティ", "アグス", "デウィ", "リズキ", "プトリ"], USA: ["ジェイク", "エミリー", "ノア", "オリビア", "イーサン", "グレース"],
  BRA: ["ペドロ", "ジュリア", "マテウス", "ラリッサ", "ラファエル", "ベアトリス"], BGD: ["ラヒム", "ナスリン", "カリム", "ルビナ", "ジャミル", "シャプラ"],
  ETH: ["アベベ", "ティギスト", "ダウィット", "メロン", "ヨナス", "ハナ"], COD: ["ジャン", "グラース", "パトリス", "エステル", "フィストン", "ルース"],
  JPN: ["はると", "ゆい", "そうた", "めい", "りく", "さくら"], MEX: ["サンティアゴ", "ルシア", "マテオ", "カミラ", "ディエゴ", "バレンティナ"],
  PHL: ["ミゲル", "アンジェラ", "カルロ", "ジャスミン", "パオロ", "ビア"], EGY: ["オマル", "ヌール", "ユセフ", "マリアム", "カリム", "サルマ"],
  VNM: ["アン", "リン", "ミン", "ハー", "ズン", "マイ"], RUS: ["イワン", "アンナ", "ドミトリー", "マリア", "セルゲイ", "オリガ"],
  TUR: ["メフメト", "エリフ", "アフメト", "ゼイネプ", "エムレ", "メリエム"], IRN: ["アリレザ", "ザフラ", "モハンマド", "ファテメ", "レザ", "マルヤム"],
  DEU: ["レオン", "ミア", "ヨナス", "エマ", "パウル", "レナ"], THA: ["ソムチャイ", "ニン", "アナン", "マリー", "ナット", "プローイ"],
  TZA: ["バラカ", "ネマ", "ジュマ", "アミナ", "ハミシ", "ザワディ"], KEN: ["キマニ", "ワンジル", "オティエノ", "アキニ", "ムワンギ", "ニャンブラ"],
  TGO: ["コフィ", "アマ", "クワメ", "アベナ", "ヨー", "アクア"], GBR: ["オリバー", "アメリア", "ジャック", "イズラ", "ハリー", "ソフィー"],
  FRA: ["ルイ", "ジャド", "ガブリエル", "ルイーズ", "ラファエル", "アンブル"], ZAF: ["シフォ", "タンディ", "ソロ", "レラト", "ブヘレ", "ノムサ"]
};
const FALLBACK = ["アリ", "ナディア", "サム", "レイラ", "ダニエル", "アナ"];
const namesFor = (c) => NAMES[c.iso] || FALLBACK;

// ---- people ---------------------------------------------------------------------------
function person(o) {
  return { tier: 3, debt: 0, savings: false, location: "home", job: "employee", married: true, kin: true, stress: 0, health: 1,
    alive: true, flags: {}, done: {}, ...o };
}

// ---- conditions -------------------------------------------------------------------------
function hasSystem(ctx) { return ctx.c.hdi > 0.7 || (ctx.c.hdi > 0.55 && ctx.actor.tier >= 4); }
function check(cond, ctx) {
  const a = ctx.actor, k = ctx.kid, p = ctx.parentOf;
  const has = (re) => re.test(cond);
  if (has(/貯金がある/) && has(/借金ができる/)) return a.savings || a.debt < 3;
  if (has(/貯金がある/)) return a.savings;
  if (has(/借金ができる/)) return a.debt < 3;
  if (has(/頼れる親族/)) return a.kin;
  if (has(/親族が近く/)) return a.kin && a.location === "home";
  if (has(/^配偶者がいる/)) return a.married;
  if (has(/未婚|独身に戻った/)) return !a.married;
  if (has(/離婚/)) return !!a.flags.divorced;
  if (has(/妊娠/)) return a.married && a.age < 42;
  if (has(/子どもが二人以上|上の子がいる/)) return (a.kids || 0) >= 2;
  let m = cond.match(/子どもが(\d+)〜(\d+)歳/);
  if (m) return k && k.alive && k.age >= +m[1] && k.age <= +m[2];
  m = cond.match(/子どもが(\d+)歳以上/);
  if (m) return k && k.alive && k.age >= +m[1];
  if (has(/子どもが大人/)) return k && k.alive && k.age >= 18;
  if (has(/子どもが学齢/)) return k && k.alive && k.age >= 6 && k.age <= 18;
  if (has(/子どもが生まれた/)) return k && k.age === 0;
  if (has(/子どもに障害か長い病気/)) return k && k.flags.disability;
  if (has(/子どもに子ども/)) return (a.kids || 0) > 0 && a.age >= 22;
  if (has(/子どもが結婚/)) return a.married;
  if (has(/子どもが働いている/)) return a.job !== "none";
  if (has(/子どもがいる/)) return !!k || (a.kids || 0) > 0;
  if (has(/制度がある|施設がある|医療が届く|窓口がある|相談先がある/)) return hasSystem(ctx);
  if (has(/お金がある|移住の手段/)) return a.tier >= 3 || a.savings;
  if (has(/勤め人/)) return a.job === "employee";
  if (has(/人を使う立場/)) return a.job === "employee" && a.tier >= 4;
  if (has(/農業/)) return a.job === "farm";
  if (has(/家業がある|店や田畑/)) return a.job === "farm" || a.job === "self";
  if (has(/土地を持っている/)) return a.job === "farm" || a.tier >= 4;
  if (has(/きょうだい/)) return (a.siblings || 0) > 0;
  if (has(/難民/)) return !!a.flags.refugee;
  if (has(/災害に遭った/)) return !!a.flags.disaster;
  if (has(/外国に住んでいる/)) return a.location === "abroad";
  if (has(/故郷を離れて|離れて暮らしている|遠くに住んでいる/)) return a.location !== "home";
  if (has(/地方に住んでいる/)) return a.location === "home";
  if (has(/自分の親|親が存命|親が年老いている|親に介護|親が危篤|親が亡くなった|親が重病|親が75歳/)) {
    if (!p) return false;
    if (has(/亡くなった/)) return !p.alive && p.diedAt != null && a.age - p.diedAtAgeOfChild <= 2;
    if (!p.alive) return false;
    if (has(/重病|危篤|介護/)) return p.deathAge - p.age <= 3;
    if (has(/75歳以上/)) return p.age >= 75;
    if (has(/施設/)) return !!p.flags.facility;
    if (has(/配偶者を亡くした/)) return !p.married;
    return true;
  }
  return true;
}

// ---- likelihood --------------------------------------------------------------------------
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function likelihood(ev, ctx) {
  const t = ev.likely, a = ctx.actor, c = ctx.c, hard = 0.4 + (1 - c.hdi) * 2.4;
  const stat = (v, ref) => (v == null ? hard : clamp(v / ref, 0.2, 4));
  let m = 1;
  // indicators we have: use them, and drop those keywords from the HDI fallback below
  let rest = t;
  const use = (re, f) => { if (re.test(rest)) { m *= f(); rest = rest.replace(re, ""); } };
  use(/失業率/, () => stat(c.unemployment, 6));
  use(/乳幼児死亡率/, () => stat(c.infantMortality, 25));
  use(/妊産婦死亡率|施設分娩/, () => stat(c.maternalMortality, 150));
  use(/インフレ/, () => stat(c.inflation, 6));
  use(/治安/, () => stat(c.homicide, 6));
  use(/児童労働/, () => (c.childLabor != null ? stat(c.childLabor, 10) : stat(100 - (c.secondaryEnrollment ?? 70), 30)));
  use(/紛争|戦闘|難民/, () => stat(c.refugeesOrigin != null ? (1000 * c.refugeesOrigin) / c.population : null, 2));
  use(/移住|出稼ぎ|移民/, () => clamp(1 + Math.max(0, -(1000 * (c.netMigration || 0)) / c.population) / 2 + (c.remittancesPctGdp || 0) / 5, 0.3, 4));
  use(/都市化/, () => clamp((100 - (c.urban ?? 50)) / 50, 0.2, 2));
  use(/農業で働く人/, () => clamp((c.agriculture ?? 30) / 30, 0.1, 3));
  if (/まれに/.test(t)) m *= 0.3;
  if (/毎年少しずつ/.test(t)) m *= 3;
  if (/所得の層が低い|所得の層が最も低い/.test(t)) m *= [0, 1.8, 1.4, 1, 0.7, 0.5][a.tier];
  if (/所得の層が中〜高|所得の層が中ほど|財産/.test(t)) m *= [0, 0.4, 0.7, 1, 1.3, 1.6][a.tier];
  if (/汚職|差別|飢饉|干ばつ|洪水|児童婚|不安定|権利が弱い|労働災害|食料不安|法の目|感染症|地震/.test(rest)) m *= hard;
  if (/普及|整った|整い方|制度/.test(rest)) m *= 0.4 + c.hdi;
  if (/高齢化|年を取るほど|平均寿命/.test(rest)) m *= a.age > 60 ? 2 : a.age > 45 ? 1.2 : 0.6;
  return m;
}

// ---- outcomes ------------------------------------------------------------------------------
const RULES = [
  [/所得がなくなる/, (s) => { s.actor.tier = 1; }, -1],
  [/所得が(下がる|戻らない)|所得は低いまま|職を失う|家計が苦しくなる|仕送りが止まる/, (s) => { s.actor.tier = Math.max(1, s.actor.tier - 1); }, -1],
  [/所得が(上がる|戻る)|仕送りが入る|家計が楽になる|まとまったお金が入る|高く売れる|立て直せる/, (s) => { s.actor.tier = Math.min(5, s.actor.tier + 1); }, 1],
  [/借金(が増える|が膨らむ|をする|が重くなる|ができる|をして)|代わりに払う|失敗すれば借金|返済が膨らむ/, (s) => { s.actor.debt = Math.min(3, s.actor.debt + 1); }, -1],
  [/借金が(返せる|減る|片づく)|借金は返し終え|返ってくる|払われる/, (s) => { s.actor.debt = Math.max(0, s.actor.debt - 1); }, 1],
  [/貯金ができる|手元に残るお金が増える/, (s) => { s.actor.savings = true; }, 1],
  [/貯金はなくなる|蓄えがなくなる|貯金を失|失う$|小さく失う/, (s) => { s.actor.savings = false; }, -1],
  [/単身|離れて暮らす|会うのは年に一度|会う頻度が下がる|月に一度/, (s) => { s.actor.apart = true; }, -1],
  [/けが|体を壊す|悪化する|病気になる|かかる|寿命が縮む|回復が遅れる|倒れる|転ぶ/, (s) => { s.actor.health = Math.max(0.2, s.actor.health - 0.15); }, -1],
  [/回復する|やめられる/, (s) => { s.actor.health = Math.min(1, s.actor.health + 0.1); }, 1],
  [/教育の段階が上がる|上の学校へ|子どもが伸びる/, (s) => { if (s.kid) s.kid.edu = Math.min(3, (s.kid.edu || 0) + 1); }, 1],
  [/学校をやめる|学校を休みがち|子どもの教育が遅れる|中退する|あきらめる$|子どもは地元で働く/, (s) => { if (s.kid) s.kid.schoolStopped = true; }, -1],
  [/縁が切れる|疎遠|仲がこじれる|距離が開く|心を閉ざす|心が離れていく|衝突|ぶつかる|反発|家を出る|家族が離れていく|関係が揺らぐ/, (s) => { s.bond -= 1; }, -1],
  [/深まる|距離が縮まる|関係が少し戻る|つながりが保たれる|懐く|過ごす時間が増える|話し始める|話してくれる/, (s) => { s.bond += 1; }, 1],
  [/離婚する/, (s) => { s.actor.married = false; s.actor.flags.divorced = true; }, -1],
  [/^結婚する|結婚する$/, (s) => { s.actor.married = true; }, 1],
  [/家族が一人増える|子どもを迎える|子どもが増える|子どもが生まれる/, (s) => { s.actor.kids = (s.actor.kids || 0) + 1; }, 1],
  [/逮捕|捕まる|罰を受ける|嫌がらせ|脅される|標的/, (s) => { s.actor.stress += 0.2; }, -1],
  [/難民キャンプ/, (s) => { s.actor.flags.refugee = true; s.actor.location = "abroad"; }, -1],
  [/住む場所が変わる|住まいを失う|郊外へ移る|新しい土地/, (s) => { s.actor.moved = true; }, -1]
];
function applyOutcome(text, s) {
  let sign = 0;
  for (const [re, fn, sg] of RULES) if (re.test(text)) { fn(s); sign += sg; }
  return sign;
}
function applyOption(opt, s) {
  // where the option itself moves the family
  if (/都市へ|都市に|町へ移/.test(opt.text)) s.actor.location = "city";
  if (/外国|国境を越え|国を出|呼び寄せ/.test(opt.text) && !/親族|呼び寄せる/.test(opt.text)) s.actor.location = "abroad";
  if (/一人で|単身|配偶者に行ってもらう|住み込み/.test(opt.text)) s.actor.apart = true;
  if (/帰る$|呼び戻す|故郷に帰る/.test(opt.text)) { s.actor.apart = false; }
}

// ---- deciding ---------------------------------------------------------------------------------
function decide(ev, ctx, r, key) {
  const a = ctx.actor;
  const adj = {};
  for (const k of VALUES) adj[k] = a.values[k] + a.stress * (PROTECT.has(k) ? 0.6 : GROWTH.has(k) ? -0.6 : 0);
  const opts = ev.options.map((o, i) => ({ o, i, ok: o.conds.every((c) => check(c, ctx)) })).filter((x) => x.ok);
  if (!opts.length) return null;
  for (const x of opts) {
    const ks = Object.keys(x.o.weights);
    x.score = ks.reduce((s, k) => s + x.o.weights[k] * adj[k], 0) / Math.sqrt(Math.max(1, ks.length));
    x.top = ks.filter((k) => x.o.weights[k] > 0).sort((p, q) => adj[q] - adj[p])[0] || null;
  }
  const tau = 0.25, mx = Math.max(...opts.map((x) => x.score));
  const ws = opts.map((x) => Math.exp((x.score - mx) / tau)), sum = ws.reduce((p, q) => p + q, 0);
  let u = r(key + "|choice") * sum;
  for (let j = 0; j < opts.length; j++) { u -= ws[j]; if (u <= 0) return opts[j]; }
  return opts[opts.length - 1];
}

// ---- one year for one actor ------------------------------------------------------------------
const PARENT_DOMAINS = new Set(["work", "money", "home", "health", "family", "children", "elders", "community", "society"]);
const CHILD_DOMAINS = new Set(["work", "money", "home", "health", "family", "elders", "community", "society", "adult-child"]);

function yearFor(role, ctx, r, life) {
  const a = ctx.actor;
  const domains = role === "parent" ? PARENT_DOMAINS : CHILD_DOMAINS;
  const happened = [];
  const order = EVENTS.filter((e) => domains.has(e.domain));
  for (const ev of order) {
    if (happened.length >= 2) break;
    const t = ev.timing;
    const age = t.who === "child" ? (ctx.kid ? ctx.kid.age : -1) : a.age;
    if (age < t.min || age > t.max) continue;
    if (t.who === "child" && (!ctx.kid || !ctx.kid.alive)) continue;
    const repeat = /毎年少しずつ/.test(ev.likely);
    if (a.done[ev.id] != null && (!repeat || a.age - a.done[ev.id] < 6)) continue;
    if (!t.conds.every((c) => check(c, ctx))) continue;
    // events about one's own parent need that parent alive, unless they are about the death itself
    const aboutParent = ev.domain === "elders" || (ev.domain === "adult-child" && /親/.test(ev.title + ev.situation));
    if (aboutParent && !(ctx.parentOf && ctx.parentOf.alive) && !/亡くなった|亡くなったあと|財産|手紙/.test(ev.likely + ev.situation + t.conds.join())) continue;
    const key = `${role}|${a.age}|${ev.id}`;
    const p = 0.008 * likelihood(ev, ctx) * (ev.domain === "children" ? 2.5 : 1);
    if (r(key + "|occ") > p) continue;
    const pick = decide(ev, ctx, r, key);
    if (!pick) continue;
    a.done[ev.id] = a.age;
    const s = { actor: a, kid: role === "parent" ? ctx.kid : null, bond: 0 };
    applyOption(pick.o, s);
    const realized = [];
    let sign = 0;
    pick.o.outcomes.forEach((oc, j) => {
      const prob = oc.prob == null ? (1 - ctx.c.hdi) * 0.5 : oc.prob;
      if (r(`${key}|out${pick.i}|${j}`) < prob) { realized.push(oc.text); sign += applyOutcome(oc.text, s); }
    });
    if (s.kid || role === "child") life.bond += s.bond;
    if (sign < 0) a.stress += 0.15;
    happened.push({ id: ev.id, title: ev.title, situation: ev.situation, choice: pick.o.text, choiceIndex: pick.i, top: pick.top, realized });
  }
  return happened;
}

// ---- dying ---------------------------------------------------------------------------------------
function hazard(age, le, tier, c) {
  const B = 0.085, A = B * Math.exp(-B * (le + 0.577 / B));
  let h = A * Math.exp(B * age);
  // infant and child mortality from the country's own figures
  if (age === 0) h += (c.infantMortality ?? Math.max(2, (85 - le) * 2.5)) / 1000;
  else if (age <= 4 && c.under5Mortality != null && c.infantMortality != null) h += Math.max(0, c.under5Mortality - c.infantMortality) / 1000 / 4;
  return Math.min(1, h * [1, 1.4, 1.15, 1, 0.9, 0.75][tier]);
}

// ---- one life -------------------------------------------------------------------------------------
export function live({ seed, country, parentValues, label }) {
  const r = mkRand(seed);
  const c = country;
  const names = namesFor(c);
  const tier = pickTier(r, c);
  const parentAge = 20 + Math.floor(r("pAge") * 15);
  const job = r("job") < (c.agriculture ?? 30) / 100 ? "farm" : r("job2") < 0.25 ? "self" : "employee";
  const parent = person({ role: "parent", name: names[0], age: parentAge, tier, job, values: parentValues, siblings: Math.floor(r("sib") * 4),
    kin: r("kin") < 0.8, married: r("mar") < 0.85, kids: 1 });
  const grand = person({ role: "grand", age: parentAge + 22 + Math.floor(r("gAge") * 12), alive: true, flags: {} });
  grand.deathAge = Math.round(c.lifeExpectancy + 6 * gaussFrom(r, "gDeath"));
  if (grand.deathAge <= grand.age) grand.deathAge = grand.age + 1 + Math.floor(r("gD2") * 6);
  const kid = person({ role: "kid", name: names[1], age: 0, edu: 0, tier, job: "none", married: false, kids: 0, kin: true, values: null,
    flags: { disability: r("dis") < 0.05 } });
  const life = { label, c, tier, parent, kid, grand, rows: [], bond: 0, lastTogether: null, parentDiedChildAge: null, leaveAt: 18 + Math.floor(r("leave") * 6), stressSum: 0 };

  for (let year = 0; year <= 70; year++) {
    const row = { year: c ? year : year, kidAge: kid.age, parentAge: parent.age, parent: [], kid: [], notes: [] };
    // deaths first, with the same luck in both lives; poorer tiers face higher hazard
    if (parent.alive && r(`death|parent|${parent.age}`) < hazard(parent.age, c.lifeExpectancy, parent.tier, c) * (1.6 - parent.health * 0.6)) {
      parent.alive = false;
      life.parentDiedChildAge = kid.age;
      const last = life.lastTogether;
      row.notes.push(`${parent.name}が${parent.age}歳で亡くなる。` + (kid.alive && last != null && last < kid.age ? `${kid.name}と最後に会ったのは、${kid.name}が${last}歳のときだった。` : ""));
    }
    if (kid.alive && r(`death|kid|${kid.age}`) < hazard(kid.age, c.lifeExpectancy, kid.tier, c) * (1.6 - kid.health * 0.6)) {
      kid.alive = false;
      row.notes.push(`${kid.name}が${kid.age}歳で亡くなる。`);
    }
    if (grand.alive && grand.age >= grand.deathAge) { grand.alive = false; grand.diedAtAgeOfChild = parent.age; }
    if (!parent.alive && !kid.alive) { life.rows.push(row); break; }

    if (parent.alive) {
      const ctx = { actor: parent, kid: kid.alive ? kid : null, parentOf: grand, c };
      row.parent = yearFor("parent", ctx, r, life);
      parent.stress = Math.max(0, parent.stress * 0.75 + (parent.debt * 0.05) + (parent.tier === 1 ? 0.05 : 0));
      if (kid.age < 18) life.stressSum += parent.stress;
    }
    // the child grows up
    if (kid.alive && kid.age < 18) {
      if (kid.age >= 6 && !kid.schoolStopped && kid.edu < 1) kid.edu = 1;
      // secondary school: the country's enrollment, shifted by the family's tier
      const enrol = Math.min(1, (c.secondaryEnrollment ?? 70) / 100) * [0, 0.55, 0.8, 1, 1.1, 1.2][parent.tier];
      if (kid.age === 12 && !kid.schoolStopped && kid.edu < 2 && r(`edu2|${kid.age}`) < enrol) kid.edu = 2;
    }
    if (kid.alive && kid.age === 18) {
      formChildValues(life, r);
      kid.tier = Math.max(1, Math.min(5, parent.tier + (kid.edu >= 2 ? 1 : 0) - (kid.schoolStopped ? 1 : 0)));
      kid.job = kid.edu >= 2 ? "employee" : parent.job === "farm" ? "farm" : "employee";
      row.notes.push(`${kid.name}は「${TYPE_NAMES[topValue(kid.values)]}」に育った。`);
    }
    if (kid.alive && kid.age === life.leaveAt && kid.location === "home") {
      const out = kid.edu >= 2 && !kid.schoolStopped ? (kid.values && kid.values.自律 > 0.3 && kid.tier >= 3 ? "abroad" : "city") : r(`stay|${kid.age}`) < 0.5 ? "home" : "city";
      kid.location = out;
      if (out !== "home") row.notes.push(`${kid.name}が家を出る（${out === "abroad" ? "外国へ" : "都市へ"}）。`);
    }
    if (kid.alive && kid.age >= 18) {
      const parentDeath = parent.alive ? parent.age + Math.max(1, Math.round(c.lifeExpectancy - parent.age)) : null;
      const ctx = { actor: kid, kid: null, parentOf: parent.alive ? { ...parent, deathAge: parentDeath } : { alive: false, flags: {}, diedAtAgeOfChild: life.parentDiedChildAge }, c };
      row.kid = yearFor("child", ctx, r, life);
      kid.stress = Math.max(0, kid.stress * 0.75 + kid.debt * 0.05);
    }
    // seeing each other: living together, or visits that depend on distance and bond
    if (parent.alive && kid.alive) {
      const together = kid.location === "home" && !parent.apart && kid.age < life.leaveAt;
      const dist = kid.location === "abroad" || parent.location === "abroad" ? 0.6 : kid.location === "city" || parent.apart ? 4 : 30;
      const visits = together ? 300 : Math.max(0, dist * (1 + life.bond * 0.25));
      if (together || r(`visit|${kid.age}`) < Math.min(1, visits)) life.lastTogether = kid.age;
    }
    life.rows.push(row);
    if (parent.alive) parent.age++;
    if (kid.alive) kid.age++;
    grand.age++;
    if (!kid.alive && !parent.alive) break;
    if (kid.age > 60) break;
  }
  return life;
}

function formChildValues(life, r) {
  const { parent, kid, c } = life;
  const native = nativeValues(r, c, "kidnative");
  const control = (parent.values.権力 + parent.values.同調 + parent.values.伝統) / 3;
  const rebel = r("rebel") < 0.12 + 0.4 * Math.max(0, control);
  const stress = life.stressSum / 18;
  const v = {};
  for (const k of VALUES) {
    let x = 0.5 * native[k] + 0.45 * parent.values[k];
    if (rebel && ["自律", "伝統", "同調", "権力"].includes(k)) x -= 0.7 * parent.values[k];
    v[k] = x;
  }
  v.安全 += 0.5 * stress; v.伝統 += 0.2 * stress;
  if (kid.location !== "home") { v.自律 += 0.2; v.刺激 += 0.15; }
  if (kid.edu >= 2 && !kid.schoolStopped) { v.普遍 += 0.15; v.自律 += 0.1; }
  if (life.bond < -1) v.慈善 -= 0.15;
  kid.values = center(v);
  life.rebel = rebel;
}

export function describeEnd(life) {
  const { parent, kid } = life;
  const tierName = ["", "最も貧しい層", "貧しい層", "真ん中の層", "やや豊かな層", "豊かな層"];
  const edu = kid.schoolStopped ? "学校を途中でやめた" : ["学校に通えなかった", "初等教育まで", "中等教育まで", "高等教育まで"][kid.edu || 0];
  const loc = { home: "生まれた土地", city: "都市", abroad: "外国" };
  return [
    parent.alive ? `${parent.name}は${parent.age}歳で存命` : `${parent.name}は${parent.age}歳で亡くなった`,
    `${parent.name}の暮らしの最後：${tierName[parent.tier]}${parent.debt ? `、借金あり` : ""}`,
    `${kid.name}：${edu}。${loc[kid.location]}で暮らす。${kid.values ? `「${TYPE_NAMES[topValue(kid.values)]}」に育った` : ""}${life.rebel ? "（親に反発した）" : ""}`,
    kid.alive ? `${kid.name}は${kid.age}歳` : `${kid.name}は${kid.age}歳で亡くなった`
  ];
}
