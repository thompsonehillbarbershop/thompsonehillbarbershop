"use client"

import { images } from "@/lib/images"
import { IServiceView } from "@/models/service"
import { useRouter, useSearchParams } from "next/navigation"
import TotemServiceCard from "@/components/totem/service-card"
import { EPages } from "@/lib/pages.enum"
import { formatCurrency } from "@/lib/utils"

export default function ServicesPageContents() {
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get('tel')

  const router = useRouter()

  const services: IServiceView[] = [
    {
      id: "1",
      name: "Corte e Barba",
      value: 999.99,
      image: images.servicePlaceholder,
    },
    {
      id: "2",
      name: "Corte e Barba",
      value: 999.99,
      image: images.servicePlaceholder,
    },
    {
      id: "3",
      name: "Corte e Barba",
      value: 999.99,
      image: images.servicePlaceholder,
    },
    {
      id: "4",
      name: "Corte e Barba",
      value: 999.99,
      image: images.servicePlaceholder,
    },
    {
      id: "5",
      name: "Corte e Barba",
      value: 999.99,
      image: images.servicePlaceholder,
    },
  ]

  function handleSelect(service: IServiceView) {
    router.push(`${EPages.TOTEM_BARBER}?tel=${phoneNumber}&service=${service.id}`)
  }

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
              subtitle={formatCurrency(service.value)}
              image={service.image}
              handleClick={() => handleSelect(service)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
