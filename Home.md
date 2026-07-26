---
title: "DSS — ระบบสนับสนุนการตัดสินใจ (Course MOC)"
tags: [moc, dss, course]
course: "Decision Support Systems"
weeks: 16
---

# 🏠 Home — รายวิชาระบบสนับสนุนการตัดสินใจ (Decision Support Systems)

> Map of Content (MOC) หลักของ vault นี้ — เริ่มอ่านจากหน้านี้เสมอ

## 📌 เริ่มต้นที่นี่
- [[Course-Syllabus|📄 ประมวลรายวิชา (Syllabus)]]
- [[Course-Outline-16-Weeks|🗓️ แผนการสอน 16 สัปดาห์]]
- [[Assessment-and-Grading|💯 การวัดผลและเกณฑ์การให้คะแนน]]
- [[Tools-and-Software-Setup|🛠️ เครื่องมือและการติดตั้ง]]
- [[Reading-List|📚 รายการอ้างอิงและแหล่งค้นคว้า]]

## 🗓️ สัปดาห์การเรียน

| ช่วง | สัปดาห์ | หัวข้อ |
|---|---|---|
| **Part I — รากฐาน** | [[Week-01-Introduction-to-Decision-Making\|W1]] | การตัดสินใจและบทบาทของ DSS |
| | [[Week-02-DSS-Architecture\|W2]] | สถาปัตยกรรมและองค์ประกอบของ DSS |
| **Part II — ข้อมูล** | [[Week-03-Data-Management-and-Data-Warehouse\|W3]] | Data Management & Data Warehouse |
| | [[Week-04-OLAP-and-Multidimensional-Analysis\|W4]] | OLAP และการวิเคราะห์หลายมิติ |
| | [[Week-05-Data-Mining-I\|W5]] | Data Mining I — CRISP-DM & Classification |
| | [[Week-06-Data-Mining-II\|W6]] | Data Mining II — Clustering & Association Rules |
| | [[Week-07-Dashboard-and-EIS\|W7]] | Dashboard, EIS และ Semantic Layer |
| **สอบ** | [[Week-08-Midterm-Exam\|W8]] | 🧪 **สอบกลางภาค** |
| **Part III — ตัวแบบ** | [[Week-09-Predictive-Modeling\|W9]] | Predictive Modeling ด้วย Machine Learning |
| | [[Week-10-Optimization-and-Prescriptive\|W10]] | Optimization และ Prescriptive Analytics |
| | [[Week-11-Heuristics-and-Simulation\|W11]] | Heuristics, GA และ Monte Carlo Simulation |
| **Part IV — ความไม่แน่นอน & ความรู้** | [[Week-12-Fuzzy-Logic\|W12]] | Fuzzy Logic และ Fuzzy Inference System |
| | [[Week-13-Bayesian-Networks-and-ANFIS\|W13]] | Bayesian Networks และ ANFIS |
| | [[Week-14-Expert-Systems-and-DMN\|W14]] | Expert Systems, BRMS และ DMN |
| **Part V — ยุคใหม่** | [[Week-15-Decision-Intelligence-and-Agentic-AI\|W15]] | Decision Intelligence, Agentic AI, DecisionOps |
| | [[Week-16-Project-Presentation\|W16]] | นำเสนอโครงงานกลุ่ม + ทบทวน |
| **สอบ** | [[Final-Exam-Blueprint\|Final]] | 🧪 **สอบปลายภาค** |

