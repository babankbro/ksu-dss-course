"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";

type Cell = { conv: number; n: number };
const rate = (c: Cell) => (c.n ? c.conv / c.n : 0);
const pc = (v: number, d = 1) => (v * 100).toFixed(d) + "%";

export default function SimpsonParadox() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [mix, setMix] = useState<number | null>(null); // สัดส่วน Desktop ใน Q2 (%)

  useEffect(() => {
    loadCSV("/datasets/week04/web_conversion.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const agg = useMemo(() => {
    if (!rows) return null;
    const t: Record<string, Cell> = {};
    const d: Record<string, Cell> = {};
    for (const r of rows) {
      const c = num(r.converted);
      (t[r.period] ??= { conv: 0, n: 0 });
      t[r.period].conv += c; t[r.period].n++;
      const k = `${r.period}|${r.device}`;
      (d[k] ??= { conv: 0, n: 0 });
      d[k].conv += c; d[k].n++;
    }
    return { total: t, dev: d };
  }, [rows]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!rows || !agg) return <div className="card"><h2>กำลังโหลด web_conversion.csv …</h2></div>;

  const q1 = agg.total["2025-Q1"], q2 = agg.total["2025-Q2"];
  const dev = (p: string, d: string) => agg.dev[`${p}|${d}`];
  const q1m = dev("2025-Q1", "Mobile"), q1d = dev("2025-Q1", "Desktop");
  const q2m = dev("2025-Q2", "Mobile"), q2d = dev("2025-Q2", "Desktop");

  // จำลองว่าถ้าสัดส่วน traffic ของ Q2 เปลี่ยน อัตรารวมจะเป็นเท่าไร (อัตราย่อยคงเดิม)
  const desktopShare = mix === null ? (q2d.n / q2.n) * 100 : mix;
  const simulated = (desktopShare / 100) * rate(q2d) + (1 - desktopShare / 100) * rate(q2m);
  const flips = simulated < rate(q1);

  return (
    <>
      <div className="pagehead">
        <h1>
          🎭 Simpson&apos;s Paradox Lab
          <small>ตัวเลขรวมขึ้น แต่ทุกกลุ่มย่อยลง — สัปดาห์ที่ 4</small>
        </h1>
        <div className="chip">Sessions<b>{baht(rows.length)}</b></div>
      </div>

      <div className="card">
        <h2>รายงานที่ผู้บริหารได้รับเช้านี้</h2>
        <div className="bigcompare">
          <div className="bc">
            <span>ไตรมาส 1</span>
            <b>{pc(rate(q1))}</b>
            <small>{baht(q1.conv)} จาก {baht(q1.n)} sessions</small>
          </div>
          <div className="bcarrow pos">▲ +{((rate(q2) - rate(q1)) * 100).toFixed(1)} จุด</div>
          <div className="bc">
            <span>ไตรมาส 2</span>
            <b className="pos">{pc(rate(q2))}</b>
            <small>{baht(q2.conv)} จาก {baht(q2.n)} sessions</small>
          </div>
        </div>
        <p className="muted" style={{ textAlign: "center" }}>
          ทีมการตลาดกำลังจะประกาศความสำเร็จ และขออนุมัติงบเพิ่มสำหรับแคมเปญเดิม
        </p>
        {!split && (
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            <button className="primary" onClick={() => setSplit(true)}>
              🔎 Drill-down แยกตามอุปกรณ์ก่อนอนุมัติ
            </button>
          </div>
        )}
      </div>

      {split && (
        <>
          <div className="card">
            <h2>⚠️ สิ่งที่เห็นหลัง drill-down</h2>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>อุปกรณ์</th><th>Q1 sessions</th><th>Q1 rate</th><th>Q2 sessions</th><th>Q2 rate</th><th>เปลี่ยนแปลง</th></tr>
                </thead>
                <tbody>
                  {([["Mobile", q1m, q2m], ["Desktop", q1d, q2d]] as [string, Cell, Cell][]).map(([name, a, b]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{baht(a.n)}</td>
                      <td>{pc(rate(a))}</td>
                      <td>{baht(b.n)}</td>
                      <td>{pc(rate(b))}</td>
                      <td className="neg"><b>▼ {((rate(b) - rate(a)) * 100).toFixed(1)} จุด</b></td>
                    </tr>
                  ))}
                  <tr className="tot">
                    <td>รวม</td>
                    <td>{baht(q1.n)}</td><td>{pc(rate(q1))}</td>
                    <td>{baht(q2.n)}</td><td>{pc(rate(q2))}</td>
                    <td className="pos"><b>▲ +{((rate(q2) - rate(q1)) * 100).toFixed(1)} จุด</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="note warn">
              <b>Conversion rate ลดลงทั้งสองกลุ่ม แต่ตัวเลขรวมกลับเพิ่มขึ้น 13.3 จุด</b> —
              ไม่มีตัวเลขใดผิด ไม่มีข้อมูลใดเสียหาย ทั้งสองข้อความเป็นความจริงพร้อมกัน
              นี่คือ <b>Simpson&apos;s Paradox</b>
            </div>
          </div>

          <div className="card">
            <h2>🧮 ต้นเหตุ: สัดส่วนของกลุ่มเปลี่ยน ไม่ใช่ผลงานดีขึ้น</h2>
            <div className="mixbars">
              {(["2025-Q1", "2025-Q2"] as const).map((p) => {
                const m = dev(p, "Mobile"), d = dev(p, "Desktop");
                const tot = m.n + d.n;
                return (
                  <div key={p} style={{ marginBottom: 12 }}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <b>{p}</b>
                      <span className="muted">
                        Mobile {pc(m.n / tot, 0)} · Desktop {pc(d.n / tot, 0)}
                      </span>
                    </div>
                    <div className="stack">
                      <i style={{ width: `${(m.n / tot) * 100}%`, background: "var(--warn)" }}>
                        Mobile · rate {pc(rate(m), 0)}
                      </i>
                      <i style={{ width: `${(d.n / tot) * 100}%`, background: "var(--acc)" }}>
                        Desktop · rate {pc(rate(d), 0)}
                      </i>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="muted">
              Desktop มี conversion rate สูงกว่า Mobile ราว 4 เท่ามาโดยตลอด
              เมื่อสัดส่วน traffic ย้ายจาก Mobile 80% ไปเป็น Desktop 70%
              ค่าเฉลี่ยรวมจึงถูกดึงขึ้น <b>ทั้งที่ผลงานของทั้งสองกลุ่มแย่ลง</b>
            </p>
          </div>

          <div className="card">
            <h2>🎚️ ทดลองเอง: สัดส่วนเท่าไรที่ทำให้ผลกลับทิศ</h2>
            <label>
              สัดส่วน Desktop ในไตรมาส 2: <span className="val">{desktopShare.toFixed(0)}%</span>{" "}
              <span className="muted">(อัตราของแต่ละกลุ่มคงเดิมที่ 9% และ 38%)</span>
            </label>
            <input type="range" min={0} max={100} step={1} value={desktopShare}
                   onChange={(e) => setMix(+e.target.value)} />
            <div className="kpis" style={{ marginTop: 10 }}>
              <div className="kpi big">
                <span>อัตรารวมของ Q2 ที่จำลองได้</span>
                <b className={flips ? "neg" : "pos"}>{pc(simulated)}</b>
              </div>
              <div className="kpi">
                <span>เทียบกับ Q1 ({pc(rate(q1))})</span>
                <b className={flips ? "neg" : "pos"}>{flips ? "ลดลง ▼" : "เพิ่มขึ้น ▲"}</b>
              </div>
            </div>
            <div className="note">
              <b>จุดพลิก:</b> เมื่อสัดส่วน Desktop ต่ำกว่าประมาณ{" "}
              <b>{(((rate(q1) - rate(q2m)) / (rate(q2d) - rate(q2m))) * 100).toFixed(1)}%</b>{" "}
              ตัวเลขรวมจะกลับมาลดลงตรงกับความจริงของทั้งสองกลุ่ม —
              แปลว่า “ทิศทางของตัวเลขรวม” ถูกกำหนดโดยสัดส่วนของกลุ่ม ไม่ใช่โดยผลงาน
            </div>
            <div className="row">
              <button className="mini" onClick={() => setMix(null)}>คืนค่าจริง (70%)</button>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week04/web_conversion.csv" download><button>⬇ web_conversion.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> พิสูจน์ปรากฏการณ์ด้วย <code>groupby</code> ·
          คำนวณ conversion rate แบบถ่วงน้ำหนักด้วยสัดส่วนคงที่ (standardized rate)
          เพื่อตอบว่า “ถ้าสัดส่วน traffic ไม่เปลี่ยน ผลงานจริงดีขึ้นหรือแย่ลง” ·
          หาตัวแปรอื่นในไฟล์ที่อาจเป็น confounder เพิ่มเติม
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้ฉายหน้าแรกก่อนโดย<b>ยังไม่กด drill-down</b> แล้วถามชั้นเรียนว่าจะอนุมัติงบเพิ่มหรือไม่
          ให้ยกมือโหวต จากนั้นค่อยกดปุ่ม — ความรู้สึกตอนเห็นตารางจะฝังแน่นกว่าการอธิบายด้วยสูตร
          ปิดท้ายด้วยคำถามว่า <b>“แล้วเราจะรู้ได้อย่างไรว่าต้อง drill-down ด้วยตัวแปรใด”</b>{" "}
          ซึ่งเป็นคำถามที่ OLAP ตอบไม่ได้ ต้องอาศัยความรู้โดเมนของมนุษย์
        </p>
      </div>
    </>
  );
}
