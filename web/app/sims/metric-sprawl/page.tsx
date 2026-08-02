"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";

/** องค์ประกอบที่เลือกใส่หรือไม่ใส่ในนิยาม "รายได้" */
type Comp = "base" | "returns" | "vat" | "shipping";

const DEPARTMENTS: { name: string; icon: string; comps: Set<Comp>; base: "gross" | "net"; why: string }[] = [
  { name: "ฝ่ายขาย", icon: "💼", base: "gross", comps: new Set(),
    why: "วัดผลงานทีมขายจากยอดที่ปิดได้ ยังไม่หักอะไรเลย" },
  { name: "ฝ่ายการตลาด", icon: "📣", base: "net", comps: new Set(["returns"]),
    why: "หักคืนสินค้าเพราะแคมเปญที่ทำให้ลูกค้าคืนของไม่ถือว่าสำเร็จ แต่ยังไม่แยก VAT" },
  { name: "ฝ่ายบัญชี", icon: "🧾", base: "net", comps: new Set(["returns", "vat"]),
    why: "รายได้ที่รับรู้ทางบัญชีต้องไม่รวมภาษีมูลค่าเพิ่มที่เก็บแทนรัฐ" },
  { name: "ผู้บริหาร", icon: "👔", base: "net", comps: new Set(["returns", "vat", "shipping"]),
    why: "สนใจเงินที่เหลือเข้าบริษัทจริงหลังหักค่าขนส่งที่บริษัทออกให้" },
];

const COMP_LABEL: Record<Comp, string> = {
  base: "ยอดขาย", returns: "หักคืนสินค้า", vat: "หัก VAT", shipping: "หักค่าขนส่ง",
};

