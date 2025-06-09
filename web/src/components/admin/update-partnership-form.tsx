"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updatePartnershipSchema } from "@/actions/partnerships/dto/update-partnership.input"
import { useEffect, useState } from "react"
import { useAdmin } from "@/hooks/use-admin"
import { Checkbox } from "../ui/checkbox"
import { EPartnershipDiscountType, EPartnershipDiscountTypeMapper, EPartnershipType, EPartnershipTypeMapper, IPartnershipView } from "@/models/partnerships"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface Props {
  partnership: IPartnershipView
  onSuccess?: () => void
  onError?: () => void
}

export default function PartnershipForm({ onSuccess, onError, partnership }: Props) {
  const { updatePartnership } = useAdmin()

  const formSchema = updatePartnershipSchema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: partnership.name,
      discountType: partnership.discountType,
      discountValue: partnership.discountValue,
      identificationLabel: partnership.identificationLabel,
      type: partnership.type,
    }
  })

  const [enableDelete, setEnableDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await updatePartnership({
        id: partnership.id,
        data: {
          ...values
        }
      })
      if (response.data) {
        toast.success("Registrado com sucesso")
        if (onSuccess) onSuccess()

        if (response.error) {
          console.error(response.error)
          toast.error(response.error)
          if (onError) onError()
        }
      }

    } catch (err) {
      const error = err as Error

      console.error(error)
      toast.error(error.message)
      if (onError) onError()
    }
  }

  async function handleDelete() {
    setIsDeleting(true)

    const response = await updatePartnership({
      id: partnership.id,
      data: {
        delete: true,
        discountType: partnership.discountType,
        discountValue: partnership.discountValue,
        identificationLabel: partnership.identificationLabel,
        type: partnership.type,
        name: partnership.name,
      }
    })
    setIsDeleting(false)
    if (response.data) {
      toast.success("Excluído com sucesso")
      if (onSuccess) onSuccess()
    } else {
      toast.error("Erro ao excluir")
      if (onError) onError()
    }
  }

  useEffect(() => {
    if (form.getValues().type === EPartnershipType.PARKING) {
      form.setValue("identificationLabel", "Ticket")
    } else {
      form.setValue("identificationLabel", partnership.identificationLabel || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch().type])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="pt-4">
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="Digite o nome do convênio"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Tipo do Convênio</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(EPartnershipType).map((item) => (
                    <SelectItem key={item} value={item}>{EPartnershipTypeMapper[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("type") === EPartnershipType.COMMON && (
          <FormField
            control={form.control}
            name="identificationLabel"
            render={({ field }) => (
              <FormItem className="pt-4">
                <FormLabel>Identificação</FormLabel>
                <FormDescription>Esse campo será exibido para orientar o cliente qual documento deve preencher no cadastro. Ex: CRM, OAB...</FormDescription>
                <FormControl>
                  <Input
                    placeholder="Digite o nome da identificação do convênio"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Tipo de Desconto</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(EPartnershipDiscountType).map((item) => (
                    <SelectItem key={item} value={item}>{EPartnershipDiscountTypeMapper[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch().discountType && (
          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-muted-foreground border-r">{form.watch().discountType === EPartnershipDiscountType.FIXED ? "R$" : "%"}</span>
                    <Input
                      className="pl-12"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            className="dark:border-destructive dark:data-[state=checked]:bg-destructive dark:data-[state=checked]:text-destructive-foreground size-8 border-2"
            checked={enableDelete}
            onCheckedChange={() => setEnableDelete(!enableDelete)}
          />
          <Button
            onClick={() => handleDelete()}
            disabled={!enableDelete}
            isLoading={isDeleting}
            type="button"
            variant="destructive"
            className="w-full flex-1"
          >Excluir</Button>
        </div>

        <Button
          isLoading={form.formState.isSubmitting}
          type="submit"
          size="lg"
          className="w-full"
        >Salvar</Button>
      </form>
    </Form>
  )
}
