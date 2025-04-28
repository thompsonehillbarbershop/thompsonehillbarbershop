"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface ServiceCardProps {
  id: string
  title: string
  subtitle?: string
  image: string
  selectedId: string | null
  setSelected: () => void
}

export default function TotemServiceCard({
  id,
  title,
  subtitle,
  image,
  selectedId,
  setSelected,
}: ServiceCardProps) {
  return (
    <div
      role="button"
      onClick={setSelected}
      className={cn("w-full sm:w-52 md:size-64 bg-card flex flex-col items-center justify-center gap-1 pt-4 pb-2 px-4 border-transparent border-4 rounded-lg shadow-md", selectedId === id ? "border-primary" : "")} key={id}>
      <Image src={image} alt={title} className="size-44 md:size-48 object-cover rounded-lg" height={144} width={144} />
      <h2 className="text-xl font-semibold font-spectral tracking-wide">{title}</h2>
      <p className="text-base text-muted-foreground font-semibold">{subtitle}</p>
    </div>
  )
}
