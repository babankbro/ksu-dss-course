"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";
import { applyStandardizer, fitStandardizer, kmeans, silhouette } from "@/lib/ml";

const F = ["recency_days", "frequency", "monetary"] as const;
const LABEL: Record<string, string> = {
  recency_days: "R — ซื้อครั้งล่าสุดกี่วันมาแล้ว",
  frequency: "F — จำนวนครั้งที่ซื้อ",
  monetary: "M — ยอดซื้อรวม (บาท)",
};

/** ตั้งชื่อกลุ่มจากโปรไฟล์ เพื่อบังคับให้ต้องตีความ ไม่ใช่แค่ดูเลขกลุ่ม */
function nameOf(p: { recency_days: number; frequency: number; monetary: number }) {
  if (p.frequency >= 20 && p.recency_days < 90) return { icon: "🏆", name: "แชมเปี้ยน" };
  if (p.frequency <= 3 && p.monetary > 60000) return { icon: "💎", name: "ซื้อครั้งใหญ่ครั้งเดียว" };
  if (p.recency_days > 150) return { icon: "😴", name: "หลับใหล" };
  return { icon: "🛒", name: "ลูกค้าประจำ" };
}

export default function SegmentStudio() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [k, setK] = useState(4);
  const [scaled, setScaled] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week06/customers_rfm.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const data = useMemo(() => {
    if (!rows) return null;
    // เรียงตาม customer_id ให้ผลตรงกับ Colab เพราะค่าเริ่มต้นของ centroid ขึ้นกับลำดับแถว
    const sorted = [...rows].sort((a, b) => a.customer_id.localeCompare(b.customer_id));
    const raw = sorted.map((r) => F.map((f) => num(r[f])));
    const st = fitStandardizer(raw);
    return { sorted, raw, scaledX: applyStandardizer(raw, st), st };
  }, [rows]);

  const X = data ? (scaled ? data.scaledX : data.raw) : null;

  const fit = useMemo(() => (X ? kmeans(X, k) : null), [X, k]);

  /** เส้นโค้ง inertia และ silhouette ตลอด k = 2..8 */
  const curve = useMemo(() => {
    if (!X) return null;
    return [2, 3, 4, 5, 6, 7, 8].map((kk) => {
      const r = kmeans(X, kk);
      return { k: kk, inertia: r.inertia, sil: silhouette(X, r.labels, kk) };
    });
  }, [X]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!data || !fit || !curve || !X) return <div className="card"><h2>กำลังโหลด customers_rfm.csv …</h2></div>;

  const profiles = Array.from({ length: k }, (_, j) => {
    const idx = fit.labels.map((l, i) => (l === j ? i : -1)).filter((i) => i >= 0);
    const avg = Object.fromEntries(
      F.map((f, c) => [f, idx.reduce((s, i) => s + data.raw[i][c], 0) / (idx.length || 1)])
    ) as Record<(typeof F)[number], number>;
    return { j, n: idx.length, ...avg, ...nameOf(avg) };
  }).sort((a, b) => b.n - a.n);

  const bestK = curve.reduce((a, b) => (b.sil > a.sil ? b : a));
  const cur = curve.find((c) => c.k === k)!;
  const distinctNames = new Set(profiles.map((p) => p.name)).size;

  return (
    <>
      <div className="pagehead">
        <h1>
          👥 Segment Studio
          <small>แบ่งกลุ่มลูกค้าด้วย RFM — สเกลของตัวแปรคือตัวชี้ขาด · สัปดาห์ที่ 6</small>
        </h1>
        <div className="row">
          <div className="chip">ลูกค้า<b>{baht(data.raw.length)}</b></div>
          <div className="chip">Silhouette<b className={cur.sil > 0.5 ? "ok" : ""}>{cur.sil.toFixed(4)}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>ช่วงของตัวแปรทั้งสาม</h2>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ตัวแปร</th><th>ต่ำสุด</th><th>สูงสุด</th><th>ช่วง</th></tr></thead>
            <tbody>
              {F.map((f, c) => {
                const col = data.raw.map((r) => r[c]);
                const lo = Math.min(...col), hi = Math.max(...col);
                return (
                  <tr key={f}>
                    <td>{LABEL[f]}</td>
                    <td>{baht(lo, 2)}</td><td>{baht(hi, 2)}</td>
                    <td><b>{baht(hi - lo, 0)}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note warn">
          ระยะทางแบบยุคลิดบวกกำลังสองของทุกแกนเข้าด้วยกัน — ยอดเงินมีช่วงกว้างกว่า
          จำนวนครั้งราว <b>4,400 เท่า</b> ถ้าไม่ปรับสเกลก่อน แกน R และ F
          จะแทบไม่มีน้ำหนักในการคำนวณเลย
        </div>
      </div>

      <div className="card">
        <h2>ตั้งค่าการแบ่งกลุ่ม</h2>
        <div className="row" style={{ alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button className={scaled ? "primary" : undefined} onClick={() => setScaled((v) => !v)}>
            {scaled ? "✅ ปรับสเกลแล้ว (standardize)" : "⬜ ใช้ค่าดิบ ไม่ปรับสเกล"}
          </button>
          <span className="muted">จำนวนกลุ่ม k</span>
          {[2, 3, 4, 5, 6, 7, 8].map((kk) => (
            <button key={kk} className={k === kk ? "primary" : undefined} onClick={() => setK(kk)}>
              {kk}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>โปรไฟล์ของแต่ละกลุ่ม</h2>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>กลุ่ม</th><th>จำนวน</th>
                <th>R เฉลี่ย (วัน)</th><th>F เฉลี่ย (ครั้ง)</th><th>M เฉลี่ย (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.j}>
                  <td>{p.icon} {p.name}</td>
                  <td>{baht(p.n)}</td>
                  <td>{p.recency_days.toFixed(1)}</td>
                  <td>{p.frequency.toFixed(1)}</td>
                  <td>{baht(p.monetary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!scaled && k === 4 && (
          <div className="note warn">
            <b>สังเกตให้ดี</b> — ทั้งสี่กลุ่มต่างกันแทบเฉพาะที่ยอดเงิน ส่วน R และ F ปะปนกัน
            สิ่งที่ได้จึงไม่ใช่ “กลุ่มพฤติกรรม” แต่เป็นเพียง <b>การแบ่งช่วงยอดเงิน</b>{" "}
            ซึ่งทำได้ด้วย <code>pd.qcut</code> โดยไม่ต้องใช้ K-Means เลย
          </div>
        )}
        {scaled && distinctNames === 4 && (
          <div className="note good">
            <b>ได้กลุ่มพฤติกรรมที่แยกจากกันจริง 4 กลุ่ม</b> — สังเกตว่า “ซื้อครั้งใหญ่ครั้งเดียว”
            มียอดเงินสูงพอ ๆ กับแชมเปี้ยน แต่พฤติกรรมตรงข้ามกันสิ้นเชิง
            ทั้งสองกลุ่มนี้จะถูกยุบรวมกันทันทีถ้าไม่ปรับสเกล
          </div>
        )}
      </div>

      <div className="card">
        <h2>เลือก k อย่างไร</h2>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>k</th><th>Inertia (ยิ่งต่ำยิ่งกระชับ)</th><th>Silhouette</th><th></th></tr></thead>
            <tbody>
              {curve.map((c) => (
                <tr key={c.k} className={c.k === k ? "tot" : undefined}>
                  <td><button onClick={() => setK(c.k)}>{c.k}</button></td>
                  <td>{baht(c.inertia, 1)}</td>
                  <td>
                    <b className={c.k === bestK.k ? "ok" : undefined}>{c.sil.toFixed(4)}</b>
                    {c.k === bestK.k && " ← สูงสุด"}
                  </td>
                  <td style={{ width: "40%" }}>
                    <span
                      className="inlinebar"
                      style={{ width: `${Math.max(0, c.sil) * 220}px`, background: "var(--acc)" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note">
          <b>Inertia ลดลงเสมอเมื่อ k เพิ่ม</b> — จะเป็นศูนย์เมื่อ k เท่ากับจำนวนลูกค้า
          จึงใช้เลือก k ตรง ๆ ไม่ได้ ต้องมองหา “ข้อศอก” ที่การลดลงเริ่มชะลอ
          ส่วน silhouette มีค่าสูงสุดที่จุดหนึ่งจึงใช้ชี้ได้ตรงกว่า
        </div>
      </div>

      <div className="card">
        <h2>⚠️ กับดักของ Silhouette</h2>
        {!revealed ? (
          <>
            <p className="muted">
              ลองเปรียบเทียบค่า silhouette ระหว่างโหมด “ใช้ค่าดิบ” กับ “ปรับสเกลแล้ว” ที่ k เท่ากัน
              แล้วเดาว่าโหมดใดให้ค่าสูงกว่า — จากนั้นจึงเปิดเฉลย
            </p>
            <button className="primary" onClick={() => setRevealed(true)}>💡 เปิดเฉลย</button>
          </>
        ) : (
          <div className="note warn">
            <b>ค่าดิบให้ silhouette สูงกว่า</b> — ที่ k = 4 ค่าดิบได้ 0.6392 ส่วนที่ปรับสเกลแล้วได้ 0.5847
            <br /><br />
            ถ้าเลือกโมเดลด้วย silhouette เพียงอย่างเดียว จะได้โมเดลที่ <b>ผิด</b> มาใช้งาน
            เพราะ silhouette คำนวณจากระยะทางในหน่วยของข้อมูลที่ป้อนเข้าไป
            มันจึง <b>เทียบข้ามการปรับสเกลไม่ได้</b>
            <br /><br />
            ตัววัดภายในทุกตัว (silhouette · Davies–Bouldin · Calinski–Harabasz) ใช้ได้เฉพาะ
            การเทียบ k <b>ภายใต้การเตรียมข้อมูลแบบเดียวกัน</b> เท่านั้น
            การเลือกวิธีเตรียมข้อมูลต้องตัดสินด้วย <b>เหตุผลเชิงโดเมน</b> ไม่ใช่ด้วยคะแนน
          </div>
        )}
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week06/customers_rfm.csv" download><button>⬇ customers_rfm.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> ทำซ้ำด้วย <code>StandardScaler</code> + <code>KMeans</code> ของ scikit-learn ·
          วาด elbow และ silhouette curve · เทียบกับ hierarchical clustering และ DBSCAN ·
          เสนอแคมเปญที่ต่างกันสำหรับแต่ละกลุ่มพร้อมประมาณการมูลค่า
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          เริ่มด้วยโหมด “ใช้ค่าดิบ” ที่ k = 4 แล้วให้นักศึกษาตั้งชื่อกลุ่มเอง —
          ห้องจะตั้งชื่อได้ยากเพราะกลุ่มต่างกันแค่ยอดเงิน จากนั้นกดปรับสเกลแล้วให้ตั้งชื่ออีกครั้ง
          คราวนี้ชื่อจะออกมาเองแทบจะทันที
          <br /><br />
          ปิดท้ายด้วยกับดัก silhouette ซึ่งเป็นจุดที่นักศึกษาที่เก่งที่สุดในห้องมักติดกับ
          เพราะเขาเป็นคนที่เชื่อตัววัดมากที่สุด
        </p>
      </div>
    </>
  );
}
