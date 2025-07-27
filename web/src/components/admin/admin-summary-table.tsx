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
  function calculateTotals(data: IAppointmentSummaryView[]): IAppointmentSummaryView {
    if (data.length === 0) {
      return {
        attendantName: "TOTAL",
        attendantId: "total",
        totalAppointments: 0,
        totalServiceWeight: 0,
        totalPrice: 0,
        totalDiscount: 0,
        totalFinalPrice: 0,
        totalPaymentFee: 0,
        firstAppointmentDate: null,
        lastAppointmentDate: null,
        totalAttendanceMinutes: 0,
        meanAttendanceTimeByServicesInMinutes: 0,
        finalServicesPrice: 0,
        finalProductsPrice: 0,
      }
    }

    const totals = data.reduce(
      (acc, item) => ({
        totalAppointments: acc.totalAppointments + item.totalAppointments,
        totalServiceWeight: acc.totalServiceWeight + item.totalServiceWeight,
        totalPrice: acc.totalPrice + item.totalPrice,
        totalDiscount: acc.totalDiscount + item.totalDiscount,
        totalFinalPrice: acc.totalFinalPrice + item.totalFinalPrice,
        totalPaymentFee: acc.totalPaymentFee + item.totalPaymentFee,
        totalAttendanceMinutes: acc.totalAttendanceMinutes + (item.totalAttendanceMinutes || 0),
        finalServicesPrice: acc.finalServicesPrice + item.finalServicesPrice,
        finalProductsPrice: acc.finalProductsPrice + item.finalProductsPrice,
        meanAttendanceSum: acc.meanAttendanceSum + (item.meanAttendanceTimeByServicesInMinutes || 0),
        count: acc.count + 1,
      }),
      {
        totalAppointments: 0,
        totalServiceWeight: 0,
        totalPrice: 0,
        totalDiscount: 0,
        totalFinalPrice: 0,
        totalPaymentFee: 0,
        totalAttendanceMinutes: 0,
        finalServicesPrice: 0,
        finalProductsPrice: 0,
        meanAttendanceSum: 0,
        count: 0,
      }
    )

    return {
      attendantName: "TOTAL",
      attendantId: "total",
      totalAppointments: totals.totalAppointments,
      totalServiceWeight: totals.totalServiceWeight,
      totalPrice: totals.totalPrice,
      totalDiscount: totals.totalDiscount,
      totalFinalPrice: totals.totalFinalPrice,
      totalPaymentFee: totals.totalPaymentFee,
      firstAppointmentDate: null,
      lastAppointmentDate: null,
      totalAttendanceMinutes: totals.totalAttendanceMinutes,
      meanAttendanceTimeByServicesInMinutes: totals.meanAttendanceSum / totals.count,
      finalServicesPrice: totals.finalServicesPrice,
      finalProductsPrice: totals.finalProductsPrice,
    }
  }

  function getColumns(): ColumnDef<IAppointmentSummaryView>[] {
    return [
      {
        accessorKey: "attendantName",
        header: "Atendente",
        cell: (row) => {
          const value = row.getValue() as string
          const isTotal = value === "TOTAL"
          return (
            <p className={isTotal ? "font-bold" : ""}>
              {value}
            </p>
          )
        },
      },
      {
        accessorKey: "finalServicesPrice",
        header: () => <p className="text-center">Serviços</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "finalProductsPrice",
        header: () => <p className="text-center">Produtos</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "totalPrice",
        header: () => <p className="text-center">Faturamento Bruto</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "totalDiscount",
        header: () => <p className="text-center">Descontos</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "totalFinalPrice",
        header: () => <p className="text-center">Faturamento Líquido</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "totalPaymentFee",
        header: () => <p className="text-center">Taxa Pagamento</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {formatCurrency(Number(row.getValue()))}
            </p>
          )
        },
      },
      {
        accessorKey: "totalAppointments",
        header: () => <p className="text-center">Atendimentos</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {Number(row.getValue())}
            </p>
          )
        },
      },
      {
        accessorKey: "totalServiceWeight",
        header: () => <p className="text-center">Serviços</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {Number(row.getValue())}
            </p>
          )
        },
      },
      {
        accessorKey: "firstAppointmentDate",
        header: () => <p className="text-center">Primeiro Atendimento</p>,
        cell: (row) => {
          const value = row.getValue() as string | null
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"

          if (!value) return <p className={`text-center ${isTotal ? "font-bold" : ""}`}>-</p>
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {format(new Date(value), "dd/MM/yy HH:mm", {
                locale: ptBR
              })}
            </p>
          )
        },
      },
      {
        accessorKey: "lastAppointmentDate",
        header: () => <p className="text-center">Último Atendimento</p>,
        cell: (row) => {
          const value = row.getValue() as string | null
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"

          if (!value) return <p className={`text-center ${isTotal ? "font-bold" : ""}`}>-</p>
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {format(new Date(value), "dd/MM/yy - HH:mm", {
                locale: ptBR
              })}
            </p>
          )
        },
      },
      {
        accessorKey: "totalAttendanceMinutes",
        header: () => <p className="text-center">Tempo Total de Atendimento</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {Number(row.getValue()).toFixed(0)} minutos
            </p>
          )
        },
      },
      {
        accessorKey: "meanAttendanceTimeByServicesInMinutes",
        header: () => <p className="text-center">Tempo Médio por Serviço</p>,
        cell: (row) => {
          const attendantName = (row.row.original as IAppointmentSummaryView).attendantName
          const isTotal = attendantName === "TOTAL"
          return (
            <p className={`text-center ${isTotal ? "font-bold" : ""}`}>
              {Number(row.getValue()).toFixed(0)} minutos
            </p>
          )
        },
      }
    ]
  }

  const dataWithTotals = data.length > 0 ? [...data, calculateTotals(data)] : data

  return (
    <DataTable
      columns={getColumns()}
      data={dataWithTotals}
      isLoading={isLoading}
    />
  )
}