# %% [markdown]
# # 🏷️ Lab W4-2 — Metric Sprawl และ Semantic Layer
#
# **รายวิชาระบบสนับสนุนการตัดสินใจ · สัปดาห์ที่ 4 — OLAP and Multidimensional Analysis**
#
# Lab นี้ใช้คู่กับสื่อจำลอง **Metric Sprawl Arena** (`/sims/metric-sprawl`)
# ตัวเลขที่คุณคำนวณได้ในสมุดเล่มนี้ต้องตรงกับตัวเลขบนหน้าจอสื่อจำลองทุกหลัก
#
# ## สิ่งที่จะได้เรียนรู้
# 1. อธิบายได้ว่า **metric sprawl** เกิดขึ้นได้อย่างไรทั้งที่ทุกฝ่ายใช้ข้อมูลชุดเดียวกัน
# 2. แยก **นิยามของตัววัด** ออกจาก **ข้อมูลดิบ** และจาก **เครื่องมือที่ใช้แสดงผล**
# 3. เขียนนิยามตัววัดแบบ **metrics-as-code** ที่ตรวจสอบและทดสอบได้
# 4. อธิบายว่า **semantic layer** แก้ปัญหาอะไร และแก้ไม่ได้อะไร
#
# ## ข้อมูล
# `revenue_source.csv` — คำสั่งซื้อปี 2025 จำนวน 9,635 รายการ
# มีคอลัมน์ครบทุกองค์ประกอบที่แต่ละฝ่ายเลือกหยิบไปคนละชุด

# %%
import pandas as pd

pd.set_option("display.float_format", lambda v: f"{v:,.2f}")

URL = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
       "master/datasets/week04/revenue_source.csv")
df = pd.read_csv(URL)

print(f"จำนวนคำสั่งซื้อ : {len(df):,}")
print(f"ช่วงวันที่      : {df.order_date.min()} ถึง {df.order_date.max()}")
print(f"ช่องทาง         : {df.channel.value_counts().to_dict()}")
df.head(5)

# %% [markdown]
# ## ส่วนที่ 1 — ที่ประชุมผู้บริหารเมื่อเช้านี้
#
# คำถามเดียว: **"รายได้ปี 2025 เท่าไร"**
# ทั้ง 4 ฝ่ายเปิดรายงานของตัวเอง แล้วได้ตัวเลขไม่ตรงกันสักฝ่าย
#
# ก่อนอื่นให้ดูว่าในไฟล์เดียวกันนี้มี "ก้อนเงิน" ให้เลือกหยิบกี่ก้อน

# %%
COMPONENTS = ["gross_amount", "discount", "net_amount",
              "vat_amount", "shipping_fee", "returned_amount"]

totals = df[COMPONENTS].sum()
print("ผลรวมของแต่ละองค์ประกอบ (บาท)")
print(totals.to_string())

print(f"\nตรวจความสอดคล้อง: net = gross − discount ?  "
      f"{bool((df.net_amount.round(2) == (df.gross_amount - df.discount).round(2)).all())}")
print(f"ตรวจ VAT: vat = net × 7/107 ?  ต่างสูงสุด {abs(df.vat_amount - df.net_amount*7/107).max():.4f} บาท")

# %% [markdown]
# > **ไม่มีคอลัมน์ใดผิด** ทุกตัวเลขคำนวณถูกต้องตามสูตรของตัวเอง
# > ปัญหาอยู่ที่ **ไม่มีใครตกลงกันว่าคำว่า "รายได้" หมายถึงก้อนไหนบ้าง**

# %% [task]
# ### 🧑‍💻 งานที่ 1
# เขียนฟังก์ชัน `revenue(base, deduct)` ที่คำนวณรายได้ตามนิยามที่ส่งเข้ามา
#
# * `base` — `"gross"` หรือ `"net"`
# * `deduct` — เซ็ตของสิ่งที่ต้องการหัก จาก `{"returns", "vat", "shipping"}`
#
# แล้วใช้ฟังก์ชันนี้คำนวณตัวเลขของทั้ง 4 ฝ่าย
#
# | ฝ่าย | ฐาน | หัก |
# |---|---|---|
# | ฝ่ายขาย | gross | — |
# | ฝ่ายการตลาด | net | คืนสินค้า |
# | ฝ่ายบัญชี | net | คืนสินค้า, VAT |
# | ผู้บริหาร | net | คืนสินค้า, VAT, ค่าขนส่ง |
#
# *เฉลยที่ถูกต้อง: 13,797,768.00 / 12,610,979.50 / 11,773,005.38 / 11,725,165.38*

