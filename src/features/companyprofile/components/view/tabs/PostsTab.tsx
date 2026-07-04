"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { CompanyProfileData, CompanyPost } from "../../../types/company-profile.types";
import { MOCK_POSTS } from "../sections/PostsSection";
import PostsSection from "../sections/PostsSection";
function PostsTabPostCard({ post }: { post: CompanyPost }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const likedByText =
    post.likedBy.length > 0
      ? post.likedBy[0].isOthers
        ? `Liked by ${post.likedBy[0].name} and others`
        : `Liked by ${post.likedBy[0].name}`
      : null;

  return (
    <div
      style={{ width: "560px", height: "645px", gap: "16px" }}
      className="flex flex-col items-center flex-none flex-grow font-poppins"
    >
      {/* Header Row */}
      <div
        style={{ width: "560px", height: "56px", gap: "8px" }}
        className="flex flex-row justify-between items-center flex-none self-stretch"
      >
        <div
          style={{ height: "56px", gap: "8px" }}
          className="flex flex-row items-center flex-none"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden relative flex-none bg-gray-100 dark:bg-zinc-800">
            <Image
              src={post.authorAvatarUrl}
              alt={post.authorName}
              fill
              className="object-cover"
            />
          </div>

          <div
            style={{ height: "56px" }}
            className="flex flex-col items-start flex-none justify-center"
          >
            <span
              style={{
                fontSize: "16px",
                lineHeight: "24px",
              }}
              className="font-medium text-black dark:text-zinc-100 truncate flex-none"
            >
              {post.authorName}
            </span>

            <span
              style={{
                fontSize: "10px",
                lineHeight: "16px",
              }}
              className="font-normal text-gray-500 dark:text-zinc-400 flex-none truncate"
            >
              {post.authorSubLabel}
            </span>

            <span
              style={{
                fontSize: "10px",
                lineHeight: "16px",
              }}
              className="font-normal text-gray-500 dark:text-zinc-400 flex-none"
            >
              {post.timestamp}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div
          style={{ width: "64px", height: "24px", gap: "16px" }}
          className="flex flex-row items-center flex-none"
        >
          <button
            title="Tag"
            className="w-6 h-6 flex-none flex items-center justify-center text-black dark:text-zinc-100 hover:text-blue-600 transition-colors"
          >
            <Icon icon="la:user-tag" className="w-6 h-6" />
          </button>
          <button
            title="More"
            className="w-6 h-6 flex-none flex items-center justify-center text-black dark:text-zinc-100 hover:text-gray-500 transition-colors"
          >
            <Icon icon="ph:dots-three-outline-vertical-light" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{ width: "560px", height: "533px", gap: "8px" }}
        className="flex flex-col items-start flex-none self-stretch"
      >
        <p
          style={{
            width: "560px",
            minHeight: "32px",
            fontSize: "12px",
            lineHeight: "16px",
          }}
          className="font-normal text-black dark:text-zinc-200 flex-none self-stretch overflow-hidden"
        >
          {post.content}
        </p>

        <div
          style={{ width: "560px", height: "465px" }}
          className="relative flex-grow self-stretch bg-gray-100 dark:bg-zinc-800 overflow-hidden"
        >
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Liked By Row */}
        {likedByText && (
          <div
            style={{ width: "560px", height: "20px", gap: "10px" }}
            className="flex flex-row items-center flex-none self-stretch"
          >
            <span
              style={{
                fontSize: "12px",
                lineHeight: "16px",
              }}
              className="font-normal text-black dark:text-zinc-300 flex-grow"
            >
              {likedByText}
            </span>
          </div>
        )}
      </div>

      {/* Engagement bar */}
      <div
        style={{ width: "560px", height: "24px", gap: "8px" }}
        className="flex flex-row justify-between items-end flex-none self-stretch"
      >
        <div
          style={{ height: "24px", gap: "16px" }}
          className="flex flex-row items-center flex-none"
        >
          {/* Like */}
          <button
            onClick={() => setLiked((p) => !p)}
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <Icon
              icon={liked ? "solar:like-bold" : "solar:like-broken"}
              className={`w-6 h-6 flex-none ${liked ? 'text-[#1A73E8]' : 'text-black dark:text-zinc-200'}`}
            />
            <span
              style={{
                width: "8px",
                fontSize: "12px",
                lineHeight: "16px",
              }}
              className="font-normal text-black dark:text-zinc-200 flex-none text-center"
            >
              {post.likesCount + (liked ? 1 : 0)}
            </span>
          </button>

          {/* Comment */}
          <button
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <Icon
              icon="hugeicons:comment-01"
              className="w-6 h-6 flex-none text-black dark:text-zinc-200"
            />
            <span
              style={{
                width: "8px",
                fontSize: "12px",
                lineHeight: "16px",
              }}
              className="font-normal text-black dark:text-zinc-200 flex-none text-center"
            >
              {post.commentsCount}
            </span>
          </button>

          {/* Repost */}
          <button
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <Icon
              icon="hugeicons:repost"
              className="w-6 h-6 flex-none text-black dark:text-zinc-200"
            />
            <span
              style={{
                width: "8px",
                fontSize: "12px",
                lineHeight: "16px",
              }}
              className="font-normal text-black dark:text-zinc-200 flex-none text-center"
            >
              {post.repostsCount}
            </span>
          </button>

          {/* Share */}
          <button
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <Icon
              icon="fluent:share-16-regular"
              className="w-6 h-6 flex-none text-black dark:text-zinc-200"
            />
            <span
              style={{
                width: "8px",
                fontSize: "12px",
                lineHeight: "16px",
              }}
              className="font-normal text-black dark:text-zinc-200 flex-none text-center"
            >
              {post.sharesCount}
            </span>
          </button>
        </div>

        {/* Save */}
        <button
          onClick={() => setSaved((p) => !p)}
          style={{ width: "24px", height: "24px" }}
          className="flex flex-row items-center flex-none"
        >
          <Icon
            icon={saved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
            className="w-6 h-6 flex-none text-black dark:text-zinc-100"
          />
        </button>
      </div>
    </div>
  );
}

interface PostsTabProps {
  data: CompanyProfileData;
  isOwnProfile?: boolean;
}

export default function PostsTab({ data, isOwnProfile = false }: PostsTabProps) {
  const postsToRender = data.posts && data.posts.length > 0 ? data.posts : MOCK_POSTS;

  return (
    <div
      style={{ width: "600px", gap: "24px" }}
      className="flex flex-col items-start"
    >
      {postsToRender.map((post) => (
        <PostsTabPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
