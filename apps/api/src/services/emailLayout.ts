/**
 * Shared layout primitives for transactional emails.
 *
 * Every Breeze transactional email goes through `renderLayout` so the brand,
 * type, color, and structural defaults stay consistent. New templates should
 * never inline their own HTML shell.
 *
 * Cloud Guardian frame, from the Cloud Guardian design system (dark only):
 * the `bg` ground, a `panel` card with a `line-soft` border, the CG shield
 * (42 x 56) beside the CLOUD / GUARDIAN wordmark, mono kickers, glowing-tab
 * buttons and a footer with the slogan. Built only from tables, bgcolor
 * attributes and inline styles so Outlook desktop renders it the same as Gmail;
 * rgba tokens are flattened onto `panel` because Outlook ignores alpha.
 */

// Design-system tokens (tokens.json); the flattened ones name their source.
const BRAND_BG = '#060B18'; // bg
const BRAND_NAVY = '#003084'; // navy
const BRAND_BLUE = '#4DA3FF'; // blue
const BRAND_ICE = '#9FDFFF'; // ice
// The button colour: one place to change it. Defaults to the brand blue;
// EMAIL_BUTTON_COLOR (and EMAIL_BUTTON_TEXT) in the API env override it.
const ACCENT_COLOR = process.env.EMAIL_BUTTON_COLOR || '#4DA3FF'; // blue
const ACCENT_TEXT = process.env.EMAIL_BUTTON_TEXT || '#060B18'; // bg: 7.5:1 with blue (tokens.json)
const HEADING_COLOR = '#F4F6F7'; // ink
const BODY_COLOR = '#E8ECEF'; // ink-2
const SOFT_COLOR = '#B4BDC5'; // ink-4
const MUTED_COLOR = '#8F99A3'; // mute
const FAINT_COLOR = '#8A949E'; // mute-2
const PAGE_BG = '#060B18'; // bg
const CARD_BG = '#0B1426'; // panel
const RULE_COLOR = '#1C2537'; // line-soft flattened on panel
const LINE_COLOR = '#1A2232'; // line-soft flattened on bg
const REPLY_BG = '#0F1D33'; // accent-surface flattened on panel

// The accent line on the card and the colour of bold text: one place each.
const ACCENT_LINE = process.env.EMAIL_ACCENT_COLOR || '#4DA3FF'; // blue
const STRONG_COLOR = process.env.EMAIL_STRONG_COLOR || '#9FDFFF'; // ice
const SUPPORT_EMAIL = process.env.EMAIL_SUPPORT_ADDRESS || 'support@cloud-guardian.com';

/** The frame's text and surface colours for templates that write their own
 * inline styles (email.ts, billingEmail.ts, ticketNotifyWorker.ts, ...). Every
 * colour inside the card comes from here, so no template can put dark text on
 * the dark panel or light text on a light box. */
export const EMAIL_PALETTE = {
  /** Headings, emphasised values. */
  heading: HEADING_COLOR,
  /** Body copy. */
  body: BODY_COLOR,
  /** Secondary copy: quoted text, table values, terms. */
  soft: SOFT_COLOR,
  /** Labels and small print. */
  muted: MUTED_COLOR,
  /** Links inside the card. */
  link: BRAND_ICE,
  /** <strong> text. */
  strong: STRONG_COLOR,
  /** Hairlines between rows and around boxes. */
  rule: RULE_COLOR,
  /** The inset surface for quoted text, notes and terms (flattened on panel). */
  surface: REPLY_BG,
  /** The left edge of an inset block. */
  edge: BRAND_BLUE,
} as const;

/** Inline style of a body paragraph and of a muted (small-print) paragraph. */
export const BODY_PARA_STYLE = `margin: 0 0 12px; font-size: 15px; line-height: 1.55; color: ${BODY_COLOR};`;
export const MUTED_PARA_STYLE = `margin: 12px 0 0; font-size: 13px; line-height: 1.55; color: ${MUTED_COLOR};`;

