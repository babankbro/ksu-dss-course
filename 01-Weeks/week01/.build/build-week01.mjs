import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:/work/KSU/Lecture/DSS/01-Weeks/week01";
const OUT = path.join(ROOT, "Week-01-DSS-History-Applications-Future.pptx");
const RENDER = path.join(ROOT, ".build", "artifact-renders");
const ASSETS = path.join(ROOT, "assets");

const C = {
  white: "#FFFFFF",
  ink: "#111318",
  muted: "#56606B",
  panel: "#EDF0F2",
  rule: "#B8BCC4",
  cyan: "#6DCBF4",
  blue: "#246BCE",
  pale: "#DFF3FC",
  amber: "#F2A93B",
  red: "#C84B4B",
};
const FONT = "Noto Sans Thai";
const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function shape(slide, name, left, top, width, height, fill = C.panel, geometry = "rect", lineFill = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry,
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function txt(slide, name, text, left, top, width, height, size = 24, color = C.ink, bold = false, align = "left", valign = "top") {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    fontSize: size,
    typeface: FONT,
    color,
    bold,
    alignment: align,
    verticalAlignment: valign,
  };
  return box;
}

function title(slide, text, n, kicker = "DECISION SUPPORT SYSTEMS • WEEK 01") {
  txt(slide, `kicker-${n}`, kicker, 42, 30, 800, 32, 17, C.blue, true);
  txt(slide, `title-${n}`, text, 42, 70, 1160, 78, 43, C.ink, true);
  shape(slide, `rule-${n}`, 42, 154, 1196, 2, C.rule);
}

function footer(slide, n) {
  txt(slide, `footer-label-${n}`, "KSU • ระบบสนับสนุนการตัดสินใจ", 42, 676, 500, 20, 13, C.muted);
  txt(slide, `footer-number-${n}`, String(n).padStart(2, "0"), 1180, 676, 58, 20, 13, C.muted, false, "right");
}

function sources(slide, items, teaching = "") {
  const block = ["[Sources]", ...items.map((x) => `- ${x}`)].join("\n");
  slide.speakerNotes.textFrame.setText(teaching ? `${teaching}\n\n${block}` : block);
  slide.speakerNotes.setVisible(true);
}

async function imageBytes(filename) {
  return new Uint8Array(await fs.readFile(path.join(ASSETS, filename)));
}

function addImage(slide, bytes, alt, left, top, width, height, fit = "cover") {
  return slide.images.add({
    blob: bytes,
    contentType: "image/png",
    alt,
    fit,
    position: { left, top, width, height },
    geometry: "rect",
  });
}

function addBulletList(slide, items, left, top, width, rowHeight = 58, size = 25, accent = C.blue) {
  items.forEach((item, i) => {
    shape(slide, `bullet-${top}-${i}`, left, top + i * rowHeight + 8, 12, 12, accent, "ellipse");
    txt(slide, `bullet-text-${top}-${i}`, item, left + 28, top + i * rowHeight, width - 28, rowHeight, size, C.ink);
  });
}

const originImg = await imageBytes("dss-origins.png");
const terminalImg = await imageBytes("interactive-terminal-1960s.png");
const appsImg = await imageBytes("dss-applications.png");
const futureImg = await imageBytes("future-dss.png");

// 1 — Cover
{
  const s = deck.slides.add();
  s.background.fill = "#F8F3EA";
  addImage(s, originImg, "ภาพประกอบกำเนิดระบบสนับสนุนการตัดสินใจในยุค mainframe", 0, 0, 1280, 720);
  shape(s, "cover-fade", 0, 0, 670, 720, "#F8F3EA");
  txt(s, "cover-kicker", "WEEK 01 • DECISION SUPPORT SYSTEMS", 48, 54, 560, 38, 19, C.blue, true);
  txt(s, "cover-title", "ระบบสนับสนุน\nการตัดสินใจ", 48, 170, 600, 210, 70, C.ink, true);
  txt(s, "cover-subtitle", "ประวัติ • 20 Applications • Future DSS", 48, 424, 570, 50, 29, C.ink);
  txt(s, "cover-course", "รายวิชาระบบสนับสนุนการตัดสินใจ • KSU", 48, 616, 560, 32, 18, C.muted);
  sources(s, ["Generated illustration: OpenAI ImageGen, 2026 (project asset: assets/dss-origins.png)"], "เปิดด้วยคำถาม: วันนี้นักศึกษาตัดสินใจเรื่องใดโดยใช้ข้อมูลจากระบบดิจิทัลแล้วบ้าง?");
}

