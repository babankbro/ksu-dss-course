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
    slug: "architecture-sandbox",
    title: "Architecture Sandbox",
    short: "ประกอบสถาปัตยกรรม DSS เองทีละชั้น แล้วรันคำขอสินเชื่อจริง 800 เคสผ่านสิ่งที่สร้าง",
    icon: "🏗️",
    weeks: "W2",
    concept: "ระบบย่อย 4 ส่วน · contract ระหว่างชั้น · การแลกเปลี่ยนเชิงสถาปัตยกรรม",
    misconception: "วาดกล่องกับลูกศรได้ แต่ไม่เห็นว่าการขาดชั้นใดชั้นหนึ่งทำให้ระบบพังอย่างไร",
    ready: true,
  },
  {
    slug: "chaos-lab",
    title: "Chaos Lab",
    short: "ทุบระบบทีละชิ้น แล้วเทียบสิ่งที่เกิดขึ้นจริงกับสิ่งที่ผู้ตัดสินใจมองเห็นบนหน้าจอ",
    icon: "💥",
    weeks: "W2",
    concept: "Failure handling contract · graceful degradation · คุณลักษณะคุณภาพ",
    misconception: "คิดว่าสถาปัตยกรรมที่ดีวัดกันตอนทุกอย่างทำงานปกติ",
    ready: true,
  },
  {
    slug: "antipattern-clinic",
    title: "Anti-pattern Clinic",
    short: "วินิจฉัยระบบป่วย 8 ราย ตาม anti-pattern 7 ข้อ แล้วสั่งยาให้ตรงและน้อยที่สุด",
    icon: "🩺",
    weeks: "W2",
    concept: "Anti-patterns เชิงสถาปัตยกรรม · การประเมินความคุ้มค่าของความซับซ้อน",
    misconception: "อ่าน anti-pattern แล้วพยักหน้า แต่จำแนกไม่ออกเมื่อเจอระบบจริง",
    ready: true,
  },
  {
    slug: "grain-detective",
    title: "Grain Detective",
    short: "เลือก grain ของ fact table แล้วดูว่าคำถามธุรกิจ 6 ข้อตอบผิดกี่ข้อ",
    icon: "🔎",
    weeks: "W3",
    concept: "Grain contract · การนับซ้ำ · fact table หนึ่งตารางตอบได้แค่ชุดคำถามเดียว",
    misconception: "คิดว่า grain คือระดับความละเอียดเฉยๆ ไม่เห็นว่ามันตัดสินว่าองค์กรถามอะไรได้บ้าง",
    ready: true,
  },
  {
    slug: "dirty-data",
    title: "Dirty Data Gauntlet",
    short: "เปิดกฎคุณภาพข้อมูลทีละข้อกับข้อมูลจาก 3 ระบบต้นทาง แล้วดูยอดขายวิ่งเข้าหาค่าจริง",
    icon: "🧼",
    weeks: "W3",
    concept: "Data quality 6 มิติ · etl_rejects · การกระทบยอด (reconciliation)",
    misconception: "มองการทำความสะอาดข้อมูลเป็นงานน่าเบื่อ ไม่ใช่การตัดสินใจเชิงออกแบบ",
    ready: true,
  },
  {
    slug: "etl-pipeline",
    title: "ETL Pipeline Sim",
    short: "รันท่อข้อมูล 30 วันที่มี schema drift ข้อมูลมาช้า แฟ้มส่งซ้ำ และแฟ้มว่าง",
    icon: "🔁",
    weeks: "W3",
    concept: "Incremental load · idempotency · schema drift · late-arriving data",
    misconception: "คิดว่า ETL คือสคริปต์ที่รันแล้วจบ และ “งานไม่ล้ม” แปลว่าข้อมูลถูกต้อง",
    ready: true,
  },
  {
    slug: "simpson-paradox",
    title: "Simpson's Paradox Lab",
    short: "conversion rate ลดลงทั้ง Mobile และ Desktop แต่ตัวเลขรวมกลับเพิ่มขึ้น 13.3 จุด",
    icon: "🎭",
    weeks: "W4",
    concept: "Aggregation trap · confounder · drill-down ก่อนตัดสินใจ",
    misconception: "เชื่อตัวเลขรวมโดยไม่ drill-down และคิดว่าตัวเลขที่ถูกต้องย่อมตีความได้ตรงไปตรงมา",
    ready: true,
  },
  {
    slug: "metric-sprawl",
    title: "Metric Sprawl Arena",
    short: "4 แผนกนิยาม “รายได้” ต่างกัน ได้ตัวเลขห่างกัน 17.68% จากข้อมูลชุดเดียวกัน",
    icon: "🏷️",
    weeks: "W4",
    concept: "Semantic layer · metric store · single source of truth",
    misconception: "ไม่เข้าใจว่า semantic layer แก้ปัญหาอะไร คิดว่าเป็นแค่ชั้นเพิ่มความซับซ้อน",
    ready: true,
  },
  {
    slug: "time-intelligence",
    title: "Time Intelligence Builder",
    short: "YTD · MoM · YoY · Rolling 12 เดือน บนยอดขายจริง 3 ปีที่มีเหตุการณ์ผิดปกติซ่อนอยู่",
    icon: "📅",
    weeks: "W4",
    concept: "Window functions · การเลือกตัววัดคือการเลือกว่าจะให้เห็นอะไร",
    misconception: "เขียน YTD/YoY ผิดโดยไม่รู้ตัว และเติม 0 แทน NaN ในช่วงที่คำนวณไม่ได้",
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
