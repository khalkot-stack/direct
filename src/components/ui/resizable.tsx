"use client";

import {
  ResizablePanelGroup as ResizablePanelGroupPrimitive,
  ResizablePanel as ResizablePanelPrimitive,
  ResizableHandle as ResizableHandlePrimitive,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ResizablePanelGroupPrimitive;

const ResizablePanel = ResizablePanelPrimitive;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ResizableHandlePrimitive> & {
  withHandle?: boolean;
}) => (
  <ResizableHandlePrimitive
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:top-1/2",
      withHandle &&
        "after:bg-border after:data-[panel-group-direction=vertical]:bg-border after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-1 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-background after:group-hover:bg-border data-[panel-group-direction=vertical]:after:-translate-x-1/2 data-[panel-group-direction=vertical]:after:rotate-90",
      className,
    )}
    {...props}
  />
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };