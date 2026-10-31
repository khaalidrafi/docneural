# Cross-manual xref mining verdict

The miner recovered **3 honest cross-manual references** from the checked-in
corpus. Each proposed wire preserves the exact source line (trimmed only to
the 160-character output limit), source file, target node, and a `1.0`
confidence for an unambiguous normalized title match. Ambiguous or unmatched
references are not emitted.

Title matching is useful for this damaged export, but it has a meaningful
false-positive risk: prose can contain `(manual) words` that happen to equal
a node title, and normalization intentionally treats underscores, hyphens,
and spaces as equivalent. The result should therefore be treated as a
reviewable recovery list, not authoritative link semantics. A production import should require confidence `>= 1.0` and retain the context
for manual review; weaker fuzzy matches should not be auto-wired.

Three recoverable wires is near zero relative to the 30,915 deployed wires,
so this result does **not** justify a distinct `xref` wire kind or dedicated
UI styling yet. The recommended next step is an exporter-side fix list for
preserving makeinfo cross-manual Info references; a UI treatment can be
reconsidered after that fix yields a materially larger, authoritative set.
