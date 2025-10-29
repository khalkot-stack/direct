"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 31.9539,
  lng: 35.9106,
};

interface MarkerLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  iconColor?: string;
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

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      mapRef.current.fitBounds(bounds);
      if (markers.length === 1) {
        mapRef.current.setZoom(14);
      }
    } else if (mapRef.current) {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(zoom);
    }
  }, [markers, zoom]);

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

  const mapPinSvgPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={mapZoom}
      onLoad={onMapLoad}
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
            path: mapPinSvgPath,
            fillColor: marker.iconColor || "hsl(var(--primary))",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default InteractiveMap;