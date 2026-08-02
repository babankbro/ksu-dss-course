#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สร้างไฟล์ .ipynb สองฉบับจากไฟล์ต้นฉบับหนึ่งไฟล์

รูปแบบไฟล์ต้นฉบับ (percent format) ใน labs/src/*.py :

    # %% [markdown]
    # ข้อความ markdown (ขึ้นต้นแต่ละบรรทัดด้วย # )

    # %%
    โค้ดที่ให้นักศึกษาอยู่แล้ว

    # %% [task]
    # คำสั่งงานที่นักศึกษาต้องเขียนเอง (จะกลายเป็น cell ว่างในฉบับนักศึกษา)

    # %% [solution]
    โค้ดเฉลย (ตัดออกจากฉบับนักศึกษา)

ผลลัพธ์:
    labs/weekXX/<ชื่อ>.ipynb            ← ฉบับนักศึกษา (มีช่องว่างให้เติม)
    labs/weekXX/<ชื่อ>-solution.ipynb   ← ฉบับผู้สอน (มีเฉลยครบ)

วิธีใช้:
    python labs/build_notebooks.py
"""
from __future__ import annotations

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")

CELL_RE = re.compile(r"^# %%(?:\s*\[(\w+)\])?\s*$")


def parse(path: str) -> list[tuple[str, str]]:
    """แยกไฟล์ต้นฉบับเป็นรายการ (ชนิดของ cell, เนื้อหา)"""
    cells: list[tuple[str, list[str]]] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = CELL_RE.match(line.rstrip("\n"))
            if m:
                cells.append((m.group(1) or "code", []))
            elif cells:
                cells[-1][1].append(line.rstrip("\n"))
    return [(k, "\n".join(v).strip("\n")) for k, v in cells]


def md_cell(text: str) -> dict:
    # ตัดเครื่องหมาย comment ที่นำหน้าบรรทัด markdown ออก
    body = "\n".join(re.sub(r"^# ?", "", ln) for ln in text.split("\n"))
    return {"cell_type": "markdown", "metadata": {}, "source": body.splitlines(keepends=True)}


def code_cell(text: str) -> dict:
    return {
        "cell_type": "code", "execution_count": None, "metadata": {},
        "outputs": [], "source": text.splitlines(keepends=True),
    }


def build(cells: list[tuple[str, str]], with_solution: bool) -> dict:
    nb_cells = []
    for kind, body in cells:
        if kind == "markdown":
            nb_cells.append(md_cell(body))
        elif kind == "task":
            nb_cells.append(md_cell(body))
            if not with_solution:
                nb_cells.append(code_cell("# เขียนโค้ดของคุณที่นี่\n"))
        elif kind == "solution":
            if with_solution:
                nb_cells.append(code_cell(body))
        else:
            nb_cells.append(code_cell(body))
    return {
        "cells": nb_cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.11"},
            "colab": {"provenance": []},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main() -> None:
    n = 0
    for root, _dirs, files in os.walk(SRC):
        for fn in sorted(files):
            if not fn.endswith(".py"):
                continue
            src_path = os.path.join(root, fn)
            rel = os.path.relpath(root, SRC)              # เช่น "week03"
            cells = parse(src_path)
            base = fn[:-3]
            outdir = os.path.join(HERE, rel)
            os.makedirs(outdir, exist_ok=True)

            for suffix, with_sol in ((".ipynb", False), ("-solution.ipynb", True)):
                out_path = os.path.join(outdir, base + suffix)
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(build(cells, with_sol), f, ensure_ascii=False, indent=1)
                n += 1
                print(f"  ✓ {os.path.relpath(out_path, HERE)}")
    print(f"\nสร้าง notebook ทั้งหมด {n} ไฟล์")


if __name__ == "__main__":
    main()
