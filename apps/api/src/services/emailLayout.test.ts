import { describe, expect, it } from 'vitest';
import { renderButton, renderLayout, renderParagraph } from './emailLayout';

/** Every `style="…"` attribute value in the rendered HTML. */
function styleValues(html: string): string[] {
  return [...html.matchAll(/style="([^"]*)"/g)].map(match => match[1]!);
}

describe('email layout inline styles', () => {
  const html = renderLayout({
    title: 'Subject', preheader: 'Preview', heading: 'Heading', footer: 'Footer', brandName: 'Acme IT',
    body: `${renderParagraph('Body')}${renderButton('Open', 'https://example.test/x')}`,
  });

  // A double quote inside a double-quoted style attribute ends the attribute early:
  // the font stack's quoted family names cut every later declaration (font, colour,
  // size, line height) and the body rendered in the client's default serif (P-11).
  it('never ends a style attribute inside the font stack', () => {
    expect(html).not.toMatch(/style="[^"]*font-family:[^";]*"\s*[A-Za-z]/);
    for (const value of styleValues(html)) {
      if (!value.includes('font-family')) continue;
      // The Cloud Guardian frame's three stacks: body (Geist), mono kickers and
      // buttons (JetBrains Mono), and the Chakra Petch wordmark.
      expect(value).toMatch(/font-family: (?:'Chakra Petch', )?(?:Geist, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif|'JetBrains Mono', Consolas, 'Courier New', monospace)/);
    }
  });

  it('keeps the declarations after the font stack inside the attribute', () => {
    const body = styleValues(html).find(value => value.includes('font-size: 15px; line-height: 1.55'));
    expect(body).toBeDefined();
    expect(body).toContain('font-family:');
    expect(styleValues(html).find(value => value.startsWith('margin: 0; padding: 0; background:'))).toContain('color: #E8ECEF');
  });
});

import { EMAIL_PALETTE, renderInsetBlock, renderLinkRow, renderSummaryTable, renderTermsBlock } from './emailLayout';
describe('billing email blocks', () => {
  it('a summary table is a presentational two-column table with escaped values', () => {
    const html = renderSummaryTable([{ label: 'Amount', value: '$50.00' }, { label: 'Method', value: '<Visa> & co' }]);
    expect(html).toMatch(/^<table role="presentation"/);
    expect(html).toContain('>Amount</td>');
    expect(html).toContain('&lt;Visa&gt; &amp; co');
    expect(styleValues(html).every(value => !value.includes('"'))).toBe(true);
    expect(renderSummaryTable([])).toBe('');
  });
  it('a link row joins real links with a separator and escapes the URLs', () => {
    const html = renderLinkRow([{ label: 'Skip this payment', url: 'https://x.test/a?b=1&c=2' }, { label: 'Stop', url: 'https://x.test/s' }]);
    expect(html).toContain('href="https://x.test/a?b=1&amp;c=2"');
    expect(html).toContain('&nbsp;·&nbsp;');
    expect(renderLinkRow([])).toBe('');
  });
  it('a terms block titles its muted paragraphs', () => {
    const html = renderTermsBlock('Your authorization', ['You accepted these terms on October 5, 2026.', 'I authorize <MSP>.']);
    expect(html).toContain('Your authorization');
    expect(html).toContain('I authorize &lt;MSP&gt;.');
  });
  it('the layout carries a head style so partner paragraphs get the rhythm', () => {
    expect(renderLayout({ title: 't', preheader: 'p', body: '<p>x</p>' })).toMatch(/<style>[^<]*p\s*\{[^}]*margin/);
  });
});

/** Relative luminance (WCAG 2.x) of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('Cloud Guardian frame readability', () => {
  const PANEL = '#0B1426';
  const blocks = [
    renderSummaryTable([{ label: 'Amount', value: '$50.00' }]),
    renderLinkRow([{ label: 'Skip this payment', url: 'https://x.test/a' }]),
    renderTermsBlock('Your authorization', ['You accepted these terms on October 5, 2026.']),
    renderInsetBlock('Quoted text', { label: 'Note from admin@example.test' }),
  ];

  it('the stock light-theme colours are gone from every block', () => {
    for (const html of blocks) {
      expect(html).not.toMatch(/#(?:1f2937|374151|111111|0f172a|6b7280|155e75|f8fafc|f7fafc|f9fafb|ffffff|e5e7eb|d1d5db)/i);
    }
  });

  it('every text colour in the palette reads on the panel and on the inset surface (>= 4.5:1)', () => {
    for (const key of ['heading', 'body', 'soft', 'muted', 'link', 'strong'] as const) {
      expect(contrast(EMAIL_PALETTE[key], PANEL)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(EMAIL_PALETTE[key], EMAIL_PALETTE.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the terms block puts its near-white title on the dark inset surface, not a light box', () => {
    const html = renderTermsBlock('Your authorization', ['I authorize <MSP>.']);
    expect(html).toContain(`bgcolor="${EMAIL_PALETTE.surface}"`);
    expect(html).toContain(`color: ${EMAIL_PALETTE.heading}`);
    expect(html).toContain(`color: ${EMAIL_PALETTE.soft}`);
  });

  it('an inset block escapes its label and keeps its text on the surface', () => {
    const html = renderInsetBlock('x', { label: 'Note from <a@b>' });
    expect(html).toContain('Note from &lt;a@b&gt;');
    expect(html).toContain(`bgcolor="${EMAIL_PALETTE.surface}"`);
    expect(styleValues(html).every(value => !value.includes('"'))).toBe(true);
  });
});
