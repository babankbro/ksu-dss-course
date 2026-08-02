# %% [markdown]
# # 🔎 Lab W3-1 — Grain Detective
#
# **รายวิชาระบบสนับสนุนการตัดสินใจ · สัปดาห์ที่ 3 — Data Management & Data Warehouse**
#
# Lab นี้ใช้คู่กับสื่อจำลอง **Grain Detective** (`/sims/grain-detective`)
# ตัวเลขที่คุณคำนวณได้ในสมุดเล่มนี้ต้องตรงกับตัวเลขบนหน้าจอสื่อจำลองทุกหลัก
#
# ## สิ่งที่จะได้เรียนรู้
# 1. อธิบายได้ว่า **grain** ของ fact table คืออะไร และเหตุใดจึงเป็นการตัดสินใจที่ย้อนกลับยากที่สุด
# 2. ตรวจจับการ **นับซ้ำ (double counting)** ที่เกิดจากการเลือก grain ผิด
# 3. เขียน **grain contract** เป็นประโยคเดียวที่ทดสอบได้
#
# ## ข้อมูล
# `pos_receipt_lines.csv` — ไฟล์ส่งออกจากระบบ POS ที่มีข้อมูล **สามระดับปนกัน**

# %%
import pandas as pd

pd.set_option("display.float_format", lambda v: f"{v:,.2f}")

URL = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
       "master/datasets/week03/pos_receipt_lines.csv")
df = pd.read_csv(URL)

print(f"จำนวนแถวในไฟล์ดิบ : {len(df):,}")
print(f"จำนวนคอลัมน์      : {df.shape[1]}")
df.head(6)

# %% [markdown]
# ## ส่วนที่ 1 — สำรวจว่าไฟล์นี้มีกี่ระดับกันแน่
#
# ก่อนออกแบบอะไรทั้งสิ้น ต้องตอบให้ได้ก่อนว่า **หนึ่งแถวในไฟล์นี้แทนอะไร**

# %%
print("จำนวนค่าที่ไม่ซ้ำในแต่ละคีย์ที่เป็นไปได้")
print(f"  receipt_no เท่านั้น              : {df.receipt_no.nunique():,}")
print(f"  receipt_no + line_no             : {df.groupby(['receipt_no','line_no']).ngroups:,}")
print(f"  receipt_no + payment_seq         : {df.groupby(['receipt_no','payment_seq']).ngroups:,}")
print(f"  receipt_no + line_no + payment_seq: {df.groupby(['receipt_no','line_no','payment_seq']).ngroups:,}")
print(f"  จำนวนแถวจริงในไฟล์               : {len(df):,}")

# %% [markdown]
# > **สังเกต** ตัวเลขสุดท้ายเท่ากับบรรทัดก่อนหน้า แปลว่า grain ของ *ไฟล์* คือ
# > `receipt_no × line_no × payment_seq` — เป็นผลคูณไขว้ที่ระบบ POS สร้างขึ้นตอน export
# >
# > นี่คือ grain ที่ **ไม่มีความหมายทางธุรกิจ** เพราะไม่มีเหตุการณ์จริงใดในโลกที่เกิดขึ้น
# > "หนึ่งครั้งต่อหนึ่งคู่ของรายการสินค้าและวิธีชำระเงิน"

# %% [task]
# ### 🧑‍💻 งานที่ 1
# คำนวณยอดขายสุทธิรวมสองแบบแล้วเปรียบเทียบ
#
# 1. `total_raw` — บวก `line_net_amount` จากไฟล์ดิบตรงๆ
# 2. `total_line` — บวกหลังยุบให้เหลือหนึ่งแถวต่อ `(receipt_no, line_no)`
#
# แล้วพิมพ์ส่วนต่างออกมาเป็นเปอร์เซ็นต์
#
# *เฉลยที่ถูกต้อง: ยอดที่ถูกคือ 23,175,222.85 บาท และไฟล์ดิบให้ตัวเลขสูงเกินจริง 12.96%*

# %% [solution]
total_raw = df.line_net_amount.sum()

line = df.drop_duplicates(["receipt_no", "line_no"])
total_line = line.line_net_amount.sum()

print(f"ยอดจากไฟล์ดิบ (grain ผิด) : {total_raw:>16,.2f} บาท")
print(f"ยอดที่ถูกต้อง (line grain) : {total_line:>16,.2f} บาท")
print(f"สูงเกินจริง               : {(total_raw/total_line - 1)*100:>16.2f} %")

