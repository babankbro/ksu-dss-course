# %% [markdown]
# # 🧺 Lab W6-2 — Market Basket Analysis และการอ่านค่า Lift
#
# **รายวิชาระบบสนับสนุนการตัดสินใจ · สัปดาห์ที่ 6 — Data Mining II**
#
# Lab นี้ใช้คู่กับสื่อจำลอง **Lift Detective** (`/sims/lift-detective`)
# ตัวเลขที่คุณคำนวณได้ในสมุดเล่มนี้ต้องตรงกับตัวเลขบนหน้าจอสื่อจำลองทุกหลัก
#
# ## สิ่งที่จะได้เรียนรู้
# 1. คำนวณ **Support · Confidence · Lift** ด้วยมือ ไม่ใช่เรียกไลบรารี
# 2. อธิบายว่าเหตุใด **confidence สูงจึงไม่ได้แปลว่ากฎมีค่า**
# 3. รู้ว่า **Apriori มองไม่เห็นความสัมพันธ์เชิงลบ** และเหตุใดจึงสำคัญ
# 4. แปลงกฎที่พบให้เป็น **สมมติฐานที่ทดสอบได้** ไม่ใช่ข้อสรุปที่นำไปทำทันที
#
# ## ข้อมูล
# `baskets.csv` — ตะกร้าสินค้า 5,000 ใบ ในรูปแบบหนึ่งแถวต่อหนึ่งสินค้า

# %%
from itertools import combinations

import pandas as pd

pd.set_option("display.float_format", lambda v: f"{v:,.4f}")

URL = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
       "master/datasets/week06/baskets.csv")
lines = pd.read_csv(URL)

baskets = lines.groupby("transaction_id").item.apply(frozenset)
N = len(baskets)

print(f"จำนวนแถว        : {len(lines):,}")
print(f"จำนวนตะกร้า     : {N:,}")
print(f"สินค้าเฉลี่ย/ตะกร้า : {len(lines)/N:.2f} ชิ้น")
print(f"สินค้าทั้งหมด    : {lines.item.nunique()} ชนิด")
lines.head(6)

# %% [markdown]
# ## ส่วนที่ 1 — Support ของสินค้าเดี่ยว
#
# ก่อนหากฎใด ๆ ต้องรู้ก่อนว่าแต่ละสินค้าปรากฏบ่อยแค่ไหน
# ตัวเลขนี้คือ **ตัวหารของ lift** และเป็นกุญแจของทั้ง Lab

# %% [task]
# ### 🧑‍💻 งานที่ 1
# คำนวณ support ของสินค้าทุกชนิด แล้วเรียงจากมากไปน้อย
#
# *เฉลยที่ถูกต้อง: ถุงพลาสติกมี support 0.8144 ซึ่งสูงกว่าอันดับสองกว่าสองเท่า*

# %% [solution]
items = sorted(lines.item.unique())
support1 = pd.Series(
    {it: sum(it in b for b in baskets) / N for it in items}
).sort_values(ascending=False)

print(support1.to_string())
print(f"\nอันดับ 1 ({support1.index[0]}) สูงกว่าอันดับ 2 "
      f"{support1.iloc[0]/support1.iloc[1]:.2f} เท่า")

# %% [markdown]
# ## ส่วนที่ 2 — สร้างกฎทั้งหมดเอง

# %% [task]
# ### 🧑‍💻 งานที่ 2
# เขียนโค้ดสร้างกฎแบบสินค้าเดียว → สินค้าเดียว ทั้งหมดที่มี support ร่วมกันไม่ต่ำกว่า 0.01
# โดยคำนวณ `support`, `confidence`, `lift` และ `leverage` เอง
#
# * `support(A→B) = P(A ∩ B)`
# * `confidence(A→B) = support(A∩B) / support(A)`
# * `lift(A→B) = confidence(A→B) / support(B)`
# * `leverage(A→B) = support(A∩B) − support(A) × support(B)`

# %% [solution]
MIN_SUPPORT = 0.01

