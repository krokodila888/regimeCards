"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cn } from "./utils";

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<
  CollapsibleContextValue | undefined
>(undefined);

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Collapsible({
  open: controlledOpen,
  onOpenChange,
  children,
  ...props
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue = React.useMemo(
    () => ({ open, onOpenChange: handleOpenChange }),
    [open]
  );

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div data-slot="collapsible" data-state={open ? "open" : "closed"} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "Collapsible components must be used within a Collapsible"
    );
  }
  return context;
}

interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function CollapsibleTrigger({
  children,
  className,
  onClick,
  asChild = false,
  ...props
}: CollapsibleTriggerProps) {
  const { open, onOpenChange } = useCollapsibleContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(!open);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? "open" : "closed"}
      className={cn(!asChild && "w-full", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Comp>
  );
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function CollapsibleContent({
  children,
  className,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext();

  if (!open) return null;

  return (
    <div
      data-slot="collapsible-content"
      data-state={open ? "open" : "closed"}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
