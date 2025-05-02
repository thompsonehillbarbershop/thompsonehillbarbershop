import { Loader2Icon } from "lucide-react"
import { ComponentProps } from 'react'
import { tv, VariantProps } from 'tailwind-variants'
import { cn } from "@/lib/utils"

const loadingVariants = tv({
  base: 'animate-spin text-primary',
  variants: {
    size: {
      default: 'size-6',
      sm: 'size-4',
      lg: 'size-8',
      xl: 'size-12',
      '2xl': 'size-16',
      '3xl': 'size-20',
    }
  },
  defaultVariants: {
    size: 'default'
  }
})

interface LoadingProps extends ComponentProps<"div">, VariantProps<typeof loadingVariants> { }

export default function LoadingIndicator({ className, size }: LoadingProps) {
  return (
    <Loader2Icon className={cn(loadingVariants({ size }), className)} />
  )
}