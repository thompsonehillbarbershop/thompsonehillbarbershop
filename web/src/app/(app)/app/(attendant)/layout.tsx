"use client"

import AttendantHeader from "@/components/attendant/attendant-header"
import AttendantSidebar from "@/components/attendant/attendant-sidebar"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useInactivityRedirect } from "@/hooks/use-inactive-redirect"
import { useLocalStorage } from "@/hooks/use-local-storage"
import axiosWebClient from "@/lib/axios-web"
import { EUserRole, IUserView } from "@/models/user"
import React, { PropsWithChildren, Suspense, useEffect } from 'react'

export const dynamic = "force-dynamic"

export default function AttendantLayout({ children }: PropsWithChildren) {
  const [profile, setProfile] = React.useState<IUserView | null>(null)
  const { storedValue: token } = useLocalStorage("secret", "")
  useInactivityRedirect()

  useEffect(() => {
    axiosWebClient.get<IUserView>(`/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((response) => {
      if (response.data) {
        setProfile(response.data)
      }
    })
  }, [token])

  return (
    <SidebarProvider className='flex flow-row w-full' defaultOpen={false}>
      <Suspense fallback={
        <div className="w-full h-full flex justify-center items-center">
          <LoadingIndicator size="2xl" />
        </div>
      }
      >
        <AttendantSidebar role={profile?.role || EUserRole.ATTENDANT} />
        <div className='w-full'>
          <AttendantHeader profile={profile} setProfile={setProfile} />
          <main
            className="w-full h-full bg-[url(/images/background.webp)] bg-no-repeat bg-cover"
          >
            <div className="w-full h-full pt-16 sm:pt-20 flex flex-col justify-start items-start px-3 sm:px-4 md:px-6 pb-6 flex-1 gap-4 bg-background/95">
              {children}
            </div>
          </main>
        </div>
      </Suspense>
    </SidebarProvider>
  )
}