rules = []
for a, b in combinations(items, 2):
    both = sum(a in t and b in t for t in baskets) / N
    if both < MIN_SUPPORT:
        continue
    for A, C in ((a, b), (b, a)):
        conf = both / support1[A]
        rules.append({
            "ถ้าซื้อ": A, "ก็มักซื้อ": C,
            "support": both, "confidence": conf,
            "lift": conf / support1[C],
            "leverage": both - support1[A] * support1[C],
        })

R = pd.DataFrame(rules)
print(f"จำนวนกฎที่ผ่านเกณฑ์ support ≥ {MIN_SUPPORT} : {len(R):,} กฎ")

# %% [markdown]
# ## ส่วนที่ 3 — กับดักของ Confidence

# %% [task]
# ### 🧑‍💻 งานที่ 3
# แสดง 10 กฎที่มี confidence สูงที่สุด แล้วตอบว่า
#
# 1. กฎเหล่านั้นมีอะไรเหมือนกัน
# 2. ค่า lift ของกฎเหล่านั้นบอกอะไร
# 3. ถ้าเอากฎอันดับ 1 ไปจัดวางสินค้าจริง จะเกิดอะไรขึ้น
#
# *เฉลยที่ถูกต้อง: ทั้ง 10 กฎลงท้ายด้วย "ถุงพลาสติก" และมี lift อยู่ระหว่าง 0.98–1.03*

# %% [solution]
top_conf = R.sort_values("confidence", ascending=False).head(10)
print("10 กฎที่ confidence สูงที่สุด")
print(top_conf.to_string(index=False))

print(f"""
คำตอบ
-----
1. ทั้ง 10 กฎลงท้ายด้วยสินค้าตัวเดียวกันคือ '{top_conf['ก็มักซื้อ'].mode()[0]}'
   ซึ่งมี support เดี่ยวสูงถึง {support1[top_conf['ก็มักซื้อ'].mode()[0]]:.4f}

2. lift ของกฎเหล่านี้อยู่ระหว่าง {top_conf.lift.min():.4f} ถึง {top_conf.lift.max():.4f}
   คือใกล้ 1.00 ทั้งหมด และบางกฎ 'ต่ำกว่า' 1 ด้วยซ้ำ
   แปลว่าการรู้ว่าลูกค้าซื้อ A ไม่ได้ช่วยให้ทำนาย B ได้ดีขึ้นเลยแม้แต่นิดเดียว

   confidence สูงเพราะ {top_conf['ก็มักซื้อ'].mode()[0]} อยู่ในเกือบทุกตะกร้าอยู่แล้ว
   ไม่ว่าจะซื้ออะไรก็ได้มันติดไปด้วยเสมอ

3. ไม่เกิดอะไรขึ้นเลย — ยอดขายจะไม่เปลี่ยน
   แต่จะเสียพื้นที่ชั้นวางที่ดีที่สุดของร้านไปฟรี ๆ
   และเสียเวลาทีมงานไปกับการจัดวางใหม่ที่ไม่มีผล
""")

# %% [markdown]
# > **Lift ตอบคำถามที่ถูกต้อง**
# >
# > *"การรู้ว่าลูกค้าซื้อ A ทำให้เราทำนาย B ได้ดีขึ้นกว่าการเดาสุ่มกี่เท่า"*
# >
# > `lift = confidence(A→B) ÷ support(B)` — ตัวหารคือสิ่งที่ confidence ลืมคิด

# %% [task]
# ### 🧑‍💻 งานที่ 4
# แสดง 10 กฎที่มี lift สูงที่สุด แล้วตอบว่ากฎอันดับ 1 เคยติด 10 อันดับแรก
# ของการเรียงตาม confidence หรือไม่ และเพราะเหตุใด
#
# *เฉลยที่ถูกต้อง: ผ้าอ้อม → ผ้าเช็ดทำความสะอาด lift 5.0312 · confidence 0.7044*

# %% [solution]
top_lift = R.sort_values("lift", ascending=False).head(10)
print("10 กฎที่ lift สูงที่สุด")
print(top_lift.to_string(index=False))

