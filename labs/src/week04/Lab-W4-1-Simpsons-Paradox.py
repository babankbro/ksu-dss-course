# %% [markdown]
# # 🎭 Lab W4-1 — Simpson's Paradox
#
# **รายวิชาระบบสนับสนุนการตัดสินใจ · สัปดาห์ที่ 4 — OLAP and Multidimensional Analysis**
#
# Lab นี้ใช้คู่กับสื่อจำลอง **Simpson's Paradox Lab** (`/sims/simpson-paradox`)
# ตัวเลขที่คุณคำนวณได้ในสมุดเล่มนี้ต้องตรงกับตัวเลขบนหน้าจอสื่อจำลองทุกหลัก
#
# ## สิ่งที่จะได้เรียนรู้
# 1. อธิบายได้ว่า **aggregation trap** เกิดขึ้นได้อย่างไรทั้งที่ข้อมูลถูกต้องทุกแถว
# 2. ระบุ **confounder** ที่ทำให้ตัวเลขรวมเล่าเรื่องตรงข้ามกับกลุ่มย่อย
# 3. คำนวณ **direct standardization** เพื่อตัดผลของส่วนผสมออกจากการเปรียบเทียบ
# 4. เขียนกฎการ drill-down ที่ควรบังคับใช้ก่อนอนุมัติงบจากตัวเลขรวม
#
# ## ข้อมูล
# `web_conversion.csv` — session ของเว็บไซต์ 20,000 รายการ ใน 2 ไตรมาส

# %%
import pandas as pd

pd.set_option("display.float_format", lambda v: f"{v:,.4f}")

URL = ("https://raw.githubusercontent.com/babankbro/ksu-dss-course/"
       "master/datasets/week04/web_conversion.csv")
df = pd.read_csv(URL)

print(f"จำนวน session : {len(df):,}")
print(f"ไตรมาส        : {sorted(df.period.unique())}")
print(f"อุปกรณ์       : {sorted(df.device.unique())}")
print(f"แคมเปญ        : {sorted(df.campaign.unique())}")
df.head(5)

# %% [markdown]
# ## ส่วนที่ 1 — รายงานที่ผู้บริหารได้รับ
#
# ทีมการตลาดส่งรายงานหน้าเดียว: *"conversion rate ไตรมาส 2 ดีขึ้นชัดเจน ขออนุมัติงบเพิ่ม"*
#
# ก่อนอื่นให้ตรวจว่าตัวเลขในรายงานนั้นถูกต้องจริงหรือไม่

# %%
overall = df.groupby("period").converted.agg(conversions="sum", sessions="size")
overall["rate"] = overall.conversions / overall.sessions

print(overall.assign(rate_pct=lambda d: (d.rate * 100).round(2)).to_string())

delta = (overall.rate["2025-Q2"] - overall.rate["2025-Q1"]) * 100
print(f"\nเปลี่ยนแปลง: {delta:+.1f} จุดเปอร์เซ็นต์")

# %% [markdown]
# > **ตัวเลขในรายงานถูกต้องทุกหลัก** — 16.00% → 29.30% เพิ่มขึ้นจริง 13.3 จุด
# >
# > ไม่มีแถวใดผิด ไม่มีข้อมูลใดหาย ไม่มีสูตรใดพัง
# > ถ้าหยุดอ่านตรงนี้ งบประมาณจะถูกอนุมัติ

# %% [task]
# ### 🧑‍💻 งานที่ 1
# Drill-down ตามมิติ `device` แล้วสร้างตารางที่มี
# จำนวน session · จำนวน conversion · อัตรา ของแต่ละคู่ (ไตรมาส × อุปกรณ์)
#
# จากนั้นคำนวณว่าอัตราของ **แต่ละอุปกรณ์** เปลี่ยนไปกี่จุดเปอร์เซ็นต์
#
# *เฉลยที่ถูกต้อง: Mobile 10.0% → 9.0% (−1.0 จุด) · Desktop 40.0% → 38.0% (−2.0 จุด)*

# %% [solution]
dev = df.groupby(["period", "device"]).converted.agg(conversions="sum", sessions="size")
dev["rate_pct"] = dev.conversions / dev.sessions * 100

print(dev.to_string())

pivot = dev.rate_pct.unstack("period")
pivot["change_pts"] = pivot["2025-Q2"] - pivot["2025-Q1"]
print("\nการเปลี่ยนแปลงรายอุปกรณ์ (จุดเปอร์เซ็นต์)")
print(pivot.to_string())

