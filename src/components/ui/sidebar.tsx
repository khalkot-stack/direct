"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button"; // Import buttonVariants

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: React.ElementType;
    variant: "default" | "ghost";
    href: string;
  }[];
}

export function Sidebar({ className, isCollapsed, links }: SidebarProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className={cn(
        "group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2",
        className,
      )}
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Link
              key={index}
              to={link.href}
              className={cn(
                buttonVariants({ variant: link.variant, size: "icon" }),
                "h-9 w-9",
                link.variant === "default" &&
                  "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
              )}
            >
              <link.icon className="h-4 w-4" />
              <span className="sr-only">{link.title}</span>
            </Link>
          ) : (
            <Link
              key={index}
              to={link.href}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                link.variant === "default" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start",
              )}
            >
              <link.icon className="h-4 w-4 mr-2" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    link.variant === "default" &&
                      "text-background dark:text-white",
                  )}
                >
                  {link.label}
                </span>
              )}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}

interface SidebarToggleProps extends React.ComponentPropsWithoutRef<typeof Button> {
  isCollapsed?: boolean;
}

const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  SidebarToggleProps
>(({ className, isCollapsed, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "h-7 w-7",
        className,
      )}
      {...props}
    >
      <ChevronLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarToggle.displayName = "SidebarToggle";

interface SidebarLinkProps extends React.ComponentPropsWithoutRef<typeof Button> {
  isCollapsed?: boolean;
  icon: React.ElementType;
  title: string;
  label?: string;
}

const SidebarLink = React.forwardRef<
  HTMLButtonElement,
  SidebarLinkProps
>(({ className, isCollapsed, icon: Icon, title, label, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn(
        "justify-start",
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4 mr-2" />
      {!isCollapsed && (
        <>
          {title}
          {label && (
            <span className="ml-auto text-muted-foreground">
              {label}
            </span>
          )}
        </>
      )}
    </Button>
  );
});
SidebarLink.displayName = "SidebarLink";

export { SidebarToggle, SidebarLink };