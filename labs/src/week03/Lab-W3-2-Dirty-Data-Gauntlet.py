# %% [markdown]
# # 🧼 Lab W3-2 — Dirty Data Gauntlet
#
# **สัปดาห์ที่ 3 — Data Management & Data Warehouse**
#
# ใช้คู่กับสื่อจำลอง **Dirty Data Gauntlet** (`/sims/dirty-data`)
#
# ## สิ่งที่จะได้เรียนรู้
# 1. เปลี่ยนความคาดหวังด้านคุณภาพข้อมูลให้เป็น **กฎที่ทดสอบได้** ครบ 6 มิติ
# 2. แยกแถวที่ไม่ผ่านไปตาราง `etl_rejects` พร้อมเหตุผล แทนการทิ้งเงียบๆ
# 3. สร้าง `etl_audit` และพิสูจน์การ **กระทบยอด (reconciliation)**
#
# ## ข้อมูล
# `sales_raw_dirty.csv` — ยอดขายจาก 3 ระบบต้นทาง (POS · Mobile App · Marketplace)

# %%
import pandas as pd

BASE = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
        "master/datasets/week03/")
raw = pd.read_csv(BASE + "sales_raw_dirty.csv")
ref_product = pd.read_csv(BASE + "ref_product.csv")
ref_store = pd.read_csv(BASE + "ref_store.csv")

print(f"แถวข้อมูลดิบ : {len(raw):,}")
print(f"ระบบต้นทาง   : {raw.source_system.unique().tolist()}")
raw.head()

# %% [markdown]
# ## ส่วนที่ 1 — Data Profiling ก่อนแตะข้อมูล
#
# กฎเหล็กของงานคลังข้อมูล: **ห้ามแก้ข้อมูลก่อนเข้าใจว่าทำไมมันถึงเป็นแบบนั้น**

# %%
print("=== รูปแบบรหัสสินค้าที่พบ แยกตามระบบต้นทาง ===")
print(pd.crosstab(raw.source_system, raw.sku.str.match(r"^P-\d{3}$")).to_string())
print("\n=== ตัวอย่างค่า sku ที่ไม่ตรงมาตรฐาน ===")
print(raw.loc[~raw.sku.str.match(r"^P-\d{3}$"), ["source_system", "sku"]].drop_duplicates().head(10).to_string(index=False))
print("\n=== รูปแบบวันที่ ===")
print(pd.crosstab(raw.source_system, raw.txn_date.str.contains("/")).to_string())

# %% [task]
# ### 🧑‍💻 งานที่ 1 — สำรวจให้ครบ
# ตรวจและรายงานจำนวนของแต่ละอาการต่อไปนี้ **ก่อน** ทำความสะอาด
#
# 1. `txn_id` ซ้ำ
# 2. `customer_id` ที่ว่าง หรือเป็น `NULL` / `N/A`
# 3. `store_id` ที่มีช่องว่างนำหน้า-ต่อท้าย หรือเป็นตัวพิมพ์เล็ก
# 4. แถวที่ `net_amount` ไม่ตรงกับ `quantity × unit_price − discount`
# 5. `store_id` ที่ไม่มีใน `ref_store`
# 6. รายการคืนสินค้า — มีกี่วิธีบันทึกในไฟล์นี้

# %% [solution]
print(f"1. txn_id ซ้ำ                : {raw.txn_id.duplicated().sum():>6,}")

cust_missing = raw.customer_id.isna() | raw.customer_id.astype(str).str.strip().isin(["", "NULL", "N/A"])
print(f"2. ลูกค้าไม่ระบุ             : {cust_missing.sum():>6,}")

store_dirty = raw.store_id != raw.store_id.str.strip().str.upper()
print(f"3. store_id รูปแบบไม่สะอาด   : {store_dirty.sum():>6,}")

expected = (raw.quantity.abs() * raw.unit_price - raw.discount).round(2)
mismatch = (raw.net_amount.abs() - expected).abs() > 0.011
print(f"4. net_amount ผิดสูตร        : {mismatch.sum():>6,}")

known_stores = set(ref_store.store_id)
orphan = ~raw.store_id.str.strip().str.upper().isin(known_stores)
print(f"5. สาขาที่ไม่มีในตารางอ้างอิง : {orphan.sum():>6,}")

neg_qty = (raw.quantity < 0).sum()
ret_type = (raw.txn_type == "RETURN").sum()
print(f"6. คืนสินค้า — จำนวนติดลบ {neg_qty:,} แถว · txn_type=RETURN {ret_type:,} แถว")
print("   → มี 2 วิธีบันทึกในไฟล์เดียวกัน ต้องรวมความหมายให้ตรงกันก่อนคำนวณ")

