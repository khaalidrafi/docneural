#!/usr/bin/env python3
"""crawl-manual.py — BFS-fetch one makeinfo html_node manual to closure.

Seeds from the manual index, follows only same-directory *.html links,
fetches until no new pages appear. Guarantees complete coverage (wget's
depth cap truncated the org mirror; guix never started).

Usage: crawl-manual.py <url-of-index> <out-dir> [concurrency]
"""
import concurrent.futures as cf
import re
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

LINK_RE = re.compile(r'href="([a-zA-Z0-9._%+-]+\.html)(#[^"]*)?"')

def fetch(url, dest: Path, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "docneural-mirror/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                dest.write_bytes(r.read())
            return True
        except Exception as e:
            if i == tries - 1:
                print(f"  FAIL {url}: {e}")
                return False
            time.sleep(1.5 * (i + 1))

def main():
    index_url, out_arg = sys.argv[1], sys.argv[2]
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    out = Path(out_arg)
    out.mkdir(parents=True, exist_ok=True)
    base = urljoin(index_url, ".")
    index_name = urlparse(index_url).path.rstrip("/").rsplit("/", 1)[-1] or "index.html"

    queue = [index_name]
    seen = {index_name}
    fetched = 0
    while queue:
        batch = queue
        queue = []
        def work(name):
            dest = out / name
            if dest.exists() and dest.stat().st_size > 0 and name != index_name:
                return dest.read_text(encoding="utf-8", errors="replace")
            fetch(urljoin(base, name), dest)
            time.sleep(0.15)
            return dest.read_text(encoding="utf-8", errors="replace") if dest.exists() else ""
        with cf.ThreadPoolExecutor(workers) as ex:
            for name, html in zip(batch, ex.map(work, batch)):
                fetched += 1
                for link in LINK_RE.findall(html):
                    target = link[0]
                    if target not in seen:
                        seen.add(target)
                        queue.append(target)
        print(f"  fetched {fetched}, discovered {len(seen)}")
    print(f"closure: {len(seen)} pages in {out} ({fetched} fetches)")

if __name__ == "__main__":
    main()
