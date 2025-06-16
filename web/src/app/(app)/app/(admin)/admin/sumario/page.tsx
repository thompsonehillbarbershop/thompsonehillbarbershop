"use client"

import AdminSummaryTable from "@/components/admin/admin-summary-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { formatCurrency } from "@/lib/utils"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { RefreshCwIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export default function AttendantSummaryPage() {
  // const [date, setDate] = useState(new Date())
  const [refetchCount, setRefechCount] = useState(0)
  const [summaryData, setSummaryData] = useState<IAppointmentSummaryView[] | null>(null)
  const { daySummary, isGettingDaySummary } = useAdmin()

  useEffect(() => {
    daySummary({ from: new Date() })
      .then((data) => {
        setSummaryData(data)
      })
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
        <Button
          isLoading={isGettingDaySummary}
          onClick={() => {
            setRefechCount(prev => prev + 1)
          }}
        ><RefreshCwIcon />Atualizar</Button>
      </div>
      <div className="w-full flex flex-row justify-start items-start gap-6">
        <Card className="w-64">
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalServicesValue)}</p>
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalProductsValue)}</p>
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardHeader>
            <CardTitle>Faturamento Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalGrossRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardHeader>
            <CardTitle>Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-center text-xl font-bold">{formatCurrency(summary?.totalDiscount)}</p>
          </CardContent>
        </Card>
        <Card className="w-64">
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
