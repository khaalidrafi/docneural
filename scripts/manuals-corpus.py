#!/usr/bin/env python3
"""manuals-corpus.py — texinfo html_node trees -> docneural corpus dirs.

Reproduces the shape of the Owner's ~/docs corpus (built by org-docs +
org-import from the same makeinfo split-HTML) with a self-contained
pipeline, because the org-import package was never pushed to GitHub.

Per page the exporter contract (scripts/docneural-export.el) needs:
  - :ID: drawer          -> node id ("MANUAL--PageName")
  - #+title / #+filetags -> node label + source color group
  - a nav paragraph      -> "Next: [[id:..]] ..." (Up/Next/Prev chainback;
                            one line so the exporter's structural filter
                            "^Next: [[" drops it from citations)
  - [[id:PAGE::#anchor]] -> semantic cross-references (graph edges)

Bodies are converted by pandoc (html -> org), then post-processed here:
links to sibling pages become id: links, images and off-corpus artifacts
are stripped, pandoc's escaped-macro noise is left for the exporter's
own macro stub.

Usage: manuals-corpus.py <html-dir> <doc-name> <out-corpus-dir>
"""
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

PANDOC = "/home/z/my-project/emacs-root/usr/bin/pandoc"

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


def pandoc_org(html: str) -> str:
    r = subprocess.run(
        [PANDOC, "-f", "html", "-t", "org", "--wrap=none"],
        input=html.encode(), capture_output=True)
    return r.stdout.decode("utf-8", errors="replace")


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


def assemble(html: str, pages: set, doc: str, page: str) -> str | None:
    title = page_title(html)
    # nav row: first nav-panel wins (it repeats at the bottom)
    navs = {}
    m = NAV_PANEL_RE.search(html)
    if m:
        for key, href, desc in NAV_ROW_RE.findall(m.group(0)):
            navs.setdefault(key, (Path(href).name.replace(".html", ""), clean_title(re.sub(r"<[^>]+>", "", desc))))
    body = pandoc_org(body_of(html))
    if not body.strip():
        return None
    body = rewrite_links(body, pages, doc)
    body = escape_keywords(body)
    node_id = f"{doc}--{page}"
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
    src, doc, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    htmls = sorted(src.glob("*.html"))
    pages = {p.stem for p in htmls}
    (out / doc).mkdir(parents=True, exist_ok=True)
    n_ok = n_skip = 0
    for p in htmls:
        html = p.read_text(encoding="utf-8", errors="replace")
        org = assemble(html, pages, doc, p.stem)
        if org is None:
            n_skip += 1
            continue
        (out / doc / f"{p.stem}.org").write_text(org, encoding="utf-8")
        n_ok += 1
    print(f"{doc}: {n_ok} nodes ({n_skip} empty skipped) -> {out}/{doc}")


if __name__ == "__main__":
    main()
