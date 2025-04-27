"use client"

import { images } from "@/lib/images"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { EPages } from "@/lib/pages.enum"
import { Button } from "@/components/ui/button"
import { ChevronRightIcon } from "lucide-react"
import { IUserView } from "@/models/user"
import TotemServiceCard from "@/components/totem/service-card"

export default function AttendantsPageContents() {
  const [selectedAttendant, setSelectedAttendant] = useState<IUserView | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const phoneNumber = searchParams.get('tel')
  const service = searchParams.get('service')

  const services: IUserView[] = [
    {
      id: "1",
      name: "Barbeiro 1",
      profilePicture: images.userPlaceholder
    },
    {
      id: "2",
      name: "Barbeiro 2",
      profilePicture: images.userPlaceholder,
    },
    {
      id: "3",
      name: "Barbeiro 3",
      profilePicture: images.userPlaceholder,
    },
    {
      id: "4",
      name: "Barbeiro 4",
      profilePicture: images.userPlaceholder,
    }
  ]

  function handleConfirmation() {
    const data = {
      customer: phoneNumber,
      service: service,
      attendant: selectedAttendant?.id,
    }

    console.log("Data to be sent to the server:", data)

    router.push(EPages.TOTEM_CONFIRMATION)
  }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-relaxed">Preferência de atendimento</h1>

      <div className="flex-1 w-full flex flex-col gap-6 items-center justify-start">
        <Button
          onClick={handleConfirmation}
          size="lg"
          className="w-64 text-xl lg:text-2xl"
        >Não tenho preferência
        </Button>
        <div className="w-full flex flex-row flex-wrap justify-center items-center gap-6">
          {services.map((service) => (
            <TotemServiceCard
              key={service.id}
              id={service.id}
              title={service.name}
              image={service.profilePicture}
              selectedId={selectedAttendant?.id ?? null}
              setSelected={() => setSelectedAttendant(service)}
            />
          ))}
        </div>
        {selectedAttendant && (
          <Button
            onClick={handleConfirmation}
            size="lg"
            className="w-64 text-xl lg:text-2xl"
          >Continuar<ChevronRightIcon />
          </Button>
        )}
      </div>
    </>
  )
}
