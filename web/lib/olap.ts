/**
 * OLAP Cube Explorer — ชุดข้อมูลและตรรกะการรวมยอดหลายมิติ
 * ข้อมูลถูกสร้างแบบกำหนดเมล็ด (deterministic) ผลลัพธ์จึงเหมือนกันทุกเครื่อง
 */
import { mulberry32 } from "./cockpit";

export const MONTHS = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];

const PRODUCTS = [
  { cat: "เครื่องดื่ม", brand: "ดอยคำ", price: 35, vol: 1.0 },
  { cat: "เครื่องดื่ม", brand: "ชาไทยหอม", price: 28, vol: 1.25 },
  { cat: "ของใช้ในบ้าน", brand: "คลีนพลัส", price: 95, vol: 0.55 },
  { cat: "ของใช้ในบ้าน", brand: "โฮมแคร์", price: 120, vol: 0.42 },
  { cat: "เครื่องใช้ไฟฟ้า", brand: "อีเล็คโทร", price: 2450, vol: 0.06 },
  { cat: "เครื่องใช้ไฟฟ้า", brand: "พาวเวอร์ซัน", price: 3890, vol: 0.03 },
];

const GEO = [
  { region: "ภาคกลาง", prov: "กรุงเทพฯ", w: 1.55 },
  { region: "ภาคกลาง", prov: "นนทบุรี", w: 0.85 },
  { region: "ภาคอีสาน", prov: "ขอนแก่น", w: 0.95 },
  { region: "ภาคอีสาน", prov: "กาฬสินธุ์", w: 0.62 },
  { region: "ภาคเหนือ", prov: "เชียงใหม่", w: 0.9 },
  { region: "ภาคเหนือ", prov: "ลำปาง", w: 0.5 },
  { region: "ภาคใต้", prov: "ภูเก็ต", w: 0.8 },
  { region: "ภาคใต้", prov: "สงขลา", w: 0.7 },
];

export type Fact = {
  year: number;
  month: number;
  quarter: number;
  cat: string;
  brand: string;
  region: string;
  prov: string;
  units: number;
  sales: number;
};

/** ข้อเท็จจริง 1,152 แถว — ฝังความผิดปกติไว้ 1 จุดโดยเจตนา (ภาคอีสาน Q3/2025) */
export const FACTS: Fact[] = (() => {
  const rng = mulberry32(70425);
  const rows: Fact[] = [];
  for (const year of [2024, 2025]) {
    for (let m = 0; m < 12; m++) {
      for (const p of PRODUCTS) {
        for (const g of GEO) {
          const season = 1 + 0.22 * Math.sin(((m - 2) / 12) * 2 * Math.PI);
          const trend = year === 2025 ? 1.11 : 1.0;
          const noise = 0.88 + 0.24 * rng();
          const anomaly =
            year === 2025 && g.region === "ภาคอีสาน" && m >= 6 && m <= 8 ? 0.58 : 1.0;
          const units = Math.round(2600 * p.vol * g.w * season * trend * noise * anomaly);
          rows.push({
            year,
            month: m,
            quarter: Math.floor(m / 3) + 1,
            cat: p.cat,
            brand: p.brand,
            region: g.region,
            prov: g.prov,
            units,
            sales: units * p.price,
          });
        }
      }
    }
  }
  return rows;
})();

export type DimKey = "time" | "product" | "geo";
export type Level = { key: string; label: string; col: string; get: (f: Fact) => string };

export const DIMS: Record<DimKey, { label: string; levels: Level[] }> = {
  time: {
    label: "มิติเวลา",
    levels: [
      { key: "year", label: "ปี", col: "d.year", get: (f) => String(f.year) },
      { key: "quarter", label: "ไตรมาส", col: "d.year, d.quarter", get: (f) => `${f.year}-Q${f.quarter}` },
      { key: "month", label: "เดือน", col: "d.year, d.month", get: (f) => `${f.year}-${MONTHS[f.month]}` },
    ],
  },
  product: {
    label: "มิติสินค้า",
    levels: [
      { key: "cat", label: "หมวดสินค้า", col: "p.category", get: (f) => f.cat },
      { key: "brand", label: "แบรนด์", col: "p.brand", get: (f) => f.brand },
    ],
  },
  geo: {
    label: "มิติภูมิศาสตร์",
    levels: [
      { key: "region", label: "ภูมิภาค", col: "s.region", get: (f) => f.region },
      { key: "prov", label: "จังหวัด", col: "s.province", get: (f) => f.prov },
    ],
  },
};

