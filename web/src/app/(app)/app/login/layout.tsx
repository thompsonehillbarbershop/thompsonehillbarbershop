"use client"

import { destroySession } from "@/lib/session"
import Image from "next/image"
import { PropsWithChildren, useEffect } from "react"

export default function TotemLayout({ children }: PropsWithChildren) {
  // destroySession()

  useEffect(() => {
    destroySession()

  }, [])

  return (
    <div className={`w-screen h-screen bg-[url(/images/background.webp)] bg-no-repeat bg-cover flex flex-col`}>
      <div className="w-full flex-1 h-full flex flex-col items-center justify-center gap-4 bg-background/95">
        <div className="w-full h-full flex flex-col gap-4 justify-start items-center px-8 pb-14">
          <Image
            src="/logo.png"
            className="h-56"
            alt="Logo Thompson Hill"
            width={300}
            height={300}

          />
          {children}
        </div>
      </div>
    </div>
  )
}
