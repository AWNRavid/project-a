import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 text-[11px] leading-none font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        outline: "border-border text-muted-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        solid: "border-primary bg-primary text-primary-foreground",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
