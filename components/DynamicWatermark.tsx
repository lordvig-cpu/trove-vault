'use client';

import React, { useRef, useEffect } from 'react';

interface DynamicWatermarkProps {
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  isAudioEnabled: boolean;
}

export default function DynamicWatermark({
  isHovered,
  onHoverChange,
  isAudioEnabled,
}: DynamicWatermarkProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      try {
        video.currentTime = 0;
      } catch {}

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('Playback error:', err);
          }
        });
      }
    } else {
      video.pause();
    }
  }, [isHovered]);

  return (
    <>
      {/* Invisible Logo Hover Trigger */}
      <div
        className="absolute top-0 left-0 w-36 h-10 z-[100] cursor-pointer"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        aria-hidden="true"
      />

      {/* Dynamic Background Layer */}
      <div
        aria-hidden="true"
        className={[
          'fixed inset-0 z-0',
          'flex items-center justify-center overflow-hidden',
          'pointer-events-none select-none',
        ].join(' ')}
      >
        <img
          src="/images/web_background_trove_vault_logo.png"
          alt=""
          className={`watermark-logo-image ${
            isHovered ? 'watermark-logo-image-hidden' : ''
          }`}
        />

        <video
          ref={videoRef}
          src="/videos/website_intro_video.mp4"
          preload="auto"
          muted={!isAudioEnabled}
          playsInline
          disablePictureInPicture
          className={`watermark-video-player ${
            isHovered ? 'watermark-video-active' : 'watermark-video-inactive'
          }`}
        />
      </div>
    </>
  );
}