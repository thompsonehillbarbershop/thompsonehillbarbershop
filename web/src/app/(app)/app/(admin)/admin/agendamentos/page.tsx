"use client"

import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import AppointmentsTable from "@/components/admin/appointments-table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMemo, useState } from "react"
import { IAppointmentView } from "@/models/appointment"
import AppointmentUpdateForm from "@/components/admin/appointment-update-form"
import { EUserRole } from "@/models/user"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppointments, UseAppointmentsParams } from "@/hooks/use-appointments"
import AppointmentSearchForm, { AppointmentSearchFormSchema } from "./appointment-search-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function AppointmentsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [isFiltersOpen, setFiltersOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<IAppointmentView | undefined>(undefined)
  const { users, isLoadingUsers, services, isLoadingServices } = useAdmin()
  const [params, setParams] = useState<UseAppointmentsParams>({
    page: 1,
    limit: 10,
    order: "desc",
    sortBy: "createdAt"
  })
  const { data: appointments, isLoading: isLoadingAppointments } = useAppointments(params)

  const attendants = useMemo(() => {
    return users?.filter(user => user.role === EUserRole.ATTENDANT)
  }, [users])

  function handleFormSubmit(values: AppointmentSearchFormSchema) {
    setParams((prev) => ({
      ...prev,
      ...values,
      limit: 10,
    }))
  }

  function handleLoadMore() {
    setParams((prev) => ({
      ...prev,
      limit: (prev.limit || 0) + 10
    }))
  }

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Atendimentos</H1>

      <Sheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Atualizar Atendimento</SheetTitle>
            <SheetDescription>
              Atualize as informações do atendimento
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              <AppointmentUpdateForm
                appointment={selectedAppointment!}
                params={params}
                attendants={attendants || []}
                services={services || []}
                isLoading={isLoadingAppointments || isLoadingUsers || isLoadingServices}
                onSuccess={() => {
                  setSheetOpen(false)
                }}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Card className="mt-4 mb-4">
        <CardContent>
          <div className="flex items-center justify-between">
            <CardTitle>Parâmetros de Busca <i className="text-xs text-muted-foreground">(resultados: {appointments?.total})</i></CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setFiltersOpen(!isFiltersOpen)}
            >
              {isFiltersOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          <AppointmentSearchForm
            className={cn("hidden lg:flex", isFiltersOpen ? "flex" : "hidden")}
            onSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>

      <Card >
        <CardContent className="space-y-4">
          <AppointmentsTable
            data={appointments?.data}
            isLoading={isLoadingAppointments}
            emptyMessage="Nenhum atendimento encontrado"
            onEditButtonClick={(appointment) => {
              setSelectedAppointment(appointment)
              setSheetOpen(true)
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLoadMore}
            isLoading={isLoadingAppointments}
          >Carregar Mais</Button>
        </CardContent>
      </Card>
    </div>
  )
}
