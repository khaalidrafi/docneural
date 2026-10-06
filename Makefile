# org-docs-website build
#
#   make check      byte-compile the exporter (catches syntax/scoping bugs)
#   make export     regenerate .export/ (graph.json + docs/*.html fragments)
#   make linkcheck  assert no rewritten link points at a missing page and
#                   every node's own #Node anchor resolves (dead index anchors
#                   that the texinfo->org corpus never targeted are INFO only)
#   make all        check + export + linkcheck
#
# Corpus knobs: make export CORPUS=~/docs DOC=org OUT=.export
EMACS ?= emacs
PYTHON ?= python3
CORPUS ?= ~/docs
DOC ?= org
OUT ?= .export
SCRIPT := scripts/org-docs-website-export.el

.PHONY: check export linkcheck all clean

check:
	$(EMACS) --batch -Q --eval '(progn (byte-compile-file "$(SCRIPT)") (message "OK"))'

export: check
	$(EMACS) --batch -Q -L scripts -l org-docs-website-export \
	  -f org-docs-website-export-main -- \
	  --corpus $(CORPUS) --doc $(DOC) --out $(OUT)

linkcheck:
	$(PYTHON) scripts/check-anchors.py $(OUT)

all: check export linkcheck

clean:
	rm -f scripts/*.elc
