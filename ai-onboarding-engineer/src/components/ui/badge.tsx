import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary hover:bg-primary/25 border-primary/30",
        secondary: "border-transparent bg-secondary/15 text-secondary-foreground hover:bg-secondary/25 border-secondary/30",
        destructive: "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/30",
        outline: "border-border/50 text-foreground hover:bg-card/50",
        accent: "border-transparent bg-accent/15 text-accent hover:bg-accent/25 border-accent/30",
        success: "border-transparent bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30",
        warning: "border-transparent bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/30",
        info: "border-transparent bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border-cyan-500/30",
        ghost: "border border-border/30 text-foreground/70 hover:text-foreground hover:border-border/50",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
