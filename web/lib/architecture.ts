/**
 * เครื่องยนต์จำลองสถาปัตยกรรม DSS — ใช้ร่วมกันระหว่าง
 *   • Architecture Sandbox (ผู้เรียนประกอบสถาปัตยกรรมเอง)
 *   • Chaos Lab (สถาปัตยกรรมคงที่ แต่ผู้เรียนทำให้ส่วนต่างๆ ล้ม)
 *
 * โดเมน: ระบบอนุมัติสินเชื่อรายย่อย 4 ไตรมาส ไตรมาสละ 200 คำขอ
 * ทุกอย่างเป็นฟังก์ชันบริสุทธิ์และใช้ตัวสุ่มแบบกำหนดเมล็ด ผลจึงทำซ้ำได้เสมอ
 */
import { mulberry32 } from "./cockpit";

export const SEED_ARCH = 20260214;
export const CASES_PER_Q = 200;
export const QUARTERS = 4;

/**
 * 200 เคสที่จำลองต่อไตรมาสเป็น "ตัวอย่าง" ของพอร์ตจริง 3,000 คำขอ/ไตรมาส
 * ผลทางธุรกิจจึงถูกคูณกลับด้วยตัวคูณนี้ ส่วนต้นทุนระบบเป็นค่าคงที่รายเดือนไม่ต้องคูณ
 * (ถ้าไม่ทำเช่นนี้ ต้นทุนระบบระดับองค์กรจะท่วมรายได้จากเคสตัวอย่างเสมอ
 *  และผู้เรียนจะหาสถาปัตยกรรมที่ทำกำไรไม่ได้เลยไม่ว่าจะออกแบบดีแค่ไหน)
 */
export const PORTFOLIO_SCALE = 15;

/* ============================================================
   1. องค์ประกอบสถาปัตยกรรมที่เลือกได้
   ============================================================ */

export type SlotKey =
  | "data"
  | "quality"
  | "model"
  | "knowledge"
  | "ui"
  | "human"
  | "feedback"
  | "audit";

export type SlotOption = {
  label: string;
  desc: string;
  cost: number; // ต้นทุนต่อเดือน (พันบาท)
  latency: number; // ชั่วโมงที่เพิ่มให้เส้นทางการตัดสินใจ
};

export type Slot = {
  key: SlotKey;
  subsystem: string;
  label: string;
  icon: string;
  question: string; // คำถามเชิงสัญญา (contract) ที่ส่วนนี้ต้องตอบ
  options: SlotOption[];
};

