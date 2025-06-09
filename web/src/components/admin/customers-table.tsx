"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"
import { differenceInYears, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EGender, EGenderMapper, ICustomerView } from "@/models/customer"
import { TZDate } from "@date-fns/tz"

interface Props {
  data?: ICustomerView[]
  isLoading?: boolean
  emptyMessage?: string
  disablePagination?: boolean
  filtering?: {
    enableFiltering: boolean
    field: string
    placeholder: string
  }
  onEditButtonClick?: (customer: ICustomerView) => void
}

export default function CustomersTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum cliente encontrado",
  onEditButtonClick,
}: Props) {
  function getColumns(): ColumnDef<ICustomerView>[] {
    return [
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
        accessorKey: "referralCode",
        header: () => <p className="text-center">Código de Indicação</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "referralCodeCount",
        header: () => <p className="text-center">Indicações</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "gender",
        header: () => <p className="text-center">Genero</p>,
        cell: (row) => <p className="text-center">{EGenderMapper[row.getValue() as EGender]}</p>,
      },
      {
        accessorKey: "phoneNumber",
        header: () => <p className="text-center">Telefone</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "birthDate",
        header: () => <p className="text-center">Idade</p>,
        cell: (row) => <p className="text-center">{differenceInYears(new Date(), new TZDate(row.getValue() as string, "+06:00"))} anos | {format(new TZDate(row.getValue() as string, "+06:00"), "dd/MMM/yyyy", {
          locale: ptBR,
        })}</p>,
      },
      {
        accessorKey: "createdAt",
        header: () => <p className="text-center">Registrado em</p>,
        cell: (row) => <p className="text-center">{format(new Date(row.getValue() as string), "dd/MMM/yy", {
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