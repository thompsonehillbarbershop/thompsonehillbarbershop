"use client"

import { images } from "@/lib/images"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ServiceCardProps {
  handleClick: () => void
}

export default function NoPreferenceCard({
  handleClick
}: ServiceCardProps) {
  return (
    <div
      role="button"
      onClick={handleClick}
      className={cn("relative w-full sm:w-52 md:size-64 bg-card flex flex-col items-center justify-center gap-1 pt-4 pb-2 px-4 border-transparent border-4 rounded-lg shadow-md min-h-72")}>
      <Image src={images.userFrameBackground} alt="sem preferencia" className="size-44 md:size-48 object-cover rounded-lg" height={144} width={144} />
      <h2 className="absolute text-xl font-semibold font-spectral tracking-wide text-center text-primary uppercase leading-relaxed">Sem <br /> preferência</h2>
    </div>
  )
}

