# %% [markdown]
# # 🔁 Lab W3-3 — ETL Pipeline ที่ทนต่อความจริง
#
# **สัปดาห์ที่ 3 — Data Management & Data Warehouse**
#
# ใช้คู่กับสื่อจำลอง **ETL Pipeline Sim** (`/sims/etl-pipeline`)
#
# ## สิ่งที่จะได้เรียนรู้
# 1. เขียน **incremental load** ที่เป็น **idempotent** — รันซ้ำแล้วผลไม่เปลี่ยน
# 2. ตรวจจับ **schema drift** อัตโนมัติแทนที่จะรู้ตัวตอนรายงานผิด
# 3. จัดการ **late-arriving data** ด้วยการพาร์ทิชันตามวันที่เกิดเหตุการณ์จริง
#
# ## ข้อมูล
# แฟ้มรายวัน 30 ไฟล์ เดือนกันยายน 2025 — มีเหตุการณ์ 4 อย่างที่ไม่มีใครแจ้งล่วงหน้า

# %%
import pandas as pd

BASE = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
        "master/datasets/week03/daily_batches/")
DAYS = pd.date_range("2025-09-01", "2025-09-30").strftime("%Y-%m-%d").tolist()

files = {}
for d in DAYS:
    try:
        files[d] = pd.read_csv(BASE + f"batch_{d}.csv")
    except pd.errors.EmptyDataError:
        files[d] = pd.DataFrame()

print(f"โหลดแฟ้ม {len(files)} ไฟล์")
for d in ["2025-09-01", "2025-09-11", "2025-09-12", "2025-09-27"]:
    print(f"  {d}: {len(files[d]):>3} แถว | คอลัมน์ = {list(files[d].columns)}")

# %% [markdown]
# > **สังเกตตั้งแต่ตอนนี้** แฟ้มวันที่ 12 มีคอลัมน์ไม่เหมือนวันที่ 11
# > ในระบบจริงจะไม่มีใครมาบอก — ท่อข้อมูลต้องตรวจเจอเอง

# %% [task]
# ### 🧑‍💻 งานที่ 1 — ตรวจจับ schema drift
# เขียนโค้ดที่เดินผ่านทุกแฟ้มแล้วรายงานว่า
# 1. วันใดที่ชุดคอลัมน์เปลี่ยนไปจากวันก่อนหน้า
# 2. คอลัมน์ใดหายไป และคอลัมน์ใดเพิ่มเข้ามา
# 3. วันใดที่แฟ้มว่าง (ต้องแยกให้ออกจาก "ท่อข้อมูลล้มเหลว")

# %% [solution]
prev_cols = None
for d in DAYS:
    cols = set(files[d].columns)
    if not cols:
        print(f"{d}  ⚠️  แฟ้มว่าง — ไม่มีข้อมูล แต่ไฟล์มาถึงแล้ว (ไม่ใช่ความล้มเหลว)")
        continue
    if prev_cols is not None and cols != prev_cols:
        print(f"{d}  🚨 SCHEMA DRIFT")
        print(f"     หายไป : {sorted(prev_cols - cols)}")
        print(f"     เพิ่ม  : {sorted(cols - prev_cols)}")
    prev_cols = cols

# %% [markdown]
# ## ส่วนที่ 2 — ท่อข้อมูลที่รับมือ schema drift ได้

# %% [task]
# ### 🧑‍💻 งานที่ 2
# เขียนฟังก์ชัน `normalize(df)` ที่จับคู่ชื่อคอลัมน์ให้เป็นมาตรฐานเดียว
# โดยรองรับทั้งสองรุ่นของแฟ้ม (`amount` และ `net_amount`)
#
# **ข้อควรระวัง** ห้ามใช้วิธี "ถ้าไม่มีคอลัมน์ก็ให้เป็น 0" เด็ดขาด —
# นั่นคือความล้มเหลวที่เงียบที่สุด งานจะไม่ล้ม แต่ยอดเงินหายไปทั้งเดือน
# ให้ `raise` ออกมาแทนถ้าจับคู่ไม่ได้

# %% [solution]
COLUMN_MAP = {"net_amount": "amount"}          # ชื่อใหม่ → ชื่อมาตรฐาน
REQUIRED = {"txn_id", "txn_date", "sku", "store_id", "quantity", "amount"}


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    out = df.rename(columns=COLUMN_MAP)
    missing = REQUIRED - set(out.columns)
    if missing:
        # ล้มให้ดังไว้ก่อน ดีกว่าปล่อยข้อมูลผิดเข้าคลัง
        raise ValueError(f"จับคู่คอลัมน์ไม่ได้ ขาด: {sorted(missing)}")
    return out[list(REQUIRED)]


