#!/usr/bin/env python3
"""manuals-corpus.py — texinfo html_node trees -> docneural corpus dirs.

Builds the Owner's ~/docs corpus shape from makeinfo node-split HTML,
converting bodies with the Owner's own `org-import' package (published at
git.khalidrafi.tech/org-pandoc-import — package name `org-import', formerly
org-pandoc-import), the same converter the corpus contract names.

Per page the exporter contract (scripts/docneural-export.el) needs:
  - :ID: drawer          -> node id ("MANUAL--PageName")
  - #+title / #+filetags -> node label + source color group
  - a nav paragraph      -> "Next: [[id:..]] ..." (Up/Next/Prev chainback;
                            one line so the exporter's structural filter
                            "^Next: [[" drops it from citations)
  - [[id:PAGE::#anchor]] -> semantic cross-references (graph edges)

Bodies are converted by org-import (its html backend, bulk mode, one batch
emacs per manual), then post-processed here: links to sibling pages become
id: links, pandoc's escaped-macro noise is left for the exporter's own
macro stub, mismatched #+begin/end pairs are repaired and executable
keyword lines the manuals teach as literal text are escaped.

Environment:
  ORG_IMPORT_DIR  checkout of the org-import package
                  (default /home/z/my-project/org-pandoc-import)
  ELPA_DEPS_DIR   dir with dash-*/ s-*/ plz-* ELPA folders
  EMACS_BIN       emacs launcher (default the portable-emacs wrapper)

Usage: manuals-corpus.py <html-dir> <doc-name> <out-corpus-dir>
"""
import os
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ORG_IMPORT_DIR = Path(os.environ.get(
    "ORG_IMPORT_DIR", "/home/z/my-project/org-pandoc-import"))
ELPA_DEPS_DIR = Path(os.environ.get(
    "ELPA_DEPS_DIR",
    "/home/z/my-project/emacs-root/usr/share/emacs/site-lisp/elpa-src"))
EMACS_BIN = os.environ.get("EMACS_BIN", "/home/z/my-project/scripts/emacs.sh")
TMP_ROOT = Path(os.environ.get("DOCNEURAL_TMP", ".manuals-tmp"))

NAV_PANEL_RE = re.compile(
    r'<div class="nav-panel">.*?</div>|<table class="header".*?</table>|<table class="footer".*?</table>',
    re.S)
NAV_ROW_RE = re.compile(r"(Next|Previous|Up):\s*(?:</td>\s*<td>)?\s*<a href=\"([^\"]+)\"[^>]*>(.*?)</a>", re.S)
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S)
IMG_RE = re.compile(r'<img\b[^>]*>', re.I)
IDURL_RE = re.compile(r"\[\[(?:file:)?([a-zA-Z0-9._%-]+)\.html(#[^]\[]*)?(?:\]\[([^\]]*))?\]\]")


class TitleGrab(HTMLParser):
    """First <h1..h4> text of the body — the section/node title."""
    def __init__(self):
        super().__init__()
        self.in_head = None
        self.buf = []
        self.title = None
    def handle_starttag(self, tag, attrs):
        if tag in ("h1", "h2", "h3", "h4") and self.in_head is None:
            self.in_head = tag
    def handle_endtag(self, tag):
        if self.in_head and tag == self.in_head:
            self.title = "".join(self.buf).strip()
            self.in_head = None
    def handle_data(self, data):
        if self.in_head:
            self.buf.append(data)


def clean_title(raw: str) -> str:
    t = re.sub(r"\s+", " ", raw).strip()
    # "Page - GNU Emacs Manual" and "Page (GNU Emacs Manual)" suffixes
    t = re.split(r"\s+-\s+(?:GNU )?(?:Emacs|Guix|Org)[^<(]*$", t)[0]
    t = re.sub(r"\s*\((?:The )?GNU (?:Emacs Manual|Guix Reference Manual|Org Manual)[^)]*\)\s*$", "", t)
    return t.strip() or t


