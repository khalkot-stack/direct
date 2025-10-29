"use client";

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import UserNav from "./UserNav"; // Import the new UserNav component

interface AppHeaderProps {
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className }) => {
  return (
    <header className={cn("sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <Link to="/">
          <span className="text-xl font-bold text-primary dark:text-primary-light">DIRECT</span>
        </Link>
      </div>

      <UserNav /> {/* Render the UserNav component here */}
    </header>
  );
};

export default AppHeader;