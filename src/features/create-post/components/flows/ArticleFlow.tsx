import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, 
  Image as ImageIcon, UploadCloud, X, ArrowLeft, Loader2, Sparkles, Smile
} from 'lucide-react';
import { MediaItem } from '../../types';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';

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
  currentUser: any;
  currentPoster: any;
  isCompanyPost: boolean;
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
  isCompanyPost
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

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection(savedRange);

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const title = linkTitle.trim() || formattedUrl;
    
    const linkHtml = `
      <div class="inline-flex flex-col gap-1 my-1 align-bottom" contenteditable="false">
        <a href="${formattedUrl}" target="_blank" class="text-[#6366F1] font-medium text-[16px] leading-[24px] no-underline hover:no-underline cursor-pointer" style="font-family: 'Poppins', sans-serif;">${title}</a>
        <div class="inline-flex items-center gap-4 px-3 py-1.5 bg-[#EEF2FF] rounded-[24px]">
          <span class="text-[12px] text-[#6366F1] max-w-[200px] truncate">${formattedUrl}</span>
          <div class="flex items-center gap-2">
            <button type="button" class="edit-link-btn cursor-pointer hover:bg-indigo-100 p-0.5 rounded transition-colors" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button type="button" class="delete-link-btn cursor-pointer hover:bg-red-50 p-0.5 rounded transition-colors" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>&nbsp;
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
            <div class="relative my-4 inline-block w-full" contenteditable="false" onmouseenter="this.querySelector('.img-tools').style.opacity='1'" onmouseleave="this.querySelector('.img-tools').style.opacity='0'">
              <img src="${imageUrl}" class="w-full object-cover max-h-[350px]" />
              <div class="img-tools absolute bottom-3 right-3 flex items-center gap-2 bg-[#EEF2FF] px-3 py-1.5 rounded-[24px] shadow-sm transition-opacity duration-200" style="opacity: 0;">
                <button type="button" class="cursor-pointer hover:bg-indigo-100 p-0.5 rounded transition-colors" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button type="button" class="cursor-pointer hover:bg-red-50 p-0.5 rounded transition-colors" title="Delete" onclick="this.closest('.relative').remove();">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              </div>
            </div>&nbsp;
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

  if (step === 2) {
    return (
      <div className="flex flex-col flex-1 bg-[#FFFFFF] select-none font-poppins relative animate-in fade-in slide-in-from-bottom-4 duration-300 w-full h-full p-8">
        <button onClick={onClose} className="absolute top-6 right-6 text-red-400 hover:text-red-500 transition-colors z-10">
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col max-w-[600px] mx-auto w-full pt-4 pb-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-[18px] text-[#000000]">Create</h3>
            <p className="text-[12px] text-[#6B7280]">Post jobs, insights, or milestones to grow your presence.</p>
          </div>

          {/* Author */}
          <div className="w-full flex items-center gap-3 pt-2">
            <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col">
              <h5 className="font-medium text-[15px] text-[#000000] leading-tight">{authorName}</h5>
              <p className="text-[12px] text-[#6B7280]">@{authorSlug}</p>
            </div>
          </div>

          {/* Article Card Preview */}
          <div className="w-full max-w-[500px] mx-auto rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-transparent">
            <div className="w-full h-[220px] overflow-hidden">
              {coverImage && (
                <img src={coverImage.url} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="w-full bg-[#EEF2FF] p-4 flex items-center justify-center">
              <span className="font-semibold text-[14px] text-[#000000] text-center line-clamp-1">{title}</span>
            </div>
          </div>

          {/* Caption block */}
          <div className="w-full flex flex-col relative pt-4 pb-4">
            <textarea
              value={caption || ''}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Say something about your article..."
              rows={2}
              className="w-full py-2 bg-transparent border-none outline-none focus:ring-0 text-[#000000] text-[14px] resize-none pr-10 placeholder-[#9CA3AF]"
            />
            <button type="button" onClick={triggerInlineImage} disabled={isUploadingInline} className="p-2 text-foreground/70 hover:bg-muted rounded-xl transition-colors disabled:opacity-50">
            {isUploadingInline ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <ImageIcon className="w-[18px] h-[18px]" />}
          </button>
          </div>

          {/* Footer Actions */}
          <div className="w-full flex items-center justify-between pt-2">
            <button className="flex items-center justify-center px-6 py-2.5 border border-[#818CF8] text-[#818CF8] bg-[#FFFFFF] rounded-[24px] text-[14px] font-normal transition-all hover:bg-indigo-50">
              Enhance with AI
            </button>
            <button 
              disabled={isSubmitting}
              onClick={onPost}
              className="flex items-center justify-center px-10 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-[#FFFFFF] rounded-[24px] text-[14px] font-normal transition-all cursor-pointer disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
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
          color: #9ca3af;
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
      <div className="flex flex-col border-b border-border/40">
        {/* Top Row: Title & Back */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <button onClick={onClose} className="w-10 h-10 border border-border/60 hover:bg-muted flex items-center justify-center rounded-full transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[16px] font-bold text-foreground leading-tight">Articles</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Write and share your ideas</p>
          </div>
        </div>

        {/* Second Row: Profile, Toolbar, Actions */}
        <div className="flex flex-row items-center justify-between px-[16px] pb-[16px] w-full" style={{ height: '56px' }}>
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
          <div className="flex flex-row justify-center items-center gap-[8px] bg-[#FFFFFF] border border-[#000000] rounded-[24px]" style={{ width: '472px', height: '56px', padding: '8px 16px', margin: '0 auto' }}>
            <button 
              onClick={() => format('bold')} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Bold"
            >
              <Bold className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => format('italic')} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Italic"
            >
              <Italic className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => format('formatBlock', 'H1')} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 1"
            >
              <Heading1 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => format('formatBlock', 'H2')} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Heading 2"
            >
              <Heading2 className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => format('insertUnorderedList')} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Unordered List"
            >
              <List className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={openLinkModal} 
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all"
              style={{ width: '56px', height: '40px' }}
              title="Insert Link capsule"
            >
              <LinkIcon className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
            </button>
            <button 
              onClick={triggerInlineImage} 
              disabled={isUploadingInline}
              className="flex justify-center items-center bg-[#FFFFFF] rounded-[24px] hover:bg-muted transition-all disabled:opacity-50"
              style={{ width: '56px', height: '40px' }}
              title="Insert Inline Image"
            >
              {isUploadingInline ? (
                <Loader2 className="w-[24px] h-[24px] text-[#000000] animate-spin" strokeWidth={1.5} />
              ) : (
                <ImageIcon className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row justify-center items-start gap-[8px]" style={{ width: '188px', height: '40px' }}>
            <button 
              onClick={onClose} 
              className="flex flex-row justify-center items-center bg-[#FFFFFF] border border-[#818CF8] rounded-[24px] transition-all"
              style={{ width: '90px', height: '40px', padding: '8px 16px', gap: '10px' }}
            >
              <span className="text-center text-[#818CF8]" style={{ fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                Cancel
              </span>
            </button>
            <button 
              disabled={!isNextActive} 
              onClick={() => setStep(2)}
              className="flex flex-row justify-center items-center border border-[#FFFFFF] rounded-[24px] transition-all shadow-sm"
              style={{ 
                width: '90px', 
                height: '40px', 
                padding: '8px 16px', 
                gap: '10px',
                background: isNextActive ? '#6366F1' : '#C7D2FE',
                cursor: isNextActive ? 'pointer' : 'not-allowed'
              }}
            >
              <span className="text-center text-[#FFFFFF]" style={{ fontFamily: 'Poppins', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>
                Next
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col space-y-6 max-w-[600px] mx-auto w-full">

        {/* Cover Image cloud box / preview */}
        <div className="w-full">
          {coverImage ? (
            <div className="relative w-full aspect-[4/1] rounded-2xl overflow-hidden border border-border group bg-muted/20">
              <img src={coverImage.url} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-[#EEF2FF] px-3 py-1.5 rounded-[24px] shadow-sm">
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  className="cursor-pointer hover:bg-indigo-100 p-0.5 rounded transition-colors" 
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button 
                  onClick={onRemoveCover}
                  className="cursor-pointer hover:bg-red-50 p-0.5 rounded transition-colors" 
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="flex flex-col items-center justify-center bg-[#FFFFFF] rounded-2xl cursor-pointer p-4 text-center"
              style={{ width: '600px', height: '178px', margin: '0 auto' }}
            >
              <h5 className="font-semibold text-[16px] text-foreground font-poppins">Cover image</h5>
              <p className="text-[12px] text-muted-foreground mt-1 mb-6 font-poppins">Add a cover image or video to your article.</p>
              
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="w-[40px] h-[40px] text-muted-foreground mb-4"
              >
                <path fill="currentColor" fillRule="evenodd" d="M12 2.5a5.5 5.5 0 0 0-5.02 3.25a23 23 0 0 1-.186.41l-.068.132a.5.5 0 0 1-.127.14a.5.5 0 0 1-.18.058c-.036.007-.11.01-.419.01a3.5 3.5 0 1 0 0 7h.672l1-1H6a2.5 2.5 0 0 1 0-5h.054c.226 0 .413 0 .562-.03c.18-.036.358-.09.526-.2c.168-.108.29-.248.398-.398c.058-.08.11-.184.157-.283q.074-.159.193-.424l.002-.005a4.501 4.501 0 0 1 8.216 0l.002.006q.119.264.193.423c.047.099.099.202.157.283c.107.15.23.29.398.399s.346.163.526.2c.149.03.336.03.562.029H18a2.5 2.5 0 0 1 0 5h-1.672l1 1H18a3.5 3.5 0 1 0 0-7c-.309 0-.383-.003-.418-.01a.5.5 0 0 1-.18-.059a.5.5 0 0 1-.128-.14l-.016-.027l-.052-.105a23 23 0 0 1-.186-.409A5.5 5.5 0 0 0 12 2.5" clipRule="evenodd"/>
                <path fill="currentColor" d="m12 12l-.354-.354l.354-.353l.354.353zm.5 9a.5.5 0 0 1-1 0zm-4.854-5.354l4-4l.708.708l-4 4zm4.708-4l4 4l-.708.708l-4-4zM12.5 12v9h-1v-9z"/>
              </svg>
              
              <div className="flex flex-col gap-1 items-center font-poppins">
                <span className="text-[10px] text-muted-foreground">
                  JPG, PNG, WEBP (Max 5MB)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Recommended: 1200 x 300 px
                </span>
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
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. https://yourproject.com"
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] bg-[#FFFFFF] outline-none rounded-[16px] text-[14px] text-[#000000] focus:border-[#818CF8] placeholder-[#9CA3AF]"
                />
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
                disabled={!linkUrl.trim()}
                onClick={handleAddLink}
                className={cn(
                  "flex items-center justify-center flex-1 py-2.5 rounded-[24px] text-[14px] transition-all",
                  linkUrl.trim() 
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
