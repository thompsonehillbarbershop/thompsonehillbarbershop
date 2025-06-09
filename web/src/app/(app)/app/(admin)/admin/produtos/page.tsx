"use client"

import CreateProductForm from "@/components/admin/create-product-form"
import ProductsTable from "@/components/admin/product-table"
import UpdateProductForm from "@/components/admin/update-product-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { H1 } from "@/components/ui/typography"
import { useAdmin } from "@/hooks/use-admin"
import { IProductView } from "@/models/product"
import { PlusIcon } from "lucide-react"
import React, { useState } from 'react'

export default function ProductsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<IProductView | undefined>(undefined)
  const { products, isLoadingProducts } = useAdmin()

  return (
    <div className="w-full flex flex-col max-w-[1440px] mx-auto">
      <H1>Produtos</H1>
      <Sheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              setSelectedProduct(undefined)
            }}
            className="w-full sm:w-fit"
          ><PlusIcon />Cadastrar Produto</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedProduct ? `Atualizar ${selectedProduct.name}` : "Cadastrar novo produto"}</SheetTitle>
            <SheetDescription>
              {selectedProduct ? "Atualize as informações do produto" : "Preencha os dados para cadastrar um novo produto"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[90%] pr-4">
            <div className="px-1">
              {selectedProduct ? (
                <UpdateProductForm
                  product={selectedProduct}
                  onSuccess={() => {
                    setSheetOpen(false)
                  }}
                />
              ) : (
                <CreateProductForm
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
          <ProductsTable
            data={products}
            isLoading={isLoadingProducts}
            emptyMessage="Nenhum produto encontrado"
            filtering={{
              enableFiltering: true,
              field: "name",
              placeholder: "Buscar por título",
            }}
            onEditButtonClick={(product) => {
              setSelectedProduct(product)
              setSheetOpen(true)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
