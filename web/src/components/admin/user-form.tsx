"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createUserSchema } from "@/actions/users/dtos/create-user.input"
import { EUserRole, EUserStatus, IUserView } from "@/models/user"
import { PasswordInput } from "../ui/password-input"
import { useEffect, useRef, useState } from "react"
import { useAdmin } from "@/hooks/use-admin"
import { Switch } from "../ui/switch"
import { CameraIcon } from "lucide-react"
import Image from "next/image"
import axios from "axios"

interface Props {
  forRole: EUserRole
  user?: IUserView
  onSuccess?: () => void
  onError?: () => void
}

export default function UserForm({ onSuccess, onError, forRole, user }: Props) {
  const formSchema = createUserSchema(user ? "update" : "create")
  const { createUser, updateUser } = useAdmin()
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name,
      password: undefined,
      userName: user?.userName,
      status: user?.status || EUserStatus.ACTIVE,
      role: forRole
    }
  })

  const photoRef = useRef<HTMLInputElement>(null)

  // Log form errors
  useEffect(() => {
    console.log(form.formState.errors)
  }, [form.formState.errors])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const profileImage = selectedFile?.name
    const profileImageContentType = selectedFile?.type

    try {
      if (user) {
        await updateUser({
          id: user.id,
          data: {
            name: values.name,
            password: values.password,
            role: forRole,
            status: values.status
          }
        })
        toast.success("Usuário atualizado com sucesso")
      } else {
        const user = await createUser({
          ...values,
          profileImage,
          profileImageContentType
        })

        // Upload the photo to the google firebase server using the signed URL
        if (user.profileImageSignedUrl) {
          await axios.put(user.profileImageSignedUrl, selectedFile, {
            headers: {
              "Content-Type": selectedFile?.type || "image/jpeg",
            }
          })
        }
        toast.success("Registrado com sucesso")
      }

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

  async function handlePhotoInput(file: File) {
    setSelectedFile(file)
    console.log("Photo input", file)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
        {forRole === EUserRole.ATTENDANT && !!user && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Ativo</FormLabel>
                  <FormDescription>
                    Deixando o atendente como ativo, irá exibi-lo na tela do totem
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === EUserStatus.ACTIVE}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? EUserStatus.ACTIVE : EUserStatus.INACTIVE)
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <div className="w-full h-48 pt-4 flex items-center justify-center">
          <input
            autoFocus={false}
            id="file"
            name="file"
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            ref={photoRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handlePhotoInput(file)
              }
            }}
          />
          {selectedFile ? (
            <Image
              width={192}
              height={192}
              src={URL.createObjectURL(selectedFile)}
              alt="Foto capturada"
              className="size-48 object-cover rounded-lg aspect-square"
              onClick={() => photoRef.current?.click()}
            />
          ) : (
            <Button
              autoFocus={false}
              type="button"
              variant="outline"
              className="w-full size-48"
              onClick={() => photoRef.current?.click()}
            >
              <CameraIcon className="size-24 stroke-[1.5px]" />
            </Button>
          )}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="pt-4">
              <FormLabel>{forRole === EUserRole.TOTEM ? "Descrição" : "Nome Completo"}</FormLabel>
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
                <Input
                  disabled={!!user}
                  placeholder="Digite um nome de usuário"
                  {...field}
                  value={field.value as string | undefined} />
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
              <FormLabel>Senha {user && <i>(opcional)</i>}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={user ? "Digite uma nova senha para alterar" : "Digite a senha para o novo usuário"} {...field} />
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
