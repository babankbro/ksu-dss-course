"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";
import {
  applyStandardizer, auc, fitLogistic, fitStandardizer, mean, predictLogistic,
} from "@/lib/ml";

type Feature = { key: string; label: string; leaky: boolean; why: string };

const FEATURES: Feature[] = [
  { key: "income_at_application", label: "รายได้ ณ วันยื่นคำขอ", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "debt_ratio_at_application", label: "สัดส่วนหนี้ต่อรายได้", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "credit_history_months_at_application", label: "อายุประวัติเครดิต (เดือน)", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "age_at_application", label: "อายุผู้กู้", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "prev_loans_at_application", label: "จำนวนสินเชื่อเดิม", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "loan_amount_at_application", label: "วงเงินที่ขอ", leaky: false,
    why: "บันทึกไว้ตอนยื่นคำขอ ใช้ได้แน่นอน" },
  { key: "collection_calls", label: "จำนวนครั้งที่โทรทวงหนี้", leaky: true,
    why: "เกิดขึ้นหลังอนุมัติแล้ว — ณ วันที่ต้องตัดสินใจ ค่านี้ยังไม่มี" },
  { key: "days_since_last_payment", label: "จำนวนวันนับจากชำระครั้งล่าสุด", leaky: true,
    why: "ต้องมีการชำระเกิดขึ้นก่อน จึงเป็นข้อมูลหลังอนุมัติ" },
  { key: "status_bad", label: "สถานะบัญชี = ค้างชำระ", leaky: true,
    why: "แทบจะเป็นคำตอบโดยตรง — บัญชีค้างชำระคือนิยามของการผิดนัด" },
];

const LEGIT = FEATURES.filter((f) => !f.leaky).map((f) => f.key);
const pc = (v: number, d = 2) => (v * 100).toFixed(d) + "%";

