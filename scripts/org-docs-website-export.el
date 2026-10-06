;;; org-docs-website-export.el --- Export an org-docs corpus for the Synapt theme  -*- lexical-binding: t; -*-

;; Copyright 2026 Khalid Rafi

;; Part of org-docs-website. Batch script; not an installed package.

;;; Commentary:

;; Turns a doc directory of org-docs node files (e.g. ~/docs/org, the Org
;; manual split per Info node) into the two static artifacts the Synapt
;; theme reads:
;;
;;   OUT/graph.json        nodes (id, slug, title, tags) + links (source,
;;                         target, context) — same citation model as
;;                         org-docs-agent.el: file :ID: + heading
;;                         :CUSTOM_ID:, so a citation from the CLI, the
;;                         MCP server and this site all mean one thing.
;;   OUT/docs/SLUG.html    one body-only ox-html fragment per file, with
;;                         id: links rewritten (in a parse-tree filter) to
;;                         href="docs/SLUG.html#ANCHOR" — the shape the
;;                         theme's NotePreview interceptor and the future
;;                         static pages both speak.
;;
;; Run (see Makefile):
;;   emacs --batch -l scripts/org-docs-website-export.el \
;;         -f org-docs-website-export-main -- \
;;         --corpus ~/docs --doc org --out .export
;;
;; Design notes:
;; - Links are extracted with org-element, NOT a text regex: the Org manual
;;   is full of EXAMPLE links ([[id:org--foo.org]] etc.) that must not enter
;;   the graph.  org-element skips links inside src/example blocks.
;; - The id->file map is built by scanning `:ID:' drawer lines once per
;;   file (org-docs-reader--grep-id-file greps per query; 6k queries x a
;;   corpus grep would crawl on a 4 GB machine).
;; - id: links are rewritten in a :filter-parse-tree, not by regexing the
;;   finished HTML: ox-html replaces unresolvable id: links with
;;   "[BROKEN LINK:...]" text that has already dropped the description.
;;   Turning the link into a FILE-type one lets org-html-link emit our
;;   href verbatim, description intact.  CUSTOM_ID anchors survive export
;;   as heading ids, and pandoc-style <<target>> lines export as
;;   <a id=...>, so the "#ANCHOR" half resolves in the browser unchanged.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'ox-html)
(require 'json)
(require 'url-util) ; url-hexify-string is not autoloaded in batch

(defun org-docs-website--slug (file)
  "Node slug for node FILE: basename without extension."
  (file-name-sans-extension (file-name-nondirectory file)))

(defun org-docs-website--scan-corpus (doc-dir)
  "Return (ID->FILE SLUG->(ID TITLE TAGS)) for every .org in DOC-DIR.
ID->FILE maps each file's :ID: drawer line to its path; the second
table maps slug -> (id title tags) read from :ID:, #+title and
#+file-tags (if present; tags default to the doc dir name)."
  (let ((id->file (make-hash-table :test #'equal))
        (slugs nil))
    (dolist (file (directory-files doc-dir t "\\.org\\'"))
      (with-temp-buffer
        (insert-file-contents file)
        (let (id title tags)
          ;; Drawer line is "  :ID:    <value>"; capture the value token.
          (save-excursion
            (when (re-search-forward "^[ \t]*:ID:[ \t]+\\([^ \t\n]+\\)" nil t)
              (setq id (match-string-no-properties 1))))
          (save-excursion
            (when (re-search-forward "^[ \t]*#\\+title:[ \t]*\\(.*\\)$" nil t)
              (setq title (string-trim (match-string 1)))))
          (save-excursion
            (when (re-search-forward "^[ \t]*#\\+filetags:[ \t]*\\(.*\\)$" nil t)
              (setq tags (split-string (match-string 1) ":" t "[ \t]+"))))
          (when id (puthash id file id->file))
          (push (list (org-docs-website--slug file)
                      (or id (org-docs-website--slug file))
                      (or title (org-docs-website--slug file))
                      tags)
                slugs))))
    (list id->file (nreverse slugs))))

(defun org-docs-website--resolve (path id->file)
  "(FILE . ANCHOR) for id: link PATH — org-docs-reader--resolve-id-link
without the per-call corpus grep.  Returns nil for unknown ids (manual
examples, external corpora); the caller drops those."
  (let* ((sep (string-match "::" path))
         (base (if sep (substring path 0 sep) path))
         (anchor (when sep
                   (let ((a (string-remove-prefix "#" (substring path (match-end 0)))))
                     (unless (string-empty-p a) a)))))
    (when-let ((file (gethash base id->file)))
      (cons file anchor))))

(defun org-docs-website--collect-links (file id->file)
  "Real id: links in FILE as a list of (TARGET-SLUG ANCHOR CONTEXT-LINE).
Only links whose target resolves in this corpus count.  CONTEXT is the
trimmed source line containing the link, capped so graph.json stays small
enough to fetch on a potato."
  (with-temp-buffer
    (insert-file-contents file)
    (org-mode)
    (let ((tree (org-element-parse-buffer))
          (out nil))
      (org-element-map tree 'link
        (lambda (link)
          (when (equal (org-element-property :type link) "id")
            (let* ((path (org-element-property :path link))
                   (resolved (org-docs-website--resolve path id->file)))
              (when resolved
                (let ((ctx (progn
                             (save-excursion
                               (goto-char (org-element-property :begin link))
                               (string-trim
                                (buffer-substring-no-properties
                                 (line-beginning-position) (line-end-position)))))))
                  (push (list (org-docs-website--slug (car resolved))
                              (cdr resolved)
                              (if (> (length ctx) 160)
                                  (substring ctx 0 160)
                                ctx))
                        out)))))))
      (nreverse out))))

(defun org-docs-website--export-body (id->file slug)
  "Export the current Org buffer body-only via ox-html, with link filter.
Return (HTML FAILED-LINKS), FAILED-LINKS being (SLUG ID-PATH) for each id:
link with no target in this corpus.  Three Org behaviors must be
neutralized for a corpus like the Org manual:
- macro expansion aborts on undefined names ({{{name}}} in the manual is
  a literal example; Org 9.7 has no off-switch here) -- stubbed below;
- id: link resolution calls org-id-find, which on every miss rescans all
  known ID files (thousands; crawls on a 4 GB box) -- stubbed to nil;
- footnote elements raise ox-html's \"Definition not found\" because the
  manual's [fn:N] appear only inside verbatim examples.  With
  ORG-EXPORT-WITH-FOOTNOTES nil (bound by the caller) org-export-as strips
  footnote elements from the tree before resolution; the manual's real
  #FOOTn cross-refs are ordinary CUSTOM_ID links and survive untouched.
Any remaining error propagates (the caller skips that one file)."
  ;; Two nested lets, NOT one: under lexical binding a let-binding's init
  ;; form cannot see its siblings, so the filter lambda could not capture
  ;; FAILED if both were bindings of the same let.
  (let ((failed nil))
    (let ((filter
           (lambda (tree _backend _info)
             ;; 1. Rewrite resolvable id: links to docs/SLUG.html[#ANCHOR].
             ;;    Unresolvable ones (manual examples, external corpora) are
             ;;    recorded in FAILED for the build report.  The #ANCHOR half
             ;;    resolves thanks to ORG-HTML-PREFER-USER-LABELS being bound
             ;;    in --export-html, which makes ox-html emit each <<target>>
             ;;    with its literal name as the id (see org-html--reference).
             (org-element-map tree 'link
               (lambda (l)
                 (when (equal (org-element-property :type l) "id")
                   (let ((r (org-docs-website--resolve
                             (org-element-property :path l) id->file)))
                     (if (not r)
                         (push (list slug (org-element-property :path l)) failed)
                       (org-element-put-property l :type "file")
                       (org-element-put-property
                        l :path
                        (concat "docs/"
                                (org-docs-website--slug (car r))
                                ".html"
                                (when-let ((a (cdr r)))
                                  (concat "#" (url-hexify-string a))))))))))
             tree)))
      ;; Export FIRST, then read FAILED: the filter pushes onto it during
      ;; the org-export-as call, so HTML and the (nreverse failed) below
      ;; must not be swapped.
      (let ((html
             ;; NOTE: this bundled Org (9.7.11) takes
             ;; (backend subtreep visible-only body-only ext-plist); the
             ;; filter plist goes in EXT-PLIST, no HOW arg.
             (cl-letf (((symbol-function 'org-macro-replace-all)
                        (lambda (&rest _) nil))
                       ((symbol-function 'org-id-find)
                        (lambda (&rest _) nil)))
               (org-export-as 'html nil nil t
                              (list :filter-parse-tree filter)))))
        (list html (nreverse failed))))))

(defun org-docs-website--export-html (file out-dir id->file)
  "Body-only ox-html export of FILE into OUT-DIR, with id: links rewritten.
Returns the list of (SRC-SLUG ID-PATH) id: links that did NOT resolve in
this corpus (for the build report).  Resolved links became FILE-type
links \"docs/SLUG.html[#ANCHOR]\" in the parse-tree filter; that is the
shape the theme's NotePreview click-interceptor recognizes.  Links
written inside src/example blocks are not link objects in the parse
tree, so the manual's example citations are never touched."
  (let ((org-export-with-broken-links t) ; unresolved id: -> desc as plain text
        ;; Strip footnote elements before export so ox-html never resolves
        ;; the manual's verbatim [fn:N] examples (see --export-body).
        (org-export-with-footnotes nil)
        ;; Static doc site: never run/expand Babel.  The manual has call_<name>
        ;; examples that raise "Unknown Babel reference" when expanded.
        (org-export-use-babel nil)
        ;; org-export-as leaves the (temp) source buffer read-only; every
        ;; edit below (erase, insert, replace-match) needs this.
        (inhibit-read-only t)
        (org-html-head "")
        (org-html-head-extra "")
        (org-html-postamble nil)
        (org-html-table-default-attributes nil)
        ;; Emit each <<target>> with its LITERAL name as the id.  Default
        ;; ox-html behavior is a generated hash (orgd587c72...), which would
        ;; dangle every #NodeName / #index-... href our filter rewrote; see
        ;; org-html--reference (it uses the target's :value when this is on).
        (org-html-prefer-user-labels t)
        (slug (org-docs-website--slug file)))
    (with-temp-buffer
      (setq buffer-file-name file) ; so #+SETUPFILE / relative refs resolve
      (insert-file-contents file)
      (org-mode)
      (pcase-let ((`(,body ,failed) (org-docs-website--export-body id->file slug)))
        (erase-buffer)
        (insert body)
        (make-directory out-dir t)
        (write-region (point-min) (point-max)
                      (expand-file-name (concat slug ".html") out-dir)
                      nil 'quiet)
        failed))))

