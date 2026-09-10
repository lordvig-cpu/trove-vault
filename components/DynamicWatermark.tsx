'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Props for DynamicWatermark
 * @property isHovered - Boolean tracking whether user is hovering the top-left brand trigger
 * @property onHoverChange - Callback to notify parent (page.tsx) to coordinate workspace opacity
 * @property isAudioEnabled - Whether ambient audio/sound effects are unmuted from UI preferences
 */
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
  /* ------------------------------------------------------------------------
     1. DOM REFERENCES & PLAYBACK CONTROL
     Maintains direct ref access to the native HTML5 <video> element.
     ------------------------------------------------------------------------ */
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* ------------------------------------------------------------------------
     2. PLAYBACK LIFECYCLE & RACE CONDITION HANDLING
     Rewinds to keyframe 0 and manages play/pause promises to avoid AbortErrors
     when users quickly enter and exit the hover trigger zone.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      try {
        // Rewind to the beginning on each hover entry
        video.currentTime = 0;
      } catch {}

      // Handle async play promise to prevent unhandled pause interruption crashes
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('DynamicWatermark playback error:', err);
          }
        });
      }
    } else {
      // Pause playback immediately when cursor leaves
      video.pause();
    }
  }, [isHovered]);

  return (
    <>
      {/* --------------------------------------------------------------------
          3. INVISIBLE LOGO HOVER TRIGGER ZONE
          Anchored over the top-left navbar brand area (z-[100]) to intercept
          mouse interactions and drive presentation mode.
          -------------------------------------------------------------------- */}
      <div
        className="absolute top-0 left-0 w-36 h-10 z-[100] cursor-pointer"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        aria-hidden="true"
      />

      {/* --------------------------------------------------------------------
          4. DYNAMIC BACKGROUND MEDIA LAYERS
          Non-interactive viewport backdrop (z-0) with cross-fading static
          watermark image and intro animation video.
          -------------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className={[
          'fixed inset-0 z-0',
          'flex items-center justify-center overflow-hidden',
          'pointer-events-none select-none',
        ].join(' ')}
      >
        {/* Resting Fixed Watermark Brand Graphic */}
        <img
          src="/images/web_background_trove_vault_logo.png"
          alt=""
          className={`watermark-logo-image ${
            isHovered ? 'watermark-logo-image-hidden' : ''
          }`}
        />

        {/* Cinematic Video Intro Layer (Plays on hover) */}
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