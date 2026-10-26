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
#   make verify-built  the same gate against the BUILT site: serves dist/ with
#                   `vite preview` and drives pw-verify on it
#   make audit-built   the P0 request/font/transport census only (corpus-free,
#                   runs on a fixture build; see scripts/boot-audit.mjs)
#   make all        check + export + linkcheck + build
#
# Corpus knobs: make export CORPUS=~/docs DOC="org emacs guix" OUT=.export
EMACS ?= emacs
PYTHON ?= python3
NODE ?= node
CORPUS ?= ~/docs
DOC ?= org emacs guix
OUT ?= .export
# Extra vite build flags, e.g. BASE_FLAG=--base=/docneural/ for the GitHub
# Pages project site (App.svelte derives the store base from BASE_URL, so
# the same bundle also works root-mounted with the default '').
BASE_FLAG ?=
# Where `make verify` points its browser. Dev server by default; use
# URL=http://127.0.0.1:4173/ against `make serve` (built dist/).
URL ?= http://127.0.0.1:5173/
# Milliseconds `make verify` waits for first paint. The boot parses graph.json
# (~78 kB brotli on the wire since the transport pass; 2.2 MB parsed, 7 MB
# before the ctx split) before anything is visible, so this is a machine
# property: raise it when `uptime` says the Celeron is busy (PAINT=300000).
PAINT ?= 180000
# Milliseconds `make verify` waits for a navigation to finish. On the DEV
# server this includes Vite transforming the whole Svelte graph (a module
# script defers DOMContentLoaded), so raise it when something else is compiling
# on this box — or verify the built site, where there is no transform.
NAV ?= 90000
SCRIPT := scripts/docneural-export.el
# One --doc flag per manual; the exporter merges them into one graph.json.
DOC_ARGS := $(foreach d,$(DOC),--doc $(d))
# The sibling THEME checkout (fonts for dist/, aliases for vite). The theme
# repo was renamed synapt -> docneural-ui; accept either directory name so a
# checkout that predates the rename still builds, docneural-ui winning.
THEME := $(shell for d in ../docneural-ui ../synapt; do [ -d "$$d" ] && echo "$$d" && break; done)
ifeq ($(THEME),)
THEME := ../docneural-ui
endif

.PHONY: check export slim linkcheck install dev build serve verify verify-built audit-built all clean

check:
	$(EMACS) --batch -Q --eval '(progn (byte-compile-file "$(SCRIPT)") (message "OK"))'

export: check
	$(EMACS) --batch -Q -L scripts -l docneural-export \
          -f docneural-export-main -- \
          --corpus $(CORPUS) $(DOC_ARGS) --out $(OUT)
	# Transport pass: the exporter emits the WHOLE graph (contexts and all);
	# this moves 4.9 MB of citation prose out of the boot payload into
	# per-node ctx/ files and precompresses what is left.
	$(NODE) scripts/slim-graph.mjs --out $(OUT)

# Re-run only the transport pass (e.g. after changing slim-graph.mjs).
slim:
	$(NODE) scripts/slim-graph.mjs --out $(OUT)

linkcheck:
	$(PYTHON) scripts/check-anchors.py $(OUT)

install:
	npm install

dev:
	npm run dev

build:
	# The boot fetches the precompressed artifact (docneural-ui core/transport.ts
	# walks graph.json.br -> .gz -> plain), so a build without the transport pass
	# would ship the 2.2 MB parsed JSON and fail verify-built's "arrived small"
	# check. Fail here, at the make line, with the fix in the message.
	@test -f $(OUT)/graph.json || { echo "build: $(OUT)/graph.json missing — run 'make export' (export + slim) first"; exit 1; }
	@test -f $(OUT)/graph.json.br -o -f $(OUT)/graph.json.gz || { echo "build: no $(OUT)/graph.json.{br,gz} — run 'make slim' (the transport pass) first"; exit 1; }
	npm run build -- $(BASE_FLAG)
	# The self-hosted latin subsets are redistributed in dist/assets/, so the
	# SIL OFL texts that accompany them travel with the bundle (Vite only
	# emits the .woff2 files a stylesheet references — never the licenses).
	mkdir -p dist/fonts
	cp $(THEME)/fonts/*-OFL.txt dist/fonts/

serve:
	npm run preview

# scripts/pw-verify.mjs drives a real Chromium (playwright-core, already present
# in the sibling org-roam-lite-ui checkout — no install here) and fails loudly
# on numeric claims a screenshot can't make: a source chip's hue must equal the
# hue the canvas paints that source's nodes, the graph must have >2000 lit px,
# phone layout must not overflow. Exit non-zero = something is broken.
verify:
	$(NODE) scripts/pw-verify.mjs --url $(URL) --paint $(PAINT) --nav $(NAV)

# The FULL gate against the BUILT site: serve dist/ with `vite preview`
# (which carries the serve-precompressed middleware) and drive pw-verify
# against that — every boot-request/transport/font assertion judged on the
# shipped artifact, not on a dev-server transform.
verify-built:
	$(NODE) scripts/verify-built.mjs --project . --port 4173 --paint $(PAINT) --nav $(NAV)

# The P0 census alone (boot requests < 60, all same-origin, the graph arrives
# small, zero external font URLs, three self-hosted woff2) — corpus-free, so
# it runs on a fixture build or in CI where pw-verify's editorial assertions
# cannot.
audit-built:
	$(NODE) scripts/boot-audit.mjs --project . --port 4174

all: check export linkcheck build

clean:
	rm -f scripts/*.elc
	rm -rf dist
