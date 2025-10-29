"use client";

import React from 'react';
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  backPath?: string;
  onBackClick?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, backPath, onBackClick }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backPath) {
      navigate(backPath);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {(backPath || onBackClick) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowRight className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Button>
      )}
      <div className="flex-grow text-center">
        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </CardDescription>
        )}
      </div>
      {!(backPath || onBackClick) && <div className="w-10"></div>}
    </div>
  );
};

export default PageHeader;