ok = 0
for d in DAYS:
    if files[d].empty:
        continue
    normalize(files[d])
    ok += 1
print(f"✓ ทำให้เป็นมาตรฐานได้ {ok} แฟ้ม โดยไม่มีคอลัมน์ใดหายไปเงียบๆ")

# %% [markdown]
# ## ส่วนที่ 3 — Incremental load ที่ idempotent
#
# นิยาม: รันท่อข้อมูลชุดเดิมซ้ำกี่ครั้งก็ได้ ผลลัพธ์ในคลังต้องเหมือนเดิมทุกครั้ง

# %% [task]
# ### 🧑‍💻 งานที่ 3
# เขียนฟังก์ชัน `load(warehouse, batch, load_date, partition_by)` ที่
# * ไม่โหลดแถวที่ `txn_id` มีอยู่แล้ว (idempotency)
# * รองรับการพาร์ทิชันสองแบบ: ตามวันที่ของแฟ้ม หรือ ตามวันที่เกิดธุรกรรมจริง
#
# แล้วรันครบ 30 วัน 2 รอบ พิสูจน์ว่ารอบที่สองไม่เพิ่มแถวใดเลย
#
# *เป้าหมาย: 1,549 แถว · ยอดรวม 1,822,503.00 บาท*

# %% [solution]
def load(warehouse: pd.DataFrame, batch: pd.DataFrame,
         load_date: str, partition_by: str = "txn_date") -> pd.DataFrame:
    if batch.empty:
        return warehouse
    b = normalize(batch).copy()
    b["partition_date"] = b.txn_date if partition_by == "txn_date" else load_date
    b["loaded_on"] = load_date
    if len(warehouse):
        b = b[~b.txn_id.isin(warehouse.txn_id)]
    return pd.concat([warehouse, b], ignore_index=True)


def run_pipeline(partition_by="txn_date", passes=1) -> pd.DataFrame:
    wh = pd.DataFrame(columns=list(REQUIRED) + ["partition_date", "loaded_on"])
    for _ in range(passes):
        for d in DAYS:
            wh = load(wh, files[d], d, partition_by)
    return wh


wh1 = run_pipeline(passes=1)
wh2 = run_pipeline(passes=2)

print(f"รันรอบเดียว : {len(wh1):>6,} แถว · ยอดรวม {wh1.amount.sum():>14,.2f}")
print(f"รันสองรอบ   : {len(wh2):>6,} แถว · ยอดรวม {wh2.amount.sum():>14,.2f}")
print(f"\nidempotent : {'ผ่าน ✓' if len(wh1) == len(wh2) else 'ไม่ผ่าน ✗'}")

# %% [markdown]
# ## ส่วนที่ 4 — Late-arriving data
#
# แฟ้มวันที่ 18 มีธุรกรรมของวันที่ 16 และ 17 ปนมาด้วย
# การเลือกวิธีพาร์ทิชันจะตัดสินว่า **รายงานย้อนหลังถูกหรือผิด**

# %% [task]
# ### 🧑‍💻 งานที่ 4
# 1. หาว่ามีกี่แถวที่ `txn_date` ไม่ตรงกับวันที่ของแฟ้มที่บรรจุมัน
# 2. เปรียบเทียบยอดขายของวันที่ 16, 17 และ 18 ระหว่างการพาร์ทิชันสองแบบ
# 3. ตอบว่าถ้าผู้บริหารดูรายงานวันที่ 17 ในเช้าวันที่ 18 แล้วมาดูซ้ำอีกครั้งในวันที่ 19
#    ตัวเลขควรเปลี่ยนหรือไม่ และควรสื่อสารกับผู้ใช้อย่างไร

# %% [solution]
by_file = run_pipeline(partition_by="file_date")
by_txn = run_pipeline(partition_by="txn_date")

misdated = (by_file.partition_date != by_file.txn_date).sum()
print(f"แถวที่ถูกบันทึกผิดวันเมื่อพาร์ทิชันตามวันที่ของแฟ้ม : {misdated:,}\n")

