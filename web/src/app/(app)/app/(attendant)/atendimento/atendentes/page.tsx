"use client"

import { H1, Label } from "@/components/ui/typography"

import { useAdmin } from "@/hooks/use-admin"
import { EUserRole, EUserStatus, IUserView } from "@/models/user"
import { useMemo } from "react"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function AttendantsPage() {
  const { users, updateUser } = useAdmin()

  const attendants = useMemo(() => {
    return users?.filter((user) => (user.role === EUserRole.ATTENDANT || user.role === EUserRole.ATTENDANT_MANAGER)).sort((a, b) => {
      if (a.userName < b.userName) return -1
      if (a.userName > b.userName) return 1
      return 0
    })
  }
    , [users])

  async function handleAttendantStatusChange(attendant: IUserView, status: EUserStatus) {
    const response = await updateUser({
      id: attendant.id,
      data: {
        status
      },
      userName: attendant.userName,
    })

    if (response.error) {
      console.error("Erro ao atualizar", response.error)
    }
  }

  return (
    <div className="w-full flex flex-col max-w-lg mx-auto">
      <H1>Atendentes</H1>

      <Card className="mt-2">
        <CardContent className="flex flex-col gap-6">
          <CardDescription>
            Deixando o atendente como ativo, irá exibi-lo na tela do totem
          </CardDescription>
          {attendants?.map(attendant => (
            <div
              key={attendant.id}
              className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">{attendant.name}</Label>
              <Switch
                checked={attendant.status === EUserStatus.ACTIVE}
                onCheckedChange={(checked) => {
                  handleAttendantStatusChange(attendant, checked ? EUserStatus.ACTIVE : EUserStatus.INACTIVE)
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
