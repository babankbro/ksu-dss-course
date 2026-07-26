---
title: "เครื่องมือและการติดตั้ง"
tags: [admin, tools, setup]
---

# 🛠️ เครื่องมือและการติดตั้ง

## 1. Stack หลักของรายวิชา

| ชั้นของ DSS | เครื่องมือ | ใช้ในสัปดาห์ |
|---|---|---|
| Data Management | PostgreSQL / DuckDB, Pandas, SQLAlchemy | W3–W6 |
| OLAP | DuckDB + Cube logic, Power BI Model view | W4 |
| Data Mining / ML | scikit-learn, mlxtend (Apriori) | W5, W6, W9 |
| Visualization / UI | Power BI Desktop (หรือ Tableau Public), Streamlit | W7, W15 |
| Optimization | PuLP หรือ OR-Tools, SciPy | W10 |
| Simulation / Heuristics | NumPy, DEAP (GA), SimPy | W11 |
| Fuzzy Logic | scikit-fuzzy | W12 |
| Bayesian Networks | pgmpy | W13 |
| Rules / DMN | Camunda DMN Simulator (เว็บ) หรือ Drools/KIE, `pyDMNrules` | W14 |
| Deployment | FastAPI, Docker Desktop | W15 |

## 2. การติดตั้งสภาพแวดล้อม Python

```bash
python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
```

`requirements.txt` ของรายวิชา:

```
pandas
numpy
scipy
scikit-learn
mlxtend
matplotlib
seaborn
plotly
duckdb
sqlalchemy
psycopg2-binary
pulp
ortools
simpy
deap
scikit-fuzzy
pgmpy
streamlit
fastapi
uvicorn
jupyterlab
```

> [!tip] เวอร์ชัน Python
> ใช้ Python 3.11 — `scikit-fuzzy` และ `pgmpy` บางเวอร์ชันยังมีปัญหากับ 3.13

## 3. เครื่องมือที่ไม่ใช่ Python
- **Power BI Desktop** — ฟรีสำหรับ Windows (ใช้ใน [[Lab-06-Executive-Dashboard]] และ [[Individual-Assignment]]) หากใช้ macOS ให้ใช้ Tableau Public หรือ Metabase แทน
- **Camunda DMN Simulator** — ทดสอบ Decision Table ผ่านเว็บได้ทันที ไม่ต้องติดตั้ง (ใช้ใน [[Lab-12-DMN-Decision-Table]])
- **Docker Desktop** — สำหรับ [[Lab-13-Deploy-DSS-as-API]]
- **Git + GitHub** — ทุกกลุ่มต้องมี repo สำหรับ [[Group-Project]] (ผู้สอนใช้ commit history ประกอบการประเมินการมีส่วนร่วม)

## 4. ชุดข้อมูลกลางของรายวิชา (Course Datasets)

| ชุดข้อมูล | ใช้กับ | ลักษณะ |
|---|---|---|
| **Retail Sales** (ยอดขาย 3 ปี, ~500k แถว) | W3, W4, W7 | ข้อมูลธุรกรรม เหมาะกับ Star Schema และ OLAP |
| **Bank Marketing / Credit Default** | W5, W9 | Classification, imbalanced classes |
| **Online Retail (Market Basket)** | W6 | Association Rules |
| **Hospital Readmission** | W13 | Bayesian Network, missing data |
| **Logistics Delivery Records** | W10, W11 | Optimization, VRP, Monte Carlo |

> ผู้สอนเตรียมไฟล์ไว้ใน `/datasets` ของรายวิชา — นักศึกษาห้ามอัปโหลดชุดข้อมูลที่มีข้อมูลส่วนบุคคลจริงขึ้น repo สาธารณะ

## 5. โครงสร้าง repo มาตรฐานของโครงงาน

```
project-<team-name>/
├── data/           # raw / processed (ห้าม commit ไฟล์ใหญ่ ใช้ .gitignore)
├── notebooks/      # การสำรวจข้อมูลและทดลองโมเดล
├── src/
│   ├── data/       # ETL layer
│   ├── models/     # model management layer
│   ├── rules/      # knowledge / DMN layer
│   └── api/        # FastAPI service
├── app/            # Streamlit / dashboard (UI layer)
├── docs/           # รายงาน + สถาปัตยกรรม
├── requirements.txt
└── README.md
```

โครงสร้างนี้สะท้อนระบบย่อยทั้ง 4 ใน [[DSS-Architecture-Subsystems]] โดยตรง — เป็นเจตนาเชิงการสอน ไม่ใช่แค่ระเบียบไฟล์

---
**ที่เกี่ยวข้อง:** [[Home]] · [[Lab-Index]] · [[Group-Project]]