# %% [solution]
S = {
    "gross": df.gross_amount.sum(),
    "net": df.net_amount.sum(),
    "returns": df.returned_amount.sum(),
    "vat": df.vat_amount.sum(),
    "shipping": df.shipping_fee.sum(),
}


def revenue(base: str, deduct: set) -> float:
    """คำนวณ 'รายได้' ตามนิยามที่ระบุ — ตรรกะเดียวกับที่สื่อจำลองใช้"""
    v = S[base]
    for d in deduct:
        v -= S[d]
    return v


DEPARTMENTS = {
    "ฝ่ายขาย":     ("gross", set()),
    "ฝ่ายการตลาด": ("net", {"returns"}),
    "ฝ่ายบัญชี":   ("net", {"returns", "vat"}),
    "ผู้บริหาร":   ("net", {"returns", "vat", "shipping"}),
}

result = pd.DataFrame(
    [{"ฝ่าย": k, "ฐาน": b, "หัก": ", ".join(sorted(d)) or "—", "รายได้ปี 2025": revenue(b, d)}
     for k, (b, d) in DEPARTMENTS.items()]
).set_index("ฝ่าย")

print(result.to_string())

hi, lo = result["รายได้ปี 2025"].max(), result["รายได้ปี 2025"].min()
print(f"\nสูงสุด − ต่ำสุด = {hi - lo:,.2f} บาท")
print(f"ช่วงห่างของคำตอบ = {(hi/lo - 1)*100:.2f}%")

# %% [markdown]
# > **ห่างกัน 17.68% จากข้อมูลชุดเดียวกัน** — ไม่ใช่ปัญหาคุณภาพข้อมูล
# > ไม่ใช่ปัญหา ETL ไม่ใช่ปัญหาเครื่องมือ BI
# >
# > เป็นปัญหา **การกำกับดูแลนิยาม (metric governance)** ล้วน ๆ

# %% [markdown]
# ## ส่วนที่ 2 — แต่ละฝ่ายไม่ได้ผิด
#
# จุดที่นักศึกษามักเข้าใจผิดคือคิดว่า "ต้องมีฝ่ายใดฝ่ายหนึ่งผิด"
# ความจริงคือแต่ละนิยามถูกต้องสำหรับ **คำถามของฝ่ายนั้น**

# %% [task]
# ### 🧑‍💻 งานที่ 2
# จับคู่แต่ละนิยามกับ **คำถามที่มันตอบได้ถูกต้อง** และ **คำถามที่มันตอบผิด**
#
# เขียนเป็นตาราง 4 แถว มีคอลัมน์: ฝ่าย · ใช้ตัดสินใจเรื่องอะไร · ห้ามใช้ตอบคำถามอะไร
#
# แนวคิด: VAT เป็นเงินที่เก็บแทนรัฐ ไม่ใช่รายได้ของบริษัท ·
# ค่าขนส่งที่บริษัทออกให้เป็นต้นทุน ไม่ใช่ตัวหักรายได้ในงบการเงิน

# %% [solution]
mapping = pd.DataFrame([
    ["ฝ่ายขาย", "จ่ายคอมมิชชัน · วัดผลงานทีมขาย",
     "รายงานต่อผู้ถือหุ้น — รวม VAT ซึ่งไม่ใช่เงินของบริษัท"],
    ["ฝ่ายการตลาด", "วัด ROI แคมเปญ — ยอดที่ลูกค้าคืนไม่ถือว่าสำเร็จ",
     "งบกำไรขาดทุน — ยังไม่แยก VAT ออก"],
    ["ฝ่ายบัญชี", "รายได้ที่รับรู้ทางบัญชี · ยื่นภาษี · งบการเงิน",
     "วัดผลงานทีมขาย — ทีมขายควบคุมการคืนสินค้าไม่ได้ทั้งหมด"],
    ["ผู้บริหาร", "ประเมินเงินสดที่เหลือเข้าบริษัทจริง",
     "งบการเงิน — ค่าขนส่งเป็นต้นทุน ไม่ใช่ตัวหักรายได้"],
], columns=["ฝ่าย", "ใช้ตัดสินใจ", "ห้ามใช้ตอบ"]).set_index("ฝ่าย")

print(mapping.to_string())

print("""
ข้อสรุป
-------
ปัญหาไม่ใช่ 'มี 4 นิยาม' แต่คือ 'ทั้ง 4 นิยามใช้ชื่อเดียวกันว่า รายได้'
ทางแก้จึงไม่ใช่การบังคับให้เหลือนิยามเดียว
แต่คือการบังคับให้ทุกนิยาม 'มีชื่อของตัวเอง' และ 'ถูกนิยามไว้ที่เดียว'
""")

