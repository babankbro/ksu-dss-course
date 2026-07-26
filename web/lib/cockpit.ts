/**
 * Decision Cockpit — ตัวแบบตลาดและเหตุการณ์
 * แยกตรรกะทั้งหมดออกจาก UI เพื่อให้ทดสอบและอธิบายในชั้นเรียนได้
 */

export type Mode = "gut" | "bi" | "dss";

export const MODE_NAME: Record<Mode, string> = {
  gut: "🧠 สัญชาตญาณล้วน",
  bi: "📊 มี BI ช่วย",
  dss: "🎯 มี DSS เต็มรูปแบบ",
};

/** ตัวสุ่มแบบกำหนดเมล็ด — ทำให้ทุกโหมดเจอเหตุการณ์ชุดเดียวกันเป๊ะ */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED = 20260726;
export const NQ = 4;
export const MARKET_TOTAL = 420; // ขนาดตลาดรวม (พันราย)
export const COST_PER_SUB = 118; // ต้นทุนต่อรายต่อเดือน (บาท)

export type Truth = {
  compPrice: number;
  churnShock: number;
  costShock: number;
  priceCap?: number;
};

export type GameEvent = {
  key: string;
  label: string;
  truth: Truth;
  signals: Record<Mode, string[]>;
};

export const EVENTS: GameEvent[] = [
  {
    key: "calm",
    label: "ตลาดปกติ",
    truth: { compPrice: 499, churnShock: 0, costShock: 0 },
    signals: {
      gut: ["ทีมขายบ่นว่า “ลูกค้าถามหาโปรถูกลง” แต่ไม่มีตัวเลขยืนยัน"],
      bi: ["รายงานไตรมาสก่อน: ลูกค้า 100,000 ราย · churn 4.2% · ราคาเฉลี่ยคู่แข่ง 499 บาท"],
      dss: ["ตัวแบบไม่พบสัญญาณผิดปกติ — ความน่าจะเป็นที่คู่แข่งจะปรับราคาในไตรมาสนี้ ≈ 15%"],
    },
  },
  {
    key: "pricewar",
    label: "คู่แข่งเปิดสงครามราคา",
    truth: { compPrice: 399, churnShock: 0.03, costShock: 0 },
    signals: {
      gut: ["มีข่าวลือในวงการว่าคู่แข่งเตรียม “ทำอะไรสักอย่าง” ต้นไตรมาสนี้"],
      bi: ["รายงานล่าสุด: ยอดสมัครใหม่ลดลง 8% เทียบไตรมาสก่อน (ข้อมูลถึงสิ้นไตรมาสที่แล้วเท่านั้น)"],
      dss: [
        "🚨 Text Analytics จับข่าวจากสื่อ 42 ชิ้น: คู่แข่งประกาศแพ็กเกจ 399 บาท — ความเชื่อมั่น 88%",
        "ตัวแบบพยากรณ์: หากคงราคาเดิม อัตรา churn จะเพิ่มขึ้นประมาณ +3 จุดเปอร์เซ็นต์",
      ],
    },
  },
  {
    key: "regulator",
    label: "ข้อบังคับใหม่จากหน่วยงานกำกับ",
    truth: { compPrice: 429, churnShock: 0.01, costShock: 18, priceCap: 599 },
    signals: {
      gut: ["ได้ยินว่าหน่วยงานกำกับกำลังพิจารณาอะไรบางอย่างเรื่องค่าบริการ"],
      bi: ["รายงาน: ต้นทุนโครงข่ายต่อรายเพิ่มขึ้น 6% · ฐานลูกค้าเริ่มทรงตัว"],
      dss: [
        "⚖️ กฎใหม่มีผลไตรมาสนี้: เพดานราคา 599 บาท และค่าธรรมเนียมกำกับดูแลเพิ่ม 18 ล้านบาท/ไตรมาส",
        "ตัวแบบเตือน: ข้อจำกัดนี้ตัดทางเลือกราคาสูงออกทั้งหมด → ต้องแข่งด้วยแบรนด์แทน",
      ],
    },
  },
  {
    key: "outage",
    label: "เหตุขัดข้องของโครงข่าย",
    truth: { compPrice: 429, churnShock: 0.07, costShock: 25, priceCap: 599 },
    signals: {
      gut: ["ลูกค้าบางส่วนโพสต์บ่นเรื่องสัญญาณในโซเชียล"],
      bi: ["รายงาน: จำนวนสายร้องเรียนเพิ่มขึ้น 210% ในสัปดาห์ที่ผ่านมา"],
      dss: [
        "🔧 ระบบตรวจพบเหตุขัดข้องระดับภูมิภาค — ตัวแบบประเมิน churn ส่วนเพิ่ม +7 จุดเปอร์เซ็นต์",
        "ข้อเสนอจากตัวแบบ: ลดราคาชั่วคราวหรือเพิ่มงบชดเชยลูกค้า เพื่อหยุดการไหลออก",
      ],
    },
  },
];

