/**
 * Duyar Tactile Haptic Feedback Utility
 * Uses the Web Vibration API (navigator.vibrate) to enhance user interactions
 * with tactile physical feedback across mobile web and installed PWA.
 */

const STORAGE_KEY = 'duyar_haptics_enabled';

/**
 * Check if haptic feedback is supported on the current device and browser.
 */
export const isHapticsSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.vibrate === 'function'
  );
};

/**
 * Check if user has enabled haptics in app settings (defaults to true).
 */
export const isHapticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === null) return true; // Default enabled
    return val === 'true';
  } catch {
    return true;
  }
};

/**
 * Persist user's haptics preference.
 */
export const setHapticsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    if (enabled && isHapticsSupported()) {
      navigator.vibrate(20);
    }
  } catch (e) {
    console.warn('Failed to save haptics setting:', e);
  }
};

/**
 * Core vibration dispatcher with safety checks and error handling.
 */
export const vibrate = (pattern: number | number[]): boolean => {
  if (!isHapticsEnabled() || !isHapticsSupported()) {
    return false;
  }

  try {
    return window.navigator.vibrate(pattern);
  } catch (error) {
    // Some browsers/sandboxed iframes throw SecurityError or NotAllowedError
    console.debug('Haptics vibrate error (safely handled):', error);
    return false;
  }
};

/**
 * Predefined tactile sensations
 */
export const haptics = {
  /**
   * Ultra-light tap (10ms) - for subtle touch, chip toggle, character entry
   */
  light: () => vibrate(10),

  /**
   * Medium standard tap (25ms) - for standard buttons and icon clicks
   */
  medium: () => vibrate(25),

  /**
   * Strong firm tap (45ms) - for important action confirmations
   */
  heavy: () => vibrate(45),

  /**
   * Tactile selection pulse (14ms) - for date pickers, time slots, sliders
   */
  selection: () => vibrate(14),

  /**
   * Double rhythmic pulse [20ms, 50ms pause, 35ms] - for filters and search results
   */
  filterApplied: () => vibrate([22, 50, 32]),

  /**
   * Prominent confirmation sequence [30ms, 60ms pause, 50ms] - for property & service bookings
   */
  bookingConfirmed: () => vibrate([30, 60, 50]),

  /**
   * Smooth navigation transition (18ms) - for dashboard switches & primary tab bar
   */
  dashboardNavigated: () => vibrate(18),

  /**
   * Celebration / Completion pattern [25ms, 40ms pause, 30ms, 40ms pause, 60ms]
   */
  success: () => vibrate([25, 40, 30, 40, 60]),

  /**
   * Warning / error double buzz [40ms, 60ms pause, 40ms]
   */
  warning: () => vibrate([40, 60, 40]),

  /**
   * Attention-grabbing soft double ping [18ms, 45ms pause, 24ms] - for toasts & alerts
   */
  notification: () => vibrate([18, 45, 24]),
};

// Default export with all helpers
export default haptics;