best = top_lift.iloc[0]
rank_by_conf = (R.confidence > best.confidence).sum() + 1
print(f"\nกฎที่ lift สูงสุด : {best['ถ้าซื้อ']} → {best['ก็มักซื้อ']}")
print(f"  support = {best.support:.4f} · confidence = {best.confidence:.4f} · lift = {best.lift:.4f}")
print(f"  อันดับเมื่อเรียงตาม confidence = อันดับที่ {rank_by_conf}")
print(f"""
เหตุผล
------
กฎนี้มี confidence {best.confidence:.4f} ซึ่งไม่ต่ำเลย แต่ยังแพ้กฎขยะที่ลงท้ายด้วยของขายดี
เพราะปลายทางของมัน ({best['ก็มักซื้อ']}) มี support เพียง {support1[best['ก็มักซื้อ']]:.4f}
ไม่ใช่ของที่ใครก็หยิบ

กฎที่มีค่าที่สุดจึงเป็นกฎที่การจัดอันดับด้วย confidence มองข้ามไปเสมอ
— ต้องเรียงด้วย lift เท่านั้น
""")

# %% [markdown]
# ## ส่วนที่ 4 — สิ่งที่ Apriori มองไม่เห็น

# %% [task]
# ### 🧑‍💻 งานที่ 5
# ตรวจสอบว่ามีกฎระหว่าง `กาแฟสด` กับ `ชาเขียว` ในผลลัพธ์หรือไม่
# แล้วคำนวณจำนวนตะกร้าที่มีทั้งสองอย่างพร้อมกัน
#
# จากนั้นอธิบายว่าเหตุใดข้อมูลนี้จึงมีค่าทางธุรกิจสูง
# แต่กลับไม่ปรากฏในตารางกฎเลย

# %% [solution]
co = sum(("กาแฟสด" in t and "ชาเขียว" in t) for t in baskets)
in_rules = ((R["ถ้าซื้อ"] == "กาแฟสด") & (R["ก็มักซื้อ"] == "ชาเขียว")).any()

print(f"support(กาแฟสด)  = {support1['กาแฟสด']:.4f}")
print(f"support(ชาเขียว) = {support1['ชาเขียว']:.4f}")
print(f"ถ้าเป็นอิสระต่อกัน ควรพบร่วมกัน "
      f"{support1['กาแฟสด']*support1['ชาเขียว']*N:.0f} ตะกร้า")
print(f"พบร่วมกันจริง     = {co} ตะกร้า")
print(f"ปรากฏในตารางกฎหรือไม่ : {'มี' if in_rules else 'ไม่มีเลย'}")

print("""
คำอธิบาย
--------
ทั้งสองเป็นสินค้าทดแทนกัน ลูกค้าเลือกอย่างใดอย่างหนึ่ง จึงไม่เคยอยู่ในตะกร้าเดียวกัน
support ร่วม = 0.0000 ซึ่งต่ำกว่า min_support ที่ตั้งไว้

Apriori ตัดทุกเซตที่ต่ำกว่า min_support ทิ้งตั้งแต่ขั้นแรกด้วยคุณสมบัติ anti-monotone
ความสัมพันธ์เชิงลบทั้งหมดจึงหายไปโดยไม่มีร่องรอย — ไม่ใช่แสดงเป็น lift ต่ำ แต่ 'ไม่มีแถวนั้นเลย'

เหตุใดจึงมีค่าทางธุรกิจสูง
  · ถ้าลดราคากาแฟ ยอดชาเขียวจะตกตามทันที — เป็นการย้ายยอดขาย ไม่ใช่การเพิ่มยอดขาย
  · การจัดโปรโมชันสองอย่างนี้พร้อมกันคือการแข่งกับตัวเอง
  · ควรวางไว้ใกล้กันเพื่อให้เปรียบเทียบง่าย ไม่ใช่วางไกลกันเหมือนสินค้าที่ซื้อคู่กัน

ข้อสรุปเชิงเครื่องมือ
  ตารางกฎที่ว่างเปล่าไม่ได้แปลว่า 'ไม่มีความสัมพันธ์'
  มันอาจแปลว่า 'มีความสัมพันธ์ที่เครื่องมือนี้ถูกออกแบบมาให้มองไม่เห็น'
  ถ้าสงสัยความสัมพันธ์เชิงลบ ต้องคำนวณ lift ของคู่ที่สนใจโดยตรง ไม่ใช่รอให้ Apriori หาให้
""")