const LOGO_URL = process.env.EMAIL_BRAND_LOGO_URL || 'https://cloud-guardian.com/assets/brand/cg-logo.png';
const BRAND_SITE = 'cloud-guardian.com';
const BRAND_PHONE = '(732) 743-5472';
const BRAND_SLOGAN = 'Shielding your digital footprint';

// Single quotes only: these strings go inside style="..." attributes, where a
// double quote ends the attribute and drops every declaration after it.
const FONT_STACK = "Geist, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO_STACK = "'JetBrains Mono', Consolas, 'Courier New', monospace";

/** Where the full reply text goes (ticketNotifyWorker.appendFullReplyBody):
 * inside the card, under the body and above the footer. */
export const REPLY_SLOT = '<!--cg-reply-slot-->';

export interface RenderLayoutOptions {
  title: string;
  preheader: string;
  heading?: string;
  body: string;
  footer?: string;
  /** Faint brand line under the card. Defaults to the platform brand; partner-
   * facing emails (quotes/invoices) pass the MSP's name so the customer sees
   * their provider, not Breeze. */
  brandName?: string;
}

export function renderLayout(options: RenderLayoutOptions): string {
  const { title, preheader, heading, body, footer, brandName } = options;
  const brand = brandName ?? 'Cloud Guardian';
  const headingBlock = heading
    ? `<tr>
              <td style="padding: 28px 32px 4px; font-family: ${FONT_STACK};">
                <h1 style="margin: 0; font-size: 22px; line-height: 1.3; color: ${HEADING_COLOR}; font-weight: 500; letter-spacing: -0.01em; font-family: ${FONT_STACK};">${escapeHtml(heading)}</h1>
              </td>
            </tr>`
    : '';
  const bodyTopPad = heading ? '10px' : '28px';
  const footerBlock = footer
    ? `<tr>
              <td style="padding: 0 32px 24px; font-family: ${FONT_STACK};">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: ${MUTED_COLOR};">${escapeHtml(footer)}</p>
              </td>
            </tr>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Chakra+Petch:wght@600&display=swap" rel="stylesheet" />
    <style>
      /* Partner template HTML arrives with every attribute stripped
         (richTextSanitize), so its tables and links are styled here. */
      .cg-body table { border-collapse: collapse; margin: 4px 0 16px; }
      .cg-body table td { padding: 6px 16px 6px 0; border-bottom: 1px solid ${RULE_COLOR}; font-size: 14px; vertical-align: top; }
      .cg-body p { margin: 0 0 12px; }
      .cg-body table td { color: ${SOFT_COLOR}; }
      .cg-body strong { color: ${STRONG_COLOR}; font-weight: 600; }
      .cg-body a { color: ${BRAND_ICE}; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: ${PAGE_BG}; font-family: ${FONT_STACK}; color: ${BODY_COLOR};">
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${PAGE_BG};">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" style="background: ${PAGE_BG}; font-family: ${FONT_STACK};">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
            <tr>
              <td bgcolor="${BRAND_BG}" style="background: ${BRAND_BG}; padding: 8px 4px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right: 14px;"><img src="${escapeHtml(LOGO_URL)}" width="42" height="56" alt="Cloud Guardian" style="display: block; border: 0; width: 42px; height: 56px;" /></td>
                    <td valign="middle" style="font-family: 'Chakra Petch', ${FONT_STACK}; font-size: 17px; font-weight: 600; letter-spacing: 0.16em; line-height: 1;"><span style="color: #F4F6F7;">CLOUD</span>&nbsp;<span style="color: ${BRAND_BLUE};">GUARDIAN</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="${CARD_BG}" style="background: ${CARD_BG}; border: 1px solid ${RULE_COLOR}; border-top: 2px solid ${ACCENT_LINE}; border-radius: 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${headingBlock}
            <tr>
              <td class="cg-body" style="padding: ${bodyTopPad} 32px 24px; font-family: ${FONT_STACK}; color: ${BODY_COLOR}; font-size: 15px; line-height: 1.55;">
                ${inlineLinkColour(body)}
                ${REPLY_SLOT}
              </td>
            </tr>
            ${footerBlock}
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="${BRAND_BG}" style="background: ${BRAND_BG}; padding: 20px 4px 8px; border-bottom: 1px solid ${LINE_COLOR}; font-family: ${FONT_STACK};">
                <p style="margin: 0 0 4px; font-family: ${MONO_STACK}; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #FFC06A;">${escapeHtml(BRAND_SLOGAN)}</p>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: ${MUTED_COLOR};">${escapeHtml(brand)} &middot; <a href="tel:+17327435472" style="color: ${BRAND_ICE}; text-decoration: none;">${BRAND_PHONE}</a> &middot; <a href="https://${BRAND_SITE}" style="color: ${BRAND_ICE}; text-decoration: none;">${BRAND_SITE}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Bare links in the card (partner-template HTML arrives with every attribute
 * stripped; some templates write a plain <a href>) get the link colour inline,
 * so a client that drops the head <style> does not paint its default blue on
 * the dark panel. Links that carry their own style are left alone. */
export function inlineLinkColour(html: string): string {
  return html.replace(/<a\b(?![^>]*\bstyle\s*=)/gi, `<a style="color: ${BRAND_ICE};"`);
}

/** A table button: Outlook's Word renderer ignores padding on <a>, so the fill
 * sits on the cell (bgcolor) and the link carries the label. */
export function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0;"><tr><td bgcolor="${ACCENT_COLOR}" style="padding: 0; background: ${ACCENT_COLOR}; border-radius: 4px; border: 1px solid ${ACCENT_COLOR}; box-shadow: 0 0 12px rgba(77,163,255,0.5);"><a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 22px; color: ${ACCENT_TEXT}; font-family: ${MONO_STACK}; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none;">${escapeHtml(label)} &rsaquo;</a></td></tr></table>`;
}

