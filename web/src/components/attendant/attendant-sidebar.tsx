"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { EPages } from "@/lib/pages.enum"
import { EUserRole } from "@/models/user"
import { LayoutDashboard, LogOutIcon, NotebookPenIcon, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import React from "react"

const routes = [
  {
    slug: "atendimento",
    title: "Atendimento",
    urlPrefix: EPages.ATTENDANCE_DASHBOARD,
    url: EPages.ATTENDANCE_DASHBOARD,
    icon: <LayoutDashboard />,
    admin: false
  },
  {
    slug: "sumario",
    title: "Resumo do Dia",
    urlPrefix: EPages.ATTENDANCE_SUMMARY,
    url: EPages.ATTENDANCE_SUMMARY,
    icon: <NotebookPenIcon />,
    admin: false
  },
  {
    slug: "atendentes",
    title: "Atendentes",
    urlPrefix: EPages.ATTENDANCE_ATTENDANTS,
    url: EPages.ATTENDANCE_ATTENDANTS,
    icon: <Users />,
    admin: true
  }
]

export default function AttendantSidebar({ role }: { role: EUserRole }) {
  const { setOpenMobile, open, isMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()

  function handleMenuClick(url: string) {
    setOpenMobile(false)
    router.push(url)
  }

  function handleLogout() {
    router.push(EPages.LOGOUT)
  }

  return (
    <Sidebar collapsible='icon'>
      {open && (
        <SidebarHeader className="pt-12 sm:pt-16">
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={(open || isMobile) ? '' : 'mt-16'}>
              {routes.filter((item) => !item.admin || role === EUserRole.ATTENDANT_MANAGER).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.urlPrefix)}
                    onClick={() => handleMenuClick(item.url)}
                    className="py-6"
                  >
                    {item.icon}
                    <span className="text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={(open || isMobile) ? '' : 'mt-16'}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                >
                  <LogOutIcon />
                  <span className="text-base">Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}