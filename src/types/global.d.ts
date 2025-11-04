/// <reference types="leaflet" />
/// <reference types="react-leaflet" />

// Explicitly declare the 'leaflet' module to help TypeScript resolve its types.
// This is a common workaround when @types/leaflet might not be picked up correctly.
declare module 'leaflet';

// If you need to add custom types for Leaflet or other libraries, add them here.