"use client";

import React, { useRef, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode; // For markers or other overlays
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (ref.current && !map) {
        const newMap = new window.google.maps.Map(ref.current, {
          center,
          zoom,
          mapId: "YOUR_MAP_ID", // Consider using a Map ID for custom styling
          disableDefaultUI: true, // Disable default UI for a cleaner look
        });
        setMap(newMap);
        setIsMapLoaded(true);
      }
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // If not, attach to the global callback (defined in index.html)
      // This assumes initMap is globally accessible, which it will be if defined on window
      window.initMap = initMap;
    }

    return () => {
      // Clean up global callback if component unmounts before map loads
      if (window.initMap === initMap) {
        delete window.initMap;
      }
    };
  }, [center, zoom, map]);

  // Update map center/zoom if props change
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="sr-only">جاري تحميل الخريطة...</span>
        </div>
      )}
      <div ref={ref} className="w-full h-full" />
      {isMapLoaded && map && React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Pass the map instance to children (e.g., markers)
          return React.cloneElement(child, { ...child.props, map });
        }
        return child;
      })}
    </div>
  );
};

export default GoogleMap;