// 2 — Learning outcomes
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "วันนี้เราจะตอบ 5 คำถาม", 2); footer(s, 2);
  const qs = [
    "DSS คืออะไร — และไม่ใช่อะไร?",
    "ปัญหาแบบใดที่ DSS ช่วยได้ดีที่สุด?",
    "DSS พัฒนาจาก model สู่ AI agents อย่างไร?",
    "20 งานประยุกต์มีโครงสร้างร่วมกันอะไร?",
    "Future DSS ควรฉลาดและรับผิดชอบแค่ไหน?",
  ];
  addBulletList(s, qs, 84, 198, 1080, 82, 31);
  sources(s, ["Course syllabus and Week-01 source note in this vault."], "ให้นักศึกษาเลือกหนึ่งคำถามที่อยากได้คำตอบมากที่สุด เพื่อใช้ตรวจการเรียนรู้ท้ายคาบ");
}

// 3 — Hook
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "เมื่อข้อมูลเพิ่มขึ้น การตัดสินใจไม่ได้ง่ายขึ้นเสมอ", 3); footer(s, 3);
  txt(s, "hook-claim", "ข้อมูลมาก\nเวลาน้อย\nเป้าหมายขัดแย้ง", 58, 215, 430, 280, 55, C.ink, true);
  shape(s, "hook-panel", 560, 195, 630, 360, C.panel);
  txt(s, "hook-case", "สถานการณ์เปิดชั้นเรียน", 600, 228, 520, 38, 25, C.blue, true);
  txt(s, "hook-copy", "ยอดขายลดลง 12%\nแต่กำไรเพิ่มขึ้น 4%\nลูกค้าร้องเรียนน้อยลง\nสินค้าคงคลังสูงขึ้น", 600, 300, 520, 190, 30, C.ink);
  txt(s, "hook-question", "ผู้บริหารควรทำอะไรต่อ — และต้องรู้อะไรเพิ่ม?", 600, 502, 520, 44, 23, C.red, true);
  sources(s, ["Herbert A. Simon, Administrative Behavior (1947); The New Science of Management Decision (1960)."], "กิจกรรม 3 นาที: ให้แต่ละคู่เสนอการตัดสินใจหนึ่งข้อ แล้วชี้ว่าข้อมูลใดยังขาด");
}

// 4 — Definition
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "DSS ทำให้ข้อมูลและแบบจำลองกลายเป็น “ทางเลือก”", 4); footer(s, 4);
  shape(s, "definition-band", 42, 192, 1196, 150, C.pale);
  txt(s, "definition", "ระบบคอมพิวเตอร์แบบโต้ตอบที่รวมข้อมูล แบบจำลอง ความรู้ และส่วนติดต่อผู้ใช้ เพื่อช่วยมนุษย์วิเคราะห์ทางเลือกในปัญหาซับซ้อน", 74, 226, 1130, 95, 31, C.ink, true, "center", "middle");
  txt(s, "does-title", "DSS ช่วย", 70, 396, 480, 40, 27, C.blue, true);
  txt(s, "does", "• ทำให้เห็นสถานการณ์\n• สร้างและเปรียบเทียบทางเลือก\n• ทำ what-if / forecast / optimize", 70, 454, 510, 150, 25, C.ink);
  txt(s, "not-title", "DSS ไม่ควร", 676, 396, 480, 40, 27, C.red, true);
  txt(s, "not", "• ซ่อนสมมติฐานและข้อจำกัด\n• ยกเลิกความรับผิดชอบของมนุษย์\n• ทำให้คำแนะนำดูเป็นความจริงเด็ดขาด", 676, 454, 520, 150, 25, C.ink);
  sources(s, ["Power, D.J. (2004), https://aisel.aisnet.org/cais/vol13/iss1/13/"], "เน้นคำว่า interactive และ support: ระบบต้องเปิดให้ผู้ใช้สำรวจ ปรับ และตั้งคำถาม");
}

