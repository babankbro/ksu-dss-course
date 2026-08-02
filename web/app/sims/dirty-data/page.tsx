"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num, pctStr } from "@/lib/csv";

const RULE_KEYS = [
  "trim", "sku", "date", "customer", "dedup", "netfix", "returns", "store",
] as const;
type RuleKey = (typeof RULE_KEYS)[number];

const RULES: { key: RuleKey; label: string; dim: string; desc: string }[] = [
  { key: "trim", label: "ตัดช่องว่างและปรับตัวพิมพ์ให้เป็นมาตรฐาน", dim: "Consistency",
    desc: "` s-04 ` → `S-04` — ค่าที่ต่างกันแค่ช่องว่างจะกลายเป็นสมาชิกคนละตัวใน dimension" },
  { key: "sku", label: "รวมรหัสสินค้าให้เป็นรูปแบบเดียว", dim: "Consistency",
    desc: "`P101` และ `101` → `P-101` — แต่ละระบบต้นทางใช้รูปแบบของตัวเอง" },
  { key: "date", label: "แปลงวันที่ให้เป็นรูปแบบเดียว", dim: "Validity",
    desc: "รองรับทั้ง `2025-07-12` และ `12/07/2025` — ถ้าไม่แปลง Marketplace จะหายไปทั้งระบบ" },
  { key: "customer", label: "จัดการลูกค้าที่ไม่ระบุด้วย unknown member", dim: "Completeness",
    desc: "`\"\"`, `NULL`, `N/A` → `C-UNKNOWN` (key = 0) ไม่ใช่ทิ้งแถว เพราะยอดขายยังจริง" },
  { key: "dedup", label: "ตัดแถวซ้ำจากการ retry ของ pipeline", dim: "Uniqueness",
    desc: "txn_id ซ้ำกันทั้งแถว — เกิดตอนท่อข้อมูลรันซ้ำหลังล้มเหลว" },
  { key: "netfix", label: "ตรวจสูตร net = qty × price − discount", dim: "Accuracy",
    desc: "แถวที่ไม่ตรงสูตรถูกส่งไป etl_rejects ให้เจ้าของข้อมูลตรวจสอบ" },
  { key: "returns", label: "รวมวิธีบันทึกการคืนสินค้าให้เป็นแบบเดียว", dim: "Consistency",
    desc: "POS ใช้จำนวนติดลบ ส่วน APP/Marketplace ใช้ txn_type = RETURN" },
  { key: "store", label: "กักแถวที่อ้างสาขาซึ่งไม่มีในตารางอ้างอิง", dim: "Referential integrity",
    desc: "`S-99`, `TEMP` — ข้อมูลกำพร้าที่ join กับ dim_store ไม่ได้" },
];

type Cleaned = {
  accepted: number;
  rejected: number;
  netSales: number;
  orphanStore: number;
  orphanSku: number;
  unparsedDate: number;
  dupRemaining: number;
  missingCust: number;
  formulaBad: number;
};

const VALID_SKU = new Set(["P-101","P-102","P-103","P-201","P-202","P-203","P-301","P-302"]);
const VALID_STORE = new Set(["S-01","S-02","S-03","S-04","S-05","S-06","S-90"]);

function normSku(s: string): string {
  const t = s.trim().toUpperCase();
  if (VALID_SKU.has(t)) return t;
  const m = t.match(/^P?-?(\d{3})$/);
  return m ? `P-${m[1]}` : t;
}

