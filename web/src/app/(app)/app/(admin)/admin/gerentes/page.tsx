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
import { useState } from "react"

export default function ManagersPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUserView | undefined>(undefined)
  const { users, isLoadingUsers } = useAdmin()

  return (
    <div className="w-full flex flex-col">
      <H1>Gerentes</H1>
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
          ><PlusIcon />Cadastrar Gerente</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedUser ? `Atualizar ${selectedUser.userName}` : "Cadastrar novo Gerente"}</SheetTitle>
            <SheetDescription>
              {selectedUser ? "Atualize as informações do gerente" : "Preencha os dados para cadastrar um novo gerente"}
            </SheetDescription>
          </SheetHeader>
          <AddUserForm
            user={selectedUser}
            forRole={EUserRole.MANAGER}
            onSuccess={() => {
              setSheetOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="w-full pt-4">
        <AdminUsersTable
          data={users}
          isLoading={isLoadingUsers}
          emptyMessage="Nenhum gerente encontrado"
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
      </div>
    </div>
  )
}
