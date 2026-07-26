"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SIMS } from "@/lib/sims";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={close} />}

      <aside className={`sidebar${open ? " open" : ""}`}>
        <Link href="/" className="brand" onClick={close}>
          <b>🎓 DSS Simulations</b>
          <span>ระบบสนับสนุนการตัดสินใจ · มหาวิทยาลัยกาฬสินธุ์</span>
        </Link>

        <div className="navgroup">ทั่วไป</div>
        <Link href="/" onClick={close}>
          <div className={`navitem${isActive("/") ? " active" : ""}`}>
            <span className="ico">🏠</span>
            <span>
              <b>หน้าแรก</b>
              <small>ภาพรวมสื่อจำลองทั้งหมด</small>
            </span>
          </div>
        </Link>

        <div className="navgroup">สื่อจำลองประกอบการเรียน</div>
        {SIMS.map((s) =>
          s.ready ? (
            <Link key={s.slug} href={`/sims/${s.slug}`} onClick={close}>
              <div
                className={`navitem${
                  isActive(`/sims/${s.slug}`) ? " active" : ""
                }`}
              >
                <span className="ico">{s.icon}</span>
                <span>
                  <b>{s.title}</b>
                  <small>{s.weeks} · {s.concept.split(" · ")[0]}</small>
                </span>
              </div>
            </Link>
          ) : (
            <div key={s.slug} className="navitem soon" title="ยังไม่เปิดใช้งาน">
              <span className="ico">{s.icon}</span>
              <span>
                <b>{s.title}</b>
                <small>{s.weeks} · เร็วๆ นี้</small>
              </span>
            </div>
          )
        )}

        <div className="sidefoot">
          สื่อจำลองนี้ใช้ประกอบการบรรยาย ไม่ใช่แบบจำลองเชิงพยากรณ์จริง
          ตัวเลขทั้งหมดถูกสร้างขึ้นเพื่อการเรียนการสอน
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mobilebar">
          <button onClick={() => setOpen(true)} aria-label="เปิดเมนู">
            ☰ เมนู
          </button>
          <b style={{ fontSize: 14 }}>DSS Simulations</b>
        </div>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
