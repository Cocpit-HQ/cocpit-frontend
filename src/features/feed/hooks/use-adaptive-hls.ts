import { useEffect, useRef, type RefObject } from 'react';

/** Keep an HLS engine only while its video is near the viewport. */
export function useAdaptiveHls(
  videoRef: RefObject<HTMLVideoElement | null>,
  source: string | undefined,
  onFatalError?: () => void
): void {
  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source || !/\.m3u8(?:[?#]|$)/i.test(source)) return;
    let cancelled = false;
    let generation = 0;
    let attaching = false;
    let nearViewport = false;
    let hls: import('hls.js').default | null = null;

    const detach = () => {
      generation += 1;
      video.pause();
      hls?.destroy();
      hls = null;
      video.removeAttribute('src');
      video.load();
    };

    const attach = async () => {
      if (attaching || hls || video.hasAttribute('src')) return;
      attaching = true;
      const requestedGeneration = generation;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        attaching = false;
        return;
      }
      try {
        const { default: Hls } = await import('hls.js');
        if (cancelled || requestedGeneration !== generation) return;
        if (!Hls.isSupported()) {
          onFatalErrorRef.current?.();
          return;
        }
        hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) onFatalErrorRef.current?.();
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } finally {
        attaching = false;
        if (nearViewport && !cancelled && requestedGeneration !== generation) {
          void attach().catch(() => onFatalErrorRef.current?.());
        }
      }
    };

    const observer = new IntersectionObserver((entries) => {
      nearViewport = Boolean(entries[0]?.isIntersecting);
      if (nearViewport) void attach().catch(() => onFatalErrorRef.current?.());
      else detach();
    }, { rootMargin: '150px' });
    observer.observe(video);
    return () => {
      cancelled = true;
      observer.disconnect();
      detach();
    };
  }, [videoRef, source]);
}
