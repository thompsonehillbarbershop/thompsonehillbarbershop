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
import { LayoutDashboard, LogOutIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import React from "react"

const routes = [
  {
    slug: "dashboard",
    title: "Dashboard",
    urlPrefix: EPages.ATTENDANCE_DASHBOARD,
    url: EPages.ATTENDANCE_DASHBOARD,
    icon: <LayoutDashboard />
  }
]

export default function AttendantSidebar() {
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
              {routes.map((item) => (
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