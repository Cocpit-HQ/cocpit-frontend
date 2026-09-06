/* DEPRECATED
DEPRECATED\n// import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, Link as LinkIcon,
  Image as ImageIcon, X, ArrowLeft, ChevronLeft, Loader2, Sparkles, Send
} from 'lucide-react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { MediaItem } from '../../types';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';
import { sanitizeArticleHtmlForDisplay } from '@/lib/sanitizeArticleHtml';
import ArticleCoverEditor from './ArticleCoverEditor';
import { DiscardConfirmOverlay } from '@/features/create-post/components/shared/DiscardConfirmOverlay';

Allowed structure for pasted content: matches what the toolbar itself can produce
(bold/italic/headings/lists/links). style/class/id are stripped so pasted text always
inherits the editor's own formatting instead of the source's (fixes ID-227: white/colored
text pasted from dark-mode sources like ChatGPT becoming invisible on our light editor).
const ALLOWED_PASTE_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'];
const ALLOWED_PASTE_ATTR = ['href'];

const sanitizePastedHtml = (dirtyHtml: string) =>
  DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: ALLOWED_PASTE_TAGS,
    ALLOWED_ATTR: ALLOWED_PASTE_ATTR,
    FORBID_ATTR: ['style', 'class', 'id'],
    // img/video are only ever inserted by our own toolbar (blob: URLs + control markup) -
    // a pasted <img>/<video> from an external source is never wanted here.
    FORBID_TAGS: ['img', 'video', 'iframe', 'style', 'script', 'object', 'embed', 'div'],
    ALLOW_DATA_ATTR: false,
  });

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
  /** Called with the resolved URL after the modal saves, or null when removed * /
  onCoverChange: (url: string | null) => void;
  onRemoveCover: () => void;
  isEdit: boolean;
  caption: string;
  onCaptionChange: (value: string) => void;
  onPost: (inlineFiles?: File[]) => Promise<void>;
  isSubmitting: boolean;
  onClose: (inlineFiles?: File[]) => Promise<void> | void;
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

  // Track initial state for edit mode to detect actual changes
  const initialDataRef = useRef({
    title: '',
    content: '',
    coverImage: null as string | null
  });

  useEffect(() => {
    if (isEdit && title && initialDataRef.current.title === '') {
      // Normalize the incoming content exactly how the editor does so we can do a fair equality check later
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizeArticleHtmlForDisplay(content);
      // We must call initializeArticleImageNodes on the temp div because the editor will do the same,
      // adding wrapper divs that would otherwise make the HTML strings look different.
      initializeArticleImageNodes(tempDiv);

      initialDataRef.current = {
        title,
        content: stripEditorControls(tempDiv.innerHTML),
        coverImage: coverImage?.url || null
      };
    }
  }, [isEdit, title, content, coverImage]);

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
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.44 5.78L4.198 16.02a2 2 0 0 0-.565 1.125l-.553 3.774l3.775-.553A2 2 0 0 0 7.98 19.8L18.22 9.56m-3.78-3.78l2.229-2.23a1.6 1.6 0 0 1 2.263 0l1.518 1.518a1.6 1.6 0 0 1 0 2.263l-2.23 2.23M14.44 5.78l3.78 3.78"/></svg>`;
  const DELETE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="#FF6B6B" d="M7 3h2a1 1 0 0 0-2 0M6 3a2 2 0 1 1 4 0h4a.5.5 0 0 1 0 1h-.564l-1.205 8.838A2.5 2.5 0 0 1 9.754 15H6.246a2.5 2.5 0 0 1-2.477-2.162L2.564 4H2a.5.5 0 0 1 0-1zm1 3.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0zM9.5 6a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-4.74 6.703A1.5 1.5 0 0 0 6.246 14h3.508a1.5 1.5 0 0 0 1.487-1.297L12.427 4H3.573z"/></svg>`;

  const TOOLS_INNER_HTML = `
    <button type="button" class="edit-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Edit">
      ${EDIT_SVG}
    </button>
    <button type="button" class="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Delete">
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
        wrapper.className = "relative my-4 w-full overflow-hidden group bg-transparent mx-auto rounded-[24px]";
        wrapper.setAttribute('contenteditable', 'false');

        const parent = img.parentNode;
        if (parent) {
          parent.insertBefore(wrapper, img);
          wrapper.appendChild(img);
        }
      } else {
        wrapper.classList.remove('w-fit', 'max-w-full');
        wrapper.classList.add('relative', 'group', 'overflow-hidden', 'my-4', 'w-full', 'rounded-[24px]');
        wrapper.setAttribute('contenteditable', 'false');
      }

      // Force width via direct DOM style — CSS classes alone don't override the
      // image's intrinsic dimensions, and DOMPurify strips style attributes from
      // the HTML string.  Direct .style assignment survives both because
      // cleanStrayInlineStyles skips elements inside [contenteditable="false"].
      wrapper.style.width = '100%';
      wrapper.style.display = 'block';

      img.className = "w-full h-auto object-cover block mx-auto";
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.objectFit = 'cover';

      // Ensure overlay container with full action buttons exists
      let tools = wrapper.querySelector('.img-tools') as HTMLElement | null;
      if (!tools) {
        tools = document.createElement('div');
        wrapper.appendChild(tools);
      }
      tools.className = "img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-[#EEF2FF] rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200";
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
      tools.className = "img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-[#EEF2FF] rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200";
      tools.innerHTML = TOOLS_INNER_HTML;
    });
  };

  const stripEditorControls = (html: string): string => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const tools = tempDiv.querySelectorAll('.img-tools');
    tools.forEach(t => t.remove());
    return tempDiv.innerHTML;
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeArticleHtmlForDisplay(content);
      initializeArticleImageNodes(editorRef.current);
    }
  }, []);

  // Update innerHTML from parent if it diverges and editor is not focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const currentClean = stripEditorControls(editorRef.current.innerHTML);
      const incomingClean = stripEditorControls(content);

      if (currentClean !== incomingClean) {
        editorRef.current.innerHTML = sanitizeArticleHtmlForDisplay(content);
        initializeArticleImageNodes(editorRef.current);
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
    styledElements.forEach(el => {
      // Keep link capsules, image containers, or top-level editor ref
      if (
        el.classList.contains('group') ||
        el.classList.contains('img-tools') ||
        el.closest('[contenteditable="false"]') ||
        el === container
      ) return;
      el.removeAttribute('style');
    });

    initializeArticleImageNodes(container);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      cleanStrayInlineStyles(editorRef.current);
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
    const paragraphs = text.split(/\r?\n// \r?\n// /);
    return paragraphs
      .map(p => {
        const escaped = escapeHtml(p.trim()).replace(/\r?\n// /g, '<br>');
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
    if (!isSelectionInsideEditor()) return;
    document.execCommand(command, false, value);
    if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
    onContentChange(editorRef.current?.innerHTML || '');
  };

  // Unlike 'bold'/'italic', 'formatBlock' isn't a native toggle command - clicking H1 on text
  // that's already H1 just re-applies H1 instead of reverting to a normal paragraph, so there
  const getCurrentHeading = (): string | null => {
    if (typeof window === 'undefined' || !isSelectionInsideEditor()) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;

    let heading = (node as HTMLElement | null)?.closest?.('h1, h2, h3');
    if (!heading && selection.anchorNode) {
      let anchor: Node | null = selection.anchorNode;
      if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentElement;
      heading = (anchor as HTMLElement | null)?.closest?.('h1, h2, h3');
    }

    return heading ? heading.tagName.toUpperCase() : null;
  };

  const toggleHeading = (tag: 'H1' | 'H2' | 'H3') => {
    if (!isSelectionInsideEditor()) return;
    const currentHeading = getCurrentHeading();
    const isSameHeading = currentHeading === tag;
    const targetBlock = isSameHeading ? '<p>' : `<${tag.toLowerCase()}>`;
    document.execCommand('formatBlock', false, targetBlock);
    if (editorRef.current) cleanStrayInlineStyles(editorRef.current);
    onContentChange(editorRef.current?.innerHTML || '');
  };

  const saveSelection = () => {
    if (typeof window !== 'undefined') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        return sel.getRangeAt(0);
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

    const linkHtml = `&nbsp;<span class="inline-block group relative font-poppins z-20 hover:z-50" contenteditable="false"><a href="${safeUrl}" target="_blank" class="text-[#6366F1] font-medium no-underline hover:underline cursor-pointer">${safeTitle}</a><span class="link-preview-capsule inline-flex items-center justify-between w-[301px] h-[40px] px-4 py-2 bg-[#EEF2FF] rounded-[24px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-0 top-full mt-1.5 z-50 whitespace-nowrap pointer-events-auto"><span class="text-[14px] font-medium text-[#6366F1] max-w-[180px] min-w-0 truncate mr-2">${safeUrl}</span><span class="flex items-center gap-[10px] shrink-0"><button type="button" class="edit-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Edit">${EDIT_SVG}</button><button type="button" class="delete-link-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Delete">${DELETE_SVG}</button></span></span></span>&nbsp;`;

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
            <div class="img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-[#EEF2FF] rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          
          const pId = 'p-' + Date.now();
          const imageHtml = `
            <div class="relative my-4 w-full overflow-hidden group bg-transparent rounded-[24px]" style="width:100%;display:block" contenteditable="false">
              <img src="${imageUrl}" class="w-full h-auto object-cover block mx-auto" style="width:100%;height:auto;object-fit:cover;display:block" />
              <div class="img-tools absolute bottom-3 right-3 z-30 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-[#EEF2FF] rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button type="button" class="edit-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Edit">
                  ${EDIT_SVG}
                </button>
                <button type="button" class="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer" title="Delete">
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
        
        // Replace the old src with the new local blobUrl in the content HTML string
        const newContent = content.replace(editingImgSrc, imageUrl);
        
        // Synchronously update the DOM ref to prevent the useEffect overwrite race condition
        if (editorRef.current) {
          editorRef.current.innerHTML = newContent;
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
    blobUrls.forEach(url => {
      const match = localFiles.find(f => f.id === url);
      if (match) {
        filesToUpload.push(match.file);
      }
    });
    
    return filesToUpload;
  };



  const handleOnPost = async () => {
    if (editorRef.current) {
      const cleanContent = stripEditorControls(editorRef.current.innerHTML);
      onContentChange(cleanContent);
    }
    const files = getFilesToUpload();
    await onPost(files);
  };

  const hasUnsavedChanges = () => {
    const cleanContent = editorRef.current ? stripEditorControls(editorRef.current.innerHTML) : content;
    
    if (isEdit) {
      const titleChanged = title.trim() !== initialDataRef.current.title.trim();
      const contentChanged = cleanContent !== initialDataRef.current.content;
      const coverChanged = (coverImage?.url || null) !== initialDataRef.current.coverImage;
      const hasLocalFiles = localFiles.length > 0;
      
      return titleChanged || contentChanged || coverChanged || hasLocalFiles;
    } else {
      const textContent = cleanContent.replace(/<[^>]*>/g, '').trim();
      return (
        title.trim().length > 0 ||
        textContent.length > 0 ||
        cleanContent.includes('<img') ||
        coverImage !== null ||
        localFiles.length > 0
      );
    }
  };

  const handleOnClose = async (skipConfirm?: boolean | React.MouseEvent) => {
    if (skipConfirm !== true && hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
      return;
    }
    if (editorRef.current) {
      const cleanContent = stripEditorControls(editorRef.current.innerHTML);
      onContentChange(cleanContent);
    }
    const files = getFilesToUpload();
    await onClose(files);
  };

  const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0 || content.includes('<img');
  const isNextActive = title.trim().length > 0 && hasContent && coverImage !== null;

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
            <div className="bg-[#EEF2FF] py-3.5 px-5 text-center">
              <h3 className="line-clamp-2 text-[13px] font-semibold text-[#312E81] font-poppins leading-tight">
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
          className="w-full overflow-y-auto custom-scrollbar resize-none rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/20"
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
          <button type="button" className="flex items-center gap-2 px-5 py-2 border border-[#818CF8] text-[#818CF8] bg-background rounded-full text-[14px] font-normal hover:bg-indigo-50 transition-colors">
            <Sparkles className="w-4 h-4" />
            Enhance with AI
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleOnPost}
            className={`flex items-center gap-2 px-8 py-2 rounded-full text-[14px] font-normal transition-colors disabled:cursor-not-allowed ${
              isCompanyPost 
                ? 'bg-[#1A73E8] hover:bg-[#1A73E8]/90 dark:bg-[#4D9CFF] dark:hover:bg-[#4D9CFF]/90 text-white disabled:bg-gray-200 dark:disabled:bg-[#2A2D35] disabled:text-gray-400 dark:disabled:text-[#A1A8B3]'
                : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white disabled:opacity-70'
            }`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 bg-background select-none h-full overflow-hidden">
      {/* Custom Styles * /}
      {/* Typography (h1/h2/p/ul/img/etc.) is shared with the published article views via the
          .article-editor selectors in globals.css, so what you see while writing matches what
          gets published. Only editor-specific chrome (the placeholder) lives here. * /}
      <style>{`
        .article-title-editor[contenteditable]:empty:before {
          content: attr(placeholder);
          color: #6B7280;
          font-family: var(--font-poppins), 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 40px;
          line-height: 48px;
          cursor: text;
        }
        [contenteditable]:not(.article-title-editor):empty:before {
          content: attr(placeholder);
          color: #6B7280;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          cursor: text;
        }
      `}</style>

      {/* Header Area * /}
      <div className="flex-shrink-0 bg-background flex flex-col pb-3 border-b border-border/20 shadow-xs z-30">
        {/* Top Row: Title & Back * /}
        <div className="flex items-center gap-3 px-[16px] pt-4 pb-4">
          <button 
            onClick={handleOnClose} 
            className="w-12 h-12 p-2 rounded-full outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex items-center justify-center transition-colors text-gray-500 hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[18px] font-medium text-black leading-tight font-poppins">Articles</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Write and share your ideas</p>
          </div>
        </div>

        {/* Second Row: Profile, Toolbar, Actions * /}
        <div className="relative flex items-center px-[16px] w-full" style={{ height: '56px' }}>
          {/* Author Line (Frame 43) * /}
          <div className="flex flex-row items-center gap-[8px]" style={{ height: '42px', padding: '0px' }}>
            {/* Frame 2608495 * /}
            <div className="flex flex-row items-center gap-[12px]" style={{ height: '42px', padding: '0px', flex: 'none' }}>
              <div className="w-[40px] h-[40px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm overflow-hidden font-['Poppins'] select-none shrink-0" style={{ flex: 'none' }}>
                {avatarSrc ? (
                  <img src={avatarSrc} className="w-full h-full object-cover" onError={(e) => { if (!isCompanyPost) (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                {!isCompanyPost && (!avatarSrc) && (
                  <span>{(authorName || 'A').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Frame 2608493 * /}
              <div className="flex flex-col items-start justify-center min-w-0" style={{ height: '42px', padding: '0px', flex: 'none', maxWidth: '180px' }}>
                <h4 className="text-[#000000] truncate w-full" style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px' }} title={authorName}>
                  {authorName}
                </h4>
                <p className="text-[#6B7280] truncate w-full" style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px' }} title={subtitleText}>
                  {subtitleText}
                </p>
              </div>
            </div>
          </div>

          {/* Pill Toolbar * /}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-row justify-center items-center gap-[8px] bg-[#FFFFFF] border border-[#000000] rounded-[24px]" style={{ width: '536px', height: '56px', padding: '8px 16px' }}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('bold')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Bold"
            >
              <Bold className="w-[20px] h-[20px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('italic')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Italic"
            >
              <Italic className="w-[20px] h-[20px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('H1')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 1"
            >
              <Heading1 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('H2')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 2"
            >
              <Heading2 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('H3')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 3"
            >
              <Heading3 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('insertUnorderedList')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Unordered List"
            >
              <List className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={openLinkModal}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Insert Link capsule"
            >
              <Icon icon="ant-design:link-outlined" className="w-[24px] h-[24px] text-[#000000]" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={triggerInlineImage}
              disabled={isUploadingInline}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all disabled:opacity-50"
              style={{ width: '56px', height: '40px' }}
              title="Insert Inline Image"
            >
              {isUploadingInline ? (
                <Loader2 className="w-[24px] h-[24px] text-[#000000] animate-spin" strokeWidth={1.5} />
              ) : (
                <Icon icon="stash:image" className="w-[24px] h-[24px] text-[#000000]" />
              )}
            </button>
          </div>

          {/* Action Buttons * /}
          <div className="ml-auto flex flex-row justify-center items-center gap-[8px]" style={{ width: '188px', height: '40px' }}>
            <button
              onClick={handleOnClose}
              className={`flex flex-row justify-center items-center rounded-[24px] transition-all border ${isCompanyPost ? 'bg-white dark:bg-[#0F1115] border-gray-200 dark:border-[#2A2D35] text-gray-500 dark:text-[#A1A8B3] hover:bg-gray-50 dark:hover:bg-[#121B2B]' : 'bg-white dark:bg-[#0B0F19] border-[#818CF8] text-[#818CF8]'}`}
              style={{ width: '90px', height: '40px', padding: '8px 16px', gap: '10px' }}
            >
              <span className="text-center" style={{ display: 'inline-block', width: '50px', height: '20px', fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                Cancel
              </span>
            </button>
            <button
              disabled={!isNextActive || isSubmitting}
              onClick={() => {
                if (isEdit || skipNextStep) {
                  handleOnPost();
                } else {
                  console.log("NEXT CLICKED");
                  onPreviewStepChange?.(true);
                  setStep(2);
                  onArticleComplete?.({
                    coverImage: coverImage,
                    title: title,
                    subtitle: plainArticleText,
                    content: content
                  });
                }
              }}
              className={`flex flex-row justify-center items-center rounded-[24px] transition-all ${
                isNextActive 
                  ? (isCompanyPost ? 'bg-[#1A73E8] hover:bg-[#1A73E8]/90 dark:bg-[#4D9CFF] dark:hover:bg-[#4D9CFF]/90 text-white dark:text-white' : 'bg-[#6366F1] text-white')
                  : (isCompanyPost ? 'bg-gray-100 dark:bg-[#2A2D35] text-gray-400 dark:text-[#A1A8B3]' : 'bg-[#C7D2FE] text-white')
              }`}
              style={{
                width: (isEdit || skipNextStep) ? '100px' : '90px',
                height: '40px',
                padding: '8px 16px',
                gap: '10px',
                cursor: isNextActive ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting && (isEdit || skipNextStep) && <Loader2 className={`w-4 h-4 animate-spin ${isCompanyPost ? 'text-white' : 'text-white'}`} />}
              <span className="text-center" style={{ display: 'inline-block', fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                {isEdit ? (isSubmitting ? 'Saving' : 'Save') : (skipNextStep ? (isSubmitting ? 'Posting' : 'Post') : 'Next')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Area * /}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 pt-6 pb-8 flex flex-col space-y-6 max-w-[600px] mx-auto w-full">

        {/* Cover Image — dedicated 2:1 cover preview modal & upload UI * /}
        <ArticleCoverEditor
          coverImage={coverImage?.url ?? null}
          onCoverChange={(url) => onCoverChange(url)}
          onRemoveCover={onRemoveCover}
          isEdit={isEdit}
        />

        {/* Hidden inputs & triggers * /}
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

        {/* Big Bold Title * /}
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
          className="article-title-editor w-full p-0 bg-transparent border-none outline-none focus:ring-0 text-[#000000] block h-auto min-h-[48px] flex-shrink-0 overflow-visible"
          style={{
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '40px',
            lineHeight: '48px',
            height: 'auto',
          }}
        />

        {/* Rich contentEditable area * /}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          {...{ placeholder: "Write your thoughts..." }}
          className="article-editor outline-none focus:ring-0 text-[#000000] min-h-[250px] pb-12 h-auto flex-shrink-0 overflow-visible"
          style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
        />
      </div>

      {/* Add Link Dialog Modal * /}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[32px] shadow-2xl p-8 flex flex-col relative animate-in zoom-in-95 duration-200 font-poppins" style={{ width: '400px', height: '338px' }}>

            <button onClick={() => { setIsLinkModalOpen(false); setEditingLinkNode(null); }} className="absolute top-6 right-6 text-red-400 hover:text-red-500 transition-all">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div className="flex flex-col items-center mt-0 mb-6">
              <h3 className="font-semibold text-[16px] text-[#000000]">
                {editingLinkNode ? 'Edit link' : 'Add link'}
              </h3>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[#000000]">Title</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. cocpit"
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] bg-[#FFFFFF] outline-none rounded-[16px] text-[14px] text-[#000000] focus:border-[#818CF8] placeholder-[#9CA3AF]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[#000000]">Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. https://yourproject.com"
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] bg-[#FFFFFF] outline-none rounded-[16px] text-[14px] text-[#000000] focus:border-[#818CF8] placeholder-[#9CA3AF]"
                />
                {linkUrl.trim() && !isValidUrl(linkUrl) && (
                  <span className="text-[11px] text-red-500">Enter a valid URL.</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-auto pb-1">
              <button
                onClick={() => { setIsLinkModalOpen(false); setEditingLinkNode(null); }}
                className="flex items-center justify-center flex-1 py-2.5 border border-[#818CF8] bg-[#FFFFFF] text-[#818CF8] rounded-[24px] text-[14px] transition-all hover:bg-indigo-50"
              >
                Cancel
              </button>
              <button
                disabled={!isLinkFormValid}
                onClick={handleAddLink}
                className={cn(
                  "flex items-center justify-center flex-1 py-2.5 rounded-[24px] text-[14px] transition-all",
                  isLinkFormValid
                    ? "bg-[#6366F1] text-[#FFFFFF] hover:bg-[#4F46E5] cursor-pointer"
                    : "bg-[#C7D2FE] text-[#FFFFFF] cursor-not-allowed"
                )}
              >
                {editingLinkNode ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Overlay * /}
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

*/
export {};
