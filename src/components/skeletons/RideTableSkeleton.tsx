"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const RideTableSkeleton: React.FC = () => {
  const rows = Array.from({ length: 5 }); // Number of skeleton rows

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الراكب</TableHead>
            <TableHead>السائق</TableHead>
            <TableHead>الانطلاق</TableHead>
            <TableHead>الوجهة</TableHead>
            <TableHead>الركاب</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((_, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[120px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[120px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[40px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[80px]" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RideTableSkeleton;