// Utility functions for rich text editor selection state evaluation and formatting operations.
// Pure functions accepting editorEl or ranges, completely independent of React component state/closures.

export const ALIGNMENT_CLASSES = ['text-left', 'text-center', 'text-right', 'text-justify'] as const;
export type Alignment = typeof ALIGNMENT_CLASSES[number];

export interface ToolbarFormattingState {
  heading: 'NORMAL' | 'H1' | 'H2' | null; // null = mixed/indeterminate
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isBulletList: boolean;
  alignment: Alignment | null; // null = mixed/indeterminate
}

export const DEFAULT_TOOLBAR_STATE: ToolbarFormattingState = {
  heading: 'NORMAL',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isBulletList: false,
  alignment: 'text-left',
};

export const BLOCK_SELECTOR = 'p, h1, h2, h3, li, blockquote, div:not([contenteditable="false"])';

/**
 * Collect all block-level elements intersecting the current selection range.
 * Filters out elements inside non-editable containers and eliminates ancestor
 * containers if their child block is also in the selection.
 */
export function getSelectedBlocks(range: Range, editorEl: HTMLElement): HTMLElement[] {
  const candidates = Array.from(editorEl.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));

  const selected = candidates.filter(block => {
    if (block.closest('[contenteditable="false"]')) return false;
    try {
      return range.intersectsNode(block);
    } catch {
      return false;
    }
  });

  // Filter out outer container elements if an inner candidate block is already selected
  const leafSelected = selected.filter(
    block => !selected.some(other => other !== block && block.contains(other))
  );

  // Fallback: if intersectsNode returned nothing (e.g., collapsed cursor at empty node),
  // walk up to find the closest enclosing block within editorEl
  if (leafSelected.length === 0) {
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const closest = (node as HTMLElement | null)?.closest?.(BLOCK_SELECTOR);
    if (closest && editorEl.contains(closest) && !closest.closest('[contenteditable="false"]')) {
      return [closest as HTMLElement];
    }
  }

  return leafSelected;
}

export type InlineFormat = 'bold' | 'italic' | 'underline' | 'strike';

const FORMAT_TAGS: Record<InlineFormat, string[]> = {
  bold: ['B', 'STRONG'],
  italic: ['I', 'EM'],
  underline: ['U', 'INS'],
  strike: ['S', 'STRIKE', 'DEL'],
};

const FORMAT_COMPUTED: Record<InlineFormat, (style: CSSStyleDeclaration) => boolean> = {
  bold: (s) => {
    const weight = parseInt(s.fontWeight, 10);
    return (!isNaN(weight) && weight >= 600) || s.fontWeight === 'bold' || s.fontWeight === 'bolder';
  },
  italic: (s) => s.fontStyle === 'italic',
  underline: (s) => (s.textDecorationLine || s.textDecoration || '').includes('underline'),
  strike: (s) => (s.textDecorationLine || s.textDecoration || '').includes('line-through'),
};

/**
 * Walk from `node` up to `editorEl`, checking for ancestor formatting tags.
 * Falls back to getComputedStyle only if no ancestor tag is found.
 */