# %% [markdown]
# ## ส่วนที่ 2 — เขียนกฎคุณภาพให้ครบ 6 มิติ
#
# | มิติ | คำถามที่กฎต้องตอบ |
# |---|---|
# | Completeness | ค่าที่จำเป็นครบหรือไม่ |
# | Uniqueness | มีการนับซ้ำหรือไม่ |
# | Validity | อยู่ในรูปแบบและช่วงที่ยอมรับได้หรือไม่ |
# | Accuracy | ตรงกับสูตรหรือแหล่งอ้างอิงหรือไม่ |
# | Consistency | ระบบต้นทางต่างกันให้ความหมายเดียวกันหรือไม่ |
# | Referential integrity | join กับ dimension ได้ครบหรือไม่ |

# %% [task]
# ### 🧑‍💻 งานที่ 2 — สร้างท่อทำความสะอาด
# เขียนฟังก์ชัน `clean(raw)` ที่คืนค่าสามอย่าง: `fact`, `rejects`, `audit`
#
# ข้อกำหนด
# * ทุกแถวที่ถูกปฏิเสธต้องอยู่ใน `rejects` พร้อมคอลัมน์ `reject_reason` — **ห้ามทิ้งเงียบๆ**
# * ลูกค้าไม่ระบุ **ไม่ใช่** เหตุผลให้ปฏิเสธ ให้ใช้ unknown member (`C-UNKNOWN`) แทน
#   เพราะยอดขายยังเป็นยอดขายจริง
# * `audit` ต้องบันทึกจำนวนแถวเข้า-ออกของทุกขั้นตอน
#
# *เป้าหมาย: ยอดขายสุทธิสุดท้าย = 3,814,298.55 บาท จาก 3,317 แถว*

# %% [solution]
def clean(raw: pd.DataFrame):
    audit = []
    rejects = []
    df = raw.copy()
    audit.append(("00_extract", len(df), 0))

    def reject(mask: pd.Series, reason: str):
        nonlocal df
        bad = df[mask].copy()
        if len(bad):
            bad["reject_reason"] = reason
            rejects.append(bad)
        df = df[~mask].copy()
        audit.append((reason, len(df), int(mask.sum())))

    # --- Consistency: ทำให้รูปแบบเป็นมาตรฐานเดียวกันก่อนตรวจอย่างอื่น ---
    df["store_id"] = df.store_id.astype(str).str.strip().str.upper()
    df["sku"] = (df.sku.astype(str).str.strip().str.upper()
                   .str.replace(r"^P?-?(\d{3})$", r"P-\1", regex=True))

    # --- Validity: วันที่รองรับสองรูปแบบ ---
    d1 = pd.to_datetime(df.txn_date, format="%Y-%m-%d", errors="coerce")
    d2 = pd.to_datetime(df.txn_date, format="%d/%m/%Y", errors="coerce")
    df["txn_date"] = d1.fillna(d2)
    reject(df.txn_date.isna(), "10_invalid_date")

    # --- Uniqueness: ตัดแถวซ้ำจากการ retry ---
    reject(df.txn_id.duplicated(), "20_duplicate_txn_id")

    # --- Referential integrity ---
    reject(~df.store_id.isin(ref_store.store_id), "30_unknown_store")
    reject(~df.sku.isin(ref_product.sku), "31_unknown_sku")

    # --- Accuracy: ตรวจสูตรคำนวณ ---
    exp = (df.quantity.abs() * df.unit_price - df.discount).round(2)
    reject((df.net_amount.abs() - exp).abs() > 0.011, "40_net_amount_mismatch")

    # --- Completeness: ลูกค้าไม่ระบุ → unknown member ไม่ใช่ปฏิเสธ ---
    miss = df.customer_id.isna() | df.customer_id.astype(str).str.strip().isin(["", "NULL", "N/A"])
    df.loc[miss, "customer_id"] = "C-UNKNOWN"
    audit.append(("50_unknown_customer_member", len(df), int(miss.sum())))

    # --- Consistency: รวมความหมายของการคืนสินค้า ---
    is_return = (df.txn_type == "RETURN") | (df.quantity < 0)
    df["net_amount"] = df.net_amount.abs().where(~is_return, -df.net_amount.abs())
    df["quantity"] = df.quantity.abs().where(~is_return, -df.quantity.abs())
    df["txn_type"] = "RETURN".join([]) if False else df.txn_type.where(~is_return, "RETURN")
    audit.append(("60_unify_returns", len(df), int(is_return.sum())))

    rej = pd.concat(rejects) if rejects else pd.DataFrame(columns=list(raw.columns) + ["reject_reason"])
    audit_df = pd.DataFrame(audit, columns=["step", "rows_out", "rows_affected"])
    return df, rej, audit_df


