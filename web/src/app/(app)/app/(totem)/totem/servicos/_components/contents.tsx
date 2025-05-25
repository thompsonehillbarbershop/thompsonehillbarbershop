"use client"

import { IServiceView } from "@/models/service"
import { useRouter, useSearchParams } from "next/navigation"
import { EPages } from "@/lib/pages.enum"
import { useTotem } from "@/hooks/use-totem"
import LoadingIndicator from "@/components/ui/loading-indicator"
import TotemServiceCard from "@/components/totem/service-card"

export default function ServicesPageContents() {
  const { services, isLoadingServices } = useTotem()
  const searchParams = useSearchParams()
  const customer = searchParams.get('id')

  const router = useRouter()

  function handleSelect(service: IServiceView) {
    router.push(`${EPages.TOTEM_BARBER}?id=${customer}&service=${service.id}`)
  }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-relaxed font-spectral tracking-wide">Selecione o serviço que deseja realizar</h1>
      <div className="flex-1 w-full flex flex-col gap-6 items-center justify-start">

        {isLoadingServices ? (
          <LoadingIndicator size="xl" />
        ) : (
          <div className="w-full flex flex-row flex-wrap justify-center items-center gap-6 pb-4">
            {services?.data?.map((service) => (
              <TotemServiceCard
                key={service.id}
                service={service}
                handleClick={() => handleSelect(service)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
