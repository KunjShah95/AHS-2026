import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputContainerVariants = cva(
  "flex items-center w-full rounded-md border border-input bg-background ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled-within:cursor-not-allowed disabled-within:opacity-50",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-3 py-1",
        lg: "h-11 px-4 py-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputContainerVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, startIcon, endIcon, containerClassName, ...props }, ref) => {
    return (
      <div
        className={cn(
          inputContainerVariants({ size }),
          props.disabled && "cursor-not-allowed opacity-50",
          className,
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
            "flex h-full w-full bg-transparent text-sm font-normal text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
    )
  }
)
Input.displayName = "Input"

export { Input }
