"use client"

import AdminSummaryTable from "@/components/admin/admin-summary-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { formatCurrency } from "@/lib/utils"
import { RefreshCwIcon } from "lucide-react"
import { useMemo } from "react"

// import { format } from "date-fns"

export default function AttendantSummaryPage() {
  const { daySummary, isGettingDaySummary, refetchSummary, isRefetchingSummary } = useAdmin()

  const summary = useMemo(() => {
    if (!daySummary) return null

    return {
      totalServicesValue: daySummary.reduce((acc, item) => acc + item.finalServicesPrice, 0),
      totalProductsValue: daySummary.reduce((acc, item) => acc + item.finalProductsPrice, 0),
      totalGrossRevenue: daySummary.reduce((acc, item) => acc + item.totalPrice, 0),
      totalDiscount: daySummary.reduce((acc, item) => acc + item.totalDiscount, 0),
      totalNetRevenue: daySummary.reduce((acc, item) => acc + (item.totalPrice - item.totalDiscount), 0),
    }
  }, [daySummary])


  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <div className="w-full flex flex-row justify-between items-center mb-4">
        <H1>Resumo do Dia</H1>
        <Button
          isLoading={isGettingDaySummary || isRefetchingSummary}
          onClick={() => refetchSummary()}
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
            data={daySummary?.filter(item => item.totalPrice > 0) || []}
            isLoading={isGettingDaySummary || isRefetchingSummary}
          />
        </CardContent>
      </Card>
    </div>
  )
}