# %% [markdown]
# ## ส่วนที่ 3 — Semantic layer: นิยามเป็นโค้ด
#
# แทนที่จะให้แต่ละฝ่ายเขียน SQL ของตัวเอง
# ให้นิยามตัววัดไว้ที่เดียวในรูปแบบที่เครื่องอ่านได้ แล้วทุกเครื่องมือดึงไปใช้

# %%
METRIC_STORE = {
    "gross_revenue": {
        "label": "รายได้ขั้นต้น",
        "expr": lambda d: d.gross_amount.sum(),
        "owner": "ฝ่ายขาย",
        "use_for": "คอมมิชชันและ KPI ทีมขาย",
        "not_for": "งบการเงิน",
    },
    "net_revenue_recognized": {
        "label": "รายได้ที่รับรู้ทางบัญชี",
        "expr": lambda d: d.net_amount.sum() - d.returned_amount.sum() - d.vat_amount.sum(),
        "owner": "ฝ่ายบัญชี",
        "use_for": "งบการเงินและการยื่นภาษี",
        "not_for": "การวัดผลงานทีมขาย",
    },
    "cash_contribution": {
        "label": "เงินที่เหลือเข้าบริษัท",
        "expr": lambda d: (d.net_amount.sum() - d.returned_amount.sum()
                           - d.vat_amount.sum() - d.shipping_fee.sum()),
        "owner": "ฝ่ายการเงิน",
        "use_for": "ประเมินกระแสเงินสด",
        "not_for": "งบกำไรขาดทุน",
    },
}

print("ทะเบียนตัววัดกลาง (metric store)\n")
for name, m in METRIC_STORE.items():
    print(f"  {name:<24} {m['label']:<24} {m['expr'](df):>16,.2f}  · เจ้าของ: {m['owner']}")

# %% [task]
# ### 🧑‍💻 งานที่ 3
# เพิ่มตัววัด `marketing_qualified_revenue` (นิยามของฝ่ายการตลาด) ลงใน `METRIC_STORE`
# แล้วเขียนฟังก์ชัน `report(metric_name, by=None)` ที่
#
# * คำนวณตัววัดจากทะเบียนกลาง ห้ามเขียนสูตรซ้ำ
# * ถ้าระบุ `by` ให้แตกตามมิตินั้น (เช่น `"channel"` หรือ `"store_id"`)
# * ถ้าเรียกชื่อตัววัดที่ไม่มีในทะเบียน ให้ raise `KeyError` พร้อมรายชื่อที่มี

# %% [solution]
METRIC_STORE["marketing_qualified_revenue"] = {
    "label": "รายได้ที่ผ่านเกณฑ์การตลาด",
    "expr": lambda d: d.net_amount.sum() - d.returned_amount.sum(),
    "owner": "ฝ่ายการตลาด",
    "use_for": "วัด ROI ของแคมเปญ",
    "not_for": "งบการเงิน",
}


def report(metric_name: str, by: str | None = None, data: pd.DataFrame = df):
    if metric_name not in METRIC_STORE:
        raise KeyError(
            f"ไม่มีตัววัดชื่อ '{metric_name}' ในทะเบียนกลาง — "
            f"ที่มีคือ {sorted(METRIC_STORE)}"
        )
    m = METRIC_STORE[metric_name]
    if by is None:
        return m["expr"](data)
    return pd.Series({k: m["expr"](g) for k, g in data.groupby(by)}, name=m["label"])


print(f"รายได้ที่รับรู้ทางบัญชี : {report('net_revenue_recognized'):,.2f}\n")
print("แตกตามช่องทาง")
print(report("net_revenue_recognized", by="channel").to_string())
print("\nแตกตามสาขา")
print(report("net_revenue_recognized", by="store_id").to_string())

try:
    report("revenue")
except KeyError as e:
    print(f"\n✓ กันชื่อกำกวมได้: {e}")

# %% [markdown]
# > **จุดสำคัญ** ไม่มีที่ใดในโค้ดรายงานที่เขียนสูตรรายได้ซ้ำอีกเลย
# > ถ้าฝ่ายบัญชีเปลี่ยนนิยาม แก้ที่ `METRIC_STORE` ที่เดียว ทุกรายงานเปลี่ยนตามทันที
# >
# > นี่คือแก่นของ **metrics-as-code** — นิยามอยู่ใน version control
# > มีเจ้าของ มีประวัติการแก้ไข และ review ได้เหมือนโค้ดทั่วไป

