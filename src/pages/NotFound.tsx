"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Frown } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Frown className="h-16 w-16 text-primary dark:text-primary-light mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            404 - الصفحة غير موجودة
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            عذرًا، لا يمكننا العثور على الصفحة التي تبحث عنها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
              العودة إلى الصفحة الرئيسية
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;