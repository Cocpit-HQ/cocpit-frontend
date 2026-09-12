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

const cleanEditorArtifacts = (html: string): string => {
  if (typeof window === 'undefined' || !html) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Remove editor tools and link preview capsules by class
    doc.querySelectorAll('.link-preview-capsule, .img-tools, .edit-link-btn, .delete-link-btn, .edit-img-btn, .delete-img-btn').forEach(el => el.remove());

    // 2. Unwrap span[contenteditable="false"] wrapping an <a> tag and drop internal editor artifacts
    doc.querySelectorAll('span[contenteditable="false"]').forEach(wrapper => {
      const a = wrapper.querySelector('a');
      if (a) {
        wrapper.replaceWith(a);
      }
    });

    // 3. Remove leaked link preview spans right next to or inside the same parent as an <a> tag
    // (This handles posts stored where the backend stripped the .link-preview-capsule class)
    doc.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href')?.trim() || '';

      // Check immediate sibling
      let next = a.nextSibling;
      while (next && next.nodeType === Node.TEXT_NODE && !next.textContent?.trim()) {
        next = next.nextSibling;
      }
      if (next && next.nodeType === Node.ELEMENT_NODE && (next as Element).tagName === 'SPAN') {
        const nextEl = next as HTMLElement;
        const text = nextEl.textContent?.trim() || '';
        if (
          (href && text === href) ||
          (href && text.includes(href)) ||
          text.startsWith('http://') ||
          text.startsWith('https://') ||
          nextEl.querySelector('.edit-link-btn, .delete-link-btn')
        ) {
          nextEl.remove();
        }
      }

      // Check any sibling spans inside the same parent span
      const parent = a.parentElement;
      if (parent && parent.tagName === 'SPAN') {
        parent.querySelectorAll('span').forEach(childSpan => {
          if (!childSpan.contains(a)) {
            const childText = childSpan.textContent?.trim() || '';
            if (
              (href && childText === href) ||
              (href && childText.includes(href)) ||
              childText.startsWith('http://') ||
              childText.startsWith('https://')
            ) {
              childSpan.remove();
            }
          }
        });
      }
    });

    return doc.body.innerHTML;
  } catch (e) {
    return html;
  }
};

export const sanitizeArticleHtmlForDisplay = (html: string) => {
  if (typeof window === 'undefined' || !html) return html;
  const preCleaned = cleanEditorArtifacts(html);
  return DOMPurify.sanitize(preCleaned, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'line', 'circle', 'rect', 'g'],
    ADD_ATTR: [
      'viewBox', 'viewbox', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'd', 'fill', 'stroke', 'contenteditable', 'title', 'target', 'controls',
      'xmlns', 'width', 'height', 'class', 'type',
      'data-natural-w', 'data-natural-h'
    ],
    FORBID_ATTR: ['style', 'id'],
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP,
  });
};
