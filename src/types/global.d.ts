/// <reference types="google.maps" />

interface Window {
  google: typeof google;
  initMap?: () => void; // Made optional to allow deletion
}