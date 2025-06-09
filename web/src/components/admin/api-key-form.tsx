"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createApiKeySchema } from "@/actions/auth/dto/create-api-key.input"
import { useState } from "react"
import Indicator from "../ui/indicator"
import { useAdmin } from "@/hooks/use-admin"

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const { createApiKey } = useAdmin()

  const formSchema = createApiKeySchema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await createApiKey(values)

      if (response.data) {
        setApiKey(response.data.key)
        toast.success("Chave criada com sucesso")
      }

      if (response.error) {
        toast.error(response.error || "Erro ao criar chave")
      }

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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite um nome para a chave" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {apiKey && (
          <div className="space-y-2">
            <FormDescription>
              Esta é a chave gerada. Guarde-a em um local seguro, pois não será possível visualizá-la novamente.
            </FormDescription>
            <Indicator>{apiKey}</Indicator>
          </div>
        )}

        <Button
          isLoading={form.formState.isSubmitting}
          disabled={!!apiKey}
          type="submit"
          className="w-full sm:w-fit sm:px-10 self-center"
        >Cadastrar</Button>
      </form>
    </Form>
  )
}