// 5 — Problem structuredness
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "DSS เด่นที่สุดกับปัญหา “กึ่งมีโครงสร้าง”", 5); footer(s, 5);
  const cols = [
    ["STRUCTURED", "กฎและขั้นตอนชัด", "จุดสั่งซื้อสินค้า", C.pale],
    ["SEMI-STRUCTURED", "โมเดลช่วยได้\nมนุษย์ยังต้องตัดสิน", "อนุมัติสินเชื่อ", "#CDEAF8"],
    ["UNSTRUCTURED", "เป้าหมายและวิธีแก้ไม่ชัด", "ยุทธศาสตร์จังหวัด", C.panel],
  ];
  cols.forEach((x, i) => {
    const left = 42 + i * 399;
    shape(s, `struct-${i}`, left, 210, 360, 360, x[3]);
    txt(s, `struct-head-${i}`, x[0], left + 28, 242, 304, 42, 25, i === 1 ? C.blue : C.ink, true);
    txt(s, `struct-desc-${i}`, x[1], left + 28, 320, 304, 105, 27, C.ink, true);
    txt(s, `struct-example-${i}`, `ตัวอย่าง\n${x[2]}`, left + 28, 475, 304, 75, 22, C.muted);
  });
  sources(s, ["Gorry & Scott Morton (1971), https://dspace.mit.edu/bitstream/handle/1721.1/47936/frameworkformana00gorr.pdf"], "ถามให้นักศึกษาจำแนก “การเลือกสาขาเรียน” และอภิปรายว่าคำตอบอาจเปลี่ยนตามบริบท");
}

// 6 — Simon phases
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "การตัดสินใจเป็นวงจร ไม่ใช่คำตอบครั้งเดียว", 6); footer(s, 6);
  const xs = [54, 356, 658, 960];
  for (let i = 0; i < 3; i++) shape(s, `arrow-${i}`, xs[i] + 246, 322, 62, 42, C.blue, "rightArrow");
  const phases = [
    ["1", "INTELLIGENCE", "ปัญหาคืออะไร?", "ตรวจจับ • สำรวจ"],
    ["2", "DESIGN", "มีทางเลือกอะไร?", "จำลอง • สร้าง"],
    ["3", "CHOICE", "ทางเลือกใดเหมาะ?", "เปรียบเทียบ • optimize"],
    ["4", "IMPLEMENTATION", "ทำแล้วได้ผลอย่างไร?", "ติดตาม • เรียนรู้"],
  ];
  phases.forEach((p, i) => {
    shape(s, `phase-${i}`, xs[i], 230, 250, 280, i === 0 ? C.pale : C.panel);
    txt(s, `phase-no-${i}`, p[0], xs[i] + 24, 250, 44, 55, 41, C.blue, true);
    txt(s, `phase-name-${i}`, p[1], xs[i] + 24, 318, 202, 40, 22, C.ink, true);
    txt(s, `phase-q-${i}`, p[2], xs[i] + 24, 384, 202, 62, 25, C.ink, true);
    txt(s, `phase-tech-${i}`, p[3], xs[i] + 24, 462, 202, 32, 19, C.muted);
  });
  txt(s, "feedback-loop", "ผลลัพธ์ใหม่อาจทำให้ต้องย้อนกลับไปกำหนดปัญหาอีกครั้ง", 280, 560, 720, 42, 24, C.red, true, "center");
  sources(s, ["Simon, H.A. (1960), The New Science of Management Decision.", "Gorry & Scott Morton (1971), MIT."], "ย้ำว่า Implementation สร้างข้อมูลใหม่ และ feedback อาจทำให้ย้อนกลับไป Intelligence");
}

// 7 — Roots
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "ก่อนมี DSS เรามี “ศาสตร์การตัดสินใจ”", 7); footer(s, 7);
  txt(s, "roots-big", "1940s–1960s", 60, 222, 460, 90, 61, C.blue, true);
  txt(s, "roots-sub", "รากฐานที่มาบรรจบกัน", 60, 325, 460, 44, 29, C.ink, true);
  const roots = [
    ["Operations Research", "แบบจำลองและการหาค่าเหมาะที่สุด"],
    ["Behavioral Decision", "bounded rationality และ satisficing"],
    ["Interactive Computing", "ปรับตัวแปรและเห็นผลได้ทันที"],
  ];
  roots.forEach((r, i) => {
    const top = 204 + i * 125;
    shape(s, `root-box-${i}`, 604, top, 574, 96, i === 1 ? C.pale : C.panel);
    txt(s, `root-title-${i}`, r[0], 634, top + 15, 500, 30, 25, C.ink, true);
    txt(s, `root-desc-${i}`, r[1], 634, top + 53, 500, 28, 20, C.muted);
  });
  sources(s, ["Power, D.J. (2007), https://dssresources.com/history/dsshistory.html", "Simon, H.A. (1947, 1960)."], "เชื่อมให้เห็นว่า DSS ไม่ได้เกิดจากคอมพิวเตอร์อย่างเดียว แต่เกิดจากแบบจำลอง + พฤติกรรมมนุษย์ + การโต้ตอบ");
}

