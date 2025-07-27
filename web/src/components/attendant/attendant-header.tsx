"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import { EUserStatus, IUserView } from "@/models/user"
import axiosWebClient from "@/lib/axios-web"

interface Props {
  profile: IUserView | null
  setProfile: (profile: IUserView | null) => void
}

export default function AttendantHeader({ profile, setProfile }: Props) {
  async function handleAttendantStatusChange(attendant: IUserView | null) {
    if (!attendant) return
    axiosWebClient.patch<IUserView>(`/users/${attendant.id}/status`).then((response) => {
      if (response.data) {
        setProfile(response.data)
      }
    })
  }

  return (
    <header className='bg-popover flex flex-row justify-between items-center w-full py-2 pl-2 pr-4 fixed top-0 right-0 left-0 z-40 h-12 sm:h-16'>
      <div className='flex gap-3 items-center'>
        <SidebarTrigger />
        <h1 className="text-lg"><strong className="text-primary">{profile?.name}</strong> - Atendimento</h1>
      </div>
      <div className="flex gap-3 items-center">
        <div className="flex items-center space-x-2">
          <Label htmlFor="toggle-status">Ativo</Label>
          <Switch
            id="toggle-status"
            checked={profile?.status === EUserStatus.ACTIVE}
            onCheckedChange={() => {
              handleAttendantStatusChange(profile)
            }}
          />
        </div>
      </div>
    </header>
  )
}