"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EAppointmentStatuses, EPaymentMethod, EPaymentMethodMapper, IAppointmentView } from "@/models/appointment"
import { formatCurrency } from "@/lib/utils"
import AppointmentStatusBadge from "../appointment-status-badge"
import { Button } from "../ui/button"
import { Edit2Icon } from "lucide-react"

interface Props {
  data?: IAppointmentView[]
  isLoading?: boolean
  emptyMessage?: string
  onEditButtonClick?: (appointment: IAppointmentView) => void
}

export default function AppointmentsTable({
  data = [],
  isLoading = false,
  emptyMessage = "Nenhum agendamento encontrado",
  onEditButtonClick
}: Props) {
  function getColumns(): ColumnDef<IAppointmentView>[] {
    return [
      {
        accessorKey: "customer.name",
        header: "Cliente",
      },
      {
        accessorKey: "customer.phoneNumber",
        header: () => <p className="hidden sm:block text-center">Telefone</p>,
        cell: (row) => <p className="hidden sm:block text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "createdAt",
        header: () => <p className="hidden sm:block text-center">Agendado em</p>,
        cell: (row) => <p className="hidden sm:block text-center">{format(new Date(row.getValue() as string), "dd/MM/yy - HH:mm", {
          locale: ptBR,
        })}</p>,
      },
      {
        accessorKey: "finalPrice",
        header: () => <p className="text-center">Total</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "status",
        header: () => <p className="text-center max-w-32">Status</p>,
        cell: (row) => {
          const status = row.getValue() as EAppointmentStatuses
          return <AppointmentStatusBadge
            status={status}
            className="max-w-32 text-center"
          />
        },
      },
      {
        accessorKey: "paymentMethod",
        header: () => <p className="text-center">Método de Pagamento</p>,
        cell: (row) => <p className="text-center">{EPaymentMethodMapper[row.getValue() as EPaymentMethod]}</p>,
      },
      {
        accessorKey: "attendant.name",
        header: () => <p className="text-center">Atendente</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        id: "actions",
        header: () => <p className="text-center">Ações</p>,
        cell: (row) => {
          const appointment = row.row.original

          return (
            <div className="flex justify-center items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  if (onEditButtonClick) {
                    onEditButtonClick(appointment)
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