// 8 — 1960s origins
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "กลางทศวรรษ 1960: ผู้จัดการเริ่ม “ทดลองกับโมเดล”", 8); footer(s, 8);
  txt(s, "origin-copy", "Time-sharing และ interactive display ทำให้การวางแผนไม่ต้องรอรายงานรอบถัดไป\n\nผู้ใช้เปลี่ยนสมมติฐาน → ระบบคำนวณ → เห็นผล → ปรับอีกครั้ง", 52, 220, 520, 300, 29, C.ink);
  addImage(s, terminalImg, "ภาพประกอบ terminal แบบโต้ตอบสำหรับการวางแผนในทศวรรษ 1960", 648, 190, 590, 420);
  sources(s, ["Power, D.J. (2007), https://dssresources.com/history/dsshistory.html", "Generated illustration: OpenAI ImageGen, 2026 (project asset: assets/interactive-terminal-1960s.png)."], "เปรียบเทียบกับการรอรายงาน batch: ความเร็วของ feedback เปลี่ยนบทบาทผู้จัดการจากผู้รับรายงานเป็นผู้สำรวจทางเลือก");
}

// 9 — 1971 framework
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "1971: จับคู่ระดับงานกับโครงสร้างปัญหา", 9); footer(s, 9);
  const left = 320, top = 224, cw = 270, rh = 96;
  ["Structured", "Semi-structured", "Unstructured"].forEach((h, i) => {
    shape(s, `matrix-head-${i}`, left + i * cw, top, cw - 6, 70, i === 1 ? C.pale : C.panel);
    txt(s, `matrix-head-text-${i}`, h, left + i * cw + 10, top + 18, cw - 26, 34, 21, C.ink, true, "center");
  });
  const rows = ["Operational control", "Management control", "Strategic planning"];
  rows.forEach((r, i) => {
    txt(s, `matrix-row-${i}`, r, 52, top + 80 + i * rh, 242, 54, 21, C.ink, true, "right", "middle");
    for (let j = 0; j < 3; j++) {
      const fill = j === 1 ? "#DFF3FC" : (j === 2 ? "#F4F4F4" : "#E8F6FB");
      shape(s, `matrix-cell-${i}-${j}`, left + j * cw, top + 80 + i * rh, cw - 6, rh - 8, fill);
      txt(s, `matrix-cell-text-${i}-${j}`, i === 2 && j > 0 ? "DSS มีคุณค่าสูง" : "ระบบต้องออกแบบให้เหมาะ", left + j * cw + 14, top + 102 + i * rh, cw - 34, 46, 17, j > 0 ? C.blue : C.muted, i === 2 && j > 0, "center");
    }
  });
  sources(s, ["Gorry & Scott Morton (1971), https://dspace.mit.edu/bitstream/handle/1721.1/47936/frameworkformana00gorr.pdf"], "กรอบนี้ไม่ได้บอกว่า operational = structured เสมอ แต่ช่วยถามว่าระบบรายงานแบบเดิมเพียงพอกับงานเชิงกลยุทธ์หรือไม่");
}

