import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        nav: "min-h-14 w-full justify-start rounded-xl px-4 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        navActive: "min-h-14 w-full justify-start rounded-xl bg-sidebar-accent px-4 text-base text-sidebar-accent-foreground",
        navMobile: "min-h-16 min-w-14 flex-col gap-1 rounded-xl px-1 text-xs text-muted-foreground",
        navMobileActive: "min-h-16 min-w-14 flex-col gap-1 rounded-xl bg-secondary px-1 text-xs font-semibold text-primary",
        kioskGlass: "min-h-14 rounded-2xl border border-glass-border bg-glass-surface/80 text-foreground shadow-glass backdrop-blur-xl transition-colors hover:bg-glass-surface",
        kioskTile: "h-auto min-h-14 whitespace-normal rounded-3xl border border-glass-border bg-card text-card-foreground shadow-glass transition-colors hover:border-primary/60 hover:bg-card/90",
      },
      size: {
        default: "min-h-14 px-5 py-3",
        sm: "min-h-14 rounded-md px-4 text-sm",
        lg: "min-h-14 rounded-md px-8",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