fact, rejects, audit = clean(raw)

print(audit.to_string(index=False))
print(f"\nยอดขายสุทธิ : {fact.net_amount.sum():,.2f} บาท")
print(f"แถวใน fact  : {len(fact):,}")
print(f"แถวที่ถูกปฏิเสธ : {len(rejects):,}")

# %% [markdown]
# ## ส่วนที่ 3 — การกระทบยอดและรายงานเหตุผลการปฏิเสธ

# %% [task]
# ### 🧑‍💻 งานที่ 3
# 1. สรุปจำนวนแถวใน `rejects` แยกตาม `reject_reason` และตาม `source_system`
# 2. ตรวจว่า `แถวดิบ = แถวใน fact + แถวที่ถูกปฏิเสธ` หรือไม่ (สมการต้องสมดุลเสมอ)
# 3. คำนวณยอดขายแยกตามระบบต้นทาง แล้วตอบว่าระบบใดได้รับผลกระทบจากการทำความสะอาดมากที่สุด

# %% [solution]
print("=== เหตุผลการปฏิเสธ ===")
print(rejects.reject_reason.value_counts().to_string())
print("\n=== แยกตามระบบต้นทาง ===")
print(pd.crosstab(rejects.source_system, rejects.reject_reason).to_string())

balance_ok = len(raw) == len(fact) + len(rejects)
print(f"\nสมการสมดุล: {len(raw):,} = {len(fact):,} + {len(rejects):,} → {'ผ่าน ✓' if balance_ok else 'ไม่ผ่าน ✗'}")

print("\n=== ยอดขายแยกตามระบบต้นทาง ===")
by_src = fact.groupby("source_system").agg(
    rows=("txn_id", "size"), net_sales=("net_amount", "sum")).round(2)
by_src["raw_rows"] = raw.groupby("source_system").size()
by_src["dropped_pct"] = ((1 - by_src.rows / by_src.raw_rows) * 100).round(1)
print(by_src.to_string())

# %% [markdown]
# > **คำถามสำคัญที่ต้องตอบในใบงาน**
# >
# > ถ้าคุณ **ลืม** เขียนกฎแปลงรูปแบบวันที่ ข้อมูลจาก Marketplace จะถูกปฏิเสธทั้งหมด
# > รายงานยอดขายยังออกได้ตามปกติ ไม่มี error ใดๆ แต่ขาดไปทั้งช่องทางการขาย
# >
# > จงอธิบายว่ากลไกใดในสถาปัตยกรรมคลังข้อมูลที่จะจับความผิดพลาดแบบนี้ได้
# > (คำใบ้: ทดลองปิดกฎข้อนี้ในสื่อจำลองแล้วดูว่าตัวเลขใดเปลี่ยน)

# %% [task]
# ### 🧑‍💻 งานที่ 4 — ทดลองปิดกฎทีละข้อ
# เขียนโค้ดที่รัน `clean()` ซ้ำโดย **ปิดกฎทีละข้อ** แล้วสร้างตารางเปรียบเทียบว่า
# การขาดกฎแต่ละข้อทำให้ยอดขายสุทธิเพี้ยนไปกี่เปอร์เซ็นต์
#
# เรียงลำดับกฎจาก "กระทบตัวเลขมากที่สุด" ไป "น้อยที่สุด"
# แล้วตอบว่าถ้ามีเวลาเขียนได้แค่ 3 กฎ ควรเลือกข้อใด เพราะเหตุใด

# %% [solution]
TRUTH = fact.net_amount.sum()

def clean_without(skip: str) -> float:
    df = raw.copy()
    df["store_id"] = df.store_id.astype(str).str.strip().str.upper()
    if skip != "sku":
        df["sku"] = (df.sku.astype(str).str.strip().str.upper()
                       .str.replace(r"^P?-?(\d{3})$", r"P-\1", regex=True))
    if skip != "date":
        d1 = pd.to_datetime(df.txn_date, format="%Y-%m-%d", errors="coerce")
        d2 = pd.to_datetime(df.txn_date, format="%d/%m/%Y", errors="coerce")
        df["txn_date"] = d1.fillna(d2)
    else:
        df["txn_date"] = pd.to_datetime(df.txn_date, format="%Y-%m-%d", errors="coerce")
    df = df[df.txn_date.notna()]
    if skip != "dedup":
        df = df[~df.txn_id.duplicated()]
    if skip != "store":
        df = df[df.store_id.isin(ref_store.store_id)]
    if skip != "sku":
        df = df[df.sku.isin(ref_product.sku)]
    if skip != "netfix":
        exp = (df.quantity.abs() * df.unit_price - df.discount).round(2)
        df = df[(df.net_amount.abs() - exp).abs() <= 0.011]
    if skip != "returns":
        is_ret = (df.txn_type == "RETURN") | (df.quantity < 0)
        df["net_amount"] = df.net_amount.abs().where(~is_ret, -df.net_amount.abs())
    return df.net_amount.sum()


