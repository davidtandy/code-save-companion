import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TRANSLATIONS } from "./translations";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Lookup key for translation; defaults to the children string. */
  lookup?: string;
  className?: string;
  /** Render the children as-is (e.g. when text contains punctuation). */
  raw?: boolean;
};

/**
 * A poster word with a tap-to-translate popover.
 * Falls back to "—" when no translation is registered (rare; surfaces gaps).
 */
export const Word = ({ children, lookup, className, raw }: Props) => {
  const [open, setOpen] = useState(false);
  const key = lookup ?? (typeof children === "string" ? children.trim() : "");
  const meaning = TRANSLATIONS[key];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center select-none cursor-pointer rounded transition-transform active:scale-95 focus:outline-none",
            className,
          )}
        >
          {raw ? children : <span>{children}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={4}
        className="w-auto max-w-[180px] sm:max-w-[220px] px-2.5 py-1.5 text-xs sm:text-sm border-poster-ink/20"
      >
        <div className="font-display font-semibold text-poster-ink leading-tight">
          {key}
        </div>
        <div className="text-poster-ink/70 text-xs mt-0.5">
          {meaning ?? "—"}
        </div>
      </PopoverContent>
    </Popover>
  );
};
