import React from 'react';
import { CreatePostModalProps } from '../types';
import { CreatePostModal } from '@/shared/commonComponents/CreatePostModal';

export const FeedCreatePostModal = (props: CreatePostModalProps) => {
  return <CreatePostModal {...props} />;
};
