"use client"

import { images } from "@/lib/images"
import { useRouter, useSearchParams } from "next/navigation"
import { EPages } from "@/lib/pages.enum"
import { IUserView } from "@/models/user"
import TotemServiceCard from "@/components/totem/service-card"
import NoPreferenceCard from "@/components/totem/no-preference-card"

export default function AttendantsPageContents() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const phoneNumber = searchParams.get('tel')
  const service = searchParams.get('service')

  const users: IUserView[] = [
    {
      id: "1",
      name: "Thompson Hill",
      profilePicture: images.userPlaceholder
    },
    {
      id: "2",
      name: "Thompson Hill",
      profilePicture: images.userPlaceholder,
    },
    {
      id: "3",
      name: "Thompson Hill",
      profilePicture: images.userPlaceholder,
    },
    {
      id: "4",
      name: "Thompson Hill",
      profilePicture: images.userPlaceholder,
    }
  ]

  function handleConfirmation(user: IUserView | undefined) {
    const data = {
      customer: phoneNumber,
      service: service,
      attendant: user?.id || undefined,
    }

    console.log("Data to be sent to the server:", data)

    router.push(EPages.TOTEM_CONFIRMATION)
  }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-relaxed font-spectral tracking-wide">Preferência de atendimento</h1>

      <div className="flex-1 w-full flex flex-col gap-6 items-center justify-start">
        <div className="w-full flex flex-row flex-wrap justify-center items-center gap-6">
          {users.map((user) => (
            <TotemServiceCard
              key={user.id}
              id={user.id}
              title={user.name}
              image={user.profilePicture}
              handleClick={() => handleConfirmation(user)}
            />
          ))}
          <NoPreferenceCard
            handleClick={() => handleConfirmation(undefined)}
          />
        </div>
      </div>
    </>
  )
}
