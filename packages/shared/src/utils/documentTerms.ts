/**
 * Reading helpers for the long-form legal text on customer documents (a quote's
 * Terms & Conditions and its contract blocks), shared so the portal and the
 * staff Preview summarise an agreement identically.
 *
 * Line-based section detection for free-text Terms & Conditions. No markdown
 * dependency: a line that starts with a number ("1.", "2.1", "3)") or an
 * ALL-CAPS label ("CONFIDENTIALITY:") is a heading; everything else is body.
 * A numbered line that is a whole clause ("1. Services. We provide the work
 * described in this quote.") is body too: only labels become headings.
 */
const HEADING_RE = /^\s*(\d+(\.\d+)*[.)]?|[A-Z][A-Z &/-]{3,}:?)(\s|$)/;
/** A numbered line longer than this is a sentence, not a heading. */
const MAX_HEADING_CHARS = 100;
/** A line ending like a sentence with more words than this is a clause, not a
 *  heading. Without it, short clauses in numbered terms became headings while
 *  their longer siblings stayed body, so the contents list (4+ sections)
 *  repeated an arbitrary subset of the clauses above the full text. */
const MAX_SENTENCE_HEADING_WORDS = 6;
const SENTENCE_END_RE = /[.!?]["')\]]?$/;

function isHeading(line: string): boolean {
  if (line.length > MAX_HEADING_CHARS || !HEADING_RE.test(line)) return false;
  return !(SENTENCE_END_RE.test(line) && line.split(/\s+/).length > MAX_SENTENCE_HEADING_WORDS);
}

export type TermsBlock =
  | { kind: 'heading'; text: string; id: string }
  | { kind: 'para'; text: string };

export function parseTermsSections(text: string): { blocks: TermsBlock[]; sectionCount: number } {
  const blocks: TermsBlock[] = [];
  let sectionCount = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeading(line)) {
      sectionCount += 1;
      blocks.push({ kind: 'heading', text: line, id: `terms-section-${sectionCount}` });
    } else {
      blocks.push({ kind: 'para', text: line });
    }
  }
  return { blocks, sectionCount };
}

/** Reading time at 200 wpm, never below one minute. */
export function textReadMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Reading time of sanitized rich-text HTML (a rendered contract template).
 *  Tags become spaces so `</p><p>` never glues two words into one.
 *
 *  The tag body excludes '<' as well as '>' (not just `[^>]*`): allowing '<'
 *  inside an unterminated tag lets the engine restart the same scan from
 *  every position in a run of stray '<' characters, which is O(n^2) on
 *  adversarial input (CodeQL js/polynomial-redos). Excluding '<' makes a
 *  failed match at the first '<' fail immediately instead of backtracking. */
export function htmlReadMinutes(html: string): number {
  return textReadMinutes(html.replace(/<[^<>]*>/g, ' '));
}
