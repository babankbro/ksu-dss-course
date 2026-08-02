"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";

type Monthly = { ym: string; year: number; month: number; amount: number };
type Metric = "raw" | "ytd" | "yoy" | "roll12" | "mom";

const METRICS: { key: Metric; label: string; desc: string; trap: string }[] = [
  { key: "raw", label: "ยอดขายรายเดือน", desc: "ค่าดิบ ไม่ปรับอะไร",
    trap: "อ่านแนวโน้มยากเพราะฤดูกาลกลบสัญญาณจริง" },
  { key: "ytd", label: "YTD — สะสมตั้งแต่ต้นปี", desc: "บวกสะสมและรีเซ็ตทุกวันที่ 1 มกราคม",
    trap: "กับดักที่พบบ่อย: ลืมรีเซ็ตเมื่อขึ้นปีใหม่ กลายเป็นยอดสะสมตลอดกาล" },
  { key: "mom", label: "MoM — เทียบเดือนก่อนหน้า", desc: "เปรียบเทียบกับเดือนที่แล้ว",
    trap: "ฤดูกาลทำให้ MoM แกว่งจนตีความไม่ได้ ธ.ค. เทียบ พ.ย. ย่อมสูงเสมอ" },
  { key: "yoy", label: "YoY — เทียบเดือนเดียวกันปีก่อน", desc: "ตัดผลของฤดูกาลออก",
    trap: "ต้องมีข้อมูลครบ 12 เดือนก่อนหน้า ปีแรกจึงคำนวณไม่ได้ ห้ามแสดงเป็น 0%" },
  { key: "roll12", label: "Rolling 12 เดือน", desc: "ผลรวมเคลื่อนที่ 12 เดือนล่าสุด",
    trap: "ต้องเรียงข้อมูลตามเวลาก่อนเสมอ ถ้าเรียงผิดหน้าต่างจะเลื่อนผิด" },
];

