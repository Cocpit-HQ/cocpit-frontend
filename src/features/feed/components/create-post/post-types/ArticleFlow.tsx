import React, { useState, useRef, useEffect } from 'react';
import {
  X, ArrowLeft, ChevronLeft, ChevronDown, Loader2, Sparkles, Send
} from 'lucide-react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  ImageIcon,
  LinkIcon,
  EditIcon,
  DeleteIcon,
} from '@/components/icons';
import { Icon } from '@iconify/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { MediaItem } from '../types';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';
import { sanitizeArticleHtmlForDisplay } from '@/lib/sanitizeArticleHtml';
import ArticleCoverEditor from './ArticleCoverEditor';
import { DiscardConfirmOverlay } from '../shared/DiscardConfirmOverlay';
import { constrainImageToBox } from '@/features/feed/utils/constrainArticleImage';

// Allowed structure for pasted content: matches what the toolbar itself can produce
// (bold/italic/headings/lists/links). style/class/id are stripped so pasted text always
// inherits the editor's own formatting instead of the source's (fixes ID-227: white/colored
// text pasted from dark-mode sources like ChatGPT becoming invisible on our light editor).
const ALLOWED_PASTE_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'];
const ALLOWED_PASTE_ATTR = ['href', 'class'];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('class')) {
    const allowed = ['text-left', 'text-center', 'text-right', 'text-justify'];
    const classes = (node.getAttribute('class') || '').split(' ').filter(c => allowed.includes(c));
    if (classes.length) {
      node.setAttribute('class', classes.join(' '));
    } else {
      node.removeAttribute('class');
    }
  }
});

const sanitizePastedHtml = (dirtyHtml: string) =>
  DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: ALLOWED_PASTE_TAGS,
    ALLOWED_ATTR: ALLOWED_PASTE_ATTR,
    FORBID_ATTR: ['style', 'id'],
    // img/video are only ever inserted by our own toolbar (blob: URLs + control markup) -
    // a pasted <img>/<video> from an external source is never wanted here.
    FORBID_TAGS: ['img', 'video', 'iframe', 'style', 'script', 'object', 'embed', 'div'],
    ALLOW_DATA_ATTR: false,
  });

import {
  ALIGNMENT_CLASSES,
  Alignment,
  ToolbarFormattingState,
  DEFAULT_TOOLBAR_STATE,
  getSelectionToolbarState,
  applyAlignmentToBlocks,
  applyBlockStyle,
} from './articleSelectionUtils';