export const SLOTS: Slot[] = [
  {
    key: "data",
    subsystem: "Data Management",
    label: "แหล่งข้อมูลและความสดของข้อมูล",
    icon: "🗄️",
    question: "ข้อมูลที่ใช้ตัดสินใจสดแค่ไหน และมาจากที่ใดบ้าง?",
    options: [
      { label: "ฐานข้อมูลปฏิบัติการอย่างเดียว", desc: "ดึงสดจากระบบหลัก ข้อมูลเครดิตภายนอกไม่มี", cost: 20, latency: 1 },
      { label: "+ คลังข้อมูล (อัปเดตรายคืน)", desc: "รวมประวัติย้อนหลัง แต่ข้อมูลช้ากว่าจริง 1 วัน", cost: 60, latency: 2 },
      { label: "+ สตรีมมิงและข้อมูลเครดิตภายนอก", desc: "ข้อมูลสดเกือบเรียลไทม์ ครบทุกแหล่ง", cost: 150, latency: 1 },
    ],
  },
  {
    key: "quality",
    subsystem: "Data Management",
    label: "การตรวจคุณภาพข้อมูล",
    icon: "🔍",
    question: "ถ้าข้อมูลนำเข้าผิดรูปหรือขาดหาย ระบบจะรู้ตัวหรือไม่?",
    options: [
      { label: "ไม่มี", desc: "รับข้อมูลเข้าโดยไม่ตรวจ", cost: 0, latency: 0 },
      { label: "ตรวจความครบถ้วนและช่วงค่า", desc: "กันข้อมูลผิดรูปและค่าที่เป็นไปไม่ได้", cost: 25, latency: 1 },
      { label: "+ ตรวจ schema drift และ freshness", desc: "แจ้งเตือนเมื่อโครงสร้างหรือความสดเปลี่ยน", cost: 45, latency: 1 },
    ],
  },
  {
    key: "model",
    subsystem: "Model Management",
    label: "ตัวแบบประเมินความเสี่ยง",
    icon: "📐",
    question: "ใครคำนวณความน่าจะเป็นที่จะผิดนัดชำระ และรู้ขอบเขตของตนเองหรือไม่?",
    options: [
      { label: "ไม่มี — ใช้เกณฑ์รายได้อย่างเดียว", desc: "กฎง่ายๆ ว่ารายได้ถึงเกณฑ์ก็ผ่าน", cost: 0, latency: 0 },
      { label: "Scorecard แบบดั้งเดิม", desc: "ให้คะแนนตามน้ำหนักที่กำหนดโดยผู้เชี่ยวชาญ", cost: 40, latency: 1 },
      { label: "โมเดล ML", desc: "แม่นยำกว่า แต่ไม่รายงานความไม่แน่นอน", cost: 110, latency: 2 },
      { label: "โมเดล ML + ค่าความไม่แน่นอน", desc: "รายงานช่วงความเชื่อมั่นและตรวจจับเคสนอกขอบเขต", cost: 160, latency: 2 },
    ],
  },
  {
    key: "knowledge",
    subsystem: "Knowledge-Based",
    label: "กฎ นโยบาย และข้อบังคับ",
    icon: "🧠",
    question: "องค์กรอนุญาตให้อนุมัติเคสนี้หรือไม่ ไม่ว่าโมเดลจะว่าอย่างไร?",
    options: [
      { label: "ไม่มี", desc: "เชื่อคะแนนของโมเดลอย่างเดียว", cost: 0, latency: 0 },
      { label: "กฎฝังในโค้ด", desc: "เขียนเงื่อนไขไว้ในแอป แก้ต้อง deploy ใหม่", cost: 15, latency: 0 },
      { label: "Rule engine + DMN (มีเวอร์ชัน)", desc: "ตารางการตัดสินใจที่ตรวจความขัดแย้งและเก็บเวอร์ชันได้", cost: 70, latency: 1 },
    ],
  },
  {
    key: "ui",
    subsystem: "User Interface",
    label: "ส่วนแสดงผลและคำอธิบาย",
    icon: "🖥️",
    question: "ผู้ตัดสินใจเห็นเหตุผล ข้อจำกัด และความไม่แน่นอนหรือไม่?",
    options: [
      { label: "แสดงผลดิบ (ผ่าน/ไม่ผ่าน)", desc: "เห็นแค่คำตอบสุดท้าย", cost: 10, latency: 0 },
      { label: "แดชบอร์ดสรุป", desc: "เห็นคะแนนและตัวเลขประกอบ แต่ไม่มีเหตุผล", cost: 35, latency: 0 },
      { label: "+ เหตุผล ความไม่แน่นอน และ what-if", desc: "เห็นปัจจัยสำคัญ ช่วงความเชื่อมั่น และปรับสมมติฐานได้", cost: 90, latency: 1 },
    ],
  },
  {
    key: "human",
    subsystem: "Human-in-the-loop",
    label: "จุดที่มนุษย์เข้ามาตัดสินใจ",
    icon: "👤",
    question: "เคสแบบใดที่ระบบต้องหยุดถามมนุษย์ก่อน?",
    options: [
      { label: "อัตโนมัติเต็มรูปแบบ", desc: "ไม่มีมนุษย์ในวงจรเลย", cost: 0, latency: 0 },
      { label: "ส่งมนุษย์เฉพาะเคสก้ำกึ่ง", desc: "เคสที่คะแนนอยู่ในโซนสีเทาหรือถูกตั้งธง ราว 1 ใน 4 ของทั้งหมด", cost: 260, latency: 8 },
      { label: "มนุษย์พิจารณาทุกเคส", desc: "ทีมพิจารณาสินเชื่อ 25 คน คุณภาพดีที่สุดแต่ช้าจนเกินกรอบเวลา 48 ชม.", cost: 1400, latency: 45 },
    ],
  },
  {
    key: "feedback",
    subsystem: "Feedback Loop",
    label: "การเก็บผลลัพธ์กลับเข้าระบบ",
    icon: "🔄",
    question: "ระบบรู้ได้อย่างไรว่าคำแนะนำที่ให้ไปเมื่อ 6 เดือนก่อนถูกหรือผิด?",
    options: [
      { label: "ไม่มี", desc: "ไม่เคยตามไปดูว่าลูกหนี้ชำระจริงหรือไม่", cost: 0, latency: 0 },
      { label: "เก็บผลการชำระจริง", desc: "รู้ผลย้อนหลัง แต่ไม่ได้เฝ้าระวังการเสื่อมของโมเดล", cost: 30, latency: 0 },
      { label: "+ เฝ้าระวัง drift และปรับโมเดล", desc: "ตรวจจับเมื่อโมเดลเริ่มผิดและปรับให้อัตโนมัติ", cost: 95, latency: 0 },
    ],
  },
  {
    key: "audit",
    subsystem: "Governance",
    label: "ร่องรอยการตรวจสอบ",
    icon: "📜",
    question: "อีก 2 ปี ผู้ตรวจสอบถามว่า “ทำไมถึงปฏิเสธรายนี้” จะตอบได้หรือไม่?",
    options: [
      { label: "ไม่มี", desc: "เก็บเฉพาะผลสุดท้าย", cost: 0, latency: 0 },
      { label: "บันทึกการตัดสินใจ", desc: "รู้ว่าใครตัดสินใจอะไรเมื่อไร", cost: 20, latency: 0 },
      { label: "+ lineage เต็มรูปแบบ", desc: "เก็บเวอร์ชันข้อมูล โมเดล กฎ และเหตุผลครบทุกเคส", cost: 65, latency: 1 },
    ],
  },
];

