"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { useAdmin } from "@/hooks/use-admin"
import { useEffect } from "react"

const formSchema = z.object({
  creditCardFee: z.union([
    z.string({ message: "Valor inválido" })
      .refine((val) => /^(\d+([.,]\d*)?|\d*[.,]\d+)$/.test(val), {
        message: "Formato inválido. Use apenas números com . ou , como separador decimal."
      })
      .transform((val) => parseFloat(val.replace(",", "."))) // Converte , para . antes do parse
      .refine((val) => !isNaN(val) && val >= 0, {
        message: "O valor precisa ser positivo"
      }),
    z.number(),
  ]),
  debitCardFee: z.union([
    z.string({ message: "Valor inválido" })
      .refine((val) => /^(\d+([.,]\d*)?|\d*[.,]\d+)$/.test(val), {
        message: "Formato inválido. Use apenas números com . ou , como separador decimal."
      })
      .transform((val) => parseFloat(val.replace(",", "."))) // Converte , para . antes do parse
      .refine((val) => !isNaN(val) && val >= 0, {
        message: "O valor precisa ser positivo"
      }),
    z.number(),
  ])
})

interface Props {
  isLoading: boolean
}

export default function FeesForm({ isLoading }: Props) {
  const { settings, updateSettings } = useAdmin()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditCardFee: settings?.creditCardFee,
      debitCardFee: settings?.debitCardFee
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        // @ts-expect-error("Input is string validated")
        creditCardFee: settings.creditCardFee.toString().replace(".", ","),
        // @ts-expect-error("Input is string validated")
        debitCardFee: settings.debitCardFee.toString().replace(".", ",")
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateSettings({
        creditCardFee: values.creditCardFee,
        debitCardFee: values.debitCardFee
      })
      toast.success("Salvo com sucesso", { icon: <CheckIcon /> })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
        <FormField
          control={form.control}
          name="creditCardFee"
          render={({ field }) => (
            <FormItem>
              <div className="w-fit flex flex-row">
                <FormLabel className="w-36">Taxa Pgto Crédito</FormLabel>
                <FormControl>
                  <div className="relative w-28">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-muted-foreground border-r">R$</span>
                    <Input
                      className="pl-12"
                      {...field}
                    />
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="debitCardFee"
          render={({ field }) => (
            <FormItem>
              <div className="w-fit flex flex-row">
                <FormLabel className="w-36">Taxa Pgto Débito</FormLabel>
                <FormControl>
                  <div className="relative w-28">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-muted-foreground border-r">R$</span>
                    <Input
                      className="pl-12"
                      {...field}
                    />
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          isLoading={form.formState.isSubmitting || isLoading}
          type="submit"
          className="w-full sm:w-fit sm:px-10 self-center"
        >Salvar</Button>
      </form>
    </Form>
  )
}
