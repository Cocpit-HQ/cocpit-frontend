import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Heading1, Heading2, List, Link as LinkIcon,
  Image as ImageIcon, X, ArrowLeft, ChevronLeft, Loader2, Sparkles, Send
} from 'lucide-react';
import { Icon } from '@iconify/react';
import { MediaItem } from '../../types';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';

type ArticleIdentity = {
  name?: string | null;
  username?: string | null;
  image?: string | null;
  org_slug?: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
} | null | undefined;

interface ArticleFlowProps {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (html: string) => void;
  coverImage: MediaItem | null;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover: () => void;
  isEdit: boolean;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  caption: string;
  onCaptionChange: (value: string) => void;
  onPost: () => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
  currentUser: ArticleIdentity;
  currentPoster: ArticleIdentity;
  isCompanyPost: boolean;
  onPreviewStepChange?: (isPreview: boolean) => void;
  onArticleComplete?: (data: { coverImage: MediaItem | null; title: string; subtitle: string; content: string }) => void;
}

const ArticleFlow = ({
  title,
  onTitleChange,
  content,
  onContentChange,
  coverImage,
  onCoverUpload,
  onRemoveCover,
  isEdit,
  coverInputRef,
  caption,
  onCaptionChange,
  onPost,
  isSubmitting,
  onClose,
  currentUser,
  currentPoster,
  isCompanyPost,
  onPreviewStepChange,
  onArticleComplete
}: ArticleFlowProps) => {
  const [step, setStep] = useState(1);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [editingLinkNode, setEditingLinkNode] = useState<HTMLElement | null>(null);
  const [isUploadingInline, setIsUploadingInline] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  // Initialize innerHTML only once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // Update innerHTML from parent if it diverges and editor is not focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange(e.currentTarget.innerHTML);
  };

  const format = (command: string, value: string = '') => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
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

    const linkHtml = `
      <div class="inline-flex flex-col gap-1 my-1 align-bottom group" contenteditable="false">
        <a href="${safeUrl}" target="_blank" class="text-[#6366F1] font-medium text-[16px] leading-[24px] no-underline hover:no-underline cursor-pointer" style="font-family: 'Poppins', sans-serif;">${safeTitle}</a>
        <div class="inline-flex items-center gap-4 px-3 py-1.5 bg-[#EEF2FF] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span class="text-[12px] text-[#6366F1] max-w-[200px] truncate">${safeUrl}</span>
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button type="button" class="edit-link-btn cursor-pointer hover:bg-indigo-100 p-0.5 rounded transition-colors" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button type="button" class="delete-link-btn cursor-pointer hover:bg-red-50 p-0.5 rounded transition-colors" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div><span> </span>
    `;

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

    // Handle inline link Edit button
    const editLinkBtn = target.closest('.edit-link-btn');
    if (editLinkBtn) {
      const linkBlock = editLinkBtn.closest('.inline-flex.flex-col') as HTMLElement | null;
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
      const linkBlock = deleteLinkBtn.closest('.inline-flex.flex-col');
      if (linkBlock) {
        linkBlock.remove();
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
      setIsUploadingInline(true);
      try {
        const urls = await uploadMedia([file]);
        if (urls && urls.length > 0) {
          const imageUrl = typeof urls[0] === 'string' ? urls[0] : urls[0].url;
          const imageHtml = `
            <div class="relative my-4 w-full h-[178px] overflow-hidden border border-border group bg-[#D9D9D9]" contenteditable="false" onmouseenter="this.querySelector('.img-tools').style.opacity='1'" onmouseleave="this.querySelector('.img-tools').style.opacity='0'">
              <img src="${imageUrl}" class="w-full h-full object-cover" />
              <div class="img-tools absolute bottom-3 right-3 flex items-center gap-2 bg-[#EEF2FF] px-3 py-1.5 rounded-[24px] shadow-sm transition-opacity duration-200" style="opacity: 0;">
                <button type="button" class="p-1.5 text-zinc-500 hover:text-[#6366F1] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.44 5.78L4.198 16.02a2 2 0 0 0-.565 1.125l-.553 3.774l3.775-.553A2 2 0 0 0 7.98 19.8L18.22 9.56m-3.78-3.78l2.229-2.23a1.6 1.6 0 0 1 2.263 0l1.518 1.518a1.6 1.6 0 0 1 0 2.263l-2.23 2.23M14.44 5.78l3.78 3.78"/></svg>
                </button>
                <button type="button" class="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors cursor-pointer" title="Delete" onclick="this.closest('.relative').remove();">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="currentColor" d="M7 3h2a1 1 0 0 0-2 0M6 3a2 2 0 1 1 4 0h4a.5.5 0 0 1 0 1h-.564l-1.205 8.838A2.5 2.5 0 0 1 9.754 15H6.246a2.5 2.5 0 0 1-2.477-2.162L2.564 4H2a.5.5 0 0 1 0-1zm1 3.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0zM9.5 6a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-4.74 6.703A1.5 1.5 0 0 0 6.246 14h3.508a1.5 1.5 0 0 0 1.487-1.297L12.427 4H3.573z"/></svg>
                </button>
              </div>
            </div><span> </span>
          `;
          editorRef.current?.focus();
          document.execCommand('insertHTML', false, imageHtml);
          onContentChange(editorRef.current?.innerHTML || '');
        }
      } catch (err) {
        console.error("Failed to upload inline image", err);
      } finally {
        setIsUploadingInline(false);
      }
    }
    e.target.value = '';
  };

  const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0 || content.includes('<img');
  const isNextActive = title.trim().length > 0 && hasContent && coverImage !== null;

  const authorName = isCompanyPost ? (currentPoster?.name || 'Company') : (currentUser?.name || 'User');
  const authorSlug = isCompanyPost ? (currentPoster?.org_slug || 'company') : (currentUser?.username || 'user');
  const avatarSrc = isCompanyPost
    ? (currentPoster?.logo_url || currentPoster?.avatar_url || '/assets/pngegg.png')
    : (currentUser?.image || '/assets/pngegg.png');
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
            <p className="text-[12px] text-muted-foreground truncate">@{authorSlug}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={generatedArticleUrl}
            onClick={(e) => e.preventDefault()}
            className="group w-full max-w-[420px] bg-card border border-border rounded-[24px] overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-full h-[180px] overflow-hidden">
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
            onClick={onPost}
            className="flex items-center gap-2 px-8 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full text-[14px] font-normal transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background select-none h-full overflow-hidden">
      {/* Custom Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #6B7280;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          cursor: text;
        }
        .article-editor h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .article-editor h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .article-editor ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .article-editor p {
          margin-bottom: 0.5rem;
        }
      `}</style>

      {/* Header Area */}
      <div className="flex flex-col">
        {/* Top Row: Title & Back */}
        <div className="flex items-center gap-3 px-[16px] pt-4 pb-4">
          <button 
            onClick={onClose} 
            className="w-12 h-12 p-2 rounded-full outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex items-center justify-center transition-colors text-gray-500 hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[18px] font-medium text-black leading-tight font-poppins">Articles</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Write and share your ideas</p>
          </div>
        </div>

        {/* Second Row: Profile, Toolbar, Actions */}
        <div className="relative flex items-center px-[16px] w-full" style={{ height: '56px' }}>
          {/* Author Line (Frame 43) */}
          <div className="flex flex-row items-center gap-[8px]" style={{ height: '42px', padding: '0px' }}>
            {/* Frame 2608495 */}
            <div className="flex flex-row items-center gap-[12px]" style={{ height: '42px', padding: '0px', flex: 'none' }}>
              <img src={avatarSrc} className="w-[40px] h-[40px] rounded-full object-cover" style={{ flex: 'none' }} />

              {/* Frame 2608493 */}
              <div className="flex flex-col items-start justify-center" style={{ height: '42px', padding: '0px', flex: 'none' }}>
                <h4 className="text-[#000000]" style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px' }}>
                  {authorName}
                </h4>
                <p className="text-[#6B7280]" style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px' }}>
                  @{authorSlug}
                </p>
              </div>
            </div>
          </div>

          {/* Pill Toolbar */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-row justify-center items-center gap-[8px] bg-[#FFFFFF] border border-[#000000] rounded-[24px]" style={{ width: '472px', height: '56px', padding: '8px 16px' }}>
            <button
              onClick={() => format('bold')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Bold"
            >
              <Bold className="w-[20px] h-[20px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => format('italic')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Italic"
            >
              <Italic className="w-[20px] h-[20px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => format('formatBlock', 'H1')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 1"
            >
              <Heading1 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => format('formatBlock', 'H2')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 2"
            >
              <Heading2 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => format('insertUnorderedList')}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Unordered List"
            >
              <List className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button
              onClick={openLinkModal}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Insert Link capsule"
            >
              <Icon icon="ant-design:link-outlined" className="w-[24px] h-[24px] text-[#000000]" />
            </button>
            <button
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

          {/* Action Buttons */}
          <div className="ml-auto flex flex-row justify-center items-center gap-[8px]" style={{ width: '188px', height: '40px' }}>
            <button
              onClick={onClose}
              className="flex flex-row justify-center items-center bg-[#FFFFFF] border border-[#818CF8] rounded-[24px] transition-all"
              style={{ width: '90px', height: '40px', padding: '8px 16px', gap: '10px' }}
            >
              <span className="text-center text-[#818CF8]" style={{ display: 'inline-block', width: '50px', height: '20px', fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                Cancel
              </span>
            </button>
            <button
              disabled={!isNextActive}
              onClick={() => {
                console.log("NEXT CLICKED");
                onPreviewStepChange?.(true);
                setStep(2);
                onArticleComplete?.({
                  coverImage: coverImage,
                  title: title,
                  subtitle: plainArticleText,
                  content: content
                });
              }}
              className="flex flex-row justify-center items-center border border-[#FFFFFF] rounded-[24px] transition-all"
              style={{
                width: '90px',
                height: '40px',
                padding: '8px 16px',
                gap: '10px',
                background: isNextActive ? '#6366F1' : '#C7D2FE',
                cursor: isNextActive ? 'pointer' : 'not-allowed'
              }}
            >
              <span className="text-center text-[#FFFFFF]" style={{ display: 'inline-block', width: '31px', height: '20px', fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                Next
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pt-6 pb-8 flex flex-col space-y-6 max-w-[600px] mx-auto w-full">

        {/* Cover Image cloud box / preview */}
        <div className="w-full">
          {coverImage ? (
            <div className="relative w-full h-[178px] overflow-hidden border border-border group bg-[#D9D9D9]">
              <img src={coverImage.url} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-[#EEF2FF] px-3 py-1.5 rounded-[24px] shadow-sm">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="p-1.5 text-gray-500 hover:text-[#6366F1] hover:bg-secondary rounded-full transition-colors"
                  title="Edit"
                >
                  <Icon icon="proicons:pencil" className="w-[24px] h-[24px] text-foreground" style={{ strokeWidth: '1.5px', stroke: 'currentColor' }} />
                </button>
                <button
                  type="button"
                  onClick={onRemoveCover}
                  className="p-1.5 text-[#FF6B6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                  title="Delete"
                >
                  <Icon icon="fluent:delete-16-regular" className="w-[24px] h-[24px]" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => coverInputRef.current?.click()}
              className="flex flex-col items-center justify-center bg-[#FFFFFF] rounded-2xl cursor-pointer p-4 text-center w-full gap-10"
              style={{ minHeight: '178px', margin: '0 auto' }}
            >
              {/* First Group: Title + Subtitle */}
              <div className="flex flex-col items-center gap-2">
                <h5 className="w-[118px] h-[26px] font-medium text-[18px] leading-[26px] text-[#000000] text-center font-poppins">Cover image</h5>
                <p className="w-[255px] h-[16px] font-normal text-[12px] leading-[16px] text-[#6B7280] text-center font-poppins">Add a cover image or video to your article.</p>
              </div>

              {/* Second Group: Upload Icon + File Type Hints */}
              <div className="flex flex-col items-center gap-4">
                <Icon
                  icon="iconoir:cloud-upload"
                  className="w-[40px] h-[40px] text-muted-foreground flex-shrink-0"
                />

                <div className="flex flex-col items-center font-poppins">
                  <span className="inline-block w-[105px] h-[16px] font-normal text-[8px] leading-[16px] text-[#6B7280] text-center font-poppins">
                    JPG, PNG, WEBP (Max 5MB)
                  </span>
                  <span className="inline-block w-[119px] h-[16px] font-normal text-[8px] leading-[16px] text-[#6B7280] text-center font-poppins">
                    Recommended: 1200 x 300 px
                  </span>
                </div>
              </div>
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={onCoverUpload}
            className="hidden"
          />
        </div>

        {/* Hidden inputs & triggers */}
        <input
          ref={inlineImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleInlineImageUpload}
          className="hidden"
        />

        {/* Big Bold Title */}
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title"
          className="w-full px-0 bg-transparent border-none outline-none focus:ring-0 placeholder-[#6B7280] text-[#000000]"
          style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 600, fontSize: '24px', lineHeight: '32px' }}
        />

        {/* Rich contentEditable area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          {...{ placeholder: "Write your thoughts..." }}
          className="article-editor outline-none focus:ring-0 text-[#000000] min-h-[250px] pb-12"
          style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }}
        />
      </div>

      {/* Add Link Dialog Modal */}
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
    </div>
  );
};

export default ArticleFlow;