# %% [markdown]
# ## ส่วนที่ 2 — หาต้นตอของการนับซ้ำ
#
# การนับซ้ำไม่ได้เกิดกับทุกใบเสร็จ ให้หาว่าเกิดกับใบเสร็จแบบไหน

# %% [task]
# ### 🧑‍💻 งานที่ 2
# หาว่าใบเสร็จที่ทำให้เกิดการนับซ้ำมีลักษณะอย่างไร
#
# แนวทาง: นับจำนวน `payment_seq` ที่ไม่ซ้ำของแต่ละใบเสร็จ แล้วเทียบจำนวนแถวในไฟล์
# ของใบเสร็จที่มีวิธีชำระเดียว กับใบเสร็จที่มีสองวิธี

# %% [solution]
pay_per_receipt = df.groupby("receipt_no").payment_seq.nunique()
line_per_receipt = df.groupby("receipt_no").line_no.nunique()
rows_per_receipt = df.groupby("receipt_no").size()

summary = pd.DataFrame({
    "n_payments": pay_per_receipt,
    "n_lines": line_per_receipt,
    "n_rows_in_file": rows_per_receipt,
})
summary["expected_rows"] = summary.n_payments * summary.n_lines

print("ตรวจว่าจำนวนแถวเท่ากับผลคูณไขว้จริงหรือไม่:",
      (summary.n_rows_in_file == summary.expected_rows).all())
print()
print("จำนวนใบเสร็จแยกตามจำนวนวิธีชำระเงิน:")
print(summary.n_payments.value_counts().sort_index().to_string())
print(f"\nใบเสร็จที่ชำระมากกว่า 1 วิธี = {(summary.n_payments > 1).sum():,} ใบ")
print("→ เฉพาะใบเสร็จกลุ่มนี้เท่านั้นที่ทำให้รายการสินค้าถูกนับซ้ำ")

# %% [markdown]
# ## ส่วนที่ 3 — คำถามธุรกิจ 6 ข้อ ภายใต้ grain ต่างกัน
#
# ตารางเดียวตอบทุกคำถามไม่ได้ — พิสูจน์ด้วยตัวเลข

# %%
def collapse(data: pd.DataFrame, keys: list[str]) -> pd.DataFrame:
    """ยุบให้เหลือหนึ่งแถวต่อหนึ่งคีย์ (เลียนแบบการโหลดเข้า fact table ที่ grain นั้น)"""
    return data.drop_duplicates(keys)

CATEGORY = {
    "P-101": "เครื่องดื่ม", "P-102": "เครื่องดื่ม", "P-103": "เครื่องดื่ม",
    "P-201": "ของใช้ในบ้าน", "P-202": "ของใช้ในบ้าน", "P-203": "ของใช้ในบ้าน",
    "P-301": "เครื่องใช้ไฟฟ้า", "P-302": "เครื่องใช้ไฟฟ้า",
}

grains = {
    "ไฟล์ดิบ (line × payment)": ["receipt_no", "line_no", "payment_seq"],
    "ระดับรายการสินค้า": ["receipt_no", "line_no"],
    "ระดับใบเสร็จ": ["receipt_no"],
    "ระดับการชำระเงิน": ["receipt_no", "payment_seq"],
}
for name, keys in grains.items():
    print(f"{name:28s} → {len(collapse(df, keys)):>7,} แถว")

# %% [task]
# ### 🧑‍💻 งานที่ 3
# สร้างตารางเปรียบเทียบคำตอบของคำถามทั้ง 6 ข้อ ภายใต้ grain ทั้ง 4 แบบ
#
# | # | คำถามธุรกิจ | คำตอบที่ถูกต้อง |
# |---|---|---|
# | 1 | ยอดขายสุทธิรวม | 23,175,222.85 บาท |
# | 2 | จำนวนชิ้นของ P-101 | 3,664 ชิ้น |
# | 3 | ยอดขายหมวดเครื่องใช้ไฟฟ้า | 21,827,100.50 บาท |
# | 4 | มูลค่าเฉลี่ยต่อใบเสร็จ | 3,025.52 บาท |
# | 5 | สัดส่วนยอดที่ชำระด้วยพร้อมเพย์ | 24.36% |
# | 6 | จำนวนใบเสร็จที่ชำระมากกว่า 1 วิธี | 916 ใบ |
#
# ทำเป็น `DataFrame` ที่มี grain เป็นแถวและคำถามเป็นคอลัมน์

