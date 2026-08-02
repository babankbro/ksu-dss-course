# DSS Simulations — เว็บสื่อจำลองประกอบการเรียน

เว็บแอป Next.js สำหรับรายวิชา **ระบบสนับสนุนการตัดสินใจ (Decision Support Systems)**
รวมสื่อจำลองเชิงโต้ตอบไว้ในที่เดียว มีหน้าแรกและแถบข้างสำหรับคลิกเข้าแต่ละตัว

## เริ่มใช้งาน

```bash
npm --prefix web install
```

```bash
npm --prefix web run dev
```

เปิด http://localhost:3000

## เส้นทาง (Routes)

| เส้นทาง | หน้า | ใช้กับสัปดาห์ |
|---|---|---|
| `/` | หน้าแรก — การ์ดรวมสื่อจำลองทั้งหมด | — |
| `/sims/decision-cockpit` | 🎛️ Decision Cockpit | W1–W2 |
| `/sims/architecture-sandbox` | 🏗️ Architecture Sandbox | W2 |
| `/sims/chaos-lab` | 💥 Chaos Lab | W2 |
| `/sims/antipattern-clinic` | 🩺 Anti-pattern Clinic | W2 |
| `/sims/grain-detective` | 🔎 Grain Detective | W3 |
| `/sims/dirty-data` | 🧼 Dirty Data Gauntlet | W3 |
| `/sims/etl-pipeline` | 🔁 ETL Pipeline Sim | W3 |
| `/sims/olap-cube` | 🧊 OLAP Cube Explorer | W3–W4 |
| `/sims/simpson-paradox` | 🎭 Simpson's Paradox Lab | W4 |
| `/sims/metric-sprawl` | 🏷️ Metric Sprawl Arena | W4 |
| `/sims/time-intelligence` | 📅 Time Intelligence Builder | W4 |
| `/sims/tree-grower` | 🌳 Decision Tree Grower | W5 |
| `/sims/leakage-hunter` | 🕵️ Leakage Hunter | W5 |
| `/sims/threshold-policy` | 🎯 Threshold Policy Studio | W5–W6, W9 |
| `/sims/segment-studio` | 👥 Segment Studio | W6 |
| `/sims/cluster-reality-check` | 🔬 Cluster Reality Check | W6 |
| `/sims/lift-detective` | 🧺 Lift Detective | W6 |

## โครงสร้างโค้ด

```
web/
├── app/
│   ├── layout.tsx                # โครงหลัก + ฟอนต์ Sarabun + แถบข้าง
│   ├── page.tsx                  # หน้าแรก (Server Component)
│   ├── globals.css               # ธีมกลาง รองรับทั้งโหมดสว่างและมืด
│   └── sims/<slug>/page.tsx      # UI ของแต่ละสื่อจำลอง (Client Component)
├── components/
│   └── Sidebar.tsx               # แถบข้าง + เมนูสำหรับจอเล็ก
├── lib/
│   ├── sims.ts                   # ทะเบียนกลางของสื่อจำลองทุกตัว
│   ├── cockpit.ts                # ตัวแบบตลาดและเหตุการณ์ของ Decision Cockpit
│   ├── olap.ts                   # ชุดข้อมูลและตรรกะรวมยอดหลายมิติของ OLAP Cube
│   ├── architecture.ts           # ตัวแบบชั้นสถาปัตยกรรมของ W2
│   ├── antipatterns.ts           # เคสผู้ป่วยของ Anti-pattern Clinic
│   ├── csv.ts                    # ตัวอ่าน CSV ที่สื่อจำลองตั้งแต่ W3 ใช้ร่วมกัน
│   └── ml.ts                     # confusion matrix · AUC · entropy · logistic · K-Means (W5–W6)
└── public/datasets/weekXX/       # สำเนาของ ../datasets/ ให้เบราว์เซอร์อ่านได้
```

**ตรรกะแยกจาก UI โดยตั้งใจ** — ไฟล์ใน `lib/` เป็นฟังก์ชันบริสุทธิ์ทั้งหมด
เปิดให้ดูในชั้นเรียนได้ว่าตัวแบบคำนวณอะไร และนักศึกษาแก้พารามิเตอร์เพื่อทดลองเองได้

**สื่อจำลองตั้งแต่สัปดาห์ที่ 3 อ่านไฟล์ CSV เดียวกับ Colab** — ตัวเลขบนหน้าจอจึงตรงกับ
ตัวเลขที่นักศึกษาคำนวณเองทุกหลัก ใช้เป็นเกณฑ์ตรวจงานได้ทันที
เมื่อแก้ไฟล์ใน `../datasets/weekXX/` ต้องคัดลอกมาที่ `public/datasets/weekXX/` ด้วย

## การเพิ่มสื่อจำลองใหม่

1. เพิ่มรายการใน `lib/sims.ts` (ตั้ง `ready: true` เมื่อพร้อมใช้)
2. สร้าง `app/sims/<slug>/page.tsx`
3. แถบข้างและหน้าแรกจะอัปเดตให้เองโดยไม่ต้องแก้ที่อื่น

## ข้อกำหนดเชิงออกแบบ

- **Deterministic** — ทุกสื่อจำลองใช้ตัวสุ่มแบบกำหนดเมล็ด (`mulberry32` + seed คงที่)
  ผลลัพธ์จึงเหมือนกันทุกเครื่องทุกครั้ง ทำให้เฉลยหน้าชั้นเรียนและออกใบงานที่มีคำตอบตายตัวได้
- **ไม่มี backend** — ประมวลผลในเบราว์เซอร์ทั้งหมด ไม่มีการส่งข้อมูลออกนอกเครื่อง
  (ใช้ `localStorage` เก็บคะแนนข้ามโหมดเท่านั้น)
- **ธีมตามระบบ** — รองรับทั้งโหมดสว่างและมืดผ่าน `prefers-color-scheme`

## เวอร์ชันไฟล์เดียว (สำรอง)

ที่ `../06-Simulations/` มีเวอร์ชัน HTML ไฟล์เดียวของ Decision Cockpit และ OLAP Cube Explorer
เปิดได้โดยไม่ต้องรันเซิร์ฟเวอร์ — เหมาะกับการแจกให้นักศึกษาเปิดเองที่บ้าน
หรือใช้สอนในห้องที่ติดตั้ง Node.js ไม่ได้

สื่อจำลองตัวอื่นใช้เว็บแอปเท่านั้น เพราะต้องอ่านไฟล์ CSV จาก `public/datasets/`

## นำขึ้นใช้งานจริง

```bash
npm --prefix web run build
```

ทุกหน้าเป็น static ทั้งหมด จึง deploy ขึ้น static hosting ใดก็ได้ (Vercel, GitHub Pages, เว็บเซิร์ฟเวอร์ของคณะ)
