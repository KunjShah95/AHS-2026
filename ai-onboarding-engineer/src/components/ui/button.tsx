import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-md hover:shadow-lg hover:-translate-y-0.5",
          "active:shadow-sm active:translate-y-0",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-sm hover:bg-destructive/90",
          "active:bg-destructive/80",
        ].join(" "),
        outline: [
          "border border-input bg-background",
          "shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-border",
          "active:bg-accent/80",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-sm hover:bg-secondary/80 hover:shadow",
          "active:bg-secondary/70",
        ].join(" "),
        ghost: [
          "hover:bg-accent/10 hover:text-accent-foreground",
          "active:bg-accent/20",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
        shiny: [
          "animate-shine bg-gradient-to-r from-primary via-primary/50 to-primary bg-[length:200%_100%]",
          "text-primary-foreground shadow-lg hover:shadow-xl",
          "active:scale-95",
        ].join(" "),
        accent: [
          "bg-accent text-accent-foreground",
          "shadow-md hover:shadow-lg hover:-translate-y-0.5",
          "active:shadow-sm active:translate-y-0",
        ].join(" "),
        minimal: [
          "text-foreground/70 hover:text-foreground hover:bg-card/50",
          "active:bg-card/80",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2 min-w-[100px]",
        sm: "h-8 rounded-md px-3 text-xs min-w-[80px]",
        lg: "h-10 rounded-md px-8 text-base min-w-[120px]",
        xl: "h-12 rounded-md px-10 text-lg min-w-[140px]",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