export function isNodeFormatted(
  node: Node,
  format: InlineFormat,
  editorEl: HTMLElement
): boolean {
  let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

  // PRIMARY: Ancestor tag walk (fastest and most reliable)
  while (current && current !== editorEl) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      if (FORMAT_TAGS[format].includes((current as Element).tagName.toUpperCase())) {
        return true;
      }
    }
    current = current.parentElement;
  }

  // FALLBACK: getComputedStyle (handles CSS-driven formatting)
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  if (el instanceof HTMLElement) {
    try {
      return FORMAT_COMPUTED[format](window.getComputedStyle(el));
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Inspect inline formatting for the current selection range.
 * Applies strict word-processor rule:
 * - If range is collapsed, checks formatting at caret.
 * - If range is non-collapsed, EVERY intersecting non-whitespace text node must have the format.
 */
export function getInlineFormattingState(
  range: Range,
  editorEl: HTMLElement
): Pick<ToolbarFormattingState, 'isBold' | 'isItalic' | 'isUnderline' | 'isStrike'> {
  // Collapsed caret — check immediate insertion point context
  if (range.collapsed) {
    const node = range.startContainer;
    return {
      isBold: isNodeFormatted(node, 'bold', editorEl),
      isItalic: isNodeFormatted(node, 'italic', editorEl),
      isUnderline: isNodeFormatted(node, 'underline', editorEl),
      isStrike: isNodeFormatted(node, 'strike', editorEl),
    };
  }

  // If selection is within a single text node
  if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    const node = range.startContainer;
    const slice = node.textContent?.slice(range.startOffset, range.endOffset) ?? '';
    if (slice.trim().length === 0) {
      return { isBold: false, isItalic: false, isUnderline: false, isStrike: false };
    }
    return {
      isBold: isNodeFormatted(node, 'bold', editorEl),
      isItalic: isNodeFormatted(node, 'italic', editorEl),
      isUnderline: isNodeFormatted(node, 'underline', editorEl),
      isStrike: isNodeFormatted(node, 'strike', editorEl),
    };
  }

  // Range selection spanning multiple nodes — walk all text nodes
  const rootContainer = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement || editorEl
    : range.commonAncestorContainer;

  const walker = document.createTreeWalker(
    rootContainer,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Text | null;
  let hasNonWhitespace = false;
  const results = { isBold: true, isItalic: true, isUnderline: true, isStrike: true };

  while ((node = walker.nextNode() as Text | null)) {
    // Filter to only text nodes actually intersecting the range
    try {
      if (!range.intersectsNode(node)) continue;
    } catch {
      continue;
    }

    // Determine the exact slice of this text node inside the range
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : (node.textContent?.length ?? 0);
    const slice = node.textContent?.slice(start, end) ?? '';

    // Skip pure whitespace — whitespace at boundaries must not disqualify formatting
    if (slice.trim().length === 0) continue;

    hasNonWhitespace = true;

    // Strict rule: any non-formatted node disqualifies the whole selection
    if (!isNodeFormatted(node, 'bold', editorEl)) results.isBold = false;
    if (!isNodeFormatted(node, 'italic', editorEl)) results.isItalic = false;
    if (!isNodeFormatted(node, 'underline', editorEl)) results.isUnderline = false;
    if (!isNodeFormatted(node, 'strike', editorEl)) results.isStrike = false;

    // Short-circuit: if all are false, no need to continue
    if (!results.isBold && !results.isItalic && !results.isUnderline && !results.isStrike) {
      break;
    }
  }

  // If no non-whitespace text was found in range, nothing is active
  if (!hasNonWhitespace) {
    return { isBold: false, isItalic: false, isUnderline: false, isStrike: false };
  }

  return results;
}

/**
 * Determine block-level formatting state (heading, bullet list, alignment) from selected blocks.
 */
export function getBlockFormattingState(
  blocks: HTMLElement[]
): Pick<ToolbarFormattingState, 'heading' | 'isBulletList' | 'alignment'> {
  if (blocks.length === 0) {
    return { heading: 'NORMAL', isBulletList: false, alignment: 'text-left' };
  }

  // --- Heading ---
  const headingTags = blocks.map(b => {
    const tag = b.tagName.toUpperCase();
    if (tag === 'H1') return 'H1';
    if (tag === 'H2') return 'H2';
    return 'NORMAL'; // P, LI, BLOCKQUOTE, DIV all map to NORMAL
  });
  const uniqueHeadings = new Set(headingTags);
  const heading = uniqueHeadings.size === 1
    ? (headingTags[0] as 'NORMAL' | 'H1' | 'H2')
    : null; // mixed

  // --- Bullet List ---
  // A block qualifies as a list item only if it is an <li> whose direct parent is a <ul>
  const isBulletList = blocks.every(b => {
    const li = b.tagName === 'LI' ? b : b.closest('li');
    return li !== null && li.parentElement?.tagName.toUpperCase() === 'UL';
  });

  // --- Alignment ---
  const getBlockAlign = (block: HTMLElement): Alignment => {
    for (const cls of ALIGNMENT_CLASSES) {
      if (block.classList.contains(cls)) return cls;
    }
    // If block is an LI, check if parent UL has alignment class
    if (block.tagName === 'LI' && block.parentElement) {
      for (const cls of ALIGNMENT_CLASSES) {
        if (block.parentElement.classList.contains(cls)) return cls;
      }
    }
    return 'text-left'; // default
  };
  const alignments = blocks.map(getBlockAlign);
  const uniqueAlignments = new Set(alignments);
  const alignment = uniqueAlignments.size === 1 ? alignments[0] : null; // null = mixed

  return { heading, isBulletList, alignment };
}

/**
 * Master entry function: Evaluates current selection inside editorEl and computes complete ToolbarFormattingState.
 */
export function getSelectionToolbarState(editorEl: HTMLElement): ToolbarFormattingState {
  if (typeof window === 'undefined') return DEFAULT_TOOLBAR_STATE;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return DEFAULT_TOOLBAR_STATE;

  const range = sel.getRangeAt(0);

  // Verify selection is inside editor
  const ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;
  if (!ancestor || !editorEl.contains(ancestor)) {
    return DEFAULT_TOOLBAR_STATE;
  }

  const blocks = getSelectedBlocks(range, editorEl);
  const blockState = getBlockFormattingState(blocks);
  const inlineState = getInlineFormattingState(range, editorEl);

  return { ...blockState, ...inlineState };
}

/**
 * Apply alignment to all selected blocks with toggle behavior.
 */
export function applyAlignmentToBlocks(
  align: Alignment,
  editorEl: HTMLElement,
  currentAlignment: Alignment | null
): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  let blocks = getSelectedBlocks(range, editorEl);

  // If no blocks found, fallback to closest block enclosing the selection
  if (blocks.length === 0) {
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = (node as HTMLElement | null)?.closest?.(BLOCK_SELECTOR);
    if (block && editorEl.contains(block) && !block.closest('[contenteditable="false"]')) {
      blocks = [block as HTMLElement];
    }
  }

  if (blocks.length === 0) return;

  // Toggle: clicking the active alignment reverts all blocks to default (text-left)
  const isToggleOff = blocks.length > 0 && blocks.every(
    b => b.classList.contains(align)
  );
  const targetAlign = isToggleOff ? 'text-left' : align;

  blocks.forEach(block => {
    ALIGNMENT_CLASSES.forEach(cls => block.classList.remove(cls));
    if (targetAlign !== 'text-left') {
      block.classList.add(targetAlign);
    }
  });
}

/**
 * Apply block style (Normal, H1, H2) with selection restoration and DOM fallback.
 */
export function applyBlockStyle(
  tag: 'NORMAL' | 'H1' | 'H2',
  savedRange: Range,
  editorEl: HTMLElement
): void {
  // 1. Ensure editor has active browser focus
  editorEl.focus();

  const sel = window.getSelection();
  if (!sel) return;

  // 2. Restore selection before DOM manipulation
  try {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  } catch {
    // If savedRange is detached or invalid, select inside editorEl
    const fallback = document.createRange();
    fallback.selectNodeContents(editorEl);
    fallback.collapse(false);
    sel.removeAllRanges();
    sel.addRange(fallback);
  }

  const targetTag = tag === 'NORMAL' ? 'P' : tag;
  const htmlTag = tag === 'NORMAL' ? '<p>' : `<${tag.toLowerCase()}>`;

  // Capture blocks before execCommand mutates the DOM
  const activeRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : savedRange;
  const blocksBefore = getSelectedBlocks(activeRange, editorEl);

  // 3. PRIMARY: execCommand (preserves browser undo/redo history)
  try {
    document.execCommand('formatBlock', false, htmlTag);
  } catch {
    // Fall through to fallback
  }

  // 4. VERIFY: Inspect current blocks after execCommand
  const currentSel = window.getSelection();
  const currentRange = currentSel && currentSel.rangeCount > 0 ? currentSel.getRangeAt(0) : null;
  const blocksAfter = currentRange ? getSelectedBlocks(currentRange, editorEl) : [];

  const succeeded = blocksAfter.length > 0 && blocksAfter.every(b => b.tagName.toUpperCase() === targetTag);

  // 5. FALLBACK: Direct DOM replacement if execCommand silently failed
  if (!succeeded) {
    const blocksToReplace = blocksBefore.length > 0 ? blocksBefore : getSelectedBlocks(savedRange, editorEl);
    const replacedElements: HTMLElement[] = [];

    blocksToReplace.forEach(block => {
      if (block.tagName.toUpperCase() !== targetTag) {
        const newEl = document.createElement(tag === 'NORMAL' ? 'p' : tag.toLowerCase());
        newEl.innerHTML = block.innerHTML;
        // Preserve alignment classes
        ALIGNMENT_CLASSES.forEach(cls => {
          if (block.classList.contains(cls)) newEl.classList.add(cls);
        });
        block.replaceWith(newEl);
        replacedElements.push(newEl);
      } else {
        replacedElements.push(block);
      }
    });

    // CRITICAL: Re-establish a clean selection on the newly created element!
    // This prevents Chromium's FrameSelection from pointing to detached nodes,
    // which is the root cause of the editor becoming unclickable!
    if (replacedElements.length > 0) {
      const firstEl = replacedElements[0];
      const newRange = document.createRange();
      newRange.selectNodeContents(firstEl);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  // 6. Ensure editor retains focus
  editorEl.focus();
}
