"use client";

import React from "react";
import OpenStreetMap from "./OpenStreetMap"; // Import the new OpenStreetMap component

const InteractiveMap: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center rounded-lg m-4 overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-lg">
      <OpenStreetMap className="w-full h-full" />
    </div>
  );
};

export default InteractiveMap;