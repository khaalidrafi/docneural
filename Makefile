# docneural build
#
# Pipeline (two independent halves — batch Emacs + Vite):
#
#   make check      byte-compile the exporter (catches syntax/scoping bugs)
#   make export     regenerate .export/ (graph.json + docs/*.html fragments),
#                   then slim it (see make slim)
#   make slim       transport pass only: move link context out of graph.json
#                   into per-node ctx/*.json and write graph.json.gz/.br
#   make linkcheck  assert no rewritten link points at a missing page and
#                   every node's own #Node anchor resolves (dead index anchors
#                   that the texinfo->org corpus never targeted are INFO only)
#   make install    npm install (once; slow on a 4 GB box)
#   make dev        vite dev server, reading .export/ as its public dir
#   make build      npm run build (static site in dist/)
#   make serve      npm run preview (serves dist/ locally)
#   make verify     headless-Chromium assertions against a RUNNING site
#                   (start `make dev` or `make serve` first; URL= picks port,
#                   PAINT= the first-paint budget)
#   make all        check + export + linkcheck + build
#
# Corpus knobs: make export CORPUS=~/docs DOC="org emacs guix" OUT=.export
EMACS ?= emacs
#
# Org version. The exporter needs Org >= 9.7: org-html-prefer-user-labels
# (load-bearing: it makes ox-html emit each <<target>> with its literal
# name as the id, so the #ANCHOR half of a rewritten link resolves).
# 9.8.10 is the newest release on GNU ELPA at the time of writing.
#
#   make org-latest    download org-$(ORG_VERSION) into build/ and leave it there
#   make export ORG_LOAD=build/org-$(ORG_VERSION) ...
#
# ...runs the whole pipeline on that copy without touching the Org your
# Emacs loads. Without ORG_LOAD you get whatever your Emacs bundles
# (9.7+ required; the arity note in scripts/docneural-export.el still holds).
ORG_VERSION ?= 9.8.10
ORG_TARBALL := https://elpa.gnu.org/packages/org-$(ORG_VERSION).tar
ORG_DIR := build/org-$(ORG_VERSION)
# `make export ORG_LOAD=<dir>' prepends <dir> to load-path. `make demo'
# sets it automatically so a fresh clone exports on the LATEST Org with
# no Emacs configuration at all.
ORG_LOAD ?=
EMACS_RUN = $(EMACS) $(if $(ORG_LOAD),-L $(ORG_LOAD),)
PYTHON ?= python3
NODE ?= node
CORPUS ?= ~/docs
DOC ?= org emacs guix
OUT ?= .export
# Where `make verify` points its browser. Dev server by default; use
# URL=http://127.0.0.1:4173/ against `make serve` (built dist/).
URL ?= http://127.0.0.1:5173/
# Milliseconds `make verify` waits for first paint. The boot parses graph.json
# (2.2 MB slim, 7 MB before the ctx split) before anything is visible, so this
# is a machine property: raise it when `uptime` says the Celeron is busy
# (PAINT=300000).
PAINT ?= 180000
# Milliseconds `make verify` waits for a navigation to finish. On the DEV
# server this includes Vite transforming the whole Svelte graph (a module
# script defers DOMContentLoaded), so raise it when something else is compiling
# on this box — or verify the built site, where there is no transform.
NAV ?= 90000
SCRIPT := scripts/docneural-export.el
# One --doc flag per manual; the exporter merges them into one graph.json.
DOC_ARGS := $(foreach d,$(DOC),--doc $(d))

.PHONY: check export slim summarize linkcheck install dev build serve verify all clean org-latest demo orui-shim manuals site

# Materialise the orui-compatible shim at the sibling path BOTH repos'
# aliases already point at (../org-roam-lite-ui). The shim is committed in
# docneural-ui/orui-shim so the whole project lives in GitHub; when the real
# org-roam-lite-ui is published: clone it at that path and delete this
# target's output — no repo edits anywhere.
THEME_DIR ?= ../docneural-ui
orui-shim:
	@rm -rf ../org-roam-lite-ui
	cp -r $(THEME_DIR)/orui-shim ../org-roam-lite-ui
	@echo "orui shim ready at ../org-roam-lite-ui"

