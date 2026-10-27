import React, { useEffect, useRef, useState } from 'react';
import { Screen, Property } from '../types';
import BottomNav from './BottomNav';
import { supabase } from '../supabase';
import { haptics } from '../haptics';
import { 
  PREDEFINED_AREAS, 
  AreaZone, 
  matchPredefinedArea, 
  getAreaProperties, 
  generateDynamicAreaProperties,
  CURATED_AREA_PROPERTIES,
  getDistanceInMeters
} from '../areaData';
import { 
  getAllPropertiesCombined, 
  subscribeToProperties, 
  getPendingFocusProperty, 
  clearPendingFocusProperty 
} from '../propertyStorage';
import { VerifiedBadge } from './VerifiedBadge';
import { getListingProviderVerification, canUserPostProperty } from '../providerApplicationsStorage';

interface Props {
  onSearch: () => void;
  onProfile: () => void;
  onCategories: () => void;
  onWallet: () => void;
  onPostAd: () => void;
  onHistory: () => void;
  onNotifications: () => void;
  onFilter: () => void;
  onPropertySelect?: (property: Property) => void;
  isAdmin?: boolean;
  onNavigate: (screen: Screen) => void;
  lang?: 'EN' | 'BN';
  onToggleLang?: () => void;
  userProfile?: any;
}

