"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format, differenceInMinutes } from "date-fns"
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
        header: () => <p className="text-center">Telefone</p>,
        cell: (row) => <p className="text-center">{row.getValue() as string}</p>,
      },
      {
        accessorKey: "createdAt",
        header: () => <p className="text-center">Entrada em</p>,
        cell: (row) => <p className="text-center">{format(new Date(row.getValue() as string), "dd/MM/yy - HH:mm", {
          locale: ptBR,
        })}</p>,
      },
      {
        id: "waitingTime",
        header: () => <p className="text-center">Tempo de Espera</p>,
        cell: (row) => {
          const appointment = row.row.original
          const createdAt = new Date(appointment.createdAt)
          const onServiceAt = appointment.onServiceAt ? new Date(appointment.onServiceAt) : null

          if (!onServiceAt) {
            return <p className="text-center">-</p>
          }

          const waitingTimeMinutes = differenceInMinutes(onServiceAt, createdAt)
          return <p className="text-center">{waitingTimeMinutes} min</p>
        },
      },
      {
        id: "serviceTime",
        header: () => <p className="text-center">Tempo de Atendimento</p>,
        cell: (row) => {
          const appointment = row.row.original
          const onServiceAt = appointment.onServiceAt ? new Date(appointment.onServiceAt) : null
          const finishedAt = appointment.finishedAt ? new Date(appointment.finishedAt) : null

          if (!onServiceAt || !finishedAt) {
            return <p className="text-center">-</p>
          }

          const serviceTimeMinutes = differenceInMinutes(finishedAt, onServiceAt)
          return <p className="text-center">{serviceTimeMinutes} min</p>
        },
      },
      {
        accessorKey: "finalPrice",
        header: () => <p className="text-center">Total</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalServiceWeight",
        header: () => <p className="text-center">Serviços</p>,
        cell: (row) => <p className="text-center">{Number(row.getValue())}</p>,
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