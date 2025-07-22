"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Indicator from "@/components/ui/indicator"
import { Label } from "@/components/ui/label"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { useAttendant } from "@/hooks/use-attendant"
import { formatCurrency } from "@/lib/utils"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { format } from "date-fns"
// import { format } from "date-fns"
import { useEffect, useState } from "react"

export default function AttendantSummaryPage({ userId }: { userId: string }) {
  const { getSummary, isGettingDaySummary } = useAttendant()
  const [summary, setSummary] = useState<IAppointmentSummaryView | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      const response = await getSummary({ id: userId })

      if (response.data) {
        setSummary(response.data)
      } else {
        setSummary(null)
      }
    }
    fetchSummary()
  }, [getSummary, userId])

  return (
    <div className="w-full flex flex-col items-center justify-center mx-auto">
      {isGettingDaySummary && (<LoadingIndicator size="lg" />)}

      {summary && (
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Resumo do Dia</CardTitle>
            <CardDescription>
              Resumo das atividades do dia, incluindo atendimentos finalizados, clientes atendidos e serviços prestados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Atendimentos</Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{summary.totalAppointments}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Serviços</Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{summary.totalServiceWeight}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Faturamento Serviços </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.finalServicesPrice)}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Faturamento Produtos </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.finalProductsPrice)}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Faturamento Total <i>(bruto)</i> </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.totalPrice)}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Descontos </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.totalDiscount)}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Faturamento Total <i>(líquido)</i> </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.totalFinalPrice)}</Indicator>
            </div>
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <Label className="flex-1">Taxa Pagamento </Label>
              <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{formatCurrency(summary.totalPaymentFee)}</Indicator>
            </div>
            {summary.firstAppointmentDate && (
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <Label className="flex-1">Primeiro Atendimento </Label>
                <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{format(new Date(summary.firstAppointmentDate), "dd/MM/yy - HH:mm")}</Indicator>
              </div>
            )}
            {summary.lastAppointmentDate && (
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <Label className="flex-1">Último Atendimento </Label>
                <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{format(new Date(summary.lastAppointmentDate), "dd/MM/yy - HH:mm")}</Indicator>
              </div>
            )}
            {/* {summary.totalAttendanceMinutes && summary.totalAttendanceMinutes > 0 && (
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <Label className="flex-1">Tempo Total de Atendimento </Label>
                <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{summary.totalAttendanceMinutes.toFixed(0)} minutos</Indicator>
              </div>
            )}
            {summary.meanAttendanceTimeByServicesInMinutes && summary.meanAttendanceTimeByServicesInMinutes > 0 && (
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <Label className="flex-1">Tempo Médio por Serviço </Label>
                <Indicator className="flex-1 justify-center text-lg md:text-lg font-semibold">{summary.meanAttendanceTimeByServicesInMinutes.toFixed(2)} minutos</Indicator>
              </div>
            )} */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
