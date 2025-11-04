"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from "lucide-react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import L from 'leaflet';

// Fix for default Leaflet icons not showing up - this should be outside the component
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

// Helper component to update map center and zoom
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    console.log("ChangeView: Setting map view to", center, zoom);
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  center,
  zoom,
  children,
  className,
}) => {
  const [mapSettings, setMapSettings] = useState({
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false); // Tracks if map has been initialized once

  const fetchMapSettings = useCallback(async () => {
    console.log("OpenStreetMap: Fetching map settings...");
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['default_map_zoom', 'default_map_center_lat', 'default_map_center_lng']);

    if (error) {
      console.error("OpenStreetMap: Error fetching map settings:", error);
      toast.error("فشل جلب إعدادات الخريطة الافتراضية.");
    } else {
      const settingsMap = new Map(data.map(s => [s.key, s.value]));
      const defaultLat = parseFloat(settingsMap.get('default_map_center_lat') || String(DEFAULT_MAP_CENTER.lat));
      const defaultLng = parseFloat(settingsMap.get('default_map_center_lng') || String(DEFAULT_MAP_CENTER.lng));
      const defaultZoom = parseInt(settingsMap.get('default_map_zoom') || String(DEFAULT_MAP_ZOOM));

      setMapSettings({
        center: { lat: defaultLat, lng: defaultLng },
        zoom: defaultZoom,
      });
      console.log("OpenStreetMap: Map settings fetched:", { lat: defaultLat, lng: defaultLng, zoom: defaultZoom });
    }
    setLoadingSettings(false);
    // Mark map as initialized after settings are loaded for the first time
    if (!mapInitialized) {
      setMapInitialized(true);
      console.log("OpenStreetMap: Map marked as initialized.");
    }
  }, [mapInitialized]);

  useEffect(() => {
    fetchMapSettings();
  }, [fetchMapSettings]);

  // Show loader if settings are loading or if the map hasn't been initialized yet
  if (loadingSettings || !mapInitialized) {
    console.log("OpenStreetMap: Rendering loader. loadingSettings:", loadingSettings, "mapInitialized:", mapInitialized);
    return (
      <div className={`relative w-full h-full ${className} flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل إعدادات الخريطة...</span>
      </div>
    );
  }

  const finalCenter: [number, number] = [
    (center || mapSettings.center).lat,
    (center || mapSettings.center).lng,
  ];
  const finalZoom: number = zoom || mapSettings.zoom;

  // Use a simple key that changes only when the map is truly ready to be rendered
  // This helps React treat it as a new component instance only when necessary
  const mapKey = `map-${finalCenter[0]}-${finalCenter[1]}-${finalZoom}`;
  console.log("OpenStreetMap: Rendering MapContainer with key:", mapKey, "Center:", finalCenter, "Zoom:", finalZoom);

  const tileLayerProps = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  return (
    <MapContainer
      key={mapKey}
      center={finalCenter}
      zoom={finalZoom}
      scrollWheelZoom={true}
      className={`w-full h-full ${className}`}
      style={{ zIndex: 0 }}
    >
      <ChangeView center={finalCenter} zoom={finalZoom} />
      <TileLayer {...tileLayerProps} />
      {children}
    </MapContainer>
  );
};

export default OpenStreetMap;