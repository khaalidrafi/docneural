;;; docneural-export.el --- Export a documentation corpus for the docneural-ui theme  -*- lexical-binding: t; -*-

;; Copyright 2026 Khalid Rafi
;; Part of docneural. Batch script; not an installed package.
;;
;; Powered by the org-docs package (~/org-docs): it owns the Org corpus
;; and the id: link engine this script must stay identical to
;; (`org-docs-reader--resolve-id-link'). If you change id: resolution,
;; reading order or the Top chainback here, change it there too.

;;; Commentary:

;; Turns doc directories of Org node files (e.g. ~/docs/org, the Org
;; manual split per Info node) into the static artifacts the docneural-ui theme
;; reads:
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
;;   emacs --batch -l scripts/docneural-export.el \
;;         -f docneural-export-main -- \
;;         --corpus ~/docs --doc org --doc emacs --doc guix --out .export
;;
;; One --doc per manual; all of them land in ONE graph.json and ONE docs/
;; directory, so the theme sees a single corpus whose first tag names the
;; manual.  Slugs are namespace-prefixed with the manual ("emacs--Intro")
;; because the manuals reuse basenames (each has an "Introduction").
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

(defun docneural--slug (file)
  "Node slug for node FILE: \"MANUAL--basename\".
MANUAL is the corpus subdirectory the file lives in (`directory-files'
always hands us absolute paths, and export-main expands every file under
CORPUS/DOC).  The prefix matters twice: the manuals reuse basenames (each
has an \"Introduction\", so bare slugs would overwrite each other's HTML
fragments), and it makes a URL say which manual it belongs to."
  (let ((doc (file-name-nondirectory
              (directory-file-name (file-name-directory file)))))
    (concat doc "--" (file-name-sans-extension (file-name-nondirectory file)))))

(defun docneural--scan-corpus (doc-dir)
  "Return (ID->FILE ENTRIES) for every .org in DOC-DIR.
ID->FILE maps each file's :ID: drawer line to its path; ENTRIES are
\(FILE SLUG ID TITLE TAGS) with FILE the absolute path, the rest read
from :ID:, #+title and #+filetags (if present).  The FILE rides along
because export-main cannot rebuild it from SLUG, which is now prefixed
with the manual directory name."
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
          (push (list file
                      (docneural--slug file)
                      (or id (docneural--slug file))
                      (or title (docneural--slug file))
                      tags)
                slugs))))
    (list id->file (nreverse slugs))))

