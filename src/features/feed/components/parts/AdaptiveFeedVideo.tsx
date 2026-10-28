"use client";

import React, { useRef, useState } from 'react';
import { useAdaptiveHls } from '@/features/feed/hooks/use-adaptive-hls';

type Props = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  src: string;
  fallbackSrc?: string;
};

export function AdaptiveFeedVideo({ src, fallbackSrc, ...props }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fallbackFor, setFallbackFor] = useState<string | null>(null);
  const activeSrc = fallbackFor === src ? fallbackSrc || src : src;
  const isHls = /\.m3u8(?:[?#]|$)/i.test(activeSrc);
  const onError = () => {
    if (fallbackSrc && activeSrc !== fallbackSrc) setFallbackFor(src);
  };
  useAdaptiveHls(videoRef, isHls ? activeSrc : undefined, onError);
  return <video ref={videoRef} src={isHls ? undefined : activeSrc} preload="none" onError={onError} {...props} />;
}
