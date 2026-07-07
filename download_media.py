#!/usr/bin/env python3
"""批量下载 freemdict 开放目录中的 A1/A2 教学资源到 public/media/。

用法：
    python3 download_media.py                 # 抓取默认目录（你好法语 0-B1）
    python3 download_media.py --dry-run       # 只列出将要下载的文件，不下载
    python3 download_media.py --limit 5       # 最多下载 5 个文件（试跑用）
    python3 download_media.py --keywords a1   # 只要 A1
    python3 download_media.py --all           # 不按关键字过滤，全部下载

依赖：pip install requests beautifulsoup4 tqdm（tqdm 可选，缺失时自动退回简易进度条）

说明：目标是典型的 autoindex 开放目录。脚本会递归进入子目录，
凡是路径（目录名或文件名，大小写不敏感）中含 A1/A2 且扩展名属于
音频/视频/文本的文件都会被下载，保存时保留相对目录结构。
已存在且大小一致的文件自动跳过，可安全断点续跑。
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = (
    "https://downloads-direct.freemdict.com/Language_Learning_Videos/French/"
    "004%20%E4%BD%A0%E5%A5%BD%E6%B3%95%E8%AF%AD%200-B1/"
)
DEFAULT_DEST = Path(__file__).resolve().parent / "public" / "media"
DEFAULT_KEYWORDS = ("a1", "a2")

# 音频 / 视频 / 文本
MEDIA_EXTS = {
    ".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma",
    ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".ts",
    ".pdf", ".txt", ".srt", ".ass", ".vtt", ".lrc", ".doc", ".docx", ".epub",
}

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; media-fetcher/1.0; personal study use)"}
CHUNK = 64 * 1024
MAX_DEPTH = 4
RETRIES = 3


def make_progress(total: int | None, desc: str):
    """优先用 tqdm；未安装时退回简易百分比进度条。"""
    try:
        from tqdm import tqdm

        return tqdm(total=total, unit="B", unit_scale=True, unit_divisor=1024,
                    desc=desc[:40], leave=True)
    except ImportError:
        class Plain:
            def __init__(self):
                self.done = 0

            def update(self, n):
                self.done += n
                if total:
                    pct = self.done * 100 // total
                    bar = "#" * (pct // 4)
                    sys.stdout.write(f"\r  {desc[:40]:40s} [{bar:<25s}] {pct:3d}%")
                else:
                    sys.stdout.write(f"\r  {desc[:40]:40s} {self.done // 1024} KB")
                sys.stdout.flush()

            def close(self):
                sys.stdout.write("\n")

        return Plain()


def list_dir(session: requests.Session, url: str) -> tuple[list[str], list[str]]:
    """解析一页 autoindex，返回 (子目录 URL 列表, 文件 URL 列表)。"""
    resp = session.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    dirs: list[str] = []
    files: list[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        # 跳过排序参数、锚点、上级目录等非内容链接
        if not href or href.startswith(("?", "#", "mailto:", "javascript:")):
            continue
        absolute = urljoin(url, href)
        # 只在目标目录内爬行，忽略指向站外/上级的链接
        if not absolute.startswith(url) or absolute == url:
            continue
        if absolute.endswith("/"):
            dirs.append(absolute)
        else:
            files.append(absolute)
    return dirs, files


def crawl(session: requests.Session, base: str) -> list[str]:
    """递归收集 base 下所有文件 URL。"""
    collected: list[str] = []
    queue: list[tuple[str, int]] = [(base, 0)]
    while queue:
        url, depth = queue.pop(0)
        try:
            dirs, files = list_dir(session, url)
        except requests.RequestException as e:
            print(f"  ! 无法读取目录 {unquote(url)}: {e}", file=sys.stderr)
            continue
        collected.extend(files)
        if depth < MAX_DEPTH:
            queue.extend((d, depth + 1) for d in dirs)
    return collected


def wanted(file_url: str, base: str, keywords: tuple[str, ...]) -> bool:
    rel = unquote(file_url[len(base):]).lower()
    if Path(rel).suffix not in MEDIA_EXTS:
        return False
    return not keywords or any(k in rel for k in keywords)


def download(session: requests.Session, url: str, dest: Path) -> str:
    """下载单个文件，返回 'ok' / 'skip' / 'fail'。"""
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, RETRIES + 1):
        try:
            with session.get(url, headers=HEADERS, stream=True, timeout=60) as resp:
                resp.raise_for_status()
                total = int(resp.headers.get("content-length") or 0) or None
                if dest.exists() and total and dest.stat().st_size == total:
                    print(f"  = 已存在，跳过 {dest.name}")
                    return "skip"
                bar = make_progress(total, dest.name)
                tmp = dest.with_suffix(dest.suffix + ".part")
                with open(tmp, "wb") as f:
                    for chunk in resp.iter_content(CHUNK):
                        f.write(chunk)
                        bar.update(len(chunk))
                bar.close()
                tmp.rename(dest)
                return "ok"
        except requests.RequestException as e:
            print(f"  ! 第 {attempt}/{RETRIES} 次尝试失败 {dest.name}: {e}", file=sys.stderr)
            time.sleep(2 * attempt)
    return "fail"


def main() -> int:
    parser = argparse.ArgumentParser(description="批量下载开放目录中的 A1/A2 教学资源")
    parser.add_argument("--base-url", default=BASE_URL, help="开放目录 URL")
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST, help="保存目录")
    parser.add_argument("--keywords", nargs="*", default=list(DEFAULT_KEYWORDS),
                        help="路径关键字过滤（大小写不敏感）")
    parser.add_argument("--all", action="store_true", help="忽略关键字，下载全部媒体/文本文件")
    parser.add_argument("--dry-run", action="store_true", help="只列出匹配文件，不下载")
    parser.add_argument("--limit", type=int, default=0, help="最多下载 N 个文件（0 = 不限）")
    args = parser.parse_args()

    base = args.base_url if args.base_url.endswith("/") else args.base_url + "/"
    keywords = () if args.all else tuple(k.lower() for k in args.keywords)

    session = requests.Session()
    print(f"抓取目录：{unquote(base)}")
    all_files = crawl(session, base)
    targets = [u for u in all_files if wanted(u, base, keywords)]
    print(f"发现 {len(all_files)} 个文件，其中 {len(targets)} 个匹配 "
          f"{'（不过滤）' if not keywords else '关键字 ' + '/'.join(keywords)}")

    if args.limit:
        targets = targets[: args.limit]

    if args.dry_run:
        for u in targets:
            print("  ->", unquote(u[len(base):]))
        return 0

    ok = skip = fail = 0
    for i, url in enumerate(targets, 1):
        rel = Path(unquote(url[len(base):]))
        print(f"[{i}/{len(targets)}] {rel}")
        result = download(session, url, args.dest / rel)
        ok += result == "ok"
        skip += result == "skip"
        fail += result == "fail"
        time.sleep(0.5)  # 对服务器友好一点

    print(f"\n完成：下载 {ok} 个，跳过 {skip} 个，失败 {fail} 个 → {args.dest}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