// 10 — 1970s–80s
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "1970s–80s: DSS ย้ายจากห้องคอมพิวเตอร์สู่โต๊ะผู้ใช้", 10); footer(s, 10);
  shape(s, "timeline-line-10", 90, 332, 1100, 4, C.rule);
  const milestones = [
    ["1970s", "Model base + Database + Dialog", "ระบบโต้ตอบและ iterative"],
    ["ต้น 1980s", "Spreadsheet / Personal DSS", "ผู้ใช้ทำ what-if เอง"],
    ["กลาง 1980s", "EIS + Group DSS", "ผู้บริหารและทีมเข้าถึงร่วมกัน"],
    ["ปลาย 1980s", "Expert systems", "เพิ่มกฎและความรู้ผู้เชี่ยวชาญ"],
  ];
  milestones.forEach((m, i) => {
    const x = 82 + i * 292;
    shape(s, `dot-10-${i}`, x, 317, 32, 32, i === 1 ? C.blue : C.ink, "ellipse");
    txt(s, `date-10-${i}`, m[0], x, 258, 230, 34, 21, C.blue, true);
    txt(s, `milestone-10-${i}`, m[1], x, 382, 244, 76, 24, C.ink, true);
    txt(s, `meaning-10-${i}`, m[2], x, 472, 244, 58, 19, C.muted);
  });
  sources(s, ["Power, D.J. (2007), https://dssresources.com/history/dsshistory.html", "Hogue & Watson (1984), https://aisel.aisnet.org/icis1984/16/"], "ชี้ว่า spreadsheet ทำให้ DSS democratized แต่ก็เพิ่มความเสี่ยงจากสูตรผิดและไฟล์หลายเวอร์ชัน");
}

// 11 — 1990s
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "1990s: Data Warehouse, OLAP และ BI", 11); footer(s, 11);
  const steps = [
    ["DATA WAREHOUSE", "รวมข้อมูลย้อนหลัง"],
    ["OLAP", "Slice • Dice • Drill"],
    ["EIS / DASHBOARD", "ตัวชี้วัดสำหรับผู้บริหาร"],
    ["BUSINESS INTELLIGENCE", "วิเคราะห์ทั่วองค์กร"],
  ];
  for (let i = 0; i < 3; i++) shape(s, `arrow-11-${i}`, 310 + i * 300, 336, 64, 38, C.blue, "rightArrow");
  steps.forEach((m, i) => {
    const x = 42 + i * 300;
    shape(s, `step-11-${i}`, x, 244, 260, 270, i === 1 ? C.pale : C.panel);
    txt(s, `step-no-11-${i}`, String(i + 1), x + 22, 262, 46, 48, 37, C.blue, true);
    txt(s, `step-title-11-${i}`, m[0], x + 22, 335, 216, 65, 23, C.ink, true);
    txt(s, `step-desc-11-${i}`, m[1], x + 22, 432, 216, 50, 21, C.muted);
  });
  sources(s, ["Power, D.J. (2007), https://dssresources.com/history/dsshistory.html"], "ใช้ตัวอย่างยอดขาย: transaction → warehouse → cube → dashboard → business action");
}

// 12 — 2000s
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "2000s: Web และ Cloud ทำให้ DSS ไปถึงจุดตัดสินใจ", 12); footer(s, 12);
  const before = ["ระบบเฉพาะเครื่อง", "ข้อมูลภายใน", "ผู้ใช้กลุ่มเล็ก", "อัปเดตเป็นรอบ"];
  const after = ["Web / Mobile access", "เชื่อม ERP–CRM–ภายนอก", "ผู้ใช้ทั่วองค์กร", "ใกล้ real-time"];
  shape(s, "before-panel", 54, 210, 500, 350, C.panel);
  shape(s, "after-panel", 726, 210, 500, 350, C.pale);
  txt(s, "before-title", "ก่อน", 90, 242, 420, 44, 28, C.muted, true);
  txt(s, "after-title", "หลัง", 762, 242, 420, 44, 28, C.blue, true);
  txt(s, "before-copy", before.map(x => `• ${x}`).join("\n"), 90, 318, 420, 190, 27, C.ink);
  txt(s, "after-copy", after.map(x => `• ${x}`).join("\n"), 762, 318, 420, 190, 27, C.ink);
  shape(s, "transition-arrow", 585, 345, 110, 56, C.blue, "rightArrow");
  sources(s, ["Power, D.J. (2007), https://dssresources.com/history/dsshistory.html"], "การเข้าถึงง่ายขึ้นไม่ได้รับประกันว่าข้อมูลมีคุณภาพหรือการตัดสินใจดีขึ้น ต้องมี governance ควบคู่");
}

