import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputContainerVariants = cva(
  "flex items-center w-full rounded-md border bg-background transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0 focus-within:border-primary disabled-within:cursor-not-allowed disabled-within:opacity-50",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2 text-base",
        sm: "h-9 px-3 py-1 text-sm",
        lg: "h-11 px-4 py-3 text-lg",
      },
      variant: {
        default: "border-border/50 hover:border-border",
        outline: "border-border/50 hover:border-border focus-within:border-primary",
        filled: "border-transparent bg-card hover:bg-card/80",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputContainerVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  containerClassName?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, startIcon, endIcon, containerClassName, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={cn(
            inputContainerVariants({ size, variant }),
            error && "border-destructive/50 focus-within:ring-destructive focus-within:border-destructive",
            props.disabled && "cursor-not-allowed opacity-50",
            containerClassName
          )}
        >
          {startIcon && (
            <div className="mr-2 text-muted-foreground flex items-center shrink-0">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-full w-full bg-transparent font-normal text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 autofill:shadow-[inset_0_0_0px_1000px_rgba(15,20,25,0.8)] autofill:text-foreground",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="ml-2 text-muted-foreground flex items-center shrink-0">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1.5 font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
