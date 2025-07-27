"use client"

import AdminSummaryTable from "@/components/admin/admin-summary-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { cn, formatCurrency } from "@/lib/utils"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { CalendarIcon, RefreshCwIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { addHours, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function AttendantSummaryPage() {
  const today = new Date()
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(today),
    to: startOfDay(today),
  })
  const [refetchCount, setRefetchCount] = useState(0)
  const [summaryData, setSummaryData] = useState<IAppointmentSummaryView[] | null>(null)
  const { daySummary, isGettingDaySummary } = useAdmin()

  useEffect(() => {
    const from = date?.from ? addHours(new Date(date.from), 3) : new Date()
    const to = date?.to ? addHours(new Date(date.to), 3) : new Date()

    daySummary({ from, to })
      .then((data) => {
        setSummaryData(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySummary, refetchCount])

  const summary = useMemo(() => {
    if (!summaryData) return null

    return {
      totalServicesValue: summaryData.reduce((acc, item) => acc + item.finalServicesPrice, 0),
      totalProductsValue: summaryData.reduce((acc, item) => acc + item.finalProductsPrice, 0),
      totalGrossRevenue: summaryData.reduce((acc, item) => acc + item.totalPrice, 0),
      totalDiscount: summaryData.reduce((acc, item) => acc + item.totalDiscount, 0),
      totalNetRevenue: summaryData.reduce((acc, item) => acc + (item.totalPrice - item.totalDiscount), 0),
    }
  }, [summaryData])

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <div className="w-full flex flex-row justify-between items-center mb-4">
        <H1>Resumo do Dia</H1>
        <div className="flex flex-row items-center gap-2">
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
        <div></div>
      </div>
      <div className="w-full flex flex-col lg:flex-row justify-start items-start gap-2 xl:gap-6">
        <Card className="w-full lg:w-1/2 xl:w-64">
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalServicesValue)}</p>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-1/2 xl:w-64">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalProductsValue)}</p>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-1/2 xl:w-64">
          <CardHeader>
            <CardTitle>Faturamento Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalGrossRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-1/2 xl:w-64">
          <CardHeader>
            <CardTitle>Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalDiscount)}</p>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-1/2 xl:w-64">
          <CardHeader>
            <CardTitle>Faturamento Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalNetRevenue)}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-2">
        <CardContent>
          <AdminSummaryTable
            data={summaryData?.filter(item => item.totalPrice > 0) || []}
            isLoading={isGettingDaySummary}
          />
        </CardContent>
      </Card>
    </div>
  )
}
