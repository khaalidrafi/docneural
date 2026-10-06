# org-docs-website build
#
# Pipeline (two independent halves — batch Emacs + Vite):
#
#   make check      byte-compile the exporter (catches syntax/scoping bugs)
#   make export     regenerate .export/ (graph.json + docs/*.html fragments)
#   make linkcheck  assert no rewritten link points at a missing page and
#                   every node's own #Node anchor resolves (dead index anchors
#                   that the texinfo->org corpus never targeted are INFO only)
#   make install    npm install (once; slow on a 4 GB box)
#   make dev        vite dev server, reading .export/ as its public dir
#   make build      npm run build (static site in dist/)
#   make serve      npm run preview (serves dist/ locally)
#   make all        check + export + linkcheck + build
#
# Corpus knobs: make export CORPUS=~/docs DOC=org OUT=.export
EMACS ?= emacs
PYTHON ?= python3
CORPUS ?= ~/docs
DOC ?= org
OUT ?= .export
SCRIPT := scripts/org-docs-website-export.el

.PHONY: check export linkcheck install dev build serve all clean

check:
	$(EMACS) --batch -Q --eval '(progn (byte-compile-file "$(SCRIPT)") (message "OK"))'

export: check
	$(EMACS) --batch -Q -L scripts -l org-docs-website-export \
	  -f org-docs-website-export-main -- \
	  --corpus $(CORPUS) --doc $(DOC) --out $(OUT)

linkcheck:
	$(PYTHON) scripts/check-anchors.py $(OUT)

install:
	npm install

dev:
	npm run dev

build:
	npm run build

serve:
	npm run preview

all: check export linkcheck build

clean:
	rm -f scripts/*.elc
	rm -rf dist
