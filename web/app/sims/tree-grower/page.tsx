"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num } from "@/lib/csv";
import { entropy, evaluateSplit } from "@/lib/ml";

type Rec = Record<string, string | number> & { churned: number };

/** เงื่อนไขแบ่งสองทางที่ผู้เรียนเลือกได้ — ตรงกับรายการเดียวกันในใบงาน Colab */
const CANDIDATES: { id: string; label: string; test: (r: Rec) => boolean }[] = [
  { id: "c_month", label: "ประเภทสัญญา = รายเดือน", test: (r) => r.contract_type === "รายเดือน" },
  { id: "c_2y", label: "ประเภทสัญญา = 2 ปี", test: (r) => r.contract_type === "2 ปี" },
  { id: "t12", label: "อายุการใช้งาน ≤ 12 เดือน", test: (r) => (r.tenure_months as number) <= 12 },
  { id: "t24", label: "อายุการใช้งาน ≤ 24 เดือน", test: (r) => (r.tenure_months as number) <= 24 },
  { id: "t36", label: "อายุการใช้งาน ≤ 36 เดือน", test: (r) => (r.tenure_months as number) <= 36 },
  { id: "charge", label: "ค่าบริการ > 1,000 บาท", test: (r) => (r.monthly_charge as number) > 1000 },
  { id: "sup2", label: "แจ้งปัญหา ≥ 2 ครั้ง", test: (r) => (r.support_tickets as number) >= 2 },
  { id: "sup3", label: "แจ้งปัญหา ≥ 3 ครั้ง", test: (r) => (r.support_tickets as number) >= 3 },
  { id: "fiber", label: "อินเทอร์เน็ต = ไฟเบอร์", test: (r) => r.internet_type === "ไฟเบอร์" },
  { id: "nopay", label: "ไม่ได้ตัดบัญชีอัตโนมัติ", test: (r) => r.auto_payment === "ไม่" },
  { id: "paperless", label: "รับใบแจ้งหนี้อิเล็กทรอนิกส์", test: (r) => r.paperless_billing === "ใช่" },
];

const pc = (v: number, d = 2) => (v * 100).toFixed(d) + "%";

/** เส้นทางในต้นไม้: รายการของ (id ของเงื่อนไข, ไปทางซ้ายหรือไม่) */
type Path = { id: string; left: boolean }[];