// 13 — 2010s
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "2010s: จากรายงานสู่ Predictive & Prescriptive", 13); footer(s, 13);
  const levels = [
    ["DESCRIPTIVE", "เกิดอะไรขึ้น?", "รายงาน • OLAP"],
    ["DIAGNOSTIC", "ทำไมจึงเกิด?", "Drill-down • causal clues"],
    ["PREDICTIVE", "จะเกิดอะไร?", "ML • forecasting"],
    ["PRESCRIPTIVE", "ควรทำอะไร?", "Optimization • simulation"],
  ];
  levels.forEach((m, i) => {
    const y = 204 + i * 102;
    shape(s, `level-bar-${i}`, 62, y, 1120, 78, i < 2 ? C.panel : (i === 2 ? C.pale : "#C6E8F8"));
    txt(s, `level-name-${i}`, m[0], 86, y + 21, 230, 34, 22, i >= 2 ? C.blue : C.ink, true);
    txt(s, `level-question-${i}`, m[1], 348, y + 19, 350, 40, 27, C.ink, true);
    txt(s, `level-tech-${i}`, m[2], 760, y + 22, 370, 34, 21, C.muted);
  });
  sources(s, ["Hosack et al. (2012), https://aisel.aisnet.org/jais/vol13/iss5/3/"], "ยกตัวอย่างโลจิสติกส์: dashboard รู้ว่าช้า → model ทำนายช้า → optimization จัดเส้นทางใหม่");
}

// 14 — 2020s
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "2020s: Decision Intelligence เชื่อม insight เข้ากับ action", 14); footer(s, 14);
  txt(s, "di-big", "ไม่ใช่แค่\n“โมเดลเก่ง”", 58, 212, 430, 180, 54, C.ink, true);
  txt(s, "di-next", "แต่คือ “ระบบการตัดสินใจ”\nที่วัดผลและเรียนรู้ได้", 58, 420, 450, 110, 31, C.blue, true);
  const items = [
    ["Generative AI", "สรุป อธิบาย สร้างทางเลือก"],
    ["Decision workflow", "วิเคราะห์ → อนุมัติ → ลงมือทำ"],
    ["DecisionOps", "ติดตาม model + outcome + drift"],
    ["AI agents", "วางแผน เรียกเครื่องมือ ทำงานเป็นขั้น"],
  ];
  items.forEach((m, i) => {
    const y = 205 + i * 100;
    shape(s, `di-box-${i}`, 602, y, 580, 78, i === 3 ? C.pale : C.panel);
    txt(s, `di-title-${i}`, m[0], 628, y + 13, 200, 28, 22, C.ink, true);
    txt(s, `di-desc-${i}`, m[1], 842, y + 13, 312, 48, 20, C.muted);
  });
  sources(s, ["IBM, Agentic Data Management (2026), https://www.ibm.com/think/insights/agentic-data-management", "NIST AI RMF, https://www.nist.gov/itl/ai-risk-management-framework"], "แยกคำว่า analytics model ออกจาก decision system: ระบบต้องมี actor, action, constraints, feedback และ accountability");
}

// 15 — Applications overview image
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addImage(s, appsImg, "ภาพรวมการประยุกต์ DSS ในหลายอุตสาหกรรม", 0, 0, 1280, 720);
  shape(s, "apps-title-bg", 0, 0, 1280, 142, "#FFFFFF");
  txt(s, "apps-kicker", "20 APPLICATIONS", 42, 26, 300, 30, 17, C.blue, true);
  txt(s, "apps-title", "20 Applications: ใครต้องตัดสินใจอะไร?", 42, 64, 1170, 60, 39, C.ink, true);
  shape(s, "apps-caption-bg", 42, 606, 1196, 66, "#FFFFFF");
  txt(s, "apps-caption", "วิเคราะห์ทุกระบบด้วย 6 มิติ: Decision maker • Decision • Data • Model • Action • Accountability", 70, 624, 1140, 32, 22, C.ink, true, "center");
  sources(s, ["Generated illustration: OpenAI ImageGen, 2026 (project asset: assets/dss-applications.png)."], "ใช้ภาพให้ผู้เรียนระบุโดเมนที่มองเห็น แล้วถามว่าการตัดสินใจของแต่ละโดเมนมี deadline ต่างกันอย่างไร");
}

