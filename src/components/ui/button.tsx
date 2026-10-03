import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground active:bg-destructive/90",
        outline:
          "border border-input bg-card text-foreground active:bg-accent",
        secondary: "bg-secondary text-secondary-foreground active:bg-secondary/80",
        ghost: "text-foreground active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        nav: "min-h-14 w-full justify-start rounded-lg px-4 text-lg text-muted-foreground active:bg-muted",
        navActive:
          "min-h-14 w-full justify-start rounded-lg border-l-2 border-primary bg-card px-4 text-lg text-foreground",
        surface:
          "min-h-14 rounded-lg border border-border bg-card text-card-foreground active:bg-secondary",
        tile:
          "h-auto min-h-14 whitespace-normal rounded-lg border border-border bg-card text-card-foreground active:bg-secondary",
      },
      size: {
        default: "min-h-14 px-5 py-3",
        sm: "min-h-14 rounded-md px-4 text-base",
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
