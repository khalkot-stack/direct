"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from "lucide-react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [mapRenderKey, setMapRenderKey] = useState(0); // Dynamic key for MapContainer

  useEffect(() => {
    // Increment the key when settings are loaded to force a re-render of MapContainer
    // This helps prevent the "Map container is already initialized" error in StrictMode
    if (!loadingSettings) {
      setMapRenderKey(prev => prev + 1);
    }
  }, [loadingSettings]);

  const fetchMapSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['default_map_zoom', 'default_map_center_lat', 'default_map_center_lng']);

    if (error) {
      console.error("Error fetching map settings:", error);
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
    }
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    fetchMapSettings();
  }, [fetchMapSettings]);

  if (loadingSettings) {
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

  const mapProps = {
    center: finalCenter,
    zoom: finalZoom,
    scrollWheelZoom: true,
    className: `w-full h-full ${className}`,
    style: { zIndex: 0 },
  };

  const tileLayerProps = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  return (
    <MapContainer key={mapRenderKey} {...mapProps}>
      <ChangeView center={finalCenter} zoom={finalZoom} />
      <TileLayer {...tileLayerProps} />
      {children}
    </MapContainer>
  );
};

export default OpenStreetMap;