export default function TreeGrower() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rootSplit, setRootSplit] = useState<string | null>(null);
  const [childSplit, setChildSplit] = useState<Record<string, string>>({});
  const [showRank, setShowRank] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week05/churn.csv").then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const all: Rec[] | null = useMemo(() => {
    if (!rows) return null;
    return rows.map((r) => ({
      contract_type: r.contract_type,
      tenure_months: num(r.tenure_months),
      monthly_charge: num(r.monthly_charge),
      support_tickets: num(r.support_tickets),
      internet_type: r.internet_type,
      paperless_billing: r.paperless_billing,
      auto_payment: r.auto_payment,
      churned: num(r.churned),
    }));
  }, [rows]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!all) return <div className="card"><h2>กำลังโหลด churn.csv …</h2></div>;

  const subsetOf = (path: Path) =>
    path.reduce((acc, step) => {
      const cand = CANDIDATES.find((c) => c.id === step.id)!;
      return acc.filter((r) => cand.test(r) === step.left);
    }, all);

  const rank = (data: Rec[]) => {
    const labels = data.map((r) => r.churned);
    return CANDIDATES.map((c) => ({ cand: c, res: evaluateSplit(labels, data.map(c.test)) }))
      .filter((x) => x.res.nLeft > 0 && x.res.nRight > 0)
      .sort((a, b) => b.res.gain - a.res.gain);
  };

  const nodeStats = (data: Rec[]) => {
    const pos = data.reduce((s, r) => s + r.churned, 0);
    return { n: data.length, pos, rate: data.length ? pos / data.length : 0, ent: entropy(pos, data.length) };
  };

  const root = nodeStats(all);
  const rootRank = rank(all);
  const bestRootGain = rootRank[0].res.gain;

  /** โหนดลูกทั้งสองของราก (จะมีก็ต่อเมื่อเลือกการแบ่งที่รากแล้ว) */
  const children = rootSplit
    ? ([true, false] as const).map((left) => {
        const path: Path = [{ id: rootSplit, left }];
        const data = subsetOf(path);
        const key = `${rootSplit}|${left}`;
        return { left, data, key, stats: nodeStats(data), rank: rank(data), chosen: childSplit[key] };
      })
    : null;

  const leaves = children?.flatMap((ch) => {
    if (!ch.chosen) return [{ ...ch.stats, label: `${ch.left ? "ใช่" : "ไม่ใช่"} (ยังไม่แบ่งต่อ)` }];
    const cand = CANDIDATES.find((c) => c.id === ch.chosen)!;
    return ([true, false] as const).map((left) => {
      const d = ch.data.filter((r) => cand.test(r) === left);
      return {
        ...nodeStats(d),
        label: `${ch.left ? "ใช่" : "ไม่ใช่"} → ${cand.label} ${left ? "ใช่" : "ไม่ใช่"}`,
      };
    });
  });

  /** ความแม่นของต้นไม้เมื่อทุกใบทำนายตามเสียงข้างมากของตัวเอง */
  const treeAcc = leaves
    ? leaves.reduce((s, l) => s + Math.max(l.pos, l.n - l.pos), 0) / root.n
    : null;
  const majorityAcc = Math.max(root.pos, root.n - root.pos) / root.n;

  const splitCard = (
    data: Rec[], list: ReturnType<typeof rank>, chosen: string | undefined,
    onPick: (id: string) => void, title: string, reveal: boolean
  ) => {
    const st = nodeStats(data);
    return (
      <div className="card">
        <h2>{title}</h2>
        <div className="kpis">
          <div className="kpi"><span>จำนวนลูกค้า</span><b>{baht(st.n)}</b></div>
          <div className="kpi"><span>เลิกใช้บริการ</span><b className="neg">{pc(st.rate)}</b></div>
          <div className="kpi"><span>Entropy</span><b>{st.ent.toFixed(4)}</b></div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>เงื่อนไขการแบ่ง</th>
                <th>ซ้าย (ใช่)</th><th>อัตราเลิกใช้</th>
                <th>ขวา (ไม่ใช่)</th><th>อัตราเลิกใช้</th>
                <th>{reveal ? "Information Gain" : "เลือก"}</th>
              </tr>
            </thead>
            <tbody>
              {(reveal ? list : CANDIDATES.map((c) => list.find((l) => l.cand.id === c.id)!).filter(Boolean))
                .map(({ cand, res }) => (
                  <tr key={cand.id} className={chosen === cand.id ? "tot" : undefined}>
                    <td>{cand.label}</td>
                    <td>{baht(res.nLeft)}</td>
                    <td>{pc(res.posLeft / (res.nLeft || 1))}</td>
                    <td>{baht(res.nRight)}</td>
                    <td>{pc(res.posRight / (res.nRight || 1))}</td>
                    <td>
                      {reveal ? (
                        <b className={res.gain >= list[0].res.gain * 0.999 ? "ok" : undefined}>
                          {res.gain.toFixed(4)}
                        </b>
                      ) : (
                        <button
                          className={chosen === cand.id ? "primary" : undefined}
                          onClick={() => onPick(cand.id)}
                        >
                          เลือก
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="pagehead">
        <h1>
          🌳 Decision Tree Grower
          <small>ปลูกต้นไม้ตัดสินใจด้วยมือ แล้วเทียบกับสิ่งที่ entropy บอก — สัปดาห์ที่ 5</small>
        </h1>
        <div className="row">
          <div className="chip">ลูกค้า<b>{baht(root.n)}</b></div>
          <div className="chip">เลิกใช้บริการ<b className="neg">{pc(root.rate)}</b></div>
          <div className="chip">Entropy ที่ราก<b>{root.ent.toFixed(4)}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          บริษัทโทรคมนาคมต้องการรู้ว่า <b>ลูกค้ากลุ่มใดกำลังจะเลิกใช้บริการ</b>{" "}
          และที่สำคัญกว่านั้นคือ <b>ต้องอธิบายเหตุผลให้ทีมการตลาดเข้าใจได้</b>{" "}
          ต้นไม้ตัดสินใจจึงเหมาะกว่าโมเดลที่แม่นกว่าแต่อธิบายไม่ได้
        </p>
        <div className="note">
          <b>กฎของเกม</b> — เลือกคำถามที่จะถามก่อนที่ราก จากนั้นเลือกคำถามที่สองของแต่ละกิ่ง
          ระบบจะยังไม่บอกว่าอันไหนดีที่สุดจนกว่าคุณจะกดเปิดเฉลย
          <br />เป้าหมายคือทำให้แต่ละใบ <b>บริสุทธิ์ที่สุด</b> — เกือบทั้งใบเป็นลูกค้าประเภทเดียวกัน
        </div>
      </div>

      {splitCard(all, rootRank, rootSplit ?? undefined, (id) => { setRootSplit(id); setChildSplit({}); },
        "ขั้นที่ 1 — เลือกคำถามแรกที่ราก", showRank)}

      {children && (
        <>
          <div className="card">
            <h2>ขั้นที่ 2 — แบ่งต่อในแต่ละกิ่ง</h2>
            <p className="muted">
              รากถูกแบ่งด้วย <b>{CANDIDATES.find((c) => c.id === rootSplit)!.label}</b>
            </p>
            <div className="deptgrid">
              {children.map((ch) => (
                <div key={ch.key} className={`deptcard${ch.stats.rate > 0.5 ? " governed" : ""}`}>
                  <div className="ico">{ch.left ? "✔" : "✘"}</div>
                  <b>{ch.left ? "ใช่" : "ไม่ใช่"}</b>
                  <div className="deptval">{pc(ch.stats.rate)}</div>
                  <small className="muted">
                    {baht(ch.stats.n)} ราย · entropy {ch.stats.ent.toFixed(4)}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {children.map((ch) =>
            splitCard(
              ch.data, ch.rank, ch.chosen,
              (id) => setChildSplit((m) => ({ ...m, [ch.key]: id })),
              `กิ่ง “${ch.left ? "ใช่" : "ไม่ใช่"}” — เลือกคำถามที่สอง`,
              showRank
            )
          )}
        </>
      )}

      {leaves && (
        <div className="card">
          <h2>ต้นไม้ที่คุณปลูกได้</h2>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>ใบ</th><th>จำนวน</th><th>อัตราเลิกใช้</th><th>ทำนายว่า</th><th>ทายถูก</th></tr></thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.label}>
                    <td>{l.label}</td>
                    <td>{baht(l.n)}</td>
                    <td><b className={l.rate > 0.5 ? "neg" : "ok"}>{pc(l.rate)}</b></td>
                    <td>{l.rate > 0.5 ? "เลิกใช้" : "อยู่ต่อ"}</td>
                    <td>{baht(Math.max(l.pos, l.n - l.pos))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="kpis">
            <div className="kpi"><span>ความแม่นของต้นไม้</span><b className="ok">{pc(treeAcc!)}</b></div>
            <div className="kpi"><span>ทายเสียงข้างมากอย่างเดียว</span><b>{pc(majorityAcc)}</b></div>
            <div className="kpi">
              <span>ดีขึ้นจากการไม่มีโมเดล</span>
              <b>{((treeAcc! - majorityAcc) * 100).toFixed(2)} จุด</b>
            </div>
          </div>
          <div className="note warn">
            <b>อย่าเพิ่งดีใจกับความแม่น</b> — การทายว่า “อยู่ต่อ” ทุกรายได้ {pc(majorityAcc)} ทันที
            คุณค่าจริงของต้นไม้ต้นนี้ไม่ได้อยู่ที่ความแม่น แต่อยู่ที่มัน{" "}
            <b>ชี้ตัวกลุ่มเสี่ยงสูงที่ทีมการตลาดไปทำงานต่อได้</b>
          </div>
        </div>
      )}

      <div className="card">
        <h2>เฉลยและ Information Gain</h2>
        {!showRank ? (
          <>
            <p className="muted">
              เปิดเฉลยเพื่อดูค่า Information Gain ของทุกเงื่อนไข เรียงจากมากไปน้อย —
              แนะนำให้เลือกด้วยสัญชาตญาณก่อนแล้วค่อยเปิด
            </p>
            <button className="primary" onClick={() => setShowRank(true)}>💡 เปิดเฉลย</button>
          </>
        ) : (
          <>
            <div className="note good">
              เงื่อนไขที่ดีที่สุดที่รากคือ <b>{rootRank[0].cand.label}</b>{" "}
              ให้ Information Gain <b>{bestRootGain.toFixed(4)}</b> —
              แบ่งลูกค้าเป็นกลุ่มเสี่ยง {pc(rootRank[0].res.posLeft / rootRank[0].res.nLeft)}{" "}
              และกลุ่มปลอดภัย {pc(rootRank[0].res.posRight / rootRank[0].res.nRight)}
              {rootSplit === rootRank[0].cand.id
                ? " — ตรงกับที่คุณเลือกพอดี"
                : rootSplit
                ? ` ส่วนที่คุณเลือกให้ค่า ${rootRank.find((r) => r.cand.id === rootSplit)!.res.gain.toFixed(4)}`
                : ""}
            </div>
            <div className="note warn">
              <b>ตัวแปรที่ไร้ประโยชน์ก็มีอยู่จริง</b> —{" "}
              {rootRank[rootRank.length - 1].cand.label} ให้ Gain เพียง{" "}
              <b>{rootRank[rootRank.length - 1].res.gain.toFixed(4)}</b>{" "}
              ซึ่งแทบเป็นศูนย์ การใส่ตัวแปรเข้าโมเดลให้มากที่สุดจึงไม่ใช่กลยุทธ์ที่ดี —
              ตัวแปรที่ไม่มีสัญญาณเพิ่มแต่โอกาสให้โมเดลจดจำเสียงรบกวน
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week05/churn.csv" download><button>⬇ churn.csv</button></a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> คำนวณ entropy และ information gain ด้วยมือให้ตรงกับหน้านี้ทุกทศนิยม ·
          เทียบกับ <code>DecisionTreeClassifier</code> ของ scikit-learn ·
          ทดลองปล่อยให้ต้นไม้ลึกไม่จำกัดแล้วดูว่าความแม่นบนชุดฝึกกับชุดทดสอบแยกจากกันเมื่อใด
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้นักศึกษาเลือกด้วยสัญชาตญาณก่อนเปิดเฉลย ส่วนใหญ่จะเลือก “ค่าบริการสูง” หรือ “แจ้งปัญหาบ่อย”
          เพราะฟังดูเป็นเหตุเป็นผล ทั้งที่ทั้งสองให้ Gain ต่ำกว่า “ประเภทสัญญา” หลายเท่า
          จุดที่ต้องย้ำคือ <b>ความรู้สึกว่าตัวแปรใดสำคัญ ไม่ใช่หลักฐาน</b> —
          information gain คือหลักฐาน และมันวัดได้
        </p>
      </div>
    </>
  );
}
