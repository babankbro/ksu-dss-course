---
title: "แผนการสอน 16 สัปดาห์"
tags: [admin, outline]
---

# 🗓️ แผนการสอน 16 สัปดาห์

## ตารางภาพรวม

| W | หัวข้อบรรยาย | ปฏิบัติการ / Lab | CLO | เหตุการณ์สำคัญ |
|:--:|---|---|:--:|---|
| 1 | [[Week-01-Introduction-to-Decision-Making\|การตัดสินใจและบทบาทของ DSS]] | Lab 0: ปฐมนิเทศเครื่องมือ + Git/Notebook | 1 | แนะนำรายวิชา |
| 2 | [[Week-02-DSS-Architecture\|สถาปัตยกรรมและระบบย่อยของ DSS]] | [[Lab-01-DSS-Architecture-Teardown\|Lab 1]]: ถอดสถาปัตยกรรมระบบจริง | 1 | จัดกลุ่มโครงงาน |
| 3 | [[Week-03-Data-Management-and-Data-Warehouse\|Data Management & Data Warehouse]] | [[Lab-02-Build-a-Star-Schema\|Lab 2]]: สร้าง Star Schema + ETL | 2 | |
| 4 | [[Week-04-OLAP-and-Multidimensional-Analysis\|OLAP และการวิเคราะห์หลายมิติ]] | [[Lab-03-OLAP-Cube-Operations\|Lab 3]]: Cube / Drill-down / Slice & Dice | 2 | **ปล่อยงานเดี่ยว** |
| 5 | [[Week-05-Data-Mining-I\|Data Mining I: CRISP-DM & Classification]] | [[Lab-04-Classification-Pipeline\|Lab 4]]: Decision Tree & Naive Bayes | 2 | |
| 6 | [[Week-06-Data-Mining-II\|Data Mining II: Clustering & Association Rules]] | [[Lab-05-Clustering-and-Market-Basket\|Lab 5]]: K-Means & Apriori | 2 | |
| 7 | [[Week-07-Dashboard-and-EIS\|Dashboard, EIS และ Semantic Layer]] | [[Lab-06-Executive-Dashboard\|Lab 6]]: Power BI Dashboard | 3 | **ส่งงานเดี่ยว (ก่อนเที่ยงคืนวันอาทิตย์)** |
| 8 | [[Week-08-Midterm-Exam\|🧪 สอบกลางภาค]] | — | 1,2,3 | **สอบกลางภาค (25%)** |
| 9 | [[Week-09-Predictive-Modeling\|Predictive Modeling ด้วย ML]] | [[Lab-07-Predictive-Model-and-Metrics\|Lab 7]]: RF/SVM + เมตริกประเมินผล | 4 | **ปล่อยโจทย์งานกลุ่ม** |
| 10 | [[Week-10-Optimization-and-Prescriptive\|Optimization และ Prescriptive Analytics]] | [[Lab-08-Linear-Programming\|Lab 8]]: LP ด้วย PuLP + Sensitivity | 4 | **ส่งข้อเสนอโครงงาน (Proposal)** |
| 11 | [[Week-11-Heuristics-and-Simulation\|Heuristics, GA และ Monte Carlo]] | [[Lab-09-GA-and-Monte-Carlo\|Lab 9]]: GA แก้ VRP + Monte Carlo | 4 | |
| 12 | [[Week-12-Fuzzy-Logic\|Fuzzy Logic และ FIS]] | [[Lab-10-Fuzzy-Inference-System\|Lab 10]]: scikit-fuzzy (Mamdani) | 5 | **Checkpoint 1: Data + Model layer** |
| 13 | [[Week-13-Bayesian-Networks-and-ANFIS\|Bayesian Networks และ ANFIS]] | [[Lab-11-Bayesian-Network\|Lab 11]]: pgmpy + inference | 5 | |
| 14 | [[Week-14-Expert-Systems-and-DMN\|Expert Systems, BRMS และ DMN]] | [[Lab-12-DMN-Decision-Table\|Lab 12]]: Decision Table บน DMN Engine | 5 | **Checkpoint 2: Prototype ทำงานได้** |
| 15 | [[Week-15-Decision-Intelligence-and-Agentic-AI\|Decision Intelligence, Agentic AI, DecisionOps]] | [[Lab-13-Deploy-DSS-as-API\|Lab 13]]: FastAPI + Docker | 6 | **ส่งรายงานโครงงานฉบับสมบูรณ์** |
| 16 | [[Week-16-Project-Presentation\|นำเสนอโครงงานกลุ่ม + ทบทวน]] | นำเสนอ + Peer review | 6 | **นำเสนอ (25%)** |
| — | [[Final-Exam-Blueprint\|🧪 สอบปลายภาค]] | — | 4,5,6 | **สอบปลายภาค (30%)** |

## เหตุผลเชิงออกแบบของลำดับเนื้อหา

1. **ไล่ตามชั้นสถาปัตยกรรม DSS** — W1–2 วางกรอบ → W3–7 ชั้นข้อมูล (Data Management + UI) → W9–11 ชั้นตัวแบบ (Model Management) → W12–14 ชั้นความรู้ (Knowledge-Based Management) → W15 การนำขึ้นใช้งาน สอดคล้องกับระบบย่อยทั้ง 4 ใน [[DSS-Architecture-Subsystems]]

2. **จุดตัดกลางภาคอยู่ที่ขอบเขตธรรมชาติ** — ครบชั้นข้อมูลและการนำเสนอผลพอดี (W7) ทำให้ [[Midterm-Exam-Blueprint|สอบกลางภาค]] วัด "descriptive analytics" ครบวง ส่วน [[Final-Exam-Blueprint|ปลายภาค]] วัด "predictive + prescriptive + knowledge-based" ครบวง

3. **งานเดี่ยวถูกวางไว้ก่อนกลางภาค** — ปิดวงจร ETL → OLAP → Dashboard ให้นักศึกษาลงมือทำครบทุกขั้นก่อนสอบ ทำให้ข้อสอบกลางภาคเป็นการทบทวนงานที่เพิ่งทำ

4. **งานกลุ่มเริ่ม W9 และมี 2 checkpoint** — ป้องกันการทำงานทุ่มท้ายภาค และบังคับให้ prototype ทำงานได้ก่อน W14 เหลือเวลาปรับปรุงคุณภาพ 2 สัปดาห์

5. **W15 ปิดท้ายด้วย Decision Intelligence + จริยธรรม** — วางเนื้อหาอนาคต (Agentic AI, DecisionOps) หลังจากผู้เรียนสัมผัสข้อจำกัดของทุกเทคนิคด้วยตนเองแล้ว จึงเห็นคุณค่าของแนวคิดใหม่จริง แทนที่จะเป็นแค่ buzzword

---
**ที่เกี่ยวข้อง:** [[Home]] · [[Course-Syllabus]] · [[Assessment-and-Grading]] · [[Lab-Index]]