# %% [markdown]
# ## ส่วนที่ 4 — ทดสอบนิยาม
#
# นิยามที่เป็นโค้ดได้ ย่อมทดสอบได้

# %% [task]
# ### 🧑‍💻 งานที่ 4
# เขียนชุดทดสอบอย่างน้อย 4 ข้อสำหรับทะเบียนตัววัด เช่น
#
# 1. ตัววัดทุกตัวต้องมี `owner`, `use_for`, `not_for` ครบ
# 2. `net_revenue_recognized` ต้องน้อยกว่า `gross_revenue` เสมอ
# 3. ผลรวมของตัววัดเมื่อแตกตามมิติใด ๆ ต้องเท่ากับค่ารวม (additivity)
# 4. ค่าของตัววัดต้องไม่เปลี่ยนเมื่อเรียงลำดับแถวใหม่ (determinism)

# %% [solution]
def test_metric_store():
    for name, m in METRIC_STORE.items():
        for field in ("label", "owner", "use_for", "not_for"):
            assert m.get(field), f"{name}: ขาดข้อมูล '{field}'"
    print(f"✓ ตัววัดทั้ง {len(METRIC_STORE)} ตัวมีเอกสารกำกับครบ")

    assert report("net_revenue_recognized") < report("gross_revenue")
    print("✓ รายได้ที่รับรู้ < รายได้ขั้นต้น เสมอ")

    for name in METRIC_STORE:
        total = report(name)
        for dim in ("channel", "store_id"):
            parts = report(name, by=dim).sum()
            assert abs(parts - total) < 0.01, f"{name} ไม่ additive ตามมิติ {dim}"
    print("✓ ทุกตัววัด additive ตามมิติ channel และ store_id")

    shuffled = df.sample(frac=1, random_state=7)
    for name in METRIC_STORE:
        assert abs(report(name, data=shuffled) - report(name)) < 0.01, f"{name} ขึ้นกับลำดับแถว"
    print("✓ ทุกตัววัดให้ผลเท่าเดิมเมื่อสลับลำดับแถว")


test_metric_store()

# %% [markdown]
# > **ข้อควรระวัง** ข้อ 3 ใช้ได้เฉพาะกับตัววัดแบบ **additive**
# > ตัววัดอย่าง *อัตราการคืนสินค้า* หรือ *จำนวนลูกค้าที่ไม่ซ้ำ* เป็น **non-additive**
# > ผลรวมของกลุ่มย่อยจะไม่เท่ากับค่ารวม — ต้องเขียนกฎทดสอบคนละแบบ

# %% [task]
# ### 🧑‍💻 งานที่ 5
# เพิ่มตัววัด `return_rate` (อัตราการคืนสินค้า = returned ÷ net) เข้าทะเบียน
# แล้ว**พิสูจน์ด้วยตัวเลข**ว่าถ้าใช้กฎทดสอบข้อ 3 กับตัววัดนี้ จะไม่ผ่าน
# จากนั้นเขียนกฎที่ถูกต้องสำหรับตัววัดแบบ non-additive

# %% [solution]
METRIC_STORE["return_rate"] = {
    "label": "อัตราการคืนสินค้า",
    "expr": lambda d: d.returned_amount.sum() / d.net_amount.sum() * 100,
    "owner": "ฝ่ายปฏิบัติการ",
    "use_for": "ติดตามคุณภาพสินค้าและการจัดส่ง",
    "not_for": "บวกข้ามกลุ่ม — เป็นตัววัดแบบอัตราส่วน",
    "additive": False,
}

total = report("return_rate")
parts = report("return_rate", by="channel")
print(f"อัตราการคืนสินค้ารวม        : {total:.4f}%")
print(parts.to_string())
print(f"ผลบวกของกลุ่มย่อย (ผิดวิธี) : {parts.sum():.4f}%   ← ไม่มีความหมาย")

# กฎที่ถูกต้อง: ประกอบขึ้นใหม่จากตัวตั้งและตัวหาร ไม่ใช่บวกอัตรา
num = df.groupby("channel").returned_amount.sum()
den = df.groupby("channel").net_amount.sum()
recomposed = num.sum() / den.sum() * 100
print(f"\nประกอบใหม่จากตัวตั้ง÷ตัวหาร  : {recomposed:.4f}%   ← ตรงกับค่ารวม")
assert abs(recomposed - total) < 1e-9
print("✓ กฎสำหรับ non-additive: ต้องเก็บ 'ตัวตั้ง' และ 'ตัวหาร' แยกกันในตัววัด")