def page_title(html: str) -> str:
    m = TITLE_RE.search(html)
    if m:
        t = clean_title(re.sub(r"<[^>]+>", "", m.group(1)))
        if t:
            return t
    g = TitleGrab()
    g.feed(html)
    return clean_title(g.title or "Untitled")


def body_of(html: str) -> str:
    html = NAV_PANEL_RE.sub("", html)
    # kill scripts/styles/comments and the print footer
    html = re.sub(r"<script.*?</script>", "", html, flags=re.S)
    html = re.sub(r"<style.*?</style>", "", html, flags=re.S)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    html = re.sub(r'<div class="(footer|printfooter|catlinks)".*?</div>', "", html, flags=re.S)
    html = IMG_RE.sub("", html)  # no images in the pipeline; alt text would rot
    return html


def org_import_bulk(src_dir: Path, out_dir: Path) -> None:
    """Convert every .html under SRC_DIR with the Owner's org-import package.

    One batch emacs drives `org-import-bulk' (concurrent pandoc children);
    the sentinel line in org-import-convert.el tells a clean finish from a
    silent death.  No pandoc fallback: the corpus contract names org-import.
    """
    if not ORG_IMPORT_DIR.exists():
        sys.exit(f"org-import not found at {ORG_IMPORT_DIR}\n"
                 "  clone it: git clone https://git.khalidrafi.tech/org-pandoc-import.git")
    elpa_dirs: list[str] = []
    for pattern in ("dash-*", "s-*", "plz-*"):
        elpa_dirs.extend(str(p) for p in sorted(ELPA_DEPS_DIR.glob(pattern)))
    script = Path(__file__).parent / "org-import-convert.el"
    cmd = ([EMACS_BIN, "--batch", "-L", str(ORG_IMPORT_DIR)]
           + sum((["-L", d] for d in elpa_dirs), [])
           + ["-l", str(script), "--eval",
              f'(org-import-convert-batch "{src_dir}" "{out_dir}" "html")'])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if "ORG-IMPORT-BULK-DONE" not in (r.stdout + r.stderr):
        sys.exit(f"org-import bulk conversion failed ({src_dir}):\n"
                 f"stdout:\n{r.stdout[-2000:]}\nstderr:\n{r.stderr[-2000:]}")


DANGEROUS_KW_RE = re.compile(r"^\s*#\+(include|setupfile|bind|header|options|cite_export|print_bibliography|call|results|plot)\b", re.I)
BLOCK_RE = re.compile(r"^\s*#\+begin_(example|src|export|quote|verse|center|comment)", re.I)
ENDBLOCK_RE = re.compile(r"^\s*#\+end_", re.I)


def escape_keywords(org: str) -> str:
    """Repair pandoc's block delimiters + escape executable keywords.

    Two problems, one pass:
    1. pandoc emits MISMATCHED begin/end pairs ("#+begin_example" closed
       by "#+end_src") — org matches begin_X only against end_X, so the
       dangling block swallows the rest of the page and the exporter's
       parse derails. Rewrite each end tag to the name on the open stack.
    2. The manuals TEACH executable keywords as literal text; ox-html
       runs #+include:/#+cite_export: at column zero, aborting four Org
       pages. A leading backslash is org's keyword escape and vanishes on
       export. Only top-level lines (outside repaired blocks) get it.
    """
    out, stack = [], []
    for line in org.splitlines(keepends=True):
        m = BLOCK_RE.match(line)
        if re.match(r"^\*+ ", line):
            # org terminates any open block at a headline (evidenced by the
            # exporter running "  #+INCLUDE: fdl.org" after a headline reset
            # one) — mirror that, or the keyword scan trusts a stale stack.
            stack.clear()
        elif m:
            stack.append(m.group(1).lower())
        elif ENDBLOCK_RE.match(line):
            open_name = stack.pop() if stack else None
            if open_name:
                want = f"#+end_{open_name}"
                if line.strip().lower() != want:
                    nl = "\n" if line.endswith("\n") else ""
                    line = want + nl
            elif not line.strip():
                pass  # stray end with nothing open — keep, org ignores it
        elif not stack and DANGEROUS_KW_RE.match(line):
            line = "\\" + line
        out.append(line)
    return "".join(out)


