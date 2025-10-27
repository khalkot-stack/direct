"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 31.9539, // Amman, Jordan latitude
  lng: 35.9106, // Amman, Jordan longitude
};

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerMapProps {
  label: string;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ label, onLocationSelect, initialLocation }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [currentCenter, setCurrentCenter] = useState(initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : defaultCenter);
  const mapRef = useRef<GoogleMap | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setCurrentCenter({ lat: initialLocation.lat, lng: initialLocation.lng });
    }
  }, [initialLocation]);

  const onMapLoad = useCallback((map: GoogleMap) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoderRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      const { results } = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (results && results.length > 0) {
        const address = results[0].formatted_address;
        setSelectedLocation({ lat, lng, address });
        onLocationSelect({ lat, lng, address });
      } else {
        toast.error("لم يتم العثور على عنوان لهذا الموقع.");
      }
    } catch (error) {
      toast.error("فشل جلب العنوان: " + (error as Error).message);
      console.error("Geocoder failed due to:", error);
    }
  }, [onLocationSelect]);

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const addressInput = e.target.value;
    if (!addressInput) {
      setSelectedLocation(null);
      onLocationSelect({ lat: 0, lng: 0, address: "" }); // Clear location
      return;
    }

    if (!geocoderRef.current || !mapRef.current) return;

    try {
      const { results } = await geocoderRef.current.geocode({ address: addressInput });
      if (results && results.length > 0) {
        const { lat, lng } = results[0].geometry.location;
        const newAddress = results[0].formatted_address;
        setSelectedLocation({ lat: lat(), lng: lng(), address: newAddress });
        onLocationSelect({ lat: lat(), lng: lng(), address: newAddress });
        mapRef.current.panTo({ lat: lat(), lng: lng() });
      } else {
        toast.error("لم يتم العثور على موقع لهذا العنوان.");
      }
    } catch (error) {
      toast.error("فشل البحث عن العنوان: " + (error as Error).message);
      console.error("Geocoder failed due to:", error);
    }
  };

  if (loadError) {
    return <div className="text-red-500">خطأ في تحميل الخريطة: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الخريطة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${label}-address`}>{label}</Label>
      <Input
        id={`${label}-address`}
        type="text"
        placeholder={`ابحث عن ${label} أو انقر على الخريطة`}
        value={selectedLocation?.address || ""}
        onChange={handleAddressChange}
        className="mt-1"
      />
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentCenter}
        zoom={12}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {selectedLocation && (
          <Marker
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            icon={{
              path: MapPin.toString(), // Using Lucide icon as SVG path
              fillColor: "hsl(var(--primary))", // Using primary color
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1.5,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default LocationPickerMap;