focus = ["2025-09-16", "2025-09-17", "2025-09-18"]
cmp = pd.DataFrame({
    "พาร์ทิชันตามวันที่แฟ้ม": by_file[by_file.partition_date.isin(focus)]
        .groupby("partition_date").amount.sum(),
    "พาร์ทิชันตามวันที่ธุรกรรม": by_txn[by_txn.partition_date.isin(focus)]
        .groupby("partition_date").amount.sum(),
}).round(2)
cmp["ส่วนต่าง"] = (cmp.iloc[:, 1] - cmp.iloc[:, 0]).round(2)
print(cmp.to_string())
print("\n→ รายงานวันที่ 16 และ 17 จะต่ำกว่าความจริงถ้าพาร์ทิชันตามวันที่ของแฟ้ม")
print("→ และยอดของวันที่ 18 จะสูงเกินจริง เพราะกลืนข้อมูลของสองวันก่อนหน้าเข้าไป")

# %% [markdown]
# ## ส่วนที่ 5 — ตาราง etl_audit

# %% [task]
# ### 🧑‍💻 งานที่ 5
# สร้าง `etl_audit` ที่บันทึกรายวัน: แถวในแฟ้ม · แถวที่โหลดเข้า · แถวที่ข้าม ·
# ยอดเงินของวันนั้น · สถานะ (`ok` / `empty` / `schema_drift` / `duplicate_file`)
#
# แล้วใช้ตารางนี้ตอบว่า **วันใดที่ควรมีการแจ้งเตือนไปยังทีมข้อมูล**

# %% [solution]
audit_rows = []
wh = pd.DataFrame(columns=list(REQUIRED) + ["partition_date", "loaded_on"])
prev_cols = None

for d in DAYS:
    batch = files[d]
    status = "ok"
    if batch.empty:
        status = "empty"
        audit_rows.append({"load_date": d, "file_rows": 0, "loaded": 0,
                           "skipped": 0, "amount": 0.0, "status": status})
        continue
    cols = set(batch.columns)
    if prev_cols is not None and cols != prev_cols:
        status = "schema_drift"
    prev_cols = cols

    before = len(wh)
    wh = load(wh, batch, d, "txn_date")
    loaded = len(wh) - before
    skipped = len(batch) - loaded
    if skipped == len(batch) and len(batch) > 0:
        status = "duplicate_file"
    amount = wh.tail(loaded).amount.sum() if loaded else 0.0
    audit_rows.append({"load_date": d, "file_rows": len(batch), "loaded": loaded,
                       "skipped": skipped, "amount": round(amount, 2), "status": status})

etl_audit = pd.DataFrame(audit_rows)
print(etl_audit.to_string(index=False))

print("\n=== วันที่ควรแจ้งเตือนทีมข้อมูล ===")
alerts = etl_audit[etl_audit.status != "ok"]
print(alerts.to_string(index=False))
print(f"\nสรุป: {len(wh):,} แถว · ยอดรวม {wh.amount.sum():,.2f} บาท")

# %% [markdown]
# > **ประเด็นสำคัญที่สุดของ Lab นี้**
# >
# > ในทั้ง 4 เหตุการณ์ ท่อข้อมูลรายงานว่า **ทำงานสำเร็จทุกวัน** ไม่มี exception ใดถูกโยนออกมา
# > ความเสียหายทั้งหมดเกิดขึ้นเงียบๆ และจะถูกค้นพบก็ต่อเมื่อมีคนสังเกตว่าตัวเลขแปลก
# > ซึ่งอาจเป็นเวลาหลายสัปดาห์ให้หลัง
# >
# > นี่คือเหตุผลที่ **data observability** (etl_audit, freshness check, row-count anomaly)
# > เป็นองค์ประกอบบังคับของสถาปัตยกรรมคลังข้อมูล ไม่ใช่ของแถม

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — ตรวจจับ schema drift และแฟ้มว่างได้ | 2 |
# | งานที่ 2 — normalize ที่ล้มดังเมื่อจับคู่ไม่ได้ | 2 |
# | งานที่ 3 — incremental load ที่พิสูจน์ idempotency ได้ | 3 |
# | งานที่ 4 — วิเคราะห์ late-arriving data และผลต่อรายงาน | 3 |
# | งานที่ 5 — etl_audit และการระบุวันที่ต้องแจ้งเตือน | 2 |
# | **รวม** | **12** |
#
# > 💡 ผลลัพธ์ที่ถูกต้อง: **1,549 แถว** · ยอดรวม **1,822,503.00 บาท**
