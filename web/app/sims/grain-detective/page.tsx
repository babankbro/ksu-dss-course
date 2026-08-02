"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num, pctStr } from "@/lib/csv";

/* หมวดสินค้าอ้างอิง (ตรงกับ datasets/week03/ref_product.csv) */
const CATEGORY: Record<string, string> = {
  "P-101": "เครื่องดื่ม", "P-102": "เครื่องดื่ม", "P-103": "เครื่องดื่ม",
  "P-201": "ของใช้ในบ้าน", "P-202": "ของใช้ในบ้าน", "P-203": "ของใช้ในบ้าน",
  "P-301": "เครื่องใช้ไฟฟ้า", "P-302": "เครื่องใช้ไฟฟ้า",
};

type GrainKey = "raw" | "line" | "receipt" | "payment";

const GRAINS: { key: GrainKey; label: string; desc: string; keyOf: (r: Row) => string }[] = [
  {
    key: "raw",
    label: "หนึ่งแถวในไฟล์ดิบ",
    desc: "ไม่ทำอะไรเลย — โหลดไฟล์เข้า fact table ตามที่ได้มา (line × payment)",
    keyOf: (r) => `${r.receipt_no}|${r.line_no}|${r.payment_seq}`,
  },
  {
    key: "line",
    label: "หนึ่งรายการสินค้าในใบเสร็จ",
    desc: "หนึ่งแถวแทนสินค้าหนึ่งรายการที่ขายในใบเสร็จหนึ่งใบ (receipt × line)",
    keyOf: (r) => `${r.receipt_no}|${r.line_no}`,
  },
  {
    key: "receipt",
    label: "หนึ่งใบเสร็จ",
    desc: "หนึ่งแถวแทนหนึ่งใบเสร็จ เก็บเฉพาะยอดรวมท้ายบิล",
    keyOf: (r) => `${r.receipt_no}`,
  },
  {
    key: "payment",
    label: "หนึ่งการชำระเงิน",
    desc: "หนึ่งแถวแทนการชำระหนึ่งครั้ง (receipt × payment)",
    keyOf: (r) => `${r.receipt_no}|${r.payment_seq}`,
  },
];

type Q = {
  id: string;
  q: string;
  needs: string;
  /** คำนวณคำตอบจากชุดแถวที่ผ่านการยุบตาม grain ที่เลือก */
  calc: (rows: Row[]) => number;
  fmt: (v: number) => string;
};

const QUESTIONS: Q[] = [
  {
    id: "q1", q: "ยอดขายสุทธิรวมทั้งหมด (บาท)", needs: "ระดับรายการสินค้า",
    calc: (rows) => rows.reduce((s, r) => s + num(r.line_net_amount), 0),
    fmt: (v) => baht(v) + " บาท",
  },
  {
    id: "q2", q: "จำนวนชิ้นที่ขายได้ของสินค้า P-101", needs: "ระดับรายการสินค้า",
    calc: (rows) => rows.filter((r) => r.sku === "P-101").reduce((s, r) => s + num(r.quantity), 0),
    fmt: (v) => baht(v) + " ชิ้น",
  },
  {
    id: "q3", q: "ยอดขายหมวดเครื่องใช้ไฟฟ้า (บาท)", needs: "ระดับรายการสินค้า",
    calc: (rows) =>
      rows.filter((r) => CATEGORY[r.sku] === "เครื่องใช้ไฟฟ้า")
          .reduce((s, r) => s + num(r.line_net_amount), 0),
    fmt: (v) => baht(v) + " บาท",
  },
  {
    id: "q4", q: "มูลค่าเฉลี่ยต่อใบเสร็จ (บาท)", needs: "ระดับใบเสร็จ",
    calc: (rows) => {
      const m = new Map<string, number>();
      rows.forEach((r) => m.set(r.receipt_no, num(r.receipt_total)));
      let s = 0;
      m.forEach((v) => (s += v));
      return m.size ? s / m.size : 0;
    },
    fmt: (v) => baht(v, 2) + " บาท",
  },
  {
    id: "q5", q: "สัดส่วนยอดเงินที่ชำระด้วยพร้อมเพย์", needs: "ระดับการชำระเงิน",
    calc: (rows) => {
      let pp = 0, all = 0;
      rows.forEach((r) => {
        const a = num(r.payment_amount);
        all += a;
        if (r.payment_method === "พร้อมเพย์") pp += a;
      });
      return all ? pp / all : 0;
    },
    fmt: (v) => pctStr(v, 2),
  },
  {
    id: "q6", q: "จำนวนใบเสร็จที่ชำระมากกว่า 1 วิธี", needs: "ระดับการชำระเงิน",
    calc: (rows) => {
      const m = new Map<string, Set<string>>();
      rows.forEach((r) => {
        if (!m.has(r.receipt_no)) m.set(r.receipt_no, new Set());
        m.get(r.receipt_no)!.add(r.payment_seq);
      });
      let n = 0;
      m.forEach((s) => { if (s.size > 1) n++; });
      return n;
    },
    fmt: (v) => baht(v) + " ใบ",
  },
];