export type ArchConfig = Record<SlotKey, number>;

/** สถาปัตยกรรมตั้งต้นแบบ "ทำน้อยที่สุด" — จงใจให้มีปัญหาเพื่อให้ผู้เรียนค้นพบเอง */
export const MINIMAL_CONFIG: ArchConfig = {
  data: 0, quality: 0, model: 0, knowledge: 0, ui: 0, human: 0, feedback: 0, audit: 0,
};

/** สถาปัตยกรรมอ้างอิงที่สมดุล — ใช้เป็นฐานของ Chaos Lab */
export const REFERENCE_CONFIG: ArchConfig = {
  data: 2, quality: 2, model: 3, knowledge: 2, ui: 2, human: 1, feedback: 2, audit: 2,
};

/** ทุ่มงบสูงสุดทุกช่อง — ใช้สอนว่าแพงที่สุดไม่ได้แปลว่าคุ้มที่สุด */
export const MAXIMAL_CONFIG: ArchConfig = {
  data: 2, quality: 2, model: 3, knowledge: 2, ui: 2, human: 2, feedback: 2, audit: 2,
};

/* ============================================================
   2. ความล้มเหลวที่ฉีดเข้าระบบได้ (Chaos Lab)
   ============================================================ */

export type FaultKey =
  | "staleData"
  | "bureauDown"
  | "modelDown"
  | "oodShift"
  | "ruleConflict"
  | "latencySpike";

export type Fault = {
  key: FaultKey;
  label: string;
  icon: string;
  reality: string; // สิ่งที่เกิดขึ้นจริงในระบบ
  naiveUI: string; // สิ่งที่ผู้ใช้เห็นถ้าสถาปัตยกรรมไม่ได้ออกแบบเรื่องนี้ไว้
  honestUI: string; // สิ่งที่ผู้ใช้เห็นถ้าออกแบบให้แสดงสถานะเสื่อม
  antipattern: string;
};