## 🧠 คลังความรู้ (Concept Notes)
- **รากฐาน:** [[DSS-Definition-and-Evolution]] · [[Simon-Decision-Phases]] · [[Bounded-Rationality]] · [[Problem-Structuredness]] · [[DSS-Architecture-Subsystems]] · [[Types-of-DSS]]
- **ข้อมูล:** [[Data-Warehouse]] · [[ETL-Process]] · [[Star-and-Snowflake-Schema]] · [[OLAP]] · [[Data-Mining-Overview]] · [[CRISP-DM]] · [[Data-Preprocessing]] · [[Classification]] · [[Clustering]] · [[Association-Rules]] · [[Model-Evaluation-Metrics]]
- **การนำเสนอ:** [[Dashboard-Design]] · [[Visual-Analytics]] · [[Metadata-Lineage-Semantic-Layer]] · [[Executive-Information-Systems]]
- **ตัวแบบ:** [[Predictive-Analytics]] · [[Machine-Learning-for-DSS]] · [[Optimization-and-Operations-Research]] · [[Linear-Programming]] · [[Sensitivity-Analysis]] · [[Heuristic-Search]] · [[Genetic-Algorithms]] · [[Monte-Carlo-Simulation]]
- **ความไม่แน่นอน:** [[Fuzzy-Logic]] · [[Fuzzy-Inference-System]] · [[Bayesian-Networks]] · [[ANFIS]]
- **ความรู้และกฎ:** [[Expert-Systems]] · [[Inference-Engine]] · [[BRMS-and-Rule-Engines]] · [[DMN-Decision-Model-and-Notation]]
- **ยุคใหม่:** [[Business-Intelligence]] · [[Decision-Intelligence]] · [[Agentic-AI]] · [[DecisionOps-and-MLOps]] · [[Explainable-AI-and-Governance]] · [[Industry-Applications]]

## ✍️ งานที่ต้องส่ง
- [[Individual-Assignment|👤 งานเดี่ยว — DSS Data Analysis & Dashboard (15%)]]
- [[Group-Project|👥 งานกลุ่ม — Mini-DSS Prototype (25%)]]
- [[Rubrics|📋 เกณฑ์การประเมิน (Rubrics)]]

## 🧪 การสอบ
- [[Midterm-Exam-Blueprint|Blueprint สอบกลางภาค (25%)]]
- [[Final-Exam-Blueprint|Blueprint สอบปลายภาค (30%)]]
- [[Question-Bank|คลังข้อสอบตัวอย่าง]]

## 🔬 ปฏิบัติการ (Labs)
[[Lab-Index|ดัชนีแลบทั้งหมด (Lab 01–10)]]

## 🎮 สื่อจำลองเชิงโต้ตอบ (Simulations)
[[Simulation-Index|ดัชนีสื่อจำลองทั้งหมด]] — เว็บแอป Next.js มีหน้าแรกและแถบข้าง เปิดด้วย `npm --prefix web run dev` แล้วไปที่ `http://localhost:3000`

| สื่อจำลอง | สัปดาห์ | ใบงาน |
|---|:--:|---|
| 🎛️ Decision Cockpit — จำลองการตัดสินใจตามกรอบ Simon | W1–W2 | [[Sim-01-Decision-Cockpit]] |
| 🏗️ Architecture Sandbox — ประกอบสถาปัตยกรรมเองแล้วรันจริง | W2 | [[Sim-03-Architecture-Sandbox]] |
| 💥 Chaos Lab — ทุบระบบทีละชิ้น | W2 | [[Sim-04-Chaos-Lab]] |
| 🩺 Anti-pattern Clinic — วินิจฉัยระบบป่วย 8 ราย | W2 | [[Sim-05-Antipattern-Clinic]] |
| 🧊 OLAP Cube Explorer — ลูกบาศก์ข้อมูลที่จับต้องได้ | W3–W4 | [[Sim-02-OLAP-Cube-Explorer]] |
| ⚖️ Bias Lab · 🌫️ Fuzzy Playground · 🏁 Signal-to-Action Race | W5–W15 | 🕓 กำลังพัฒนา |

---
> [!info] ที่มาของเนื้อหา
> โครงสร้างรายวิชานี้สังเคราะห์จากรายงานวิจัย *"หลักการ สถาปัตยกรรม และการประยุกต์ใช้ระบบสนับสนุนการตัดสินใจในยุคปัญญาประดิษฐ์และระบบธุรกิจอัจฉริยะ"* ประกอบกับ syllabus สากล (Lund INFC35, GMU SYST542, JHU 635.627, FUE IS433) และตำรา Sharda, Delen & Turban — ดู [[Reading-List]]
