'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LumiOrbProps {
  size?: number;
  className?: string;
  forcePlay?: boolean;
}

// Global cached array buffer so all LumiOrb instances initialize instantaneously
let cachedWebpBuffer: ArrayBuffer | null = null;
let bufferFetchPromise: Promise<ArrayBuffer> | null = null;

async function getWebpBuffer(): Promise<ArrayBuffer> {
  if (cachedWebpBuffer) return cachedWebpBuffer;
  if (!bufferFetchPromise) {
    bufferFetchPromise = fetch('/images/lumi_ai_orb_animated.webp')
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        cachedWebpBuffer = buf;
        return buf;
      })
      .catch((err) => {
        bufferFetchPromise = null;
        throw err;
      });
  }
  return bufferFetchPromise;
}

/**
 * LumiOrb Component
 * Renders the Lumi AI Orb with frame-accurate hover & active playback:
 * - Steady/paused on frame 0 when not hovered.
 * - Rotates/plays smoothly when hovered or when forcePlay=true (active AI generation).
 * - Pauses on the exact frame when cursor leaves.
 */
export default function LumiOrb({ size = 48, className = '', forcePlay = false }: LumiOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [decoderReady, setDecoderReady] = useState(false);

  const stateRef = useRef<{
    decoder: any | null;
    frameCount: number;
    currentFrame: number;
    isPlaying: boolean;
    rafId: number | null;
  }>({
    decoder: null,
    frameCount: 0,
    currentFrame: 0,
    isPlaying: false,
    rafId: null,
  });

  // 1. Initialize ImageDecoder with cached buffer
  useEffect(() => {
    let isMounted = true;

    async function initDecoder() {
      try {
        if (typeof window !== 'undefined' && 'ImageDecoder' in window) {
          const buffer = await getWebpBuffer();
          // @ts-ignore
          const decoder = new window.ImageDecoder({
            data: buffer,
            type: 'image/webp',
          });

          await decoder.tracks.ready;
          const count = decoder.tracks.selectedTrack?.frameCount || 1;

          if (isMounted) {
            stateRef.current.decoder = decoder;
            stateRef.current.frameCount = count;

            // Draw initial frame 0
            const frame = await decoder.decode({ frameIndex: 0 });
            if (isMounted && canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                canvasRef.current.width = frame.image.displayWidth || size * 2;
                canvasRef.current.height = frame.image.displayHeight || size * 2;
                ctx.drawImage(frame.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
              }
              setDecoderReady(true);
            }
          }
        }
      } catch (e) {
        console.warn('[LumiOrb] ImageDecoder initialization:', e);
      }
    }

    initDecoder();

    return () => {
      isMounted = false;
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
    };
  }, [size]);

  // 2. Play / Pause animation loop based on hover or forcePlay
  useEffect(() => {
    const shouldPlay = isHovered || forcePlay;
    const state = stateRef.current;

    if (!state.decoder || state.frameCount <= 1) return;

    if (shouldPlay) {
      state.isPlaying = true;
      let lastTime = performance.now();

      const renderLoop = async (now: number) => {
        if (!state.isPlaying || !canvasRef.current || !state.decoder) return;

        // Smooth ~30fps frame advancement
        if (now - lastTime >= 33) {
          lastTime = now;
          state.currentFrame = (state.currentFrame + 1) % state.frameCount;
          try {
            const frame = await state.decoder.decode({ frameIndex: state.currentFrame });
            if (canvasRef.current && state.isPlaying) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(frame.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
              }
            }
          } catch {
            // Frame decode error suppression
          }
        }

        if (state.isPlaying) {
          state.rafId = requestAnimationFrame(renderLoop);
        }
      };

      state.rafId = requestAnimationFrame(renderLoop);
    } else {
      // Pause on the exact current frame
      state.isPlaying = false;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    }

    return () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    };
  }, [isHovered, forcePlay, decoderReady]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className={`w-full h-full rounded-full object-cover pointer-events-none ${
          decoderReady ? 'block' : 'hidden'
        }`}
      />
      {/* Fallback image while decoder is initializing */}
      <img
        src="/images/lumi_ai_orb_animated.webp"
        alt="Lumi AI Orb"
        style={{ width: size, height: size }}
        className={`w-full h-full rounded-full object-cover pointer-events-none ${
          decoderReady ? 'hidden' : 'block'
        }`}
      />
    </div>
  );
}
