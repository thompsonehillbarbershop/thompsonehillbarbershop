"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Trash2Icon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { IApiKeyView } from "@/models/api-key"

interface Props {
  data?: IApiKeyView[]
  isLoading?: boolean
  onDeleteButtonClick?: (data: IApiKeyView) => void
}

export default function ApiKeysTable({
  data = [],
  isLoading = false,
  onDeleteButtonClick,
}: Props) {
  function getColumns(): ColumnDef<IApiKeyView>[] {
    return [
      {
        accessorKey: "name",
        header: "Título",
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
          const data = row.row.original

          return (
            <div className="flex justify-center items-center gap-1">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (onDeleteButtonClick) {
                    onDeleteButtonClick(data)
                  }
                }}
              ><Trash2Icon /></Button>
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
    />
  )
}