#!/usr/bin/env python3
"""gh-corpus-prep.py — derive a browsable docneural corpus from THIS repo.

The docneural exporter (scripts/docneural-export.el) reads directories of
Org node files: each file = one graph node, keyed by its :ID: drawer, with
[[id:...]] links becoming graph edges.  The Owner's real corpus (~/docs,
the texinfo->org manuals) never leaves their box, so this script builds a
FIRST-CLASS replacement from the repo's own documentation: root *.org go
to the `site` namespace, agent-team/*.org to `team`.

Per file, it injects:
  - a file-level :ID: drawer  (<ns>--<basename>)  -> node identity
  - #+filetags                (<ns>)             -> graph color group
  - an end-of-file "Cross-references (auto-generated)" heading whose
    [[id:...]] links are derived ONLY from real prose mentions of the
    other docs ("CANDIDATES.org said ...") — nothing is invented, the
    graph simply makes existing references navigable.

Deterministic: same repo tree -> byte-identical corpus.  The Pages
workflow runs this before `make export`, so the deployed site always
matches the pushed source.  Output dir is gitignored (.gh-corpus/).

Usage: python3 scripts/gh-corpus-prep.py [--repo .] [--out .gh-corpus]
"""
import argparse
import re
import subprocess
from pathlib import Path

NS_MAP = {"": "site", ".": "site", "agent-team": "team"}  # repo dir -> ns

MENTION_RE = re.compile(r"\b([A-Z][A-Za-z0-9-]*)\.org\b")
# Lines that merely DESCRIBE link syntax (this repo documents its own
# tooling): verbatim examples start with '=', comments with '#'.
EXAMPLE_LINE_RE = re.compile(r"^\s*[=#]")


def inject_header(text: str, node_id: str, ns: str) -> str:
    """Prepend the file-level property drawer + filetags before everything.

    The drawer goes above the #+TITLE keyword block: org-element then
    treats it as the document property drawer and ox-html drops it from
    the output (verified against Emacs 30.1 / Org 9.7.11).
    """
    drawer = f":PROPERTIES:\n:ID: {node_id}\n:END:\n"
    if not re.search(r"^\s*#\+filetags:", text, re.M):
        drawer += f"#+filetags: :{ns}:\n"
    return drawer + text


def crossrefs(text: str, own_id: str, id_of_name: dict) -> list[str]:
    """[[id:...]] links for every other doc mentioned in prose, with counts."""
    counts: dict[str, int] = {}
    for line in text.splitlines():
        if EXAMPLE_LINE_RE.match(line):
            continue
        for name in MENTION_RE.findall(line):
            if name in id_of_name and id_of_name[name] != own_id:
                counts[name] = counts.get(name, 0) + 1
    return sorted(counts, key=lambda n: (-counts[n], n))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("--out", default=".gh-corpus")
    args = ap.parse_args()
    repo = Path(args.repo).resolve()
    out = Path(args.out).resolve()

    tracked = set(subprocess.run(
        ["git", "-C", str(repo), "ls-files", "*.org"],
        capture_output=True, text=True, check=True,
    ).stdout.splitlines())

    files: dict[str, Path] = {}  # name (no .org) -> path
    for path in sorted(repo.rglob("*.org")):
        rel = path.relative_to(repo).as_posix()
        if rel not in tracked:
            continue
        parent = path.parent.relative_to(repo).as_posix()
        if parent not in NS_MAP:
            continue  # not a corpus namespace — skip
        files[path.stem] = path
    id_of = {name: f"{NS_MAP[p.parent.relative_to(repo).as_posix()]}--{name}"
             for name, p in files.items()}

    # Pass 2: emit corpus files with drawer + tags + cross-reference edges.
    n_edges = 0
    for name, path in sorted(files.items()):
        ns = NS_MAP[path.parent.relative_to(repo).as_posix()]
        node_id = id_of[name]
        text = path.read_text(encoding="utf-8")
        refs = crossrefs(text, node_id, id_of)
        if refs:
            lines = ["", "* Cross-references (auto-generated)", ""]
            for ref in refs:
                lines.append(f"- [[id:{id_of[ref]}][{ref}.org]]")
            text = text.rstrip("\n") + "\n" + "\n".join(lines) + "\n"
            n_edges += len(refs)
        dest = out / ns / path.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(inject_header(text, node_id, ns), encoding="utf-8")
        print(f"  {ns}/{path.name}  id={node_id}  refs={len(refs)}")

    print(f"corpus: {len(files)} nodes, {n_edges} cross-reference edges -> {out}")


if __name__ == "__main__":
    main()
