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
        <main className="w-full mt-10 sm:mt-16">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