// 16 — Apps 1–10
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "20 Applications — สุขภาพ การเงิน ค้าปลีก และโรงงาน", 16); footer(s, 16);
  const apps = [
    ["01", "Clinical support", "ตรวจ/รักษา"], ["02", "Hospital capacity", "เตียง/บุคลากร"],
    ["03", "Credit approval", "วงเงิน/เงื่อนไข"], ["04", "Fraud detection", "ตรวจสอบ/ระงับ"],
    ["05", "Portfolio allocation", "สัดส่วนลงทุน"], ["06", "Demand forecasting", "สั่งซื้อ/ผลิต"],
    ["07", "Dynamic pricing", "ราคา/ส่วนลด"], ["08", "Product assortment", "สินค้าแต่ละสาขา"],
    ["09", "Production scheduling", "ตารางผลิต"], ["10", "Predictive maintenance", "เวลาซ่อม"],
  ];
  apps.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 48 + col * 605, y = 190 + row * 91;
    shape(s, `app16-${i}`, x, y, 575, 72, i % 4 === 0 ? C.pale : C.panel);
    txt(s, `app16-no-${i}`, a[0], x + 18, y + 16, 48, 34, 22, C.blue, true);
    txt(s, `app16-name-${i}`, a[1], x + 78, y + 12, 270, 28, 21, C.ink, true);
    txt(s, `app16-decision-${i}`, a[2], x + 360, y + 14, 190, 28, 19, C.muted, false, "right");
  });
  sources(s, ["Application synthesis based on standard DSS domains; see Week-01-Expanded-Content.md."], "สุ่มหมายเลขและให้ผู้เรียนระบุ structuredness กับ cost of error ภายใน 30 วินาที");
}

// 17 — Apps 11–20
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "20 Applications — โครงสร้างพื้นฐานและสังคม", 17); footer(s, 17);
  const apps = [
    ["11", "Route optimization", "เส้นทาง/รถ"], ["12", "Supply-chain risk", "แหล่งซื้อ/สำรอง"],
    ["13", "Precision agriculture", "น้ำ/ปุ๋ย/เก็บเกี่ยว"], ["14", "Disaster response", "เตือน/อพยพ"],
    ["15", "Energy dispatch", "เดินเครื่อง/ซื้อไฟ"], ["16", "Traffic control", "สัญญาณ/เบี่ยงทาง"],
    ["17", "Student early warning", "ช่วยเหลือเฉพาะราย"], ["18", "Workforce scheduling", "กะ/การจัดคน"],
    ["19", "Cybersecurity response", "จัดลำดับ/ตอบโต้"], ["20", "Policy simulation", "เปรียบเทียบนโยบาย"],
  ];
  apps.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 48 + col * 605, y = 190 + row * 91;
    shape(s, `app17-${i}`, x, y, 575, 72, i % 4 === 1 ? C.pale : C.panel);
    txt(s, `app17-no-${i}`, a[0], x + 18, y + 16, 48, 34, 22, C.blue, true);
    txt(s, `app17-name-${i}`, a[1], x + 78, y + 12, 270, 28, 21, C.ink, true);
    txt(s, `app17-decision-${i}`, a[2], x + 360, y + 14, 190, 28, 19, C.muted, false, "right");
  });
  sources(s, ["Application synthesis based on standard DSS domains; see Week-01-Expanded-Content.md."], "เน้นว่าความเสี่ยงสูง เช่น อพยพหรือ cybersecurity ต้องมี latency ต่ำ แต่ยังต้อง trace ย้อนหลังได้");
}

// 18 — Future
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addImage(s, futureImg, "ภาพ Future DSS ที่มนุษย์กำกับ AI agents และการตัดสินใจ", 0, 0, 1280, 720);
  shape(s, "future-overlay", 0, 0, 520, 720, "#FFFFFF");
  txt(s, "future-kicker", "FUTURE DSS", 44, 46, 400, 32, 18, C.blue, true);
  txt(s, "future-title", "ฉลาดขึ้น\nต้องตรวจสอบได้\nมากขึ้น", 44, 150, 440, 220, 60, C.ink, true);
  txt(s, "future-copy", "Conversational • Multi-model\nAgentic • Uncertainty-aware\nContinuous monitoring", 44, 430, 430, 130, 27, C.blue, true);
  txt(s, "future-question", "Autonomy ต้องสัมพันธ์กับความเสี่ยง", 44, 618, 430, 38, 21, C.red, true);
  sources(s, ["NIST AI RMF 1.0, https://doi.org/10.6028/NIST.AI.100-1", "IBM, Agentic Data Management (2026), https://www.ibm.com/think/insights/agentic-data-management", "Generated illustration: OpenAI ImageGen, 2026 (project asset)."], "ชวนอภิปราย: ระบบใดควร autonomous ได้ และระบบใดต้อง human approval ทุกครั้ง?");
}

