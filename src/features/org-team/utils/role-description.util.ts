export const MAX_ROLE_DESCRIPTION_CHARS = 200;
export const MAX_ROLE_DESCRIPTION_WORDS = 200; // Deprecated alias

/**
 * Counts words in a string (kept for backward compatibility).
 */
export function countWords(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Handles pasting in description textarea, matching the Comment component's availableSpace clamp logic.
 * Truncates pasted text so that the total character count never exceeds maxLen.
 */
export function handleDescriptionPaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  currentValue: string,
  setValue: (val: string) => void,
  maxLen: number = MAX_ROLE_DESCRIPTION_CHARS
) {
  const pastedText = e.clipboardData?.getData('text/plain');
  if (!pastedText) return;

  const target = e.currentTarget;
  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? currentValue.length;

  e.preventDefault();

  const textBefore = currentValue.substring(0, start);
  const textAfter = currentValue.substring(end);

  const availableSpace = maxLen - (textBefore.length + textAfter.length);
  let insertedText = pastedText;
  if (availableSpace <= 0) {
    insertedText = '';
  } else if (insertedText.length > availableSpace) {
    insertedText = insertedText.substring(0, availableSpace);
  }

  const newValue = textBefore + insertedText + textAfter;
  setValue(newValue);

  target.style.height = 'auto';
  target.style.height = `${Math.min(target.scrollHeight, 140)}px`;

  setTimeout(() => {
    const newPos = start + insertedText.length;
    target.setSelectionRange(newPos, newPos);
  }, 0);
}
