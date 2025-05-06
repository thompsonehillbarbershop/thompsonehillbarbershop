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
import { CalendarCheck, LayoutDashboard, LogOutIcon, Scissors, TabletIcon, User, UserCog, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import React from "react"

const routes = [
  {
    slug: "dashboard",
    title: "Dashboard",
    urlPrefix: EPages.ADMIN_DASHBOARD,
    url: EPages.ADMIN_DASHBOARD,
    icon: <LayoutDashboard />
  },
  {
    slug: "gerentes",
    title: "Gerentes",
    urlPrefix: EPages.ADMIN_MANAGERS,
    url: EPages.ADMIN_MANAGERS,
    icon: <UserCog />
  },
  {
    slug: "atendentes",
    title: "Atendentes",
    urlPrefix: EPages.ADMIN_ATTENDANTS,
    url: EPages.ADMIN_ATTENDANTS,
    icon: <Users />
  },
  {
    slug: "totens",
    title: "Totens",
    urlPrefix: EPages.ADMIN_TOTEMS,
    url: EPages.ADMIN_TOTEMS,
    icon: <TabletIcon />
  },
  {
    slug: "servicos",
    title: "Serviços",
    urlPrefix: EPages.ADMIN_SERVICES,
    url: EPages.ADMIN_SERVICES,
    icon: <Scissors />
  },
  {
    slug: "clientes",
    title: "Clientes",
    urlPrefix: EPages.ADMIN_CUSTOMERS,
    url: EPages.ADMIN_CUSTOMERS,
    icon: <User />
  },
  {
    slug: "agendamentos",
    title: "Agendamentos",
    urlPrefix: EPages.ADMIN_APPOINTMENTS,
    url: EPages.ADMIN_APPOINTMENTS,
    icon: <CalendarCheck />
  },
]

export default function AdminSidebar() {
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
          {/* <Image src={images.appLogo} alt="Logo" width={150} height={50} className="self-center py-4" /> */}
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