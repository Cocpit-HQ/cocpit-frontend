'use client';

import React from 'react';
import { useComments } from '../../hooks/use-comments';
import CommentSectionView from './CommentSectionView';

interface CommentSectionProps {
  isPostOwner?: boolean;
  postId: string | number;
  incrementCommentCount?: () => void;
  decrementCommentCount?: () => void;
}

/**
 * Smart wrapper for CommentSection.
 * Owns the data fetching and API interaction logic.
 */
export default function CommentSection({ 
  isPostOwner, 
  postId,
  incrementCommentCount,
  decrementCommentCount
}: CommentSectionProps) {
  
  const { 
    comments, 
    isLoading, 
    handleAddComment, 
    handleDeleteComment, 
    currentUserId 
  } = useComments(postId.toString());

  const handleAdd = (text: string, replyToId?: string | number) => {
    handleAddComment(
      text, 
      replyToId, 
      incrementCommentCount, // onOptimisticAdd
      decrementCommentCount  // onFailure rollback
    );
  };

  const handleDelete = (commentId: string | number) => {
    handleDeleteComment(commentId, decrementCommentCount);
  };

  return (
    <CommentSectionView
      postId={postId}
      comments={comments}
      isLoading={isLoading}
      onAddComment={handleAdd}
      onDeleteComment={handleDelete}
      currentUserId={currentUserId}
      isPostOwner={isPostOwner}
    />
  );
}