export default function TimeIntelligence() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("raw");
  const [region, setRegion] = useState("ทั้งหมด");

  useEffect(() => {
    loadCSV("/datasets/week04/sales_3years_daily.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const regions = useMemo(
    () => (rows ? ["ทั้งหมด", ...Array.from(new Set(rows.map((r) => r.region)))] : []),
    [rows]
  );

  const monthly: Monthly[] = useMemo(() => {
    if (!rows) return [];
    const m = new Map<string, number>();
    for (const r of rows) {
      if (region !== "ทั้งหมด" && r.region !== region) continue;
      const ym = r.sales_date.slice(0, 7);
      m.set(ym, (m.get(ym) ?? 0) + num(r.net_amount));
    }
    return [...m.entries()].sort().map(([ym, amount]) => ({
      ym, year: +ym.slice(0, 4), month: +ym.slice(5, 7), amount,
    }));
  }, [rows, region]);

  const series = useMemo(() => {
    const out: { ym: string; v: number | null }[] = [];
    let ytd = 0, curYear = -1;
    monthly.forEach((r, i) => {
      let v: number | null;
      if (metric === "raw") v = r.amount;
      else if (metric === "ytd") {
        if (r.year !== curYear) { curYear = r.year; ytd = 0; }
        ytd += r.amount; v = ytd;
      } else if (metric === "mom") {
        v = i === 0 ? null : (r.amount / monthly[i - 1].amount - 1) * 100;
      } else if (metric === "yoy") {
        v = i < 12 ? null : (r.amount / monthly[i - 12].amount - 1) * 100;
      } else {
        v = i < 11 ? null : monthly.slice(i - 11, i + 1).reduce((s, x) => s + x.amount, 0);
      }
      out.push({ ym: r.ym, v });
    });
    return out;
  }, [monthly, metric]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!rows || !monthly.length) return <div className="card"><h2>กำลังโหลด sales_3years_daily.csv …</h2></div>;

  const isPct = metric === "yoy" || metric === "mom";
  const shown = series.filter((s) => s.v !== null) as { ym: string; v: number }[];
  const maxV = Math.max(...shown.map((s) => s.v));
  const minV = Math.min(...shown.map((s) => s.v), 0);
  const cur = METRICS.find((m) => m.key === metric)!;

  const jun24 = series.find((s) => s.ym === "2024-06");
  const yearly = [2023, 2024, 2025].map((y) => ({
    y, v: monthly.filter((m) => m.year === y).reduce((s, m) => s + m.amount, 0),
  }));

  const W = 720, H = 210, P = 34;
  const x = (i: number) => P + (i * (W - 2 * P)) / (series.length - 1);
  const y = (v: number) => H - P - ((v - minV) / (maxV - minV || 1)) * (H - 2 * P);
  const path = shown
    .map((s, k) => {
      const i = series.findIndex((z) => z.ym === s.ym);
      return `${k ? "L" : "M"}${x(i).toFixed(1)},${y(s.v).toFixed(1)}`;
    })
    .join(" ");

  return (
    <>
      <div className="pagehead">
        <h1>
          📅 Time Intelligence Builder
          <small>YTD · MoM · YoY · Rolling 12 เดือน บนข้อมูลจริง 3 ปี — สัปดาห์ที่ 4</small>
        </h1>
        <div className="row">
          <div className="chip">แถวรายวัน<b>{baht(rows.length)}</b></div>
          <div className="chip">เดือน<b>{monthly.length}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>เลือกตัววัดเชิงเวลา</h2>
        <div className="row">
          {METRICS.map((m) => (
            <button key={m.key} className={metric === m.key ? "primary" : ""} onClick={() => setMetric(m.key)}>
              {m.label}
            </button>
          ))}
          <div className="spacer" />
          <select style={{ width: 160 }} value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="note">
          <b>{cur.label}</b> — {cur.desc}
          <br />
          <b style={{ color: "var(--bad)" }}>⚠️ กับดัก:</b> {cur.trap}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กราฟตัววัดเชิงเวลา" style={{ marginTop: 10 }}>
          <line x1={P} y1={y(isPct ? 0 : minV)} x2={W - P} y2={y(isPct ? 0 : minV)} stroke="var(--line)" />
          <path d={path} fill="none" stroke="var(--acc)" strokeWidth={2.2} />
          {shown.map((s) => {
            const i = series.findIndex((z) => z.ym === s.ym);
            const isOutage = s.ym === "2024-06";
            return (
              <circle key={s.ym} cx={x(i)} cy={y(s.v)} r={isOutage ? 5 : 2.4}
                      fill={isOutage ? "var(--bad)" : "var(--acc)"} />
            );
          })}
          {series.filter((_, i) => i % 6 === 0).map((s) => {
            const i = series.findIndex((z) => z.ym === s.ym);
            return (
              <text key={s.ym} x={x(i)} y={H - 8} fontSize={9.5} fill="var(--dim)" textAnchor="middle">
                {s.ym}
              </text>
            );
          })}
        </svg>
        <div className="legend">
          <span><i style={{ background: "var(--acc)" }} />{cur.label}</span>
          <span><i style={{ background: "var(--bad)" }} />มิ.ย. 2024 — ช่วงระบบขัดข้อง</span>
          {series.some((s) => s.v === null) && (
            <span className="muted">
              · {series.filter((s) => s.v === null).length} เดือนแรกคำนวณไม่ได้ (แสดงเป็นช่องว่าง ไม่ใช่ 0)
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <h2>🔍 เหตุการณ์ที่ซ่อนอยู่ในข้อมูล</h2>
        <p className="muted">
          ในเดือนมิถุนายน 2024 ระบบขายขัดข้องระหว่างวันที่ 5–18 ยอดขายช่วงนั้นเหลือราว 35%
          ลองสลับตัววัดแล้วสังเกตว่า<b>ตัววัดแต่ละแบบทำให้เหตุการณ์นี้เด่นหรือจางลงต่างกันอย่างไร</b>
        </p>
        <div className="kpis">
          <div className="kpi">
            <span>ยอด มิ.ย. 2024</span>
            <b className="neg">{baht(monthly.find((m) => m.ym === "2024-06")!.amount)}</b>
          </div>
          <div className="kpi">
            <span>YoY ของเดือนนั้น</span>
            <b className="neg">
              {(((monthly.find((m) => m.ym === "2024-06")!.amount /
                  monthly.find((m) => m.ym === "2023-06")!.amount) - 1) * 100).toFixed(2)}%
            </b>
          </div>
          <div className="kpi">
            <span>ค่าที่กราฟแสดงตอนนี้</span>
            <b>{jun24?.v === null || jun24 === undefined ? "—" : isPct ? jun24.v.toFixed(2) + "%" : baht(jun24.v)}</b>
          </div>
        </div>
        <div className="note">
          <b>ข้อสังเกตที่ต้องให้ผู้เรียนค้นพบ:</b> ตัววัดแบบ <b>YTD</b> และ <b>Rolling 12 เดือน</b>{" "}
          ทำให้เหตุการณ์นี้แทบมองไม่เห็น เพราะถูกกลืนไปกับยอดสะสม
          ส่วน <b>YoY</b> ทำให้มันเด่นชัดที่สุด — การเลือกตัววัดจึงเป็นการเลือกว่า
          <b>จะให้ผู้บริหารเห็นอะไรและมองข้ามอะไร</b>
        </div>
      </div>

      <div className="card">
        <h2>📈 ยอดรายปีและอัตราเติบโต</h2>
        <table>
          <thead><tr><th>ปี</th><th>ยอดขายรวม</th><th>YoY</th></tr></thead>
          <tbody>
            {yearly.map((r, i) => (
              <tr key={r.y}>
                <td>{r.y}</td>
                <td>{baht(r.v)}</td>
                <td className={i === 0 ? "muted" : (r.v > yearly[i - 1].v ? "pos" : "neg")}>
                  {i === 0 ? "— (ไม่มีปีก่อนหน้าให้เทียบ)" : ((r.v / yearly[i - 1].v - 1) * 100).toFixed(2) + "%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week04/sales_3years_daily.csv" download><button>⬇ sales_3years_daily.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> เขียนทั้ง 5 ตัววัดด้วย window function ของ pandas ·
          พิสูจน์ว่าค่าที่ได้ตรงกับตัวเลขบนหน้านี้ ·
          ทำให้เดือนที่คำนวณไม่ได้เป็น <code>NaN</code> ไม่ใช่ 0 แล้วอธิบายว่าเหตุใดจึงสำคัญ ·
          สร้าง <code>dim_date</code> และคำนวณ YTD ด้วย SQL แบบ <code>ROWS BETWEEN</code>
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          จุดที่นักศึกษาพลาดบ่อยที่สุดคือ<b>การเติม 0 แทน NaN</b> ในเดือนที่ยังคำนวณไม่ได้
          ทำให้กราฟ YoY ของ 12 เดือนแรกกลายเป็นเส้นแบนที่ศูนย์ ซึ่งดูเหมือน
          “ธุรกิจไม่เติบโตเลยตลอดปีแรก” ทั้งที่ความจริงคือ <b>ยังไม่มีข้อมูลให้เทียบ</b> —
          เป็นตัวอย่างที่ดีของการที่ค่าว่างซึ่งถูกเติมผิดวิธีกลายเป็นข้อมูลเท็จ
        </p>
      </div>
    </>
  );
}