export default function MetricSprawl() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState<{ base: "gross" | "net"; comps: Set<Comp> }>({
    base: "net", comps: new Set<Comp>(),
  });
  const [governed, setGoverned] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week04/revenue_source.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const sums = useMemo(() => {
    if (!rows) return null;
    let gross = 0, net = 0, vat = 0, ship = 0, ret = 0;
    for (const r of rows) {
      gross += num(r.gross_amount); net += num(r.net_amount);
      vat += num(r.vat_amount); ship += num(r.shipping_fee); ret += num(r.returned_amount);
    }
    return { gross, net, vat, ship, ret };
  }, [rows]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!rows || !sums) return <div className="card"><h2>กำลังโหลด revenue_source.csv …</h2></div>;

  const calc = (base: "gross" | "net", comps: Set<Comp>) => {
    let v = base === "gross" ? sums.gross : sums.net;
    if (comps.has("returns")) v -= sums.ret;
    if (comps.has("vat")) v -= sums.vat;
    if (comps.has("shipping")) v -= sums.ship;
    return v;
  };

  const deptValues = DEPARTMENTS.map((d) => ({ ...d, value: calc(d.base, d.comps) }));
  const vals = deptValues.map((d) => d.value);
  const hi = Math.max(...vals), lo = Math.min(...vals);
  const spread = (hi / lo - 1) * 100;

  // นิยามกลางที่ semantic layer บังคับใช้ = นิยามของฝ่ายบัญชี
  const canonical = calc("net", new Set(["returns", "vat"]));

  const toggle = (c: Comp) =>
    setMine((m) => {
      const s = new Set(m.comps);
      s.has(c) ? s.delete(c) : s.add(c);
      return { ...m, comps: s };
    });

  const myValue = calc(mine.base, mine.comps);
  const match = DEPARTMENTS.find(
    (d) => d.base === mine.base &&
      [...d.comps].sort().join() === [...mine.comps].sort().join()
  );

  return (
    <>
      <div className="pagehead">
        <h1>
          🏷️ Metric Sprawl Arena
          <small>ข้อมูลชุดเดียว 4 แผนก 4 คำตอบ — สัปดาห์ที่ 4</small>
        </h1>
        <div className="row">
          <div className="chip">คำสั่งซื้อ<b>{baht(rows.length)}</b></div>
          <div className="chip">ช่วงห่างของคำตอบ<b className="neg">{spread.toFixed(2)}%</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์: ที่ประชุมผู้บริหารเมื่อเช้านี้</h2>
        <p>
          ผู้บริหารถามคำถามเดียว — <b>“รายได้ปี 2025 เท่าไร”</b> — แล้วได้คำตอบ 4 ตัวเลข
          จาก 4 แผนก ทั้งที่ทุกคนดึงมาจากฐานข้อมูลเดียวกัน ไฟล์เดียวกัน{" "}
          <code>revenue_source.csv</code>
        </p>
        <div className="deptgrid">
          {deptValues.map((d) => (
            <div key={d.name} className={`deptcard${governed ? " governed" : ""}`}>
              <span className="ico">{d.icon}</span>
              <b>{d.name}</b>
              <div className="deptval">{baht(governed ? canonical : d.value)}</div>
              <div className="deptformula">
                {d.base === "gross" ? "gross_amount" : "net_amount"}
                {[...d.comps].map((c) => ` − ${COMP_LABEL[c].replace("หัก", "")}`).join("")}
              </div>
              <span className="muted">{d.why}</span>
            </div>
          ))}
        </div>
        {!governed ? (
          <div className="note warn">
            <b>ตัวเลขสูงสุดกับต่ำสุดต่างกัน {baht(hi - lo)} บาท ({spread.toFixed(2)}%)</b> —
            และ<b>ทุกนิยามถูกต้องหมด</b>ในบริบทของแผนกตัวเอง
            ปัญหาไม่ได้อยู่ที่ใครคำนวณผิด แต่อยู่ที่องค์กรไม่เคยตกลงกันว่า “รายได้” แปลว่าอะไร
            — นี่คือ <b>Metric Sprawl</b>
          </div>
        ) : (
          <div className="note good">
            <b>ทุกแผนกได้ตัวเลขเดียวกันแล้ว</b> — semantic layer นิยาม <code>revenue</code> ไว้ที่เดียว
            ทุกเครื่องมือ (Power BI, SQL, notebook) เรียกใช้นิยามเดียวกันนี้
            แผนกที่ต้องการมุมมองต่างไปยังขอได้ แต่ต้อง<b>ตั้งชื่อใหม่</b> เช่น <code>gross_sales</code>
            ไม่ใช่เรียกว่า “รายได้” ทับกัน
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button className={governed ? "" : "primary"} onClick={() => setGoverned(!governed)}>
            {governed ? "↩ ปิด semantic layer กลับไปสภาพเดิม" : "🛡️ เปิดใช้ semantic layer (นิยามกลาง)"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>🧩 สร้างนิยามของคุณเอง</h2>
        <p className="muted">
          ประกอบสูตรจากองค์ประกอบที่มีในไฟล์ แล้วดูว่าตรงกับนิยามของแผนกใด
        </p>
        <div className="row" style={{ marginBottom: 10 }}>
          {(["gross", "net"] as const).map((b) => (
            <button key={b} className={mine.base === b ? "primary" : ""}
                    onClick={() => setMine((m) => ({ ...m, base: b }))}>
              เริ่มจาก {b === "gross" ? "gross_amount" : "net_amount"}
            </button>
          ))}
        </div>
        <div className="row">
          {(["returns", "vat", "shipping"] as Comp[]).map((c) => (
            <button key={c} className={mine.comps.has(c) ? "primary" : ""} onClick={() => toggle(c)}>
              {mine.comps.has(c) ? "✓" : "＋"} {COMP_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="kpis" style={{ marginTop: 12 }}>
          <div className="kpi big">
            <span>ตัวเลขที่นิยามของคุณให้</span>
            <b>{baht(myValue)}</b>
          </div>
          <div className="kpi">
            <span>ต่างจากนิยามกลาง (ฝ่ายบัญชี)</span>
            <b className={Math.abs(myValue - canonical) < 1 ? "pos" : "neg"}>
              {((myValue / canonical - 1) * 100).toFixed(2)}%
            </b>
          </div>
          <div className="kpi">
            <span>ตรงกับนิยามของ</span>
            <b style={{ fontSize: 14 }}>{match ? match.name : "ไม่ตรงกับแผนกใด"}</b>
          </div>
        </div>
        <div className="note">
          <b>ลองนับดู:</b> องค์ประกอบ 3 อย่าง × ฐาน 2 แบบ = <b>16 นิยามที่เป็นไปได้</b>{" "}
          จากไฟล์เดียวที่มีเพียง 12 คอลัมน์ — ในองค์กรจริงที่มีหลายสิบตารางและหลายร้อยตัวชี้วัด
          จำนวนนิยามที่ขัดแย้งกันจะระเบิดจนไม่มีใครตามทัน
        </div>
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week04/revenue_source.csv" download><button>⬇ revenue_source.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> เขียน <code>metric store</code> อย่างง่ายเป็น dict ของนิยาม ·
          คำนวณทั้ง 4 นิยามจากข้อมูลชุดเดียว · เพิ่มมิติ (ช่องทาง/เดือน) แล้วแสดงว่าช่องว่าง
          ระหว่างนิยาม<b>ไม่คงที่</b>ในทุกกลุ่ม ซึ่งทำให้การเปรียบเทียบข้ามแผนกยิ่งอันตราย
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          คำถามปิดท้ายที่ได้ผลดี: <b>“ถ้าให้เลือกนิยามเดียวเป็นมาตรฐานองค์กร จะเลือกของแผนกใด”</b> —
          นักศึกษาจะเถียงกัน และนั่นคือคำตอบ: <b>ไม่มีนิยามใดถูกที่สุด</b>{" "}
          หน้าที่ของ semantic layer ไม่ใช่การหานิยามที่ถูก แต่คือการบังคับให้ทุกคน
          <b>ใช้คำเดียวกันแปลว่าสิ่งเดียวกัน</b> และให้ชื่อที่ต่างกันกับสิ่งที่ต่างกัน
        </p>
      </div>
    </>
  );
}
