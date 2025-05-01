"use client"

import { IUserView } from "@/models/user"
import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

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
}: Props) {
  function getColumns(): ColumnDef<IUserView>[] {
    return [
      {
        accessorKey: "name",
        header: "Nome",
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