export const FAULTS: Fault[] = [
  {
    key: "staleData",
    label: "ข้อมูลค้าง 2 วัน",
    icon: "🕰️",
    reality: "ท่อ ETL ล้มตั้งแต่เมื่อวาน ข้อมูลรายได้และภาระหนี้ล่าสุดยังไม่เข้าระบบ",
    naiveUI: "แสดงคะแนนความเสี่ยงตามปกติ ไม่มีสัญญาณใดบอกว่าข้อมูลเก่า",
    honestUI: "⚠️ แถบเตือน: ข้อมูลอัปเดตล่าสุดเมื่อ 2 วันก่อน — คะแนนอาจคลาดเคลื่อน",
    antipattern: "Stale-data Certainty",
  },
  {
    key: "bureauDown",
    label: "API เครดิตบูโรล่ม",
    icon: "🔌",
    reality: "เรียกข้อมูลเครดิตภายนอกไม่ได้ ทำให้ตัวแปรสำคัญหายไปทั้งหมด",
    naiveUI: "ช่องข้อมูลเครดิตแสดงเป็น 0 และถูกนำไปคำนวณเหมือนเป็นค่าจริง",
    honestUI: "⚠️ ข้อมูลเครดิตภายนอกไม่พร้อมใช้ — ระบบทำงานในโหมดจำกัด",
    antipattern: "Stale-data Certainty",
  },
  {
    key: "modelDown",
    label: "บริการโมเดลหยุดทำงาน",
    icon: "💥",
    reality: "คอนเทนเนอร์ที่ให้บริการโมเดลตอบ 503 ทุกคำขอ",
    naiveUI: "หน้าจอค้างแล้วขึ้นคะแนนค่าเริ่มต้น 0.50 เหมือนเป็นผลจากโมเดลจริง",
    honestUI: "⚠️ ประเมินความเสี่ยงไม่ได้ — ระบบเข้าสู่แผนสำรองตามที่กำหนดไว้",
    antipattern: "Automation without Exit",
  },
  {
    key: "oodShift",
    label: "ผู้ขอสินเชื่อเปลี่ยนกลุ่มไปจากที่โมเดลเคยเห็น",
    icon: "🌊",
    reality: "แคมเปญใหม่ดึงลูกค้ากลุ่มอาชีพอิสระเข้ามา 35% ซึ่งไม่มีในข้อมูลฝึกโมเดล",
    naiveUI: "ให้คะแนนด้วยความมั่นใจเท่าเดิม ทั้งที่อยู่นอกขอบเขตที่โมเดลรู้จัก",
    honestUI: "⚠️ เคสนี้อยู่นอกขอบเขตข้อมูลฝึก — ความเชื่อมั่นต่ำ ควรให้มนุษย์ทบทวน",
    antipattern: "Model as Oracle",
  },
  {
    key: "ruleConflict",
    label: "กฎขัดแย้งกันเอง",
    icon: "🕸️",
    reality: "ฝ่ายการตลาดเพิ่มกฎส่วนลดทับกฎความเสี่ยงของฝ่ายสินเชื่อ ทำให้ 30% ของเคสมีผลลัพธ์สองทาง",
    naiveUI: "ระบบหยิบกฎข้อแรกที่เจอมาใช้ ผู้ใช้ไม่เห็นว่ามีกฎขัดกันอยู่",
    honestUI: "⚠️ พบกฎขัดแย้ง 2 ข้อสำหรับเคสนี้ — ส่งให้เจ้าของกฎตัดสิน",
    antipattern: "Rule Spaghetti",
  },
  {
    key: "latencySpike",
    label: "ระบบตอบช้าผิดปกติ",
    icon: "🐌",
    reality: "คิวประมวลผลยาวขึ้น 6 เท่า ทำให้บางคำขอเกินกรอบเวลา 48 ชั่วโมง",
    naiveUI: "หน้าจอหมุนรอ ผู้ใช้ไม่รู้ว่าควรรอต่อหรือทำงานด้วยวิธีอื่น",
    honestUI: "⚠️ เวลาตอบสนองเกินปกติ — ระบบเสนอเส้นทางสำรองให้ดำเนินการต่อ",
    antipattern: "Automation without Exit",
  },
];

