"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { useQueue } from "@/hooks/useQueue"
import { EUserRole, EUserStatus } from "@/models/user"
import { useMemo } from "react"
import AppointmentCard from "./appointment-card"

export default function AdminDashboardPage() {
  const queue = useQueue()
  const { users } = useAdmin()

  const activeAttendants = useMemo(() => {
    return users?.filter((user) => user.role === EUserRole.ATTENDANT && user.status === EUserStatus.ACTIVE)
  }, [users])

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Filas de Atendimento</H1>
      <ScrollArea className="w-[calc(100vw-6rem)]">
        <div className="flex flex-row gap-1 pb-4">
          {activeAttendants?.map((attendant) => (
            <Card key={attendant.id} className="min-w-64 max-w-64">
              <CardHeader className="px-3">
                <CardTitle className="text-primary capitalize text-xl font-bold">{attendant.name}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 space-y-1">
                {queue[queue[attendant.userName]?.length > 0 ? attendant.userName : "fila_geral"]?.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
