"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createUserSchema } from "@/actions/users/dtos/create-user.input"
import { EUserRole } from "@/models/user"
import { PasswordInput } from "../ui/password-input"
import { useEffect } from "react"
import { useAdmin } from "@/hooks/use-admin"

const formSchema = createUserSchema

interface Props {
  forRole: EUserRole
  onSuccess?: () => void
  onError?: () => void
}

export default function AddUserForm({ onSuccess, onError, forRole }: Props) {
  const { createUser } = useAdmin()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: undefined,
      password: undefined,
      userName: undefined,
      role: forRole
    }
  })

  // Log form errors
  useEffect(() => {
    console.log(form.formState.errors)
  }, [form.formState.errors])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createUser(values)
      toast.success("Registrado com sucesso")
      if (onSuccess) onSuccess()
    } catch (err) {
      const error = err as Error

      if (error.message.includes("Usuário já existe no sistema")) {
        form.setError("userName", {
          type: "manual",
          message: "Usuário já existe no sistema"
        })
      }

      console.error(error)
      toast.error(error.message)
      if (onError) onError()
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
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Digite um nome de usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Digite a senha para o novo usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          isLoading={form.formState.isSubmitting}
          type="submit"
          className="w-full sm:w-fit sm:px-10 self-center"
        >Salvar</Button>
      </form>
    </Form>
  )
}
