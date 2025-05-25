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

export default function TotemServiceCardAlternative({
  service,
  handleClick,
}: ServiceCardProps) {
  const usePromoValue = service?.promoEnabled && service?.promoValue

  return (
    <div
      role="button"
      onClick={handleClick}
      className={cn("w-full bg-card flex flex-row gap-6 items-center justify-start py-4 px-4 border-transparent border-4 rounded-lg shadow-md")}>
      <Image src={service?.coverImage || images.servicePlaceholder} alt={service.name} className="size-24 md:size-28 object-cover rounded-lg" height={144} width={144} />
      <div className="h-full flex-1 flex flex-col justify-start items-start gap-2">
        <h2 className="text-3xl font-semibold font-spectral tracking-wide">{service.name}</h2>
        <p className="text-xl text-foreground/80 font-spectral tracking-wide">{service.description}</p>
      </div>
      {usePromoValue ? (
        <div className="flex flex-col justify-center items-end gap-2">
          <p className="text-lg line-through text-muted-foreground">
            {formatCurrency(Number(service.value))}
          </p>
          <p className="text-2xl text-primary font-semibold">
            {formatCurrency(Number(service.promoValue))}
          </p>
        </div>
      ) : (<p className="text-2xl text-muted-foreground font-semibold">{formatCurrency(service.value)}</p>)}
    </div>
  )
}