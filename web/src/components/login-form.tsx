"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { PasswordInput } from "./ui/password-input"
import { loginAction } from "@/actions/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { EPages } from "@/lib/pages.enum"
import { EUserRole } from "@/models/user"

const formSchema = z.object({
  userName: z.string().nonempty({ message: "Campo obrigatório" }),
  password: z.string().min(6)
})

export default function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: undefined,
      password: undefined,
    },
  })
  const router = useRouter()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await loginAction({ ...values })
      toast.success("Login realizado com sucesso")
      setErrorMessage(null)

      console.log("Login realizado com sucesso", response)

      switch (response.userRole) {
        case EUserRole.TOTEM:
          console.log("Redirect to Totem")
          router.push(EPages.TOTEM_HOME)
          break
        case EUserRole.ADMIN:
          console.log("Redirect to Admin")
          router.push(EPages.ADMIN_DASHBOARD)
          break
        case EUserRole.MANAGER:
          router.push(EPages.ADMIN_DASHBOARD)
          break
        case EUserRole.ATTENDANT:
          router.push(EPages.ATTENDANCE_DASHBOARD)
          break
      }
    } catch (err) {
      const error = err as Error
      console.error(error)
      setErrorMessage(error.message)
      toast.error(error.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome de usuário" {...field} />
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
                <PasswordInput placeholder="Digite a senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && (
          <div className="text-destructive text-sm text-center">{errorMessage}</div>
        )}
        <Button
          isLoading={form.formState.isSubmitting}
          type="submit"
          className="w-full sm:w-fit sm:px-10 self-center"
        >
          Continuar
          <ChevronRightIcon />
        </Button>
      </form>
    </Form>
  )
}
