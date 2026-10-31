#!/usr/bin/env python3
"""Mine cross-manual references from the exported Org corpus."""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.request import urlopen


GRAPH_URL = (
    "https://raw.githubusercontent.com/khaalidrafi/docneural-ui/ai/main/"
    "public/sample/graph.json"
)
MANUALS = ("org", "emacs", "guix")
MANUAL_SUFFIXES = {manual: f" (The {manual.title()} Manual)" for manual in MANUALS}
REF_RE = re.compile(
    r"\((org|emacs|guix)\)([^\r\n]{0,240})"
    r"|info:(org|emacs|guix)#([^\r\n]{0,240})",
    re.IGNORECASE,
)


def load_graph(path_arg):
    if path_arg:
        with open(path_arg, encoding="utf-8") as handle:
            return json.load(handle)
    with urlopen(GRAPH_URL) as response:
        return json.load(response)


def normalize(value):
    value = value.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", value).strip().casefold()


def short_title(node):
    title = node.get("title", "")
    for suffix in MANUAL_SUFFIXES.values():
        if title.endswith(suffix):
            return title[: -len(suffix)]
    return title


def source_id(path, node_ids):
    manual = path.parent.name
    candidate = f"{manual}--{path.stem}"
    return candidate if candidate in node_ids else None


def title_matches(text, target_titles):
    """Return the longest target title whose normalized form starts text."""
    normalized_text = normalize(text)
    matches = []
    for title, ids in target_titles.items():
        if not normalized_text.startswith(title):
            continue
        remainder = normalized_text[len(title) :]
        if remainder and remainder[0].isalnum():
            continue
        matches.append((len(title), title, ids))
    if not matches:
        return []
    longest = max(item[0] for item in matches)
    return [(title, ids) for length, title, ids in matches if length == longest]


def main():
    graph = load_graph(sys.argv[1] if len(sys.argv) > 1 else None)
    nodes = graph["nodes"] if isinstance(graph, dict) else graph
    node_ids = {node["id"] for node in nodes}
    targets = defaultdict(lambda: defaultdict(list))
    for node in nodes:
        node_id = node.get("id", "")
        manual = node_id.split("--", 1)[0].casefold()
        if manual in MANUALS:
            targets[manual][normalize(short_title(node))].append(node_id)

    root = Path(__file__).resolve().parents[3]
    corpus = root / "site-corpus"
    wires = []
    hits_by_pair = Counter()
    matched = ambiguous = skipped = 0

    for path in sorted(corpus.glob("**/*.org")):
        source = source_id(path, node_ids)
        if not source:
            continue
        source_manual = path.parent.name.casefold()
        with open(path, encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, 1):
                for match in REF_RE.finditer(line):
                    target_manual = (match.group(1) or match.group(3)).casefold()
                    text = match.group(2) if match.group(1) else match.group(4)
                    candidates = title_matches(text, targets[target_manual])
                    hits_by_pair[f"{source_manual}->{target_manual}"] += 1
                    if not candidates:
                        skipped += 1
                        continue
                    if len(candidates) != 1 or len(candidates[0][1]) != 1:
                        ambiguous += 1
                        continue
                    target = candidates[0][1][0]
                    if target.split("--", 1)[0].casefold() == source_manual:
                        skipped += 1
                        continue
                    matched += 1
                    wires.append(
                        {
                            "source": source,
                            "target": target,
                            "kind": "xref",
                            "ctx": line.strip()[:160],
                            "src_file": str(path.relative_to(root)),
                            "confidence": 1.0,
                        }
                    )

    output = Path(__file__).resolve().parent / "proposed-wires.json"
    with open(output, "w", encoding="utf-8") as handle:
        json.dump(wires, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print(f"scanned: {sum(1 for _ in corpus.glob('**/*.org'))} Org files")
    print("hits per manual pair:")
    for pair in sorted(hits_by_pair):
        print(f"  {pair}: {hits_by_pair[pair]}")
    print(f"matched: {matched}")
    print(f"ambiguous: {ambiguous}")
    print(f"skipped: {skipped}")
    print(f"recovered cross-manual references: {len(wires)}")


if __name__ == "__main__":
    main()
