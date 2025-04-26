import * as React from "react"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"


interface Props extends React.ComponentProps<"input"> {
  Icon?: LucideIcon
}
function Input({ className, type, Icon, ...props }: Props) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <Icon size={20} />
        </div>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input border-input flex h-14 w-full min-w-0 rounded-xl bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-2xs",
          Icon && "pl-12",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { Input }
