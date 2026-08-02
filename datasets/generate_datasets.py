#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สร้างชุดข้อมูลจำลองทั้งหมดของรายวิชา DSS สำหรับ Lab บน Google Colab

ใช้ตัวสุ่มแบบกำหนดเมล็ด (fixed seed) ผลจึงเหมือนกันทุกครั้งบนทุกเครื่อง
ทำให้เฉลยหน้าชั้นเรียนได้และตรวจงานนักศึกษาได้ด้วยตัวเลขที่แน่นอน

วิธีใช้:
    python datasets/generate_datasets.py

ใช้ไลบรารีมาตรฐานของ Python เท่านั้น ไม่ต้องติดตั้งอะไรเพิ่ม
"""
from __future__ import annotations

import csv
import math
import os
import random
from datetime import date, datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
SEED = 20260726


def out(*parts: str) -> str:
    """คืน path ปลายทางและสร้างโฟลเดอร์ให้เรียบร้อย"""
    p = os.path.join(HERE, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def write_csv(path: str, header: list[str], rows: list[list]) -> None:
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  ✓ {os.path.relpath(path, HERE):52s} {len(rows):>7,} แถว")


# ============================================================
# ข้อมูลอ้างอิงร่วม (ใช้ซ้ำข้ามหลายชุดข้อมูล)
# ============================================================

PRODUCTS = [
    # (sku, ชื่อ, หมวด, แบรนด์, ราคา)
    ("P-101", "น้ำผลไม้ดอยคำ 250ml", "เครื่องดื่ม", "ดอยคำ", 35.0),
    ("P-102", "ชาไทยหอม 350ml", "เครื่องดื่ม", "ชาไทยหอม", 28.0),
    ("P-103", "กาแฟดำเย็น 300ml", "เครื่องดื่ม", "ดอยคำ", 45.0),
    ("P-201", "น้ำยาถูพื้นคลีนพลัส 1L", "ของใช้ในบ้าน", "คลีนพลัส", 95.0),
    ("P-202", "น้ำยาล้างจานโฮมแคร์ 500ml", "ของใช้ในบ้าน", "โฮมแคร์", 120.0),
    ("P-203", "ถุงขยะคลีนพลัส 30 ใบ", "ของใช้ในบ้าน", "คลีนพลัส", 75.0),
    ("P-301", "พัดลมตั้งพื้นอีเล็คโทร", "เครื่องใช้ไฟฟ้า", "อีเล็คโทร", 2450.0),
    ("P-302", "หม้อหุงข้าวพาวเวอร์ซัน", "เครื่องใช้ไฟฟ้า", "พาวเวอร์ซัน", 3890.0),
]

STORES = [
    # (store_id, ชื่อสาขา, ช่องทาง, จังหวัด, ภูมิภาค)
    ("S-01", "สาขาสยาม", "หน้าร้าน", "กรุงเทพฯ", "ภาคกลาง"),
    ("S-02", "สาขานนทบุรี", "หน้าร้าน", "นนทบุรี", "ภาคกลาง"),
    ("S-03", "สาขาขอนแก่น", "หน้าร้าน", "ขอนแก่น", "ภาคอีสาน"),
    ("S-04", "สาขากาฬสินธุ์", "หน้าร้าน", "กาฬสินธุ์", "ภาคอีสาน"),
    ("S-05", "สาขาเชียงใหม่", "หน้าร้าน", "เชียงใหม่", "ภาคเหนือ"),
    ("S-06", "สาขาภูเก็ต", "หน้าร้าน", "ภูเก็ต", "ภาคใต้"),
    ("S-90", "ร้านค้าออนไลน์", "ออนไลน์", "กรุงเทพฯ", "ภาคกลาง"),
]

SEGMENTS = ["ทั่วไป", "สมาชิก", "สมาชิกพรีเมียม", "องค์กร"]


# ============================================================
# W3 · 3.1 Grain Detective — pos_receipt_lines.csv
# ============================================================

def gen_grain_detective() -> None:
    """
    ข้อมูลใบเสร็จที่ปน grain สามระดับไว้ในไฟล์เดียว:
      • ระดับใบเสร็จ (receipt)  — ยอดรวม ส่วนลดท้ายบิล
      • ระดับรายการ (line)      — สินค้าแต่ละชิ้น
      • ระดับการชำระ (payment)  — หนึ่งใบเสร็จจ่ายได้หลายวิธี

    ค่าระดับใบเสร็จถูก "ทำซ้ำ" ลงทุกแถว (denormalized) ซึ่งเป็นต้นเหตุของ
    การนับซ้ำเมื่อนักศึกษาเลือก grain ผิด — เป็นหัวใจของ Lab นี้
    """
    rng = random.Random(SEED + 31)
    rows = []
    start = date(2025, 1, 1)
    receipt_no = 700000

    for day_offset in range(120):
        d = start + timedelta(days=day_offset)
        # จำนวนใบเสร็จต่อวันแกว่งตามวันในสัปดาห์
        n_receipts = 55 + (25 if d.weekday() >= 5 else 0) + rng.randint(-8, 8)
        for _ in range(n_receipts):
            receipt_no += 1
            store = rng.choice(STORES)
            customer = f"C-{rng.randint(1000, 1400)}" if rng.random() > 0.18 else ""
            n_lines = rng.choices([1, 2, 3, 4, 5], weights=[35, 28, 18, 12, 7])[0]

            # --- คำนวณระดับใบเสร็จก่อน เพื่อนำไปทำซ้ำในทุกแถว ---
            lines = []
            for line_no in range(1, n_lines + 1):
                sku, _name, _cat, _brand, price = rng.choice(PRODUCTS)
                qty = rng.choices([1, 2, 3, 6], weights=[62, 24, 10, 4])[0]
                line_disc = round(price * qty * rng.choice([0, 0, 0, 0.05, 0.1]), 2)
                net = round(price * qty - line_disc, 2)
                lines.append((line_no, sku, qty, price, line_disc, net))

            gross = round(sum(l[5] for l in lines), 2)
            bill_disc = round(gross * (0.05 if rng.random() < 0.15 else 0.0), 2)
            receipt_total = round(gross - bill_disc, 2)

            # --- วิธีชำระเงิน: 1–2 วิธีต่อใบเสร็จ ---
            methods = ["เงินสด", "บัตรเครดิต", "พร้อมเพย์", "คูปอง"]
            n_pay = 1 if rng.random() > 0.12 else 2
            pays = rng.sample(methods, n_pay)
            if n_pay == 1:
                pay_amounts = [receipt_total]
            else:
                first = round(receipt_total * rng.choice([0.3, 0.5, 0.7]), 2)
                pay_amounts = [first, round(receipt_total - first, 2)]

            ts = datetime.combine(d, datetime.min.time()) + timedelta(
                hours=rng.randint(9, 20), minutes=rng.randint(0, 59)
            )

            # --- ปล่อยแถวออกมาแบบ cartesian: line × payment ---
            # นี่คือความผิดพลาดที่พบบ่อยจริงในไฟล์ export จากระบบ POS
            for (line_no, sku, qty, price, line_disc, net) in lines:
                for pay_idx, (method, amt) in enumerate(zip(pays, pay_amounts), start=1):
                    rows.append([
                        receipt_no, ts.strftime("%Y-%m-%d %H:%M:%S"), store[0], customer,
                        line_no, sku, qty, f"{price:.2f}", f"{line_disc:.2f}", f"{net:.2f}",
                        pay_idx, method, f"{amt:.2f}",
                        f"{gross:.2f}", f"{bill_disc:.2f}", f"{receipt_total:.2f}",
                    ])

    write_csv(
        out("week03", "pos_receipt_lines.csv"),
        ["receipt_no", "receipt_ts", "store_id", "customer_id",
         "line_no", "sku", "quantity", "unit_price", "line_discount", "line_net_amount",
         "payment_seq", "payment_method", "payment_amount",
         "receipt_gross", "receipt_bill_discount", "receipt_total"],
        rows,
    )


# ============================================================
# W3 · 3.2 Dirty Data Gauntlet — sales_raw_dirty.csv
# ============================================================

def gen_dirty_data() -> None:
    """
    ข้อมูลยอดขายดิบจาก 3 ระบบต้นทาง พร้อมข้อบกพร่อง 7 ชนิดที่ฝังไว้โดยเจตนา
    จำนวนของแต่ละชนิดถูกพิมพ์ออกมาตอนสร้าง เพื่อให้ผู้สอนใช้เป็นเฉลย
    """
    rng = random.Random(SEED + 32)
    rows = []
    start = date(2025, 6, 1)
    stats = {k: 0 for k in [
        "sku_variant", "date_format", "missing_customer", "duplicate",
        "net_mismatch", "negative_return", "unknown_store", "whitespace_case",
    ]}

    txn_id = 500000
    base_rows = []
    for day_offset in range(90):
        d = start + timedelta(days=day_offset)
        for _ in range(rng.randint(28, 46)):
            txn_id += 1
            source = rng.choices(["POS", "APP", "MARKETPLACE"], weights=[55, 30, 15])[0]
            sku, _n, _c, _b, price = rng.choice(PRODUCTS)
            store = rng.choice(STORES)
            qty = rng.choices([1, 2, 3, 6], weights=[60, 25, 11, 4])[0]
            disc = round(price * qty * rng.choice([0, 0, 0, 0.05, 0.1, 0.15]), 2)
            net = round(price * qty - disc, 2)
            cust = f"C-{rng.randint(1000, 1400)}"
            base_rows.append({
                "txn_id": f"T-{txn_id}", "source": source, "txn_date": d,
                "sku": sku, "store_id": store[0], "customer_id": cust,
                "quantity": qty, "unit_price": price, "discount": disc,
                "net_amount": net, "txn_type": "SALE",
            })

    # ---------- ฝังข้อบกพร่อง ----------
    for r in base_rows:
        # 1) รหัสสินค้าไม่เป็นมาตรฐานเดียวกันในแต่ละระบบต้นทาง
        if r["source"] == "APP":
            r["sku"] = r["sku"].replace("-", "")           # P-101 → P101
            stats["sku_variant"] += 1
        elif r["source"] == "MARKETPLACE":
            r["sku"] = r["sku"].split("-")[1]              # P-101 → 101
            stats["sku_variant"] += 1

        # 2) รูปแบบวันที่ต่างกันตามระบบต้นทาง
        if r["source"] == "MARKETPLACE":
            r["txn_date_s"] = r["txn_date"].strftime("%d/%m/%Y")
            stats["date_format"] += 1
        else:
            r["txn_date_s"] = r["txn_date"].strftime("%Y-%m-%d")

        # 3) ลูกค้าไม่ระบุ (ขายหน้าร้านแบบไม่สมัครสมาชิก)
        if rng.random() < 0.14:
            r["customer_id"] = rng.choice(["", "NULL", "N/A"])
            stats["missing_customer"] += 1

        # 4) ช่องว่างและตัวพิมพ์ไม่สม่ำเสมอ
        if rng.random() < 0.08:
            r["store_id"] = f" {r['store_id'].lower()} "
            stats["whitespace_case"] += 1

        # 5) net_amount ไม่ตรงกับสูตร qty × price − discount
        if rng.random() < 0.045:
            r["net_amount"] = round(r["net_amount"] * rng.choice([0.9, 1.1, 1.05]), 2)
            stats["net_mismatch"] += 1

        # 6) สาขาที่ไม่มีในตารางอ้างอิง (ข้อมูลกำพร้า)
        if rng.random() < 0.02:
            r["store_id"] = rng.choice(["S-99", "S-88", "TEMP"])
            stats["unknown_store"] += 1

    # 7) รายการคืนสินค้า — สองระบบใช้วิธีต่างกัน
    returns = []
    for r in rng.sample(base_rows, k=int(len(base_rows) * 0.05)):
        rr = dict(r)
        rr["txn_id"] = r["txn_id"] + "-R"
        if r["source"] == "POS":
            rr["quantity"] = -r["quantity"]                # ใช้จำนวนติดลบ
            rr["net_amount"] = -r["net_amount"]
            rr["txn_type"] = "SALE"
        else:
            rr["txn_type"] = "RETURN"                      # ใช้ประเภทรายการ
        returns.append(rr)
        stats["negative_return"] += 1
    base_rows.extend(returns)

    # 8) แถวซ้ำจากการ retry ของ pipeline
    dups = [dict(r) for r in rng.sample(base_rows, k=int(len(base_rows) * 0.035))]
    stats["duplicate"] = len(dups)
    base_rows.extend(dups)

    rng.shuffle(base_rows)
    for r in base_rows:
        rows.append([
            r["txn_id"], r["source"], r["txn_date_s"], r["sku"], r["store_id"],
            r["customer_id"], r["quantity"], f"{r['unit_price']:.2f}",
            f"{r['discount']:.2f}", f"{r['net_amount']:.2f}", r["txn_type"],
        ])

    write_csv(
        out("week03", "sales_raw_dirty.csv"),
        ["txn_id", "source_system", "txn_date", "sku", "store_id", "customer_id",
         "quantity", "unit_price", "discount", "net_amount", "txn_type"],
        rows,
    )
    print("     ข้อบกพร่องที่ฝังไว้ (เฉลยสำหรับผู้สอน):")
    for k, v in stats.items():
        print(f"       - {k:20s} {v:>6,}")

    # ตารางอ้างอิงสำหรับ join และตรวจข้อมูลกำพร้า
    write_csv(
        out("week03", "ref_product.csv"),
        ["sku", "product_name", "category", "brand", "list_price"],
        [[p[0], p[1], p[2], p[3], f"{p[4]:.2f}"] for p in PRODUCTS],
    )
    write_csv(
        out("week03", "ref_store.csv"),
        ["store_id", "store_name", "channel", "province", "region"],
        [list(s) for s in STORES],
    )


# ============================================================
# W3 · 3.4 ETL Pipeline Sim — daily_batches/*.csv
# ============================================================

def gen_etl_batches() -> None:
    """
    แฟ้มข้อมูลรายวัน 30 วัน สำหรับฝึก incremental load
      • วันที่ 12 : schema drift — เพิ่มคอลัมน์ channel และเปลี่ยนชื่อ amount → net_amount
      • วันที่ 18 : ข้อมูลมาช้า (late-arriving) ของวันที่ 16 และ 17 ปนมาด้วย
      • วันที่ 23 : ไฟล์ถูกส่งซ้ำทั้งไฟล์ (ทดสอบ idempotency)
      • วันที่ 27 : แฟ้มว่าง (ไม่มีข้อมูล แต่ไฟล์มีอยู่)
    """
    rng = random.Random(SEED + 34)
    start = date(2025, 9, 1)
    day_rows: dict[int, list[dict]] = {}
    txn_id = 900000

    for day in range(1, 31):
        d = start + timedelta(days=day - 1)
        rows = []
        n = 0 if day == 27 else rng.randint(40, 70)
        for _ in range(n):
            txn_id += 1
            sku, _n2, _c, _b, price = rng.choice(PRODUCTS)
            store = rng.choice(STORES)
            qty = rng.choices([1, 2, 3], weights=[70, 22, 8])[0]
            rows.append({
                "txn_id": f"B-{txn_id}", "txn_date": d.isoformat(),
                "sku": sku, "store_id": store[0], "channel": store[2],
                "quantity": qty, "amount": round(price * qty, 2),
            })
        day_rows[day] = rows

    # วันที่ 18 มีข้อมูลย้อนหลังของวันที่ 16 และ 17 ปนมา
    late = []
    for src_day in (16, 17):
        d = start + timedelta(days=src_day - 1)
        for _ in range(rng.randint(6, 12)):
            txn_id += 1
            sku, _n2, _c, _b, price = rng.choice(PRODUCTS)
            store = rng.choice(STORES)
            qty = rng.choices([1, 2, 3], weights=[70, 22, 8])[0]
            late.append({
                "txn_id": f"B-{txn_id}", "txn_date": d.isoformat(),
                "sku": sku, "store_id": store[0], "channel": store[2],
                "quantity": qty, "amount": round(price * qty, 2),
            })
    day_rows[18].extend(late)

    # วันที่ 23 ส่งซ้ำทั้งไฟล์ของวันที่ 22
    day_rows[23] = [dict(r) for r in day_rows[22]]

    total = 0
    for day in range(1, 31):
        rows = day_rows[day]
        if day < 12:
            header = ["txn_id", "txn_date", "sku", "store_id", "quantity", "amount"]
            data = [[r["txn_id"], r["txn_date"], r["sku"], r["store_id"],
                     r["quantity"], f"{r['amount']:.2f}"] for r in rows]
        else:
            # schema drift ตั้งแต่วันที่ 12 เป็นต้นไป
            header = ["txn_id", "txn_date", "sku", "store_id", "channel",
                      "quantity", "net_amount"]
            data = [[r["txn_id"], r["txn_date"], r["sku"], r["store_id"], r["channel"],
                     r["quantity"], f"{r['amount']:.2f}"] for r in rows]
        path = out("week03", "daily_batches", f"batch_{start + timedelta(days=day-1)}.csv")
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(header)
            w.writerows(data)
        total += len(data)
    print(f"  ✓ {'week03/daily_batches/ (30 ไฟล์)':52s} {total:>7,} แถว")
    print("     เหตุการณ์ที่ฝังไว้: schema drift วันที่ 12 · late-arriving วันที่ 18 "
          "· ส่งไฟล์ซ้ำวันที่ 23 · แฟ้มว่างวันที่ 27")


# ============================================================
# W4 · 4.1 Simpson's Paradox Lab — web_conversion.csv
# ============================================================

def gen_simpson() -> None:
    """
    ข้อมูล session ระดับรายการ ที่เมื่อรวมทั้งหมดแล้ว conversion rate เพิ่มขึ้น
    แต่เมื่อแยกตามอุปกรณ์ กลับ "ลดลงทั้งสองกลุ่ม" — ปรากฏการณ์ Simpson's Paradox

    ตัวเลขเป้าหมาย (คำนวณจากสัดส่วนที่กำหนดไว้ด้านล่าง):
      ก่อน:  Mobile 8,000 sessions @ 10% · Desktop 2,000 @ 40%  → รวม 16.0%
      หลัง:  Mobile 3,000 sessions @  9% · Desktop 7,000 @ 38%  → รวม 29.3%
    เหตุที่รวมเพิ่มทั้งที่ย่อยลดลง: สัดส่วน traffic ย้ายจาก Mobile ไป Desktop
    """
    rng = random.Random(SEED + 41)
    spec = [
        ("2025-Q1", "Mobile", 8000, 0.10),
        ("2025-Q1", "Desktop", 2000, 0.40),
        ("2025-Q2", "Mobile", 3000, 0.09),
        ("2025-Q2", "Desktop", 7000, 0.38),
    ]
    campaigns = ["โฆษณาโซเชียล", "อีเมล", "ค้นหา", "ตรงเข้าเว็บ"]
    rows = []
    sid = 0
    for period, device, n, rate in spec:
        base = date(2025, 1, 1) if period == "2025-Q1" else date(2025, 4, 1)
        n_conv = int(round(n * rate))
        flags = [1] * n_conv + [0] * (n - n_conv)
        rng.shuffle(flags)
        for i in range(n):
            sid += 1
            d = base + timedelta(days=rng.randint(0, 89))
            rows.append([
                f"S-{sid:06d}", period, d.isoformat(), device,
                rng.choice(campaigns),
                round(rng.uniform(0.5, 12.0), 1),   # นาทีที่อยู่บนเว็บ
                flags[i],
            ])
    rng.shuffle(rows)
    write_csv(
        out("week04", "web_conversion.csv"),
        ["session_id", "period", "session_date", "device", "campaign",
         "minutes_on_site", "converted"],
        rows,
    )
    print("     เฉลย: Mobile 10.0%→9.0% · Desktop 40.0%→38.0% · รวม 16.0%→29.3%")


# ============================================================
# W4 · 4.3 Time Intelligence Builder — sales_3years_daily.csv
# ============================================================

def gen_time_intelligence() -> None:
    """
    ยอดขายรายวัน 3 ปี มีฤดูกาล แนวโน้มขาขึ้น วันหยุดพิเศษ และช่วงผิดปกติ 1 ช่วง
    ใช้ฝึกเขียน YTD / MTD / YoY / rolling 12 เดือน ด้วย window functions
    """
    rng = random.Random(SEED + 43)
    rows = []
    start = date(2023, 1, 1)
    end = date(2025, 12, 31)
    d = start
    while d <= end:
        doy = d.timetuple().tm_yday
        season = 1 + 0.25 * math.sin((doy - 60) / 365 * 2 * math.pi)
        trend = 1 + 0.09 * ((d - start).days / 365)
        weekend = 1.35 if d.weekday() >= 5 else 1.0
        # เทศกาลสิ้นปีและสงกรานต์
        festive = 1.6 if (d.month == 12 and d.day >= 20) else (
            1.4 if (d.month == 4 and 10 <= d.day <= 16) else 1.0)
        # ช่วงผิดปกติ: ปิดปรับปรุงระบบ มิ.ย. 2024
        outage = 0.35 if (d.year == 2024 and d.month == 6 and 5 <= d.day <= 18) else 1.0
        noise = rng.uniform(0.88, 1.12)
        for store in STORES:
            regional = {"ภาคกลาง": 1.5, "ภาคอีสาน": 0.85,
                        "ภาคเหนือ": 0.9, "ภาคใต้": 0.8}[store[4]]
            amt = 38000 * season * trend * weekend * festive * outage * noise * regional
            rows.append([
                d.isoformat(), store[0], store[4],
                round(amt, 2), int(amt / rng.uniform(180, 320)),
            ])
        d += timedelta(days=1)
    write_csv(
        out("week04", "sales_3years_daily.csv"),
        ["sales_date", "store_id", "region", "net_amount", "transactions"],
        rows,
    )
    print("     เหตุการณ์ที่ฝังไว้: ระบบขัดข้อง 5–18 มิ.ย. 2024 (ยอดเหลือ 35%)")


# ============================================================
# W4 · 4.4 Metric Sprawl Arena — revenue_source.csv
# ============================================================

def gen_metric_sprawl() -> None:
    """
    ข้อมูลรายการขายที่มีองค์ประกอบครบสำหรับ "นิยามรายได้" 4 แบบ
    ทำให้แต่ละแผนกคำนวณตัวเลขออกมาต่างกันจากข้อมูลชุดเดียวกัน:

      บัญชี   : net_amount − returns − vat            (รายได้รับรู้ทางบัญชี)
      การขาย  : gross_amount                          (ยอดขายก่อนหักอะไรเลย)
      การตลาด : net_amount − returns                  (รวม vat แต่หักคืนสินค้า)
      ผู้บริหาร: net_amount − returns − vat − shipping (รายได้สุทธิหลังต้นทุนส่ง)
    """
    rng = random.Random(SEED + 44)
    rows = []
    start = date(2025, 1, 1)
    oid = 0
    for day_offset in range(365):
        d = start + timedelta(days=day_offset)
        for _ in range(rng.randint(18, 34)):
            oid += 1
            sku, _n, _c, _b, price = rng.choice(PRODUCTS)
            store = rng.choice(STORES)
            qty = rng.choices([1, 2, 3, 5], weights=[58, 26, 11, 5])[0]
            gross = round(price * qty, 2)
            disc = round(gross * rng.choice([0, 0, 0.05, 0.1, 0.2]), 2)
            net = round(gross - disc, 2)
            vat = round(net * 7 / 107, 2)
            shipping = round(rng.choice([0, 0, 35, 50, 80]), 2) if store[2] == "ออนไลน์" else 0.0
            returned = round(net * rng.choice([0, 0, 0, 0, 0, 1.0]), 2) if rng.random() < 0.06 else 0.0
            rows.append([
                f"O-{oid:06d}", d.isoformat(), store[0], store[2], sku, qty,
                f"{gross:.2f}", f"{disc:.2f}", f"{net:.2f}",
                f"{vat:.2f}", f"{shipping:.2f}", f"{returned:.2f}",
            ])
    write_csv(
        out("week04", "revenue_source.csv"),
        ["order_id", "order_date", "store_id", "channel", "sku", "quantity",
         "gross_amount", "discount", "net_amount", "vat_amount",
         "shipping_fee", "returned_amount"],
        rows,
    )


# ============================================================
# W5 · 5.1 Threshold Policy Studio — fraud_scored.csv
# ============================================================

def gen_fraud_scored() -> None:
    """
    ธุรกรรม 20,000 รายการ พร้อมคะแนนความเสี่ยงจากโมเดลที่ผ่านการฝึกแล้ว
    ใช้ฝึกกำหนด threshold policy ภายใต้ต้นทุนที่ไม่สมมาตรและเพดานกำลังคน

      อัตราการทุจริตจริง ~1.8% · ต้นทุน FN 8,000 บาท · FP 300 บาท
      ทีมตรวจสอบรับได้ไม่เกิน 120 เคส/วัน (ข้อมูล 60 วัน → 7,200 เคส)
    """
    rng = random.Random(SEED + 51)
    rows = []
    start = date(2025, 10, 1)
    n = 20000
    for i in range(n):
        is_fraud = rng.random() < 0.018
        # คะแนนจากโมเดลที่แยกสองกลุ่มได้ดีพอควรแต่ไม่สมบูรณ์แบบ
        if is_fraud:
            score = min(0.999, max(0.001, rng.betavariate(5.0, 2.2)))
        else:
            score = min(0.999, max(0.001, rng.betavariate(1.6, 9.0)))
        d = start + timedelta(days=rng.randint(0, 59))
        amount = round(math.exp(rng.gauss(7.2, 1.1)), 2)
        rows.append([
            f"TX-{100000+i}", d.isoformat(), f"{amount:.2f}",
            rng.choice(["ออนไลน์", "หน้าร้าน", "ต่างประเทศ", "ตู้เอทีเอ็ม"]),
            rng.choice(["มือถือ", "เว็บ", "บัตร", "สาขา"]),
            round(score, 4), int(is_fraud),
        ])
    rng.shuffle(rows)
    write_csv(
        out("week05", "fraud_scored.csv"),
        ["txn_id", "txn_date", "amount", "channel", "device", "risk_score", "is_fraud"],
        rows,
    )
    n_fraud = sum(r[6] for r in rows)
    print(f"     ทุจริตจริง {n_fraud:,} รายการ ({n_fraud/len(rows)*100:.2f}%) "
          f"· ต้นทุน FN 8,000 / FP 300 · เพดานตรวจสอบ 7,200 เคส")


# ============================================================
# W5 · 5.2 Leakage Hunter — loan_leaky.csv
# ============================================================

def gen_leaky_loans() -> None:
    """
    ข้อมูลคำขอสินเชื่อที่ฝัง data leakage ไว้ 3 แบบ:

      1) collection_calls  — จำนวนครั้งที่ทวงหนี้ (เกิดขึ้น "หลัง" อนุมัติแล้ว)
      2) account_status    — สถานะบัญชีปัจจุบัน (สะท้อนคำตอบโดยตรง)
      3) เรียงตามเวลา      — ถ้าสุ่มแบ่ง train/test จะได้ข้อมูลอนาคตมาอยู่ใน train

    คอลัมน์ที่ถูกต้องตามเวลาคือกลุ่มที่ลงท้ายด้วย _at_application
    """
    rng = random.Random(SEED + 52)
    rows = []
    start = date(2023, 1, 1)
    for i in range(12000):
        applied = start + timedelta(days=rng.randint(0, 1000))
        income = round(max(9000, rng.gauss(32000, 14000)), 2)
        debt_ratio = round(min(0.95, max(0.02, rng.gauss(0.38, 0.18))), 3)
        credit_hist = rng.randint(0, 240)
        age = rng.randint(21, 65)
        n_prev = rng.randint(0, 6)
        amount = round(rng.choice([50, 100, 150, 200, 300, 500]) * 1000, 2)

        # ความเสี่ยงที่แท้จริง ขึ้นกับตัวแปร ณ เวลายื่นคำขอเท่านั้น
        z = (-3.9 + 3.1 * debt_ratio - 0.000012 * income
             - 0.004 * credit_hist + 0.16 * n_prev + 0.000001 * amount)
        # แนวโน้มความเสี่ยงสูงขึ้นตามเวลา (population drift)
        z += 0.0009 * (applied - start).days
        p_default = 1 / (1 + math.exp(-z))
        default = 1 if rng.random() < p_default else 0

        # ---- ตัวแปรรั่ว: เกิดขึ้นหลังการอนุมัติ ----
        collection_calls = (rng.randint(3, 14) if default else rng.randint(0, 2))
        account_status = ("ค้างชำระ" if default else
                          rng.choice(["ปกติ", "ปกติ", "ปกติ", "ปิดบัญชีแล้ว"]))
        last_payment_days = (rng.randint(45, 180) if default else rng.randint(0, 30))

        rows.append([
            f"L-{20000+i}", applied.isoformat(),
            f"{income:.2f}", debt_ratio, credit_hist, age, n_prev, f"{amount:.2f}",
            rng.choice(["พนักงานประจำ", "ธุรกิจส่วนตัว", "อาชีพอิสระ", "ข้าราชการ"]),
            collection_calls, account_status, last_payment_days,
            default,
        ])
    rows.sort(key=lambda r: r[1])  # เรียงตามวันที่ยื่นคำขอ
    write_csv(
        out("week05", "loan_leaky.csv"),
        ["loan_id", "application_date",
         "income_at_application", "debt_ratio_at_application",
         "credit_history_months_at_application", "age_at_application",
         "prev_loans_at_application", "loan_amount_at_application",
         "occupation_at_application",
         "collection_calls", "account_status", "days_since_last_payment",
         "defaulted"],
        rows,
    )
    n_def = sum(r[-1] for r in rows)
    print(f"     ผิดนัดชำระ {n_def:,} ราย ({n_def/len(rows)*100:.1f}%) "
          f"· ตัวแปรรั่ว 3 ตัว · เรียงตามเวลาแล้ว")


# ============================================================
# W5 · 5.3 Decision Tree Grower — churn.csv
# ============================================================

def gen_churn() -> None:
    """
    ข้อมูลลูกค้าโทรคมนาคมสำหรับปลูกต้นไม้ตัดสินใจด้วยมือ
    ออกแบบให้มีโครงสร้างที่ต้นไม้จับได้ชัดเจน (มี interaction ระหว่างตัวแปร)
    เพื่อให้ค่า Information Gain ที่นักศึกษาคำนวณเองมีความหมาย
    """
    rng = random.Random(SEED + 53)
    rows = []
    for i in range(3000):
        contract = rng.choices(["รายเดือน", "1 ปี", "2 ปี"], weights=[52, 28, 20])[0]
        tenure = rng.randint(1, 72)
        monthly = round(rng.uniform(299, 1590), 2)
        support = rng.choices([0, 1, 2, 3, 4, 5], weights=[38, 24, 15, 11, 7, 5])[0]
        fiber = rng.random() < 0.45
        paperless = rng.random() < 0.6
        auto_pay = rng.random() < 0.55

        # โครงสร้างที่ฝังไว้: สัญญารายเดือน + อายุการใช้งานสั้น = เสี่ยงสูงมาก
        z = -1.9
        z += 1.9 if contract == "รายเดือน" else (-0.6 if contract == "1 ปี" else -1.5)
        z += -0.035 * tenure
        z += 0.0011 * monthly
        z += 0.28 * support
        z += 0.35 if fiber else 0
        z += -0.5 if auto_pay else 0.2
        p = 1 / (1 + math.exp(-z))
        churn = 1 if rng.random() < p else 0

        rows.append([
            f"CU-{10000+i}", contract, tenure, f"{monthly:.2f}", support,
            "ไฟเบอร์" if fiber else "ADSL",
            "ใช่" if paperless else "ไม่",
            "ใช่" if auto_pay else "ไม่",
            churn,
        ])
    write_csv(
        out("week05", "churn.csv"),
        ["customer_id", "contract_type", "tenure_months", "monthly_charge",
         "support_tickets", "internet_type", "paperless_billing",
         "auto_payment", "churned"],
        rows,
    )
    n_churn = sum(r[-1] for r in rows)
    print(f"     เลิกใช้บริการ {n_churn:,} ราย ({n_churn/len(rows)*100:.1f}%)")


# ============================================================
# W6 · 6.1 Segment Studio — customers_rfm.csv
# ============================================================

def gen_customers_rfm() -> None:
    """
    ลูกค้า 1,200 รายพร้อมค่า RFM สำหรับฝึกแบ่งกลุ่มด้วย K-Means

    ออกแบบให้ 'สเกลของตัวแปร' เป็นตัวชี้ขาด:
      recency  อยู่ในช่วง 3–420 วัน
      frequency อยู่ในช่วง 1–48 ครั้ง
      monetary อยู่ในช่วง 480–210,000 บาท   ← ช่วงกว้างกว่าตัวอื่นหลายพันเท่า

    ถ้าไม่ normalize ก่อน K-Means ระยะทางแบบยุคลิดจะถูก monetary กลืนทั้งหมด
    ผลลัพธ์จึงกลายเป็นการแบ่ง 'ช่วงยอดเงิน' เฉย ๆ ไม่ใช่การแบ่งพฤติกรรม

    กลุ่มแฝงที่ฝังไว้ 4 กลุ่ม โดยกลุ่ม 'ซื้อครั้งใหญ่ครั้งเดียว' จงใจให้มียอดเงิน
    ทับซ้อนกับกลุ่มแชมเปี้ยน แต่มีพฤติกรรมตรงข้ามกันสิ้นเชิง
    """
    rng = random.Random(SEED + 61)
    # (ชื่อกลุ่ม, จำนวน, recency, frequency, monetary)
    segments = [
        ("แชมเปี้ยน", 260, (3, 45), (18, 48), (42000, 185000)),
        ("ลูกค้าประจำ", 420, (20, 110), (7, 20), (7000, 42000)),
        ("หลับใหล", 380, (150, 420), (1, 5), (480, 6800)),
        ("ซื้อครั้งใหญ่ครั้งเดียว", 140, (95, 260), (1, 2), (52000, 210000)),
    ]
    rows = []
    i = 0
    for _name, count, r_rng, f_rng, m_rng in segments:
        for _ in range(count):
            recency = rng.randint(*r_rng)
            freq = rng.randint(*f_rng)
            monetary = round(rng.uniform(*m_rng), 2)
            rows.append([
                f"C-{30000+i}", recency, freq, f"{monetary:.2f}",
                rng.randint(max(recency, 60), 1500),
                rng.choice(["หน้าร้าน", "ออนไลน์", "แอปมือถือ"]),
            ])
            i += 1
    rng.shuffle(rows)
    write_csv(
        out("week06", "customers_rfm.csv"),
        ["customer_id", "recency_days", "frequency", "monetary",
         "tenure_days", "main_channel"],
        rows,
    )
    print("     4 กลุ่มแฝง · monetary กว้างกว่า frequency ราว 4,400 เท่า "
          "→ ไม่ normalize แล้วผลจะผิด")


# ============================================================
# W6 · 6.2 Lift Detective — baskets.csv
# ============================================================

BASKET_ITEMS = [
    "ถุงพลาสติก", "น้ำดื่ม", "ขนมปัง", "นมสด", "ไข่ไก่",
    "ผ้าอ้อม", "ผ้าเช็ดทำความสะอาด", "เบียร์", "มันฝรั่งทอด",
    "กาแฟสด", "ชาเขียว", "บะหมี่กึ่งสำเร็จรูป", "ผงซักฟอก", "แชมพู",
]


def gen_baskets() -> None:
    """
    ตะกร้าสินค้า 5,000 ใบ ที่ฝังกฎไว้ 4 แบบเพื่อสอนการอ่านค่า lift

      1) กฎจริง       ผ้าอ้อม → ผ้าเช็ดทำความสะอาด   lift สูงชัดเจน
      2) กฎกรณีศึกษา  ผ้าอ้อม → เบียร์                lift ราว 2 ตามตำนาน
      3) กับดัก       อะไรก็ตาม → ถุงพลาสติก          confidence สูงมาก แต่ lift ≈ 1
                      เพราะถุงพลาสติกอยู่ในเกือบทุกตะกร้าอยู่แล้ว
      4) สินค้าทดแทน  กาแฟสด → ชาเขียว                lift < 1 (ซื้ออย่างหนึ่งแล้วไม่ซื้ออีกอย่าง)
    """
    rng = random.Random(SEED + 62)
    rows = []
    n_tx = 5000
    start = date(2025, 7, 1)

    for i in range(n_tx):
        basket: set[str] = set()

        # สินค้าพื้นฐานที่ใครก็หยิบ — ทำให้ถุงพลาสติกกลายเป็นกับดักของ confidence
        if rng.random() < 0.82:
            basket.add("ถุงพลาสติก")
        for item, p in [("น้ำดื่ม", 0.34), ("ขนมปัง", 0.26), ("นมสด", 0.24),
                        ("ไข่ไก่", 0.22), ("มันฝรั่งทอด", 0.18),
                        ("บะหมี่กึ่งสำเร็จรูป", 0.20), ("ผงซักฟอก", 0.14),
                        ("แชมพู", 0.12)]:
            if rng.random() < p:
                basket.add(item)

        # กลุ่มพ่อแม่ลูกอ่อน — ต้นตอของกฎที่มีความหมายจริง
        if rng.random() < 0.12:
            basket.add("ผ้าอ้อม")
            if rng.random() < 0.68:
                basket.add("ผ้าเช็ดทำความสะอาด")
            if rng.random() < 0.34:
                basket.add("เบียร์")
        else:
            if rng.random() < 0.06:
                basket.add("ผ้าเช็ดทำความสะอาด")
            if rng.random() < 0.16:
                basket.add("เบียร์")

        # กาแฟกับชาเขียวเป็นสินค้าทดแทนกัน — เลือกอย่างใดอย่างหนึ่ง
        drink = rng.random()
        if drink < 0.22:
            basket.add("กาแฟสด")
        elif drink < 0.40:
            basket.add("ชาเขียว")

        if not basket:
            basket.add(rng.choice(BASKET_ITEMS))

        d = start + timedelta(days=rng.randint(0, 89))
        for item in sorted(basket):
            rows.append([f"T-{200000+i}", d.isoformat(), item])

    write_csv(
        out("week06", "baskets.csv"),
        ["transaction_id", "txn_date", "item"],
        rows,
    )
    print(f"     {n_tx:,} ตะกร้า · ฝังกฎจริง 2 ข้อ · กับดัก confidence 1 ข้อ "
          f"· สินค้าทดแทน 1 คู่")


# ============================================================
# W6 · 6.3 Cluster Reality Check — no_structure.csv
# ============================================================

def gen_no_structure() -> None:
    """
    จุดข้อมูล 900 จุดที่สุ่มกระจายสม่ำเสมอใน 3 มิติ — 'ไม่มีกลุ่มอยู่จริงเลย'

    ใช้พิสูจน์ว่า K-Means จะคืนกลุ่มมาให้เสมอไม่ว่าข้อมูลจะมีโครงสร้างหรือไม่
    และค่า silhouette ที่ได้ (ราว 0.3) สูงพอที่นักศึกษาจำนวนมากจะยอมรับ

    ใช้ชื่อคอลัมน์เดียวกับ customers_rfm.csv เพื่อให้สลับชุดข้อมูลได้ทันที
    โดยไม่ต้องแก้โค้ดแม้แต่บรรทัดเดียว
    """
    rng = random.Random(SEED + 63)
    rows = []
    for i in range(900):
        rows.append([
            f"N-{40000+i}",
            rng.randint(3, 420),
            rng.randint(1, 48),
            f"{rng.uniform(480, 210000):.2f}",
        ])
    write_csv(
        out("week06", "no_structure.csv"),
        ["customer_id", "recency_days", "frequency", "monetary"],
        rows,
    )
    print("     ไม่มีโครงสร้างใด ๆ — ใช้เป็นกลุ่มควบคุมของการแบ่งกลุ่ม")


# ============================================================

def main() -> None:
    print("สร้างชุดข้อมูลจำลองของรายวิชา DSS")
    print("=" * 70)
    print("\n[Week 03] Data Management & Data Warehouse")
    gen_grain_detective()
    gen_dirty_data()
    gen_etl_batches()

    print("\n[Week 04] OLAP")
    gen_simpson()
    gen_time_intelligence()
    gen_metric_sprawl()

    print("\n[Week 05] Data Mining I")
    gen_fraud_scored()
    gen_leaky_loans()
    gen_churn()

    print("\n[Week 06] Data Mining II")
    gen_customers_rfm()
    gen_baskets()
    gen_no_structure()

    print("\n" + "=" * 70)
    print("เสร็จสิ้น — ชุดข้อมูลทั้งหมดถูกสร้างด้วย seed คงที่ ผลจึงเหมือนกันทุกครั้ง")


if __name__ == "__main__":
    main()
