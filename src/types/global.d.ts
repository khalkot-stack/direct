/// <reference types="leaflet" />
/// <reference types="react-leaflet" />

// Explicitly declare the 'leaflet' module and re-export its types.
// This helps TypeScript correctly resolve the module and merge with the installed @types/leaflet package,
// preventing "Could not find a declaration file" errors and allowing access to types like L.LatLngExpression.
declare module 'leaflet' {
  export * from 'leaflet';
}

// If you need to add custom types for other libraries, add them here.