# %% [solution]
def answer_all(data: pd.DataFrame) -> dict:
    q1 = data.line_net_amount.sum()
    q2 = data.loc[data.sku == "P-101", "quantity"].sum()
    q3 = data.loc[data.sku.map(CATEGORY) == "เครื่องใช้ไฟฟ้า", "line_net_amount"].sum()
    q4 = data.drop_duplicates("receipt_no").receipt_total.mean()
    pay_total = data.payment_amount.sum()
    q5 = data.loc[data.payment_method == "พร้อมเพย์", "payment_amount"].sum() / pay_total
    q6 = (data.groupby("receipt_no").payment_seq.nunique() > 1).sum()
    return {"Q1 ยอดขายสุทธิ": q1, "Q2 ชิ้น P-101": q2, "Q3 หมวดไฟฟ้า": q3,
            "Q4 เฉลี่ย/ใบเสร็จ": q4, "Q5 สัดส่วนพร้อมเพย์": q5 * 100, "Q6 ใบเสร็จหลายวิธีชำระ": q6}

result = pd.DataFrame({name: answer_all(collapse(df, keys)) for name, keys in grains.items()}).T

truth = pd.Series({"Q1 ยอดขายสุทธิ": 23175222.85, "Q2 ชิ้น P-101": 3664,
                   "Q3 หมวดไฟฟ้า": 21827100.50, "Q4 เฉลี่ย/ใบเสร็จ": 3025.52,
                   "Q5 สัดส่วนพร้อมเพย์": 24.36, "Q6 ใบเสร็จหลายวิธีชำระ": 916})
result.loc["✅ ค่าจริง"] = truth
display(result)

print("\nความคลาดเคลื่อนเทียบค่าจริง (%)")
err = (result.drop(index="✅ ค่าจริง") / truth - 1) * 100
display(err.round(2))

# %% [markdown]
# > **ข้อสรุปที่ต้องเขียนลงในใบงาน**
# >
# > ไม่มี grain ใดตอบถูกครบทั้ง 6 ข้อ — grain ระดับรายการสินค้าตอบคำถาม Q1–Q3 ได้ถูกต้อง
# > ส่วน grain ระดับการชำระเงินตอบ Q5–Q6 ได้ถูกต้อง
# >
# > ระบบจริงจึงต้องมี fact table **มากกว่าหนึ่งตาราง** ที่ grain ต่างกัน
# > และเชื่อมกันด้วย `receipt_no` — ไม่ใช่พยายามยัดทุกอย่างลงตารางเดียว

# %% [markdown]
# ## ส่วนที่ 4 — ออกแบบ fact table ที่ถูกต้อง

# %% [task]
# ### 🧑‍💻 งานที่ 4
# สร้าง fact table สองตารางจากไฟล์ดิบ
#
# * `fact_sales_line` — grain: หนึ่งรายการสินค้าในหนึ่งใบเสร็จ
# * `fact_payment` — grain: หนึ่งการชำระเงินในหนึ่งใบเสร็จ
#
# แล้ว**พิสูจน์** ว่า
# 1. ผลรวม `line_net_amount` ของ `fact_sales_line` = 23,175,222.85
# 2. ผลรวม `payment_amount` ของ `fact_payment` = ผลรวม `receipt_total` ของแต่ละใบเสร็จ

# %% [solution]
fact_sales_line = (df.drop_duplicates(["receipt_no", "line_no"])
                     [["receipt_no", "receipt_ts", "store_id", "customer_id",
                       "line_no", "sku", "quantity", "unit_price",
                       "line_discount", "line_net_amount"]]
                     .reset_index(drop=True))

fact_payment = (df.drop_duplicates(["receipt_no", "payment_seq"])
                  [["receipt_no", "receipt_ts", "store_id",
                    "payment_seq", "payment_method", "payment_amount"]]
                  .reset_index(drop=True))

print(f"fact_sales_line : {len(fact_sales_line):>7,} แถว")
print(f"fact_payment    : {len(fact_payment):>7,} แถว")

# --- การกระทบยอด (reconciliation) ---
sum_lines = fact_sales_line.line_net_amount.sum()
sum_pay = fact_payment.payment_amount.sum()
sum_receipt = df.drop_duplicates("receipt_no").receipt_total.sum()
sum_bill_disc = df.drop_duplicates("receipt_no").receipt_bill_discount.sum()

print(f"\nรวม line_net_amount          : {sum_lines:>16,.2f}")
print(f"รวม payment_amount           : {sum_pay:>16,.2f}")
print(f"รวม receipt_total            : {sum_receipt:>16,.2f}")
print(f"รวมส่วนลดท้ายบิล             : {sum_bill_disc:>16,.2f}")
print(f"\nตรวจ: line − ส่วนลดท้ายบิล   = {sum_lines - sum_bill_disc:>16,.2f}")
print(f"      ต้องเท่ากับ receipt_total = {sum_receipt:>16,.2f}")
print("ผลการกระทบยอด:", "ผ่าน ✓" if abs((sum_lines - sum_bill_disc) - sum_receipt) < 1 else "ไม่ผ่าน ✗")