export type Strategy = "blockAll" | "allowAll" | "toHuman" | "cachedFallback" | "conservative";

export const STRATEGIES: { key: Strategy; label: string; desc: string }[] = [
  { key: "blockAll", label: "ปฏิเสธทั้งหมด", desc: "เมื่อประเมินไม่ได้ให้ปฏิเสธไว้ก่อน — ปลอดภัยแต่เสียลูกค้าดี" },
  { key: "allowAll", label: "อนุมัติทั้งหมด", desc: "ให้ธุรกิจเดินต่อไว้ก่อน — รักษายอดแต่รับความเสี่ยงเต็ม" },
  { key: "toHuman", label: "ส่งให้มนุษย์ทั้งหมด", desc: "โยนภาระให้เจ้าหน้าที่ — ช้าและแพง แต่คุณภาพดี" },
  { key: "cachedFallback", label: "ใช้คะแนนสำรองที่เก็บไว้", desc: "ใช้ผลล่าสุดที่รู้ว่าดี — เร็วแต่ไม่สะท้อนสถานการณ์ปัจจุบัน" },
  { key: "conservative", label: "เข้มเกณฑ์ชั่วคราว", desc: "ยกระดับเกณฑ์อนุมัติจนกว่าระบบจะกลับมาปกติ" },
];

/* ============================================================
   3. การสร้างชุดคำขอสินเชื่อ
   ============================================================ */

export type LoanCase = {
  id: number;
  trueRisk: number; // ความน่าจะเป็นที่จะผิดนัดจริง
  willDefault: boolean;
  policyBlocked: boolean; // ผิดนโยบาย/ข้อบังคับ ห้ามอนุมัติไม่ว่าคะแนนดีเพียงใด
  outOfScope: boolean; // อยู่นอกขอบเขตข้อมูลฝึกของโมเดล
  amount: number; // วงเงิน (พันบาท)
};

export function generateCases(quarter: number): LoanCase[] {
  const rng = mulberry32(SEED_ARCH + quarter * 977);
  const out: LoanCase[] = [];
  for (let i = 0; i < CASES_PER_Q; i++) {
    const trueRisk = Math.min(0.95, Math.max(0.01, 0.06 + 0.42 * rng() * rng() * 2));
    out.push({
      id: quarter * 1000 + i,
      trueRisk,
      willDefault: rng() < trueRisk,
      policyBlocked: rng() < 0.12,
      outOfScope: rng() < 0.08,
      amount: 50 + Math.round(rng() * 450),
    });
  }
  return out;
}

/* ============================================================
   4. เครื่องยนต์ประเมินผล
   ============================================================ */

export type RunOptions = {
  faults?: FaultKey[];
  strategy?: Strategy;
  transparentFailure?: boolean; // UI แสดงสถานะเสื่อมให้ผู้ใช้เห็นหรือไม่
};

export type Metrics = {
  approved: number;
  rejected: number;
  defaults: number; // อนุมัติแล้วผิดนัดชำระ
  lostGood: number; // ปฏิเสธลูกค้าดี
  violations: number; // อนุมัติเคสที่ผิดนโยบาย
  missedWindow: number; // ตัดสินใจไม่ทันกรอบเวลา 48 ชม.
  humanReviewed: number;
  profit: number; // ล้านบาท
  cost: number; // ล้านบาท (ต้นทุนระบบ 4 ไตรมาส)
  net: number;
  latency: number; // ชั่วโมง
  explainability: number; // 0..1
  auditability: number; // 0..1
  trust: number; // 0..1 ความเชื่อมั่นของผู้ใช้ที่มีต่อระบบ
  byQuarter: { q: number; profit: number; defaults: number; sigma: number }[];
};

