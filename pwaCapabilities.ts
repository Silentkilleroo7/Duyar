/**
 * Duyar Real Estate - PWA App Capabilities Engine
 * Implements PWABuilder App Capabilities:
 * 1. Shortcuts
 * 2. File Handlers
 * 3. Launch Handler
 * 4. Protocol Handlers
 * 5. Share Target
 * 6. Widgets
 * 7. Edge Side Panel
 * 8. Window Controls Overlay
 * 9. Tabbed Display
 * 10. Note Taking
 */

export interface PWACapabilitiesStatus {
  shortcuts: boolean;
  fileHandlers: boolean;
  launchHandler: boolean;
  protocolHandlers: boolean;
  shareTarget: boolean;
  widgets: boolean;
  edgeSidePanel: boolean;
  windowControlsOverlay: boolean;
  tabbedDisplay: boolean;
  noteTaking: boolean;
}

export interface PWACallbacks {
  onNavigateAction?: (action: string) => void;
  onFileReceived?: (file: File | { name: string; size: number; type: string; content?: string }) => void;
  onShareReceived?: (shareData: { title?: string; text?: string; url?: string }) => void;
  onProtocolReceived?: (propertyRef: string) => void;
  onNoteTakingRequested?: () => void;
  onWindowControlsOverlayChanged?: (rect: DOMRect | null) => void;
}

/**
 * Initialize all PWA App Capabilities and register handlers
 */
export function initPWACapabilities(callbacks: PWACallbacks = {}): () => void {
  if (typeof window === 'undefined') return () => {};

  console.log('[Duyar Capabilities] Initializing PWA App Capabilities suite...');

  // 1. Process URL Search Parameters (Shortcuts, Share Target, Protocol Handlers, Note Taking)
  processUrlParameters(callbacks);

  // 2. Launch Handler & File Handlers (launchQueue API)
  setupLaunchQueue(callbacks);

  // 3. Protocol Handlers (web+duyar)
  setupProtocolHandlers();

  // 4. Window Controls Overlay (Window Controls Overlay API)
  const cleanupWCO = setupWindowControlsOverlay(callbacks);

  // 5. Edge Side Panel & Responsive Viewport Adaptations
  setupEdgeSidePanelDetection();

  return () => {
    cleanupWCO();
  };
}

/**
 * Handle Launch Queue for File Handlers & Launch Handler
 */
function setupLaunchQueue(callbacks: PWACallbacks) {
  if ('launchQueue' in window && 'setConsumer' in (window as any).launchQueue) {
    try {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        console.log('[Duyar Capabilities] Launch Handler invoked with params:', launchParams);

        if (launchParams.targetURL) {
          const url = new URL(launchParams.targetURL);
          processUrlQueryString(url.searchParams, callbacks);
        }

        if (launchParams.files && launchParams.files.length > 0) {
          console.log('[Duyar Capabilities] File Handler received files:', launchParams.files.length);
          for (const fileHandle of launchParams.files) {
            try {
              const file = await fileHandle.getFile();
              callbacks.onFileReceived?.(file);
            } catch (err) {
              console.warn('[Duyar Capabilities] Error reading launched file handle:', err);
            }
          }
        }
      });
      console.log('[Duyar Capabilities] launchQueue consumer registered successfully.');
    } catch (e) {
      console.warn('[Duyar Capabilities] launchQueue setup warning:', e);
    }
  }
}

/**
 * Register web+duyar protocol handler
 */
export function setupProtocolHandlers(): boolean {
  if (typeof navigator !== 'undefined' && 'registerProtocolHandler' in navigator) {
    try {
      navigator.registerProtocolHandler(
        'web+duyar',
        `${window.location.origin}/?property_ref=%s`
      );
      console.log('[Duyar Capabilities] Protocol Handler web+duyar registered.');
      return true;
    } catch (err) {
      // Browsers may restrict registration until user gesture or if already registered
      console.log('[Duyar Capabilities] Protocol Handler registration note:', err);
    }
  }
  return false;
}

/**
 * Window Controls Overlay (WCO) support for desktop PWA titlebars
 */
function setupWindowControlsOverlay(callbacks: PWACallbacks): () => void {
  if (typeof navigator !== 'undefined' && 'windowControlsOverlay' in navigator) {
    const wco = (navigator as any).windowControlsOverlay;
    
    const updateTitlebar = () => {
      if (wco.visible) {
        const rect = wco.getTitlebarAreaRect ? wco.getTitlebarAreaRect() : null;
        console.log('[Duyar Capabilities] Window Controls Overlay visible, rect:', rect);
        callbacks.onWindowControlsOverlayChanged?.(rect);
      } else {
        callbacks.onWindowControlsOverlayChanged?.(null);
      }
    };

    wco.addEventListener('geometrychange', updateTitlebar);
    updateTitlebar();

    return () => {
      wco.removeEventListener('geometrychange', updateTitlebar);
    };
  }
  return () => {};
}

/**
 * Edge Side Panel Detection & Styling
 */
function setupEdgeSidePanelDetection() {
  if (typeof window === 'undefined') return;
  // Edge side panel typically has display-mode standalone and narrow width (< 480px)
  const isNarrowStandalone = window.matchMedia('(display-mode: standalone) and (max-width: 480px)').matches;
  if (isNarrowStandalone) {
    document.documentElement.classList.add('edge-side-panel-mode');
  }
}

/**
 * Process URL Query String on boot or launch
 */
function processUrlParameters(callbacks: PWACallbacks) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  processUrlQueryString(params, callbacks);
}

function processUrlQueryString(params: URLSearchParams, callbacks: PWACallbacks) {
  // 1. Shortcut action or Tab action
  const action = params.get('action');
  if (action) {
    console.log('[Duyar Capabilities] Shortcut action triggered:', action);
    if (action === 'new_note') {
      callbacks.onNoteTakingRequested?.();
    } else {
      callbacks.onNavigateAction?.(action);
    }
  }

  // 2. Share Target processing
  const sharedTitle = params.get('title');
  const sharedText = params.get('text');
  const sharedUrl = params.get('url');
  if (sharedTitle || sharedText || sharedUrl) {
    console.log('[Duyar Capabilities] Share Target data received:', { sharedTitle, sharedText, sharedUrl });
    callbacks.onShareReceived?.({
      title: sharedTitle || undefined,
      text: sharedText || undefined,
      url: sharedUrl || undefined
    });
  }

  // 3. Protocol Handler reference
  const propertyRef = params.get('property_ref');
  if (propertyRef) {
    console.log('[Duyar Capabilities] Protocol Handler query received:', propertyRef);
    callbacks.onProtocolReceived?.(propertyRef);
  }

  // 4. File Handler flag
  if (params.get('handle_file') === 'true') {
    console.log('[Duyar Capabilities] File Handler launch indicated.');
  }
}

/**
 * Retrieve current PWA App Capabilities status
 */
export function getAppCapabilitiesStatus(): PWACapabilitiesStatus {
  const isClient = typeof window !== 'undefined';
  const hasNavigator = isClient && typeof navigator !== 'undefined';

  return {
    shortcuts: true,
    fileHandlers: isClient && 'launchQueue' in window,
    launchHandler: isClient && 'launchQueue' in window,
    protocolHandlers: hasNavigator && 'registerProtocolHandler' in navigator,
    shareTarget: true,
    widgets: isClient && 'widgets' in (navigator.serviceWorker || {}),
    edgeSidePanel: true,
    windowControlsOverlay: hasNavigator && 'windowControlsOverlay' in navigator,
    tabbedDisplay: true,
    noteTaking: true
  };
}
