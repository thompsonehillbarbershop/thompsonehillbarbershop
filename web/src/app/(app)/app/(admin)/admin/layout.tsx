import { getProfileAction } from "@/actions/users"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { EUserRole } from "@/models/user"
import { notFound } from "next/navigation"
import React, { PropsWithChildren } from 'react'

export default async function AdminLayout({ children }: PropsWithChildren) {
  const user = await getProfileAction()

  if (user.role !== EUserRole.ADMIN && user.role !== EUserRole.MANAGER) {
    return notFound()
  }

  return (
    <SidebarProvider className='flex flow-row w-full' defaultOpen={false}>
      <AdminSidebar />
      <div className='w-full'>
        <AdminHeader />
        <main
          className="w-full h-full bg-[url(/images/background.webp)] bg-no-repeat bg-cover"
        >
          <div className="w-full h-full pt-16 sm:pt-20 flex flex-col justify-start items-start px-3 sm:px-4 md:px-6 pb-6 flex-1 gap-4 bg-background/95">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