print(f"\nรวมทุกอุปกรณ์: {delta:+.1f} จุด  ← สวนทางกับทั้งสองกลุ่มย่อย")

# %% [markdown]
# > **นี่คือ Simpson's Paradox**
# >
# > ทั้งสองข้อความเป็นความจริงพร้อมกัน:
# > * "conversion rate ลดลงในทุกกลุ่มอุปกรณ์"
# > * "conversion rate รวมเพิ่มขึ้น 13.3 จุด"
# >
# > ข้อความที่สองไม่ได้โกหก แต่มันตอบคนละคำถามกับที่ผู้บริหารคิดว่ากำลังถาม

# %% [markdown]
# ## ส่วนที่ 2 — หา confounder ให้เจอ
#
# ถ้าอัตราของทุกกลุ่มลดลง แต่ค่าเฉลี่ยถ่วงน้ำหนักกลับเพิ่ม
# แปลว่า **น้ำหนัก** ต้องเปลี่ยน — ไม่ใช่ตัวอัตรา

# %% [task]
# ### 🧑‍💻 งานที่ 2
# คำนวณ **สัดส่วนของ session ในแต่ละอุปกรณ์** ของแต่ละไตรมาส (รวมกันได้ 100% ต่อไตรมาส)
# แล้วอธิบายเป็นข้อความว่าเหตุใดสัดส่วนนี้จึงทำให้ตัวเลขรวมพลิกทิศ

# %% [solution]
mix = df.groupby(["period", "device"]).size().unstack("device")
mix_pct = mix.div(mix.sum(axis=1), axis=0) * 100

print("จำนวน session")
print(mix.to_string())
print("\nสัดส่วน session (%)")
print(mix_pct.round(2).to_string())

print("""
คำอธิบาย
--------
Desktop มีอัตราสูงกว่า Mobile ราว 4 เท่า (40% เทียบ 10%) มาตลอด
ไตรมาส 1 traffic เป็น Mobile ถึง 80% ค่าเฉลี่ยรวมจึงถูกดึงลงใกล้ค่าของ Mobile
ไตรมาส 2 traffic กลับกันเป็น Desktop 70% ค่าเฉลี่ยรวมจึงถูกดึงขึ้นใกล้ค่าของ Desktop

ตัวเลขรวมที่ดีขึ้นจึงสะท้อน "ส่วนผสมของ traffic ที่เปลี่ยนไป"
ไม่ได้สะท้อน "ประสิทธิภาพของเว็บไซต์ที่ดีขึ้น" ซึ่งเป็นสิ่งที่ผู้บริหารคิดว่ากำลังวัดอยู่
""")

# %% [markdown]
# ## ส่วนที่ 3 — ไม่ใช่ทุกมิติจะเป็น confounder
#
# นักศึกษาจำนวนมากสรุปว่า "ถ้าเจอ paradox ให้ drill-down ทุกมิติ"
# ลองทดสอบกับมิติ `campaign` ดูว่าได้ผลเหมือนกันหรือไม่

# %% [task]
# ### 🧑‍💻 งานที่ 3
# ทำแบบเดียวกับงานที่ 1 แต่เปลี่ยนมิติเป็น `campaign`
# แล้วตอบว่า `campaign` เป็น confounder ของกรณีนี้หรือไม่ พร้อมเหตุผลที่อ้างอิงตัวเลข

# %% [solution]
camp = df.groupby(["period", "campaign"]).converted.agg(conversions="sum", sessions="size")
camp["rate_pct"] = camp.conversions / camp.sessions * 100

cp = camp.rate_pct.unstack("period")
cp["change_pts"] = cp["2025-Q2"] - cp["2025-Q1"]
print("อัตราแยกตามแคมเปญ (%)")
print(cp.round(2).to_string())

cmix = df.groupby(["period", "campaign"]).size().unstack("campaign")
print("\nสัดส่วน session แยกตามแคมเปญ (%)")
print((cmix.div(cmix.sum(axis=1), axis=0) * 100).round(2).to_string())

print("""
คำตอบ: campaign ไม่ใช่ confounder ของกรณีนี้
--------------------------------------------
1. อัตราของทุกแคมเปญ "เพิ่มขึ้น" ในทิศเดียวกับตัวเลขรวม ไม่ได้สวนทาง
2. สัดส่วน session ของแต่ละแคมเปญแทบไม่เปลี่ยนเลยระหว่างสองไตรมาส (ราว 25% เท่ากันหมด)

มิติจะเป็น confounder ได้ต้องเข้าเงื่อนไข 2 ข้อพร้อมกัน
  (ก) มันสัมพันธ์กับ "ผลลัพธ์" — กลุ่มต่าง ๆ ต้องมีอัตราต่างกันจริง
  (ข) มันสัมพันธ์กับ "ช่วงเวลา/กลุ่มที่เปรียบเทียบ" — สัดส่วนของกลุ่มต้องเปลี่ยนไป

device เข้าทั้งสองข้อ · campaign ไม่เข้าเลยสักข้อ
""")

# %% [markdown]
# ## ส่วนที่ 4 — Direct standardization: ตัดผลของส่วนผสมออก
#
# วิธีมาตรฐานในการเปรียบเทียบสองช่วงเวลาที่มีส่วนผสมต่างกัน คือ
# **ตรึงส่วนผสมไว้ให้เท่ากัน** แล้วเทียบเฉพาะอัตรา

# %% [task]
# ### 🧑‍💻 งานที่ 4
# คำนวณ **อัตรารวมของไตรมาส 2 ถ้าส่วนผสมอุปกรณ์ยังเป็นแบบไตรมาส 1**
#
# สูตร: `Σ (สัดส่วนอุปกรณ์ของ Q1 × อัตราของอุปกรณ์นั้นใน Q2)`
#
# แล้วเทียบกับอัตราจริงของไตรมาส 1 ว่าห่างกันกี่จุด
#
# *เฉลยที่ถูกต้อง: 14.80% เทียบกับ 16.00% คือ **แย่ลง 1.2 จุด***

# %% [solution]
w_q1 = mix_pct.loc["2025-Q1"] / 100          # น้ำหนักของไตรมาส 1
r_q2 = dev.rate_pct.unstack("device").loc["2025-Q2"] / 100   # อัตราของไตรมาส 2

standardized = float((w_q1 * r_q2).sum()) * 100

print(f"อัตราจริง Q1                        : {overall.rate['2025-Q1']*100:>6.2f}%")
print(f"อัตราจริง Q2 (ส่วนผสมเปลี่ยน)        : {overall.rate['2025-Q2']*100:>6.2f}%")
print(f"อัตรา Q2 ถ้าใช้ส่วนผสมของ Q1          : {standardized:>6.2f}%")
print(f"\nข้อสรุปที่ถูกต้อง: {standardized - overall.rate['2025-Q1']*100:+.2f} จุด → ประสิทธิภาพแย่ลง")

# ทำกลับทางเพื่อยืนยันว่าไม่ใช่ผลของการเลือกฐาน
w_q2 = mix_pct.loc["2025-Q2"] / 100
r_q1 = dev.rate_pct.unstack("device").loc["2025-Q1"] / 100
print(f"\n(ตรวจทาน) อัตรา Q1 ถ้าใช้ส่วนผสมของ Q2: {float((w_q2*r_q1).sum())*100:.2f}%")
print(f"          เทียบกับอัตราจริงของ Q2      : {overall.rate['2025-Q2']*100:.2f}%")
print("          → ไม่ว่าจะตรึงส่วนผสมของไตรมาสใด ข้อสรุปก็คือ Q2 แย่ลง")

# %% [markdown]
# ## ส่วนที่ 5 — จุดพลิกอยู่ตรงไหน
#
# สื่อจำลองมีแถบเลื่อนให้ปรับสัดส่วน Desktop ของไตรมาส 2
# ให้หาจุดที่ทำให้ตัวเลขรวมเลิกโกหกด้วยพีชคณิต

# %% [task]
# ### 🧑‍💻 งานที่ 5
# หาสัดส่วน Desktop ของไตรมาส 2 (เรียกว่า `p`) ที่ทำให้
# **อัตรารวมของ Q2 เท่ากับอัตรารวมของ Q1 พอดี** โดยตรึงอัตรารายอุปกรณ์ของ Q2 ไว้
#
# แก้สมการ: `p × rate_desktop_Q2 + (1 − p) × rate_mobile_Q2 = rate_รวม_Q1`
#
# *เฉลยที่ถูกต้อง: p ≈ 24.14% — เทียบกับค่าจริงที่ 70%*

# %% [solution]
rd = r_q2["Desktop"]
rm = r_q2["Mobile"]
target = overall.rate["2025-Q1"]

p = (target - rm) / (rd - rm)

print(f"อัตรา Desktop ใน Q2 : {rd*100:.2f}%")
print(f"อัตรา Mobile ใน Q2  : {rm*100:.2f}%")
print(f"อัตราเป้าหมาย (=Q1) : {target*100:.2f}%")
print(f"\nจุดพลิก p = {p*100:.2f}%   (สัดส่วน Desktop จริงของ Q2 = {mix_pct.loc['2025-Q2','Desktop']:.2f}%)")
print(f"\nแปลว่า: ถ้า traffic Desktop ของ Q2 มีเพียง {p*100:.2f}% ตัวเลขรวมจะไม่ดีขึ้นเลย")
print("ส่วนที่เกินจากนั้นทั้งหมดคือ 'กำไรจากส่วนผสม' ไม่ใช่กำไรจากประสิทธิภาพ")

# %% [markdown]
# ## ส่วนที่ 6 — เขียนกฎที่บังคับใช้ได้จริง

# %% [task]
# ### 🧑‍💻 งานที่ 6 (เขียนเป็นข้อความ)
#
# 1. เขียน **กฎการอนุมัติ** 1 ประโยค ที่องค์กรควรบังคับใช้กับรายงานเปรียบเทียบทุกฉบับ
#    เพื่อไม่ให้เหตุการณ์นี้เกิดซ้ำ
# 2. รายงานฉบับนี้ควรมี **มิติใดบ้าง** ปรากฏอยู่เป็นอย่างน้อย และเพราะเหตุใด
# 3. ถ้าคุณเป็นผู้ออกแบบ dashboard คุณจะ**บังคับ**ให้ผู้อ่านเห็นการ drill-down ได้อย่างไร
#    โดยไม่ต้องพึ่งวินัยของผู้อ่าน
# 4. ยกตัวอย่างอีก 1 กรณีในธุรกิจไทยที่ Simpson's paradox น่าจะเกิดขึ้นได้
#    พร้อมระบุว่าอะไรคือ confounder

# %% [solution]
# ตัวอย่างคำตอบข้อ 3 — เขียนเป็นฟังก์ชันตรวจอัตโนมัติที่ใส่ในไปป์ไลน์รายงานได้


def simpson_check(data, outcome, period_col, dims, periods):
    """เตือนเมื่อทิศทางของตัวเลขรวมสวนทางกับทุกกลุ่มย่อยของมิติใดมิติหนึ่ง"""
    a, b = periods
    tot = data.groupby(period_col)[outcome].mean()
    overall_up = tot[b] > tot[a]
    alerts = []

    for dim in dims:
        r = data.groupby([period_col, dim])[outcome].mean().unstack(period_col)
        if a not in r or b not in r:
            continue
        sub_up = (r[b] > r[a])
        if sub_up.nunique() == 1 and bool(sub_up.iloc[0]) != overall_up:
            alerts.append(dim)

    if alerts:
        print(f"🚨 พบสัญญาณ Simpson's paradox ที่มิติ: {', '.join(alerts)}")
        print("   ห้ามเผยแพร่รายงานนี้ก่อนแนบผลการ drill-down")
    else:
        print("✓ ไม่พบการสวนทางของทิศทางในมิติที่ตรวจ")
    return alerts


simpson_check(df, "converted", "period", ["device", "campaign"], ("2025-Q1", "2025-Q2"))

# %% [markdown]
# ---
# ## ✅ เกณฑ์การส่งงาน
#
# | องค์ประกอบ | คะแนน |
# |---|:--:|
# | งานที่ 1 — drill-down และแสดงการสวนทางได้ถูกต้อง | 2 |
# | งานที่ 2 — ระบุและอธิบาย confounder ด้วยตัวเลข | 2 |
# | งานที่ 3 — พิสูจน์ได้ว่า campaign ไม่ใช่ confounder พร้อมเงื่อนไข 2 ข้อ | 3 |
# | งานที่ 4 — direct standardization ถูกต้องทั้งสองทิศ | 3 |
# | งานที่ 5 — หาจุดพลิกด้วยพีชคณิตได้ | 2 |
# | งานที่ 6 — กฎการอนุมัติและตัวอย่างที่สมเหตุสมผล | 3 |
# | **รวม** | **15** |
#
# > 💡 ตัวเลขทุกตัวในสมุดเล่มนี้ต้องตรงกับที่แสดงบนสื่อจำลอง `/sims/simpson-paradox`
# > ถ้าไม่ตรง แปลว่ามีขั้นตอนใดขั้นตอนหนึ่งผิด — ให้ย้อนกลับไปตรวจก่อนส่ง
