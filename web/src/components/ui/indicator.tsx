import { cn } from "@/lib/utils"
import React, { ComponentProps } from 'react'

export default function Indicator({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        "flex flex-row justify-start items-center dark:bg-input/40 border-input h-14 w-full min-w-0 rounded-xl bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
        className
      )}
      {...rest}>
      <p>{children}</p>
    </div>
  )
}