export default function LeakageHunter() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(FEATURES.map((f) => f.key)));
  const [temporal, setTemporal] = useState(false);
  const [audited, setAudited] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week05/loan_leaky.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  /** แปลงเป็นตัวเลขครั้งเดียว แล้วเรียงตามวันที่ยื่นคำขอไว้ให้พร้อมใช้ */
  const base = useMemo(() => {
    if (!rows) return null;
    const recs = rows.map((r) => ({
      date: r.application_date,
      y: num(r.defaulted),
      v: Object.fromEntries(
        FEATURES.map((f) => [
          f.key,
          f.key === "status_bad" ? (r.account_status === "ค้างชำระ" ? 1 : 0) : num(r[f.key]),
        ])
      ) as Record<string, number>,
    }));
    const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date));
    // สลับลำดับแบบกำหนดเมล็ด ให้ผลเหมือนเดิมทุกครั้ง
    const shuffled = [...recs];
    let s = 42;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { recs, sorted, shuffled };
  }, [rows]);

  /** AUC ของตัวแปรเดี่ยว — เครื่องมือตรวจจับการรั่วที่ไม่ต้องฝึกโมเดล */
  const soloAuc = useMemo(() => {
    if (!base) return null;
    const y = base.recs.map((r) => r.y);
    return FEATURES.map((f) => ({
      ...f,
      a: auc(base.recs.map((r) => r.v[f.key]), y),
    })).sort((p, q) => Math.abs(q.a - 0.5) - Math.abs(p.a - 0.5));
  }, [base]);

  const result = useMemo(() => {
    if (!base) return null;
    const cols = FEATURES.filter((f) => picked.has(f.key)).map((f) => f.key);
    if (!cols.length) return null;

    const order = temporal ? base.sorted : base.shuffled;
    const k = Math.floor(order.length * 0.7);
    const tr = order.slice(0, k), te = order.slice(k);

    const Xtr0 = tr.map((r) => cols.map((c) => r.v[c]));
    const st = fitStandardizer(Xtr0);
    const Xtr = applyStandardizer(Xtr0, st);
    const Xte = applyStandardizer(te.map((r) => cols.map((c) => r.v[c])), st);
    const ytr = tr.map((r) => r.y), yte = te.map((r) => r.y);

    const w = fitLogistic(Xtr, ytr);
    const pte = predictLogistic(Xte, w);
    return {
      aucTr: auc(predictLogistic(Xtr, w), ytr),
      aucTe: auc(pte, yte),
      predRate: mean(pte),
      actualTe: mean(yte),
      actualTr: mean(ytr),
      nTr: tr.length, nTe: te.length,
      // ต้องหาค่าต่ำสุด/สูงสุด ไม่ใช่หัวท้ายของอาเรย์ เพราะการแบ่งแบบสุ่มไม่ได้เรียงตามเวลา
      teFrom: te.reduce((a, r) => (r.date < a ? r.date : a), te[0].date),
      teTo: te.reduce((a, r) => (r.date > a ? r.date : a), te[0].date),
      usesLeak: cols.some((c) => FEATURES.find((f) => f.key === c)!.leaky),
    };
  }, [base, picked, temporal]);

  /** อัตราผิดนัดรายครึ่งปี — หลักฐานของ population drift */
  const drift = useMemo(() => {
    if (!base) return null;
    const m = new Map<string, { n: number; d: number }>();
    for (const r of base.recs) {
      const half = `${r.date.slice(0, 4)}-H${+r.date.slice(5, 7) <= 6 ? 1 : 2}`;
      const e = m.get(half) ?? { n: 0, d: 0 };
      e.n++; e.d += r.y;
      m.set(half, e);
    }
    return [...m.entries()].sort().map(([k, v]) => ({ k, rate: v.d / v.n, n: v.n }));
  }, [base]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!base || !soloAuc || !drift) return <div className="card"><h2>กำลังโหลด loan_leaky.csv …</h2></div>;

  const toggle = (k: string) =>
    setPicked((p) => {
      const s = new Set(p);
      if (s.has(k)) s.delete(k); else s.add(k);
      return s;
    });

  const gap = result ? result.actualTe - result.predRate : 0;

  return (
    <>
      <div className="pagehead">
        <h1>
          🕵️ Leakage Hunter
          <small>โมเดลที่แม่นเกินจริง คือรายงานบั๊ก ไม่ใช่ความสำเร็จ — สัปดาห์ที่ 5</small>
        </h1>
        <div className="row">
          <div className="chip">คำขอสินเชื่อ<b>{baht(base.recs.length)}</b></div>
          <div className="chip">ผิดนัดชำระ<b className="neg">{pc(mean(base.recs.map((r) => r.y)))}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ธนาคารให้ตารางคำขอสินเชื่อย้อนหลัง 3 ปีมาสร้างโมเดลทำนายการผิดนัดชำระ
          ตารางนี้ถูกดึงจากระบบปฏิบัติการ <b>ณ วันนี้</b> — จึงมีคอลัมน์ที่บันทึกเหตุการณ์
          ซึ่งเกิดขึ้น <b>หลัง</b> การอนุมัติปนอยู่ด้วย
        </p>
        <p className="muted">
          คำถามที่ต้องถามกับทุกคอลัมน์: <b>“ณ วินาทีที่ต้องตัดสินใจอนุมัติ ค่านี้มีอยู่แล้วหรือยัง”</b>
        </p>
      </div>

      <div className="card">
        <h2>เลือกตัวแปรที่จะใส่ในโมเดล</h2>
        <div className="featgrid">
          {FEATURES.map((f) => {
            const on = picked.has(f.key);
            return (
              <button
                key={f.key}
                className={`feat${on ? " on" : ""}${audited && f.leaky ? " leak" : ""}`}
                onClick={() => toggle(f.key)}
              >
                <b>{on ? "☑" : "☐"} {f.label}</b>
                <small>{audited ? f.why : <code>{f.key}</code>}</small>
                {audited && <em>{f.leaky ? "🚨 ข้อมูลรั่ว" : "✓ ใช้ได้"}</em>}
              </button>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => setPicked(new Set(FEATURES.map((f) => f.key)))}>เลือกทุกตัวแปร</button>
          <button onClick={() => setPicked(new Set(LEGIT))}>เฉพาะตัวแปรที่ถูกต้องตามเวลา</button>
          <button className={temporal ? "primary" : undefined} onClick={() => setTemporal((v) => !v)}>
            การแบ่งข้อมูล: {temporal ? "ตามเวลา (temporal)" : "สุ่ม (random)"}
          </button>
          {!audited && (
            <button className="primary" onClick={() => setAudited(true)}>🔍 ตรวจสอบว่าตัวแปรใดรั่ว</button>
          )}
        </div>
      </div>

      {result && (
        <div className="card">
          <h2>ผลของโมเดล</h2>
          <div className="kpis">
            <div className="kpi"><span>AUC บนชุดฝึก</span><b>{result.aucTr.toFixed(4)}</b></div>
            <div className="kpi big">
              <span>AUC บนชุดทดสอบ</span>
              <b className={result.aucTe > 0.95 ? "neg" : "ok"}>{result.aucTe.toFixed(4)}</b>
            </div>
            <div className="kpi"><span>ชุดฝึก / ชุดทดสอบ</span><b>{baht(result.nTr)} / {baht(result.nTe)}</b></div>
            <div className="kpi">
              <span>ช่วงเวลาของชุดทดสอบ</span>
              <b style={{ fontSize: 15 }}>{result.teFrom} → {result.teTo}</b>
            </div>
          </div>

          {result.aucTe > 0.95 && (
            <div className="note warn">
              <b>AUC {result.aucTe.toFixed(4)} — นี่ไม่ใช่ข่าวดี</b> ปัญหาการทำนายการผิดนัดชำระ
              เป็นปัญหาที่ยากโดยธรรมชาติ โมเดลที่ดีในอุตสาหกรรมอยู่ราว 0.70–0.80
              ค่าที่ใกล้ 1.00 แปลว่าโมเดลกำลังอ่านคำตอบจากตัวแปรที่ยังไม่มีอยู่ ณ เวลาที่ต้องตัดสินใจ
            </div>
          )}

          <h3 style={{ marginTop: 18 }}>การสอบเทียบ (calibration) บนชุดทดสอบ</h3>
          <div className="kpis">
            <div className="kpi"><span>อัตราผิดนัดที่โมเดลทำนาย</span><b>{pc(result.predRate)}</b></div>
            <div className="kpi"><span>อัตราผิดนัดที่เกิดขึ้นจริง</span><b>{pc(result.actualTe)}</b></div>
            <div className="kpi">
              <span>ประเมินต่ำกว่าจริง</span>
              <b className={Math.abs(gap) > 0.02 ? "neg" : "ok"}>{(gap * 100).toFixed(2)} จุด</b>
            </div>
          </div>

          {!temporal && (
            <div className="note warn">
              <b>การแบ่งแบบสุ่มกำลังปกปิดปัญหา</b> — ชุดทดสอบมีคำขอตั้งแต่ {result.teFrom} ถึง {result.teTo}
              ซึ่งคาบเกี่ยวกับชุดฝึกทั้งช่วง โมเดลจึงได้ “เห็นอนาคต” ระหว่างฝึก
              ลองสลับไปเป็นการแบ่งตามเวลาแล้วดูค่าการสอบเทียบอีกครั้ง
            </div>
          )}
          {temporal && Math.abs(gap) > 0.02 && (
            <div className="note warn">
              <b>โมเดลประเมินความเสี่ยงต่ำกว่าความจริง {(gap * 100).toFixed(2)} จุด</b>{" "}
              ({((gap / result.predRate) * 100).toFixed(0)}% ของค่าที่ทำนาย) เพราะพฤติกรรมของประชากรเปลี่ยนไปตามเวลา
              การแบ่งตามเวลาทำให้เห็นปัญหานี้ ส่วนการแบ่งแบบสุ่มทำให้มองไม่เห็นเลย
            </div>
          )}
        </div>
      )}

      {!result && (
        <div className="card">
          <div className="note warn">ต้องเลือกอย่างน้อยหนึ่งตัวแปรจึงจะฝึกโมเดลได้</div>
        </div>
      )}

      <div className="card">
        <h2>🔍 เครื่องมือตรวจจับการรั่วที่ไม่ต้องฝึกโมเดล</h2>
        <p className="muted">
          คำนวณ AUC ของ <b>ตัวแปรเดี่ยว</b> เทียบกับคำตอบ ตัวแปรใดที่เพียงตัวเดียวก็แยกได้เกือบสมบูรณ์
          แทบจะรับประกันได้ว่าเป็นข้อมูลที่รั่วมาจากอนาคต
        </p>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ตัวแปร</th><th>AUC เดี่ยว</th><th>ตีความ</th></tr></thead>
            <tbody>
              {soloAuc.map((f) => (
                <tr key={f.key} className={f.a > 0.9 ? "tot" : undefined}>
                  <td><code>{f.key}</code></td>
                  <td className={f.a > 0.9 ? "neg" : undefined}><b>{f.a.toFixed(4)}</b></td>
                  <td className="muted">
                    {f.a > 0.9 ? "🚨 สูงจนผิดธรรมชาติ — ต้องสอบสวนก่อนใช้"
                      : f.a > 0.6 ? "มีสัญญาณพอสมควร ตามที่ควรเป็น"
                      : "แทบไม่มีสัญญาณเดี่ยว"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>📉 พฤติกรรมของประชากรเปลี่ยนไปตามเวลา</h2>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ช่วงเวลา</th><th>จำนวนคำขอ</th><th>อัตราผิดนัด</th><th></th></tr></thead>
            <tbody>
              {drift.map((d) => (
                <tr key={d.k}>
                  <td>{d.k}</td>
                  <td>{baht(d.n)}</td>
                  <td><b>{pc(d.rate)}</b></td>
                  <td style={{ width: "45%" }}>
                    <span
                      className="inlinebar"
                      style={{ width: `${(d.rate / 0.13) * 160}px`, background: "var(--bad)" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note">
          อัตราผิดนัดเพิ่มขึ้นเกือบเท่าตัวตลอด 3 ปี — โมเดลที่ฝึกจากอดีตจึงประเมินความเสี่ยงของอนาคต
          <b>ต่ำกว่าความจริงเสมอ</b> นี่คือเหตุผลที่ต้องแบ่งข้อมูลตามเวลา ไม่ใช่แบ่งแบบสุ่ม
          และเป็นเหตุผลที่โมเดลต้องถูกฝึกใหม่ตามรอบ
        </div>
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week05/loan_leaky.csv" download><button>⬇ loan_leaky.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> ทำซ้ำทั้ง 4 กรณี (มี/ไม่มีตัวแปรรั่ว × สุ่ม/ตามเวลา) ·
          เขียน checklist ตรวจการรั่วที่ใช้ได้กับโปรเจกต์อื่น ·
          อธิบายว่าเหตุใด cross-validation แบบธรรมดาจึงไม่ช่วยตรวจจับการรั่วชนิดนี้
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          เริ่มด้วยการเลือกทุกตัวแปรและแบ่งแบบสุ่ม — นักศึกษาจะเห็น AUC ใกล้ 1.00 และดีใจ
          ให้ถามคำถามเดียวว่า <b>“ถ้าโมเดลนี้ดีขนาดนี้จริง ทำไมธนาคารทุกแห่งยังขาดทุนจากหนี้เสีย”</b>{" "}
          แล้วค่อยกดปุ่มตรวจสอบตัวแปร จุดที่ต้องย้ำคือ <b>ไม่มี error ใดเกิดขึ้นเลย</b>{" "}
          โมเดลรันผ่าน ตัวเลขสวย และผิดทั้งหมด
        </p>
      </div>
    </>
  );
}