const PROFIT_GOOD = 12; // กำไรต่อสินเชื่อที่ชำระครบ (พันบาท)
const LOSS_DEFAULT = 85; // ขาดทุนต่อรายที่ผิดนัด (พันบาท)
const COST_LOST_GOOD = 3; // ค่าเสียโอกาสเมื่อปฏิเสธลูกค้าดี
const FINE_VIOLATION = 150; // ค่าปรับต่อการอนุมัติที่ผิดข้อบังคับ
const WINDOW_HOURS = 48;

export function evaluate(cfg: ArchConfig, opt: RunOptions = {}): Metrics {
  const faults = new Set(opt.faults ?? []);
  const strategy = opt.strategy ?? "toHuman";
  const transparent = opt.transparentFailure ?? false;

  /* ---- คุณสมบัติที่ได้จากสถาปัตยกรรม ---- */
  const latency = SLOTS.reduce((s, sl) => s + sl.options[cfg[sl.key]].latency, 0) *
    (faults.has("latencySpike") ? 6 : 1);
  const costPerMonth = SLOTS.reduce((s, sl) => s + sl.options[cfg[sl.key]].cost, 0);
  const cost = (costPerMonth * 12) / 1000; // 4 ไตรมาส → ล้านบาท

  // ความสดของข้อมูล
  let freshnessPenalty = [0.10, 0.05, 0.0][cfg.data];
  if (faults.has("staleData")) freshnessPenalty += 0.12;
  if (faults.has("bureauDown")) freshnessPenalty += cfg.data === 2 ? 0.18 : 0.10;

  // คุณภาพข้อมูล (ยิ่งตรวจมาก ยิ่งลด noise และรู้ตัวเมื่อข้อมูลเสีย)
  const qualityGain = [0, 0.35, 0.6][cfg.quality];

  // ความคลาดเคลื่อนพื้นฐานของตัวแบบ
  let sigma = [0.34, 0.20, 0.13, 0.11][cfg.model];
  sigma += freshnessPenalty * (1 - qualityGain);
  const knowsUncertainty = cfg.model === 3;
  const modelDead = faults.has("modelDown");

  // ความสามารถอธิบายและตรวจสอบย้อนหลัง
  const explainBase = [0.15, 0.4, 0.9][cfg.ui];
  const explainability = explainBase * (knowsUncertainty ? 1 : 0.75);
  const auditability = [0, 0.55, 1][cfg.audit];

  // ความรู้/กฎ
  const ruleCatch = [0, 0.7, 0.97][cfg.knowledge] * (faults.has("ruleConflict") ? 0.45 : 1);

  // มนุษย์
  const humanMode = cfg.human; // 0 = ไม่มี, 1 = เฉพาะก้ำกึ่ง, 2 = ทุกเคส
  // มนุษย์แก้ความผิดพลาดได้ก็ต่อเมื่อ "เห็นเหตุผล" — นี่คือหัวใจของ UI subsystem
  const humanSkill = 0.3 + 0.55 * explainability;

  // ผลป้อนกลับ
  const learns = cfg.feedback === 2;
  const observesOutcome = cfg.feedback >= 1;

  const m: Metrics = {
    approved: 0, rejected: 0, defaults: 0, lostGood: 0, violations: 0, missedWindow: 0,
    humanReviewed: 0, profit: 0, cost, net: 0, latency,
    explainability, auditability, trust: 0, byQuarter: [],
  };

  for (let q = 0; q < QUARTERS; q++) {
    const rng = mulberry32(SEED_ARCH + q * 31 + 7);
    // การเสื่อมของโมเดล: เกิดการเปลี่ยนแปลงของประชากรในไตรมาสที่ 3
    let sigmaQ = sigma;
    if (q >= 2) sigmaQ += learns ? 0.02 : 0.16; // ถ้าไม่เฝ้าระวัง drift ความผิดพลาดค้างอยู่
    if (learns) sigmaQ *= 1 - 0.08 * q; // เรียนรู้จากผลจริงสะสม
    if (faults.has("oodShift")) sigmaQ += 0.15;

    let qProfit = 0;
    let qDefaults = 0;

    for (const c of generateCases(q)) {
      const outOfScope = c.outOfScope || (faults.has("oodShift") && rng() < 0.35);

      /* --- 1) ตัวแบบประเมินความเสี่ยง --- */
      let est: number;
      let unscoreable = false;
      if (modelDead) {
        unscoreable = true;
        est = 0.5;
      } else {
        const noise = (rng() * 2 - 1) * sigmaQ * (outOfScope ? 2.2 : 1);
        est = Math.min(1, Math.max(0, c.trueRisk + noise));
      }

      /* --- 2) ตัดสินใจอัตโนมัติเบื้องต้น --- */
      let threshold = 0.25;
      let decision: "approve" | "reject" | "human";

      if (unscoreable) {
        // ใช้กลยุทธ์รับมือความล้มเหลวตามที่สถาปัตยกรรมกำหนดไว้
        if (strategy === "blockAll") decision = "reject";
        else if (strategy === "allowAll") decision = "approve";
        else if (strategy === "toHuman") decision = "human";
        else if (strategy === "cachedFallback") {
          est = Math.min(1, Math.max(0, c.trueRisk + (rng() * 2 - 1) * 0.3));
          decision = est < threshold ? "approve" : "reject";
        } else {
          threshold = 0.12;
          est = Math.min(1, Math.max(0, c.trueRisk + (rng() * 2 - 1) * 0.3));
          decision = est < threshold ? "approve" : "reject";
        }
      } else {
        if (strategy === "conservative" && faults.size > 0) threshold = 0.15;
        decision = est < threshold ? "approve" : "reject";
      }

      /* --- 3) ชั้นความรู้: กฎและข้อบังคับ --- */
      if (c.policyBlocked && rng() < ruleCatch) decision = "reject";

      /* --- 4) มนุษย์เข้ามาในวงจร --- */
      const grayZone = est > 0.15 && est < 0.45;
      const flagged = knowsUncertainty && outOfScope;
      const needsHuman =
        humanMode === 2 ||
        (humanMode === 1 && (grayZone || flagged || decision === "human")) ||
        decision === "human";

      if (needsHuman && humanMode > 0) {
        m.humanReviewed++;
        // จุดสำคัญ: "ระบบตรวจจับได้" ไม่เท่ากับ "ผู้ใช้รู้"
        // ถ้า UI ไม่สื่อสารสถานะเสื่อมออกมา มนุษย์จะเชื่อระบบและไม่ใช้วิจารณญาณของตนเอง
        const skill = faults.size > 0 && !transparent ? humanSkill * 0.25 : humanSkill;
        const correct = rng() < skill;
        if (correct) {
          decision = c.policyBlocked ? "reject" : c.willDefault ? "reject" : "approve";
        } else if (decision === "human") {
          decision = "reject";
        }
      } else if (decision === "human") {
        // ไม่มีมนุษย์ให้ส่งต่อ — ระบบอัตโนมัติที่ไม่มีทางหนี
        decision = strategy === "allowAll" ? "approve" : "reject";
      }

      /* --- 5) กรอบเวลา --- */
      const caseLatency = latency + (needsHuman && humanMode > 0 ? 0 : 0);
      if (caseLatency > WINDOW_HOURS) {
        m.missedWindow++;
        if (decision === "approve" && rng() < 0.55) decision = "reject"; // ลูกค้าไปหาคู่แข่ง
      }

      /* --- 6) ผลลัพธ์ทางธุรกิจ --- */
      if (decision === "approve") {
        m.approved++;
        if (c.policyBlocked) {
          m.violations++;
          qProfit -= FINE_VIOLATION;
        }
        if (c.willDefault) {
          m.defaults++;
          qDefaults++;
          qProfit -= (LOSS_DEFAULT * c.amount) / 250;
        } else {
          qProfit += (PROFIT_GOOD * c.amount) / 250;
        }
      } else {
        m.rejected++;
        if (!c.willDefault && !c.policyBlocked) {
          m.lostGood++;
          qProfit -= COST_LOST_GOOD;
        }
      }
    }

    // ขยายผลจากเคสตัวอย่างกลับเป็นพอร์ตจริง แล้วแปลงเป็นล้านบาท
    const qProfitM = (qProfit * PORTFOLIO_SCALE) / 1000;
    m.profit += qProfitM;
    m.byQuarter.push({ q: q + 1, profit: qProfitM, defaults: qDefaults, sigma: sigmaQ });
  }

  m.net = m.profit - m.cost;
  // ความเชื่อมั่นของผู้ใช้: มาจากคำอธิบาย ความสามารถตรวจสอบ และการที่ระบบยอมรับว่าตนผิดได้
  m.trust = Math.max(0, Math.min(1,
    0.25 + 0.3 * explainability + 0.2 * auditability +
    (observesOutcome ? 0.12 : 0) + (knowsUncertainty ? 0.13 : 0) -
    (faults.size > 0 && !transparent ? 0.35 : 0)
  ));
  return m;
}