// 19 — Guardrails and questions
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "10 คำถามที่ต้องตอบก่อนเชื่อคำแนะนำของ DSS", 19); footer(s, 19);
  const leftQ = [
    "1  ใครคือผู้ตัดสินใจ?",
    "2  ต้องตัดสินใจเรื่องอะไร?",
    "3  ข้อมูลมาจากไหน?",
    "4  คุณภาพและอคติเป็นอย่างไร?",
    "5  โมเดลตั้งสมมติฐานอะไร?",
  ];
  const rightQ = [
    "6  มีทางเลือกใดถูกละเลย?",
    "7  ความไม่แน่นอนสูงแค่ไหน?",
    "8  ใครได้รับผลกระทบ?",
    "9  มนุษย์ override ได้หรือไม่?",
    "10  ใครรับผิดชอบและตรวจสอบ?",
  ];
  shape(s, "q-left", 52, 204, 560, 392, C.panel);
  shape(s, "q-right", 668, 204, 560, 392, C.pale);
  txt(s, "q-left-text", leftQ.join("\n"), 88, 235, 490, 324, 27, C.ink, true);
  txt(s, "q-right-text", rightQ.join("\n"), 704, 235, 490, 324, 27, C.ink, true);
  sources(s, ["NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/", "NIST AI RMF Appendix C, https://airc.nist.gov/airmf-resources/airmf/appendices/app-c-ai-risk-management-and-human-ai-interaction/"], "คำถามบนสไลด์เป็น checklist วิเคราะห์ระบบ ส่วนแบบฝึก 10 ข้อพร้อมแนวคำตอบอยู่ใน Week-01-Questions.md");
}

// 20 — Labs and close
{
  const s = deck.slides.add(); s.background.fill = C.white; title(s, "ลงมือทำ: วิเคราะห์อดีต แล้วออกแบบอนาคต", 20, "WEEK 01 • NEXT ACTION"); footer(s, 20);
  shape(s, "lab1", 54, 202, 540, 356, C.panel);
  shape(s, "lab2", 686, 202, 540, 356, C.pale);
  txt(s, "lab1-no", "LAB 01", 86, 232, 180, 34, 22, C.blue, true);
  txt(s, "lab1-title", "DSS History &\nDecision Case", 86, 300, 450, 100, 38, C.ink, true);
  txt(s, "lab1-copy", "สร้าง timeline\nใช้ Simon วิเคราะห์ระบบเตือนนักศึกษา\nอภิปราย support vs automation", 86, 432, 450, 100, 23, C.muted);
  txt(s, "lab2-no", "LAB 02", 718, 232, 180, 34, 22, C.blue, true);
  txt(s, "lab2-title", "Design a\nFuture DSS", 718, 300, 450, 100, 38, C.ink, true);
  txt(s, "lab2-copy", "สร้าง Decision Canvas\nออกแบบ 4 subsystems + feedback\nกำหนด autonomy และ guardrails", 718, 432, 450, 100, 23, C.muted);
  txt(s, "closing", "เป้าหมาย: DSS ที่มีประโยชน์ ตรวจสอบได้ และมนุษย์ยังรับผิดชอบ", 180, 602, 920, 42, 26, C.ink, true, "center");
  sources(s, ["Lab instructions in Lab-01-DSS-History-and-Decision-Case.md and Lab-02-Design-a-Future-DSS.md."], "ปิดคาบด้วย exit ticket: DSS ที่ดีควรเพิ่ม “คุณภาพการตัดสินใจ” ไม่ใช่เพียงเพิ่ม automation");
}

await fs.mkdir(RENDER, { recursive: true });
for (const [i, slide] of deck.slides.items.entries()) {
  const png = await deck.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(RENDER, `slide-${String(i + 1).padStart(2, "0")}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(RENDER, `slide-${String(i + 1).padStart(2, "0")}.layout.json`), await layout.text());
}
const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(ROOT, ".build", "week01-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT);
console.log(JSON.stringify({ output: OUT, slideCount: deck.slides.items.length, renderDir: RENDER }));