function parseDate(s: string): string | null {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function runPipeline(rows: Row[], on: Set<RuleKey>): Cleaned {
  const seen = new Set<string>();
  const c: Cleaned = {
    accepted: 0, rejected: 0, netSales: 0, orphanStore: 0, orphanSku: 0,
    unparsedDate: 0, dupRemaining: 0, missingCust: 0, formulaBad: 0,
  };

  for (const r of rows) {
    // ---- Transform ----
    const store = on.has("trim") ? r.store_id.trim().toUpperCase() : r.store_id;
    const sku = on.has("sku") ? normSku(r.sku) : r.sku.trim();
    const dt = on.has("date") ? parseDate(r.txn_date) : (/^\d{4}-\d{2}-\d{2}$/.test(r.txn_date) ? r.txn_date : null);
    const cust = r.customer_id.trim();
    const custMissing = cust === "" || cust === "NULL" || cust === "N/A";

    // ---- Reject gates ----
    if (dt === null) { c.unparsedDate++; c.rejected++; continue; }

    if (on.has("dedup")) {
      if (seen.has(r.txn_id)) { c.rejected++; continue; }
      seen.add(r.txn_id);
    } else if (seen.has(r.txn_id)) {
      c.dupRemaining++;
      seen.add(r.txn_id);
    } else seen.add(r.txn_id);

    if (on.has("store") && !VALID_STORE.has(store)) { c.orphanStore++; c.rejected++; continue; }
    if (!on.has("store") && !VALID_STORE.has(store)) c.orphanStore++;

    if (!VALID_SKU.has(sku)) c.orphanSku++;

    const qty = num(r.quantity);
    const price = num(r.unit_price);
    const disc = num(r.discount);
    let net = num(r.net_amount);
    const expected = Math.round((Math.abs(qty) * price - disc) * 100) / 100;
    const mismatch = Math.abs(Math.abs(net) - expected) > 0.011;

    if (mismatch) {
      c.formulaBad++;
      if (on.has("netfix")) { c.rejected++; continue; }
    }

    if (custMissing && !on.has("customer")) c.missingCust++;

    // ---- การคืนสินค้า ----
    if (on.has("returns")) {
      // ทำให้ทุกระบบใช้ความหมายเดียวกัน: คืนสินค้า = ยอดติดลบ
      if (r.txn_type === "RETURN") net = -Math.abs(net);
      else net = qty < 0 ? -Math.abs(net) : Math.abs(net);
    }
    // ถ้าไม่เปิดกฎนี้ RETURN ของ APP/Marketplace จะถูกบวกเป็นยอดขาย

    c.netSales += net;
    c.accepted++;
  }
  return c;
}

export default function DirtyDataGauntlet() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [on, setOn] = useState<Set<RuleKey>>(new Set());

  useEffect(() => {
    loadCSV("/datasets/week03/sales_raw_dirty.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const all = useMemo(() => new Set<RuleKey>(RULE_KEYS), []);
  const truth = useMemo(() => (rows ? runPipeline(rows, all) : null), [rows, all]);
  const cur = useMemo(() => (rows ? runPipeline(rows, on) : null), [rows, on]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!rows || !truth || !cur)
    return <div className="card"><h2>กำลังโหลด sales_raw_dirty.csv …</h2><p className="muted">ไฟล์เดียวกับที่ใช้ใน Colab</p></div>;

  const toggle = (k: RuleKey) =>
    setOn((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const gap = cur.netSales - truth.netSales;
  const gapPct = gap / truth.netSales;
  const reconciled = Math.abs(gapPct) < 0.0005;

  const checks: { label: string; v: number; ok: boolean }[] = [
    { label: "วันที่แปลงไม่ได้ (ข้อมูลหายทั้งระบบต้นทาง)", v: cur.unparsedDate, ok: cur.unparsedDate === 0 },
    { label: "แถวซ้ำที่ยังอยู่ในผลลัพธ์", v: cur.dupRemaining, ok: cur.dupRemaining === 0 },
    { label: "รหัสสินค้าที่ join กับ ref_product ไม่ได้", v: cur.orphanSku, ok: cur.orphanSku === 0 },
    { label: "สาขาที่ join กับ ref_store ไม่ได้", v: cur.orphanStore, ok: cur.orphanStore === 0 || on.has("store") },
    { label: "แถวที่ผิดสูตร net amount", v: cur.formulaBad, ok: on.has("netfix") },
    { label: "ลูกค้าไม่ระบุที่ยังไม่ได้จัดการ", v: cur.missingCust, ok: on.has("customer") },
  ];

  return (
    <>
      <div className="pagehead">
        <h1>
          🧼 Dirty Data Gauntlet
          <small>เปิดกฎคุณภาพทีละข้อ แล้วดูยอดขายวิ่งเข้าหาค่าจริง — สัปดาห์ที่ 3</small>
        </h1>
        <div className="row">
          <div className="chip">กฎที่เปิด<b>{on.size} / 8</b></div>
          <div className="chip">
            สถานะกระทบยอด<b className={reconciled ? "pos" : "neg"}>{reconciled ? "ตรง ✓" : "ไม่ตรง"}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ร้านค้ารวมยอดขายจาก 3 ระบบต้นทาง (POS · Mobile App · Marketplace) เข้าคลังข้อมูลเดียวกัน
          ไฟล์ <code>sales_raw_dirty.csv</code> มี {baht(rows.length)} แถว และมีข้อบกพร่องฝังอยู่ 8 ชนิด
        </p>
        <p className="muted">
          เปิดกฎคุณภาพทีละข้อ สังเกตว่ายอดขายสุทธิเปลี่ยนไปอย่างไร และกฎข้อใดกระทบตัวเลขมากที่สุด
          เป้าหมายคือทำให้ <b>กระทบยอด (reconciliation) ผ่าน</b>
        </p>
      </div>

      <div className="dirtygrid">
        <div>
          <div className="card">
            <h2>🧾 กฎคุณภาพข้อมูล</h2>
            {RULES.map((r) => (
              <div key={r.key} className={`fault${on.has(r.key) ? " on-good" : ""}`} onClick={() => toggle(r.key)}>
                <div className="fault-head">
                  <span className={`sw${on.has(r.key) ? " on-good" : ""}`} />
                  <b>{r.label}</b>
                </div>
                <small className="muted">{r.desc}</small>
                <span className="apx">มิติคุณภาพ: {r.dim}</span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="mini" onClick={() => setOn(new Set(RULE_KEYS))}>เปิดทุกกฎ</button>
              <button className="mini" onClick={() => setOn(new Set())}>ปิดทุกกฎ</button>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>💰 การกระทบยอด (Reconciliation)</h2>
            <div className="kpis">
              <div className="kpi big">
                <span>ยอดขายสุทธิที่คำนวณได้</span>
                <b className={reconciled ? "pos" : "neg"}>{baht(cur.netSales, 2)} บาท</b>
              </div>
              <div className="kpi">
                <span>ต่างจากค่าจริง</span>
                <b className={reconciled ? "pos" : "neg"}>
                  {gap >= 0 ? "+" : "−"}{baht(Math.abs(gap), 2)}
                </b>
              </div>
              <div className="kpi">
                <span>คิดเป็น</span>
                <b className={reconciled ? "pos" : "neg"}>{pctStr(gapPct, 2)}</b>
              </div>
              <div className="kpi"><span>แถวที่รับเข้า</span><b>{baht(cur.accepted)}</b></div>
              <div className="kpi"><span>แถวที่ส่งไป etl_rejects</span><b>{baht(cur.rejected)}</b></div>
            </div>
            {reconciled ? (
              <div className="note good">
                <b>กระทบยอดผ่าน ✓</b> ยอดที่ได้ตรงกับค่าจริงที่คำนวณจากกฎครบทุกข้อ —
                นี่คือ “หลักฐาน” ที่ต้องแนบไปกับทุก data product ก่อนส่งมอบ
              </div>
            ) : (
              <div className="note warn">
                <b>ยังกระทบยอดไม่ผ่าน</b> — ผลต่าง {pctStr(gapPct, 2)}{" "}
                {gap > 0 ? "สูงเกินจริง (มักเกิดจากแถวซ้ำหรือการคืนสินค้าที่ถูกนับเป็นยอดขาย)"
                         : "ต่ำกว่าจริง (มักเกิดจากข้อมูลที่ถูกทิ้งไปโดยไม่ตั้งใจ)"}
              </div>
            )}
          </div>

          <div className="card">
            <h2>🔍 ข้อบกพร่องที่ยังเหลืออยู่</h2>
            <table>
              <thead><tr><th>รายการตรวจ</th><th>จำนวน</th><th>สถานะ</th></tr></thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.label}>
                    <td style={{ textAlign: "left" }}>{c.label}</td>
                    <td>{baht(c.v)}</td>
                    <td className={c.ok ? "pos" : "neg"}>{c.ok ? "✓ จัดการแล้ว" : "✗ ยังไม่จัดการ"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!on.has("date") && (
              <div className="note warn">
                <b>กฎที่ควรเปิดก่อนใครเพื่อน:</b> ตราบใดที่ยังไม่แปลงรูปแบบวันที่
                ข้อมูลจาก Marketplace ทั้งระบบจะถูกปฏิเสธทิ้ง — สังเกตว่าไม่มี error ใดๆ ปรากฏ
                รายงานยังออกได้ตามปกติ เพียงแต่<b>ขาดไปทั้งช่องทางการขาย</b>
              </div>
            )}
            {!on.has("returns") && on.has("dedup") && (
              <div className="note warn">
                <b>ความไม่สอดคล้องเชิงความหมาย:</b> รายการคืนสินค้าจาก App และ Marketplace
                ถูกบันทึกด้วย <code>txn_type = RETURN</code> แต่ยอดเป็นบวก
                ถ้าไม่รวมความหมายให้ตรงกัน การคืนสินค้าจะถูกนับเป็น<b>ยอดขาย</b>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week03/sales_raw_dirty.csv" download><button>⬇ sales_raw_dirty.csv</button></a>
          <a href="/datasets/week03/ref_product.csv" download><button>⬇ ref_product.csv</button></a>
          <a href="/datasets/week03/ref_store.csv" download><button>⬇ ref_store.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> เขียนกฎคุณภาพทั้ง 8 ข้อด้วย pandas · แยกแถวที่ไม่ผ่านไปตาราง{" "}
          <code>etl_rejects</code> พร้อมเหตุผล · สร้าง <code>etl_audit</code> ที่บันทึกจำนวนแถวเข้า-ออกทุกขั้น ·
          พิสูจน์ว่ายอดสุทธิตรงกับตัวเลข <b>{baht(truth.netSales, 2)} บาท</b> บนหน้านี้
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ลำดับที่ให้ผลดีที่สุดคือให้เปิดกฎ <b>ตัดแถวซ้ำ</b> ก่อน (ยอดลดลงชัดเจน เข้าใจง่าย)
          แล้วค่อยเปิด <b>แปลงรูปแบบวันที่</b> — นักศึกษาจะตกใจเมื่อเห็นว่ายอด<b>เพิ่มขึ้นมาก</b>
          เพราะข้อมูลทั้งช่องทาง Marketplace เพิ่งกลับเข้ามา จุดนี้ใช้สอนว่า
          “ข้อมูลที่หายไปเงียบๆ” อันตรายกว่าข้อมูลที่ผิดแบบเห็นได้ชัด
          เพราะรายงานยังออกได้ตามปกติและไม่มีใครเอะใจ
        </p>
      </div>
    </>
  );
}
