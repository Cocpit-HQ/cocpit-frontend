export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  headline?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  degree?: string;
  location?: string;
  about?: string;
  avatar?: string;
}

export interface Experience {
  id: number;
  title: string;
  company: string;
  duration: string;
  location:string;
  description: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy: string;
  duration: string;
  description: string;
}

export interface Comment {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timeAgo: string;
  likes: number;
}

export interface Post {
  id: number;
  author: string;
  title: string;
  timeAgo: string;
  content: string;
  imageSrc?: string;
  images?: string[];
  videoSrc?: string;
  aspectRatio?: string;
  likes: string;
  comments: string;
  shares: string;
  commentData?: Comment[];
}