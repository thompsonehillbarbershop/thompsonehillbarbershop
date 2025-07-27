"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Indicator from "@/components/ui/indicator"
import { Label } from "@/components/ui/label"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAttendant } from "@/hooks/use-attendant"
import { cn, formatCurrency } from "@/lib/utils"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { addHours, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, RefreshCwIcon } from "lucide-react"
// import { format } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

export default function AttendantSummaryPage({ userId }: { userId: string }) {
  const today = new Date()
  const { getSummary, isGettingDaySummary } = useAttendant()
  const [summary, setSummary] = useState<IAppointmentSummaryView | null>(null)
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(today),
    to: startOfDay(today),
  })
  const [refetchCount, setRefetchCount] = useState(0)

  useEffect(() => {
    async function fetchSummary() {
      const from = date?.from ? addHours(new Date(date.from), 3) : new Date()
      const to = date?.to ? addHours(new Date(date.to), 3) : new Date()

      const response = await getSummary({
        id: userId,
        from: from.toISOString(),
        to: to.toISOString()
      })

      if (response.data) {
        setSummary(response.data)
      } else {
        setSummary(null)
      }
    }
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSummary, userId, refetchCount])

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

            {/* Date Range Picker */}
            <div className="flex flex-row items-center justify-center gap-2 py-4">
              <div className="*:not-first:mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
                    >
                      <span
                        className={cn("truncate", !date && "text-muted-foreground")}
                      >
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "dd LLL y", { locale: ptBR })} -{" "}
                              {format(date.to, "dd LLL y", { locale: ptBR })}
                            </>
                          ) : (
                            format(date.from, "dd LLL y", { locale: ptBR })
                          )
                        ) : (
                          "Pick a date range"
                        )}
                      </span>
                      <CalendarIcon
                        size={16}
                        className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="range"
                      selected={date}
                      onSelect={setDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                isLoading={isGettingDaySummary}
                onClick={() => {
                  setRefetchCount(prev => prev + 1)
                }}
              ><RefreshCwIcon />Atualizar</Button>
            </div>
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