/** ยุบแถวตาม grain ที่เลือก (เก็บแถวแรกของแต่ละคีย์) */
function collapse(rows: Row[], keyOf: (r: Row) => string): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const r of rows) {
    const k = keyOf(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export default function GrainDetective() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [grain, setGrain] = useState<GrainKey>("raw");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadCSV("/datasets/week03/pos_receipt_lines.csv")
      .then(setRows)
      .catch((e) => setErr(String(e)));
  }, []);

  /** ค่าจริง: คำนวณจาก grain ที่ถูกต้องของคำถามนั้นๆ */
  const truth = useMemo(() => {
    if (!rows) return null;
    const byLine = collapse(rows, GRAINS[1].keyOf);
    const byPay = collapse(rows, GRAINS[3].keyOf);
    return {
      q1: QUESTIONS[0].calc(byLine),
      q2: QUESTIONS[1].calc(byLine),
      q3: QUESTIONS[2].calc(byLine),
      q4: QUESTIONS[3].calc(byPay),
      q5: QUESTIONS[4].calc(byPay),
      q6: QUESTIONS[5].calc(byPay),
    } as Record<string, number>;
  }, [rows]);

  const g = GRAINS.find((x) => x.key === grain)!;
  const collapsed = useMemo(() => (rows ? collapse(rows, g.keyOf) : []), [rows, g]);
  const answers = useMemo(
    () => (rows ? Object.fromEntries(QUESTIONS.map((q) => [q.id, q.calc(collapsed)])) : {}),
    [collapsed, rows]
  );

  if (err)
    return (
      <div className="card">
        <h2>โหลดข้อมูลไม่สำเร็จ</h2>
        <p className="muted">{err}</p>
      </div>
    );
  if (!rows || !truth)
    return (
      <div className="card">
        <h2>กำลังโหลด pos_receipt_lines.csv …</h2>
        <p className="muted">ไฟล์เดียวกับที่ใช้ใน Colab (19,485 แถว)</p>
      </div>
    );

  const nCorrect = QUESTIONS.filter((q) => {
    const a = answers[q.id] as number;
    const t = truth[q.id];
    return Math.abs(a - t) / Math.max(Math.abs(t), 1e-9) < 0.005;
  }).length;

  return (
    <>
      <div className="pagehead">
        <h1>
          🔎 Grain Detective
          <small>เลือก grain ของ fact table แล้วดูว่าคำถามธุรกิจข้อไหนตอบผิด — สัปดาห์ที่ 3</small>
        </h1>
        <div className="row">
          <div className="chip">แถวในไฟล์ดิบ<b>{baht(rows.length)}</b></div>
          <div className="chip">แถวหลังยุบตาม grain<b>{baht(collapsed.length)}</b></div>
          <div className="chip">ตอบถูก<b className={nCorrect === 6 ? "pos" : "neg"}>{nCorrect} / 6</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ไฟล์ <code>pos_receipt_lines.csv</code> ที่ได้จากระบบ POS มี{" "}
          <b>ข้อมูลสามระดับปนกันอยู่ในไฟล์เดียว</b> — ระดับใบเสร็จ ระดับรายการสินค้า และระดับการชำระเงิน
          ค่าระดับบนถูกทำซ้ำลงมาในทุกแถว
        </p>
        <p className="muted">
          หน้าที่ของคุณคือเลือก <b>grain</b> ของ fact table — “หนึ่งแถวใน fact table แทนอะไร”
          แล้วดูว่าคำถามธุรกิจ 6 ข้อให้คำตอบถูกต้องกี่ข้อ
        </p>
        <div className="note">
          <b>เตือนก่อนเริ่ม:</b> ไม่มี grain ใดตอบถูกครบทั้ง 6 ข้อ —
          นี่คือประเด็นของบทเรียน grain หนึ่งอันตอบได้เพียงชุดคำถามหนึ่งชุด
          องค์กรจริงจึงต้องมี fact table มากกว่าหนึ่งตาราง
        </div>
      </div>

      <div className="grainopts">
        {GRAINS.map((x) => (
          <div
            key={x.key}
            className={`opt${grain === x.key ? " sel" : ""}`}
            onClick={() => setGrain(x.key)}
          >
            <div className="opt-top">
              <b>{x.label}</b>
              {grain === x.key && <span className="opt-cost">{baht(collapsed.length)} แถว</span>}
            </div>
            <span className="muted">{x.desc}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>📋 ผลการตอบคำถามธุรกิจภายใต้ grain ที่เลือก</h2>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>คำถามธุรกิจ</th>
                <th>ต้องการ grain</th>
                <th>คำตอบที่ได้</th>
                {revealed && <th>ค่าจริง</th>}
                <th>ผล</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q) => {
                const a = answers[q.id] as number;
                const t = truth[q.id];
                const rel = (a - t) / Math.max(Math.abs(t), 1e-9);
                const ok = Math.abs(rel) < 0.005;
                return (
                  <tr key={q.id}>
                    <td style={{ textAlign: "left" }}>{q.q}</td>
                    <td style={{ textAlign: "left" }} className="muted">{q.needs}</td>
                    <td>{q.fmt(a)}</td>
                    {revealed && <td className="muted">{q.fmt(t)}</td>}
                    <td className={ok ? "pos" : "neg"}>
                      {ok ? "✓ ถูกต้อง" : rel > 0 ? `⚠️ สูงเกินจริง +${pctStr(rel)}` : `❌ ต่ำกว่าจริง ${pctStr(rel)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={() => setRevealed((v) => !v)}>
            {revealed ? "ซ่อนค่าจริง" : "เฉลย — แสดงค่าจริง"}
          </button>
        </div>

        {grain === "raw" && (
          <div className="note warn">
            <b>กับดักที่พบบ่อยที่สุดในงานจริง:</b> โหลดไฟล์ดิบเข้า fact table ตรงๆ
            ทำให้รายการสินค้าในใบเสร็จที่ชำระ 2 วิธี ถูกนับ <b>สองครั้ง</b> ยอดขายจึงพองขึ้น
            ทั้งที่ไม่มีแถวไหนผิดสักแถวเดียว — ข้อมูลถูกต้องทุกค่า แต่ <b>grain ผิด</b>
          </div>
        )}
        {grain === "receipt" && (
          <div className="note warn">
            <b>ข้อมูลหายไปโดยไม่มีสัญญาณเตือน:</b> การยุบเหลือหนึ่งแถวต่อใบเสร็จ
            ทำให้เหลือเฉพาะรายการสินค้าแรกของแต่ละใบ ยอดขายจึงต่ำกว่าจริงมาก
            แต่ตัวเลขที่ได้ยัง “ดูสมเหตุสมผล” จนไม่มีใครเอะใจ
          </div>
        )}
        {grain === "line" && (
          <div className="note good">
            <b>grain ที่เหมาะกับการวิเคราะห์การขาย</b> — ตอบคำถามระดับสินค้าได้ถูกต้องทั้งหมด
            แต่สังเกตว่าคำถามเกี่ยวกับ<b>วิธีชำระเงิน</b>ยังผิดอยู่ เพราะข้อมูลการชำระถูกยุบหายไป
            ในระบบจริงจึงต้องแยกเป็น <code>fact_sales_line</code> และ <code>fact_payment</code>
          </div>
        )}
        {grain === "payment" && (
          <div className="note good">
            <b>grain ที่เหมาะกับการวิเคราะห์การชำระเงิน</b> — ตอบคำถามเรื่องวิธีชำระได้ถูกต้อง
            แต่คำถามระดับสินค้าผิดหมด นี่คือหลักฐานว่า <b>fact table เดียวรับใช้ทุกคำถามไม่ได้</b>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <p className="muted">
          ไฟล์ CSV ที่หน้านี้ใช้คือไฟล์เดียวกับใน notebook ตัวเลขที่เห็นบนหน้าจอจึงต้องตรงกับที่คุณคำนวณด้วย pandas
        </p>
        <div className="row">
          <a href="/datasets/week03/pos_receipt_lines.csv" download>
            <button>⬇ ดาวน์โหลด pos_receipt_lines.csv</button>
          </a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> เขียน <code>groupby</code> พิสูจน์การนับซ้ำ · หา grain ที่ถูกต้องของแต่ละคำถาม ·
          ออกแบบ fact table ที่ควรมีในระบบจริง พร้อมเขียน <b>grain contract</b> เป็นประโยคเดียว
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้ผู้เรียนเริ่มจาก “หนึ่งแถวในไฟล์ดิบ” เพราะเป็นสิ่งที่ทุกคนทำโดยสัญชาตญาณ
          แล้วชี้ที่ยอดขายซึ่งสูงเกินจริง — จุดสำคัญคือ <b>ไม่มีข้อมูลแถวใดผิดเลยสักแถว</b>{" "}
          ความผิดพลาดทั้งหมดเกิดจากการตีความว่า “หนึ่งแถวแทนอะไร”
          ซึ่งเป็นการตัดสินใจเชิงออกแบบ ไม่ใช่ปัญหาคุณภาพข้อมูล
        </p>
      </div>
    </>
  );
}
