#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pymupdf>=1.24",
#     "fonttools>=4.40",
# ]
# ///
"""
PDF 涂黑 (Redaction) 工具  ——  uv 单文件脚本
=============================================

三种涂黑方式:
    -t/--text  <str>           按字面量文本搜索并涂黑
    -r/--regex <pattern>       按正则搜索并涂黑
    --rect "PAGE:x0,y0,x1,y1"  按坐标矩形涂黑 (PAGE 从 1 开始)

替换文字 (涂掉后写入新文本):
    --replace "新文字"                    全局替换文本 (对 -t/-r/--rect 都生效)
    --rect "PAGE:x0,y0,x1,y1=新文字"      单个矩形各自指定替换文本
    --fontsize / --font / --fontfile      字号与字体 (默认自动用系统细体宋体)

对文字类涂黑, 底层文字流会被 PyMuPDF 一并删除, 无法复制还原。
对矩形类涂黑, 被矩形覆盖到的文字/图片像素也会被真正抹除
(用 apply_redactions 一并清理), 视觉盖住 = 真删除。
有 --replace 时: 先抹除原内容, 再把新文本画进矩形。

当 PDF 里的中文实际上是"逐字小图片"(如某些银行对账单) 时, 文本搜索会失效,
请用 --render-grid 生成带坐标网格的预览 PNG, 目测出要涂的矩形范围,
再用 --rect 涂黑 (或涂黑后替换)。

运行方式 (无需 pip install, uv 会按顶部 PEP 723 元数据自动准备环境):
    uv run redact_pdf.py in.pdf -o out.pdf -t "要涂掉的地址"

常用示例:
    # 1) 按文本涂黑
    uv run redact_pdf.py in.pdf -o out.pdf -t "138-1234-5678"

    # 2) 按正则批量涂 (例: 所有 16 位卡号)
    uv run redact_pdf.py in.pdf -o out.pdf -r "\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}"

    # 3) 按矩形涂黑 (页码从 1 开始; 坐标单位是 PDF pt, 页面左上角为 (0,0))
    uv run redact_pdf.py in.pdf -o out.pdf --rect "1:58,130,260,172"

    # 4) 矩形涂掉后换成新文字 (默认白底; 中文用 china-s 字体)
    uv run redact_pdf.py in.pdf -o out.pdf \
        --rect "1:58,130,260,172" --replace "新地址内容" --fontsize 10

    # 5) 多个矩形各自替换不同文字
    uv run redact_pdf.py in.pdf -o out.pdf \
        --rect "1:58,130,260,172=北京市朝阳区某某路1号" \
        --rect "1:490,125,538,160=13800000000"

    # 一次涂多个矩形
    uv run redact_pdf.py in.pdf -o out.pdf \
        --rect "1:58,130,260,172" \
        --rect "1:490,125,538,160"

    # 预览: 只打印将涂哪些位置, 不写文件
    uv run redact_pdf.py in.pdf -o out.pdf -t "机密" --preview

    # 找不到坐标? 生成每页带坐标网格的 PNG 预览:
    uv run redact_pdf.py in.pdf --render-grid ./grid
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pymupdf


def find_literal_rects(page, needle: str, ignore_case: bool):
    """按字面量文本搜索。"""
    if not ignore_case:
        return list(page.search_for(needle))

    variants = {needle, needle.lower(), needle.upper(), needle.title()}
    seen: set[tuple[float, float, float, float]] = set()
    rects = []
    for variant in variants:
        for r in page.search_for(variant):
            key = (round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2))
            if key in seen:
                continue
            seen.add(key)
            rects.append(r)
    return rects


def find_regex_rects(page, pattern: re.Pattern):
    """按正则搜索。"""
    rects = []
    text_dict = page.get_text("dict")
    seen: set[tuple[float, float, float, float]] = set()
    for block in text_dict.get("blocks", []):
        for line in block.get("lines", []):
            line_text = "".join(span.get("text", "") for span in line.get("spans", []))
            for match in pattern.finditer(line_text):
                matched = match.group(0)
                if not matched.strip():
                    continue
                for r in page.search_for(matched):
                    key = (round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2))
                    if key in seen:
                        continue
                    seen.add(key)
                    rects.append(r)
    return rects


def parse_rect_spec(spec: str) -> tuple[int, pymupdf.Rect, str | None]:
    """把 "PAGE:x0,y0,x1,y1" 或 "PAGE:x0,y0,x1,y1=替换文字" 解析成
    (页索引0-based, Rect, 可选替换文字)。"""
    try:
        page_part, rest = spec.split(":", 1)
        page_no = int(page_part.strip())
        if "=" in rest:
            coord_part, replace_text = rest.split("=", 1)
            replace_text = replace_text if replace_text != "" else None
        else:
            coord_part, replace_text = rest, None
        x0, y0, x1, y1 = (float(v.strip()) for v in coord_part.split(","))
    except (ValueError, AttributeError):
        raise argparse.ArgumentTypeError(
            f"--rect 参数格式错误: {spec!r}, 应为 'PAGE:x0,y0,x1,y1' "
            f"或 'PAGE:x0,y0,x1,y1=替换文字', 例如 '1:58,130,260,172'"
        )
    if page_no < 1:
        raise argparse.ArgumentTypeError(f"--rect 页码从 1 开始, 收到 {page_no}")
    if x0 >= x1 or y0 >= y1:
        raise argparse.ArgumentTypeError(
            f"--rect 坐标非法: {spec!r}, 要求 x0<x1 且 y0<y1"
        )
    return page_no - 1, pymupdf.Rect(x0, y0, x1, y1), replace_text


def render_grid_pngs(input_path: Path, out_dir: Path, zoom: float = 2.0) -> None:
    """把每页渲染成 PNG, 上面画上 50pt 主刻度 / 10pt 副刻度, 便于目测坐标。"""
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(str(input_path))
    for i in range(doc.page_count):
        page = doc[i]
        # 在页面上叠一层网格 (不修改原 PDF, 只影响这次渲染)
        w, h = page.rect.width, page.rect.height
        shape = page.new_shape()

        minor = (0.75, 0.85, 0.95)
        major = (0.55, 0.55, 0.55)

        x = 0.0
        while x <= w:
            color = major if int(round(x)) % 50 == 0 else minor
            shape.draw_line(pymupdf.Point(x, 0), pymupdf.Point(x, h))
            shape.finish(color=color, width=0.3)
            x += 10

        y = 0.0
        while y <= h:
            color = major if int(round(y)) % 50 == 0 else minor
            shape.draw_line(pymupdf.Point(0, y), pymupdf.Point(w, y))
            shape.finish(color=color, width=0.3)
            y += 10

        # 每 50pt 打上一个坐标标签
        for xv in range(0, int(w) + 1, 50):
            shape.insert_text(pymupdf.Point(xv + 1, 9),
                              f"x={xv}", fontsize=6, color=(0.8, 0, 0))
        for yv in range(0, int(h) + 1, 50):
            shape.insert_text(pymupdf.Point(2, yv - 1),
                              f"y={yv}", fontsize=6, color=(0.8, 0, 0))
        shape.commit(overlay=True)

        mat = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out_path = out_dir / f"page{i + 1}_grid.png"
        pix.save(str(out_path))
        print(f"  wrote {out_path}  ({page.rect.width:.0f} x {page.rect.height:.0f} pt)")
    doc.close()


def default_thin_fontfile() -> Path | None:
    """优先用 Songti SC Light (细宋体)。macOS 的 Songti.ttc 第 0 面是 Black,
    直接引用会变成粗体, 所以要抽出 Light 面缓存成单独 ttf。"""
    songti_ttc = Path("/System/Library/Fonts/Supplemental/Songti.ttc")
    if songti_ttc.is_file():
        cache = Path(__file__).resolve().parent / ".font_cache" / "SongtiSC-Light.ttf"
        if cache.is_file():
            return cache
        try:
            from fontTools.ttLib import TTCollection
        except ImportError:
            print("WARN: 需要 fonttools 才能抽取细体宋体", file=sys.stderr)
        else:
            ttc = TTCollection(str(songti_ttc))
            # Songti.ttc 面序: 0 Black, 1 Bold, 3 SC Light, 5 TC Light, 6 SC Regular ...
            light_idx = None
            for i, font in enumerate(ttc.fonts):
                full = font["name"].getDebugName(4) or ""
                if full == "Songti SC Light":
                    light_idx = i
                    break
            if light_idx is None:
                # 兜底: 已知索引 3
                light_idx = 3 if len(ttc.fonts) > 3 else 0
            cache.parent.mkdir(parents=True, exist_ok=True)
            ttc.fonts[light_idx].save(str(cache))
            print(f"已缓存细体字体: {cache}")
            return cache

    candidates = [
        Path("/System/Library/Fonts/STSong.ttc"),
        Path("/usr/share/fonts/opentype/noto/NotoSerifCJK-Light.ttc"),
        Path("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"),
        Path("/usr/share/fonts/truetype/noto/NotoSerifCJK-Regular.ttc"),
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


def insert_replace_text(
    page,
    rect: pymupdf.Rect,
    text: str,
    *,
    fontsize: float,
    text_color: tuple[float, float, float],
    fontname: str,
    fontfile: Path | None,
) -> None:
    """在已涂黑的矩形里写入替换文字。优先用 fontfile (细体), 否则用内置 fontname。"""
    kwargs: dict = {
        "fontsize": fontsize,
        "color": text_color,
        "align": pymupdf.TEXT_ALIGN_LEFT,
    }
    if fontfile is not None:
        # 用系统 TTF/TTC 细体; fontname 只是 PDF 内的别名
        kwargs["fontname"] = "replfont"
        kwargs["fontfile"] = str(fontfile)
    else:
        kwargs["fontname"] = fontname
    # insert_textbox 返回剩余未写入空间; <0 表示文字装不下
    rc = page.insert_textbox(rect, text, **kwargs)
    if rc < 0:
        print(
            f"  WARN: 替换文字装不下矩形 "
            f"({rect.x0:.0f},{rect.y0:.0f})-({rect.x1:.0f},{rect.y1:.0f}), "
            f"可加大矩形或减小 --fontsize (当前 {fontsize})",
            file=sys.stderr,
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="对 PDF 中的敏感内容执行永久性涂黑 (支持文本/正则/矩形)。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("input", help="输入 PDF 路径")
    parser.add_argument("-o", "--output",
                        help="输出 PDF 路径 (--render-grid 模式下可省略)")
    parser.add_argument(
        "-t", "--text",
        action="append",
        default=[],
        help="要涂黑的字面量文本 (可重复给出)",
    )
    parser.add_argument(
        "-r", "--regex",
        action="append",
        default=[],
        help="要涂黑的正则表达式 (可重复给出)",
    )
    parser.add_argument(
        "--rect",
        action="append",
        default=[],
        type=parse_rect_spec,
        metavar="PAGE:x0,y0,x1,y1[=TEXT]",
        help="按矩形涂黑, PAGE 从 1 开始, 坐标单位 pt; "
             "可追加 =替换文字 (可重复给出)",
    )
    parser.add_argument(
        "--replace",
        default=None,
        metavar="TEXT",
        help="涂黑后写入的替换文字 (对 -t/-r/--rect 全局生效; "
             "单个 --rect 若带 =文字 则优先生效)",
    )
    parser.add_argument(
        "--fontsize",
        type=float,
        default=11.0,
        help="替换文字字号 (默认 11)",
    )
    parser.add_argument(
        "--font",
        default="china-s",
        help="内置字体名 (无 --fontfile 时使用; 默认 china-s; 纯英文可用 helv)",
    )
    parser.add_argument(
        "--fontfile",
        default=None,
        metavar="PATH",
        help="替换文字的 TTF/OTF/TTC 字体文件 (推荐细体宋体; "
             "macOS 默认自动用 Songti.ttc)",
    )
    parser.add_argument(
        "-i", "--ignore-case",
        action="store_true",
        help="大小写不敏感 (对 -t 和 -r 都生效)",
    )
    parser.add_argument(
        "--fill",
        default=None,
        choices=["black", "white"],
        help="遮盖矩形颜色 (有替换文字时默认 white, 否则默认 black)",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="只打印匹配位置, 不写输出文件",
    )
    parser.add_argument(
        "--render-grid",
        metavar="OUT_DIR",
        help="生成带坐标网格的 PNG 预览到指定目录 (用于目测 --rect 坐标), 此模式下不涂任何东西",
    )
    parser.add_argument(
        "--grid-zoom",
        type=float,
        default=2.0,
        help="--render-grid 的缩放倍率 (默认 2.0, 输出 144 DPI)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    input_path = Path(args.input).expanduser().resolve()
    if not input_path.is_file():
        print(f"ERROR: 找不到输入文件: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.render_grid:
        out_dir = Path(args.render_grid).expanduser().resolve()
        print(f"[render-grid] 输入: {input_path}")
        print(f"[render-grid] 输出目录: {out_dir}")
        render_grid_pngs(input_path, out_dir, args.grid_zoom)
        print(
            "\n完成。用图片浏览器打开 PNG, 目测要涂的矩形范围 (红色标签是 pt 坐标),\n"
            '然后用  --rect "PAGE:x0,y0,x1,y1"  参数传给本脚本。'
        )
        return

    if not args.text and not args.regex and not args.rect:
        print("ERROR: 至少要提供一个 -t/--text, -r/--regex 或 --rect 参数。", file=sys.stderr)
        sys.exit(2)

    if not args.output:
        print("ERROR: 涂黑模式需要 -o/--output。", file=sys.stderr)
        sys.exit(2)

    output_path = Path(args.output).expanduser().resolve()
    if input_path == output_path:
        print("ERROR: 输出路径不能与输入相同 (避免损坏原文件)。", file=sys.stderr)
        sys.exit(1)

    regex_flags = re.IGNORECASE if args.ignore_case else 0
    compiled = [re.compile(p, regex_flags) for p in args.regex]

    # 预先按页收集 --rect: (Rect, 可选 per-rect 替换文字)
    rects_by_page: dict[int, list[tuple[pymupdf.Rect, str | None]]] = {}
    any_replace = args.replace is not None
    for page_idx, rect, rect_replace in args.rect:
        if rect_replace is not None:
            any_replace = True
        rects_by_page.setdefault(page_idx, []).append((rect, rect_replace))

    if args.fill is None:
        fill_name = "white" if any_replace else "black"
    else:
        fill_name = args.fill
    fill_color = (0, 0, 0) if fill_name == "black" else (1, 1, 1)
    text_color = (0, 0, 0) if fill_name == "white" else (1, 1, 1)

    # 有替换文字时: 默认用系统细体宋体 (比内置 china-s 粗黑体自然得多)
    fontfile: Path | None = None
    if any_replace:
        if args.fontfile:
            fontfile = Path(args.fontfile).expanduser().resolve()
            if not fontfile.is_file():
                print(f"ERROR: --fontfile 不存在: {fontfile}", file=sys.stderr)
                sys.exit(1)
        else:
            fontfile = default_thin_fontfile()
            if fontfile:
                print(f"替换字体: {fontfile} (细体宋体)")
            else:
                print(
                    f"WARN: 未找到系统细体宋体, 回退内置 --font={args.font} "
                    f"(可用 --fontfile 指定 TTF/TTC)",
                    file=sys.stderr,
                )

    doc = pymupdf.open(str(input_path))
    total = 0

    for page_idx in rects_by_page:
        if page_idx >= doc.page_count:
            print(f"ERROR: --rect 页码 {page_idx + 1} 超出 PDF 页数 {doc.page_count}",
                  file=sys.stderr)
            doc.close()
            sys.exit(1)

    for i in range(doc.page_count):
        page = doc[i]
        # (rect, label, replace_text)
        matches: list[tuple[pymupdf.Rect, str, str | None]] = []

        for text in args.text:
            for r in find_literal_rects(page, text, args.ignore_case):
                matches.append((r, f"text={text!r}", args.replace))

        for pat in compiled:
            for r in find_regex_rects(page, pat):
                matches.append((r, f"regex={pat.pattern!r}", args.replace))

        for r, rect_replace in rects_by_page.get(i, []):
            # per-rect 替换优先于全局 --replace
            replace = rect_replace if rect_replace is not None else args.replace
            matches.append((r, "rect", replace))

        if not matches:
            continue

        print(f"Page {i + 1}: {len(matches)} 处")
        for r, label, replace in matches:
            extra = f" → {replace!r}" if replace else ""
            print(f"  {label} @ ({r.x0:.1f}, {r.y0:.1f}) - ({r.x1:.1f}, {r.y1:.1f}){extra}")
            if not args.preview:
                # 先只涂掉原文; 替换文字在 apply_redactions 之后用细体写入
                page.add_redact_annot(r, fill=fill_color)

        total += len(matches)

        if not args.preview:
            # PDF_REDACT_IMAGE_PIXELS: 被覆盖到的图片像素也一并擦除
            # (这样对"逐字小图片"渲染的中文也能真正涂掉)
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_PIXELS)

            for r, _label, replace in matches:
                if not replace:
                    continue
                insert_replace_text(
                    page,
                    r,
                    replace,
                    fontsize=args.fontsize,
                    text_color=text_color,
                    fontname=args.font,
                    fontfile=fontfile,
                )

    if args.preview:
        print(f"\n[预览] 总共将涂黑 {total} 处。未写出文件。")
        doc.close()
        return

    if total == 0:
        print("没有匹配到任何内容, 未写出文件。", file=sys.stderr)
        doc.close()
        sys.exit(3)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path), garbage=4, deflate=True, clean=True)
    doc.close()
    action = "涂黑/替换" if any_replace else "涂黑"
    print(f"\n完成。已写出: {output_path}")
    print(f"共{action} {total} 处 (fill={fill_name}).")


if __name__ == "__main__":
    main()
