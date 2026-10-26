;;; org-import-convert.el — batch HTML→Org through the Owner's org-import.
;;;
;;; The manuals corpus (site-corpus/) is converted from makeinfo node-split
;;; HTML by the `org-import' package — the Owner's converter, published at
;;; git.khalidrafi.tech/org-pandoc-import (package name `org-import', formerly
;;; org-pandoc-import).  This driver runs it headless:
;;;
;;;   emacs --batch \
;;;     -L $ORG_IMPORT_DIR \
;;;     -L $ELPA_DIR/dash-2.20.0 -L $ELPA_DIR/s-1.13.0 -L $ELPA_DIR/plz-0.9 \
;;;     -l org-import-convert.el \
;;;     --eval '(org-import-convert-batch "SRC-DIR" "OUT-DIR" "html")'
;;;
;;; Why the package and not a bare `pandoc -f html -t org': org-import owns
;;; the conversion profile — its post-processing strips the CUSTOM_ID
;;; properties pandoc copies out of the HTML and normalises bad characters —
;;; and the corpus contract says the site renders what org-import produces,
;;; the same way the Owner's own ~/docs corpus does.  `--wrap=none' is added
;;; so cross-reference links stay on one line for the corpus linker.

(require 'org-import)

(defun org-import-convert-batch (source out-dir extensions)
  "Bulk-convert SOURCE into OUT-DIR with org-import, then block.
EXTENSIONS is a comma-separated list (e.g. \"html\").  Waits for every
pandoc child to exit, then prints a machine-checkable sentinel so the
caller can tell a clean finish from a silent death."
  (let ((org-import-html-args '("--wrap=none"))
        (org-import-confirm-overwrite nil)
        ;; The global `_*.lua' filters serve single-page web imports:
        ;; `_simple-headers' melts every header id into a `[[*headline]]'
        ;; fuzzy link, which would orphan the machine anchors the manuals
        ;; corpus is built on (cross-page `[[id:page::#anchor]]' wires and
        ;; the exporter's anchor checks both name :CUSTOM_ID: properties).
        ;; The Owner's own makeinfo corpus keeps its anchors, so the corpus
        ;; driver runs org-import's html backend with global filters off.
        (org-import-global-filters nil))
    (org-import-bulk (expand-file-name source)
                     (expand-file-name out-dir)
                     (split-string (or extensions "html") "," t))
    ;; Same wait loop as `org-import-bulk-to-org-batch-mode': the conversions
    ;; are child processes, so batch exit must not race them.
    (while (seq-some #'process-live-p (process-list))
      (sleep-for 0.5))
    (message "ORG-IMPORT-BULK-DONE")))
