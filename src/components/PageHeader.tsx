"use client";

import React from 'react';
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; // Changed to ArrowLeft
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  backPath?: string;
  onBackClick?: () => void;
  showBackButton?: boolean; // New prop for explicit control
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, backPath, onBackClick, showBackButton = true }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1); // Default to browser back if no path/handler provided
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" /> {/* Changed icon */}
          <span className="sr-only">العودة</span>
        </Button>
      )}
      <div className={`flex-grow text-center ${!showBackButton ? 'ml-auto mr-auto' : ''}`}> {/* Center title if no back button */}
        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </CardDescription>
        )}
      </div>
      {showBackButton && <div className="w-10"></div>} {/* Spacer to balance if back button exists */}
    </div>
  );
};

export default PageHeader;