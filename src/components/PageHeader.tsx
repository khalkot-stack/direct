"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";

interface PageHeaderProps {
  title: string;
  description?: string;
  backPath?: string; // Optional path to navigate back to, defaults to -1 (history back)
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, backPath }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="relative text-center pb-4 border-b dark:border-gray-700 mb-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="absolute top-0 right-0 rtl:left-0 rtl:right-auto"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">العودة</span>
      </Button>
      <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
        {title}
      </CardTitle>
      {description && (
        <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </CardDescription>
      )}
    </div>
  );
};

export default PageHeader;