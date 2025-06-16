"use client"

import { DataTable } from "../ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Props {
  data?: IAppointmentSummaryView[]
  isLoading?: boolean
}

export default function AdminSummaryTable({
  data = [],
  isLoading = false,
}: Props) {
  function getColumns(): ColumnDef<IAppointmentSummaryView>[] {
    return [
      {
        accessorKey: "attendantName",
        header: "Atendente",
      },
      {
        accessorKey: "finalServicesPrice",
        header: () => <p className="text-center">Serviços</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "finalProductsPrice",
        header: () => <p className="text-center">Produtos</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalPrice",
        header: () => <p className="text-center">Faturamento Bruto</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalDiscount",
        header: () => <p className="text-center">Descontos</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalFinalPrice",
        header: () => <p className="text-center">Faturamento Líquido</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalPaymentFee",
        header: () => <p className="text-center">Taxa Pagamento</p>,
        cell: (row) => <p className="text-center">{formatCurrency(Number(row.getValue()))}</p>,
      },
      {
        accessorKey: "totalAppointments",
        header: () => <p className="text-center">Atendimentos</p>,
        cell: (row) => <p className="text-center">{Number(row.getValue())}</p>,
      },
      {
        accessorKey: "totalServiceWeight",
        header: () => <p className="text-center">Serviços</p>,
        cell: (row) => <p className="text-center">{Number(row.getValue())}</p>,
      },
      {
        accessorKey: "firstAppointmentDate",
        header: () => <p className="text-center">Primeiro Atendimento</p>,
        cell: (row) => <p className="text-center">{format(new Date(row.getValue() as string), "HH:mm", {
          locale: ptBR
        })}</p>,
      },
      {
        accessorKey: "lastAppointmentDate",
        header: () => <p className="text-center">Último Atendimento</p>,
        cell: (row) => <p className="text-center">{format(new Date(row.getValue() as string), "HH:mm", {
          locale: ptBR
        })}</p>,
      },
      {
        accessorKey: "totalAttendanceMinutes",
        header: () => <p className="text-center">Tempo Total de Atendimento</p>,
        cell: (row) => <p className="text-center">{Number(row.getValue()).toFixed(0)} minutos</p>,
      },
      {
        accessorKey: "meanAttendanceTimeByServicesInMinutes",
        header: () => <p className="text-center">Tempo Médio por Serviço</p>,
        cell: (row) => <p className="text-center">{Number(row.getValue()).toFixed(0)} minutos</p>,
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