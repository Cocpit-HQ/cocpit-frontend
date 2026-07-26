import DOMPurify from 'dompurify';
/**
 * Sanitizes stored article HTML before rendering it with dangerouslySetInnerHTML.
 * Mirrors the backend's articleContentSanitizer allowlist so an article looks the
 * same wherever it's read, and strips inline style/id even from content saved
 * before write-time sanitization existed.
 */
// DOMPurify's default URI allowlist doesn't include blob: — extend it so the transient object
// URLs the editor uses before upload substitution (mirrors the backend allowlist) aren't stripped.
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

export const sanitizeArticleHtmlForDisplay = (html: string) => {
  if (typeof window === 'undefined' || !html) return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'line', 'circle', 'rect', 'g'],
    ADD_ATTR: [
      'viewBox', 'viewbox', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'd', 'fill', 'stroke', 'contenteditable', 'title', 'target', 'controls',
      'xmlns', 'width', 'height', 'class', 'type'
    ],
    FORBID_ATTR: ['style', 'id'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP,
  });
};
