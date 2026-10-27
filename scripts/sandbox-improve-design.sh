#!/bin/sh
# sandbox-improve-design.sh — kimi-k3 IMPROVEMENT PASS on the real docneural design.
#
# Owner order 2026-10-27 07:07Z (#docneural-site): "K3 is known good designer,
# visiting us to improve. It's not to be hired! We'll just use it to fix our
# design and improve it. Use 75 more credits from CodeBuddy. Don't WASTE by
# 'judging'!!"
#
# => NO bench, NO judge calls, NO scoring. Input = the REAL design system
#    (docneural-ui/styles/docneural-ui.css, 971 lines) + the LOOK manifesto +
#    a strict fix-and-improve contract. Output = the improved SAME file,
#    verified mechanically (zero-cost), landed by the agent afterwards.
#
# SPEND LAW: Owner budget = 75 CodeBuddy credits for this work. ONE kimi-k3
# generation this dispatch, no retries, no other models, ds-v4.1-flash
# HARD-EXCLUDED. Token: /home/z/.secrets (0600) via CODEBUDDY_AUTH_TOKEN
# (Bearer — validated live 2x; ApiKey mode 401s this token class).
set -eu
MODEL='kimi-k3'
SRC=/home/z/my-project/docneural-ui/styles/docneural-ui.css
OUT=/home/z/my-project/burn/codebuddy-improve-$(date +%H%M%S)

[ -s /home/z/.secrets ] || { echo "FATAL: no token at /home/z/.secrets"; exit 1; }
[ -s "$SRC" ] || { echo "FATAL: theme CSS missing at $SRC"; exit 1; }
mkdir -p "$OUT" && cd "$OUT"
cp "$SRC" original.css

echo "[1/3] assembling improvement brief (real design system + contract)..."
{
  cat <<'EOF'
You are a senior design engineer. This is the LIVE design system of docneural — a documentation-graph site (dark HUD aesthetic: ink-blue black, neon cyan/magenta/electric yellow, monospace chrome in uppercase wide tracking, sharp corners with one notched edge, corner brackets, faint circuit grid + scanlines; long-form Org-exported prose stays QUIET and readable — the neon belongs to the instrument panel, not the text). The site hosts 3 manual sources (GNU Emacs, GNU Guix, Org — 1,386 nodes, 30,915 citation wires); each source owns one neon hue (--dn-src custom property) that MUST stay wired to the graph canvas palette.

YOUR TASK: FIX and IMPROVE this design system. Keep the identity — sharpen it. Specifically:
- Audit the tokens: complete missing ramps (spacing, radii, shadows-as-brackets), tighten the palette hierarchy.
- Elevate the HUD vocabulary: notched edges, corner brackets, chip/badge craft, glitch accents — more precise, more confident, still disciplined.
- Improve chrome hierarchy: nav, footer, status rows, section headers — clearer rhythm, better uppercase tracking discipline.
- Refine .dn-org prose: keep it quiet and readable, improve measure, heading rhythm, table and src-block craft, TODO badge clarity.
- Fix any real defects you find (duplicate rules, dead values, inconsistent var() usage, specificity accidents).
- Light theme: bring it to full parity, not an afterthought.

HARD CONSTRAINTS (violating ANY fails the task):
1. Do NOT rename or remove ANY existing selector or custom property — downstream Svelte components and the graph canvas depend on the exact names. You may ADD selectors, ADD properties, refine values.
2. Do NOT touch the @font-face blocks or font URLs. No @import. No url() to anything remote. ZERO external requests.
3. Keep long-form prose quiet: no glow on body text, AA contrast (>= 4.5:1) for all reading text in BOTH themes.
4. Keep the same file structure and section order (0. Fonts / 1. Tokens / 2. Base / 2b. HUD vocabulary / 3. .dn-org ...), extending where needed.
5. This is ONE file: the COMPLETE improved docneural-ui.css.

DELIVERABLE (strict): save the complete improved stylesheet as docneural-ui.css in the current working directory. Do not ask questions. Do not explain. Write the file and stop.

FINAL CHECK (mandatory, before you finish): the file ./docneural-ui.css — exactly this name, in the CURRENT directory — must contain the complete improved stylesheet, starting with its header comment and ending with the last rule. If you wrote it anywhere else or partially, complete it to ./docneural-ui.css now. Ending without it means the task FAILED.

================ THE CURRENT DESIGN SYSTEM (docneural-ui.css, verbatim) ================
EOF
  cat original.css
} > prompt.md
echo "      css: $(wc -c < original.css) bytes; prompt: $(wc -c < prompt.md) bytes; out=$OUT"

echo "[2/3] burning ONE $MODEL improvement generation (budget 75 credits, no retries)..."
T0=$(date +%s)
CODEBUDDY_AUTH_TOKEN="$(cat /home/z/.secrets)" codebuddy -p "$(cat prompt.md)" \
  --permission-mode bypassPermissions --model "$MODEL" > cli.log 2>&1 || true
GEN_S=$(( $(date +%s) - T0 ))
echo "      generation window: ${GEN_S}s"
echo "      cli.log: $(wc -c < cli.log) bytes; tail:"
tail -3 cli.log | sed 's/^/        /'

echo "[3/3] mechanical verification (zero-cost; NO judge calls per Owner order)..."
FAIL=""
[ -s docneural-ui.css ] || FAIL="no output file"
BR_O=$(tr -cd '{' < docneural-ui.css 2>/dev/null | wc -c); BR_C=$(tr -cd '}' < docneural-ui.css 2>/dev/null | wc -c)
[ "$BR_O" = "$BR_C" ] || FAIL="$FAIL unbalanced-braces($BR_O/$BR_C)"
grep -qi "https\?://" docneural-ui.css && FAIL="$FAIL external-url"
for sel in ":root" ".dn-org" "--dn-graph-palette" "@font-face" ".dn-body"; do
  grep -qF "$sel" docneural-ui.css || FAIL="$FAIL missing:$sel"
done
ORIG_SEL=$(grep -cE "^\.[a-z-]+|^:root|^@" original.css); NEW_SEL=$(grep -cE "^\.[a-z-]+|^:root|^@" docneural-ui.css)
[ "$NEW_SEL" -ge "$ORIG_SEL" ] || FAIL="$FAIL selector-regression($NEW_SEL<$ORIG_SEL)"
if [ -n "$FAIL" ]; then
  echo "VERIFY FAIL:$FAIL — output kept at $OUT/docneural-ui.css, NOT landed"
  exit 1
fi
{
  echo '{'
  echo "  \"model\": \"$MODEL\","
  echo "  \"kind\": \"design-improvement-pass (real docneural-ui.css), NO judging per Owner order\","
  echo "  \"endpoint\": \"intl (www.codebuddy.ai) via sandbox body\","
  echo "  \"generationSeconds\": $GEN_S,"
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"budget\": \"75 CodeBuddy credits (Owner order 07:07Z); this dispatch = ONE generation\","
  echo "  \"origBytes\": $(wc -c < original.css),"
  echo "  \"newBytes\": $(wc -c < docneural-ui.css),"
  echo "  \"workdir\": \"$OUT\""
  echo '}'
} > GEN.json
echo "IMPROVED CSS READY: $OUT/docneural-ui.css ($(wc -c < docneural-ui.css) bytes)"
