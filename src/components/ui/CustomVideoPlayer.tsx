import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, VolumeX } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Icon as CustomIcon } from '@/components/icons';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
interface CustomVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  containerClassName?: string;
  hideControls?: boolean;
}

export function CustomVideoPlayer({ src, className, style, containerClassName, hideControls = false, ...props }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const pathname = usePathname();
  const isPostDetailsPage = pathname?.startsWith('/post/');

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      if (dur > 0) {
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      handleTimeUpdate();
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleFullScreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative group flex items-center justify-center bg-transparent overflow-hidden w-full h-full", containerClassName)}
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
          setShowControls(true);
        }
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches && isPlaying) {
          setShowControls(false);
        }
      }}
      onClick={(e) => {
        if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
          setShowControls(prev => !prev);
        } else {
          togglePlay(e);
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn("w-full h-full object-contain cursor-pointer", className)}
        style={style}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        {...props}
      />
      
      {/* Big Play Button Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay(e);
            if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
              setShowControls(true);
            }
          }}
        >
          <div className="w-[60px] h-[60px] rounded-full bg-black/50 backdrop-blur-md text-[#FFECE6] flex items-center justify-center hover:scale-110 pointer-events-auto transition-all shadow-[-1px_-1px_1px_rgba(255,255,255,0.6),1px_1px_1px_rgba(255,255,255,0.6)]">
            <Play className="w-10 h-10 ml-1" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {!hideControls && (
        <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-16 flex flex-col gap-2 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent",
          showControls || !isPlaying || ((typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) && isPostDetailsPage) ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center w-full gap-3">
          <button 
            onClick={togglePlay} 
            className={cn(
              "text-white hover:text-white/80 transition-opacity duration-300 outline-none focus:outline-none shrink-0",
              (!showControls && isPlaying && (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) && isPostDetailsPage) ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <rect x="5" y="3.75" width="5" height="16.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="3.75" width="5" height="16.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>
          
          <div className="flex-1 flex items-center group/slider relative h-5 px-1">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="w-full cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&_[role=slider]]:shadow-sm [&>span:first-child]:!h-[3px] [&>span:first-child]:!bg-[#EEF2FF] [&_[data-orientation=horizontal]]:bg-[#6366F1]"
            />
          </div>

          <div className={cn(
            "flex items-center gap-3 shrink-0 transition-opacity duration-300",
            (!showControls && isPlaying && (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) && isPostDetailsPage) ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <div className="relative group/volume flex flex-col items-center justify-center w-[24px]">
              
              <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2 w-[24px] h-[128px] py-2 bg-white rounded-[8px] flex items-center justify-center opacity-0 group-hover/volume:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/volume:pointer-events-auto">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-[112px] h-[2px] bg-gray-200 appearance-none cursor-pointer -rotate-90 origin-center [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#6366F1] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm"
                  style={{
                    background: `linear-gradient(to right, #6366F1 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%)`
                  }}
                />
              </div>

              <button onClick={toggleMute} className="w-[28px] h-[28px] rounded-full bg-black/80 hover:bg-black/90 active:scale-95 backdrop-blur-md flex items-center justify-center text-[#FFECE6] transition-all cursor-pointer shadow-[-1px_-1px_1px_rgba(255,255,255,0.6),1px_1px_1px_rgba(255,255,255,0.6)] outline-none focus:outline-none shrink-0">
                {isMuted || volume === 0 ? <CustomIcon name="volume-off" className="w-5 h-5" /> : <CustomIcon name="volume-on" className="w-5 h-5" />}
              </button>
            </div>

            <button onClick={toggleFullScreen} className="text-white hover:text-white/80 transition-colors outline-none focus:outline-none">
              <Icon icon="prime:expand" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
