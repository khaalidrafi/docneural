// flatten-context.mjs — turn one Org context snippet into readable prose.
//
// The exporter stores the sentence around each citation link (`context`) as
// raw Org, so it can contain link markup, verbatim delimiters and the ¶ it
// uses as a line separator. SynapseRail renders that text directly, which
// means any residue reads as broken data to a human and as garbage tokens to
// an LLM. Split out of slim-graph.mjs so tests/slim-graph.test.mjs can pin the
// rules without running a build.
//
// The awkward case is truncation: the exporter cuts the window around the
// link, so a snippet can start or end INSIDE a link. A complete link collapses
// to its description; a tail cut keeps the description if the cut left one
// (`[[id:x::#y][Comment Lines` -> "Comment Lines") and otherwise drops the
// fragment; a head cut drops the leftovers up to the closing ]].

export function flatten(text) {
  if (!text) return text
  return text
    .replace(/\[\[([^\]]*)\]\[([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<<([^>]*)>>/g, '$1')
    .replace(/<<[^>]*$/g, '')
    .replace(/\[\[[^\]]*\]\[([^\]]*)\]?$/g, '$1')
    .replace(/\[\[[\s\S]*$/g, '')
    // Head cut: the leftovers of a link that started before the window, up to
    // its closing ]]. Bounded, because a complete link at the start was
    // already collapsed above, so a leading `]]` can only be a corpse.
    .replace(/^[\s\S]{0,80}?\]\]/, '')
    // Org verbatim (=code=, ~code~) and the exporter's own line separator.
    .replace(/[=~]([^=~\n]{1,60})[=~]/g, '$1')
    .replace(/¶/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