const createUniqueNamedFile = (file: File, uniqueId: string): File => {
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()}` : (file.type.startsWith('video/') ? '.mp4' : '.jpg');
  return new File([file], `${uniqueId}${ext}`, { type: file.type || (file.type.startsWith('video/') ? 'video/mp4' : 'image/jpeg') });
};

type ArticleIdentity = {
  name?: string | null;
  username?: string | null;
  image?: string | null;
  org_slug?: string | null;
  company_name?: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
  logo?: string | null;
  company_logo?: string | null;
} | null | undefined;

interface ArticleFlowProps {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (html: string) => void;
  coverImage: MediaItem | null;
  /** Called with the resolved URL after the modal saves, or null when removed */
  onCoverChange: (url: string | null) => void;
  onRemoveCover: () => void;
  isEdit: boolean;
  caption: string;
  onCaptionChange: (value: string) => void;
  onPost: (inlineFiles?: File[], currentContent?: string) => Promise<void>;
  isSubmitting: boolean;
  onClose: (inlineFiles?: File[], currentContent?: string) => Promise<void> | void;
  currentUser: ArticleIdentity;
  currentPoster: ArticleIdentity;
  isCompanyPost: boolean;
  onPreviewStepChange?: (isPreview: boolean) => void;
  onArticleComplete?: (data: { coverImage: MediaItem | null; title: string; subtitle: string; content: string }) => void;
  skipNextStep?: boolean;
  inlineFiles?: { id: string; file: File }[];
  setInlineFiles?: React.Dispatch<React.SetStateAction<{ id: string; file: File }[]>>;
}

const ArticleFlow = ({
  title,
  onTitleChange,
  content,
  onContentChange,
  coverImage,
  onCoverChange,
  onRemoveCover,
  isEdit,
  caption,
  onCaptionChange,
  onPost,
  isSubmitting,
  onClose,
  currentUser,
  currentPoster,
  isCompanyPost,
  onPreviewStepChange,
  onArticleComplete,
  skipNextStep,
  inlineFiles,
  setInlineFiles
}: ArticleFlowProps) => {
  const [step, setStep] = useState(1);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [editingLinkNode, setEditingLinkNode] = useState<HTMLElement | null>(null);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [editingImgSrc, setEditingImgSrc] = useState<string | null>(null);
  const [internalLocalFiles, setInternalLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const localFiles = inlineFiles !== undefined ? inlineFiles : internalLocalFiles;
  const setLocalFiles = setInlineFiles !== undefined ? setInlineFiles : setInternalLocalFiles;
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLDivElement>(null);
  const styleDropdownContainerRef = useRef<HTMLDivElement>(null);
  const [toolbarState, setToolbarState] = useState<ToolbarFormattingState>(DEFAULT_TOOLBAR_STATE);

  // Close style dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        styleDropdownContainerRef.current &&
        !styleDropdownContainerRef.current.contains(e.target as Node)
      ) {
        setIsStyleDropdownOpen(false);
      }
    };
    if (isStyleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStyleDropdownOpen]);

  // Keep active toolbar formatting in sync with selection (debounced via rAF)
  useEffect(() => {
    let rafHandle: number | null = null;

    const handleSelectionChange = () => {
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);

      rafHandle = requestAnimationFrame(() => {
        const editorEl = editorRef.current;
        if (!editorEl) return;
        setToolbarState(getSelectionToolbarState(editorEl));
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    };
  }, []);

  // Track initial state for edit mode to detect actual changes
  const initialDataRef = useRef<{
    title: string;
    content: string;
    coverImage: string | null;
  }>({
    title: '',
    content: '',
    coverImage: null
  });

  const [initialData, setInitialData] = useState<{
    title: string;
    content: string;
    coverImage: string | null;
  } | null>(null);

  useEffect(() => {
    if (titleInputRef.current && title !== undefined) {
      if (titleInputRef.current.innerText !== (title || '')) {
        titleInputRef.current.innerText = title || '';
      }
    }
  }, [title]);

  // Initialize innerHTML only once. Sanitized so legacy/external content (e.g. articles saved
  // before write-time sanitization existed, or containing inline styles from any other source)
  // renders using the editor's own default formatting instead of whatever styling it carries -
  // otherwise the editor can visually diverge from how the same content renders once published.
  const EDIT_SVG = renderToStaticMarkup(<EditIcon size={20} />);
  const DELETE_SVG = renderToStaticMarkup(<DeleteIcon size={20} />);

  const TOOLS_INNER_HTML = `
    <button type="button" class="edit-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-text-primary hover:opacity-80" title="Edit">
      ${EDIT_SVG}
    </button>
    <button type="button" class="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-error hover:opacity-80" title="Delete">
      ${DELETE_SVG}
    </button>
  `;

  const initializeArticleImageNodes = (container: HTMLElement) => {
    if (!container) return;

    // 1. Process all <img> elements loaded into the editor
    const images = Array.from(container.querySelectorAll('img'));
    images.forEach(img => {
      // Find or create standard media wrapper div
      let wrapper = img.closest('[contenteditable="false"]') as HTMLElement | null;

      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = "relative my-4 overflow-hidden group bg-transparent rounded-[24px]";
        wrapper.setAttribute('contenteditable', 'false');

        const parent = img.parentNode;
        if (parent) {
          parent.insertBefore(wrapper, img);
          wrapper.appendChild(img);
        }
      } else {
        wrapper.classList.remove('w-fit', 'max-w-full', 'w-full');
        wrapper.classList.add('relative', 'group', 'overflow-hidden', 'my-4', 'rounded-[24px]');
        wrapper.setAttribute('contenteditable', 'false');
      }

      // Apply constrained dimensions from data attributes.
      // data-natural-w / data-natural-h store the original image dimensions
      // so we can re-compute the bounding-box constraint after the sanitizer
      // strips inline styles.
      let natW = parseInt(img.getAttribute('data-natural-w') || '0', 10);
      let natH = parseInt(img.getAttribute('data-natural-h') || '0', 10);

      // For images without data attributes, try to read natural dimensions directly
      if ((natW <= 0 || natH <= 0) && img.naturalWidth > 0 && img.naturalHeight > 0) {
        natW = img.naturalWidth;
        natH = img.naturalHeight;
        img.setAttribute('data-natural-w', String(natW));
        img.setAttribute('data-natural-h', String(natH));
      }

      if (natW > 0 && natH > 0) {
        // We have dimensions — apply bounding-box constraint
        const { width, height } = constrainImageToBox(natW, natH);
        console.log('[ARTICLE-IMG] Constraint applied:', { natW, natH, constrainedW: width, constrainedH: height, imgSrc: img.src.substring(0, 60) });
        wrapper.style.setProperty('width', `${width}px`, 'important');
        wrapper.style.display = 'block';

        img.className = "block rounded-[24px]";
        img.style.setProperty('width', `${width}px`, 'important');
        img.style.setProperty('height', `${height}px`, 'important');
        img.setAttribute('width', String(width));
        img.setAttribute('height', String(height));
        img.style.display = 'block';
      } else {
        // Dimensions not yet known — only cap width, let height be auto
        // until onload fires and we can apply the proper constraint.
        wrapper.style.maxWidth = '688px';
        wrapper.style.display = 'block';

        img.className = "block rounded-[24px]";
        img.style.maxWidth = '688px';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.display = 'block';

        if (!img.complete) {
          img.addEventListener('load', function onLoad() {
            img.removeEventListener('load', onLoad);
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            if (nw > 0 && nh > 0) {
              img.setAttribute('data-natural-w', String(nw));
              img.setAttribute('data-natural-h', String(nh));
              const dims = constrainImageToBox(nw, nh);
              wrapper!.style.setProperty('width', `${dims.width}px`, 'important');
              img.style.setProperty('width', `${dims.width}px`, 'important');
              img.style.setProperty('height', `${dims.height}px`, 'important');
              img.setAttribute('width', String(dims.width));
              img.setAttribute('height', String(dims.height));
              img.className = "block rounded-[24px]";
            }
          });
        }
      }

      // Ensure overlay container with full action buttons exists
      let tools = wrapper.querySelector('.img-tools') as HTMLElement | null;
      if (!tools) {
        tools = document.createElement('div');
        wrapper.appendChild(tools);
      }
      tools.className = "img-tools absolute bottom-3 right-3 z-30 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-ds-surface-2 rounded-[12px] shadow-sm";
      tools.innerHTML = TOOLS_INNER_HTML;
    });

    // 2. Process all <video> elements loaded into the editor
    const videos = Array.from(container.querySelectorAll('video'));
    videos.forEach(video => {
      let wrapper = video.closest('[contenteditable="false"]') as HTMLElement | null;
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = "relative my-4 w-full overflow-hidden group bg-transparent mx-auto rounded-[24px]";
        wrapper.setAttribute('contenteditable', 'false');
        const parent = video.parentNode;
        if (parent) {
          parent.insertBefore(wrapper, video);
          wrapper.appendChild(video);
        }
      }
      wrapper.style.width = '100%';
      video.style.width = '100%';
      video.style.height = 'auto';

      let tools = wrapper.querySelector('.img-tools') as HTMLElement | null;
      if (!tools) {
        tools = document.createElement('div');
        wrapper.appendChild(tools);
      }
      tools.className = "img-tools absolute bottom-3 right-3 z-30 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-ds-surface-2 rounded-[12px] shadow-sm";
      tools.innerHTML = TOOLS_INNER_HTML;
    });
  };

  const initializeArticleLinkNodes = (container: HTMLElement) => {
    if (!container) return;
    const aTags = Array.from(container.querySelectorAll('a'));
    aTags.forEach(aTag => {
      let wrapper = (aTag.closest('span.group') || aTag.closest('span[contenteditable="false"]')) as HTMLElement | null;
      if (!wrapper) {
        wrapper = document.createElement('span');
        wrapper.className = "inline-block group relative font-poppins z-20 hover:z-50";
        wrapper.setAttribute('contenteditable', 'false');
        aTag.parentNode?.insertBefore(wrapper, aTag);
        wrapper.appendChild(aTag);
      }

      let capsule = wrapper.querySelector('.link-preview-capsule') as HTMLElement | null;
      if (!capsule) {
        const href = aTag.getAttribute('href') || '';
        const safeUrl = escapeHtml(href);
        capsule = document.createElement('span');
        capsule.className = "link-preview-capsule inline-flex items-center justify-center gap-[10px] h-[40px] px-3 bg-ds-surface-2 rounded-[24px] shadow-sm opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap before:absolute before:top-0 before:-left-2 before:w-2 before:h-full before:content-['']";
        capsule.innerHTML = `<button type="button" class="edit-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-text-primary hover:opacity-80" title="Edit">${EDIT_SVG}</button><button type="button" class="delete-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-error hover:opacity-80" title="Delete">${DELETE_SVG}</button>`;
        wrapper.appendChild(capsule);
      }
    });
  };

  const stripEditorControls = (html: string): string => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 1. Remove image tools
    const tools = tempDiv.querySelectorAll('.img-tools');
    tools.forEach(t => t.remove());

    // 2. Remove link preview capsules
    const capsules = tempDiv.querySelectorAll('.link-preview-capsule');
    capsules.forEach(c => c.remove());

    // 3. Unwrap link wrapper spans
    const linkWrappers = tempDiv.querySelectorAll('span[contenteditable="false"]');
    linkWrappers.forEach(w => {
      const a = w.querySelector('a');
      if (a) {
        w.replaceWith(a);
      }
    });

    return tempDiv.innerHTML;
  };

  const normalizeContentForComparison = (html: string): string => {
    if (!html) return '';
    if (typeof window === 'undefined') return html.trim();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = stripEditorControls(html);

    // Only normalize media elements and wrapper divs where dimensions/attributes are dynamically computed
    // Crucially, user formatting and alignment classes (e.g. text-center, text-right) on headings/paragraphs are preserved
    const mediaWrappers = tempDiv.querySelectorAll('[contenteditable="false"]');
    mediaWrappers.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('contenteditable');
    });

    const mediaElements = tempDiv.querySelectorAll('img, video');
    mediaElements.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('data-natural-w');
      el.removeAttribute('data-natural-h');
      el.removeAttribute('width');
      el.removeAttribute('height');
    });

    // Remove any empty class attributes or temporary IDs
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.getAttribute('class') === '') {
        el.removeAttribute('class');
      }
      if (el.hasAttribute('id')) {
        el.removeAttribute('id');
      }
    });

    return tempDiv.innerHTML.replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeArticleHtmlForDisplay(content);
      initializeArticleImageNodes(editorRef.current);
      initializeArticleLinkNodes(editorRef.current);

      if (isEdit) {
        const snap = {
          title: (title || '').trim(),
          content: normalizeContentForComparison(editorRef.current.innerHTML),
          coverImage: coverImage?.url || null
        };
        initialDataRef.current = snap;
        setInitialData(snap);
      }
    }
  }, []);

  useEffect(() => {
    if (isEdit && !initialData && editorRef.current && (title || content)) {
      const snap = {
        title: (title || '').trim(),
        content: normalizeContentForComparison(editorRef.current.innerHTML),
        coverImage: coverImage?.url || null
      };
      initialDataRef.current = snap;
      setInitialData(snap);
    }
  }, [isEdit, initialData, title, content, coverImage]);

  // Update innerHTML from parent if it diverges and editor is not focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const currentClean = stripEditorControls(editorRef.current.innerHTML);
      const incomingClean = stripEditorControls(content);

      if (currentClean !== incomingClean) {
        editorRef.current.innerHTML = sanitizeArticleHtmlForDisplay(content);
        initializeArticleImageNodes(editorRef.current);
        initializeArticleLinkNodes(editorRef.current);
      }
    }
  }, [content]);

  const cleanStrayInlineStyles = (container: HTMLElement) => {
    // 1. Unwrap any <font> tags inserted dynamically by Chrome
    const fontTags = container.querySelectorAll('font');
    fontTags.forEach(font => {
      while (font.firstChild) {
        font.parentNode?.insertBefore(font.firstChild, font);
      }
      font.remove();
    });

    // 2. Strip inline background/font styles that Chrome adds when backspacing list items
    const styledElements = container.querySelectorAll('[style]');
    
    const TEXT_ALIGN_TO_CLASS: Record<string, string> = {
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
      left: 'text-left',
    };

    styledElements.forEach(el => {
      // Keep link capsules, image containers, or top-level editor ref
      if (
        el.classList.contains('group') ||
        el.classList.contains('img-tools') ||
        el.closest('[contenteditable="false"]') ||
        el === container
      ) return;

      const textAlign = (el as HTMLElement).style.textAlign;
      if (textAlign && TEXT_ALIGN_TO_CLASS[textAlign]) {
        ALIGNMENT_CLASSES.forEach(cls => el.classList.remove(cls));
        el.classList.add(TEXT_ALIGN_TO_CLASS[textAlign]);
      }
      el.removeAttribute('style');
    });

    initializeArticleImageNodes(container);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      cleanStrayInlineStyles(editorRef.current);
      setToolbarState(getSelectionToolbarState(editorRef.current));
    }
    onContentChange(e.currentTarget.innerHTML);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        let node: Node | null = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

        const currentBlock = (node as HTMLElement | null)?.closest('p, h1, h2, h3, li, blockquote');
        
        if (currentBlock) {
          const tempRange = document.createRange();
          tempRange.selectNodeContents(currentBlock);
          tempRange.setEnd(range.startContainer, range.startOffset);
          
          if (tempRange.toString().length === 0) {
            // Cursor is at the absolute beginning of the block

            // 1. Delete preceding non-editable block (images/videos)
            const prev = currentBlock.previousElementSibling;
            if (prev && prev.getAttribute('contenteditable') === 'false') {
              e.preventDefault();
              prev.remove();
              if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
              onContentChange(editorRef.current?.innerHTML || '');
              return;
            }

            // 2. Handle lists (outdent empty item)
            const li = currentBlock.closest('li');
            if (li) {
              e.preventDefault();
              document.execCommand('outdent', false);
              if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
              onContentChange(editorRef.current?.innerHTML || '');
              return;
            }

            // 3. Handle headings (turn to paragraph)
            const heading = currentBlock.closest('h1, h2');
            if (heading) {
              e.preventDefault();
              document.execCommand('formatBlock', false, '<p>');
              if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
              onContentChange(editorRef.current?.innerHTML || '');
              return;
            }
          }
        }
      }
    }
  };

  const plainToParagraphs = (text: string) => {
    const paragraphs = text.split(/\r?\n\r?\n/);
    return paragraphs
      .map(p => {
        const escaped = escapeHtml(p.trim()).replace(/\r?\n/g, '<br>');
        return escaped ? `<p>${escaped}</p>` : '';
      })
      .filter(Boolean)
      .join('');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    let insertHtml: string;
    if (html) {
      insertHtml = sanitizePastedHtml(html);
      // Sanitizing left nothing usable (e.g. pure inline-styled div/span soup) - fall back to plain text
      if (!insertHtml.replace(/<[^>]*>/g, '').trim() && plain.trim()) {
        insertHtml = plainToParagraphs(plain);
      }
    } else {
      insertHtml = plainToParagraphs(plain);
    }

    editorRef.current?.focus();
    document.execCommand('insertHTML', false, insertHtml);
    if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
    onContentChange(editorRef.current?.innerHTML || '');
  };

  const isSelectionInsideEditor = (): boolean => {
    if (typeof window === 'undefined' || !editorRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const node = selection.getRangeAt(0).commonAncestorContainer;
    return editorRef.current.contains(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
  };

  const format = (command: string, value: string = '') => {
    if (!editorRef.current || !isSelectionInsideEditor()) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      cleanStrayInlineStyles(editorRef.current);
      setToolbarState(getSelectionToolbarState(editorRef.current));
    }
    onContentChange(editorRef.current?.innerHTML || '');
  };

  const setAlignment = (align: Alignment) => {
    if (!editorRef.current) return;
    if (!isSelectionInsideEditor()) {
      editorRef.current.focus();
    }
    applyAlignmentToBlocks(align, editorRef.current, toolbarState.alignment);
    if (editorRef.current) {
      cleanStrayInlineStyles(editorRef.current);
      setToolbarState(getSelectionToolbarState(editorRef.current));
    }
    onContentChange(editorRef.current?.innerHTML || '');
  };

  const applyStyle = (tag: 'NORMAL' | 'H1' | 'H2') => {
    if (!editorRef.current) return;

    // 1. Ensure editor has focus before executing command
    editorRef.current.focus();

    // 2. Resolve range to use (saved range or current selection)
    let rangeToUse = savedRange;
    if (!rangeToUse || !editorRef.current.contains(rangeToUse.commonAncestorContainer)) {
      if (isSelectionInsideEditor()) {
        rangeToUse = saveSelection();
      }
    }

    if (!rangeToUse) {
      const firstBlock = editorRef.current.querySelector('p, h1, h2, h3, li');
      const range = document.createRange();
      if (firstBlock) {
        range.selectNodeContents(firstBlock);
        range.collapse(false);
      } else {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }
      rangeToUse = range;
    }

    // 3. Apply style and re-establish selection
    applyBlockStyle(tag, rangeToUse, editorRef.current);
    setSavedRange(null);

    // 4. Ensure focus remains on editor
    editorRef.current.focus();

    // 5. Clean stray styles & update toolbar state & sync content
    cleanStrayInlineStyles(editorRef.current);
    setToolbarState(getSelectionToolbarState(editorRef.current));
    onContentChange(editorRef.current.innerHTML || '');
    setIsStyleDropdownOpen(false);
  };

  const saveSelection = (): Range | null => {
    if (typeof window !== 'undefined') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        if (editorRef.current && node && editorRef.current.contains(node)) {
          return range.cloneRange();
        }
      }
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range && typeof window !== 'undefined') {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const openLinkModal = () => {
    const range = saveSelection();
    setSavedRange(range);
    if (range) {
      setLinkTitle(range.toString());
    } else {
      setLinkTitle('');
    }
    setLinkUrl('');
    setEditingLinkNode(null);
    setIsLinkModalOpen(true);
  };

  const normalizeUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  };

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(normalizeUrl(url));
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const isLinkFormValid = linkTitle.trim().length > 0 && linkUrl.trim().length > 0 && isValidUrl(linkUrl);

  const handleAddLink = () => {
    if (!isLinkFormValid) return;
    restoreSelection(savedRange);

    const formattedUrl = normalizeUrl(linkUrl);
    const linkLabel = linkTitle.trim();
    const safeUrl = escapeHtml(formattedUrl);
    const safeTitle = escapeHtml(linkLabel);

    const linkHtml = `&nbsp;<span class="inline-block group relative font-poppins z-20 hover:z-50" contenteditable="false"><a href="${safeUrl}" target="_blank" class="text-ds-accent text-[#EC6229] no-underline hover:opacity-80 font-medium cursor-pointer" style="color: #EC6229 !important; text-decoration: none !important;">${safeTitle}</a><span class="link-preview-capsule inline-flex items-center justify-center gap-[10px] h-[40px] px-3 bg-ds-surface-2 rounded-[24px] shadow-sm opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap before:absolute before:top-0 before:-left-2 before:w-2 before:h-full before:content-['']"><button type="button" class="edit-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-text-primary hover:opacity-80" title="Edit">${EDIT_SVG}</button><button type="button" class="delete-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-error hover:opacity-80" title="Delete">${DELETE_SVG}</button></span></span>&nbsp;`;

    if (editingLinkNode) {
      editingLinkNode.outerHTML = linkHtml;
      setEditingLinkNode(null);
      onContentChange(editorRef.current?.innerHTML || '');
    } else {
      document.execCommand('insertHTML', false, linkHtml);
      onContentChange(editorRef.current?.innerHTML || '');
    }

    setLinkTitle('');
    setLinkUrl('');
    setIsLinkModalOpen(false);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle inline image/video Edit button
    const editImgBtn = target.closest('.edit-img-btn, [title="Edit"]');
    if (editImgBtn && editImgBtn.closest('.img-tools')) {
      const container = editImgBtn.closest('[contenteditable="false"]') || editImgBtn.closest('.relative') || editImgBtn.closest('.img-tools')?.parentElement;
      if (container) {
        const img = container.querySelector('img');
        const src = img?.getAttribute('src');
        if (src) {
          setEditingImgSrc(src);
          editImageInputRef.current?.click();
          return;
        }
      }
    }

    // Handle inline image/video Delete button
    const deleteImgBtn = target.closest('.delete-img-btn, [title="Delete"]');
    if (deleteImgBtn && deleteImgBtn.closest('.img-tools')) {
      const container = deleteImgBtn.closest('[contenteditable="false"]') || deleteImgBtn.closest('.relative') || deleteImgBtn.closest('.img-tools')?.parentElement;
      if (container) {
        const video = container.querySelector('video');
        if (video) {
          const src = video.getAttribute('src');
          if (src && src.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(src);
            } catch (err) {}
          }
        }
        container.remove();
        onContentChange(editorRef.current?.innerHTML || '');
        return;
      }
    }

    // Handle inline link Edit button
    const editLinkBtn = target.closest('.edit-link-btn');
    if (editLinkBtn) {
      const linkBlock = (editLinkBtn.closest('span.group') || editLinkBtn.closest('span[contenteditable="false"]')) as HTMLElement | null;
      if (linkBlock) {
        const aTag = linkBlock.querySelector('a');
        if (aTag) {
          setLinkTitle(aTag.textContent || '');
          setLinkUrl(aTag.getAttribute('href') || '');
          setEditingLinkNode(linkBlock);
          setIsLinkModalOpen(true);
          return;
        }
      }
    }

    // Handle inline link Delete button
    const deleteLinkBtn = target.closest('.delete-link-btn');
    if (deleteLinkBtn) {
      const linkBlock = deleteLinkBtn.closest('span.group') || deleteLinkBtn.closest('span[contenteditable="false"]');
      if (linkBlock) {
        const aTag = linkBlock.querySelector('a');
        const plainText = aTag ? aTag.textContent || '' : '';
        if (plainText) {
          linkBlock.replaceWith(document.createTextNode(plainText));
        } else {
          linkBlock.remove();
        }
        onContentChange(editorRef.current?.innerHTML || '');
        return;
      }
    }
  };

  const triggerInlineImage = () => {
    inlineImageInputRef.current?.click();
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        e.target.value = '';
        return;
      }

      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        const videoUrl = URL.createObjectURL(file);
        const uniqueId = videoUrl.split('/').pop() || Date.now().toString();
        const namedFile = createUniqueNamedFile(file, uniqueId);
        setLocalFiles(prev => [...prev, { id: videoUrl, file: namedFile }]);

        const pId = 'p-' + Date.now();
        const videoHtml = `
          <div class="relative my-4 w-full overflow-hidden group bg-transparent rounded-[24px]" style="width: 100%" contenteditable="false">
            <video controls src="${videoUrl}" class="w-full rounded-lg" style="width: 100%; height: auto"></video>
            <div class="img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-ds-surface-2 rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button type="button" class="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Delete">
                ${DELETE_SVG}
              </button>
            </div>
          </div><p id="${pId}"><br></p>
        `;
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, videoHtml);
        
        const insertedP = document.getElementById(pId);
        if (insertedP) {
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.setStart(insertedP, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          insertedP.removeAttribute('id');
        }
        
        onContentChange(editorRef.current?.innerHTML || '');
      } else {
        try {
          const imageUrl = URL.createObjectURL(file);
          const uniqueId = imageUrl.split('/').pop() || Date.now().toString();
          const namedFile = createUniqueNamedFile(file, uniqueId);
          setLocalFiles(prev => [...prev, { id: imageUrl, file: namedFile }]);

          // Load the image to get its natural dimensions before inserting
          const tempImg = new Image();
          tempImg.src = imageUrl;
          await new Promise<void>((resolve) => {
            tempImg.onload = () => resolve();
            tempImg.onerror = () => resolve(); // fallback on error
          });

          const natW = tempImg.naturalWidth || tempImg.width;
          const natH = tempImg.naturalHeight || tempImg.height;
          const { width, height } = constrainImageToBox(natW, natH);

          const pId = 'p-' + Date.now();
          const imageHtml = `
            <div class="relative my-4 overflow-hidden group bg-transparent rounded-[24px]" style="width:${width}px !important;display:block" contenteditable="false">
              <img src="${imageUrl}" class="block rounded-[24px]" style="width:${width}px !important;height:${height}px !important;display:block" width="${width}" height="${height}" data-natural-w="${natW}" data-natural-h="${natH}" />
              <div class="img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-ds-surface-2 rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button type="button" class="edit-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-text-primary hover:opacity-80" title="Edit">
                  ${EDIT_SVG}
                </button>
                <button type="button" class="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer text-ds-error hover:opacity-80" title="Delete">
                  ${DELETE_SVG}
                </button>
              </div>
            </div><p id="${pId}"><br></p>
          `;
          editorRef.current?.focus();
          document.execCommand('insertHTML', false, imageHtml);
          
          const insertedP = document.getElementById(pId);
          if (insertedP) {
            const sel = window.getSelection();
            if (sel) {
              const range = document.createRange();
              range.setStart(insertedP, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            insertedP.removeAttribute('id');
          }
          
          onContentChange(editorRef.current?.innerHTML || '');
        } catch (err) {
          console.error("Failed to add inline image locally", err);
        }
      }
    }
    e.target.value = '';
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingImgSrc) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        e.target.value = '';
        return;
      }
      try {
        const imageUrl = URL.createObjectURL(file);
        const uniqueId = imageUrl.split('/').pop() || Date.now().toString();
        const namedFile = createUniqueNamedFile(file, uniqueId);
        setLocalFiles(prev => [...prev, { id: imageUrl, file: namedFile }]);

        // Load the replacement image to get its natural dimensions
        const tempImg = new Image();
        tempImg.src = imageUrl;
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve();
          tempImg.onerror = () => resolve();
        });

        const natW = tempImg.naturalWidth || tempImg.width;
        const natH = tempImg.naturalHeight || tempImg.height;
        const { width, height } = constrainImageToBox(natW, natH);

        // Replace the old src with the new local blobUrl in the content HTML string
        let newContent = content.replace(editingImgSrc, imageUrl);

        // Update data-natural-w/h and dimensions in the HTML for the replaced image
        // Find the img tag with the new src and update its attributes
        if (editorRef.current) {
          editorRef.current.innerHTML = newContent;
          const replacedImg = editorRef.current.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement | null;
          if (replacedImg) {
            replacedImg.setAttribute('data-natural-w', String(natW));
            replacedImg.setAttribute('data-natural-h', String(natH));
            replacedImg.style.setProperty('width', `${width}px`, 'important');
            replacedImg.style.setProperty('height', `${height}px`, 'important');
            replacedImg.setAttribute('width', String(width));
            replacedImg.setAttribute('height', String(height));
            replacedImg.className = 'block rounded-[24px]';

            const wrapper = replacedImg.closest('[contenteditable="false"]') as HTMLElement | null;
            if (wrapper) {
              wrapper.style.setProperty('width', `${width}px`, 'important');
              wrapper.style.margin = '';
              wrapper.classList.remove('w-full', 'mx-auto');
            }
          }
          newContent = editorRef.current.innerHTML;
        }

        onContentChange(newContent);
        toast.success("Image updated successfully");
      } catch (err) {
        console.error("Failed to update image locally", err);
      } finally {
        setEditingImgSrc(null);
      }
    }
    e.target.value = '';
  };

  const getFilesToUpload = (): File[] => {
    const currentContent = editorRef.current?.innerHTML || content;
    
    // Find all blob: URLs in currentContent
    const blobUrls = Array.from(currentContent.matchAll(/src="(blob:[^"]+)"/g)).map(m => m[1]);
    
    const filesToUpload: File[] = [];
    const seen = new Set<string>();
    blobUrls.forEach(url => {
      const match = localFiles.find(f => f.id === url);
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        filesToUpload.push(match.file);
      }
    });
    
    return filesToUpload;
  };



  const handleOnPost = async () => {
    let cleanContent = content;
    if (editorRef.current) {
      cleanContent = stripEditorControls(editorRef.current.innerHTML);
      onContentChange(cleanContent);
    }
    const files = getFilesToUpload();
    await onPost(files, cleanContent);
    
    if (isEdit && editorRef.current) {
      const snap = {
        title: (title || '').trim(),
        content: normalizeContentForComparison(editorRef.current.innerHTML),
        coverImage: coverImage?.url || null
      };
      setInitialData(snap);
      initialDataRef.current = snap;
    }
  };

  const hasUnsavedChanges = (): boolean => {
    if (!isEdit) {
      const cleanContent = editorRef.current ? stripEditorControls(editorRef.current.innerHTML) : content;
      const textContent = cleanContent.replace(/<[^>]*>/g, '').trim();
      return (
        title.trim().length > 0 ||
        textContent.length > 0 ||
        cleanContent.includes('<img') ||
        coverImage !== null ||
        localFiles.length > 0
      );
    }

    if (!initialData) return false;

    const currentClean = normalizeContentForComparison(editorRef.current ? editorRef.current.innerHTML : content);
    const titleChanged = title.trim() !== initialData.title.trim();
    const contentChanged = currentClean !== initialData.content;
    const coverChanged = (coverImage?.url || null) !== initialData.coverImage;
    const hasLocalFiles = localFiles.length > 0;

    return titleChanged || contentChanged || coverChanged || hasLocalFiles;
  };

  const handleOnClose = async (skipConfirm?: boolean | React.MouseEvent) => {
    if (skipConfirm !== true && hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
      return;
    }
    let cleanContent = content;
    if (editorRef.current) {
      cleanContent = stripEditorControls(editorRef.current.innerHTML);
      onContentChange(cleanContent);
    }
    const files = getFilesToUpload();
    await onClose(files, cleanContent);
  };

  const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0 || content.includes('<img') || content.includes('<video');
  const hasBasicFields = title.trim().length > 0 && hasContent && coverImage !== null;
  const isNextActive = isEdit ? (hasBasicFields && hasUnsavedChanges()) : hasBasicFields;

  const authorName = isCompanyPost ? (currentPoster?.name || 'Company') : (currentUser?.name || 'User');
  const subtitleText = isCompanyPost 
    ? (currentPoster?.company_name || currentPoster?.org_slug || 'company')
    : `@${currentUser?.username || 'user'}`;

  console.log("DEBUG ArticleFlow:", {
    isCompanyPost,
    currentPoster,
    currentUser,
    authorName,
    subtitleText
  });

  const rawAvatarSrc = isCompanyPost
    ? (currentPoster?.logo_url || currentPoster?.avatar_url || currentPoster?.company_logo || currentPoster?.logo || currentPoster?.image)
    : (currentUser?.image || (currentUser as any)?.avatar);
  
  const avatarSrc = isCompanyPost 
    ? rawAvatarSrc 
    : (rawAvatarSrc && !rawAvatarSrc.includes('pngegg') ? rawAvatarSrc : null);

  console.log("DEBUG ArticleFlow avatarSrc:", { rawAvatarSrc, avatarSrc });
  const articleSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-article';
  const generatedArticleUrl = `/post/article/${articleSlug}`;
  const plainArticleText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (step === 2) {
    return (
      <div className="flex flex-col gap-5 select-none font-poppins">
        <button
          type="button"
          onClick={() => {
            console.log("BACK CLICKED");
            onPreviewStepChange?.(false);
            setStep(1);
          }}
          className="flex w-fit items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to article
        </button>

        <div className="flex items-center gap-3">
          <img src={avatarSrc} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="flex min-w-0 flex-col">
            <h5 className="font-semibold text-[15px] text-foreground leading-tight truncate">{authorName}</h5>
            <p className="text-[12px] text-muted-foreground truncate">{subtitleText}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={generatedArticleUrl}
            onClick={(e) => e.preventDefault()}
            className="group w-full max-w-[420px] bg-card border border-border rounded-[24px] overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-full aspect-[16/3] overflow-hidden">
              {coverImage ? (
                <img src={coverImage.url} alt={title || 'Article cover'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                  <Icon icon="ph:article" className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="bg-ds-surface-2 py-3.5 px-5 text-center">
              <h3 className="line-clamp-2 text-[13px] font-semibold text-ds-text-primary font-poppins leading-tight">
                {title || 'Untitled Article'}
              </h3>
            </div>
          </a>
        </div>

        <textarea
          value={caption || ''}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Say something about your article..."
          rows={4}
          style={{ minHeight: '96px', maxHeight: '200px' }}
          className="w-full overflow-y-auto custom-scrollbar resize-none rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ds-accent focus:ring-2 focus:ring-ds-accent/20"
        />

        <div className="flex items-center gap-4 border-y border-border/50 py-3">
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Audience">
            <Icon icon="ph:users-three" className="w-5 h-5" />
          </button>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Location">
            <Icon icon="ph:map-pin" className="w-5 h-5" />
          </button>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Feeling">
            <Icon icon="ph:smiley" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-2 px-5 py-2 border border-ds-border text-ds-text-primary bg-background rounded-full text-[14px] font-normal hover:bg-ds-surface-2 transition-colors">
            <Sparkles className="w-4 h-4" />
            Enhance with AI
          </button>
          <button
            disabled={isSubmitting || !isNextActive}
            onClick={handleOnPost}
            className={cn(
              "ds-btn ml-auto",
              isCompanyPost ? "bg-ds-surface-2 hover:bg-ds-surface-2/80 text-ds-text-primary" : ""
            )}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 bg-[#030303] text-ds-text-primary font-dm-sans select-none min-h-screen w-full">
      {/* Custom Styles */}
      <style>{`
        .article-title-editor[contenteditable]:empty:before {
          content: attr(placeholder);
          color: #726B67;
          font-weight: 700;
          cursor: text;
        }
        [contenteditable]:not(.article-title-editor):empty:before {
          content: attr(placeholder);
          color: #726B67;
          font-weight: 400;
          font-size: 16px;
          cursor: text;
        }
        .article-editor a {
          color: #FFECE6 !important;
          text-decoration: underline !important;
          font-weight: 500;
        }
      `}</style>

      {/* Standalone Cancel / Close Button - Right: 40px, Top: 40px, Size: 20px */}
      <button
        type="button"
        onClick={() => handleOnClose()}
        aria-label="Close"
        className="fixed right-[40px] top-[40px] w-[20px] h-[20px] text-[#FFECE6] hover:opacity-75 transition-opacity z-50 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded"
      >
        <X className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Frame 2609568: w-[688px] mx-auto flex flex-col gap-[20px] pt-[60px] pb-[80px] */}
      <div className="mx-auto flex w-[688px] max-w-full flex-col gap-[20px] pt-[60px] pb-[80px] px-4 sm:px-0">
        
        {/* Frame 2609516: Author + Toolbar + Post button - h-[36px] w-[688px] flex items-center gap-[40px] */}
        <div className="flex h-[36px] w-[688px] max-w-full items-center justify-between gap-[40px]">
          
          {/* Frame 2609563: Author (w-[119px] h-[32px] gap-[8px]) */}
          <div className="flex w-[119px] h-[32px] items-center gap-[8px] shrink-0">
            <div className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0 border border-[#2C2C33] bg-[#1A1A20]">
              {avatarSrc ? (
                <img src={avatarSrc} alt={authorName} className="w-full h-full object-cover" onError={(e) => { if (!isCompanyPost) (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-normal text-[14px] text-[#FFECE6]">
                  {(authorName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="w-[79px] h-[24px] font-dm-sans font-normal text-[16px] leading-[24px] text-[#FFECE6] truncate">
              {authorName}
            </span>
          </div>

          {/* Frame 2609564: Tools (w-[421px] h-[32px] gap-[12px]) */}
          <div className="flex w-[421px] h-[32px] items-center justify-center gap-[12px] shrink-0">
            {/* Style Select: min-w-[69px] h-[32px] px-[8px] py-[6px] gap-[6px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-[8px] */}
            <div ref={styleDropdownContainerRef} className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSavedRange(saveSelection() || null);
                }}
                onClick={() => setIsStyleDropdownOpen(prev => !prev)}
                aria-label="Text style dropdown"
                aria-expanded={isStyleDropdownOpen}
                className="flex items-center justify-between min-w-[69px] w-fit h-[32px] px-[8px] py-[6px] gap-[6px] rounded-[8px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] transition-colors cursor-pointer"
              >
                <span className="font-dm-sans font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] whitespace-nowrap">
                  {toolbarState.heading === 'H1' ? 'H1'
                    : toolbarState.heading === 'H2' ? 'H2'
                    : toolbarState.heading === 'NORMAL' ? 'Normal'
                    : 'Style'}
                </span>
                <ChevronDown className={cn("w-[16px] h-[16px] text-[var(--ds-text-primary)] shrink-0 transition-transform duration-150", isStyleDropdownOpen && "rotate-180")} />
              </button>

              {isStyleDropdownOpen && (
                <div 
                  className="absolute left-0 top-full mt-1.5 w-[90px] h-[100px] p-[12px] gap-[8px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-[8px] shadow-2xl z-50 flex flex-col items-start box-border select-none"
                >
                  {/* Normal: height 20px, font 14px, leading 20px */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle('NORMAL')}
                    className={cn(
                      "w-full h-[20px] p-0 m-0 border-0 bg-transparent text-left font-dm-sans font-normal text-[14px] leading-[20px] cursor-pointer transition-colors shrink-0 whitespace-nowrap",
                      toolbarState.heading === 'NORMAL'
                        ? "text-[var(--ds-accent)]"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    Normal
                  </button>

                  {/* Heading 1: height 20px, font 14px, leading 20px */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle('H1')}
                    className={cn(
                      "w-full h-[20px] p-0 m-0 border-0 bg-transparent text-left font-dm-sans font-normal text-[14px] leading-[20px] cursor-pointer transition-colors shrink-0 whitespace-nowrap",
                      toolbarState.heading === 'H1'
                        ? "text-[var(--ds-accent)]"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    Heading 1
                  </button>

                  {/* Heading 2: height 20px, font 14px, leading 20px */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStyle('H2')}
                    className={cn(
                      "w-full h-[20px] p-0 m-0 border-0 bg-transparent text-left font-dm-sans font-normal text-[14px] leading-[20px] cursor-pointer transition-colors shrink-0 whitespace-nowrap",
                      toolbarState.heading === 'H2'
                        ? "text-[var(--ds-accent)]"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    Heading 2
                  </button>
                </div>
              )}
            </div>

            {/* 1. Bold: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('bold')}
              aria-label="Bold"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.isBold ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Bold"
            >
              <BoldIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 2. Italic: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('italic')}
              aria-label="Italic"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.isItalic ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Italic"
            >
              <ItalicIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 3. Underline: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('underline')}
              aria-label="Underline"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.isUnderline ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Underline"
            >
              <UnderlineIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 4. Strike: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('strikeThrough')}
              aria-label="Strikethrough"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.isStrike ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Strikethrough"
            >
              <StrikethroughIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 5. List: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('insertUnorderedList')}
              aria-label="Unordered List"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.isBulletList ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Bullet List"
            >
              <ListIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 6. Align left: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAlignment('text-left')}
              aria-label="Align Left"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.alignment === 'text-left' ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Align Left"
            >
              <AlignLeftIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 7. Align center: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAlignment('text-center')}
              aria-label="Align Center"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.alignment === 'text-center' ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Align Center"
            >
              <AlignCenterIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 8. Align right: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAlignment('text-right')}
              aria-label="Align Right"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.alignment === 'text-right' ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Align Right"
            >
              <AlignRightIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 9. Align justify: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAlignment('text-justify')}
              aria-label="Align Justify"
              className={cn(
                "w-[20px] h-[20px] flex items-center justify-center transition-colors cursor-pointer",
                toolbarState.alignment === 'text-justify' ? "text-[var(--ds-accent)]" : "text-[#FFECE6] hover:opacity-75"
              )}
              title="Justify"
            >
              <AlignJustifyIcon className="w-[20px] h-[20px]" />
            </button>

            {/* 10. Media: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={triggerInlineImage}
              disabled={isUploadingInline}
              aria-label="Insert Image"
              className="w-[20px] h-[20px] flex items-center justify-center text-[#FFECE6] hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-50"
              title="Insert Image"
            >
              {isUploadingInline ? (
                <Loader2 className="w-[20px] h-[20px] animate-spin" />
              ) : (
                <ImageIcon className="w-[20px] h-[20px]" />
              )}
            </button>

            {/* 11. Link: 20x20 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openLinkModal}
              aria-label="Insert Link"
              className="w-[20px] h-[20px] flex items-center justify-center text-[#FFECE6] hover:opacity-75 transition-opacity cursor-pointer"
              title="Insert Link"
            >
              <LinkIcon className="w-[20px] h-[20px]" />
            </button>
          </div>

          {/* Primary emphasis button (Save / Post): w-[77px] h-[36px] padding 6px 12px gap 10px rounded-[100px] */}
          <button
            type="button"
            disabled={!isNextActive || isSubmitting}
            onClick={handleOnPost}
            aria-label={isEdit ? "Save article" : "Post article"}
            className={cn(
              "w-[77px] h-[36px] flex items-center justify-center px-[12px] py-[6px] gap-[10px] rounded-[100px] font-dm-sans font-medium text-[16px] leading-[24px] transition-all shrink-0 select-none outline-none",
              isSubmitting
                ? "bg-[var(--ds-accent)] text-white border border-transparent opacity-80 cursor-wait shadow-sm"
                : isNextActive
                  ? "bg-[var(--ds-accent)] text-white border border-transparent hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
                  : "bg-[#1A1A20] text-[#726B67] cursor-not-allowed border border-[#2C2C33]"
            )}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}</span>
          </button>
        </div>

        {/* Frame 2609565: Cover image (688px x 338px) */}
        <div className="w-[688px] max-w-full">
          <ArticleCoverEditor
            coverImage={coverImage?.url ?? null}
            onCoverChange={(url) => onCoverChange(url)}
            onRemoveCover={onRemoveCover}
            isEdit={isEdit}
          />
        </div>

        {/* Hidden inputs & triggers */}
        <input
          ref={inlineImageInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleInlineImageUpload}
          className="hidden"
        />
        <input
          ref={editImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleEditImageUpload}
          className="hidden"
        />

        {/* Title Input: text-[40px] font-bold leading-[48px] text-[#FFECE6] placeholder-[#726B67] */}
        <div
          ref={titleInputRef}
          contentEditable
          role="textbox"
          onInput={(e) => {
            onTitleChange(e.currentTarget.innerText || '');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editorRef.current?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          {...{ placeholder: "Title" }}
          className="article-title-editor w-[688px] max-w-full p-0 bg-transparent border-none outline-none focus:ring-0 text-[#FFECE6] font-dm-sans font-bold text-[40px] leading-[48px] block h-auto min-h-[48px] flex-shrink-0 overflow-visible cursor-text"
        />

        {/* Rich contentEditable area: text-[16px] font-normal leading-[24px] text-[#FFECE6] placeholder-[#726B67] */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          {...{ placeholder: "Write your thoughts" }}
          className="article-editor outline-none focus:ring-0 text-[#FFECE6] font-dm-sans font-normal text-[16px] leading-[24px] min-h-[300px] pb-16 h-auto w-[688px] max-w-full flex-shrink-0 overflow-visible cursor-text [&_a]:!text-[#EC6229] [&_a]:!no-underline"
        />
      </div>

      {/* Add / Edit Link Modal */}
      {isLinkModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
          onClick={() => { setIsLinkModalOpen(false); setEditingLinkNode(null); }}
        >
          {/* Modal Container */}
          <div 
            className="relative flex h-[276px] w-[300px] flex-col items-center gap-[12px] rounded-[16px] border border-[#2C2C33] bg-[#030303] p-[12px] shadow-2xl font-dm-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close row */}
            <div className="flex h-[20px] w-[276px] items-center justify-end gap-[10px]">
              <button
                type="button"
                onClick={() => { setIsLinkModalOpen(false); setEditingLinkNode(null); }}
                className="flex h-[20px] w-[20px] items-center justify-center text-[#FFECE6] hover:opacity-75 transition-opacity cursor-pointer outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Heading */}
            <div className="h-[24px] w-[61px] whitespace-nowrap text-center font-dm-sans text-[16px] font-medium leading-[24px] text-[#FFECE6]">
              {editingLinkNode ? 'Edit link' : 'Add link'}
            </div>

            {/* Title input */}
            <div className="box-border flex h-[62px] w-[260px] flex-col items-start justify-center gap-[10px] border-b border-[#2C2C33] py-[8px]">
              <span className="h-[16px] w-[25px] text-center font-dm-sans text-[12px] font-medium leading-[16px] text-[#B8ADA8]">
                Title
              </span>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isLinkFormValid) {
                    handleAddLink();
                  }
                }}
                placeholder="e.g. cocpit"
                autoFocus
                className="h-[20px] w-full border-0 bg-transparent p-0 font-dm-sans text-[14px] font-normal leading-[20px] text-[#FFECE6] placeholder:text-[#726B67] outline-none"
              />
            </div>

            {/* Link input */}
            <div className="box-border flex h-[62px] w-[260px] flex-col items-start justify-center gap-[10px] border-b border-[#2C2C33] py-[8px]">
              <span className="h-[16px] w-[23px] text-center font-dm-sans text-[12px] font-medium leading-[16px] text-[#B8ADA8]">
                Link
              </span>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isLinkFormValid) {
                    handleAddLink();
                  }
                }}
                placeholder="e.g. www.link.com"
                className="h-[20px] w-full border-0 bg-transparent p-0 font-dm-sans text-[14px] font-normal leading-[20px] text-[#FFECE6] placeholder:text-[#726B67] outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex h-[36px] w-[162px] items-start justify-center gap-[8px]">
              {/* Add */}
              <button
                type="button"
                disabled={!isLinkFormValid}
                onClick={handleAddLink}
                className={cn(
                  "flex h-[36px] w-[77px] items-center justify-center rounded-full px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] transition-all border-none outline-none",
                  isLinkFormValid
                    ? "bg-[#FF6422] text-[#FFECE6] hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
                    : "bg-[#1A1A20] text-[#726B67] cursor-not-allowed"
                )}
              >
                {editingLinkNode ? 'Save' : 'Add'}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => { setIsLinkModalOpen(false); setEditingLinkNode(null); }}
                className="flex h-[36px] w-[77px] items-center justify-center rounded-full border border-[#2C2C33] bg-transparent hover:bg-[#1A1A20] px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] text-[#FFECE6] transition-colors cursor-pointer outline-none active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Overlay */}
      <DiscardConfirmOverlay
        isOpen={showDiscardConfirm}
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          handleOnClose(true);
        }}
      />
    </div>
  );
};

export default ArticleFlow;
