"use client"

import { IUserView } from "@/models/user"
import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Props {
  data?: IUserView[]
  isLoading?: boolean
  emptyMessage?: string
  disablePagination?: boolean
  filtering?: {
    enableFiltering: boolean
    field: string
    placeholder: string
  }
  onEditButtonClick?: (user: IUserView) => void
}

export default function AdminUsersTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum usuário encontrado",
  disablePagination = false,
  filtering = {
    enableFiltering: false,
    field: "name",
    placeholder: "Buscar por nome",
  },
  onEditButtonClick,
}: Props) {
  function getColumns(): ColumnDef<IUserView>[] {
    return [
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
        accessorKey: "userName",
        header: "Usuário",
      },
      {
        accessorKey: "createdAt",
        header: () => <p className="hidden sm:block text-center">Criado em</p>,
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
      enablePagination={!disablePagination}
      filtering={filtering}
    />
  )
}