export function renderParagraph(content: string, options: { muted?: boolean; marginTop?: number } = {}): string {
  const color = options.muted ? MUTED_COLOR : BODY_COLOR;
  const size = options.muted ? '13px' : '15px';
  const marginTop = options.marginTop ?? 0;
  return `<p style="margin: ${marginTop}px 0 12px; font-size: ${size}; line-height: 1.55; color: ${color}; font-family: ${FONT_STACK};">${content}</p>`;
}

// Hairlines in the billing blocks: the frame's line-soft, not a light grey.
const RULE = RULE_COLOR;

/** Locked facts of a billing email ("Amount", "Payment date", "Paid with"): a
 * presentational two-column table that stays legible at 390px. */
export function renderSummaryTable(rows: { label: string; value: string }[]): string {
  if (!rows.length) return '';
  const cells = rows.map((row, index) => {
    const border = `border-top: 1px solid ${RULE};${index === rows.length - 1 ? ` border-bottom: 1px solid ${RULE};` : ''}`;
    return `<tr><td style="${border} width: 40%; padding: 10px 12px 10px 0; vertical-align: top; font-size: 13px; line-height: 1.45; color: ${MUTED_COLOR}; font-family: ${FONT_STACK};">${escapeHtml(row.label)}</td>`
      + `<td style="${border} padding: 10px 0; vertical-align: top; font-size: 15px; line-height: 1.45; font-weight: 600; color: ${HEADING_COLOR}; font-family: ${FONT_STACK};">${escapeHtml(row.value)}</td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 20px; border-collapse: collapse; width: 100%;">${cells}</table>`;
}

/** Secondary actions ("Skip this payment · Stop automatic payments") as real links.
 * The link colour, not the button colour: EMAIL_BUTTON_COLOR may be set to a
 * fill that is not readable as text on the panel. */
export function renderLinkRow(links: { label: string; url: string }[]): string {
  if (!links.length) return '';
  const anchors = links.map(link => `<a href="${escapeHtml(link.url)}" style="color: ${BRAND_ICE}; text-decoration: underline;">${escapeHtml(link.label)}</a>`);
  return `<p style="margin: 16px 0 12px; font-size: 14px; line-height: 1.6; color: ${MUTED_COLOR}; font-family: ${FONT_STACK};">${anchors.join('&nbsp;·&nbsp;')}</p>`;
}

/** A muted, boxed block for terms and legal lines (the authorization copy, notes):
 * the inset surface with a near-white title and soft body text. A table with
 * bgcolor so Outlook desktop paints the box. */
export function renderTermsBlock(title: string, paragraphs: string[]): string {
  const body = paragraphs.map(text => `<p style="margin: 0 0 8px; font-size: 13px; line-height: 1.55; color: ${SOFT_COLOR}; font-family: ${FONT_STACK};">${escapeHtml(text)}</p>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 0; border-collapse: separate;"><tr>`
    + `<td bgcolor="${REPLY_BG}" style="padding: 16px; background: ${REPLY_BG}; border: 1px solid ${RULE_COLOR}; border-radius: 6px; font-family: ${FONT_STACK};">`
    + `<p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: ${HEADING_COLOR}; font-family: ${FONT_STACK};">${escapeHtml(title)}</p>${body}</td></tr></table>`;
}

/** An inset block for quoted or boxed content inside the card (a ticket body,
 * a decline reason, an admin's note, alert details): the inset surface with a
 * blue left edge. `innerHtml` must already be escaped. */
export function renderInsetBlock(innerHtml: string, options: { label?: string; size?: number } = {}): string {
  const label = options.label
    ? `<p style="margin: 0 0 6px; font-size: 12px; line-height: 1.5; color: ${MUTED_COLOR}; font-family: ${FONT_STACK};">${escapeHtml(options.label)}</p>`
    : '';
  const size = options.size ?? 14;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 12px 0 16px;"><tr>`
    + `<td bgcolor="${REPLY_BG}" style="padding: 12px 14px; background: ${REPLY_BG}; border-left: 3px solid ${BRAND_BLUE}; border-bottom: 0; font-family: ${FONT_STACK}; font-size: ${size}px; line-height: 1.55; color: ${SOFT_COLOR};">`
    + `${label}${innerHtml}</td></tr></table>`;
}

/** The standard signature under every emailed reply: who wrote it, then the
 * same Cloud Guardian contact lines for everyone. */
export function renderSignature(authorName?: string | null): string {
  const name = authorName && authorName.trim() ? escapeHtml(authorName.trim()) : 'Cloud Guardian Support';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;"><tr>`
    + `<td valign="top" style="padding: 0 12px 0 0; border-bottom: 0;"><img src="${escapeHtml(LOGO_URL)}" width="24" height="32" alt="" style="display: block; border: 0; width: 24px; height: 32px;" /></td>`
    + `<td valign="top" style="padding: 0 0 0 12px; border-bottom: 0; border-left: 2px solid ${ACCENT_LINE}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 1.5; color: ${MUTED_COLOR};">`
    + `<span style="font-size: 14px; font-weight: 600; color: ${HEADING_COLOR};">${name}</span><br />`
    + `Cloud Guardian Support<br />`
    + `<a href="tel:+17327435472" style="color: ${STRONG_COLOR}; text-decoration: none;">${BRAND_PHONE}</a> &middot; <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: ${STRONG_COLOR}; text-decoration: none;">${escapeHtml(SUPPORT_EMAIL)}</a><br />`
    + `<a href="https://${BRAND_SITE}" style="color: ${STRONG_COLOR}; text-decoration: none;">${BRAND_SITE}</a>`
    + `</td></tr></table>`;
}

/** The full reply block, styled to match the frame. */
export function renderReplyBlock(safeHtml: string, label = 'Our reply', authorName?: string | null): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid ${RULE_COLOR};"><tr><td style="padding: 16px 0 0; border-bottom: 0;">`
    + `<p style="margin: 0 0 8px; font-family: ${MONO_STACK}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${FAINT_COLOR};">// ${escapeHtml(label)}</p>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${REPLY_BG}" style="background: ${REPLY_BG}; border-left: 3px solid ${BRAND_BLUE}; border-bottom: 0; padding: 14px 16px; font-family: ${FONT_STACK}; font-size: 15px; line-height: 1.55; color: ${BODY_COLOR};">${safeHtml}</td></tr></table>`
    + renderSignature(authorName)
    + `</td></tr></table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getSupportEmail(explicit?: string): string | undefined {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  const fromEnv = process.env.EMAIL_SUPPORT_ADDRESS;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();
  return undefined;
}
