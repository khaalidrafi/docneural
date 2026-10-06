#!/usr/bin/env python3
"""Link-integrity check for the exported corpus -- the build gate / test.

Every id: link the Emacs filter rewrote became href="docs/SLUG.html#ANCHOR".
This walks OUT/docs and gates on exactly what the EXPORTER owns, while reporting
(as INFO) the dead anchors that are inherent to the texinfo->org corpus and
therefore unrecoverable at export time.

FAIL (exporter's responsibility):
  broken-file : href points at a docs/SLUG.html that was never emitted -- an
                id: resolution/emit bug.
  node-name   : an href "docs/SLUG.html#ANCHOR" where ANCHOR decodes to SLUG
                itself -- a node's own <<Node>> target.  org-html-prefer-user-
                labels is what makes ox emit these literally (not as a hash
                id); if any dangle, that fix regressed.  Must be 0.

INFO (source lacks the landing spot -- nothing the exporter can synthesize;
each is HARMLESS because the browser still opens the correct node, and the
index rows' second column links to a real section that resolves):
  dead-anchor : a non-empty ANCHOR absent from the target, in three flavors:
                  index-…    texinfo @cindex *invisible* anchors never
                             emitted as <<targets>> by the converter.
                  <stem>-N   splitter disambiguated colliding CUSTOM_IDs but
                             left the cross-reference unsuffixed (or vice-versa).
                  other      same naming-skew class, e.g. a stub node "X (1)"
                             whose over-encoded link "X-_00281_0029" misses
                             the parent's plain "X".
  empty-frag  : "docs/x.html#" with nothing after the #; ignored.

Percent-decoding matters: the filter hexifies the href (url-hexify-string) while
ox-html emits the target id LITERALLY (org-html-prefer-user-labels); browsers
unquote a URL fragment before matching an element id, so we unquote too.

Exit 0 iff broken-file == 0 and node-name-dead == 0.
Usage: python3 scripts/check-anchors.py [.export]
"""
import html
import os
import re
import sys
from urllib.parse import unquote

HREF = re.compile(r'href="docs/([^"#]+)\.html(?:#([^"]*))?"')
ID = re.compile(r'\bid="([^"]+)"')


def load_ids(docs_dir):
    """slug -> set of literal ids present in that fragment."""
    return {fn[:-5]: set(ID.findall(open(os.path.join(docs_dir, fn),
                                           encoding="utf-8").read()))
            for fn in os.listdir(docs_dir) if fn.endswith(".html")}


def main(out_dir):
    docs_dir = os.path.join(out_dir, "docs")
    if not os.path.isdir(docs_dir):
        print(f"no docs dir at {docs_dir}", file=sys.stderr)
        return 2
    ids = load_ids(docs_dir)

    total = checked = 0
    broken_file = nodename_total = nodename_dead = empty = dead = 0
    fails = []
    for slug in ids:
        body = open(os.path.join(docs_dir, slug + ".html"),
                    encoding="utf-8").read()
        for dst, anchor in HREF.findall(body):
            if anchor is None:            # plain node link, no fragment: fine
                continue
            total += 1
            want = unquote(html.unescape(anchor))
            if want == "":                # degenerate trailing '#'
                empty += 1
                continue
            checked += 1
            if dst not in ids:            # page never emitted
                broken_file += 1
                fails.append(("broken-file", slug, dst, want))
                continue
            if want == dst:               # the node's own <<Node>> target
                nodename_total += 1
                if want not in ids[dst]:
                    nodename_dead += 1
                    fails.append(("node-name", slug, dst, want))
                continue
            if want not in ids[dst]:      # real anchor, but absent upstream
                dead += 1
    print(f"hrefs-with-anchor {total} (empty {empty}), compared {checked}")
    print(f"  broken-file      : {broken_file}          [FAIL] resolved to a missing page")
    print(f"  node-name anchors: {nodename_total - nodename_dead}/{nodename_total} resolve"
          f", {nodename_dead} dead  [FAIL if >0] prefer-user-labels self-targets")
    print(f"  dead-anchor INFO : {dead}          source lacks the landing spot; node still opens")
    for reason, src, dst, a in fails[:40]:
        print(f"  {reason}: {src}.html -> {dst}.html#{a}")
    return 1 if (broken_file or nodename_dead) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else ".export"))
