import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

export interface TourHotspot {
  id: string;
  targetRoomId?: string;
  title: string;
  type: 'nav' | 'info';
  yaw: number; // in degrees [-180, 180]
  pitch: number; // in degrees [-85, 85]
  description?: string;
}

export interface TourRoom {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  panoramaUrl: string;
  initialYaw?: number;
  initialPitch?: number;
  hotspots?: TourHotspot[];
}

interface VirtualTour360Props {
  propertyName?: string;
  propertyLocation?: string;
  initialRoomId?: string;
  rooms?: TourRoom[];
  isModal?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
}

// Procedural realistic equirectangular canvas generator
// Ensures the 360 tour always renders beautifully even with zero network or offline!
function createProceduralPanoCanvas(theme: 'living' | 'bedroom' | 'kitchen' | 'balcony' | 'dining'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // Background wall & atmosphere gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (theme === 'living') {
    bgGrad.addColorStop(0, '#1c2826'); // Ceiling
    bgGrad.addColorStop(0.3, '#102220');
    bgGrad.addColorStop(0.5, '#162d29'); // Eye level
    bgGrad.addColorStop(0.7, '#1b2322'); // Lower wall
    bgGrad.addColorStop(1, '#0c1413'); // Marble Floor
  } else if (theme === 'bedroom') {
    bgGrad.addColorStop(0, '#1d2229');
    bgGrad.addColorStop(0.3, '#14181f');
    bgGrad.addColorStop(0.5, '#1a222c');
    bgGrad.addColorStop(0.7, '#12171e');
    bgGrad.addColorStop(1, '#0d1015');
  } else if (theme === 'kitchen') {
    bgGrad.addColorStop(0, '#232526');
    bgGrad.addColorStop(0.3, '#191b1d');
    bgGrad.addColorStop(0.5, '#20262b');
    bgGrad.addColorStop(0.7, '#14181c');
    bgGrad.addColorStop(1, '#0e1114');
  } else if (theme === 'balcony') {
    bgGrad.addColorStop(0, '#0f2438'); // Open Sky
    bgGrad.addColorStop(0.3, '#133954');
    bgGrad.addColorStop(0.5, '#205c6e'); // City Skyline horizon
    bgGrad.addColorStop(0.7, '#19332e'); // Balcony Deck
    bgGrad.addColorStop(1, '#0c1716');
  } else {
    bgGrad.addColorStop(0, '#241f2a');
    bgGrad.addColorStop(0.3, '#19151e');
    bgGrad.addColorStop(0.5, '#231d2b');
    bgGrad.addColorStop(0.7, '#16121b');
    bgGrad.addColorStop(1, '#0e0b12');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Ceiling recessed LED spot lights
  ctx.fillStyle = 'rgba(255, 255, 230, 0.85)';
  ctx.shadowColor = '#13ecda';
  ctx.shadowBlur = 25;
  for (let x = 120; x < width; x += 240) {
    ctx.beginPath();
    ctx.arc(x, 140, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Floor Grid & Marble Reflections (lower 35%)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1.5;
  for (let y = height * 0.65; y < height; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let x = 0; x < width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.65);
    ctx.lineTo(x + 40, height);
    ctx.stroke();
  }

  // Large Panoramic Floor-to-Ceiling Glass Windows (Central & Side Views)
  const windowSegments = [
    { x: 300, w: 500, title: 'Dhaka City Skyline' },
    { x: 1200, w: 450, title: 'Gulshan Lake Vista' }
  ];

  windowSegments.forEach(win => {
    // Window Frame
    ctx.fillStyle = 'rgba(10, 20, 25, 0.9)';
    ctx.fillRect(win.x - 10, 220, win.w + 20, 420);

    // Glass Vista (Skyline silhouette)
    const glassGrad = ctx.createLinearGradient(0, 230, 0, 630);
    glassGrad.addColorStop(0, 'rgba(19, 236, 218, 0.15)');
    glassGrad.addColorStop(0.6, 'rgba(30, 80, 95, 0.25)');
    glassGrad.addColorStop(1, 'rgba(10, 25, 30, 0.4)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(win.x, 230, win.w, 400);

    // Architectural mullions
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.strokeRect(win.x, 230, win.w, 400);
    ctx.beginPath();
    ctx.moveTo(win.x + win.w / 2, 230);
    ctx.lineTo(win.x + win.w / 2, 630);
    ctx.stroke();

    // Distant city silhouette
    ctx.fillStyle = 'rgba(15, 35, 45, 0.6)';
    for (let bx = win.x + 20; bx < win.x + win.w - 30; bx += 35) {
      const bh = 50 + (Math.sin(bx * 0.1) * 30 + 40);
      ctx.fillRect(bx, 630 - bh, 28, bh);
    }
  });

  // Architectural Interior Feature Elements (Living room sofa / Kitchen island / Bedroom headboard)
  ctx.fillStyle = 'rgba(16, 34, 32, 0.85)';
  ctx.strokeStyle = 'rgba(19, 236, 218, 0.25)';
  ctx.lineWidth = 2;

  // Center feature block
  const fx = 880;
  const fy = 480;
  ctx.beginPath();
  ctx.roundRect(fx, fy, 260, 160, 16);
  ctx.fill();
  ctx.stroke();

  // Decorative wall artwork / feature panelling
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1750, 280, 200, 220, 10);
  ctx.fill();
  ctx.stroke();

  // Subtle ambient glow
  ctx.fillStyle = 'rgba(19, 236, 218, 0.04)';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 350, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// Default 5-Room Tour Setup for Dhaka Luxury Flats
export const DEFAULT_PROPERTY_ROOMS: TourRoom[] = [
  {
    id: 'living',
    name: 'Drawing & Living Lounge',
    subtitle: 'Spacious 480 sqft open-concept lounge with floor-to-ceiling panoramic glass',
    icon: 'chair',
    panoramaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2500&q=80',
    initialYaw: 0,
    initialPitch: 0,
    hotspots: [
      {
        id: 'hs-to-bed',
        targetRoomId: 'bedroom',
        title: 'Master Bedroom Suite',
        type: 'nav',
        yaw: 75,
        pitch: -4,
        description: 'Walk into the master suite with private attached balcony'
      },
      {
        id: 'hs-to-kitchen',
        targetRoomId: 'kitchen',
        title: 'Gourmet Kitchen',
        type: 'nav',
        yaw: -85,
        pitch: -6,
        description: 'Modern modular kitchen with granite tops'
      },
      {
        id: 'hs-to-balcony',
        targetRoomId: 'balcony',
        title: 'Sky Balcony Vista',
        type: 'nav',
        yaw: 165,
        pitch: 2,
        description: 'Step outside to the open-air city skyline balcony'
      },
      {
        id: 'hs-info-floor',
        title: 'Italian Marble Flooring',
        type: 'info',
        yaw: 15,
        pitch: -32,
        description: 'Premium imported 32x32 inch Italian marble with acoustic underlay'
      },
      {
        id: 'hs-info-ac',
        title: 'Central VRF Air Conditioning',
        type: 'info',
        yaw: 110,
        pitch: 26,
        description: 'Daikin inverter ceiling cassette with smart zone thermostats'
      }
    ]
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom Suite',
    subtitle: '280 sqft King Suite with walk-in wardrobe and en-suite bath access',
    icon: 'bed',
    panoramaUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=2500&q=80',
    initialYaw: 45,
    initialPitch: -5,
    hotspots: [
      {
        id: 'hs-bed-to-living',
        targetRoomId: 'living',
        title: 'Return to Living Lounge',
        type: 'nav',
        yaw: -120,
        pitch: -5,
        description: 'Back to main living area'
      },
      {
        id: 'hs-bed-to-balcony',
        targetRoomId: 'balcony',
        title: 'Bedroom Balcony',
        type: 'nav',
        yaw: 55,
        pitch: 0,
        description: 'Step out to the fresh morning air'
      },
      {
        id: 'hs-info-wardrobe',
        title: 'Floor-to-Ceiling Wardrobe',
        type: 'info',
        yaw: -35,
        pitch: 5,
        description: 'Built-in teak veneer cabinetry with automatic LED sensors'
      }
    ]
  },
  {
    id: 'kitchen',
    name: 'Modern Modular Kitchen',
    subtitle: 'Gourmet cooking space with exhaust chimney, gas connection & breakfast counter',
    icon: 'countertops',
    panoramaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2500&q=80',
    initialYaw: -30,
    initialPitch: -8,
    hotspots: [
      {
        id: 'hs-kitchen-to-living',
        targetRoomId: 'living',
        title: 'Return to Living Room',
        type: 'nav',
        yaw: 145,
        pitch: -5,
        description: 'Head to the living lounge'
      },
      {
        id: 'hs-kitchen-to-dining',
        targetRoomId: 'dining',
        title: 'Executive Dining Room',
        type: 'nav',
        yaw: 40,
        pitch: -4,
        description: 'Adjacent 8-seater dining hall'
      },
      {
        id: 'hs-info-chimney',
        title: 'Fotile Auto-Clean Chimney',
        type: 'info',
        yaw: -70,
        pitch: 18,
        description: 'High-suction 1400 m³/hr silent smoke extraction'
      }
    ]
  },
  {
    id: 'balcony',
    name: 'Scenic Sky Balcony',
    subtitle: 'High-floor open veranda with unobstructed city views and sunset horizon',
    icon: 'balcony',
    panoramaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2500&q=80',
    initialYaw: 90,
    initialPitch: 5,
    hotspots: [
      {
        id: 'hs-balcony-to-living',
        targetRoomId: 'living',
        title: 'Back to Living Lounge',
        type: 'nav',
        yaw: -170,
        pitch: -8,
        description: 'Step back indoors'
      },
      {
        id: 'hs-balcony-to-bed',
        targetRoomId: 'bedroom',
        title: 'Enter Master Suite',
        type: 'nav',
        yaw: -75,
        pitch: -6,
        description: 'Walk into the bedroom'
      },
      {
        id: 'hs-info-railing',
        title: 'Toughened Laminated Glass Railing',
        type: 'info',
        yaw: 60,
        pitch: -20,
        description: '12mm safety laminated glass with SS304 anti-rust handrail'
      }
    ]
  },
  {
    id: 'dining',
    name: 'Executive Dining Hall',
    subtitle: 'Connected dining room with decorative false ceiling and warm cove lighting',
    icon: 'dining',
    panoramaUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=2500&q=80',
    initialYaw: 15,
    initialPitch: -5,
    hotspots: [
      {
        id: 'hs-dining-to-living',
        targetRoomId: 'living',
        title: 'Main Lounge',
        type: 'nav',
        yaw: -95,
        pitch: -5,
        description: 'Walk through to drawing room'
      },
      {
        id: 'hs-dining-to-kitchen',
        targetRoomId: 'kitchen',
        title: 'Gourmet Kitchen',
        type: 'nav',
        yaw: 85,
        pitch: -6,
        description: 'Step into kitchen'
      }
    ]
  }
];

export const VirtualTour360: React.FC<VirtualTour360Props> = ({
  propertyName = 'Modern 3BHK Luxury Flat',
  propertyLocation = 'Block D, Banani, Dhaka',
  initialRoomId = 'living',
  rooms = DEFAULT_PROPERTY_ROOMS,
  isModal = false,
  onClose,
  onExpand,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoomId);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [activeInfoHotspot, setActiveInfoHotspot] = useState<TourHotspot | null>(null);
  const [isLoadingTexture, setIsLoadingTexture] = useState<boolean>(false);
  const [currentHeadingDeg, setCurrentHeadingDeg] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(75); // FOV degrees

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Interaction coordinates
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>(0);
  const targetYawRef = useRef<number>(0);
  const targetPitchRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startYawPitchRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const lastUserInteractionTimeRef = useRef<number>(Date.now());
  const pinchDistanceRef = useRef<number | null>(null);

  // Projected 2D screen positions for DOM-based hotspots
  const [projectedHotspots, setProjectedHotspots] = useState<
    { hotspot: TourHotspot; x: number; y: number; visible: boolean }[]
  >([]);

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === activeRoomId) || rooms[0];
  }, [rooms, activeRoomId]);

  // Compass directions
  const compassHeadingText = useMemo(() => {
    let norm = ((currentHeadingDeg % 360) + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) return 'N';
    if (norm >= 22.5 && norm < 67.5) return 'NE';
    if (norm >= 67.5 && norm < 112.5) return 'E';
    if (norm >= 112.5 && norm < 157.5) return 'SE';
    if (norm >= 157.5 && norm < 202.5) return 'S';
    if (norm >= 202.5 && norm < 247.5) return 'SW';
    if (norm >= 247.5 && norm < 292.5) return 'W';
    return 'NW';
  }, [currentHeadingDeg]);

  // Load Room Panorama Texture with Procedural Fallback
  const loadRoomTexture = useCallback(
    (room: TourRoom) => {
      if (!sphereMeshRef.current) return;
      setIsLoadingTexture(true);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';

      const applyTexture = (texture: THREE.Texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if (sphereMeshRef.current) {
          const mat = sphereMeshRef.current.material as THREE.MeshBasicMaterial;
          if (mat.map) {
            mat.map.dispose();
          }
          mat.map = texture;
          mat.needsUpdate = true;
        }
        setIsLoadingTexture(false);
      };

      const fallbackToProcedural = () => {
        const theme =
          room.id === 'bedroom'
            ? 'bedroom'
            : room.id === 'kitchen'
            ? 'kitchen'
            : room.id === 'balcony'
            ? 'balcony'
            : room.id === 'dining'
            ? 'dining'
            : 'living';

        const canvas = createProceduralPanoCanvas(theme);
        const canvasTexture = new THREE.CanvasTexture(canvas);
        applyTexture(canvasTexture);
      };

      // Attempt to load external panorama image, fall back seamlessly if network fails
      textureLoader.load(
        room.panoramaUrl,
        (loadedTex) => {
          applyTexture(loadedTex);
        },
        undefined,
        () => {
          // Fallback to high quality procedural panorama canvas
          fallbackToProcedural();
        }
      );
    },
    []
  );

  // Initialize Three.js Scene, Sphere & Camera
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1200);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Inverted Sphere for 360° Interior Panorama
    // Radius 500, inverted on X axis to point faces inward
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const initialCanvas = createProceduralPanoCanvas('living');
    const initialTexture = new THREE.CanvasTexture(initialCanvas);
    initialTexture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: initialTexture,
    });

    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Clear previous children and mount canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Initial orientation
    yawRef.current = activeRoom.initialYaw || 0;
    pitchRef.current = activeRoom.initialPitch || 0;
    targetYawRef.current = yawRef.current;
    targetPitchRef.current = pitchRef.current;

    // Load active room texture
    loadRoomTexture(activeRoom);

    // Render loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Idle auto-rotation
      const timeSinceInteraction = Date.now() - lastUserInteractionTimeRef.current;
      if (isAutoRotating && !isPointerDownRef.current && timeSinceInteraction > 1500) {
        targetYawRef.current += 0.09;
      }

      // Smooth damping interpolation
      yawRef.current += (targetYawRef.current - yawRef.current) * 0.1;
      pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.1;

      // Restrict pitch to avoid flipping (-85° to 85°)
      pitchRef.current = Math.max(-85, Math.min(85, pitchRef.current));
      targetPitchRef.current = Math.max(-85, Math.min(85, targetPitchRef.current));

      // Update current heading for compass
      setCurrentHeadingDeg(Math.round(yawRef.current % 360));

      // Calculate camera lookAt vector using spherical coordinates
      const phi = THREE.MathUtils.degToRad(90 - pitchRef.current);
      const theta = THREE.MathUtils.degToRad(yawRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);

      // Project hotspots to 2D screen positions
      if (showHotspots && activeRoom.hotspots && activeRoom.hotspots.length > 0) {
        const cWidth = container.clientWidth;
        const cHeight = container.clientHeight;

        const projected = activeRoom.hotspots.map((hs) => {
          const hPhi = THREE.MathUtils.degToRad(90 - hs.pitch);
          const hTheta = THREE.MathUtils.degToRad(hs.yaw);

          const hPos = new THREE.Vector3(
            450 * Math.sin(hPhi) * Math.cos(hTheta),
            450 * Math.cos(hPhi),
            450 * Math.sin(hPhi) * Math.sin(hTheta)
          );

          // Project into NDC space
          const ndc = hPos.clone().project(camera);

          // Visible if in front of camera (ndc.z < 1) and roughly inside viewport bounds
          const visible = ndc.z < 1 && ndc.x >= -1.2 && ndc.x <= 1.2 && ndc.y >= -1.2 && ndc.y <= 1.2;
          const x = (ndc.x * 0.5 + 0.5) * cWidth;
          const y = (-(ndc.y * 0.5) + 0.5) * cHeight;

          return {
            hotspot: hs,
            x,
            y,
            visible,
          };
        });

        setProjectedHotspots(projected);
      } else {
        setProjectedHotspots([]);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (material.map) material.map.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // When active room changes, load texture and position camera
  const handleRoomChange = (roomId: string) => {
    if (roomId === activeRoomId) return;
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    setActiveRoomId(roomId);
    setActiveInfoHotspot(null);
    lastUserInteractionTimeRef.current = Date.now();

    // Subtle transition reset
    if (targetRoom.initialYaw !== undefined) {
      targetYawRef.current = targetRoom.initialYaw;
    }
    if (targetRoom.initialPitch !== undefined) {
      targetPitchRef.current = targetRoom.initialPitch;
    }

    loadRoomTexture(targetRoom);
  };

  // Pointer / Touch Swipe Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    startYawPitchRef.current = { yaw: targetYawRef.current, pitch: targetPitchRef.current };
    lastUserInteractionTimeRef.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    lastUserInteractionTimeRef.current = Date.now();

    const dx = e.clientX - pointerStartPosRef.current.x;
    const dy = e.clientY - pointerStartPosRef.current.y;

    // Sensitivity adjusted with zoom level FOV
    const fovRatio = (cameraRef.current?.fov || 75) / 75;
    const sensitivity = 0.18 * fovRatio;

    targetYawRef.current = startYawPitchRef.current.yaw - dx * sensitivity;
    targetPitchRef.current = Math.max(-85, Math.min(85, startYawPitchRef.current.pitch + dy * sensitivity));
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    pinchDistanceRef.current = null;
    lastUserInteractionTimeRef.current = Date.now();
  };

  // Touch Pinch Zoom Handler
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && cameraRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (pinchDistanceRef.current !== null) {
        const delta = pinchDistanceRef.current - dist;
        const newFov = Math.max(38, Math.min(100, cameraRef.current.fov + delta * 0.12));
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
        setZoomLevel(Math.round(newFov));
      }
      pinchDistanceRef.current = dist;
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    lastUserInteractionTimeRef.current = Date.now();

    const newFov = Math.max(38, Math.min(100, cameraRef.current.fov + e.deltaY * 0.05));
    cameraRef.current.fov = newFov;
    cameraRef.current.updateProjectionMatrix();
    setZoomLevel(Math.round(newFov));
  };

  // Reset Camera View to initial room orientation
  const handleResetView = () => {
    targetYawRef.current = activeRoom.initialYaw || 0;
    targetPitchRef.current = activeRoom.initialPitch || 0;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
      setZoomLevel(75);
    }
    lastUserInteractionTimeRef.current = Date.now();
  };

  // Hotspot Click
  const handleHotspotClick = (hs: TourHotspot) => {
    lastUserInteractionTimeRef.current = Date.now();
    if (hs.type === 'nav' && hs.targetRoomId) {
      handleRoomChange(hs.targetRoomId);
    } else if (hs.type === 'info') {
      setActiveInfoHotspot(activeInfoHotspot?.id === hs.id ? null : hs);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none font-display text-white ${
        isModal
          ? 'fixed inset-0 z-[100] h-screen w-screen bg-background-dark flex flex-col'
          : 'h-[380px] sm:h-[440px] rounded-3xl border border-white/10 bg-background-dark shadow-2xl'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing touch-none z-0"
        title="Swipe or drag to look around 360°"
      />

      {/* DOM-Based In-Scene Hotspots (Navigation Portals & Info Markers) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {showHotspots &&
          projectedHotspots.map(({ hotspot, x, y, visible }) => {
            if (!visible) return null;

            const isNav = hotspot.type === 'nav';
            const isInfoActive = activeInfoHotspot?.id === hotspot.id;

            return (
              <div
                key={hotspot.id}
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
                }}
                className="absolute pointer-events-auto transition-transform duration-75"
              >
                {isNav ? (
                  /* Navigation Portal Pin */
                  <button
                    type="button"
                    onClick={() => handleHotspotClick(hotspot)}
                    className="group relative flex items-center gap-2 p-1.5 pr-3 rounded-full bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,218,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={`Enter ${hotspot.title}`}
                  >
                    <span className="size-7 rounded-full bg-background-dark text-primary flex items-center justify-center font-black animate-pulse">
                      <span className="material-symbols-outlined text-base">directions_walk</span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                      {hotspot.title}
                    </span>
                  </button>
                ) : (
                  /* Info Inspection Pin */
                  <button
                    type="button"
                    onClick={() => handleHotspotClick(hotspot)}
                    className={`group relative size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isInfoActive
                        ? 'bg-amber-400 text-background-dark scale-110 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                        : 'bg-black/80 hover:bg-amber-400/90 text-amber-300 hover:text-background-dark border border-amber-400/50 backdrop-blur-md shadow-lg hover:scale-110'
                    }`}
                    title={hotspot.title}
                  >
                    <span className="material-symbols-outlined text-base font-bold">info</span>
                    {/* Radar ping ring */}
                    <span className="absolute -inset-1 rounded-full border border-amber-400/60 animate-ping pointer-events-none" />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Info Hotspot Popup Dialog */}
      {activeInfoHotspot && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-[320px] w-[90%] p-4 rounded-2xl bg-background-dark/95 border border-amber-400/40 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm font-bold">verified</span>
              </span>
              <h5 className="text-xs font-black uppercase tracking-tight text-white">
                {activeInfoHotspot.title}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setActiveInfoHotspot(null)}
              className="size-6 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {activeInfoHotspot.description && (
            <p className="text-[11px] text-white/70 font-sans mt-2 leading-relaxed">
              {activeInfoHotspot.description}
            </p>
          )}
        </div>
      )}

      {/* Top Overlay Bar: Property Branding, Room Name & Actions */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Room Badge & Compass */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-card px-3 py-1.5 rounded-2xl border border-white/15 bg-background-dark/85 backdrop-blur-xl flex items-center gap-2.5 shadow-xl">
            <div className="size-2 rounded-full bg-primary animate-ping" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">360° Tour</span>
                <span className="text-[8px] font-bold text-white/40 uppercase">· {compassHeadingText}</span>
              </div>
              <h4 className="text-xs font-black uppercase italic tracking-tight text-white truncate max-w-[150px] sm:max-w-[200px]">
                {activeRoom.name}
              </h4>
            </div>
          </div>
        </div>

        {/* Right: Quick Viewer Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Auto-rotate Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`size-9 rounded-2xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md active:scale-95 ${
              isAutoRotating
                ? 'bg-primary/20 border border-primary/50 text-primary shadow-[0_0_15px_rgba(19,236,218,0.3)]'
                : 'bg-background-dark/80 border border-white/15 text-white/70 hover:text-white'
            }`}
            title={isAutoRotating ? 'Pause Auto-Pan' : 'Start Auto-Pan'}
          >
            <span className="material-symbols-outlined text-lg">
              {isAutoRotating ? 'motion_photos_on' : 'motion_photos_off'}
            </span>
          </button>

          {/* Toggle Hotspots */}
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`size-9 rounded-2xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md active:scale-95 ${
              showHotspots
                ? 'bg-primary/20 border border-primary/50 text-primary'
                : 'bg-background-dark/80 border border-white/15 text-white/70 hover:text-white'
            }`}
            title={showHotspots ? 'Hide Room Portals' : 'Show Room Portals'}
          >
            <span className="material-symbols-outlined text-lg">explore</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetView}
            className="size-9 rounded-2xl bg-background-dark/80 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all"
            title="Reset Perspective"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
          </button>

          {/* Fullscreen / Expand Trigger */}
          {!isModal && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="size-9 rounded-2xl bg-primary hover:bg-primary/90 text-background-dark flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all font-black"
              title="Open Fullscreen Virtual Tour"
            >
              <span className="material-symbols-outlined text-lg font-black">fullscreen</span>
            </button>
          )}

          {/* Close Modal (if in fullscreen mode) */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-2xl bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
              title="Exit Fullscreen Tour"
            >
              <span className="material-symbols-outlined text-lg font-bold">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Gesture Instruction Watermark (fades after 4 seconds) */}
      <div className="absolute inset-x-0 top-16 flex justify-center pointer-events-none z-10 animate-out fade-out fill-mode-forwards duration-1000 delay-3000">
        <div className="px-3.5 py-1.5 rounded-full bg-background-dark/80 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white/70 flex items-center gap-1.5 shadow-lg">
          <span className="material-symbols-outlined text-xs text-primary animate-pulse">swipe</span>
          <span>Swipe or Drag to Look Around</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingTexture && (
        <div className="absolute inset-0 z-30 bg-background-dark/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="glass-card px-4 py-2.5 rounded-2xl border border-primary/30 flex items-center gap-2.5 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-xl animate-spin">progress_activity</span>
            <span className="text-xs font-black uppercase tracking-wider text-white">Loading Panorama...</span>
          </div>
        </div>
      )}

      {/* Bottom Room Switcher Carousel */}
      <div className="absolute bottom-3 left-3 right-3 z-20">
        <div className="glass-card p-2 rounded-2xl border border-white/15 bg-background-dark/85 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[9px] font-black uppercase tracking-widest text-white/40">
            <span>Select Room ({rooms.length} Rooms Available)</span>
            <span className="text-primary font-mono font-bold">FOV: {zoomLevel}°</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {rooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomChange(room.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-background-dark border-primary shadow-lg shadow-primary/25 font-black'
                      : 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      isActive ? 'text-background-dark font-black' : 'text-primary'
                    }`}
                  >
                    {room.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold leading-tight truncate max-w-[110px] sm:max-w-[140px]">
                      {room.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTour360;
