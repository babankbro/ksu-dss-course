/**
 * ทะเบียนกลางของ simulation ทั้งหมดในรายวิชา
 * เพิ่ม simulation ใหม่ที่นี่ที่เดียว แล้วทั้งแถบข้างและหน้าแรกจะอัปเดตตามเอง
 */
export type Sim = {
  slug: string;
  title: string;
  short: string;
  icon: string;
  weeks: string;
  concept: string;
  misconception: string;
  ready: boolean;
};

export const SIMS: Sim[] = [
  {
    slug: "decision-cockpit",
    title: "Decision Cockpit",
    short: "จำลองการตัดสินใจตามกรอบ Simon 4 ระยะ เทียบผลระหว่างไม่มีระบบ / มี BI / มี DSS",
    icon: "🎛️",
    weeks: "W1–W2",
    concept: "Simon's 4 Phases · Bounded Rationality · คุณค่าของ DSS",
    misconception: "นักศึกษามอง DSS เป็นเพียงโปรแกรมออกรายงาน ไม่เห็นว่าเป็นวงจรการตัดสินใจ",
    ready: true,
  },
  {
    slug: "olap-cube",
    title: "OLAP Cube Explorer",
    short: "ลูกบาศก์ข้อมูลที่หมุนได้ กด Roll-up / Drill-down / Slice / Dice / Pivot แล้วเห็น SQL ที่เทียบเท่า",
    icon: "🧊",
    weeks: "W3–W4",
    concept: "Data Cube · การดำเนินการ OLAP · Star Schema · ตัววัดแบบ non-additive",
    misconception: "ท่องชื่อการดำเนินการ OLAP ได้ แต่แยกไม่ออกว่าอันไหนคืออันไหนเมื่อเจอคำถามธุรกิจ",
    ready: true,
  },
  {
    slug: "bias-lab",
    title: "Bias Lab",
    short: "ปรับ threshold และต้นทุนของความผิดพลาด แล้วดูว่ากำไรจริงเปลี่ยนไปอย่างไร",
    icon: "⚖️",
    weeks: "W5–W6, W9",
    concept: "Confusion Matrix · Precision/Recall · ต้นทุนของ FP กับ FN",
    misconception: "เลือกโมเดลจากค่า accuracy สูงสุดเสมอ",
    ready: false,
  },
  {
    slug: "fuzzy-playground",
    title: "Fuzzy vs Crisp Playground",
    short: "ลากฟังก์ชันความเป็นสมาชิกแล้วเห็นผลการอนุมัติสินเชื่อเปลี่ยนทันที",
    icon: "🌫️",
    weeks: "W12–W13",
    concept: "Membership Function · Mamdani FIS · vagueness ต่างจาก probability",
    misconception: "แยกความคลุมเครือออกจากความน่าจะเป็นไม่ได้",
    ready: false,
  },
  {
    slug: "signal-to-action",
    title: "Signal-to-Action Race",
    short: "แข่ง 3 เลนพร้อมกัน — BI, AI/ML และ Decision Intelligence บนเหตุการณ์ชุดเดียวกัน",
    icon: "🏁",
    weeks: "W15",
    concept: "BI vs AI vs DI · DecisionOps · human-in-the-loop",
    misconception: "มอง Decision Intelligence เป็นเพียงคำการตลาด",
    ready: false,
  },
];

export const getSim = (slug: string) => SIMS.find((s) => s.slug === slug);
