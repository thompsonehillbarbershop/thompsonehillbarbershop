"use client"

import CreateServiceForm from "@/components/admin/create-service-form"
import ServicesTable from "@/components/admin/services-table"
import UpdateServiceForm from "@/components/admin/update-service-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { IServiceView } from "@/models/service"
import { PlusIcon } from "lucide-react"
import React, { useState } from 'react'

export default function ServicesPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<IServiceView | undefined>(undefined)
  const { services, isLoadingServices } = useAdmin()

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Serviços</H1>
      <Sheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              setSelectedService(undefined)
            }}
            className="w-full sm:w-fit"
          ><PlusIcon />Cadastrar Serviço</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedService ? `Atualizar ${selectedService.name}` : "Cadastrar novo serviço"}</SheetTitle>
            <SheetDescription>
              {selectedService ? "Atualize as informações do serviço" : "Preencha os dados para cadastrar um novo serviço"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              {selectedService ? (
                <UpdateServiceForm
                  service={selectedService}
                  onSuccess={() => {
                    setSheetOpen(false)
                  }}
                />
              ) : (
                <CreateServiceForm
                  onSuccess={
                    () => {
                      setSheetOpen(false)
                    }
                  }
                />
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Card className="mt-2">
        <CardContent>
          <ServicesTable
            data={services}
            isLoading={isLoadingServices}
            emptyMessage="Nenhum serviço encontrado"
            filtering={{
              enableFiltering: true,
              field: "name",
              placeholder: "Buscar por título",
            }}
            onEditButtonClick={(service) => {
              setSelectedService(service)
              setSheetOpen(true)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