(defun org-docs-website-parse-args (args)
  "Parse CLI ARGS (--corpus DIR --doc NAME --out DIR)."
  (let (corpus doc out)
    (while args
      (pcase (pop args)
        ("--corpus" (setq corpus (pop args)))
        ("--doc" (setq doc (pop args)))
        ("--out" (setq out (pop args)))
        (_ nil)))
    (list :corpus (or corpus "~/docs")
          :doc (or doc "org")
          :out (or out ".export"))))

(defun org-docs-website-export-main ()
  "Batch entry: read --args after `--', export the corpus."
  (let* ((args (org-docs-website-parse-args
                (cdr (member "--" command-line-args))))
         (doc-dir (expand-file-name (plist-get args :doc)
                                    (file-truename (plist-get args :corpus))))
         (out (file-truename (plist-get args :out)))
         (docs-out (expand-file-name "docs/" out)))
    (message "org-docs-website: corpus %s -> %s" doc-dir out)
    (pcase-let ((`(,id->file ,slugs) (org-docs-website--scan-corpus doc-dir)))
      (message "org-docs-website: %d files, %d ids"
               (length slugs) (hash-table-count id->file))
      ;; slug -> node id, so an edge's target slug can be turned back into
      ;; the id the theme keys nodes by.
      (let ((slug->id (make-hash-table :test #'equal))
            (nodes nil) (links nil) (failures 0) (broken-exports nil))
        (dolist (entry slugs)
          (puthash (car entry) (cadr entry) slug->id))
        (dolist (entry slugs)
          (pcase-let ((`(,slug ,id ,title ,tags) entry))
            (let ((file (expand-file-name (concat slug ".org") doc-dir)))
              ;; NODES: tags get the corpus name first so the theme groups
              ;; by doc ("org", "guix", ...) and colors deterministically.
              (push (list :id id :slug slug :title title
                          :tags (cons (plist-get args :doc) tags))
                    nodes)
              (dolist (l (org-docs-website--collect-links file id->file))
                (pcase-let ((`(,dst _anchor ,ctx) l))
                  ;; Edge identity is the FILE-level citation (id -> id);
                  ;; the anchor only lives on the rewritten in-body href,
                  ;; which is how the reader lands on the section anyway.
                  (when-let ((tid (gethash dst slug->id)))
                    (push (list :source id :target tid :context ctx)
                          links))))
              ;; One pathological file must not kill a 415-file build:
              ;; catch, record, continue (fragment simply absent).
              (condition-case e
                  (cl-incf failures
                           (length (org-docs-website--export-html
                                    file docs-out id->file)))
                (error (push (cons slug (error-message-string e))
                             broken-exports))))))
        (make-directory out t)
        (let ((nodes* (nreverse nodes))
              (links* (nreverse links)))
          ;; Vectors, NOT lists: json-encode treats a list-of-plists as an
          ;; ALIST (one object with repeated keys), which is never what a
          ;; nodes/links array means.  A vector always encodes as JSON array.
          (with-temp-file (expand-file-name "graph.json" out)
            (insert (json-encode `(:nodes ,(vconcat nodes*)
                                    :links ,(vconcat links*)))))
          (message "org-docs-website: %d nodes, %d edges, %d unresolved links"
                   (length nodes*) (length links*) failures))
        (when broken-exports
          (message "org-docs-website: %d FILES FAILED TO EXPORT:"
                   (length broken-exports))
          (dolist (b (nreverse broken-exports))
            (message "  %s: %s" (car b) (cdr b))))))))

(provide 'org-docs-website-export)
;;; org-docs-website-export.el ends here
