"use client";

import React from "react";
import { Car } from "lucide-react";
import EmptyState from "@/components/EmptyState"; // Assuming EmptyState is available

// Placeholder component for InteractiveMap
const InteractiveMap: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-lg rounded-lg m-4">
      <EmptyState
        icon={Car}
        title="نظام الخريطة معطل مؤقتًا"
        description="نعمل على تحسين تجربة الخريطة. يرجى استخدام التطبيق بدونها في الوقت الحالي."
      />
    </div>
  );
};

export default InteractiveMap;