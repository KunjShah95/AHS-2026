import * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group-[.toaster]:border-border group-[.toaster]:bg-background"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:border-border group-[.toaster]:bg-background",
          description: "group-[.toaster]:text-muted-foreground",
          actionButton: "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
          cancelButton: "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }