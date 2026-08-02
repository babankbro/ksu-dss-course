"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";
import { applyStandardizer, fitStandardizer, kmeans, silhouette } from "@/lib/ml";

const F = ["recency_days", "frequency", "monetary"] as const;
const KS = [2, 3, 4, 5, 6, 7, 8];

type Curve = { k: number; sil: number; inertia: number }[];

export default function ClusterRealityCheck() {
  const [real, setReal] = useState<Row[] | null>(null);
  const [noise, setNoise] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [guessed, setGuessed] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    loadCSV("/datasets/week06/customers_rfm.csv").then(setReal).catch((e) => setErr(String(e)));
    loadCSV("/datasets/week06/no_structure.csv").then(setNoise).catch((e) => setErr(String(e)));
  }, []);

  const analyse = (rows: Row[] | null): { curve: Curve; n: number } | null => {
    if (!rows) return null;
    const sorted = [...rows].sort((a, b) => a.customer_id.localeCompare(b.customer_id));
    const raw = sorted.map((r) => F.map((f) => num(r[f])));
    const X = applyStandardizer(raw, fitStandardizer(raw));
    return {
      n: X.length,
      curve: KS.map((k) => {
        const r = kmeans(X, k);
        return { k, sil: silhouette(X, r.labels, k), inertia: r.inertia };
      }),
    };
  };

  const A = useMemo(() => analyse(real), [real]);
  const B = useMemo(() => analyse(noise), [noise]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!A || !B) return <div className="card"><h2>กำลังคำนวณการแบ่งกลุ่มทั้งสองชุด …</h2></div>;

  const peak = (c: Curve) => c.reduce((a, b) => (b.sil > a.sil ? b : a));
  const spread = (c: Curve) => Math.max(...c.map((x) => x.sil)) - Math.min(...c.map((x) => x.sil));

  const panel = (
    label: string, tag: "A" | "B", res: { curve: Curve; n: number }, reveal: boolean
  ) => (
    <div className="card">
      <h2>
        {label}
        {reveal && (tag === "A"
          ? <span className="ok"> — ข้อมูลลูกค้าจริง มี 4 กลุ่มอยู่จริง</span>
          : <span className="neg"> — จุดสุ่มสม่ำเสมอ ไม่มีกลุ่มใดอยู่จริงเลย</span>)}
      </h2>
      <div className="kpis">
        <div className="kpi"><span>จำนวนจุดข้อมูล</span><b>{baht(res.n)}</b></div>
        <div className="kpi"><span>Silhouette สูงสุด</span><b>{peak(res.curve).sil.toFixed(4)}</b></div>
        <div className="kpi"><span>ที่ k เท่ากับ</span><b>{peak(res.curve).k}</b></div>
        <div className="kpi"><span>ช่วงห่างของ silhouette</span><b>{spread(res.curve).toFixed(4)}</b></div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>k</th><th>Silhouette</th><th></th><th>Inertia</th></tr></thead>
          <tbody>
            {res.curve.map((c) => (
              <tr key={c.k} className={c.k === peak(res.curve).k ? "tot" : undefined}>
                <td>{c.k}</td>
                <td><b>{c.sil.toFixed(4)}</b></td>
                <td style={{ width: "45%" }}>
                  <span
                    className="inlinebar"
                    style={{
                      width: `${Math.max(0, c.sil) * 300}px`,
                      background: c.sil > 0.45 ? "var(--ok)" : c.sil > 0.3 ? "var(--warn)" : "var(--bad)",
                    }}
                  />
                </td>
                <td>{baht(c.inertia, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="pagehead">
        <h1>
          🔬 Cluster Reality Check
          <small>K-Means คืนกลุ่มมาให้เสมอ ไม่ว่าจะมีกลุ่มอยู่จริงหรือไม่ — สัปดาห์ที่ 6</small>
        </h1>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ข้างล่างคือผลการแบ่งกลุ่มของชุดข้อมูลสองชุด ทั้งคู่ผ่านการปรับสเกลเหมือนกัน
          ใช้อัลกอริทึมเดียวกัน และรันด้วยโค้ดบรรทัดเดียวกันทุกประการ
        </p>
        <p>
          <b>ชุดหนึ่งเป็นข้อมูลลูกค้าจริงที่มีกลุ่มพฤติกรรมอยู่จริง
          อีกชุดเป็นจุดที่สุ่มกระจายสม่ำเสมอโดยไม่มีโครงสร้างใด ๆ เลย</b>
        </p>
        {!guessed ? (
          <>
            <p className="muted">ดูตัวเลขทั้งสองแผงก่อน แล้วจึงเลือกว่าชุดใดคือข้อมูลจริง</p>
            <div className="row">
              <button className="primary" onClick={() => setGuessed("A")}>ชุด A คือข้อมูลจริง</button>
              <button className="primary" onClick={() => setGuessed("B")}>ชุด B คือข้อมูลจริง</button>
            </div>
          </>
        ) : (
          <div className={guessed === "A" ? "note good" : "note warn"}>
            {guessed === "A"
              ? "✅ ถูกต้อง — ชุด A คือข้อมูลลูกค้าจริง"
              : "❌ ชุด B คือจุดสุ่มที่ไม่มีโครงสร้างเลย"}
            {" "}สิ่งที่ต้องสังเกตอยู่ในการ์ดถัดไป
          </div>
        )}
      </div>

      {panel("ชุด A", "A", A, guessed !== null)}
      {panel("ชุด B", "B", B, guessed !== null)}

      {guessed && (
        <div className="card">
          <h2>สิ่งที่แยกทั้งสองชุดออกจากกัน</h2>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>สัญญาณ</th><th>ชุด A (มีโครงสร้างจริง)</th><th>ชุด B (สุ่มล้วน)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Silhouette สูงสุด</td>
                  <td className="ok"><b>{peak(A.curve).sil.toFixed(4)}</b></td>
                  <td className="neg"><b>{peak(B.curve).sil.toFixed(4)}</b></td>
                </tr>
                <tr>
                  <td>ยอดของเส้น silhouette</td>
                  <td className="ok">
                    พุ่งขึ้นที่ k = {peak(A.curve).k} แล้วลดลงชัดเจน
                    (สูงกว่าค่าต่ำสุด {spread(A.curve).toFixed(2)})
                  </td>
                  <td className="neg">
                    มีจุดสูงสุดที่ k = {peak(B.curve).k} แต่สูงกว่าค่าต่ำสุดเพียง{" "}
                    {spread(B.curve).toFixed(2)} — เป็นความผันผวนสุ่ม ไม่ใช่ยอดจริง
                  </td>
                </tr>
                <tr>
                  <td>ช่วงห่างของ silhouette ตลอด k</td>
                  <td className="ok"><b>{spread(A.curve).toFixed(4)}</b></td>
                  <td className="neg"><b>{spread(B.curve).toFixed(4)}</b></td>
                </tr>
                <tr>
                  <td>ขนาดของกลุ่มที่ได้</td>
                  <td className="ok">ไม่เท่ากัน สะท้อนสัดส่วนจริงของประชากร</td>
                  <td className="neg">เท่ากันแทบเป๊ะทุกกลุ่ม — เป็นการหั่นพื้นที่ว่าง</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="note warn">
            <b>ชุด B ได้ silhouette ราว {peak(B.curve).sil.toFixed(2)}</b> ซึ่งตำราหลายเล่มจัดว่า
            “พอใช้ได้” และนักศึกษาจำนวนมากจะยอมรับผลนี้แล้วเดินหน้าเขียนรายงานต่อ
            ทั้งที่ข้อมูลไม่มีกลุ่มอยู่จริงแม้แต่กลุ่มเดียว
            <br /><br />
            <b>K-Means ไม่มีทางบอกว่า “ไม่มีกลุ่ม”</b> — มันถูกออกแบบมาให้หั่นข้อมูลเป็น k ส่วนเสมอ
            คุณสั่ง k = 5 มันก็คืน 5 กลุ่ม ไม่ว่าคุณจะป้อนอะไรเข้าไป
          </div>

          <div className="note good">
            <b>กฎที่ควรบังคับใช้ทุกครั้งก่อนรายงานผลการแบ่งกลุ่ม</b>
            <br />1. รันซ้ำกับข้อมูลสุ่มที่มีช่วงเท่ากัน แล้วเทียบ silhouette — ถ้าไม่ห่างกันชัดเจน ให้ทิ้งผลนั้น
            <br />2. ดูว่าเส้น silhouette <b>มียอด</b> หรือแค่ขึ้นลงเล็กน้อย — ไม่มียอด แปลว่าไม่มีจำนวนกลุ่มที่เป็นธรรมชาติ
            <br />3. ตรวจว่ากลุ่มที่ได้ <b>ตั้งชื่อเป็นภาษาธุรกิจได้หรือไม่</b> — ถ้าตั้งชื่อไม่ได้ ทีมการตลาดก็ใช้ไม่ได้
            <br />4. รันซ้ำด้วยข้อมูลย่อย 80% หลายรอบ — ถ้าสมาชิกของกลุ่มเปลี่ยนไปมาก แปลว่ากลุ่มนั้นไม่เสถียร
          </div>
        </div>
      )}

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week06/customers_rfm.csv" download><button>⬇ customers_rfm.csv</button></a>
          <a href="/datasets/week06/no_structure.csv" download><button>⬇ no_structure.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> คำนวณ gap statistic เทียบกับข้อมูลอ้างอิงแบบสุ่ม ·
          วัดความเสถียรด้วย Adjusted Rand Index ระหว่างการรันซ้ำบนข้อมูลย่อย ·
          ทดลองกับ DBSCAN ซึ่งบอกได้ว่า “ไม่มีกลุ่ม” ต่างจาก K-Means
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          อย่าเฉลยว่าชุดใดเป็นชุดใดจนกว่าห้องจะโหวตเสร็จ — ปกติห้องจะแตกเป็นสองฝ่ายใกล้เคียงกัน
          เพราะทั้งสองแผงหน้าตา “ดูเป็นผลลัพธ์ที่ใช้ได้” เหมือนกัน
          <br /><br />
          นี่คือสื่อจำลองตัวเดียวของรายวิชาที่สอนว่า <b>เมื่อใดควรทิ้งผลการวิเคราะห์ทิ้งไป</b>{" "}
          ซึ่งเป็นทักษะที่ประเมินในข้อสอบได้ยาก แต่แยกนักวิเคราะห์ที่ใช้ได้จริงออกจากคนที่รันโค้ดเป็น
        </p>
      </div>
    </>
  );
}
