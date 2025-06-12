"use client"

import { images } from "@/lib/images"
import { cn, formatCurrency } from "@/lib/utils"
import { IServiceView } from "@/models/service"
import Image from "next/image"

interface ServiceCardProps {
  service: IServiceView
  selectedId?: string | null
  handleClick: () => void
}

export default function TotemServiceCard({
  service,
  handleClick,
}: ServiceCardProps) {
  const usePromoValue = service?.promoEnabled && service?.promoValue

  return (
    <div
      role="button"
      onClick={handleClick}
      className={cn("w-full sm:w-52 md:size-68 bg-card flex flex-col items-center justify-start gap-1 pt-4 pb-2 px-4 border-transparent border-4 rounded-lg shadow-md min-h-80 h-80")}>
      <Image src={service?.coverImage || images.servicePlaceholder} alt={service.name} className="size-44 md:size-48 object-cover rounded-lg" height={144} width={144} />
      <h2 className="text-xl font-semibold font-spectral tracking-wide text-center flex-1 line-clamp-2">{service.name}</h2>
      {usePromoValue ? (
        <div className="flex flex-row justify-center items-end gap-2">
          <p className="text-sm line-through text-muted-foreground">
            {formatCurrency(Number(service.value))}
          </p>
          <p className="text-lg text-primary font-semibold">
            {formatCurrency(Number(service.promoValue))}
          </p>
        </div>
      ) : (<p className="text-lg text-muted-foreground font-semibold">{formatCurrency(service.value)}</p>)}
    </div>
  )
}