def rewrite_links(org: str, pages: set, doc: str) -> str:
    def repl(m):
        page, frag, desc = m.group(1), m.group(2), m.group(3) or ""
        if page not in pages:
            return desc  # off-corpus .html (SEC_Contents etc) -> plain text
        path = f"{doc}--{page}::{frag}" if frag else f"{doc}--{page}"
        return f"[[id:{path}][{desc}]]" if desc else f"[[id:{path}]]"
    org = IDURL_RE.sub(repl, org)
    # texinfo example blocks: pandoc tags them "example-preformatted" —
    # ox-html renders #+begin_example cleanly, src needs a real language.
    return org.replace("#+begin_src example-preformatted", "#+begin_example") \
               .replace("#+begin_src indentedblock-preformatted", "#+begin_example")


def assemble(html: str, body: str, pages: set, doc: str, page: str) -> str | None:
    title = page_title(html)
    if not body.strip():
        return None
    body = rewrite_links(body, pages, doc)
    body = escape_keywords(body)
    node_id = f"{doc}--{page}"
    navs = {}
    m = NAV_PANEL_RE.search(html)
    if m:
        for key, href, desc in NAV_ROW_RE.findall(m.group(0)):
            navs.setdefault(key, (Path(href).name.replace(".html", ""), clean_title(re.sub(r"<[^>]+>", "", desc))))
    nav_bits = []
    nxt = navs.get("Next")
    # the line ALWAYS opens with "Next: " so the exporter's structural
    # filter (^Next: [[) keeps the whole nav paragraph out of citations
    nav_bits.append(f"Next: [[id:{doc}--{nxt[0]}][{nxt[1]}]]" if nxt else "Next:")
    for key in ("Previous", "Up"):
        t = navs.get(key)
        if t:
            nav_bits.append(f"{key}: [[id:{doc}--{t[0]}][{t[1]}]]")
    nav_line = "   ".join(nav_bits)
    return (f":PROPERTIES:\n:ID: {node_id}\n:END:\n"
            f"#+filetags: :{doc}:\n#+title: {title}\n\n"
            f"{nav_line}\n\n{body.strip()}\n")


def main():
    src = Path(sys.argv[1]).resolve()
    doc, out = sys.argv[2], Path(sys.argv[3])
    htmls = sorted(src.glob("*.html"))
    pages = {p.stem for p in htmls}
    # Stage the nav-stripped HTML, let org-import convert the whole directory
    # in one batch emacs, then read the .org bodies back.
    staging = TMP_ROOT / "src" / doc
    converted = TMP_ROOT / "org" / doc
    staging.mkdir(parents=True, exist_ok=True)
    converted.mkdir(parents=True, exist_ok=True)
    (out / doc).mkdir(parents=True, exist_ok=True)
    for p in htmls:
        (staging / f"{p.stem}.html").write_text(
            body_of(p.read_text(encoding="utf-8", errors="replace")),
            encoding="utf-8")
    org_import_bulk(staging, converted)
    # org-import-bulk mirrors paths under OUT-DIR; its URL-mirror special case
    # names `subdir/index.html' after the containing directory, and a root-level
    # index.html degenerates to a hidden ".org" (file-name-directory always
    # carries the trailing slash the equality check lacks).  Restore the name.
    stray = converted / ".org"
    if stray.exists():
        stray.rename(converted / "index.org")
    n_ok = n_skip = 0
    for p in htmls:
        org_file = converted / f"{p.stem}.org"
        body = org_file.read_text(encoding="utf-8", errors="replace") if org_file.exists() else ""
        page = assemble(p.read_text(encoding="utf-8", errors="replace"), body, pages, doc, p.stem)
        if page is None:
            n_skip += 1
            continue
        (out / doc / f"{p.stem}.org").write_text(page, encoding="utf-8")
        n_ok += 1
    print(f"{doc}: {n_ok} nodes ({n_skip} empty skipped) -> {out}/{doc}")


if __name__ == "__main__":
    main()