const HomeScreen: React.FC<Props> = ({ 
  onPostAd, onFilter, onPropertySelect, onNavigate, lang = 'EN', onToggleLang, isAdmin, userProfile 
}) => {
  const isBn = lang === 'BN';
  const canPostProperty = canUserPostProperty(userProfile) || Boolean(isAdmin);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const markerInstancesRef = useRef<Map<string, any>>(new Map());
  const markedAreaLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<any>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticFlightRef = useRef<boolean>(false);
  const isUserPannedRef = useRef<boolean>(false);
  const heatmapLayerRef = useRef<any>(null);
  const isAutoFollowingRef = useRef<boolean>(true);
  const activeAreaRef = useRef<AreaZone | null>(null);
  const radiusCircleRef = useRef<any>(null);
  const searchRadiusRef = useRef<number>(1200);
  const showRadiusSliderRef = useRef<boolean>(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const [mapType, setMapType] = useState<'ROADMAP' | 'HYBRID'>('ROADMAP');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Dynamic Radius Slider States - Default to false so Search Radius stays unclicked on login
  const [searchRadius, setSearchRadius] = useState<number>(1200); // in meters
  const [showRadiusSlider, setShowRadiusSlider] = useState<boolean>(false);
  const [isRadiusSliderMinimized, setIsRadiusSliderMinimized] = useState<boolean>(false);
  
  // Area Focus State
  const [activeArea, setActiveArea] = useState<AreaZone | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showPropertyCards, setShowPropertyCards] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  // Keep refs synchronized with state
  useEffect(() => {
    isAutoFollowingRef.current = isAutoFollowing;
  }, [isAutoFollowing]);

  useEffect(() => {
    activeAreaRef.current = activeArea;
  }, [activeArea]);

  useEffect(() => {
    searchRadiusRef.current = searchRadius;
  }, [searchRadius]);

  useEffect(() => {
    showRadiusSliderRef.current = showRadiusSlider;
  }, [showRadiusSlider]);

  // Data State
  const [allDbProperties, setAllDbProperties] = useState<Property[]>([]);
  const [displayedProperties, setDisplayedProperties] = useState<Property[]>([]);

  const defaultCoords: [number, number] = [23.7937, 90.4066]; // Banani default

  // Format radius display (e.g. 500 m or 1.5 km)
  const formatRadius = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Get active map center coordinates
  const getActiveCenter = (): [number, number] => {
    if (activeAreaRef.current) {
      return [activeAreaRef.current.lat, activeAreaRef.current.lng];
    }
    return userCoords || defaultCoords;
  };

  // Filter properties in real time by distance to center
  const filterPropertiesByRadius = (
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
    areaName?: string
  ): Property[] => {
    const { id: pendingId } = getPendingFocusProperty();
    const filtered = allDbProperties.filter(p => {
      if (p.lat == null || p.lng == null) return false;
      // Newly posted property is always included on the map!
      if (pendingId && p.id === pendingId) return true;
      const dist = getDistanceInMeters(centerLat, centerLng, p.lat, p.lng);
      return dist <= radiusMeters;
    });

    // If strictly radius-filtered is empty, fallback to allDbProperties so map pins are never lost
    return filtered.length > 0 ? filtered : allDbProperties;
  };

  // Draw or update Red Circle area coverage on map (Red Circled visual feedback)
  const drawOrUpdateRedCircle = (
    centerLat: number, 
    centerLng: number, 
    radiusMeters: number, 
    force: boolean = false
  ) => {
    const L = (window as any).L;
    if (!mapRef.current || !L || !markedAreaLayerRef.current) return;

    // Only draw red circle if Search Radius tab is clicked/active or an area is actively searched
    if (!force && !showRadiusSliderRef.current && !activeAreaRef.current) {
      markedAreaLayerRef.current.clearLayers();
      radiusCircleRef.current = null;
      return;
    }

    if (radiusCircleRef.current && markedAreaLayerRef.current.hasLayer(radiusCircleRef.current)) {
      radiusCircleRef.current.setLatLng([centerLat, centerLng]);
      radiusCircleRef.current.setRadius(radiusMeters);
    } else {
      markedAreaLayerRef.current.clearLayers();
      radiusCircleRef.current = L.circle([centerLat, centerLng], {
        color: '#ef4444',       // Vibrant red border for covered area
        weight: 2.5,
        opacity: 0.95,
        dashArray: '6, 6',     // Crisp red dashed boundary
        fillColor: '#ef4444',  // Red semi-transparent fill
        fillOpacity: 0.12,
        radius: radiusMeters
      }).addTo(markedAreaLayerRef.current);
    }
  };

  // Sync red circle whenever user clicks / unclicks Search Radius tab
  useEffect(() => {
    if (showRadiusSlider) {
      const [lat, lng] = getActiveCenter();
      drawOrUpdateRedCircle(lat, lng, searchRadiusRef.current, true);
    } else if (!activeAreaRef.current) {
      if (markedAreaLayerRef.current) {
        markedAreaLayerRef.current.clearLayers();
        radiusCircleRef.current = null;
      }
    }
  }, [showRadiusSlider]);

  // Dynamic radius slider real-time updater
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    searchRadiusRef.current = newRadius;

    const [centerLat, centerLng] = getActiveCenter();

    // 1. Instantly update the Red Circle visual on the Leaflet map (60fps feedback)
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(newRadius);
    } else if (showRadiusSliderRef.current || activeAreaRef.current) {
      drawOrUpdateRedCircle(centerLat, centerLng, newRadius, true);
    }

    // 2. Real-time property search results filtering
    const filtered = filterPropertiesByRadius(
      centerLat,
      centerLng,
      newRadius,
      activeAreaRef.current?.name
    );
    setDisplayedProperties(filtered);
  };

  // Smoothly fit map view to the current red radius circle
  const handleFitMapToCircle = () => {
    if (radiusCircleRef.current && mapRef.current) {
      isProgrammaticFlightRef.current = true;
      mapRef.current.fitBounds(radiusCircleRef.current.getBounds(), {
        padding: [50, 50],
        animate: true,
        duration: 1.2
      });
    }
  };

  // --- Data Fetching ---
  const fetchAllProperties = async () => {
    try {
      let mapped: Property[] = [];
      const { data, error } = await supabase.from('properties').select('*').limit(50);
      if (!error && data && data.length > 0) {
        mapped = data.map((p: any) => {
          const isVfd = Boolean(p.is_verified ?? p.verified ?? p.isVerified ?? (p.status === 'APPROVED'));
          const isFtd = Boolean(p.is_featured ?? p.featured ?? p.isFeatured ?? p.tag?.toLowerCase().includes('featured') ?? p.tag?.toLowerCase().includes('boost'));
          return {
            id: p.id,
            lat: Number(p.latitude ?? p.lat ?? 23.7937),
            lng: Number(p.longitude ?? p.lng ?? 90.4066),
            title: p.title || 'Apartment',
            price: p.price || '৳ 0',
            type: p.type || 'Apartment',
            beds: Number(p.beds) || 2,
            baths: Number(p.baths) || 2,
            sqft: Number(p.sqft) || 1000,
            location: p.location || 'Dhaka, Bangladesh',
            tag: p.tag || 'FOR RENT',
            availableMonth: p.available_month || 'Immediate',
            image: p.image_url || p.image || '',
            images: p.images || (p.image_url ? [p.image_url] : []),
            isVerified: isVfd,
            isFeatured: isFtd,
            metadata: {
              verified: isVfd,
              featured: isFtd,
              verifiedBy: isVfd ? 'Duyar Field Inspection Team' : undefined,
              ...(p.metadata || {})
            }
          };
        });
      }

      // Merge with newly posted properties & seeds to ensure every post is on the map
      const combined = getAllPropertiesCombined(mapped);
      setAllDbProperties(combined);
    } catch (err) {
      console.error('Property fetch error:', err);
      const combined = getAllPropertiesCombined([]);
      setAllDbProperties(combined);
    }
  };

  useEffect(() => {
    fetchAllProperties();

    // Subscribe to new property publishing events so new posts appear on map immediately
    const unsubscribe = subscribeToProperties(() => {
      fetchAllProperties();
    });

    // Default state: no searched area active; map stays on user's current location by default
    setActiveArea(null);
    activeAreaRef.current = null;
    setIsAutoFollowing(true);
    isAutoFollowingRef.current = true;

    return unsubscribe;
  }, []);

  // When a property was just posted, automatically fly map directly to its pin and open card!
  useEffect(() => {
    const { id, coords } = getPendingFocusProperty();
    if (id && allDbProperties.length > 0 && mapRef.current) {
      const target = allDbProperties.find(p => p.id === id);
      const targetCoords: [number, number] | null = coords || (target?.lat && target?.lng ? [target.lat, target.lng] : null);

      if (targetCoords) {
        clearPendingFocusProperty();
        setSelectedPropertyId(id);
        setShowPropertyCards(true);
        isProgrammaticFlightRef.current = true;
        setIsAutoFollowing(false);
        isAutoFollowingRef.current = false;

        // Fly directly to the newly pinned property on the map
        mapRef.current.flyTo(targetCoords, 16.5, {
          animate: true,
          duration: 1.8,
          easeLinearity: 0.25
        });

        // Ensure newly published property is visible in displayed properties
        setDisplayedProperties(prev => {
          if (target && !prev.some(p => p.id === id)) {
            return [target, ...prev];
          }
          return prev;
        });

        setTimeout(() => {
          const el = document.getElementById(`property-card-${id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 500);
      }
    }
  }, [allDbProperties]);

  // --- Map Initialization ---
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Safeguard Leaflet DomUtil against detached DOM elements
    if (L.DomUtil && !L.DomUtil._safePosGuarded) {
      const origGetPos = L.DomUtil.getPosition;
      L.DomUtil.getPosition = function(el: any) {
        if (!el) return new L.Point(0, 0);
        try {
          return origGetPos ? origGetPos.call(this, el) : (el._leaflet_pos || new L.Point(0, 0));
        } catch (e) {
          return new L.Point(0, 0);
        }
      };
      const origSetPos = L.DomUtil.setPosition;
      L.DomUtil.setPosition = function(el: any, point: any) {
        if (!el) return;
        try {
          if (origSetPos) origSetPos.call(this, el, point);
          else el._leaflet_pos = point;
        } catch (e) {}
      };
      L.DomUtil._safePosGuarded = true;
    }

    if (!mapRef.current) {
      // Clear any prior leaflet id on container to prevent init collisions
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const bdBounds = [
        [20.34, 88.01],
        [26.64, 92.67]
      ];

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 7,
        maxBounds: bdBounds,
        maxBoundsViscosity: 1.0
      }).setView(defaultCoords, 15);

      tileLayerRef.current = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      }).addTo(mapRef.current);

      // Area Mark Layer (Red circle boundary and search coverage)
      markedAreaLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Property Markers Layer with Leaflet Marker Clustering
      const createClusterIcon = (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 44;
        let html = '';

        if (count >= 20) {
          size = 52;
          html = `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-[#13ecda] opacity-35 pointer-events-none"></span>
              <div class="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#13ecda]/40 to-[#00b4d8]/40 blur-sm group-hover:opacity-100 transition-all"></div>
              <div class="relative w-[52px] h-[52px] rounded-full bg-[#0a1211]/95 border-2 border-[#13ecda] flex flex-col items-center justify-center shadow-[0_6px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(19,236,218,0.55)] backdrop-blur-xl ring-2 ring-[#13ecda]/30 transition-transform duration-200 group-hover:scale-110">
                <span class="text-[#13ecda] text-sm font-black leading-none">${count}</span>
                <span class="text-[7.5px] font-extrabold uppercase text-white/90 tracking-tighter leading-none mt-0.5">Homes</span>
              </div>
            </div>
          `;
        } else if (count >= 6) {
          size = 48;
          html = `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute -inset-1 rounded-full bg-[#13ecda]/30 blur-sm group-hover:bg-[#13ecda]/60 transition-all"></div>
              <div class="relative w-12 h-12 rounded-full bg-[#0a1211]/95 border-2 border-[#13ecda] flex flex-col items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(19,236,218,0.45)] backdrop-blur-xl ring-1 ring-[#13ecda]/40 transition-transform duration-200 group-hover:scale-110">
                <span class="text-white text-xs font-black leading-none">${count}</span>
                <span class="text-[7.5px] font-extrabold uppercase text-[#13ecda] tracking-tighter leading-none mt-0.5">Homes</span>
              </div>
            </div>
          `;
        } else {
          size = 44;
          html = `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute -inset-1 rounded-full bg-[#13ecda]/25 blur-sm group-hover:bg-[#13ecda]/50 transition-all"></div>
              <div class="relative w-11 h-11 rounded-full bg-[#0a1211]/95 border-2 border-[#13ecda] flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(19,236,218,0.4)] backdrop-blur-xl transition-transform duration-200 group-hover:scale-110">
                <span class="text-white text-xs font-black leading-none">${count}</span>
                <span class="text-[7.5px] font-extrabold uppercase text-[#13ecda] tracking-tighter leading-none mt-0.5">Homes</span>
              </div>
            </div>
          `;
        }

        return L.divIcon({
          html,
          className: 'duyar-custom-cluster',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
      };

      if (typeof L.markerClusterGroup === 'function') {
        markersLayerRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          spiderfyDistanceMultiplier: 1.5,
          removeOutsideVisibleBounds: true,
          animate: true,
          animateAddingMarkers: false,
          disableClusteringAtZoom: 18,
          maxClusterRadius: 45,
          chunkedLoading: true,
          iconCreateFunction: createClusterIcon
        }).addTo(mapRef.current);
      } else {
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      // Draw initial Red Circle covering default coordinates only if Search Radius is active
      if (showRadiusSliderRef.current) {
        drawOrUpdateRedCircle(defaultCoords[0], defaultCoords[1], searchRadiusRef.current, true);
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 500);

      mapRef.current.on('dragstart', () => {
        setIsAutoFollowing(false);
        isAutoFollowingRef.current = false;
        setShowSuggestions(false);
        isUserPannedRef.current = true;
      });

      mapRef.current.on('moveend', () => {
        if (isProgrammaticFlightRef.current) {
          isProgrammaticFlightRef.current = false;
          return;
        }
        setTimeout(() => {
          if (!isAutoFollowingRef.current && isUserPannedRef.current) setShowSearchAreaBtn(true);
        }, 300);
      });

      mapRef.current.on('zoom', () => {
        if (mapRef.current) {
          setCurrentZoom(Math.round(mapRef.current.getZoom()));
        }
      });

      mapRef.current.on('zoomend', () => {
        if (mapRef.current) {
          setCurrentZoom(Math.round(mapRef.current.getZoom()));
        }
      });

      const handleResize = () => {
        mapRef.current?.invalidateSize();
      };
      window.addEventListener('resize', handleResize);

      // User location tracker: map always stays on user's current location by default if no search is active
      if (navigator.geolocation) {
        // Immediate position check on startup
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const liveCoords: [number, number] = [latitude, longitude];
            setUserCoords(liveCoords);

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng(liveCoords);
            } else if (mapRef.current) {
              const userIcon = L.divIcon({
                className: 'user-location-pip',
                html: `<div class="relative flex items-center justify-center"><div class="bip-ring"></div><div class="relative w-5 h-5 bg-[#4285F4] rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(66,133,244,0.6)]"></div></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              userMarkerRef.current = L.marker(liveCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
            }

            // Immediately center map on user's current location and update red circle coverage if active
            if (!activeAreaRef.current && isAutoFollowingRef.current && mapRef.current) {
              isProgrammaticFlightRef.current = true;
              mapRef.current.setView(liveCoords, 16);
              if (showRadiusSliderRef.current) {
                drawOrUpdateRedCircle(liveCoords[0], liveCoords[1], searchRadiusRef.current, true);
              }
              const nearby = filterPropertiesByRadius(liveCoords[0], liveCoords[1], searchRadiusRef.current);
              setDisplayedProperties(nearby);
            }
          },
          (err) => console.warn("Initial geo error:", err),
          { enableHighAccuracy: true, timeout: 8000 }
        );

        // Continuous watch position: keeps staying on user's current location by default
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const liveCoords: [number, number] = [latitude, longitude];
            setUserCoords(liveCoords);

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng(liveCoords);
            } else if (mapRef.current) {
              const userIcon = L.divIcon({
                className: 'user-location-pip',
                html: `<div class="relative flex items-center justify-center"><div class="bip-ring"></div><div class="relative w-5 h-5 bg-[#4285F4] rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(66,133,244,0.6)]"></div></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              userMarkerRef.current = L.marker(liveCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
            }

            // Always stay on user's current location by default when not in an active searched area
            if (!activeAreaRef.current && isAutoFollowingRef.current && mapRef.current) {
              isProgrammaticFlightRef.current = true;
              mapRef.current.panTo(liveCoords, { animate: true, duration: 1.0 });
              if (radiusCircleRef.current && (showRadiusSliderRef.current || activeAreaRef.current)) {
                radiusCircleRef.current.setLatLng(liveCoords);
              }
            }
          },
          (err) => console.warn("Watch geo error:", err),
          { enableHighAccuracy: true }
        );
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); 

  // --- Mark Area On Map with Red Circled Visual Feedback & Smooth Transition ---
  const markAreaAndFocus = (area: AreaZone, options?: { duration?: number; zoom?: number; radius?: number }) => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;

    // 1. Dismiss mobile keyboard smoothly and close search suggestions
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowSuggestions(false);
    setIsAutoFollowing(false);
    isAutoFollowingRef.current = false;
    setShowSearchAreaBtn(false);
    setShowPropertyCards(false);
    isUserPannedRef.current = false;
    isProgrammaticFlightRef.current = true;

    const chosenRadius = options?.radius ?? (area.radius || searchRadiusRef.current);
    setSearchRadius(chosenRadius);
    searchRadiusRef.current = chosenRadius;

    // 2. Resolve listed properties specifically available in this area within red circle radius
    const areaProps = filterPropertiesByRadius(area.lat, area.lng, chosenRadius, area.name);
    setDisplayedProperties(areaProps);
    setActiveArea(area);
    activeAreaRef.current = area;
    setSearchQuery(area.name);

    // 3. Draw clean Red Circled coverage boundary on map
    drawOrUpdateRedCircle(area.lat, area.lng, chosenRadius);

    // 4. Smooth fly-to animation with gentle ease-in-out deceleration
    const flightDuration = options?.duration ?? 1.8;
    const flightZoom = options?.zoom ?? (chosenRadius > 2500 ? 13.8 : chosenRadius > 1500 ? 14.5 : 15.2);

    mapRef.current.flyTo([area.lat, area.lng], flightZoom, {
      animate: true,
      duration: flightDuration,
      easeLinearity: 0.25
    });
  };

  // Re-run mark whenever allDbProperties load or activeArea changes
  useEffect(() => {
    if (activeArea && mapRef.current) {
      markAreaAndFocus(activeArea);
    } else if (allDbProperties.length > 0 && !activeArea) {
      const [lat, lng] = getActiveCenter();
      const filtered = filterPropertiesByRadius(lat, lng, searchRadiusRef.current);
      setDisplayedProperties(filtered);
    }
  }, [allDbProperties]);

  // --- Render Property Markers on the Map ---
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markersLayerRef.current) return;

    if (typeof markersLayerRef.current.unspiderfy === 'function') {
      try {
        markersLayerRef.current.unspiderfy();
      } catch (e) {}
    }
    markersLayerRef.current.clearLayers();
    markerInstancesRef.current.clear();

    const markersToAdd: any[] = [];

    displayedProperties.forEach(p => {
      const isSelected = selectedPropertyId === p.id;
      const vInfo = getListingProviderVerification(p);
      const isVerified = vInfo.isVerified;
      const isLocatorVerified = vInfo.role === 'LOCATOR' && isVerified;
      const badgeBadgeBg = isLocatorVerified ? 'bg-[#13ecda] text-black' : 'bg-emerald-500 text-white';
      const iconHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 hover:scale-115 origin-bottom ${isSelected ? 'scale-115 z-[9999]' : 'z-[500]'}">
          <div class="flex items-center gap-2 ${isSelected ? 'bg-[#13ecda] text-black ring-4 ring-[#13ecda]/40' : 'bg-white/95 text-black'} backdrop-blur-xl shadow-[0_6px_25px_rgba(0,0,0,0.4)] p-1 pr-3 rounded-full border ${isSelected ? 'border-white' : 'border-white/60'}">
            <div class="relative w-8 h-8 rounded-full bg-gray-200 bg-cover bg-center shrink-0 border border-black/10" style="background-image: url('${p.image}')">
              ${isVerified ? `<span class="absolute -top-1 -right-1 ${badgeBadgeBg} rounded-full size-3.5 flex items-center justify-center text-[9px] font-black shadow ring-1 ring-white" title="${vInfo.badgeLabel}: ${vInfo.badgeSubtext}">✓</span>` : ''}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black ${isSelected ? 'text-black' : 'text-gray-900'} leading-none">${p.price}</span>
              <span class="text-[8px] font-bold ${isSelected ? 'text-black/80' : 'text-primary'} uppercase tracking-wider leading-none mt-0.5 truncate max-w-[70px]">${p.type || (p.tag === 'FOR SALE' ? 'FOR SALE' : 'FOR RENT')}</span>
            </div>
          </div>
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${isSelected ? 'border-t-[#13ecda]' : 'border-t-white'} drop-shadow-sm"></div>
        </div>
      `;
      
      const icon = L.divIcon({
        className: 'custom-property-marker',
        html: iconHtml,
        iconSize: [110, 52],
        iconAnchor: [55, 56]
      });

      const marker = L.marker([p.lat || defaultCoords[0], p.lng || defaultCoords[1]], { icon });
      marker.on('click', () => {
        setSelectedPropertyId(p.id);
        setShowPropertyCards(true);
        
        // Center slightly on marker
        if (mapRef.current && p.lat && p.lng) {
          mapRef.current.panTo([p.lat, p.lng], { animate: true });
        }

        // Scroll card into view
        setTimeout(() => {
          const element = document.getElementById(`property-card-${p.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }, 100);
      });

      markerInstancesRef.current.set(p.id, marker);
      markersToAdd.push(marker);
    });

    if (typeof markersLayerRef.current.addLayers === 'function') {
      markersLayerRef.current.addLayers(markersToAdd);
    } else {
      markersToAdd.forEach(m => markersLayerRef.current.addLayer(m));
    }
  }, [displayedProperties, selectedPropertyId]);

  // --- Property Density Heatmap Overlay ---
  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;

    // Clean up existing heatmap layer
    if (heatmapLayerRef.current) {
      try {
        mapRef.current.removeLayer(heatmapLayerRef.current);
      } catch (e) {}
      heatmapLayerRef.current = null;
    }

    if (!showHeatmap) return;

    // Target properties matching the current active criteria
    const targetProperties = displayedProperties.length > 0 ? displayedProperties : allDbProperties;
    const heatPoints = targetProperties
      .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map(p => [p.lat, p.lng, 0.9]);

    if (heatPoints.length === 0) return;

    try {
      if (typeof (L as any).heatLayer === 'function') {
        heatmapLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 40,
          blur: 24,
          maxZoom: 17,
          minOpacity: 0.45,
          gradient: {
            0.15: '#13ecda',
            0.35: '#00b4d8',
            0.60: '#ffd166',
            0.80: '#ff9f1c',
            1.00: '#ff3366'
          }
        }).addTo(mapRef.current);
      } else {
        // High-fidelity fallback density rings using LayerGroup
        const densityGroup = L.layerGroup();
        heatPoints.forEach(([lat, lng]) => {
          L.circle([lat, lng], {
            radius: 120,
            color: '#ff3366',
            weight: 0,
            fillColor: '#ff3366',
            fillOpacity: 0.42
          }).addTo(densityGroup);
          L.circle([lat, lng], {
            radius: 240,
            color: '#ffd166',
            weight: 0,
            fillColor: '#ffd166',
            fillOpacity: 0.25
          }).addTo(densityGroup);
          L.circle([lat, lng], {
            radius: 400,
            color: '#13ecda',
            weight: 0,
            fillColor: '#13ecda',
            fillOpacity: 0.12
          }).addTo(densityGroup);
        });
        heatmapLayerRef.current = densityGroup.addTo(mapRef.current);
      }
    } catch (err) {
      console.warn("Heatmap overlay error:", err);
    }

    return () => {
      if (heatmapLayerRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(heatmapLayerRef.current);
        } catch (e) {}
        heatmapLayerRef.current = null;
      }
    };
  }, [showHeatmap, displayedProperties, allDbProperties]);

  // --- Search Logic for Area Names ---
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length > 0) {
      // 1. Instant local matching for predefined areas
      const localMatches = PREDEFINED_AREAS.filter(area => 
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.displayName.toLowerCase().includes(query.toLowerCase())
      ).map(area => ({
        isPredefined: true,
        areaObj: area,
        display_name: area.displayName,
        lat: area.lat,
        lon: area.lng,
        name: area.name,
        tag: area.tag
      }));

      setSearchResults(localMatches);
      setShowSuggestions(true);

      // 2. Fetch external Nominatim results in background if query is long enough
      if (query.trim().length > 2) {
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bd&limit=5&addressdetails=1`);
            const data = await response.json();
            
            const extResults = data.map((d: any) => ({
              isPredefined: false,
              display_name: d.display_name,
              lat: parseFloat(d.lat),
              lon: parseFloat(d.lon),
              name: d.address?.suburb || d.address?.neighbourhood || d.address?.city_district || d.display_name.split(',')[0],
              tag: 'Geocoded Area'
            }));

            // Combine unique items
            setSearchResults(prev => {
              const combined = [...localMatches];
              extResults.forEach((ext: any) => {
                if (!combined.some(c => c.name.toLowerCase() === ext.name.toLowerCase())) {
                  combined.push(ext);
                }
              });
              return combined;
            });
          } catch (err) {
            console.error("Nominatim search error:", err);
          } finally {
            setIsSearching(false);
          }
        }, 350);
      }
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
      setIsSearching(false);
    }
  };

  // Submit search directly (e.g. user types "Mirpur" and presses Enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check predefined match
    const matched = matchPredefinedArea(searchQuery);
    if (matched) {
      markAreaAndFocus(matched);
      return;
    }

    // Check top search result if available
    if (searchResults.length > 0) {
      handleSelectLocation(searchResults[0]);
      return;
    }

    // Fallback: Geocode on the fly
    handleGeocodeAndMark(searchQuery.trim());
  };

  const handleGeocodeAndMark = async (areaName: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaName)}&countrycodes=bd&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newArea: AreaZone = {
          id: areaName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: areaName,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          radius: 1000,
          tag: 'Searched Area',
          description: `Listed properties in ${areaName}`
        };
        markAreaAndFocus(newArea);
      } else {
        // Default to center Dhaka with that name
        const customArea: AreaZone = {
          id: areaName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: areaName,
          displayName: `${areaName}, Dhaka`,
          lat: 23.7937,
          lng: 90.4066,
          radius: 1000,
          tag: 'Searched Area',
          description: `Available listings in ${areaName}`
        };
        markAreaAndFocus(customArea);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    if (result.isPredefined && result.areaObj) {
      markAreaAndFocus(result.areaObj);
      return;
    }

    const lat = typeof result.lat === 'string' ? parseFloat(result.lat) : result.lat;
    const lng = typeof result.lon === 'string' ? parseFloat(result.lon) : (result.lng || result.lon);
    const name = result.name || result.display_name.split(',')[0];

    const newArea: AreaZone = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: name,
      displayName: result.display_name,
      lat: lat,
      lng: lng,
      radius: 1000,
      tag: 'Marked Area',
      description: `Properties located in ${name}`
    };

    markAreaAndFocus(newArea);
  };

  const clearSearchAndArea = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    setActiveArea(null);
    activeAreaRef.current = null;
    setSelectedPropertyId(null);
    setIsAutoFollowing(true);
    isAutoFollowingRef.current = true;
    setShowSearchAreaBtn(false);
    isUserPannedRef.current = false;

    // Smoothly fly back to user's current location by default
    const target = userCoords || defaultCoords;
    if (showRadiusSliderRef.current) {
      drawOrUpdateRedCircle(target[0], target[1], searchRadiusRef.current, true);
    } else if (markedAreaLayerRef.current) {
      markedAreaLayerRef.current.clearLayers();
      radiusCircleRef.current = null;
    }
    const nearby = filterPropertiesByRadius(target[0], target[1], searchRadiusRef.current);
    setDisplayedProperties(nearby);

    if (mapRef.current) {
      isProgrammaticFlightRef.current = true;
      mapRef.current.flyTo(target, 16, {
        animate: true,
        duration: 1.6,
        easeLinearity: 0.25
      });
    }
  };

  const handleReFocusActiveArea = () => {
    if (!activeArea || !mapRef.current) return;
    isProgrammaticFlightRef.current = true;
    mapRef.current.flyTo([activeArea.lat, activeArea.lng], 15.2, {
      animate: true,
      duration: 1.6,
      easeLinearity: 0.25
    });
  };

  const handleSearchThisArea = async () => {
    if (!mapRef.current) return;
    setIsSearchingArea(true);
    const center = mapRef.current.getCenter();

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=14&addressdetails=1`);
      const data = await response.json();
      
      const name = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || "Selected Area";
      
      const newArea: AreaZone = {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: name,
        displayName: data.display_name || `${name}, Dhaka`,
        lat: center.lat,
        lng: center.lng,
        radius: 1000,
        tag: 'Mapped Area',
        description: `Properties in ${name}`
      };

      markAreaAndFocus(newArea);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingArea(false);
    }
  };

  const handleRecenterUser = () => {
    setIsAutoFollowing(true);
    isAutoFollowingRef.current = true;
    setShowSearchAreaBtn(false);
    isUserPannedRef.current = false;
    const target = userCoords || defaultCoords;
    if (!activeAreaRef.current) {
      if (showRadiusSliderRef.current) {
        drawOrUpdateRedCircle(target[0], target[1], searchRadiusRef.current, true);
      } else if (markedAreaLayerRef.current) {
        markedAreaLayerRef.current.clearLayers();
        radiusCircleRef.current = null;
      }
      const nearby = filterPropertiesByRadius(target[0], target[1], searchRadiusRef.current);
      setDisplayedProperties(nearby);
    }
    if (mapRef.current) {
      isProgrammaticFlightRef.current = true;
      mapRef.current.flyTo(target, 16, { 
        animate: true, 
        duration: 1.6,
        easeLinearity: 0.25 
      });
    }
  };

  // --- Map Layer Toggle ---
  const toggleMapType = () => {
    const next = mapType === 'ROADMAP' ? 'HYBRID' : 'ROADMAP';
    setMapType(next);
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(
        next === 'ROADMAP' 
          ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' 
          : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      );
    }
  };

  // --- Custom Glassmorphism Zoom Controls ---
  const handleZoomIn = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomIn(1, { animate: true });
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomOut(1, { animate: true });
  };

  const handleResetZoom = () => {
    if (!mapRef.current) return;
    const [centerLat, centerLng] = getActiveCenter();
    mapRef.current.flyTo([centerLat, centerLng], 15, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.25
    });
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-background-dark overflow-hidden font-display max-w-[430px] mx-auto select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} id="home-map" className="absolute inset-0 z-0 bg-[#0a1211]"></div>

      {/* Floating Header UI Layer */}
      <div className="relative z-30 flex flex-col gap-2 pt-11 px-4 pointer-events-none">
        
        {/* Search Bar Row with Form and Instant Language Toggle */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1 relative h-12">
            <div className="absolute inset-0 bg-[#0a1211]/90 backdrop-blur-2xl rounded-full flex items-center px-3 gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-[#13ecda]/30 transition-all focus-within:border-[#13ecda] focus-within:ring-2 focus-within:ring-[#13ecda]/20">
              <div className="size-7 rounded-full overflow-hidden shrink-0 border border-[#13ecda]/50 shadow-[0_0_8px_rgba(19,236,218,0.3)] bg-[#07100f] flex items-center justify-center p-0.5">
                <img 
                  src="/duyar-symbol.png" 
                  alt="Duyar" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => setShowSuggestions(true)}
                onClick={() => setShowSuggestions(true)}
                placeholder={isBn ? "বাসা বা এলাকা খুঁজুন (যেমন: বনানী, গুলশান, মিরপুর)..." : "Search area (e.g. Banani, Gulshan, Mirpur)..."}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 text-xs font-semibold p-0"
              />
              {isSearching ? (
                <span className="material-symbols-outlined text-[#13ecda] text-lg animate-spin">sync</span>
              ) : searchQuery.length > 0 ? (
                <button type="button" onClick={clearSearchAndArea} className="text-white/50 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              ) : null}
              <button type="submit" className="bg-[#13ecda] hover:bg-[#13ecda]/90 text-black px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-transform active:scale-95 shadow-[0_0_10px_rgba(19,236,218,0.4)]">
                {isBn ? "খুঁজুন" : "Go"}
              </button>
            </div>

            {/* Suggestions Dropdown: Area suggestions shown ONLY when user clicks on search bar */}
            {showSuggestions && (
              <>
                {/* Backdrop overlay to dismiss suggestions when clicking outside */}
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] pointer-events-auto"
                  onClick={() => setShowSuggestions(false)}
                />

                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a1211]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden max-h-80 overflow-y-auto no-scrollbar border border-white/10 z-50 pointer-events-auto">
                  {/* Suggestions Header */}
                  <div className="p-2.5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#13ecda] text-sm">explore</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#13ecda]">
                        {isBn ? "প্রস্তাবিত এলাকাসমূহ" : "Suggested Areas"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-white/50 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 flex items-center justify-center"
                      title={isBn ? "বন্ধ করুন" : "Close suggestions"}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Quick Area Suggestion Chips inside dropdown */}
                  <div className="p-2.5 border-b border-white/10 bg-white/[0.02]">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                      {isBn ? "জনপ্রিয় এলাকা" : "Quick Areas"}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {PREDEFINED_AREAS.slice(0, 7).map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => markAreaAndFocus(area)}
                          className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 bg-white/10 text-white/90 hover:bg-[#13ecda] hover:text-black border border-white/10 shadow-sm"
                        >
                          <span>📍 {area.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Area Suggestions List */}
                  {(searchResults.length > 0 ? searchResults : PREDEFINED_AREAS.map(a => ({
                    isPredefined: true,
                    areaObj: a,
                    display_name: a.displayName,
                    lat: a.lat,
                    lon: a.lng,
                    name: a.name,
                    tag: a.tag
                  }))).map((result: any, i: number) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => handleSelectLocation(result)}
                      className="w-full text-left px-3.5 py-2.5 border-b border-white/5 last:border-none hover:bg-[#13ecda]/10 transition-colors flex items-center gap-3 group"
                    >
                      <div className="size-8 rounded-full bg-[#13ecda]/10 border border-[#13ecda]/30 flex items-center justify-center shrink-0 text-[#13ecda] group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-base">location_on</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-xs font-bold truncate group-hover:text-[#13ecda] transition-colors">
                            {result.name}
                          </p>
                          {result.isPredefined && (
                            <span className="text-[8px] font-extrabold bg-[#13ecda]/20 text-[#13ecda] px-1.5 py-0.5 rounded border border-[#13ecda]/30">
                              {isBn ? "যাচাইকৃত এলাকা" : "VERIFIED AREA"}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-[10px] truncate">{result.display_name}</p>
                      </div>
                      <span className="material-symbols-outlined text-white/30 text-sm group-hover:text-[#13ecda] group-hover:translate-x-0.5 transition-all">
                        arrow_forward
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Language Toggle Button */}
          {onToggleLang && (
            <button 
              type="button"
              onClick={() => {
                haptics.selection();
                onToggleLang();
              }} 
              className="h-12 px-2.5 rounded-full bg-[#0a1211]/90 backdrop-blur-2xl flex items-center justify-center text-white/90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#13ecda]/40 hover:border-[#13ecda] text-[10px] font-black tracking-widest uppercase hover:bg-[#13ecda]/10 shrink-0"
              title={isBn ? "Switch to English" : "বাংলা ভাষায় পরিবর্তন করুন"}
            >
              <span className="text-[#13ecda] font-extrabold">{isBn ? "EN" : "বাংলা"}</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => {
              haptics.filterApplied();
              onFilter();
            }} 
            className="size-12 rounded-full bg-[#0a1211]/90 backdrop-blur-2xl flex items-center justify-center text-white/80 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10 hover:border-[#13ecda]/50 shrink-0"
            title={isBn ? "ফিল্টার ও বাছাই" : "Filters"}
          >
            <span className="material-symbols-outlined text-xl text-[#13ecda]">tune</span>
          </button>
        </form>

        {/* Active Area Pill Indicator (Only shown when an area is explicitly focused, NEVER clicked on login) */}
        {activeArea && (
          <div className="pointer-events-auto flex items-center gap-2 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#13ecda] text-black text-xs font-bold shadow-[0_0_12px_rgba(19,236,218,0.4)]">
              <span>📍 {activeArea.name}</span>
              <button 
                type="button" 
                onClick={clearSearchAndArea}
                className="size-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center transition-colors"
                title="Clear area filter"
              >
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Buttons: Search Area & Recenter */}
      <div className="absolute top-44 left-0 right-0 z-20 flex justify-center pointer-events-none">
        {showSearchAreaBtn && (
          <div className="pointer-events-auto flex items-center gap-2">
            {!activeArea && (
              <button
                type="button"
                onClick={handleRecenterUser}
                className="flex items-center gap-1.5 bg-[#13ecda] text-black px-3.5 py-2 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] font-bold text-[11px] active:scale-95 transition-all animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                <span>{isBn ? "বর্তমান অবস্থান দেখুন" : "Resume Current Location"}</span>
              </button>
            )}
            <button 
              type="button"
              onClick={handleSearchThisArea}
              disabled={isSearchingArea}
              className="flex items-center gap-2 bg-[#0a1211]/90 text-white px-4 py-2 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] font-bold text-[11px] active:scale-95 transition-all border border-[#13ecda]/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
            >
              {isSearchingArea ? (
                <span className="material-symbols-outlined text-sm text-[#13ecda] animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-sm text-[#13ecda]">near_me</span>
              )}
              <span>{isBn ? "এই এলাকা খুঁজুন" : "Search This Area"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Left Panel: Dynamic Radius Slider & Heatmap Density Legend */}
      <div className="absolute top-44 left-3 sm:left-4 z-20 flex flex-col gap-2 max-w-[285px] sm:max-w-[320px] pointer-events-auto">
        {/* Dynamic Radius Slider Panel (Visual Red Circled coverage feedback) */}
        {showRadiusSlider && (
          <div 
            id="dynamic-radius-panel"
            className="bg-[#0a1211]/95 backdrop-blur-2xl border border-red-500/40 rounded-2xl p-2.5 sm:p-3 shadow-[0_14px_38px_rgba(0,0,0,0.85)] ring-1 ring-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm text-red-500 animate-pulse">radar</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
                      {isBn ? "অনুসন্ধানের পরিধি" : "Search Radius"}
                    </span>
                    <span className="size-1.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
                  </div>
                  <span className="text-[9px] text-red-400/90 font-semibold flex items-center gap-1">
                    <span className="size-1 rounded-full bg-red-500"></span>
                    {isBn ? "লাল বৃত্তাকার এলাকা" : "Red Circled Area"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-red-500/25 border border-red-500/50 text-red-400 font-extrabold text-xs shadow-inner">
                  {formatRadius(searchRadius)}
                </span>
                
                {/* Fit to Red Circle Button */}
                <button
                  type="button"
                  onClick={handleFitMapToCircle}
                  title={isBn ? "বৃত্তাকার পরিধিতে মানচিত্র দেখুন" : "Fit map view to red circle"}
                  className="size-6 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">fit_screen</span>
                </button>

                {/* Minimize / Expand Toggle */}
                <button
                  type="button"
                  onClick={() => setIsRadiusSliderMinimized(prev => !prev)}
                  title={isRadiusSliderMinimized ? (isBn ? "স্লাইডার খুলুন" : "Expand slider") : (isBn ? "স্লাইডার ছোট করুন" : "Minimize slider")}
                  className="size-6 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isRadiusSliderMinimized ? "expand_more" : "expand_less"}
                  </span>
                </button>

                {/* Close Button to dismiss / unclick radius tab */}
                <button
                  type="button"
                  onClick={() => setShowRadiusSlider(false)}
                  title={isBn ? "বন্ধ করুন" : "Close search radius"}
                  className="size-6 rounded-md bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-red-400 flex items-center justify-center transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Slider Content (Collapsible) */}
            {!isRadiusSliderMinimized && (
              <div className="space-y-2 pt-2 mt-1.5 border-t border-white/10 animate-in fade-in duration-200">
                {/* Interactive Dynamic Radius Range Slider */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      id="map-radius-slider"
                      min={300}
                      max={5000}
                      step={50}
                      value={searchRadius}
                      onChange={(e) => handleRadiusChange(Number(e.target.value))}
                      onInput={(e) => handleRadiusChange(Number((e.target as HTMLInputElement).value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-red-500"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((searchRadius - 300) / 4700) * 100}%, rgba(255, 255, 255, 0.18) ${((searchRadius - 300) / 4700) * 100}%, rgba(255, 255, 255, 0.18) 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-white/40 px-0.5">
                    <span>300m</span>
                    <span>1.5km</span>
                    <span>3km</span>
                    <span>5km</span>
                  </div>
                </div>

                {/* Quick Presets for Instant Radius Selection */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {[500, 1000, 2000, 3500, 5000].map((preset) => {
                    const isSelected = searchRadius === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleRadiusChange(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shrink-0 active:scale-95 ${
                          isSelected
                            ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] ring-1 ring-white/50'
                            : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        {formatRadius(preset)}
                      </button>
                    );
                  })}
                </div>

                {/* Real-time Status Badge */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/10">
                  <span className="text-white/60 truncate max-w-[140px]">
                    {isBn ? "আশেপাশে" : "Around"} <strong className="text-white font-bold">{activeArea?.name || (isBn ? 'আমার অবস্থান' : 'My Location')}</strong>
                  </span>
                  <span className="font-extrabold text-[#13ecda] flex items-center gap-1 shrink-0">
                    <span className="size-1.5 rounded-full bg-[#13ecda] animate-pulse"></span>
                    {displayedProperties.length} {isBn ? 'টি বাসা' : (displayedProperties.length === 1 ? 'Property' : 'Properties')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Heatmap Density Legend Badge */}
        {showHeatmap && (
          <div 
            id="heatmap-density-legend"
            className="flex items-center gap-2 bg-[#0a1211]/95 backdrop-blur-2xl border border-[#ff3366]/40 px-3 py-2 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.75)] animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#ff3366] animate-pulse">local_fire_department</span>
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-wider">
                    {isBn ? "ঘনত্ব" : "Density"}
                  </span>
                  <span className="text-[9px] font-bold text-[#13ecda]">
                    {(displayedProperties.length > 0 ? displayedProperties : allDbProperties).length} {isBn ? 'টি স্থান' : 'spots'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] text-white/50 font-semibold">{isBn ? "কম" : "Low"}</span>
                  <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-[#13ecda] via-[#ffd166] to-[#ff3366] shadow-sm" />
                  <span className="text-[8px] text-[#ff3366] font-extrabold">{isBn ? "বেশি" : "High"}</span>
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowHeatmap(false)}
              title={isBn ? "হিটম্যাপ লুকান" : "Hide heatmap"}
              className="size-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors ml-0.5"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Control Buttons: Layer Toggle, Radius Slider, Heatmap, Recenter & Zoom Controls */}
      <div className="absolute top-44 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Toggle Button */}
        <button 
          type="button"
          onClick={toggleMapType}
          title="Toggle map view"
          className="size-10 bg-[#0a1211]/90 text-white/80 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-white/10 backdrop-blur-xl hover:text-[#13ecda]"
        >
          <span className="material-symbols-outlined text-xl">layers</span>
        </button>

        {/* Dynamic Radius Slider Toggle Button (Search Radius Tab) */}
        <button 
          type="button"
          id="radius-slider-toggle-btn"
          onClick={() => {
            setShowRadiusSlider(prev => {
              const next = !prev;
              if (next) setIsRadiusSliderMinimized(false);
              return next;
            });
          }}
          title={showRadiusSlider ? "Hide search radius" : "Search radius (Click to show)"}
          className={`size-10 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all backdrop-blur-xl relative group ${
            showRadiusSlider 
              ? 'bg-red-500/20 text-red-500 border border-red-500 ring-2 ring-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-[#0a1211]/90 text-white/80 border border-white/10 hover:text-red-500 hover:border-red-500/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
            radar
          </span>
          {showRadiusSlider && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>

        {/* Heatmap Density Toggle Button */}
        <button 
          type="button"
          id="heatmap-toggle-btn"
          onClick={() => setShowHeatmap(prev => !prev)}
          title={showHeatmap ? "Hide density heatmap" : "Show property density heatmap"}
          className={`size-10 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all backdrop-blur-xl relative group ${
            showHeatmap 
              ? 'bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366] ring-2 ring-[#ff3366]/40 shadow-[0_0_15px_rgba(255,51,102,0.4)]' 
              : 'bg-[#0a1211]/90 text-white/80 border border-white/10 hover:text-[#ff3366] hover:border-[#ff3366]/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
            {showHeatmap ? 'local_fire_department' : 'whatshot'}
          </span>
          {showHeatmap && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3366] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3366]"></span>
            </span>
          )}
        </button>

        {/* If an area is searched, allow re-centering on that area */}
        {activeArea && (
          <button 
            type="button"
            onClick={handleReFocusActiveArea}
            title="Refocus searched area"
            className="size-10 bg-[#0a1211]/90 text-[#13ecda] rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-[#13ecda]/40 backdrop-blur-xl hover:bg-[#13ecda]/10"
          >
            <span className="material-symbols-outlined text-xl">crop_free</span>
          </button>
        )}

        {/* My Location Button: Returns to default live location tracking and clears any area search */}
        <button 
          type="button"
          onClick={activeArea ? clearSearchAndArea : handleRecenterUser}
          title={activeArea ? "Return to My Location (Default)" : (isAutoFollowing ? "Tracking My Location (Default)" : "Center on my location")}
          className={`size-10 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all border backdrop-blur-xl relative ${
            (!activeArea && isAutoFollowing)
              ? 'bg-[#13ecda]/20 text-[#13ecda] border-[#13ecda] shadow-[0_0_14px_rgba(19,236,218,0.4)]'
              : 'bg-[#0a1211]/90 text-[#13ecda] border-[#13ecda]/40 hover:bg-[#13ecda]/10'
          }`}
        >
          <span className="material-symbols-outlined text-xl">my_location</span>
          {(!activeArea && isAutoFollowing) && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ecda] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#13ecda]"></span>
            </span>
          )}
        </button>

        {/* Custom Glassmorphism Zoom Controls */}
        <div 
          id="custom-zoom-controls"
          aria-label="Map Zoom Controls"
          className="flex flex-col items-center bg-[#0a1211]/80 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] p-1 transition-all"
        >
          {/* Zoom In Button */}
          <button 
            type="button"
            id="zoom-in-btn"
            onClick={handleZoomIn}
            disabled={currentZoom >= 20}
            title="Zoom In (+)"
            aria-label="Zoom in"
            className="size-10 rounded-xl flex items-center justify-center text-white/90 hover:text-[#13ecda] hover:bg-white/10 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:pointer-events-none group"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">add</span>
            <span className="sr-only">Zoom in</span>
          </button>

          {/* Interactive Zoom Level Badge & Reset */}
          <button
            type="button"
            onClick={handleResetZoom}
            title={`Current Zoom: ${currentZoom}x (Click to reset to default 15x)`}
            aria-label="Reset zoom level"
            className="w-full py-1 px-1 my-0.5 rounded-lg flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 transition-all group"
          >
            <span className="text-[10px] font-black tracking-tight text-[#13ecda] font-mono leading-none group-hover:scale-105 transition-transform">
              {currentZoom}x
            </span>
            {/* Visual zoom progress bar */}
            <div className="w-5 h-1 bg-white/15 rounded-full mt-1 overflow-hidden p-[0.5px]">
              <div 
                className="h-full bg-gradient-to-r from-[#13ecda] to-[#00b4d8] rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, Math.max(12, ((currentZoom - 7) / (20 - 7)) * 100))}%` }}
              />
            </div>
          </button>

          {/* Zoom Out Button */}
          <button 
            type="button"
            id="zoom-out-btn"
            onClick={handleZoomOut}
            disabled={currentZoom <= 7}
            title="Zoom Out (-)"
            aria-label="Zoom out"
            className="size-10 rounded-xl flex items-center justify-center text-white/90 hover:text-[#13ecda] hover:bg-white/10 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:pointer-events-none group"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">remove</span>
            <span className="sr-only">Zoom out</span>
          </button>
        </div>
      </div>

      {/* Post Ad FAB - ONLY visible to approved Landlords and approved Locators */}
      {canPostProperty && (
        <button 
          type="button"
          onClick={onPostAd}
          title="Post Property Ad"
          className="absolute bottom-28 right-4 z-30 size-12 bg-gradient-to-r from-[#13ecda] to-[#00b4d8] text-black font-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(19,236,218,0.5)] active:scale-90 transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined text-2xl font-black">add</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* AVAILABLE PROPERTIES PILL (Click to show all property cards) */}
      {/* ========================================================================= */}
      {!showPropertyCards && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <button
            type="button"
            onClick={() => setShowPropertyCards(true)}
            className="pointer-events-auto flex items-center gap-2.5 bg-[#0a1211]/95 text-white px-5 py-2.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.85)] font-bold text-xs active:scale-95 transition-all border border-[#13ecda]/60 hover:border-[#13ecda] backdrop-blur-2xl group animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ecda] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ecda]"></span>
            </span>
            <span className="text-white text-xs font-extrabold tracking-wide">
              {displayedProperties.length} {displayedProperties.length === 1 ? 'Property' : 'Properties'} Available
            </span>
            <span className="material-symbols-outlined text-[#13ecda] text-base group-hover:-translate-y-0.5 transition-transform">
              expand_less
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPANDED PROPERTY CARDS (Shown when user clicks on the available result) */}
      {/* ========================================================================= */}
      {showPropertyCards && (
        <div className="fixed bottom-20 left-3 right-3 z-40 max-w-[406px] mx-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0a1211]/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-2.5">
            
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#13ecda] animate-pulse"></div>
                <span className="text-xs font-black tracking-wide text-white uppercase">
                  {displayedProperties.length} {displayedProperties.length === 1 ? 'Property' : 'Properties'} Available
                </span>
              </div>

              <button 
                type="button"
                onClick={() => setShowPropertyCards(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors active:scale-90"
                title="Collapse to pill"
              >
                <span className="material-symbols-outlined text-base">
                  expand_more
                </span>
              </button>
            </div>

            {/* Horizontal Property Cards Carousel */}
            <div 
              ref={cardsScrollRef}
              className="flex gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory"
            >
              {displayedProperties.length === 0 ? (
                <div className="w-full py-6 text-center text-white/40 text-xs font-semibold">
                  No properties found in this area. Try selecting another area.
                </div>
              ) : (
                displayedProperties.map((property) => {
                  const isSelected = selectedPropertyId === property.id;
                  return (
                    <div
                      key={property.id}
                      id={`property-card-${property.id}`}
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        const marker = markerInstancesRef.current.get(property.id);
                        if (marker && typeof markersLayerRef.current?.zoomToShowLayer === 'function') {
                          markersLayerRef.current.zoomToShowLayer(marker, () => {
                            if (mapRef.current && property.lat && property.lng) {
                              mapRef.current.panTo([property.lat, property.lng], { animate: true });
                            }
                          });
                        } else if (mapRef.current && property.lat && property.lng) {
                          mapRef.current.panTo([property.lat, property.lng], { animate: true });
                        }
                      }}
                      className={`snap-center shrink-0 w-[270px] bg-white/[0.04] rounded-2xl p-2.5 border transition-all cursor-pointer group flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#13ecda] bg-[#13ecda]/[0.08] shadow-[0_0_20px_rgba(19,236,218,0.25)] ring-1 ring-[#13ecda]/50' 
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Card Thumbnail & Tags */}
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                        <img 
                          src={property.image} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                          <VerifiedBadge property={property} variant="card" size="xs" lang={lang} />
                          <span className="bg-[#0a1211]/80 backdrop-blur-md text-[#13ecda] text-[8px] font-black px-2 py-0.5 rounded-full border border-[#13ecda]/30">
                            {isBn ? "ভাড়া হবে" : "AVAILABLE"}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <span className="bg-[#0a1211]/90 backdrop-blur-md text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-white/20">
                            {property.price}<span className="text-[8px] text-white/60 font-normal">{isBn ? "/মাস" : "/mo"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="flex flex-col gap-1 mb-2">
                        <h4 className="text-white text-xs font-bold truncate group-hover:text-[#13ecda] transition-colors">
                          {property.title}
                        </h4>
                        <p className="text-white/60 text-[10px] truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px] text-[#13ecda]">location_on</span>
                          {property.location}
                        </p>

                        {/* Specs Chips */}
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-white/70 font-semibold">
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            🛏️ {property.beds} {isBn ? "বেড" : "Beds"}
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            🚿 {property.baths} {isBn ? "বাথ" : "Baths"}
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            📐 {property.sqft} {isBn ? "বর্গফুট" : "sqft"}
                          </span>
                        </div>
                      </div>

                      {/* Select & View Details Primary Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPropertySelect?.(property);
                        }}
                        className="w-full mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#13ecda] to-[#00b4d8] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(19,236,218,0.3)] hover:brightness-110 active:scale-95 transition-all"
                      >
                        <span>{isBn ? "বাছাই করুন ও বিস্তারিত দেখুন" : "Select & View Details"}</span>
                        <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="HOME" onNavigate={onNavigate} lang={lang} />

      <style>{`
        .custom-property-marker { background: transparent; border: none; }
        .area-badge-container { background: transparent; border: none; }
        .leaflet-tile-pane {
            filter: none !important; 
        }
        .bip-ring {
            position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(66, 133, 244, 0.4);
            animation: location-bip 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; pointer-events: none;
        }
        @keyframes location-bip {
            0% { transform: scale(0.1); opacity: 0.8; }
            50% { opacity: 0.4; }
            100% { transform: scale(2.5); opacity: 0; }
        }
        .glass-cluster {
            width: 40px;
            height: 40px;
            background: rgba(10, 18, 17, 0.92);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid #13ecda;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #13ecda;
            font-weight: 800;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 13px;
            box-shadow: 0 0 20px rgba(19, 236, 218, 0.4);
        }
        .custom-cluster-icon {
            background: transparent;
            border: none;
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;
