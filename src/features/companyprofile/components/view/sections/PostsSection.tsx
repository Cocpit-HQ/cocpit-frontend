"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { CompanyProfileData, CompanyPost } from "../../../types/company-profile.types";

interface PostsSectionProps {
  data: CompanyProfileData;
  showAll?: boolean;
  isOwnProfile?: boolean;
}

/* ─── Mock posts used when data.posts is empty ─────────────────────────── */
export const MOCK_POSTS: CompanyPost[] = [
  {
    id: "p1",
    authorName: "Nexsus Global Systems",
    authorAvatarUrl: "https://i.pravatar.cc/150?u=nexsus1",
    authorSubLabel: "SaaS and Fintech Solutions",
    timestamp: "6 days ago",
    content:
      "Excited to announce our Series B funding of $50M led by Global Ventures. The future of decentralized AI has never looked brighter! 🚀 #TechNova #Innovation #SeriesB",
    imageUrl:
      "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80",
    likesCount: 3,
    commentsCount: 3,
    repostsCount: 3,
    sharesCount: 3,
    likedBy: [{ name: "Jhon", isOthers: true }],
  },
  {
    id: "p2",
    authorName: "Nexsus Global Systems",
    authorAvatarUrl: "https://i.pravatar.cc/150?u=nexsus2",
    authorSubLabel: "SaaS and Fintech Solutions",
    timestamp: "6 days ago",
    content:
      "Excited to announce our Series B funding of $50M led by Global Ventures. The future of decentralized AI has never looked brighter! 🚀 #TechNova #Innovation #SeriesB",
    imageUrl:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80",
    likesCount: 3,
    commentsCount: 3,
    repostsCount: 3,
    sharesCount: 3,
    likedBy: [{ name: "Jhon", isOthers: true }],
  },
];

