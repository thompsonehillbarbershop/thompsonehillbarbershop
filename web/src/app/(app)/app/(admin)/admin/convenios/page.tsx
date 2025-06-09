"use client"

import CreatePartnershipForm from "@/components/admin/create-partnership-form"
import PartnershipTable from "@/components/admin/partnership-table"
import UpdatePartnershipForm from "@/components/admin/update-partnership-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { IPartnershipView } from "@/models/partnerships"
import { PlusIcon } from "lucide-react"
import React, { useState } from 'react'

export default function PartnershipsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedPartnership, setSelectedPartnership] = useState<IPartnershipView | undefined>(undefined)
  const { partnerships, isLoadingPartnerships } = useAdmin()

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Convênios</H1>
      <Sheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              setSelectedPartnership(undefined)
            }}
            className="w-full sm:w-fit"
          ><PlusIcon />Cadastrar convênio</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedPartnership ? `Atualizar ${selectedPartnership.name}` : "Cadastrar novo convênio"}</SheetTitle>
            <SheetDescription>
              {selectedPartnership ? "Atualize as informações do convênio" : "Preencha os dados para cadastrar um novo convênio"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              {selectedPartnership ? (
                <UpdatePartnershipForm
                  partnership={selectedPartnership}
                  onSuccess={() => {
                    setSheetOpen(false)
                  }}
                />
              ) : (
                <CreatePartnershipForm
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
          <PartnershipTable
            data={partnerships}
            isLoading={isLoadingPartnerships}
            emptyMessage="Nenhum convênio encontrado"
            filtering={{
              enableFiltering: true,
              field: "name",
              placeholder: "Buscar por título",
            }}
            onEditButtonClick={(partnership) => {
              setSelectedPartnership(partnership)
              setSheetOpen(true)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
