"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { IServiceView } from "@/models/service"

interface Props {
  data?: IServiceView[]
  isLoading?: boolean
  emptyMessage?: string
  disablePagination?: boolean
  filtering?: {
    enableFiltering: boolean
    field: string
    placeholder: string
  }
  onEditButtonClick?: (user: IServiceView) => void
}

export default function ServicesTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum serviço encontrado",
  onEditButtonClick,
}: Props) {
  function getColumns(): ColumnDef<IServiceView>[] {
    return [
      {
        accessorKey: "name",
        header: "Título",
      },
      {
        accessorKey: "value",
        header: () => <p className="text-center">Preço</p>,
        cell: (row) => {
          const service = row.row.original
          const usePromoValue = service.promoEnabled && service.promoValue

          if (usePromoValue) {
            return (
              <div className="flex flex-col items-center">
                <p className="text-xs line-through text-muted-foreground">
                  {formatCurrency(Number(service.value))}
                </p>
                <p className="text-primary font-semibold">
                  {formatCurrency(Number(service.promoValue))}
                </p>
              </div>
            )
          }

          return (
            <p
              className="text-center"
            >
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "weight",
        header: () => <p className="text-center">Peso</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "description",
        header: () => <p className="text-start">Descrição</p>,
        cell: (row) => <p className="text-start max-w-40 text-ellipsis line-clamp-1">{row.getValue() as string}</p>,
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