/* ─── Single post card — matches Frame 2608598 / 2608599 ─────────────────── */
function PostCard({ post }: { post: CompanyPost }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const likedByText =
    post.likedBy.length > 0
      ? post.likedBy[0].isOthers
        ? `Liked by ${post.likedBy[0].name} and others`
        : `Liked by ${post.likedBy[0].name}`
      : null;

  return (
    /*
     * Frame 2608598 / 2608599
     * flex-direction: column; align-items: center; gap: 16px;
     * width: 452px; height: 645px;
     */
    <div
      style={{ width: "452px", height: "645px", gap: "16px" }}
      className="flex flex-col items-center shrink-0"
    >
      {/* ── Frame 2608569: Header row ─────────────────────────────────────
       * flex-direction: row; justify-content: space-between; align-items: center;
       * width: 452px; height: 56px; gap: 8px;
       */}
      <div
        style={{ width: "452px", height: "56px", gap: "8px" }}
        className="flex flex-row justify-between items-center flex-none self-stretch"
      >
        {/* Frame 2608571: Avatar + text stack
         * flex-direction: row; align-items: center; gap: 8px; width: 235px; height: 56px;
         */}
        <div
          style={{ width: "235px", height: "56px", gap: "8px" }}
          className="flex flex-row items-center flex-none"
        >
          {/* Ellipse 10: Avatar 40×40 */}
          <div className="w-10 h-10 rounded-full overflow-hidden relative flex-none bg-gray-100 dark:bg-zinc-800">
            <Image
              src={post.authorAvatarUrl}
              alt={post.authorName}
              fill
              className="object-cover"
            />
          </div>

          {/* Frame 2608568: Name / Sub-label / Timestamp column
           * flex-direction: column; align-items: flex-start; width: 187px; height: 56px;
           */}
          <div
            style={{ width: "187px", height: "56px" }}
            className="flex flex-col items-start flex-none"
          >
            {/* Nexsus Global Systems — font-weight: 500; font-size: 16px; line-height: 24px; color: #000 */}
            <span
              style={{
                width: "187px",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#000000",
              }}
              className="dark:text-zinc-100 truncate flex-none"
            >
              {post.authorName}
            </span>

            {/* SaaS and Fintech Solutions — font-size: 10px; color: #6B7280 */}
            <span
              style={{
                width: "135px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "10px",
                lineHeight: "16px",
                color: "#6B7280",
              }}
              className="flex-none truncate"
            >
              {post.authorSubLabel}
            </span>

            {/* 6 days ago — font-size: 10px; color: #6B7280 */}
            <span
              style={{
                width: "56px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "10px",
                lineHeight: "16px",
                color: "#6B7280",
              }}
              className="flex-none"
            >
              {post.timestamp}
            </span>
          </div>
        </div>

        {/* Frame 2608763: Action icons
         * flex-direction: row; align-items: center; gap: 16px; width: 64px; height: 24px;
         */}
        <div
          style={{ width: "64px", height: "24px", gap: "16px" }}
          className="flex flex-row items-center flex-none"
        >
          {/* Tag / UserPlus — 24×24 */}
          <button
            title="Tag"
            className="w-6 h-6 flex-none flex items-center justify-center text-black dark:text-zinc-100 hover:text-blue-600 transition-colors"
          >
            <Icon icon="la:user-tag" className="w-6 h-6" />
          </button>

          {/* Menu / MoreHorizontal — 24×24 */}
          <button
            title="More"
            className="w-6 h-6 flex-none flex items-center justify-center text-black dark:text-zinc-100 hover:text-gray-500 transition-colors"
          >
            <Icon icon="ph:dots-three-outline-vertical-light" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Frame 2609016: Content area ──────────────────────────────────────
       * flex-direction: column; align-items: flex-start; gap: 8px;
       * width: 452px; height: 533px;
       */}
      <div
        style={{ width: "452px", height: "533px", gap: "8px" }}
        className="flex flex-col items-start flex-none self-stretch"
      >
        {/* Post text — font-size: 12px; line-height: 16px; color: #000 */}
        <p
          style={{
            width: "452px",
            height: "32px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "16px",
            color: "#000000",
          }}
          className="flex-none self-stretch dark:text-zinc-200 overflow-hidden"
        >
          {post.content}
        </p>

        {/* Rectangle 14: Post image — width: 452px; height: 465px */}
        <div
          style={{ width: "452px", height: "465px" }}
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

        {/* Frame 2608624: "Liked by" row
         * flex-direction: row; justify-content: center; align-items: center;
         * width: 452px; height: 20px; gap: 10px;
         */}
        {likedByText && (
          <div
            style={{ width: "452px", height: "20px", gap: "10px" }}
            className="flex flex-row justify-center items-center flex-none self-stretch"
          >
            <span
              style={{
                width: "452px",
                height: "20px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#000000",
              }}
              className="flex-grow dark:text-zinc-300"
            >
              {likedByText}
            </span>
          </div>
        )}
      </div>

      {/* ── Frame 2608574: Engagement bar ────────────────────────────────────
       * flex-direction: row; justify-content: space-between; align-items: flex-end;
       * width: 452px; height: 24px; gap: 8px;
       */}
      <div
        style={{ width: "452px", height: "24px", gap: "8px" }}
        className="flex flex-row justify-between items-end flex-none self-stretch"
      >
        {/* Frame 2608620: Like + Comment + Repost + Share
         * flex-direction: row; align-items: center; gap: 16px; width: 208px; height: 24px;
         */}
        <div
          style={{ width: "208px", height: "24px", gap: "16px" }}
          className="flex flex-row items-center flex-none"
        >
          {/* Frame 2608593: Like — width: 40px; gap: 8px */}
          <button
            onClick={() => setLiked((p) => !p)}
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <Icon
              icon={liked ? "solar:like-bold" : "solar:like-linear"}
              className={`w-6 h-6 flex-none ${liked ? 'text-[#1A73E8]' : 'text-black dark:text-zinc-200'}`}
            />
            <span
              style={{
                width: "8px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#000000",
                textAlign: "center",
              }}
              className="flex-none dark:text-zinc-200"
            >
              {post.likesCount + (liked ? 1 : 0)}
            </span>
          </button>

          {/* Frame 2608594: Comment — width: 40px; gap: 8px */}
          <button
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="w-6 h-6 flex-none text-black dark:text-zinc-200"
            >
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                <path strokeLinejoin="round" d="M8 13.5h8m-8-5h4" />
                <path d="M6.099 19q-1.949-.192-2.927-1.172C2 16.657 2 14.771 2 11v-.5c0-3.771 0-5.657 1.172-6.828S6.229 2.5 10 2.5h4c3.771 0 5.657 0 6.828 1.172S22 6.729 22 10.5v.5c0 3.771 0 5.657-1.172 6.828S17.771 19 14 19c-.56.012-1.007.055-1.445.155c-1.199.276-2.309.89-3.405 1.424c-1.563.762-2.344 1.143-2.834.786c-.938-.698-.021-2.863.184-3.865" />
              </g>
            </svg>
            <span
              style={{
                width: "8px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#000000",
                textAlign: "center",
              }}
              className="flex-none dark:text-zinc-200"
            >
              {post.commentsCount}
            </span>
          </button>

          {/* Frame 2608595: Repost — width: 40px; gap: 8px */}
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
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#000000",
                textAlign: "center",
              }}
              className="flex-none dark:text-zinc-200"
            >
              {post.repostsCount}
            </span>
          </button>

          {/* Frame 2608597: Share — width: 40px; gap: 8px */}
          <button
            style={{ width: "40px", height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 28 28"
              className="text-black dark:text-zinc-200"
            >
              <path fill="currentColor" d="M12.25 3a.75.75 0 1 1 0 1.5h-5A2.75 2.75 0 0 0 4.5 7.25v13.5a2.75 2.75 0 0 0 2.75 2.75h13.5a2.75 2.75 0 0 0 2.75-2.75v-5a.75.75 0 0 1 1.5 0v5A4.25 4.25 0 0 1 20.75 25H7.25A4.25 4.25 0 0 1 3 20.75V7.25A4.25 4.25 0 0 1 7.25 3zm5.179-.928a.75.75 0 0 1 .796.098l8.25 6.75a.75.75 0 0 1 .039 1.127l-8.25 7.75A.75.75 0 0 1 17 17.25v-3.74c-1.166.036-2.463.189-3.854.802c-1.584.698-3.35 2.021-5.16 4.577l-.362.527A.75.75 0 0 1 6.25 19c0-4.406 1.34-7.56 3.51-9.608C11.738 7.527 14.325 6.656 17 6.52V2.75a.75.75 0 0 1 .429-.679m1.07 5.178a.75.75 0 0 1-.75.75c-2.66 0-5.145.772-6.959 2.483c-1.413 1.334-2.474 3.292-2.87 6.046c1.56-1.823 3.12-2.93 4.621-3.59C14.532 12.06 16.349 12 17.75 12a.75.75 0 0 1 .75.75v2.766l6.363-5.978L18.5 4.332z" />
            </svg>
            <span
              style={{
                width: "8px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#000000",
                textAlign: "center",
              }}
              className="flex-none dark:text-zinc-200"
            >
              {post.sharesCount}
            </span>
          </button>
        </div>

        {/* Frame 2608596: Save / Bookmark — width: 24px; height: 24px */}
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

/* ─── Posts Section ──────────────────────────────────────────────────────── */
export default function PostsSection({ data, showAll = false, isOwnProfile = false }: PostsSectionProps) {
  const rawPosts = data.posts.length > 0 ? data.posts : MOCK_POSTS;
  const displayPosts = showAll ? rawPosts : rawPosts.slice(0, 2);

  if (displayPosts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Section heading */}
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "20px",
            lineHeight: "28px",
            color: "#000000",
          }}
          className="dark:text-zinc-100"
        >
          Posts
        </h2>
        <div className="flex flex-col items-center justify-center py-12 px-4 w-full bg-white dark:bg-zinc-950 rounded-2xl">
          <div className="relative w-64 h-48 mb-6">
            <Image
              src="/images/companyonboarding/EmptyViewOfPost.png"
              alt="No Posts"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <h3 className="font-poppins font-semibold text-lg text-black dark:text-white mb-1">
            No Posts
          </h3>
          <p className="font-poppins text-sm text-gray-500 dark:text-zinc-400 text-center mb-4">
            <span className="font-semibold text-black dark:text-white">{data.name}</span> hasn't posted anything yet
          </p>
          {isOwnProfile && (
            <button className="h-10 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-full font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center">
              Create post
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <h2
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: "20px",
          lineHeight: "28px",
          color: "#000000",
        }}
        className="dark:text-zinc-100"
      >
        Posts
      </h2>

      {/*
       * Frame 2609082: Two-column post row
       * flex-direction: row; align-items: flex-start; gap: 16px;
       * width: 920px; height: 645px;
       */}
      <div
        style={{ gap: "16px" }}
        className="flex flex-row items-start w-full overflow-x-auto"
      >
        {displayPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* See all */}
      <div className="flex justify-center pt-1">
        <button
          style={{
            width: "53px",
            height: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "20px",
            color: "#6B7280",
            textAlign: "center",
          }}
          className="hover:text-gray-900 dark:hover:text-zinc-200 transition-colors flex items-center justify-center flex-none"
        >
          See all
        </button>
      </div>
    </div>
  );
}