rows = []
for rule in ["date", "dedup", "returns", "netfix", "store", "sku"]:
    v = clean_without(rule)
    rows.append({"กฎที่ขาดไป": rule, "ยอดที่ได้": round(v, 2),
                 "คลาดเคลื่อน %": round((v / TRUTH - 1) * 100, 2)})

impact = pd.DataFrame(rows).sort_values("คลาดเคลื่อน %", key=abs, ascending=False)
print(f"ยอดที่ถูกต้อง = {TRUTH:,.2f} บาท\n")
print(impact.to_string(index=False))

# %% [markdown]
# > **กับดักในการอ่านตารางข้างบน**
# >
# > กฎ `sku` แสดงความคลาดเคลื่อน **0.00%** — ถ้าอ่านผิวเผินจะสรุปว่า "กฎนี้ไม่สำคัญ"
# > ซึ่งเป็นข้อสรุปที่ผิดอย่างอันตราย
# >
# > การไม่รวมรหัสสินค้าให้เป็นมาตรฐาน **ไม่กระทบยอดรวม** เพราะเงินยังอยู่ครบ
# > แต่มันทำลาย **ความสามารถในการวิเคราะห์ระดับสินค้า** ทั้งหมด:
# > `P-101`, `P101` และ `101` จะกลายเป็นสินค้าสามชนิดใน `dim_product`
# > รายงาน "สินค้าขายดี 10 อันดับ" จะผิด และ join กับตารางสินค้าจะขาดหายไปเงียบๆ
# >
# > **บทเรียน:** อย่าจัดลำดับความสำคัญของกฎคุณภาพด้วยผลกระทบต่อยอดรวมเพียงอย่างเดียว
# > ต้องดูด้วยว่ากฎนั้นปกป้อง **คำถามธุรกิจ** ข้อใด

# %% [task]
# ### 🧑‍💻 งานที่ 5 — พิสูจน์ข้อสังเกตข้างบน
# เขียนโค้ดเปรียบเทียบรายงาน "ยอดขาย 5 อันดับแรกตามรหัสสินค้า"
# ระหว่างข้อมูลที่ทำ normalize รหัสสินค้าแล้ว กับข้อมูลที่ไม่ได้ทำ
# แล้วอธิบายว่าผู้บริหารที่ดูรายงานฉบับหลังจะเข้าใจผิดอย่างไร

# %% [solution]
no_norm = raw.drop_duplicates("txn_id").copy()
top_bad = (no_norm.groupby("sku").net_amount.sum()
           .sort_values(ascending=False).head(8).round(2))

normed = fact.copy()
top_good = (normed.groupby("sku").net_amount.sum()
            .sort_values(ascending=False).head(8).round(2))

print("=== ถ้าไม่ normalize รหัสสินค้า ===")
print(top_bad.to_string())
print(f"\nจำนวนรหัสสินค้าที่ระบบมองเห็น : {no_norm.sku.nunique()} รหัส")
print("\n=== หลัง normalize ===")
print(top_good.to_string())
print(f"\nจำนวนรหัสสินค้าที่แท้จริง     : {normed.sku.nunique()} รหัส")
print("\n→ ยอดรวมเท่ากัน แต่สินค้าชนิดเดียวถูกกระจายออกเป็นหลายรหัส")
print("→ อันดับสินค้าขายดีจึงผิดทั้งตาราง")

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — profiling ครบ 6 อาการ | 2 |
# | งานที่ 2 — ท่อทำความสะอาดที่มี rejects และ audit ครบ | 4 |
# | งานที่ 3 — กระทบยอดผ่านและวิเคราะห์ผลกระทบรายระบบต้นทาง | 3 |
# | งานที่ 4 — จัดอันดับความสำคัญของกฎพร้อมเหตุผล | 2 |
# | งานที่ 5 — พิสูจน์ผลของการไม่ normalize รหัสสินค้า | 2 |
# | **รวม** | **13** |
#
# > 💡 ยอดขายสุทธิที่ถูกต้องคือ **3,814,298.55 บาท** จาก **3,317 แถว** —
# > ตรงกับตัวเลขบนสื่อจำลองเมื่อเปิดกฎครบทั้ง 8 ข้อ
