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
import FeesForm from "./fees-form"

export default function ProductsPage() {
  const { apiKeys, isLoadingApiKeys, deleteApiKey, isLoadingSettings } = useAdmin()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1 className="pt-4">Configurações</H1>
      <Card className="mt-2">
        <CardContent className="space-y-2">
          <FeesForm
            isLoading={isLoadingSettings}
          />
        </CardContent>
      </Card>

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

      <H1 className="pt-4">Suporte e Manuteção</H1>
      <Card className="mt-2">
        <CardContent className="space-y-2">
          <p className="text-xl"><strong>Thompson & Hill - Aplicação Web Fullstack</strong></p>
          <p className="text-muted-foreground">Para manutenção ou suporte entrar em contato preferencialmente com o desenvolvedor resposável ou buscar desenvolvedores com conhecimento de acordo com as tecnologias utilizadas</p>
          <p><strong>Desenvolvedor resposável: </strong>Thiago Elias</p>
          <p><strong>Email de contato: </strong>contato@thiagoeliaseng.com.br</p>
          <p><strong>Git Hub do Desenvolvedor: </strong>https://github.com/thiagoelias99</p>
          <p><strong>Tecnologia Front End: </strong>Next.js + Tailwind CSS + Typescript</p>
          <p><strong>Tecnologia Back End: </strong>Nest.js + Mongoose + Typescript</p>
          <p><strong>Banco de dados: </strong>MongoDB Atlas</p>
          <p><strong>Repositório da Aplicação GitHub: </strong>https://github.com/thompsonehillbarbershop/thompsonehillbarbershop</p>
          <p><strong>Email de acesso oficial da aplicação: </strong>app.thompsonehillbarbershop@gmail.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