# %% [markdown]
# ## ส่วนที่ 5 — กรณีศึกษาผ้าอ้อมกับเบียร์

# %% [task]
# ### 🧑‍💻 งานที่ 6
# ดึงค่าของกฎ `ผ้าอ้อม → เบียร์` ออกมา แล้วประเมินมูลค่าเป็นเงิน
#
# สมมติฐาน: กำไรต่อเบียร์หนึ่งแพ็ค 45 บาท · การย้ายชั้นวางทำให้ลูกค้าที่ซื้อผ้าอ้อม
# ซื้อเบียร์เพิ่มขึ้น 5 จุดเปอร์เซ็นต์ · ร้านมีตะกร้าแบบนี้ 5,000 ใบต่อ 90 วัน
#
# แล้วตอบว่า **คุณจะย้ายชั้นวางเลยหรือไม่**

# %% [solution]
r = R[(R["ถ้าซื้อ"] == "ผ้าอ้อม") & (R["ก็มักซื้อ"] == "เบียร์")].iloc[0]
print(f"ผ้าอ้อม → เบียร์")
print(f"  support    = {r.support:.4f}  ({r.support*N:.0f} ตะกร้า)")
print(f"  confidence = {r.confidence:.4f}")
print(f"  lift       = {r.lift:.4f}")

PROFIT = 45
UPLIFT_PTS = 0.05
n_diaper = support1["ผ้าอ้อม"] * N
extra = n_diaper * UPLIFT_PTS
print(f"\nตะกร้าที่มีผ้าอ้อม        : {n_diaper:.0f} ใบ ต่อ 90 วัน")
print(f"เบียร์ที่ขายเพิ่มคาดหวัง : {extra:.0f} แพ็ค")
print(f"กำไรเพิ่มคาดหวัง        : {extra*PROFIT:,.0f} บาท ต่อ 90 วัน "
      f"({extra*PROFIT*4:,.0f} บาท/ปี)")

print("""
คำตอบ: ยังไม่ย้าย — ต้องทดลองก่อน
====================================
lift 1.91 บอกว่าทั้งสองเกิดร่วมกันบ่อยกว่าที่ควรเป็นเกือบสองเท่า
แต่ 'ไม่ได้บอกว่าอะไรทำให้อะไรเกิด'

คำอธิบายทางเลือกที่ข้อมูลชุดนี้แยกไม่ออก
  ก. พ่อที่ถูกใช้ให้มาซื้อผ้าอ้อมถือโอกาสซื้อเบียร์      (เหตุ → ผล จริง)
  ข. ครอบครัวที่มีลูกอ่อนอยู่บ้านมากขึ้น จึงดื่มที่บ้าน  (ตัวแปรร่วมคือช่วงชีวิต)
  ค. ทั้งสองขายดีในช่วงเย็นวันศุกร์เหมือนกัน            (ตัวแปรร่วมคือเวลา)

ถ้าเป็น ข. หรือ ค. การย้ายชั้นวางจะไม่เพิ่มยอดขายเลยแม้แต่บาทเดียว
เพราะคนที่จะซื้อทั้งสองอย่างก็ซื้ออยู่แล้ว ไม่ว่าจะวางตรงไหน

การทดลองที่ต้องทำก่อน
  · สุ่มเลือกสาขาครึ่งหนึ่งย้ายชั้นวาง อีกครึ่งคงเดิม (ต้องสุ่ม ไม่ใช่เลือกสาขาที่สะดวก)
  · วัดยอดขายเบียร์ 4 สัปดาห์ เทียบส่วนต่างระหว่างสองกลุ่ม
  · ต้นทุนการทดลองต่ำกว่ากำไรที่คาดไว้มาก จึงคุ้มที่จะทดลองก่อนเสมอ

กฎความสัมพันธ์คือ 'สมมติฐาน' ไม่ใช่ 'ข้อสรุป'
""")

# %% [markdown]
# ## ส่วนที่ 6 — เทียบกับ mlxtend

