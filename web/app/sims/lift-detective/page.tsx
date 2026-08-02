"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV } from "@/lib/csv";

type Rule = {
  a: string; c: string;
  support: number; confidence: number; lift: number; leverage: number;
  countBoth: number;
};

const MIN_SUPPORT = 0.01;
const pc = (v: number, d = 2) => (v * 100).toFixed(d) + "%";

export default function LiftDetective() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"confidence" | "lift" | "support">("confidence");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week06/baskets.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const model = useMemo(() => {
    if (!rows) return null;

    const baskets = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!baskets.has(r.transaction_id)) baskets.set(r.transaction_id, new Set());
      baskets.get(r.transaction_id)!.add(r.item);
    }
    const txs = [...baskets.values()];
    const n = txs.length;

    const items = [...new Set(rows.map((r) => r.item))];
    const count1 = new Map<string, number>();
    for (const it of items) count1.set(it, txs.filter((t) => t.has(it)).length);

    const rules: Rule[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const both = txs.filter((t) => t.has(items[i]) && t.has(items[j])).length;
        if (both / n < MIN_SUPPORT) continue;
        for (const [a, c] of [[items[i], items[j]], [items[j], items[i]]] as [string, string][]) {
          const sA = count1.get(a)! / n, sC = count1.get(c)! / n, sBoth = both / n;
          rules.push({
            a, c, support: sBoth, confidence: sBoth / sA,
            lift: sBoth / sA / sC, leverage: sBoth - sA * sC, countBoth: both,
          });
        }
      }
    }

    const singles = items
      .map((it) => ({ item: it, support: count1.get(it)! / n }))
      .sort((p, q) => q.support - p.support);

    return { n, rules, singles, avgSize: rows.length / n };
  }, [rows]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!model) return <div className="card"><h2>กำลังโหลด baskets.csv …</h2></div>;

  const sorted = [...model.rules].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 12);
  const topConf = [...model.rules].sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  const trapShare = topConf.filter((r) => r.lift < 1.05).length;
  const best = [...model.rules].sort((a, b) => b.lift - a.lift)[0];
  const hero = model.singles[0];

  return (
    <>
      <div className="pagehead">
        <h1>
          🧺 Lift Detective
          <small>Confidence สูงไม่ได้แปลว่ากฎมีค่า — สัปดาห์ที่ 6</small>
        </h1>
        <div className="row">
          <div className="chip">ตะกร้า<b>{baht(model.n)}</b></div>
          <div className="chip">สินค้าเฉลี่ย/ตะกร้า<b>{model.avgSize.toFixed(2)}</b></div>
          <div className="chip">กฎที่ผ่าน min support<b>{baht(model.rules.length)}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ผู้จัดการร้านขอให้คุณหา <b>“ลูกค้าที่ซื้อ A มักซื้อ B ด้วย”</b> เพื่อนำไปจัดวางสินค้าใหม่
          คุณรัน Apriori แล้วเรียงกฎตาม <b>confidence</b> จากมากไปน้อยตามที่เรียนมา
        </p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <span className="muted">เรียงตาม</span>
          {(["confidence", "lift", "support"] as const).map((s) => (
            <button key={s} className={sortBy === s ? "primary" : undefined} onClick={() => setSortBy(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>ถ้าซื้อ</th><th>ก็มักซื้อ</th>
                <th>Support</th><th>Confidence</th><th>Lift</th><th>ตีความ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={`${r.a}→${r.c}`} className={r.lift > 2 ? "tot" : undefined}>
                  <td>{r.a}</td><td>{r.c}</td>
                  <td>{pc(r.support)}</td>
                  <td><b>{pc(r.confidence)}</b></td>
                  <td>
                    <b className={r.lift > 1.2 ? "ok" : r.lift < 0.95 ? "neg" : undefined}>
                      {r.lift.toFixed(4)}
                    </b>
                  </td>
                  <td className="muted">
                    {r.lift > 2 ? "🎯 สัมพันธ์กันจริงและแรง"
                      : r.lift > 1.2 ? "สัมพันธ์เชิงบวก"
                      : r.lift < 0.95 ? "ซื้ออย่างหนึ่งแล้วมักไม่ซื้ออีกอย่าง"
                      : "⚠️ ไร้ค่า — แค่บังเอิญเพราะของขายดีอยู่แล้ว"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortBy === "confidence" && (
          <div className="note warn">
            <b>สังเกตว่ากฎอันดับต้น ๆ ลงท้ายด้วยสินค้าตัวเดียวกันเกือบทั้งหมด</b> —{" "}
            {trapShare} ใน 10 กฎที่ confidence สูงสุดมี lift ต่ำกว่า 1.05
            ลองกดเรียงตาม lift แล้วดูว่าตารางเปลี่ยนไปอย่างไร
          </div>
        )}
      </div>

      <div className="card">
        <h2>ทำไมกฎเหล่านั้นถึงไร้ค่า</h2>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>สินค้า</th><th>Support เดี่ยว</th><th></th></tr></thead>
            <tbody>
              {model.singles.map((s) => (
                <tr key={s.item} className={s.item === hero.item ? "tot" : undefined}>
                  <td>{s.item}</td>
                  <td><b>{pc(s.support)}</b></td>
                  <td style={{ width: "50%" }}>
                    <span
                      className="inlinebar"
                      style={{
                        width: `${s.support * 260}px`,
                        background: s.item === hero.item ? "var(--warn)" : "var(--acc)",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note warn">
          <b>{hero.item} อยู่ใน {pc(hero.support)} ของทุกตะกร้าอยู่แล้ว</b> —
          ไม่ว่าจะซื้ออะไรก็ตาม โอกาสที่จะได้ {hero.item} ไปด้วยก็ราว {pc(hero.support, 0)} เสมอ
          <br /><br />
          <b>Lift ตอบคำถามที่ถูกต้อง</b> — “การรู้ว่าลูกค้าซื้อ A ทำให้เราทำนาย B ได้ดีขึ้นกว่าการเดาสุ่มกี่เท่า”
          <br />
          <code>lift = confidence(A→B) ÷ support(B)</code> · lift ≈ 1 แปลว่า{" "}
          <b>การรู้ A ไม่ได้ช่วยอะไรเลย</b>
        </div>
      </div>

      <div className="card">
        <h2>🎯 กฎที่มีค่าจริง</h2>
        <div className="kpis">
          <div className="kpi big">
            <span>กฎที่ lift สูงสุด</span>
            <b>{best.a} → {best.c}</b>
          </div>
          <div className="kpi"><span>Support</span><b>{pc(best.support)}</b><small>{baht(best.countBoth)} ตะกร้า</small></div>
          <div className="kpi"><span>Confidence</span><b>{pc(best.confidence)}</b></div>
          <div className="kpi"><span>Lift</span><b className="ok">{best.lift.toFixed(4)}</b></div>
        </div>
        <p className="muted">
          กฎนี้ <b>ไม่เคยติดสิบอันดับแรกเมื่อเรียงตาม confidence</b> —
          เพราะสินค้าปลายทางไม่ได้ขายดีระดับทั่วไป
          กฎที่มีค่าที่สุดจึงเป็นกฎที่วิธีจัดอันดับแบบเดิมมองข้ามไปเสมอ
        </p>
      </div>

      <div className="card">
        <h2>📖 กรณีศึกษา: ผ้าอ้อมกับเบียร์</h2>
        {(() => {
          const r = model.rules.find((x) => x.a === "ผ้าอ้อม" && x.c === "เบียร์");
          if (!r) return <p className="muted">ไม่พบกฎนี้ในข้อมูล</p>;
          return (
            <>
              <div className="kpis">
                <div className="kpi"><span>Support</span><b>{pc(r.support)}</b></div>
                <div className="kpi"><span>Confidence</span><b>{pc(r.confidence)}</b></div>
                <div className="kpi"><span>Lift</span><b className="ok">{r.lift.toFixed(4)}</b></div>
              </div>
              {!revealed ? (
                <>
                  <p>
                    กฎในตำนานปรากฏจริงในข้อมูลชุดนี้ด้วย lift {r.lift.toFixed(2)} —
                    <b> คุณจะย้ายชั้นวางเบียร์ไปข้างผ้าอ้อมเลยหรือไม่</b>
                  </p>
                  <button className="primary" onClick={() => setRevealed(true)}>
                    💡 ดูสิ่งที่ต้องคิดก่อนตัดสินใจ
                  </button>
                </>
              ) : (
                <>
                  <div className="note warn">
                    <b>lift {r.lift.toFixed(2)} บอกว่าทั้งสองเกิดร่วมกันบ่อยกว่าบังเอิญ
                    แต่ไม่ได้บอกว่าอะไรทำให้อะไรเกิด</b>
                    <br /><br />
                    คำอธิบายที่เป็นไปได้ซึ่งข้อมูลชุดนี้แยกไม่ออก
                    <br />ก. พ่อที่ถูกใช้ให้มาซื้อผ้าอ้อมถือโอกาสซื้อเบียร์ (เหตุ → ผล)
                    <br />ข. ครอบครัวที่มีลูกอ่อนอยู่บ้านมากขึ้น จึงดื่มที่บ้านแทนการออกไปข้างนอก (ตัวแปรร่วม)
                    <br />ค. ทั้งสองอย่างขายดีในช่วงเย็นวันศุกร์เหมือนกัน (เวลาเป็นตัวแปรร่วม)
                  </div>
                  <div className="note good">
                    <b>สิ่งที่ต้องทำก่อนย้ายชั้นวาง</b> — ออกแบบการทดลอง
                    ย้ายชั้นวางในสาขาครึ่งหนึ่งที่สุ่มเลือก อีกครึ่งคงเดิม แล้ววัดยอดขายเบียร์ 4 สัปดาห์
                    <br /><br />
                    หากคำอธิบาย ข. หรือ ค. เป็นจริง การย้ายชั้นวางจะไม่เพิ่มยอดขายเลย —
                    และคุณจะเสียพื้นที่ชั้นวางที่ดีที่สุดของร้านไปฟรี ๆ
                    <b> กฎความสัมพันธ์คือสมมติฐาน ไม่ใช่ข้อสรุป</b>
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>

      <div className="card">
        <h2>🕳️ สิ่งที่ Apriori มองไม่เห็น</h2>
        {(() => {
          const pair = model.rules.find(
            (x) => (x.a === "กาแฟสด" && x.c === "ชาเขียว") || (x.a === "ชาเขียว" && x.c === "กาแฟสด")
          );
          const coffee = model.singles.find((s) => s.item === "กาแฟสด");
          const tea = model.singles.find((s) => s.item === "ชาเขียว");
          return (
            <>
              <p>
                กาแฟสดมี support {pc(coffee?.support ?? 0)} · ชาเขียวมี support {pc(tea?.support ?? 0)}{" "}
                แต่กฎระหว่างทั้งสอง{" "}
                <b className="neg">{pair ? `มี lift ${pair.lift.toFixed(4)}` : "ไม่ปรากฏในผลลัพธ์เลย"}</b>
              </p>
              <div className="note warn">
                ทั้งสองไม่เคยอยู่ในตะกร้าเดียวกันแม้แต่ใบเดียว (support = 0) เพราะเป็น
                <b>สินค้าทดแทนกัน</b> — ลูกค้าเลือกอย่างใดอย่างหนึ่ง
                <br /><br />
                Apriori ตัดทุกอย่างที่ต่ำกว่า min support ทิ้งตั้งแต่ต้น{" "}
                <b>ความสัมพันธ์เชิงลบจึงหายไปทั้งหมดโดยไม่มีร่องรอย</b>
                ทั้งที่มันมีค่าทางธุรกิจสูงมาก — ถ้าลดราคากาแฟ ยอดชาเขียวจะตกตามทันที
                ซึ่งเป็นข้อมูลที่ตารางกฎไม่มีวันบอกคุณ
              </div>
            </>
          );
        })()}
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week06/baskets.csv" download><button>⬇ baskets.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> ทำซ้ำด้วย <code>mlxtend.apriori</code> และ <code>association_rules</code> ·
          คำนวณ leverage และ conviction เพิ่ม · หากฎที่มีสินค้าสองชิ้นทางซ้าย ·
          ประเมินมูลค่าเป็นเงินของกฎที่ดีที่สุด และออกแบบการทดลองเพื่อยืนยัน
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          เปิดหน้านี้โดยเรียงตาม confidence แล้วถามว่า “กฎไหนน่าเอาไปใช้ที่สุด”
          ห้องจะเลือกกฎอันดับต้น ๆ ซึ่งลงท้ายด้วย{hero.item}ทั้งหมด
          จากนั้นให้ดูตาราง support เดี่ยว — จะมีเสียง “อ๋อ” พร้อมกันทั้งห้อง
          <br /><br />
          ปิดท้ายที่การ์ดสุดท้าย ซึ่งเป็นประเด็นที่ตำราส่วนใหญ่ไม่พูดถึง:
          เครื่องมือนี้ถูกออกแบบมาให้มองไม่เห็นความสัมพันธ์เชิงลบตั้งแต่แรก
        </p>
      </div>
    </>
  );
}
