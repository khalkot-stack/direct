"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const sidebarVariants = cva(
  "group fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-sidebar transition-[width] ease-in-out duration-300 data-[collapsible=true]:w-[--sidebar-width-icon] data-[collapsible=false]:w-[--sidebar-width] data-[collapsible=offcanvas]:w-0 data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[collapsible=offcanvas]:right-auto data-[collapsible=offcanvas]:translate-x-0",
  {
    variants: {
      variant: {
        default: "border-r border-sidebar-border",
        floating:
          "rounded-lg border border-sidebar-border shadow-xl m-2 data-[state=collapsed]:ml-2 data-[state=collapsed]:rounded-xl",
        inset:
          "m-2 rounded-xl border border-sidebar-border shadow-xl data-[state=collapsed]:ml-2 data-[state=collapsed]:rounded-xl",
      },
      side: {
        left: "left-0 right-auto",
        right: "right-0 left-auto data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] data-[collapsible=offcanvas]:left-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      side: "left",
    },
  }
);

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isCollapsible?: boolean;
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "floating" | "inset";
  side?: "left" | "right";
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      asChild = false,
      isCollapsed,
      onCollapse,
      isCollapsible = false,
      breakpoint = "md",
      variant = "default",
      side = "left",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    const [collapsed, setCollapsed] = React.useState(isCollapsed);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      setCollapsed(isCollapsed);
    }, [isCollapsed]);

    React.useEffect(() => {
      const handleResize = () => {
        const isCurrentlyMobile = window.innerWidth < getBreakpointValue(breakpoint);
        setIsMobile(isCurrentlyMobile);
        if (isCollapsible && isCurrentlyMobile) {
          setCollapsed(true);
          onCollapse?.(true);
        } else if (isCollapsible && !isCurrentlyMobile && isCollapsed) {
          setCollapsed(false);
          onCollapse?.(false);
        }
      };

      window.addEventListener("resize", handleResize);
      handleResize(); // Initial check
      return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint, isCollapsible, onCollapse, isCollapsed]);

    const getBreakpointValue = (bp: string) => {
      switch (bp) {
        case "sm": return 640;
        case "md": return 768;
        case "lg": return 1024;
        case "xl": return 1280;
        case "2xl": return 1536;
        default: return 768;
      }
    };

    const toggleCollapse = () => {
      const newCollapsedState = !collapsed;
      setCollapsed(newCollapsedState);
      onCollapse?.(newCollapsedState);
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          sidebarVariants({ variant, side }),
          {
            "data-[collapsible=true]": isCollapsible,
            "data-[collapsible=offcanvas]": isMobile && collapsed,
            "data-[state=collapsed]": collapsed,
            "data-[state=open]": !collapsed,
            "md:data-[collapsible=true]": breakpoint === "md" && isCollapsible,
            "lg:data-[collapsible=true]": breakpoint === "lg" && isCollapsible,
            "xl:data-[collapsible=true]": breakpoint === "xl" && isCollapsible,
            "2xl:data-[collapsible=true]": breakpoint === "2xl" && isCollapsible,
            "md:data-[collapsible=offcanvas]": breakpoint === "md" && isMobile && collapsed,
            "lg:data-[collapsible=offcanvas]": breakpoint === "lg" && isMobile && collapsed,
            "xl:data-[collapsible=offcanvas]": breakpoint === "xl" && isMobile && collapsed,
            "2xl:data-[collapsible=offcanvas]": breakpoint === "2xl" && isMobile && collapsed,
            "md:data-[state=collapsed]": breakpoint === "md" && collapsed,
            "lg:data-[state=collapsed]": breakpoint === "lg" && collapsed,
            "xl:data-[state=collapsed]": breakpoint === "xl" && collapsed,
            "2xl:data-[state=collapsed]": breakpoint === "2xl" && collapsed,
            "md:data-[state=open]": breakpoint === "md" && !collapsed,
            "lg:data-[state=open]": breakpoint === "lg" && !collapsed,
            "xl:data-[state=open]": breakpoint === "xl" && !collapsed,
            "2xl:data-[state=open]": breakpoint === "2xl" && !collapsed,
          },
          className
        )}
        style={
          {
            "--sidebar-width": variant === "floating" || variant === "inset" ? "18rem" : "16rem",
            "--sidebar-width-icon": "5rem",
            "--mobile-sidebar-width": "16rem",
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    isCollapsed?: boolean;
    onClick?: () => void;
    side?: "left" | "right";
  }
>(({ className, isCollapsed, onClick, side = "left", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute top-4",
        side === "left" ? "-right-4" : "-left-4 rotate-180",
        "h-8 w-8 rounded-full border bg-background shadow-md transition-transform duration-200 ease-in-out",
        "hover:bg-sidebar-accent hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <ChevronLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
    </Button>
  );
});
SidebarToggle.displayName = "SidebarToggle";

const SidebarButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    isCollapsed?: boolean;
    icon: React.ElementType;
    isActive?: boolean;
    variant?: "default" | "ghost";
  }
>(({ className, isCollapsed, icon: Icon, isActive, variant = "ghost", children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "relative h-10 w-full justify-start",
        isCollapsed ? "w-10" : "w-full",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      <div className={cn("flex items-center", isCollapsed && "justify-center w-full")}>
        <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2 rtl:ml-2")} />
        {!isCollapsed && <span className="whitespace-nowrap">{children}</span>}
      </div>
    </Button>
  );
});
SidebarButton.displayName = "SidebarButton";

const SidebarLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    isCollapsed?: boolean;
    icon: React.ElementType;
    isActive?: boolean;
  }
>(({ className, isCollapsed, icon: Icon, isActive, children, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "flex items-center h-10 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed ? "w-10 justify-center" : "w-full justify-start",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2 rtl:ml-2")} />
      {!isCollapsed && <span className="whitespace-nowrap">{children}</span>}
    </a>
  );
});
SidebarLink.displayName = "SidebarLink";

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isCollapsed?: boolean;
  }
>(({ className, isCollapsed, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1",
        isCollapsed && "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isCollapsed?: boolean;
    isActive?: boolean;
  }
>(({ className, isCollapsed, isActive, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center rounded-md px-3 py-2 text-sm font-medium",
        isCollapsed ? "justify-center" : "justify-start",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    isCollapsed?: boolean;
  }
>(({ className, isCollapsed, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
        isCollapsed ? "text-center mt-4 mb-2" : "px-3 mt-4 mb-2",
        className
      )}
      {...props}
    >
      {!isCollapsed && children}
    </p>
  );
});
SidebarMenuTitle.displayName = "SidebarMenuTitle";

export {
  Sidebar,
  SidebarToggle,
  SidebarButton,
  SidebarLink,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuTitle,
};