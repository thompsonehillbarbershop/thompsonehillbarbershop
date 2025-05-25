"use client"

import { images } from "@/lib/images"
import { cn } from "@/lib/utils"
import { IUserView } from "@/models/user"
import Image from "next/image"

interface ServiceCardProps {
  attendant: IUserView
  selectedId?: string | null
  handleClick: () => void
}

export default function TotemAttendantCard({
  attendant,
  handleClick,
}: ServiceCardProps) {
  return (
    <div
      role="button"
      onClick={handleClick}
      className={cn("w-full sm:w-52 md:size-68 bg-card flex flex-col items-center justify-center gap-1 pt-4 pb-2 px-4 border-transparent border-4 rounded-lg shadow-md")}>
      <Image src={attendant?.profileImage || images.userPlaceholder} alt={attendant.name} className="size-44 md:size-48 object-cover rounded-lg" height={144} width={144} />
      <h2 className="text-xl font-semibold font-spectral tracking-wide">{attendant.name}</h2>
    </div>
  )
}