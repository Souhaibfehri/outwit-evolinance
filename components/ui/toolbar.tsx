"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 p-2 bg-background border border-border rounded-md",
      className
    )}
    {...props}
  />
))
Toolbar.displayName = "Toolbar"

const ToolbarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 flex-1", className)}
    {...props}
  />
))
ToolbarContent.displayName = "ToolbarContent"

const ToolbarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
ToolbarItem.displayName = "ToolbarItem"

const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-px h-4 bg-border", className)}
    {...props}
  />
))
ToolbarSeparator.displayName = "ToolbarSeparator"

export { Toolbar, ToolbarContent, ToolbarItem, ToolbarSeparator }