# %% [markdown]
# > **จุดที่นักศึกษามักพลาด** ผลรวมของ `line_net_amount` **ไม่เท่ากับ** ผลรวมของ `receipt_total`
# > เพราะมี **ส่วนลดท้ายบิล** ที่ผูกกับใบเสร็จ ไม่ได้ผูกกับรายการสินค้า
# >
# > ในการออกแบบจริงต้องตัดสินใจว่าจะ *ปันส่วน* ส่วนลดท้ายบิลลงแต่ละรายการหรือไม่
# > ซึ่งเป็นการตัดสินใจเชิงธุรกิจ ไม่ใช่เชิงเทคนิค

# %% [markdown]
# ## ส่วนที่ 5 — เขียน Grain Contract

# %% [task]
# ### 🧑‍💻 งานที่ 5 (เขียนเป็นข้อความ ไม่ต้องเขียนโค้ด)
#
# เติมประโยคต่อไปนี้ให้สมบูรณ์สำหรับ fact table ทั้งสองตาราง
#
# > หนึ่งแถวใน `fact_sales_line` แทน __________ ของ __________ ณ __________
# >
# > หนึ่งแถวใน `fact_payment` แทน __________ ของ __________ ณ __________
#
# จากนั้นตอบคำถาม
# 1. ถ้าอนาคตธุรกิจเริ่มขายแบบ "ซื้อ 1 แถม 1" grain เดิมยังใช้ได้หรือไม่ เพราะเหตุใด
# 2. ถ้าผู้บริหารถามว่า "ลูกค้าที่จ่ายด้วยพร้อมเพย์ซื้อสินค้าหมวดใดมากที่สุด"
#    ต้องใช้ตารางใดบ้าง และมีความเสี่ยงอะไรในการ join
# 3. เขียนกฎทดสอบ (assertion) อย่างน้อย 3 ข้อ ที่ควรรันทุกครั้งหลังโหลดข้อมูล
#    เพื่อยืนยันว่า grain ยังถูกต้อง

# %% [solution]
# ตัวอย่างคำตอบสำหรับข้อ 3 — เขียนเป็นกฎทดสอบที่รันได้จริง
def assert_grain(fact: pd.DataFrame, keys: list[str], name: str) -> None:
    dup = fact.duplicated(keys).sum()
    assert dup == 0, f"{name}: พบคีย์ซ้ำ {dup} แถว → grain เสียแล้ว"
    print(f"✓ {name}: ไม่มีคีย์ซ้ำ ({len(fact):,} แถว)")


assert_grain(fact_sales_line, ["receipt_no", "line_no"], "fact_sales_line")
assert_grain(fact_payment, ["receipt_no", "payment_seq"], "fact_payment")

# กฎที่ 3 — ยอดต้องกระทบกันได้เสมอ
diff = abs((fact_sales_line.line_net_amount.sum() - sum_bill_disc) - sum_receipt)
assert diff < 1, f"การกระทบยอดไม่ผ่าน ต่างกัน {diff:,.2f} บาท"
print(f"✓ การกระทบยอดผ่าน (ต่างกัน {diff:.2f} บาท)")

# กฎที่ 4 — ทุกรายการต้องมียอดไม่ติดลบและจำนวนมากกว่าศูนย์
assert (fact_sales_line.quantity > 0).all(), "พบจำนวนสินค้าที่ไม่เป็นบวก"
print("✓ จำนวนสินค้าทุกแถวเป็นบวก")

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — คำนวณและอธิบายการนับซ้ำได้ถูกต้อง | 2 |
# | งานที่ 2 — ระบุต้นตอของการนับซ้ำได้ | 2 |
# | งานที่ 3 — ตารางเปรียบเทียบครบ 4 grain × 6 คำถาม | 3 |
# | งานที่ 4 — สร้าง fact table 2 ตารางและกระทบยอดผ่าน | 2 |
# | งานที่ 5 — grain contract และคำตอบเชิงวิเคราะห์ | 3 |
# | **รวม** | **12** |
#
# > 💡 ตัวเลขทุกตัวในสมุดเล่มนี้ต้องตรงกับที่แสดงบนสื่อจำลอง `/sims/grain-detective`
# > ถ้าไม่ตรง แปลว่ามีขั้นตอนใดขั้นตอนหนึ่งผิด — ให้ย้อนกลับไปตรวจก่อนส่ง
