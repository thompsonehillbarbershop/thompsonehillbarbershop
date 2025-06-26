"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

interface Props {
  userName: string
}

export default function AttendantHeader({ userName }: Props) {
  return (
    <header className='bg-popover flex flex-row justify-between items-center w-full py-2 pl-2 pr-4 fixed top-0 right-0 left-0 z-40 h-12 sm:h-16'>
      <div className='flex gap-3 items-center'>
        <SidebarTrigger />
        <h1 className="text-lg"><strong className="text-primary">{userName}</strong> - Atendimento</h1>
      </div>
      <div className="flex gap-3 items-center">
      </div>
    </header>
  )
}