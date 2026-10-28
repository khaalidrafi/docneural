#!/usr/bin/env python3
"""gen-sitemap.py — emit sitemap.xml for the docneural Pages site.

Walks $(OUT)/docs/*.html (the exported corpus pages — real crawlable URLs)
plus the site root, writing $(OUT)/sitemap.xml. Called by `make build` so the
sitemap always matches the shipped corpus without hand-maintaining URLs.
"""
import glob, os, sys, pathlib

out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".export")
base = "https://khaalidrafi.github.io/docneural/"

urls = [base]
docs = sorted(glob.glob(str(out / "docs" / "*.html")))
urls += [base + "docs/" + os.path.basename(p) for p in docs]

frames = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    frames.append(f"  <url><loc>{u}</loc></url>")
frames.append("</urlset>")

dst = out / "sitemap.xml"
dst.write_text("\n".join(frames) + "\n", encoding="utf-8")
print(f"sitemap: {len(urls)} urls -> {dst}")
