"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { EPartnershipDiscountType, EPartnershipType, EPartnershipTypeMapper, IPartnershipView } from "@/models/partnerships"

interface Props {
  data?: IPartnershipView[]
  isLoading?: boolean
  emptyMessage?: string
  disablePagination?: boolean
  filtering?: {
    enableFiltering: boolean
    field: string
    placeholder: string
  }
  onEditButtonClick?: (user: IPartnershipView) => void
}

export default function PartnershipsTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum convênio encontrado",
  onEditButtonClick,
}: Props) {
  function getColumns(): ColumnDef<IPartnershipView>[] {
    return [
      {
        accessorKey: "name",
        header: "Título",
      },
      {
        accessorKey: "identificationLabel",
        header: () => <p className="text-center">Identificação</p>,
        cell: (row) => {
          const original = row.row.original
          const value = original.identificationLabel
          const type = original.type

          return (
            <p className="text-center">
              {type === EPartnershipType.COMMON ? value : "-"}
            </p>
          )
        },
      },
      {
        accessorKey: "type",
        header: () => <p className="text-center">Tipo</p>,
        cell: (row) => <p className="text-center">{EPartnershipTypeMapper[row.getValue() as EPartnershipType]}</p>,
      },
      {
        accessorKey: "discountValue",
        header: () => <p className="text-center">Desconto</p>,
        cell: (row) => {
          const original = row.row.original
          const value = original.discountValue
          const discountType = original.discountType
          return <p className="text-center">{discountType === EPartnershipDiscountType.FIXED ? formatCurrency(value) : formatPercentage(value)}</p>
        },
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