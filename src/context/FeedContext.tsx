"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Post } from "@/types/entities";
import { getFeeds } from "@/services/api/feed";
import { ApiPost } from "@/types/api";
import { formatTimeAgo } from "@/lib/utils";

const currentUser = {
  name: "Sally Liang",
};

interface FeedContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentUser: { name: string };
  addPost: (post: Post) => void;
  deletePost: (id: number) => void;
  togglePostVisibility: (id: number) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
};

// Simple hash function to convert string to a number for the ID
const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const mapApiPostToPost = (apiPost: ApiPost): Post => {
  const imageMedia = apiPost.media.find((m) => m.media_type === "image");

  return {
    id: stringToHash(apiPost.post_id),
    author: apiPost.author_name,
    title: "", // The API provides a post title, but the UI expects the author's headline here.
    timeAgo: formatTimeAgo(apiPost.created_at),
    content: apiPost.content,
    imageSrc: imageMedia ? imageMedia.url : undefined,
    images: apiPost.media.map((m) => m.url),
    videoSrc: apiPost.media.find((m) => m.media_type === "video")?.url,
    // The new API doesn't provide these counts directly on the post object.
    // Defaulting to '0' or calculating them would be required.
    likes: "0",
    comments: "0",
    shares: "0",
    commentData: [], // No comment data from this endpoint
    category: apiPost.category_name as any, // Assuming category_name maps to category
    visibility: apiPost.visibility as any,
  };
};

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true);
        const response = await getFeeds();
        // The API returns the response with posts directly inside it.
        if (response && Array.isArray(response)) {
            const mappedPosts = response.map(mapApiPostToPost);
            setPosts(mappedPosts);
        } else {
            // Handle cases where response is not in the expected format
             console.warn("Unexpected feed API response format:", response);
             setPosts([]);
        }
      } catch (err) {
        setError("Failed to fetch feed. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const deletePost = (id: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
  };

  const togglePostVisibility = (id: number) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              visibility:
                post.visibility === "private" ? "public" : "private",
            }
          : post
      )
    );
  };

  return (
    <FeedContext.Provider
      value={{
        posts,
        loading,
        error,
        addPost,
        currentUser,
        deletePost,
        togglePostVisibility,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};