# The latest Org release, materialised. ~7 s on a slow link, then reused by
# every later export. build/ is gitignored.
org-latest:
	@mkdir -p build
	curl -sfLO $(ORG_TARBALL) --output-dir build
	tar xf build/org-$(ORG_VERSION).tar -C build
	@$(EMACS) --batch -Q -L $(ORG_DIR) --eval '(progn (require (quote org)) (message "org %s ready" (org-version)))'

check:
	$(EMACS_RUN) --batch -Q --eval '(progn (require (quote org)) (message "org %s" (org-version)) (byte-compile-file "$(SCRIPT)") (message "OK"))'

export: check
	$(EMACS_RUN) --batch -Q -L scripts -l docneural-export \
	  -f docneural-export-main -- \
	  --corpus $(CORPUS) $(DOC_ARGS) --out $(OUT)
	# Transport pass: the exporter emits the WHOLE graph (contexts and all);
	# this moves 4.9 MB of citation prose out of the boot payload into
	# per-node ctx/ files and precompresses what is left.
	$(NODE) scripts/slim-graph.mjs --out $(OUT)
	# Heading index for search (per-manual, lazy): crawl the exported
	# fragments for h2/h3 ids — a separate pass because it reads the HTML,
	# not the graph.
	$(NODE) scripts/build-search.mjs --out $(OUT)

# Optional, BYO key: a one-line tldr per chapter, at build time (costs the
# runtime nothing). Cache is content-hashed, so incremental builds only pay
# for chapters that changed. Without a key the target skips and the site
# still builds — summaries are an enhancement, not a requirement.
summarize:
	$(NODE) scripts/summarize-export.mjs --out $(OUT)
	$(NODE) scripts/slim-graph.mjs --out $(OUT)

# Re-run only the transport pass (e.g. after changing slim-graph.mjs).
slim:
	$(NODE) scripts/slim-graph.mjs --out $(OUT)
	$(NODE) scripts/build-search.mjs --out $(OUT)

linkcheck:
	$(PYTHON) scripts/check-anchors.py $(OUT)

install:
	npm install

dev:
	npm run dev

build:
	npm run build
	# The self-hosted latin subsets are redistributed in dist/assets/, so the
	# SIL OFL texts that accompany them travel with the bundle (Vite only
	# emits the .woff2 files a stylesheet references — never the licenses).
	mkdir -p dist/fonts
	cp ../docneural-ui/fonts/*-OFL.txt dist/fonts/

serve:
	npm run preview

# scripts/pw-verify.mjs drives a real Chromium (playwright-core, already present
# in the sibling org-roam-lite-ui checkout — no install here) and fails loudly
# on numeric claims a screenshot can't make: a source chip's hue must equal the
# hue the canvas paints that source's nodes, the graph must have >2000 lit px,
# phone layout must not overflow. Exit non-zero = something is broken.
verify:
	$(NODE) scripts/pw-verify.mjs --url $(URL) --paint $(PAINT) --nav $(NAV)

# Build the SHIPPED demo site: the bundled corpus, on the latest Org,
# from a clean checkout — the one command that must always work.
demo: org-latest
	$(MAKE) export CORPUS=demo DOC=demo OUT=.export ORG_LOAD=$(ORG_DIR)
	$(MAKE) linkcheck OUT=.export
	$(MAKE) build

# The REAL site: the three manuals org-docs maintains in $(CORPUS) (~/docs).
# Corpus production is org-docs's job — in Emacs: M-x org-docs-import-emacs /
# -import-org / -import-guix (texinfo -> Org with stable id: links; the
# updater refreshes STAGED, never in place). This target only READS the
# corpus: latest Org, export, slim, search index, linkcheck, build.
# `make site` then serves the built dist (reader at /, money page at
# /cloud.html) on :4173.
manuals: org-latest
	$(MAKE) export CORPUS=$(CORPUS) DOC="$(DOC)" OUT=$(OUT) ORG_LOAD=$(ORG_DIR)
	$(MAKE) linkcheck OUT=$(OUT)
	$(MAKE) build

site: build
	npm run preview

all: check export linkcheck build

clean:
	rm -f scripts/*.elc
	rm -rf dist build .export