# %% [task]
# ### 🧑‍💻 งานที่ 7
# ทำซ้ำด้วย `mlxtend.frequent_patterns.apriori` และ `association_rules`
# แล้วตรวจว่าค่าที่ได้ตรงกับที่คำนวณเองหรือไม่
#
# จากนั้นหากฎที่มีสินค้า **สองชิ้น** อยู่ทางซ้าย และตอบว่ามันบอกอะไรเพิ่มจากกฎชิ้นเดียว

# %% [solution]
try:
    from mlxtend.frequent_patterns import apriori, association_rules
    from mlxtend.preprocessing import TransactionEncoder

    te = TransactionEncoder()
    onehot = pd.DataFrame(te.fit_transform([list(b) for b in baskets]),
                          columns=te.columns_)

    freq = apriori(onehot, min_support=MIN_SUPPORT, use_colnames=True)
    ml_rules = association_rules(freq, metric="lift", min_threshold=1.0)

    check = ml_rules[
        (ml_rules.antecedents == frozenset({"ผ้าอ้อม"}))
        & (ml_rules.consequents == frozenset({"ผ้าเช็ดทำความสะอาด"}))
    ]
    print("ค่าจาก mlxtend")
    print(check[["support", "confidence", "lift", "leverage"]].to_string(index=False))
    print(f"\nค่าที่คำนวณเอง: support={best.support:.6f} "
          f"confidence={best.confidence:.6f} lift={best.lift:.6f}")

    two = ml_rules[ml_rules.antecedents.apply(len) == 2].sort_values("lift", ascending=False)
    print(f"\nกฎที่มีสินค้าสองชิ้นทางซ้าย: {len(two)} กฎ")
    if len(two):
        print(two.head(5)[["antecedents", "consequents", "support",
                           "confidence", "lift"]].to_string(index=False))
except ImportError:
    print("ไม่พบ mlxtend — บน Google Colab ให้รัน:  !pip install mlxtend")

print("""
กฎสองชิ้นทางซ้ายบอกอะไรเพิ่ม
-----------------------------
มันบอก 'บริบท' ที่กฎชิ้นเดียวบอกไม่ได้
เช่น A → C อาจมี lift 1.2 เฉย ๆ แต่ {A, B} → C อาจมี lift 3.0
แปลว่าความสัมพันธ์เกิดขึ้นเฉพาะเมื่อมี B อยู่ด้วย ซึ่งเปลี่ยนการกระทำไปคนละแบบ

ข้อควรระวัง: จำนวนกฎเติบโตแบบทวีคูณตามจำนวนสินค้าในเซต
ยิ่งกฎเยอะ ยิ่งมีโอกาสเจอกฎที่ 'บังเอิญดู' โดยไม่มีความหมายจริง
(ปัญหาการทดสอบหลายครั้ง) จึงต้องยืนยันด้วยการทดลองเสมอ ไม่ใช่ด้วย p-value
""")

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — support เดี่ยวถูกต้อง | 2 |
# | งานที่ 2 — สร้างกฎเองครบทั้งสี่เมตริก | 3 |
# | งานที่ 3 — วิเคราะห์กับดัก confidence ได้ครบทั้ง 3 ข้อ | 4 |
# | งานที่ 4 — เรียงตาม lift และอธิบายว่าเหตุใดกฎดีจึงถูกมองข้าม | 3 |
# | งานที่ 5 — ความสัมพันธ์เชิงลบที่ Apriori มองไม่เห็น | 4 |
# | งานที่ 6 — ประเมินมูลค่าและออกแบบการทดลอง | 3 |
# | งานที่ 7 — เทียบกับ mlxtend และกฎสองชิ้นทางซ้าย | 3 |
# | **รวม** | **22** |
#
# > 💡 ตัวเลขทุกตัวในสมุดเล่มนี้ต้องตรงกับที่แสดงบนสื่อจำลอง `/sims/lift-detective`
# > ถ้าไม่ตรง แปลว่ามีขั้นตอนใดขั้นตอนหนึ่งผิด — ให้ย้อนกลับไปตรวจก่อนส่ง
