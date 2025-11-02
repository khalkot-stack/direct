"use client";

import React from "react";
import GoogleMap from "./GoogleMap"; // Import the new GoogleMap component

// Placeholder component for InteractiveMap
const InteractiveMap: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center rounded-lg m-4 overflow-hidden">
      <GoogleMap className="w-full h-full" />
    </div>
  );
};

export default InteractiveMap;