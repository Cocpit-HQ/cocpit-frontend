/**
 * Robustly sanitizes HTML content into plain text while preserving line breaks.
 * This implementation uses the DOM to extract text, which is more reliable than regex for nested tags.
 */
export const sanitizeContent = (html: string): string => {
  if (!html) return "";

  // Use document to create a temporary div for parsing
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, ""); // Fallback for SSR

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Get text with line breaks preserved using innerText (which respects visibility and breaks)
  // or textContent as a fallback.
  let text = temp.innerText || temp.textContent || "";

  return text
    .replace(/\u00A0/g, " ") // Convert &nbsp; to normal space
    .replace(/hashtag(#\w+)/gi, "$1") // Clean "hashtag#tag" artifact from some rich text sources
    .replace(/\s+\n/g, "\n") // Clean trailing spaces before newlines
    .trim();
};
