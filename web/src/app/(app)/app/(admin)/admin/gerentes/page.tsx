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
import AddUserForm from "@/components/admin/add-user-form"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { EUserRole } from "@/models/user"
import { useState } from "react"

export default function ManagersPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
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
            className="w-full sm:w-fit"
          ><PlusIcon />Cadastrar Gerente</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cadastrar Gerente</SheetTitle>
            <SheetDescription>
              Preencha os dados do gerente para cadastrá-lo no sistema.
            </SheetDescription>
          </SheetHeader>
          <AddUserForm
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
          disablePagination={true}
          filtering={{
            enableFiltering: true,
            field: "name",
            placeholder: "Buscar por nome",
          }}
        />
      </div>
    </div>
  )
}