/* ============================================================
   5. การตรวจสอบสถาปัตยกรรม (โยงกับ anti-patterns ในบทที่ 10)
   ============================================================ */

export type Violation = {
  antipattern: string;
  detail: string;
  severity: "สูง" | "กลาง";
};

export function auditArchitecture(cfg: ArchConfig): Violation[] {
  const v: Violation[] = [];
  if (cfg.human === 0 && cfg.ui < 2)
    v.push({ antipattern: "Model as Oracle", severity: "สูง",
      detail: "ระบบตัดสินใจเองทั้งหมดโดยไม่แสดงเหตุผลหรือความไม่แน่นอน เมื่อผิดพลาดจะไม่มีใครรู้ว่าต้องแก้ที่ใด" });
  if (cfg.human === 0)
    v.push({ antipattern: "Automation without Exit", severity: "สูง",
      detail: "ไม่มีจุดที่มนุษย์เข้ามาแทรกแซง ไม่มีทางชะลอหรือส่งต่อเมื่อระบบเจอเคสที่เกินความสามารถ" });
  if (cfg.feedback === 0)
    v.push({ antipattern: "Feedback Blindness", severity: "สูง",
      detail: "ไม่เก็บผลลัพธ์จริงกลับเข้าระบบ ถ้าคำแนะนำผิดตั้งแต่ต้น ระบบจะผิดแบบเดิมตลอดไป" });
  if (cfg.audit === 0)
    v.push({ antipattern: "Untraceable Decision", severity: "สูง",
      detail: "ไม่มีร่องรอยว่าใครตัดสินใจอะไรด้วยข้อมูลและกฎเวอร์ชันใด ตรวจสอบย้อนหลังไม่ได้" });
  if (cfg.knowledge === 0)
    v.push({ antipattern: "Model as Oracle", severity: "สูง",
      detail: "ไม่มีชั้นกฎและนโยบาย ระบบจะอนุมัติเคสที่องค์กรห้ามได้ถ้าคะแนนความเสี่ยงดูดี" });
  if (cfg.quality === 0 && cfg.data < 2)
    v.push({ antipattern: "Stale-data Certainty", severity: "กลาง",
      detail: "ไม่ตรวจคุณภาพและความสดของข้อมูล ระบบจะให้คำแนะนำอย่างมั่นใจบนข้อมูลที่อาจล้าสมัย" });
  if (cfg.knowledge === 1)
    v.push({ antipattern: "Rule Spaghetti", severity: "กลาง",
      detail: "กฎฝังอยู่ในโค้ด ไม่มีเจ้าของและไม่มีเวอร์ชัน เมื่อกฎเพิ่มขึ้นจะขัดแย้งกันโดยไม่มีใครรู้" });
  if (cfg.ui === 0 && cfg.human > 0)
    v.push({ antipattern: "Dashboard-only DSS", severity: "กลาง",
      detail: "มนุษย์ต้องตัดสินใจแต่เห็นเพียงผลดิบ ไม่มีทางเลือกให้เปรียบเทียบและไม่มีเหตุผลประกอบ" });
  return v;
}

export const fmtM = (n: number) =>
  (n >= 0 ? "" : "−") + Math.abs(n).toLocaleString("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pct = (n: number) => Math.round(n * 100) + "%";