# %% [markdown]
# ## ส่วนที่ 5 — ขอบเขตของ semantic layer

# %% [task]
# ### 🧑‍💻 งานที่ 6 (เขียนเป็นข้อความ)
#
# 1. semantic layer **แก้ปัญหาอะไรได้** ในกรณีนี้ — ตอบเป็นข้อ ๆ
# 2. semantic layer **แก้ปัญหาอะไรไม่ได้** — ยกอย่างน้อย 2 ตัวอย่าง
# 3. ถ้าองค์กรติดตั้ง semantic layer แล้วแต่ยังมีตัวเลขไม่ตรงกันอยู่
#    ให้ตั้งสมมติฐาน 3 ข้อว่าสาเหตุน่าจะเป็นอะไร
# 4. เขียนนิยามตัววัด `net_revenue_recognized` ในรูปแบบ YAML
#    ที่มี: ชื่อ · คำอธิบายภาษาไทย · สูตร · เจ้าของ · มิติที่ใช้แตกได้ · ตัววัดที่ห้ามสับสนด้วย

# %% [solution]
# ตัวอย่างคำตอบข้อ 4
YAML_EXAMPLE = """
metrics:
  - name: net_revenue_recognized
    label: รายได้ที่รับรู้ทางบัญชี
    description: >
      ยอดขายสุทธิหลังหักส่วนลด หักมูลค่าสินค้าที่ลูกค้าคืน
      และหักภาษีมูลค่าเพิ่มซึ่งบริษัทเก็บแทนรัฐ
      ใช้เป็นตัวเลขรายได้ในงบการเงินและการยื่นภาษีเท่านั้น
    expression: SUM(net_amount) - SUM(returned_amount) - SUM(vat_amount)
    unit: THB
    owner: ฝ่ายบัญชี
    reviewed_at: '2025-01-15'
    additive: true
    dimensions: [order_date, store_id, channel, sku]
    do_not_confuse_with:
      - gross_revenue                # ใช้จ่ายคอมมิชชัน ไม่ใช่รายได้บริษัท
      - marketing_qualified_revenue  # ยังไม่หัก VAT
      - cash_contribution            # หักค่าขนส่งเพิ่ม ใช้ดูกระแสเงินสด
"""
print(YAML_EXAMPLE)

print("""ตัวอย่างคำตอบข้อ 2 — สิ่งที่ semantic layer แก้ไม่ได้
-----------------------------------------------------
1. ข้อมูลต้นทางผิด — ถ้า net_amount ในระบบ POS คำนวณผิดมาแต่ต้น
   นิยามกลางที่ถูกต้องก็ยังให้คำตอบผิด (garbage in, governed garbage out)
2. ความขัดแย้งเชิงองค์กร — ถ้าฝ่ายขายถูกวัด KPI ด้วยตัวเลขที่สูงกว่า
   เขาจะหาทางใช้ตัวเลขนั้นต่อไป ไม่ว่าจะมีชั้น semantic หรือไม่
   ปัญหานี้แก้ด้วยการออกแบบ KPI ไม่ใช่ด้วยเทคโนโลยี
3. ตัววัดที่ยังไม่มีใครนิยาม — semantic layer ครอบคลุมได้เฉพาะสิ่งที่ถูกใส่เข้าไป
   ตัววัดใหม่ที่ผู้ใช้สร้างเองใน Excel ยังหลุดรอดออกไปได้เสมอ
""")

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — คำนวณตัวเลขทั้ง 4 ฝ่ายและช่วงห่างได้ถูกต้อง | 3 |
# | งานที่ 2 — จับคู่นิยามกับคำถามที่ตอบได้/ตอบไม่ได้ | 2 |
# | งานที่ 3 — สร้าง metric store ที่ไม่มีสูตรซ้ำและมี `by` ใช้งานได้ | 3 |
# | งานที่ 4 — ชุดทดสอบครบ 4 ข้อและผ่านทั้งหมด | 3 |
# | งานที่ 5 — พิสูจน์ปัญหา non-additive และเสนอกฎที่ถูกต้อง | 2 |
# | งานที่ 6 — ขอบเขตของ semantic layer และนิยาม YAML | 3 |
# | **รวม** | **16** |
#
# > 💡 ตัวเลขทุกตัวในสมุดเล่มนี้ต้องตรงกับที่แสดงบนสื่อจำลอง `/sims/metric-sprawl`
# > ถ้าไม่ตรง แปลว่ามีขั้นตอนใดขั้นตอนหนึ่งผิด — ให้ย้อนกลับไปตรวจก่อนส่ง
