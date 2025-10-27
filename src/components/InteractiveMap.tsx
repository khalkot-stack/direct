"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: '100%',
  height: '400px', // Increased height for better visibility
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 31.9539, // Amman, Jordan latitude
  lng: 35.9106, // Amman, Jordan longitude
};

interface MarkerLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  iconColor?: string; // Optional color for the marker icon
}

interface InteractiveMapProps {
  markers: MarkerLocation[];
  onMarkerClick?: (marker: MarkerLocation) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  onMarkerClick,
  center = defaultCenter,
  zoom = 12,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // Correctly type mapRef to hold the actual Google Maps Map instance
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      // Use window.google.maps.LatLngBounds to ensure correct type
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      mapRef.current.fitBounds(bounds);
      // Optionally adjust zoom if all markers are too close
      if (markers.length === 1) {
        mapRef.current.setZoom(14); // Zoom in closer for a single marker
      }
    } else if (mapRef.current) {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(zoom);
    }
  }, [markers, zoom]);

  // Ensure the map parameter is typed as google.maps.Map
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return <div className="text-red-500">خطأ في تحميل الخريطة: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الخريطة...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={mapZoom}
      onLoad={onMapLoad} // This now correctly expects google.maps.Map
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.title}
          onClick={() => onMarkerClick && onMarkerClick(marker)}
          icon={{
            path: MapPin.toString(),
            fillColor: marker.iconColor || "hsl(var(--primary))",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 1.5,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default InteractiveMap;