export const DIMKEYS: DimKey[] = ["time", "product", "geo"];
export type Measure = "sales" | "units" | "asp";

export const MEASURE_NAME: Record<Measure, string> = {
  sales: "ยอดขาย (พันบาท)",
  units: "จำนวนชิ้น",
  asp: "ราคาเฉลี่ยต่อชิ้น (บาท)",
};

export type Cube = {
  rows: DimKey;
  cols: DimKey;
  layer: DimKey;
  level: Record<DimKey, number>;
  dice: Record<DimKey, string[] | null>;
  slice: string;
  measure: Measure;
};

export const initialCube = (): Cube => ({
  rows: "time",
  cols: "product",
  layer: "geo",
  level: { time: 0, product: 0, geo: 0 },
  dice: { time: null, product: null, geo: null },
  slice: "ALL",
  measure: "sales",
});

export const lv = (c: Cube, d: DimKey) => DIMS[d].levels[c.level[d]];

export function membersOf(d: DimKey, levelIdx: number): string[] {
  const get = DIMS[d].levels[levelIdx].get;
  const out: string[] = [];
  for (const f of FACTS) {
    const v = get(f);
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

export const passDice = (c: Cube, f: Fact) =>
  DIMKEYS.every((d) => {
    const sel = c.dice[d];
    return !sel || sel.length === 0 || sel.includes(lv(c, d).get(f));
  });

export type Cell = { sales: number; units: number };
export const combine = (a: Cell | undefined, b: Cell | undefined): Cell => ({
  sales: (a?.sales ?? 0) + (b?.sales ?? 0),
  units: (a?.units ?? 0) + (b?.units ?? 0),
});

export function val(c: Cube, cell: Cell | undefined): number {
  if (!cell) return 0;
  if (c.measure === "sales") return cell.sales;
  if (c.measure === "units") return cell.units;
  return cell.units ? cell.sales / cell.units : 0; // non-additive
}

/** รวมยอดตามมิติที่กำหนด → Map<row, Map<col, Cell>> */
export function aggregate(c: Cube): Map<string, Map<string, Cell>> {
  const m = new Map<string, Map<string, Cell>>();
  for (const f of FACTS) {
    if (!passDice(c, f)) continue;
    if (c.slice !== "ALL" && lv(c, c.layer).get(f) !== c.slice) continue;
    const r = lv(c, c.rows).get(f);
    const col = lv(c, c.cols).get(f);
    if (!m.has(r)) m.set(r, new Map());
    const rm = m.get(r)!;
    rm.set(col, combine(rm.get(col), { sales: f.sales, units: f.units }));
  }
  return m;
}

export function buildSQL(c: Cube): string {
  const where: string[] = [];
  if (c.slice !== "ALL")
    where.push(`${lv(c, c.layer).col.split(",")[0].trim()} = '${c.slice}'`);
  for (const d of DIMKEYS) {
    const sel = c.dice[d];
    if (sel)
      where.push(
        `${lv(c, d).col.split(",")[0].trim()} IN (${sel.map((v) => `'${v}'`).join(", ")})`
      );
  }
  const groupCols = [lv(c, c.rows).col, lv(c, c.cols).col].join(", ");
  const meas =
    c.measure === "sales"
      ? "SUM(f.net_amount)"
      : c.measure === "units"
      ? "SUM(f.quantity)"
      : "SUM(f.net_amount) / NULLIF(SUM(f.quantity), 0)";
  return (
    `SELECT ${groupCols},\n       ${meas} AS measure\n` +
    `FROM   fact_sales f\n` +
    `JOIN   dim_date    d ON d.date_key    = f.date_key\n` +
    `JOIN   dim_product p ON p.product_key = f.product_key\n` +
    `JOIN   dim_store   s ON s.store_key   = f.store_key\n` +
    (where.length ? `WHERE  ${where.join("\n   AND  ")}\n` : "") +
    `GROUP BY ROLLUP(${groupCols})\n` +
    `ORDER BY ${groupCols};`
  );
}

/* ---------- โหมดท้าทาย ---------- */
export type Challenge = { q: string; hint: string; opts: string[]; par: number; ans: string };

const sumBy = (fn: (f: Fact) => boolean, measure: Measure = "sales") => {
  let s = 0,
    u = 0;
  for (const f of FACTS) {
    if (!fn(f)) continue;
    s += f.sales;
    u += f.units;
  }
  return measure === "units" ? u : measure === "asp" ? (u ? s / u : 0) : s;
};

const argExtreme = <T,>(list: T[], fn: (x: T) => number, dir: 1 | -1): T => {
  let best = list[0];
  let bv = dir > 0 ? -Infinity : Infinity;
  for (const x of list) {
    const v = fn(x);
    if (dir > 0 ? v > bv : v < bv) {
      bv = v;
      best = x;
    }
  }
  return best;
};

export function buildChallenges(): Challenge[] {
  const regions = [...new Set(GEO.map((g) => g.region))];
  const provs = GEO.map((g) => g.prov);
  const cats = [...new Set(PRODUCTS.map((p) => p.cat))];
  const brands = PRODUCTS.map((p) => p.brand);
  const q2025 = [1, 2, 3, 4].map((q) => `2025-Q${q}`);
  const growth = (c: string) => {
    const a = sumBy((f) => f.cat === c && f.year === 2024);
    const b = sumBy((f) => f.cat === c && f.year === 2025);
    return (b - a) / a;
  };

  return [
    {
      q: "ไตรมาสใดของปี 2025 ที่มียอดขายรวมทั้งบริษัทสูงที่สุด?",
      hint: "Roll-up มิติสินค้าและภูมิศาสตร์ แล้ว Drill-down มิติเวลาไปที่ระดับไตรมาส + Dice เฉพาะปี 2025",
      opts: q2025,
      par: 3,
      ans: argExtreme(q2025, (k) => sumBy((f) => `${f.year}-Q${f.quarter}` === k), 1),
    },
    {
      q: "ในปี 2025 ภูมิภาคใดที่ยอดขาย “ตกลง” เมื่อเทียบกับปี 2024?",
      hint: "ให้มิติเวลาอยู่ที่ระดับปี และมิติภูมิศาสตร์อยู่ที่ระดับภูมิภาค แล้วเทียบสองคอลัมน์",
      opts: regions,
      par: 3,
      ans: argExtreme(
        regions,
        (r) => {
          const a = sumBy((f) => f.region === r && f.year === 2024);
          const b = sumBy((f) => f.region === r && f.year === 2025);
          return (b - a) / a;
        },
        -1
      ),
    },
    {
      q: "ความผิดปกติของภูมิภาคในข้อก่อนหน้า กระจุกตัวอยู่ที่ไตรมาสใด?",
      hint: "Slice เฉพาะภูมิภาคนั้น แล้ว Drill-down มิติเวลาไปที่ระดับไตรมาส",
      opts: q2025,
      par: 3,
      ans: argExtreme(
        q2025,
        (k) => {
          const [y, q] = k.split("-Q");
          const cur = sumBy((f) => f.region === "ภาคอีสาน" && f.year === +y && f.quarter === +q);
          const prev = sumBy(
            (f) => f.region === "ภาคอีสาน" && f.year === +y - 1 && f.quarter === +q
          );
          return (cur - prev) / prev;
        },
        -1
      ),
    },
    {
      q: "แบรนด์ใดมียอดขายรวมสูงที่สุดตลอดสองปี?",
      hint: "Drill-down มิติสินค้าไปที่ระดับแบรนด์ แล้วดูแถว/คอลัมน์รวม",
      opts: brands,
      par: 2,
      ans: argExtreme(brands, (b) => sumBy((f) => f.brand === b), 1),
    },
    {
      q: "จังหวัดใดมี “ราคาเฉลี่ยต่อชิ้น” สูงที่สุด?",
      hint: "เปลี่ยนตัววัดเป็นราคาเฉลี่ยต่อชิ้น แล้ว Drill-down มิติภูมิศาสตร์ไปที่ระดับจังหวัด",
      opts: provs,
      par: 3,
      ans: argExtreme(provs, (p) => sumBy((f) => f.prov === p, "asp"), 1),
    },
    {
      q: "หมวดสินค้าใดเติบโตจากปี 2024 ไปปี 2025 เป็นเปอร์เซ็นต์สูงที่สุด?",
      hint: "มิติเวลาที่ระดับปี × มิติสินค้าที่ระดับหมวด แล้วคำนวณอัตราเติบโตเอง",
      opts: cats,
      par: 2,
      ans: argExtreme(cats, growth, 1),
    },
  ];
}

export const baht = (n: number) =>
  n.toLocaleString("th-TH", { maximumFractionDigits: 0 });

export const fmtMeasure = (c: Cube, v: number) =>
  c.measure === "sales" ? baht(Math.round(v / 1000)) + "k" : baht(Math.round(v));