(defun docneural--resolve (path id->file)
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

(defun docneural--nav-id (path id->file)
  "If the file part of id: PATH names a corpus node, return its id; else nil.
Nodes are keyed by their :ID:, which is exactly the base (before `::') of
every internal id: link, so a resolvable base IS the target node id.  The
Org manual's synthetic top node (`Up: [[id:org]]') is not a file, so nav
links to it resolve to nil -- which is how a chapter knows it is top-level."
  (let ((sep (string-match "::" path)))
    (let ((base (if sep (substring path 0 sep) path)))
      (when (gethash base id->file) base))))

(defun docneural--node-nav (file id->file)
  "Info structure of node FILE as (:next NID :prev NID :up NID :redirect R
:skip REGIONS).  NID are resolved node ids (nil when the target is not a
corpus file).  REDIRECT is (SLUG . ANCHOR) for an Info \"indirectly
referenced\" stub: a heading-less file whose entire body is the line \"The node
you are looking for is at [[id:...]]\".  Such a file has no content of its
own, so the reader follows REDIRECT to the canonical chapter instead of
showing a stub page.  The 20 real chapter files of the Org manual carry the
nav line; the other 391 carry a redirect.

SKIP is a list of (BEG . END) buffer regions — the nav paragraph and the stub
pointer line — that --collect-links must treat as STRUCTURE, not citations.
It is computed HERE, from the same parse that produced :next/:prev/:up, so
there is one definition of \"the nav header\" instead of a regex approximation
in two places.  The region matters most for the wrapped nav shape (the Guix
Cookbook puts the keyword on one line and the link on the next): a line-prefix
filter cannot see that the link belongs to a keyword it never shares a line
with, and every wrapped `Previous:' / `Up:' line then entered the wire set as
a phantom citation.

Each keyword is matched INDEPENDENTLY inside the nav line, because
texinfo drops a relation when it is inferable: the Emacs and Guix
corpora carry `Next:' + `Up:' on most nodes and a bare `Previous:' line
on a few, so the old single `Next...Previous...Up' pattern matched only
94 of 876 nodes and fragmented both manuals into a hundred chain heads.
The Org manual always carried all three, which is why it looked fine."
  (with-temp-buffer
    (insert-file-contents file)
    (goto-char (point-min))
    ;; A real page has at least one heading.  A heading-less file is a leaf
    ;; stub (an Info "indirectly referenced" node) whether or not its
    ;; pointer resolves -- `stub' is what keeps 34 unresolvable stubs out
    ;; of the reader's chapter tree.  `head' is just a truthy match
    ;; position, so a plain search then re-goto-char is cleaner than
    ;; save-excursion (which would restore match data we don't need here).
    (let* ((head (re-search-forward "^\\*+ " nil t))
           (next nil) (prev nil) (up nil) (redirect nil)
           (skip nil))
      ;; The nav HEADER is the paragraph (up to the next blank line) opening
      ;; with a keyword.  Paragraph, not line: the Guix Cookbook wraps one
      ;; long node's nav line across several lines ("Next:" alone on its
      ;; line, the link on the next), and matching a single line would drop
      ;; that node's whole chain.  Nor does position matter: three corpus
      ;; Top files (Guix, Guix Cookbook, Guile) place the nav line AFTER
      ;; the settitle heading, and an earlier "must precede the first
      ;; heading" guard discarded all three -- costing Guix its
      ;; Top->Introduction entry edge and leaving the chainback below
      ;; unable to fire.  So take the first keyword-opening paragraph,
      ;; wherever it sits: a real page names its neighbours once.
      (goto-char (point-min))
      ;; EVERY keyword-opening paragraph is structure, not just the first:
      ;; a wrapped nav header can put "Next:" and "Previous:" in separate
      ;; paragraphs (blank line between), and only the first one would
      ;; otherwise be recorded as a skip region.
      (let ((first-nav nil))
        (while (re-search-forward "^\\(Next\\|Previous\\|Up\\):" nil t)
          (let ((beg (line-beginning-position))
                (end (save-excursion
                       (forward-paragraph 1)
                       (point))))
            (push (cons beg end) skip)
            (unless first-nav (setq first-nav (cons beg end)))))
        ;; Navigation FIELDS still come from the first keyword-opening
        ;; paragraph: a real page names its neighbours once.
        (when first-nav
          (let ((beg (car first-nav))
                (end (cdr first-nav)))
            ;; Each target is a `[[id:PATH][desc]]' link: capture up to the
            ;; first `]' of the id and let --nav-id resolve the base (it
            ;; strips a `::anchor' suffix).  --nav-id calls `string-match'
            ;; internally, which clobbers the global match data, so the
            ;; capture is bound before the call.
            ;; The keyword and the link may sit on DIFFERENT lines: the Guix
            ;; Cookbook wraps "Next:" onto one line with the link on the next.
            ;; A literal space in an Emacs regexp matches only a space, so the
            ;; old `kw: [[id:' form silently dropped those nodes' whole chain
            ;; (measured: no next/prev/up at all).  `[ \t\n]*' spans the wrap.
            (cl-flet ((nav (kw)
                        (save-excursion
                          (goto-char beg)
                          (when (re-search-forward
                                 (concat kw ":[ \t\n]*\\[\\[id:\\([^]]+\\)") end t)
                            (let ((path (match-string-no-properties 1)))
                              (docneural--nav-id path id->file))))))
              (setq next (nav "Next")
                    prev (nav "Previous")
                    up   (nav "Up"))))))
      ;; Stub pointer line: read the capture before --resolve clobbers
      ;; match data, and follow it only when it resolves.
      (when (and (not head)
                 (progn (goto-char (point-min))
                        (re-search-forward
                         "^The node you are looking for is at \\[\\[id:\\([^]]+\\)"
                         nil t)))
        (let ((path (match-string-no-properties 1)))
          (pcase-let ((`(,dst . ,anchor) (docneural--resolve path id->file)))
            (when dst
              (setq redirect (cons (docneural--slug dst) anchor)))
          ;; Same treatment as the nav paragraph: the pointer line is a
          ;; redirect, not a citation.
          (push (cons (line-beginning-position) (line-end-position)) skip))))
      (list :head head :next next :prev prev :up up :redirect redirect
            :skip skip))))

(defun docneural--collect-links (file id->file skip)
  "Real id: links in FILE as a list of (TARGET-SLUG ANCHOR CONTEXT-LINE).
Only links whose target resolves in this corpus count.  CONTEXT is the
trimmed source line containing the link, capped so graph.json stays small
enough to fetch on a potato.

SKIP is the (BEG . END) region list from --node-nav: the Info nav header
paragraph (Next/Previous/Up) and a stub file's single pointer line.  Those
links are the doc tree and the redirect, emitted as node fields instead, so
any link whose begin falls inside a skip region is dropped here.  This keeps
the `links' set a pure set of semantic cross-references: the synapses canvas
then shows how chapters actually refer to one another rather than a chain of
mechanical edges (and 391 stub singletons with degree zero).  The REGION
(not a line-shape regex) is the test, because a wrapped nav header puts the
keyword on one line and the link on the next -- a regex on the link's own
line cannot see which keyword it belongs to."
  (with-temp-buffer
    (insert-file-contents file)
    (org-mode)
    (let ((tree (org-element-parse-buffer))
          (out nil))
      (org-element-map tree 'link
        (lambda (link)
          (when (equal (org-element-property :type link) "id")
            (let* ((path (org-element-property :path link))
                   (resolved (docneural--resolve path id->file))
                   (begin (org-element-property :begin link)))
              (when (and resolved
                         (not (cl-some (lambda (r)
                                         (and (>= begin (car r))
                                              (<= begin (cdr r))))
                                       skip)))
                (let ((ctx (progn
                             (save-excursion
                               (goto-char (org-element-property :begin link))
                               (string-trim
                                (buffer-substring-no-properties
                                 (line-beginning-position) (line-end-position)))))))
                  (push (list (docneural--slug (car resolved))
                              (cdr resolved)
                              (if (> (length ctx) 160)
                                  (substring ctx 0 160)
                                ctx))
                        out)))))))
      (nreverse out))))

(defun docneural--export-body (id->file slug)
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
                   (let ((r (docneural--resolve
                             (org-element-property :path l) id->file)))
                     (if (not r)
                         (push (list slug (org-element-property :path l)) failed)
                       (org-element-put-property l :type "file")
                       (org-element-put-property
                        l :path
                        (concat "docs/"
                                (docneural--slug (car r))
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

(defun docneural--export-html (file out-dir id->file)
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
        (slug (docneural--slug file)))
    (with-temp-buffer
      (setq buffer-file-name file) ; so #+SETUPFILE / relative refs resolve
      (insert-file-contents file)
      (org-mode)
      (pcase-let ((`(,body ,failed) (docneural--export-body id->file slug)))
        (erase-buffer)
        (insert body)
        (make-directory out-dir t)
        (write-region (point-min) (point-max)
                      (expand-file-name (concat slug ".html") out-dir)
                      nil 'quiet)
        failed))))

(defun docneural--reading-order (nodes)
  "Content NODES in reading order: walk each chapter-head's Info `next'
chain, then any side chains.  Same algorithm as DocneuralStore.chapters on
the JS side (heads = chapters no other chapter links `next` into; a chain
stops at a stub, since a stub is not a page) -- the two must agree or
llms-full.txt and the reader would present different orders of the same
corpus, which is exactly the kind of drift an agent cannot see."
  (let ((by-id (make-hash-table :test #'equal))
        (in-set (make-hash-table :test #'equal))
        (content nil))
    (dolist (n nodes)
      (puthash (plist-get n :id) n by-id)
      (unless (plist-get n :stub)
        (puthash (plist-get n :id) t in-set)
        (push n content)))
    (setq content (nreverse content))
    (let ((targeted (make-hash-table :test #'equal))
          (seen (make-hash-table :test #'equal))
          (order nil))
      (dolist (n content)
        (when-let ((nx (plist-get n :next))) (puthash nx t targeted)))
      (cl-labels
          ((walk (start)
             (let ((cur start))
               ;; `cur' is nil once the chain leaves the content set.
               (while (and cur (not (gethash (plist-get cur :id) seen)))
                 (puthash (plist-get cur :id) t seen)
                 (push cur order)
                 (setq cur (when (and (plist-get cur :next)
                                      (gethash (plist-get cur :next) in-set))
                             (gethash (plist-get cur :next) by-id)))))))
        ;; Heads first (a chapter no `next' points into), then leftovers
        ;; (side chains whose head was itself stub-targeted).  Heads are
        ;; walked in ID order, NOT corpus scan order: ids are
        ;; `<manual>--<file>', so a manual's Top node (id `emacs', file
        ;; Top.org) sorts before every chapter of its manual while the
        ;; file scan would land it mid-list.  DocneuralStore.chapters sorts
        ;; identically -- keep the two in lockstep or llms-full.txt and
        ;; the reader diverge.
        (let ((heads nil))
          (dolist (n content)
            (unless (gethash (plist-get n :id) targeted) (push n heads)))
          (dolist (h (sort heads
                           (lambda (a b)
                             (string< (plist-get a :id) (plist-get b :id)))))
            (walk h)))
        (dolist (n content) (unless (gethash (plist-get n :id) seen) (walk n))))
      (nreverse order))))

(defun docneural--write-llms (out slug->file nodes)
  "Write the LLM-facing entry points into OUT: llms.txt + llms-full.txt.
This site serves humans AND agents -- the same corpus, in the shapes each
reads best.  SLUG->FILE maps a node slug to its source .org; NODES is the
final nodes list (all manuals interleaved as scanned).  Stubs are filtered
out of both files, because an Info stub is a pointer, not knowledge -- its
canonical chapter is already in the list.

Nodes are grouped by their first tag (the manual, stamped by export-main)
and each manual is laid out in its own reading order -- an agent skimming
llms.txt should see three manuals, not one merged mush.

llms.txt follows the llmstxt.org convention (# title, > blurb, ## sections
of links) and points at the RAW Org files rather than the HTML fragments:
Org is plain text, denser than HTML for an agent's context window, and
lossless (a human can read or load it in Emacs as-is).

llms-full.txt inlines the whole corpus in ONE fetch (~10 MB for three
manuals) -- an agent that wants everything takes one request instead of
hundreds, and the ordering here is the reading order, which is meaning."
  (let ((by-manual nil)) ; alist (MANUAL . NODES-reversed), first-seen order
    (dolist (n nodes)
      (let ((m (car (plist-get n :tags))))
        (unless (assoc m by-manual) (push (cons m nil) by-manual))
        (push n (cdr (assoc m by-manual)))))
    (let ((manuals (nreverse by-manual)))
      (with-temp-file (expand-file-name "llms.txt" out)
        (let ((names (mapconcat #'capitalize (mapcar #'car manuals) ", ")))
          (insert
           (format "# docneural — %s manuals, wired as synapses\n\n" names)
           (format "> The %s reference manuals, split per Info node, exported\n" names)
           "> by batch Emacs, and wired into an org-roam style citation graph.\n"
           "> Every page is also raw Org, readable as-is by humans and LLM\n"
           "> agents alike.\n\n"
           "## Docs (reading order, by manual)\n\n"))
        (dolist (pair manuals)
          (insert (format "\n### %s\n\n" (capitalize (car pair))))
          (dolist (n (docneural--reading-order (cdr pair)))
            (insert (format "- [%s](docs/%s.org)\n"
                            (plist-get n :title) (plist-get n :slug)))))
        (insert "\n## Optional\n\n"
                "- [Citation graph](graph.json): all docs + resolved id: links\n"
                "- [Full corpus](llms-full.txt): every doc, one file, plain Org\n"))
      (with-temp-file (expand-file-name "llms-full.txt" out)
        ;; Org COMMENT lines as separators: the result stays a valid (if odd)
        ;; Org file, so an agent that feeds it BACK to an Org-aware tool still
        ;; parses it -- never markdown residue inside a doc boundary.
        (dolist (pair manuals)
          (dolist (n (docneural--reading-order (cdr pair)))
            (insert (format "# ==== %s — %s ====\n"
                            (plist-get n :slug) (plist-get n :title)))
            (insert-file-contents (gethash (plist-get n :slug) slug->file))
            (insert "\n")))))))

(defun docneural-parse-args (args)
  "Parse CLI ARGS (--corpus DIR --doc NAME... --out DIR).
--doc is repeatable; one manual per occurrence, all merged into one site."
  (let (corpus docs out)
    (while args
      (pcase (pop args)
        ("--corpus" (setq corpus (pop args)))
        ("--doc" (push (pop args) docs))
        ("--out" (setq out (pop args)))
        (_ nil)))
    (list :corpus (or corpus "~/docs")
          :doc (nreverse docs) ; nil -> export-main falls back to (\"org\")
          :out (or out ".export"))))

(defun docneural-export-main ()
  "Batch entry: read --args after `--', export every --doc manual as one site."
  (let* ((args (docneural-parse-args
                (cdr (member "--" command-line-args))))
         (corpus (file-truename (plist-get args :corpus)))
         (manuals (or (plist-get args :doc) (list "org")))
         (out (file-truename (plist-get args :out)))
         (docs-out (expand-file-name "docs/" out))
         ;; ONE merged ID table across every included manual, built before any
         ;; export: an id: link resolves whenever its target exists in ANY
         ;; corpus, so intra-manual citations work as before and cross-manual
         ;; citations become real edges the day the manuals cite each other.
         (id->file (make-hash-table :test #'equal))
         ;; Every node file, flattened: (FILE SLUG ID TITLE TAGS MANUAL).
         (entries nil))
    (dolist (manual manuals)
      (let ((doc-dir (expand-file-name manual corpus)))
        (pcase-let ((`(,m-ids ,slugs) (docneural--scan-corpus doc-dir)))
          (message "docneural: %s: %d files" manual (length slugs))
          (maphash (lambda (k v) (puthash k v id->file)) m-ids)
          (dolist (e slugs) (push (append e (list manual)) entries)))))
    (message "docneural: corpus %s -> %s (%d ids)"
             corpus out (hash-table-count id->file))
    (setq entries (nreverse entries))
    ;; slug -> node id / source file: an edge's target slug turns back into
    ;; the id the theme keys nodes by; llms-full.txt finds the raw Org.
    (let ((slug->id (make-hash-table :test #'equal))
          (slug->file (make-hash-table :test #'equal))
          (nodes nil) (links nil) (failures 0) (broken-exports nil))
      (dolist (entry entries)
        (puthash (nth 1 entry) (nth 2 entry) slug->id)
        (puthash (nth 1 entry) (nth 0 entry) slug->file))
      (dolist (entry entries)
        (pcase-let ((`(,file ,slug ,id ,title ,tags ,manual) entry))
          ;; NODES: the manual name goes FIRST in tags so the theme groups
          ;; and colors by corpus ("org", "emacs", "guix", ...).  The Info
          ;; nav (up/next/prev) and stub redirect ride along as optional
          ;; keys so the theme can build a chapter tree, breadcrumbs and a
          ;; prev/next pager without parsing Org.
          (let* ((nav (docneural--node-nav file id->file))
                 (node (list :id id :slug slug :title title
                             :tags (cons manual tags))))
            ;; A heading-less file is a leaf stub: mark it so the reader
            ;; keeps it out of the chapter tree even when its pointer did
            ;; not resolve to a page in this corpus.
            (unless (plist-get nav :head)
              (setq node (plist-put node :stub t)))
            (dolist (k '(:next :prev :up))
              (when-let ((v (plist-get nav k)))
                (setq node (plist-put node k v))))
            (when-let ((r (plist-get nav :redirect)))
              (setq node
                    (plist-put node :redirect
                               (list :slug (car r) :anchor (cdr r)))))
            (push node nodes)
            ;; LINKS: the nav/pointer regions come from the SAME nav parse
            ;; that produced the node fields -- one definition of what is
            ;; structure, so a wrapped header's links can never leak into
            ;; the citation wire set.
            (dolist (l (docneural--collect-links
                        file id->file (plist-get nav :skip)))
              (pcase-let ((`(,dst _anchor ,ctx) l))
                ;; Edge identity is the FILE-level citation (id -> id);
                ;; the anchor only lives on the rewritten in-body href,
                ;; which is how the reader lands on the section anyway.
                (when-let ((tid (gethash dst slug->id)))
                  (push (list :source id :target tid :context ctx)
                        links)))))
          ;; One pathological file must not kill a 1500-file build:
          ;; catch, record, continue (fragment simply absent).
          (condition-case e
              (cl-incf failures
                       (length (docneural--export-html
                                file docs-out id->file)))
            (error (push (cons slug (error-message-string e))
                         broken-exports)))
          ;; The RAW source too, next to the fragment: docs/SLUG.org is
          ;; what llms.txt links and what an agent (or a human hitting
          ;; "source") reads at full fidelity.  A plain copy -- Org is
          ;; already the lossless artifact; the HTML is the derived one.
          (copy-file file (expand-file-name (concat slug ".org") docs-out) t)))
      (make-directory out t)
      (let ((nodes* (nreverse nodes))
            (links* (nreverse links)))
        ;; AN INFO TOP NODE carries a menu, not a nav line, so its `next'
        ;; is nil and the reading walk would enter the manual wherever the
        ;; first bare fragment starts.  Chain back instead: when exactly
        ;; one chapter names such a node as its `prev', that chapter IS
        ;; Info's first node (Emacs: Top -> Distrib; Guix: Top ->
        ;; Introduction).  Wire TOP -> FIRST into the data itself, so the
        ;; reader's pager, the chapter tree and llms-full.txt all follow
        ;; one real entry edge rather than each re-deriving it.
        (dolist (n nodes*)
          (when (and (not (plist-get n :stub))
                     (not (plist-get n :next))
                     (not (plist-get n :prev))
                     (not (plist-get n :up)))
            (let ((pointers
                   (delq nil
                         (mapcar (lambda (m)
                                   (when (equal (plist-get m :prev)
                                                (plist-get n :id))
                                     m))
                                 nodes*))))
              (when (= 1 (length pointers))
                (setf (plist-get n :next)
                      (plist-get (car pointers) :id))))))
        ;; Vectors, NOT lists: json-encode treats a list-of-plists as an
        ;; ALIST (one object with repeated keys), which is never what a
        ;; nodes/links array means.  A vector always encodes as JSON array.
        (with-temp-file (expand-file-name "graph.json" out)
          (insert (json-encode `(:nodes ,(vconcat nodes*)
                                  :links ,(vconcat links*)))))
        (message "docneural: %d nodes, %d edges, %d unresolved links"
                 (length nodes*) (length links*) failures)
        (docneural--write-llms out slug->file nodes*))
      (when broken-exports
        (message "docneural: %d FILES FAILED TO EXPORT:"
                 (length broken-exports))
        (dolist (b (nreverse broken-exports))
          (message "  %s: %s" (car b) (cdr b)))))))

(provide 'docneural-export)
;;; docneural-export.el ends here
