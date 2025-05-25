"use client"

import AdminUsersTable from "@/components/admin/admin-users-table"
import { H1 } from "@/components/ui/typography"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { useAdmin } from "@/hooks/use-admin"
import AddUserForm from "@/components/admin/user-form"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { EUserRole, IUserView } from "@/models/user"
import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function AttendantsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUserView | undefined>(undefined)
  const { users, isLoadingUsers } = useAdmin()

  const attendants = useMemo(() => {
    return users?.filter((user) => user.role === EUserRole.ATTENDANT).sort((a, b) => {
      if (a.userName < b.userName) return -1
      if (a.userName > b.userName) return 1
      return 0
    })
  }
    , [users])

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Atendentes</H1>
      <Sheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              setSelectedUser(undefined)
            }}
            className="w-full sm:w-fit"
          ><PlusIcon />Cadastrar Atendente</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedUser ? `Atualizar ${selectedUser.userName}` : "Cadastrar novo atendente"}</SheetTitle>
            <SheetDescription>
              {selectedUser ? "Atualize as informações do atendente" : "Preencha os dados para cadastrar um novo atendente"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              <AddUserForm
                user={selectedUser}
                forRole={EUserRole.ATTENDANT}
                onSuccess={() => {
                  setSheetOpen(false)
                }}
              />
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Card className="mt-2">
        <CardContent>
          <AdminUsersTable
            data={attendants}
            forRole={EUserRole.ATTENDANT}
            isLoading={isLoadingUsers}
            emptyMessage="Nenhum atendente encontrado"
            filtering={{
              enableFiltering: true,
              field: "name",
              placeholder: "Buscar por nome",
            }}
            onEditButtonClick={(user) => {
              setSelectedUser(user)
              setSheetOpen(true)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
