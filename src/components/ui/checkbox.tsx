import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "./utils";

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, id, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 flex items-center justify-center",
          checked && "bg-blue-600 border-blue-600",
          className
        )}
        {...props}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
