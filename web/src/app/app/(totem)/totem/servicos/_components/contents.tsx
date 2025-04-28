"use client"

import { images } from "@/lib/images"
import { IServiceView } from "@/models/service"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import TotemServiceCard from "@/components/totem/service-card"
import Link from "next/link"
import { EPages } from "@/lib/pages.enum"
import { buttonVariants } from "@/components/ui/button"
import { ChevronRightIcon } from "lucide-react"

export default function ServicesPageContents() {
  const [selectedService, setSelectedService] = useState<IServiceView | null>(null)
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get('tel')

  const services: IServiceView[] = [
    {
      id: "1",
      name: "Corte e Barba",
      value: 199.99,
      image: images.servicePlaceholder,
    },
    {
      id: "2",
      name: "Corte e Barba",
      value: 199.99,
      image: images.servicePlaceholder,
    },
    {
      id: "3",
      name: "Corte e Barba",
      value: 199.99,
      image: images.servicePlaceholder,
    },
    {
      id: "4",
      name: "Corte e Barba",
      value: 199.99,
      image: images.servicePlaceholder,
    },
    {
      id: "5",
      name: "Corte e Barba",
      value: 199.99,
      image: images.servicePlaceholder,
    },
  ]

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-relaxed font-spectral tracking-wide">Selecione o serviço que deseja realizar</h1>
      <div className="flex-1 w-full flex flex-col gap-6 items-center justify-start">
        <div className="w-full flex flex-row flex-wrap justify-center items-center gap-6">
          {services.map((service) => (
            <TotemServiceCard
              key={service.id}
              id={service.id}
              title={service.name}
              image={service.image}
              selectedId={selectedService?.id ?? null}
              setSelected={() => setSelectedService(service)}
            />
          ))}
        </div>
        {selectedService && (
          <Link
            href={`${EPages.TOTEM_BARBER}?tel=${phoneNumber}&service=${selectedService.id}`}
            className={buttonVariants({ size: "lg", className: "w-56 text-xl lg:text-2xl font-spectral tracking-wide font-semibold" })}
          >Continuar <ChevronRightIcon /></Link>
        )}
      </div>
    </>
  )
}
