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
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TotemsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUserView | undefined>(undefined)
  const { users, isLoadingUsers } = useAdmin()

  const totems = useMemo(() => {
    return users?.filter((user) => user.role === EUserRole.TOTEM).sort((a, b) => {
      if (a.userName < b.userName) return -1
      if (a.userName > b.userName) return 1
      return 0
    })
  }
    , [users])

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Totems</H1>
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
          ><PlusIcon />Cadastrar Totem</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedUser ? `Atualizar ${selectedUser.userName}` : "Cadastrar novo totem"}</SheetTitle>
            <SheetDescription>
              {selectedUser ? "Atualize as informações do totem" : "Preencha os dados para cadastrar um novo totem"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              <AddUserForm
                user={selectedUser}
                forRole={EUserRole.TOTEM}
                onSuccess={() => {
                  setSheetOpen(false)
                }}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Card className="mt-2">
        <CardContent>
          <AdminUsersTable
            data={totems}
            forRole={EUserRole.TOTEM}
            isLoading={isLoadingUsers}
            emptyMessage="Nenhum totem encontrado"
            filtering={{
              enableFiltering: true,
              field: "name",
              placeholder: "Buscar por descrição",
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
