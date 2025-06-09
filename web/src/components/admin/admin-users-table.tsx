"use client"

import { EUserRole, EUserStatus, IUserView } from "@/models/user"
import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Props {
  data?: IUserView[]
  isLoading?: boolean
  emptyMessage?: string
  onEditButtonClick?: (user: IUserView) => void
  forRole?: EUserRole
}

export default function AdminUsersTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum usuário encontrado",
  onEditButtonClick,
  forRole,
}: Props) {
  function getColumns(): ColumnDef<IUserView>[] {
    return [
      {
        accessorKey: "name",
        header: () => { return forRole === EUserRole.TOTEM ? "Descrição" : "Nome" },
      },
      {
        accessorKey: "userName",
        header: () => <p className="text-center">Usuário</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "role",
        header: () => <p className="text-center">Administrador</p>,
        cell: (row) => <p className="text-center">{(row.getValue() as EUserRole) === EUserRole.ATTENDANT_MANAGER ? "Sim" : "Não"}</p>,
      },
      {
        accessorKey: "status",
        header: () => <p className={cn("text-center", forRole === EUserRole.ATTENDANT ? "" : "hidden")}>Ativo</p>,
        cell: (row) => {
          if (forRole !== EUserRole.ATTENDANT) {
            return <div className="hidden"></div>
          }

          const status = row.getValue() as EUserStatus
          const isActive = status === EUserStatus.ACTIVE

          if (isActive) {
            return (
              <div className="flex justify-center items-center gap-3">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                </span>
                <p>Ativo</p>
              </div>
            )
          }
          return (
            <div className="flex justify-center items-center gap-3">
              <span className="relative flex size-3">
                <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
              </span>
              <p>Não</p>
            </div>
          )
        }
      },
      {
        accessorKey: "createdAt",
        header: () => <p className="hidden sm:block text-center">Cadastrado em</p>,
        cell: (row) => <p className="hidden sm:block text-center">{format(new Date(row.getValue() as string), "dd/MMM/yy", {
          locale: ptBR
        })}</p>,
      },
      {
        id: "actions",
        header: () => <p className="text-center">Ações</p>,
        cell: (row) => {
          const user = row.row.original

          return (
            <div className="flex justify-center items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  if (onEditButtonClick) {
                    onEditButtonClick(user)
                  }
                }}
              ><Edit2Icon /></Button>
            </div>
          )
        }
      }
    ]
  }

  return (
    <DataTable
      columns={getColumns()}
      data={data}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    />
  )
}