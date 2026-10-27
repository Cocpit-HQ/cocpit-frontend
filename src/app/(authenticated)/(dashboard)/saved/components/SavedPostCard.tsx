import React, { useState } from "react";
import { Post } from "@/types/entities";
import { toggleSavePost } from "@/features/settings/api/savedPost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RepostIcon, PlayIcon, Icon, BusinessBuildingIcon, UserIcon } from "@/components/icons";
import { saveScrollPosition } from "@/hooks/use-scroll-restoration";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SavedPostCardProps {
  post: Post;
  folderId?: string;
  onUnsave: (postId: string) => void;
}

export function SavedPostCard({
  post,
  folderId,
  onUnsave,
}: SavedPostCardProps) {
  const [isUnsaving, setIsUnsaving] = useState(false);
  const router = useRouter();

  const handlePostClick = (postId: string) => {
    saveScrollPosition("saved", postId);
    router.push(`/post/${postId}`);
  };

  const handleUnsave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnsaving) return;
    setIsUnsaving(true);
    try {
      await toggleSavePost(post.id);
      toast.success("Post unsaved");
      onUnsave(post.id);
    } catch (error) {
      console.error("Failed to unsave post", error);
      toast.error("Failed to unsave post");
      setIsUnsaving(false);
    }
  };

  const formatPostText = (text?: string | null) => {
    if (!text) return "";
    return text
      .replace(/@\[(.*?)\]\([^)]+\)/g, "@$1")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isArticle =
    post.category?.toLowerCase() === "article" ||
    post.post_type?.toLowerCase() === "article" ||
    post.type?.toLowerCase() === "article" ||
    post.is_community_article ||
    !!post.articleBody;
  const isRepost = !!post.shared_post;
  const isRepostWithThoughts =
    isRepost && post.content && post.content.trim().length > 0;

  const sharedPostMedia =
    post.shared_post?.imageSrc ||
    post.shared_post?.images?.[0] ||
    post.shared_post?.videoSrc;
  const sharedIsVideo =
    !!post.shared_post?.videoSrc ||
    (sharedPostMedia &&
      typeof sharedPostMedia === "string" &&
      sharedPostMedia.toLowerCase().match(/\.(mp4|mov|webm)$/i));

  const postImage = post.videoSrc || post.imageSrc || post.images?.[0];
  const isVideo =
    !!post.videoSrc ||
    (postImage &&
      typeof postImage === "string" &&
      postImage.toLowerCase().match(/\.(mp4|mov|webm)$/i));

  const cleanText = formatPostText(
    post.content ||
      (post as any).articleBody ||
      (post as any).title ||
      (post as any).caption ||
      "",
  );

  const isPoll = post.post_type === "poll" || (post as any).postType === "poll";
  const pollVotes = (post as any).votes || 0;
  const pollClosedText =
    (post as any).isPollActive === false ? " • Poll closed" : "";

  const AuthorHeader = ({
    p,
    isNested = false,
  }: {
    p: Post;
    isNested?: boolean;
  }) => {
    const isCompany = Boolean(p.isCompanyPost || (p as any).author_org_id);
    const hasValidAvatar = Boolean(p.authorAvatar && p.authorAvatar !== "null");

    const handleAuthorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompany) {
        const slugOrId = p.authorSlug || (p as any).author_org_id || p.authorId;
        if (slugOrId) {
          router.push(`/organization/${slugOrId}`);
        }
      } else if (p.authorId) {
        router.push(`/profile/${p.authorId}`);
      }
    };

    return (
      <div
        onClick={handleAuthorClick}
        className="flex h-[36px] items-center gap-[8px] cursor-pointer group min-w-0"
      >
        <Avatar
          className={cn(
            "h-[32px] w-[32px] shrink-0",
            isCompany ? "rounded-[8px]" : "rounded-full"
          )}
        >
          <AvatarImage
            src={hasValidAvatar ? p.authorAvatar : ""}
            alt={p.author}
            className={cn(
              "object-cover",
              isCompany ? "rounded-[8px]" : "rounded-full"
            )}
          />
          <AvatarFallback
            className={cn(
              "bg-ds-surface-1 border border-ds-border",
              isCompany ? "rounded-[8px]" : "rounded-full"
            )}
          >
            {isCompany ? (
              <BusinessBuildingIcon className="w-full h-full p-1 text-ds-text-primary" />
            ) : (
              <UserIcon className="w-[60%] h-[60%] text-current" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center items-start min-w-0">
          <span
            className={`text-[16px] leading-[24px] font-semibold text-ds-text-primary ${
              !isNested ? "group-hover:text-white transition-colors" : ""
            } truncate w-full max-w-[200px] sm:max-w-[300px]`}
          >
            {p.author}
          </span>
          {p.authorHeadline && (
            <span className="text-[10px] leading-[12px] font-normal text-ds-text-muted truncate w-full max-w-[200px] sm:max-w-[300px]">
              {p.authorHeadline}
            </span>
          )}
        </div>
      </div>
    );
  };

  const BookmarkButton = () => (
    <div className="flex flex-col items-center justify-center shrink-0">
      <button
        type="button"
        onClick={handleUnsave}
        className="p-1 hover:opacity-80 transition-opacity cursor-pointer text-ds-accent shrink-0"
        title="Remove from saved"
      >
        <Icon name="save-filled" className="size-5 text-current" />
      </button>
    </div>
  );

  if (isArticle) {
    return (
      <article
        className="flex w-full flex-col items-start gap-[12px] cursor-pointer"
        onClick={() => handlePostClick(post.id)}
      >
        {/* Frame 2608569: Author Header */}
        <div className="flex h-[36px] w-full items-center justify-between gap-[8px]">
          <AuthorHeader p={post} />
          <BookmarkButton />
        </div>

        {/* Frame 2609529: Article Card Box */}
        <div className="box-border flex h-[126px] w-[232px] flex-col justify-center items-start gap-[12px] rounded-[8px] border-[0.5px] border-[#2C2C33] px-[12px] py-[8px]">
          <div className="flex h-[81px] w-[207px] shrink-0 overflow-hidden rounded-[4px]">
            <img
              src={postImage || ""}
              alt=""
              className="h-[81px] w-[207px] object-cover"
            />
          </div>
          <p className="h-[16px] w-[207px] overflow-hidden truncate text-[12px] leading-[16px] font-semibold text-[#FFECE6]">
            {post.title || cleanText}
          </p>
        </div>
      </article>
    );
  }

  // Frame 2609261: Repost With Thoughts — Media Post (NO repost indicator tag at top)
  if (isRepostWithThoughts && sharedPostMedia) {
    const mediaUrl = sharedPostMedia;
    return (
      <article
        className="flex w-full flex-col items-start gap-[12px] cursor-pointer"
        onClick={() => handlePostClick(post.id)}
      >
        {/* Frame 2609527: Reposter header */}
        <div className="flex h-[36px] w-full items-center justify-between gap-[8px]">
          <AuthorHeader p={post} />
          <BookmarkButton />
        </div>

        {/* Frame 2609297: Thoughts text */}
        <div className="flex w-full flex-col">
          <p className="w-full text-[14px] leading-[20px] font-normal text-[#FFECE6] line-clamp-2">
            {formatPostText(post.content)}
          </p>
        </div>

        {/* Frame 2609288: Nested original post container (24px inset on sides) */}
        <div className="flex w-full justify-center">
          <div className="box-border flex w-[calc(100%-48px)] flex-col items-start gap-[12px] rounded-[12px] border border-[#2C2C33] p-[12px]">
            {/* Frame 2609298: Original author */}
            <div className="flex h-[36px] w-full items-center gap-[6px]">
              <AuthorHeader p={post.shared_post as Post} isNested />
            </div>

            {/* Frame 2609297: Original media + text */}
            <div className="flex h-[76px] w-full items-center gap-[16px]">
              {/* Media */}
              <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-ds-surface-2">
                {sharedIsVideo ? (
                  <>
                    <video
                      src={mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-black/50 border border-white/20">
                        <Icon
                          name="play"
                          className="h-[14px] w-[14px] text-white ml-0.5"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                )}
              </div>

              {/* Original text */}
              <p className="h-[60px] min-w-0 flex-1 text-[14px] leading-[20px] font-normal text-[#FFECE6] line-clamp-3">
                {formatPostText(post.shared_post?.content)}
              </p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Frame 2609262: Repost With Thoughts — Normal Text Post (NO repost indicator tag at top)
  if (isRepostWithThoughts && !sharedPostMedia) {
    return (
      <article
        className="flex w-full flex-col items-start gap-[12px] cursor-pointer"
        onClick={() => handlePostClick(post.id)}
      >
        {/* Frame 2609527: Reposter header */}
        <div className="flex h-[36px] w-full items-center justify-between gap-[8px]">
          <AuthorHeader p={post} />
          <BookmarkButton />
        </div>

        {/* Thoughts text */}
        <p className="w-full text-[14px] leading-[20px] font-normal text-[#FFECE6] line-clamp-2">
          {formatPostText(post.content)}
        </p>

        {/* Frame 2609288: Nested original text post (24px inset on sides) */}
        <div className="flex w-full justify-center">
          <div className="box-border flex w-[calc(100%-48px)] flex-col items-start gap-[12px] rounded-[12px] border border-[#2C2C33] p-[12px]">
            {/* Original author */}
            <div className="flex h-[36px] w-full items-center gap-[6px]">
              <AuthorHeader p={post.shared_post as Post} isNested />
            </div>

            {/* Original text */}
            <p className="w-full text-[14px] leading-[20px] font-normal text-[#FFECE6] line-clamp-2">
              {formatPostText(post.shared_post?.content)}
            </p>
          </div>
        </div>
      </article>
    );
  }

  // Frame 2608601: Simple Repost (pure repost without thoughts)
  if (isRepost) {
    const sharedCleanText = formatPostText(
      post.shared_post?.content ||
        (post.shared_post as any)?.articleBody ||
        (post.shared_post as any)?.title ||
        post.content ||
        ""
    );
    const sharedIsPoll =
      post.shared_post?.post_type === "poll" ||
      (post.shared_post as any)?.postType === "poll" ||
      !!post.shared_post?.poll;
    const sharedPollVotes =
      (post.shared_post as any)?.votes ||
      (post.shared_post?.poll as any)?.total_votes ||
      0;
    const sharedPollClosedText =
      (post.shared_post as any)?.isPollActive === false ? " • Poll closed" : "";

    const sharedIsArticle =
      post.shared_post?.category?.toLowerCase() === "article" ||
      post.shared_post?.post_type?.toLowerCase() === "article" ||
      post.shared_post?.type?.toLowerCase() === "article" ||
      post.shared_post?.is_community_article ||
      !!post.shared_post?.articleBody;

    return (
      <article
        className="flex w-full flex-col items-start gap-[12px] cursor-pointer rounded-lg transition-colors group"
        onClick={() => handlePostClick(post.id)}
      >
        {/* Frame 2609526: Repost indicator */}
        <div className="flex h-[12px] w-full items-center gap-[8px] self-start">
          <RepostIcon className="h-[12px] w-[12px] shrink-0 text-[#B8ADA8]" />
          <span className="text-[10px] leading-[12px] font-normal text-[#B8ADA8]">
            {post.author} reposted
          </span>
        </div>

        {/* Frame 2608569: Original author header + Bookmark */}
        <div className="flex h-[36px] w-full items-center justify-between gap-[8px]">
          <AuthorHeader p={(post.shared_post as Post) || post} />
          <BookmarkButton />
        </div>

        {/* Content based on type */}
        {sharedIsArticle ? (
          <div className="box-border flex h-[126px] w-[232px] flex-col justify-center items-start gap-[12px] rounded-[8px] border-[0.5px] border-[#2C2C33] px-[12px] py-[8px]">
            <div className="flex h-[81px] w-[207px] shrink-0 overflow-hidden rounded-[4px]">
              <img
                src={sharedPostMedia || ""}
                alt=""
                className="h-[81px] w-[207px] object-cover"
              />
            </div>
            <p className="h-[16px] w-[207px] overflow-hidden truncate text-[12px] leading-[16px] font-semibold text-[#FFECE6]">
              {post.shared_post?.title || sharedCleanText}
            </p>
          </div>
        ) : sharedIsPoll ? (
          <div className="self-stretch cursor-pointer group/poll w-full p-2 bg-[#030303] rounded-[12px] flex flex-col justify-center items-start gap-1">
            <p className="w-full text-[#FFECE6] text-[14px] font-normal leading-[20px] line-clamp-4 break-words group-hover/poll:text-white transition-colors">
              {(post.shared_post as any)?.title || sharedCleanText}
            </p>
            <span className="w-full text-[#B8ADA8] text-[10px] font-medium leading-[12px]">
              {sharedPollVotes} votes{sharedPollClosedText}
            </span>
          </div>
        ) : sharedPostMedia ? (
          <div className="flex flex-row items-center gap-[16px] w-full h-[76px] group/media">
            <div className="relative w-[76px] h-[76px] bg-ds-surface-2 border border-[#E5E7EB] rounded-[12px] overflow-hidden shrink-0">
              {sharedIsVideo ? (
                <>
                  <video
                    src={sharedPostMedia}
                    className="size-full object-cover group-hover/media:scale-105 transition-transform"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/media:bg-black/30 transition-colors">
                    <div className="size-7 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                      <Icon
                        name="play"
                        className="h-4 w-4 text-white ml-0.5"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={sharedPostMedia}
                  alt="Post media"
                  className="size-full object-cover group-hover/media:scale-105 transition-transform"
                />
              )}
            </div>
            {sharedCleanText && (
              <div className="flex flex-col items-start gap-[8px] flex-1 min-w-0">
                <p className="text-[14px] font-normal text-[#FFECE6] leading-[20px] line-clamp-3 group-hover/media:text-white transition-colors">
                  {sharedCleanText}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-start gap-[12px] w-full group/text">
            <p className="text-[14px] font-normal text-[#FFECE6] leading-[20px] w-full line-clamp-3 group-hover/text:text-white transition-colors">
              {sharedCleanText}
            </p>
          </div>
        )}
      </article>
    );
  }

  // Fallback layout: Poll (Frame 2609260), Media (Frame 2609258), or Text (Frame 2609255)
  return (
    <div className="flex flex-col items-start p-0 gap-[12px] w-full cursor-pointer rounded-lg transition-colors group">
      {/* Header section (632x36px) */}
      <div className="flex flex-row justify-between items-center w-full h-[36px]">
        <AuthorHeader p={post} />
        <BookmarkButton />
      </div>

      {/* Frame 2609260: Poll Post */}
      {isPoll ? (
        <div
          onClick={() => handlePostClick(post.id)}
          className="self-stretch cursor-pointer group/poll w-full p-2 bg-[#030303] rounded-[12px] flex flex-col justify-center items-start gap-1"
        >
          <p className="w-full text-[#FFECE6] text-[14px] font-normal leading-[20px] line-clamp-4 break-words group-hover/poll:text-white transition-colors">
            {(post as any).title || cleanText}
          </p>
          <span className="w-full text-[#B8ADA8] text-[10px] font-medium leading-[12px]">
            {pollVotes} votes{pollClosedText}
          </span>
        </div>
      ) : postImage ? (
        /* Frame 2609258: Media Post */
        <div
          onClick={() => handlePostClick(post.id)}
          className="flex flex-row items-center gap-[16px] w-full h-[76px] group/media"
        >
          <div className="relative w-[76px] h-[76px] bg-ds-surface-2 border border-[#E5E7EB] rounded-[12px] overflow-hidden shrink-0">
            {isVideo ? (
              <>
                <video
                  src={postImage}
                  className="size-full object-cover group-hover/media:scale-105 transition-transform"
                  preload="metadata"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/media:bg-black/30 transition-colors">
                  <div className="size-7 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                    <Icon name="play" className="h-4 w-4 text-white ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={postImage}
                alt="Post media"
                className="size-full object-cover group-hover/media:scale-105 transition-transform"
              />
            )}
          </div>
          {cleanText && (
            <div className="flex flex-col items-start gap-[8px] flex-1">
              <p className="text-[14px] font-normal text-[#FFECE6] leading-[20px] line-clamp-3 group-hover/media:text-white transition-colors">
                {cleanText}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Frame 2609255: Text Post */
        <div
          onClick={() => handlePostClick(post.id)}
          className="flex flex-col justify-center items-start gap-[12px] w-full group/text"
        >
          <p className="text-[14px] font-normal text-[#FFECE6] leading-[20px] w-full line-clamp-3 group-hover/text:text-white transition-colors">
            {cleanText}
          </p>
        </div>
      )}
    </div>
  );
}
