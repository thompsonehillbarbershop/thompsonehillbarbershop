"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { FileCodeIcon, PlusIcon } from "lucide-react"
import React from 'react'
import ApiKeyForm from "@/components/admin/api-key-form"
import ApiKeysTable from "@/components/admin/api-key-table"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
  const { apiKeys, isLoadingApiKeys, deleteApiKey } = useAdmin()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Chaves de API</H1>
      <Dialog>
        <div className="flex flex-col sm:flex-row gap-2">
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-fit"
            ><PlusIcon />Cadastrar Chave</Button>
          </DialogTrigger>
          <a
            target="_blank"
            href={`${apiUrl}/docs`}
            className={buttonVariants({
              variant: "secondary",
              className: "w-full sm:w-fit"
            })}
          ><FileCodeIcon />Documentação API
          </a>
        </div>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Chave</DialogTitle>
          </DialogHeader>
          <ApiKeyForm />
        </DialogContent>
      </Dialog>

      <Card className="mt-2">
        <CardContent>
          <ApiKeysTable
            data={apiKeys}
            isLoading={isLoadingApiKeys}
            onDeleteButtonClick={(data) => deleteApiKey(data.id)}
          />
        </CardContent>
      </Card>

      <H1 className="pt-4">Exportação de Dados</H1>
      <Button
        onClick={() => {
          router.push("/api/export-csv")
        }}
      >
        Exportar Dados para CSV
      </Button>
    </div>
  )
}