export const DIAGNOSES = [
  { k: "pricewar", t: "คู่แข่งกำลังตัดราคา — ความได้เปรียบด้านราคาของเราหายไป" },
  { k: "regulator", t: "มีข้อจำกัดจากภายนอกที่ทำให้ตั้งราคาสูงไม่ได้ และต้นทุนเพิ่ม" },
  { k: "outage", t: "คุณภาพบริการมีปัญหา ทำให้ลูกค้าไหลออกผิดปกติ" },
  { k: "calm", t: "ยังไม่มีภัยคุกคามชัดเจน — เน้นเติบโตตามปกติ" },
];

export type MarketState = { subs: number; brand: number };
export type Decision = { name: string; price: number; marketing: number };
export type Outcome = {
  subs: number;
  brand: number;
  churn: number;
  revenue: number;
  cost: number;
  profit: number;
  fine: number;
  effPrice: number;
  band?: number;
};

/** ตัวแบบ "ความจริง" ที่ผู้เล่นมองไม่เห็น */
export function simulate(
  state: MarketState,
  d: Decision,
  truth: Truth,
  rng: () => number
): Outcome {
  const mkt = d.marketing;
  // เพดานราคาตามกฎหมาย: ตั้งเกิน → ถูกบังคับลดลงมาที่เพดานและถูกปรับ
  let price = d.price;
  let fine = 0;
  if (truth.priceCap && price > truth.priceCap) {
    price = truth.priceCap;
    fine = 40;
  }
  const ratio = price / truth.compPrice;
  const brand = Math.min(1, state.brand * 0.62 + mkt / 260);

  let attract = 1.55 - 1.05 * ratio + 0.55 * brand;
  attract = Math.max(0.05, Math.min(2.0, attract));

  const pool = Math.max(0, MARKET_TOTAL - state.subs);
  const adds = pool * 0.085 * attract * (0.94 + 0.12 * rng());

  let churn = 0.04 + 0.115 * (ratio - 1) + truth.churnShock - 0.035 * brand;
  churn = Math.max(0.008, Math.min(0.42, churn * (0.95 + 0.1 * rng())));

  const subs = Math.max(5, state.subs - state.subs * churn + adds);
  const revenue = (subs * price * 3) / 1000; // ล้านบาท/ไตรมาส
  const cost = (subs * COST_PER_SUB * 3) / 1000;
  const profit = revenue - cost - mkt - truth.costShock - fine;

  return { subs, brand, churn, revenue, cost, profit, fine, effPrice: price };
}

/**
 * ตัวแบบ "ที่ DSS ใช้พยากรณ์" — จงใจให้คลาดจากความจริงเล็กน้อย
 * และไม่รู้ shock ที่ระบบยังตรวจจับไม่ได้ เพื่อสอนว่าตัวแบบไม่ใช่ความจริง
 */
export function predict(
  state: MarketState,
  d: Decision,
  truth: Truth,
  mode: Mode
): Outcome {
  const known: Truth = {
    compPrice: truth.compPrice,
    churnShock: mode === "dss" ? truth.churnShock * 0.8 : 0,
    costShock: mode === "dss" ? truth.costShock : 0,
    priceCap: mode === "dss" ? truth.priceCap : undefined,
  };
  const est = simulate(state, d, known, () => 0.5);
  est.profit *= 0.97; // อคติของตัวแบบ
  est.band = Math.abs(est.profit) * 0.13 + 6; // ช่วงความไม่แน่นอน ±
  return est;
}

export function defaultAlts(q: number, mode: Mode): Decision[] {
  // ค่าเริ่มต้นถูกจำกัดตามเพดานเฉพาะโหมด DSS เท่านั้น
  // โหมดอื่นไม่รู้ว่ามีเพดาน จึงต้องไม่ถูกจำกัดโดยปริยาย (มิฉะนั้นจะเป็นการใบ้)
  const cap =
    mode === "dss" && EVENTS[q].truth.priceCap ? EVENTS[q].truth.priceCap! : 999;
  const c = (p: number) => Math.min(p, cap);
  return [
    { name: "ก. รักษาส่วนต่างกำไร", price: c(549), marketing: 20 },
    { name: "ข. สู้ด้วยราคา", price: c(429), marketing: 30 },
    { name: "ค. ลงทุนสร้างแบรนด์", price: c(499), marketing: 70 },
  ];
}

export const PHASES = [
  { n: "1. Intelligence", d: "ค้นหาและรับรู้ปัญหา" },
  { n: "2. Design", d: "สร้างทางเลือก" },
  { n: "3. Choice", d: "เลือกทางเลือก" },
  { n: "4. Implementation", d: "นำไปปฏิบัติและเรียนรู้" },
];

export const fmt = (n: number, d = 1) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = (n: number) => (n >= 0 ? "" : "−") + fmt(Math.abs(n), 1);
