import React, { useState, useRef, useEffect, useCallback } from 'react';
import { haptics } from '../haptics';

interface UseSwipeDownDismissOptions {
  onDismiss: () => void;
  threshold?: number; // Distance in px to trigger dismiss (default 75)
  resistance?: number; // Damping factor (default 0.75)
  enabled?: boolean;
}

export function useSwipeDownDismiss({
  onDismiss,
  threshold = 75,
  resistance = 0.75,
  enabled = true
}: UseSwipeDownDismissOptions) {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isGestureActiveRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleStart = useCallback((clientY: number, clientX: number, isHeaderOrHandle: boolean = false) => {
    if (!enabled) return;
    
    // Check if the scroll container is at the very top (or if user touched the drag handle / header)
    const scrollTop = containerRef.current ? containerRef.current.scrollTop : (window.scrollY || 0);
    if (!isHeaderOrHandle && scrollTop > 3) {
      return;
    }

    startYRef.current = clientY;
    startXRef.current = clientX;
    isGestureActiveRef.current = true;
  }, [enabled]);

  const handleMove = useCallback((clientY: number, clientX: number) => {
    if (!isGestureActiveRef.current || startYRef.current === null || startXRef.current === null) return;

    const deltaY = clientY - startYRef.current;
    const deltaX = Math.abs(clientX - startXRef.current);

    // Only handle downward drag when vertical dominates horizontal
    if (deltaY > 0 && deltaY > deltaX) {
      const dampedY = Math.max(0, deltaY * resistance);
      setOffsetY(dampedY);
      setIsDragging(true);
    } else if (deltaY < 0 && !isDragging) {
      // Swiping up: cancel gesture so normal scrolling works
      isGestureActiveRef.current = false;
      startYRef.current = null;
    }
  }, [resistance, isDragging]);

  const handleEnd = useCallback(() => {
    if (!isGestureActiveRef.current && !isDragging) return;

    isGestureActiveRef.current = false;
    startYRef.current = null;
    startXRef.current = null;

    if (offsetY >= threshold) {
      // Swipe threshold exceeded -> trigger dismiss with haptic feedback
      try {
        haptics.selection();
      } catch (e) {
        // Safe fallback
      }
      // Animate smoothly downwards then trigger callback
      setOffsetY(window.innerHeight || 600);
      setTimeout(() => {
        onDismiss();
        setOffsetY(0);
        setIsDragging(false);
      }, 200);
    } else {
      // Snap back to top smoothly
      setOffsetY(0);
      setIsDragging(false);
    }
  }, [offsetY, threshold, onDismiss]);

  // Touch event handlers for the drag handle / top bar
  const handleTouchProps = {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientY, e.touches[0].clientX, true);
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY, e.touches[0].clientX);
      }
    },
    onTouchEnd: () => handleEnd(),
    onTouchCancel: () => handleEnd(),
    onMouseDown: (e: React.MouseEvent) => {
      handleStart(e.clientY, e.clientX, true);
      const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientY, ev.clientX);
      const onMouseUp = () => {
        handleEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  // Touch event handlers for scrollable areas (only when scrollTop <= 2)
  const containerTouchProps = {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientY, e.touches[0].clientX, false);
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY, e.touches[0].clientX);
      }
    },
    onTouchEnd: () => handleEnd(),
    onTouchCancel: () => handleEnd()
  };

  const style: React.CSSProperties = {
    transform: offsetY > 0 ? `translate3d(0, ${offsetY}px, 0)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease-out',
    opacity: offsetY > 0 ? Math.max(0.4, 1 - (offsetY / 400)) : 1,
    willChange: isDragging ? 'transform, opacity' : 'auto'
  };

  return {
    containerRef,
    offsetY,
    isDragging,
    style,
    handleTouchProps,
    containerTouchProps,
    reset: () => {
      setOffsetY(0);
      setIsDragging(false);
    }
  };
}
