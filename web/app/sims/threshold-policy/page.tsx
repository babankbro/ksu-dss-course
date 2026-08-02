"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";
import {
  Confusion, accuracy, auc, confusionAt, f1, precision, recall, totalCost,
} from "@/lib/ml";

const COST_FN = 8000;   // ปล่อยรายการทุจริตผ่าน — ต้องคืนเงินลูกค้า
const COST_FP = 300;    // แจ้งเตือนผิด — ค่าแรงตรวจสอบ + ความรำคาญของลูกค้า
const CAPACITY = 7200;  // ทีมตรวจสอบรับได้ 120 เคส/วัน × 60 วัน

const pc = (v: number, d = 2) => (v * 100).toFixed(d) + "%";

export default function ThresholdPolicy() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [t, setT] = useState(0.5);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week05/fraud_scored.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const data = useMemo(() => {
    if (!rows) return null;
    const scores = rows.map((r) => num(r.risk_score));
    const labels = rows.map((r) => num(r.is_fraud));
    const pos = labels.reduce((s, v) => s + v, 0);
    return { scores, labels, pos, n: rows.length, auc: auc(scores, labels) };
  }, [rows]);

  /** กวาด threshold ทุก 0.01 เพื่อหาจุดที่ดีที่สุดตามเกณฑ์แต่ละแบบ */
  const sweep = useMemo(() => {
    if (!data) return null;
    const pts: { t: number; c: Confusion; cost: number; alerts: number }[] = [];
    for (let k = 1; k <= 99; k++) {
      const th = k / 100;
      const c = confusionAt(data.scores, data.labels, th);
      pts.push({ t: th, c, cost: totalCost(c, COST_FN, COST_FP), alerts: c.tp + c.fp });
    }
    const pick = (fn: (p: (typeof pts)[number]) => number) =>
      pts.reduce((a, b) => (fn(b) > fn(a) ? b : a));
    return {
      pts,
      bestCost: pts.reduce((a, b) => (b.cost < a.cost ? b : a)),
      bestAcc: pick((p) => accuracy(p.c)),
      bestF1: pick((p) => f1(p.c)),
      maxCost: Math.max(...pts.map((p) => p.cost)),
    };
  }, [data]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!data || !sweep) return <div className="card"><h2>กำลังโหลด fraud_scored.csv …</h2></div>;

  const c: Confusion = confusionAt(data.scores, data.labels, t);
  const alerts = c.tp + c.fp;
  const cost = totalCost(c, COST_FN, COST_FP);
  const overCap = alerts > CAPACITY;
  const doNothingCost = data.pos * COST_FN;
  const baseAcc = (data.n - data.pos) / data.n;

  // เส้นโค้งต้นทุน
  const W = 720, H = 200, P = 36;
  const x = (i: number) => P + (i * (W - 2 * P)) / (sweep.pts.length - 1);
  const y = (v: number) => H - P - (v / sweep.maxCost) * (H - 2 * P);
  const path = sweep.pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.cost).toFixed(1)}`).join(" ");
  const curIdx = Math.round(t * 100) - 1;

  return (
    <>
      <div className="pagehead">
        <h1>
          🎯 Threshold Policy Studio
          <small>โมเดลเสร็จแล้ว งานที่ยากกว่าคือเลือกเส้นแบ่ง — สัปดาห์ที่ 5</small>
        </h1>
        <div className="row">
          <div className="chip">ธุรกรรม<b>{baht(data.n)}</b></div>
          <div className="chip">ทุจริตจริง<b className="neg">{baht(data.pos)}</b></div>
          <div className="chip">AUC ของโมเดล<b className="ok">{data.auc.toFixed(4)}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ทีม Data Science ส่งมอบโมเดลตรวจจับการทุจริตที่ให้ <b>คะแนนความเสี่ยง 0–1</b> กับทุกธุรกรรม
          โมเดลทำงานได้ดี (AUC {data.auc.toFixed(4)}) และงานของคุณเริ่มตรงนี้ —
          <b>ต้องขีดเส้นที่ค่าเท่าไรจึงจะเรียกว่า “น่าสงสัย”</b>
        </p>
        <div className="kpis">
          <div className="kpi"><span>ต้นทุนเมื่อปล่อยผ่าน (FN)</span><b className="neg">{baht(COST_FN)} บาท</b></div>
          <div className="kpi"><span>ต้นทุนเมื่อแจ้งเตือนผิด (FP)</span><b>{baht(COST_FP)} บาท</b></div>
          <div className="kpi"><span>เพดานกำลังคนตรวจสอบ</span><b>{baht(CAPACITY)} เคส</b></div>
        </div>
        <div className="note warn">
          <b>ต้นทุนไม่สมมาตร {(COST_FN / COST_FP).toFixed(1)} เท่า</b> — การพลาดหนึ่งรายการแพงกว่าการเตือนผิดหนึ่งครั้งมาก
          ตัววัดใดที่ปฏิบัติกับ FP และ FN เท่ากัน (เช่น accuracy และ F1) จึงตอบคำถามนี้ไม่ได้
        </div>
      </div>

      <div className="card">
        <h2>เลือก threshold</h2>
        <div className="row" style={{ alignItems: "center", gap: 14 }}>
          <input
            type="range" min={0.01} max={0.99} step={0.01} value={t}
            onChange={(e) => setT(+e.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />
          <div className="big" style={{ minWidth: 96, textAlign: "right" }}>{t.toFixed(2)}</div>
        </div>

        <div className="cmgrid">
          <div className="cmcell tp"><span>True Positive</span><b>{baht(c.tp)}</b><small>จับได้จริง</small></div>
          <div className="cmcell fp"><span>False Positive</span><b>{baht(c.fp)}</b><small>เตือนผิด · {baht(c.fp * COST_FP)} บาท</small></div>
          <div className="cmcell fn"><span>False Negative</span><b>{baht(c.fn)}</b><small>ปล่อยผ่าน · {baht(c.fn * COST_FN)} บาท</small></div>
          <div className="cmcell tn"><span>True Negative</span><b>{baht(c.tn)}</b><small>ปกติและปล่อยผ่านถูกต้อง</small></div>
        </div>

        <div className="kpis">
          <div className="kpi"><span>Accuracy</span><b>{pc(accuracy(c))}</b></div>
          <div className="kpi"><span>Precision</span><b>{pc(precision(c))}</b></div>
          <div className="kpi"><span>Recall</span><b>{pc(recall(c))}</b></div>
          <div className="kpi"><span>F1</span><b>{f1(c).toFixed(4)}</b></div>
          <div className="kpi big">
            <span>ต้นทุนรวม</span>
            <b className={cost <= sweep.bestCost.cost * 1.05 ? "ok" : "neg"}>{baht(cost)} บาท</b>
          </div>
          <div className="kpi">
            <span>เคสที่ต้องตรวจ</span>
            <b className={overCap ? "neg" : "ok"}>{baht(alerts)}</b>
            <small>{overCap ? `เกินเพดาน ${baht(alerts - CAPACITY)} เคส` : `เหลือกำลัง ${baht(CAPACITY - alerts)} เคส`}</small>
          </div>
        </div>

        {overCap && (
          <div className="note warn">
            <b>เกินกำลังคน</b> — นโยบายนี้ทำจริงไม่ได้ ต่อให้ตัวเลขบนกระดาษดูดี
            เคสที่ตรวจไม่ทันจะกองค้างและถูกปิดโดยไม่มีใครดู ซึ่งเท่ากับปล่อยผ่านแต่มีเอกสารสวยกว่า
          </div>
        )}
      </div>

      <div className="card">
        <h2>เส้นโค้งต้นทุนตลอดช่วง threshold</h2>
        <svg viewBox={`0 0 ${W} ${H}`} className="costcurve" role="img" aria-label="เส้นโค้งต้นทุนรวมตาม threshold">
          <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="axis" />
          <line x1={P} y1={P} x2={P} y2={H - P} className="axis" />
          <path d={path} className="pline" />
          <line
            x1={x(sweep.bestCost.t * 100 - 1)} y1={P - 6}
            x2={x(sweep.bestCost.t * 100 - 1)} y2={H - P}
            className="pline ok" strokeDasharray="4 3"
          />
          <circle cx={x(curIdx)} cy={y(cost)} r={5} className="dot" />
          <text x={x(sweep.bestCost.t * 100 - 1)} y={P - 10} textAnchor="middle" className="lbl">
            ต่ำสุดที่ {sweep.bestCost.t.toFixed(2)}
          </text>
          <text x={P} y={H - 10} className="lbl">0.01</text>
          <text x={W - P} y={H - 10} textAnchor="end" className="lbl">0.99</text>
        </svg>
        <p className="muted">
          จุดวงกลมคือ threshold ที่คุณเลือกอยู่ · เส้นประคือจุดที่ต้นทุนรวมต่ำที่สุด
        </p>
      </div>

      <div className="card">
        <h2>เกณฑ์คนละแบบ ให้คำตอบคนละจุด</h2>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>เกณฑ์ที่ใช้เลือก</th><th>threshold</th><th>Accuracy</th>
                <th>Recall</th><th>เคสที่ต้องตรวจ</th><th>ต้นทุนรวม</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ไม่ทำอะไรเลย (ทายว่าไม่ทุจริตทุกรายการ)", null],
                ["Accuracy สูงสุด", sweep.bestAcc],
                ["F1 สูงสุด", sweep.bestF1],
                ["ต้นทุนรวมต่ำสุด ✅", sweep.bestCost],
              ].map(([label, p]) => {
                if (!p) {
                  return (
                    <tr key={label as string}>
                      <td>{label as string}</td><td>1.00</td>
                      <td>{pc(baseAcc)}</td><td>0.00%</td><td>0</td>
                      <td className="neg"><b>{baht(doNothingCost)}</b></td>
                    </tr>
                  );
                }
                const pt = p as { t: number; c: Confusion; cost: number; alerts: number };
                const isBest = pt.t === sweep.bestCost.t;
                return (
                  <tr key={label as string} className={isBest ? "tot" : undefined}>
                    <td>{label as string}</td>
                    <td>
                      <button onClick={() => setT(pt.t)}>{pt.t.toFixed(2)}</button>
                    </td>
                    <td>{pc(accuracy(pt.c))}</td>
                    <td>{pc(recall(pt.c))}</td>
                    <td className={pt.alerts > CAPACITY ? "neg" : undefined}>{baht(pt.alerts)}</td>
                    <td className={isBest ? "ok" : "neg"}><b>{baht(pt.cost)}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!revealed ? (
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            <button className="primary" onClick={() => setRevealed(true)}>
              💡 เฉลยว่าตารางนี้กำลังบอกอะไร
            </button>
          </div>
        ) : (
          <>
            <div className="note warn">
              <b>กับดัก Accuracy</b> — ทายว่า “ไม่ทุจริต” ทุกรายการได้ accuracy {pc(baseAcc)} ทันที
              โดยไม่ต้องมีโมเดลเลย และเสียหาย {baht(doNothingCost)} บาท
              จุดที่ accuracy สูงที่สุด ({sweep.bestAcc.t.toFixed(2)}) ยังแพงกว่าจุดที่ดีที่สุดถึง{" "}
              <b>{baht(sweep.bestAcc.cost - sweep.bestCost.cost)} บาท</b>
            </div>
            <div className="note warn">
              <b>กับดัก F1</b> — F1 ถ่วงน้ำหนัก precision กับ recall เท่ากัน
              ซึ่งแปลว่าสมมติว่า FP กับ FN แพงเท่ากัน แต่ในโจทย์นี้ต่างกัน {(COST_FN / COST_FP).toFixed(1)} เท่า
              จุดที่ F1 สูงสุด ({sweep.bestF1.t.toFixed(2)}) จึงยังแพงกว่าจุดที่ดีที่สุด{" "}
              <b>{baht(sweep.bestF1.cost - sweep.bestCost.cost)} บาท</b>
            </div>
            <div className="note good">
              <b>ข้อสรุป</b> — ไม่มี threshold ที่ “ถูกต้อง” ในเชิงสถิติ
              มีแต่ threshold ที่ตรงกับ <b>โครงสร้างต้นทุนขององค์กร</b> เท่านั้น
              การเลือกตัววัดจึงเป็นการตัดสินใจเชิงธุรกิจที่ปลอมตัวมาเป็นการตัดสินใจเชิงเทคนิค
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week05/fraud_scored.csv" download><button>⬇ fraud_scored.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> วาดเส้นโค้งต้นทุนเอง · หา threshold ที่ดีที่สุดภายใต้เพดานกำลังคน ·
          ทดลองเปลี่ยนอัตราส่วนต้นทุนแล้วดูว่าจุดที่ดีที่สุดขยับไปทางใด ·
          เขียนนโยบายสามระดับ (ปล่อยผ่าน · ให้คนตรวจ · ระงับทันที) ด้วยสอง threshold
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้นักศึกษาเลื่อนแถบหา “จุดที่ดีที่สุด” <b>ก่อน</b> เปิดเผยว่ามีต้นทุนกำกับอยู่
          ส่วนใหญ่จะเลือกช่วง 0.50–0.60 เพราะดูสมดุลและได้ accuracy สูง
          จากนั้นจึงเปิดตัวเลขต้นทุน — ห้องจะเงียบลงเมื่อเห็นว่าทางเลือกที่ “ดูสมดุล”
          แพงกว่าทางเลือกที่ถูกต้องหลายแสนบาท
        </p>
      </div>
    </>
  );
}
