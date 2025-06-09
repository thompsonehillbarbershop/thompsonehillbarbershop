"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRef, useState } from "react"
import Image from "next/image"
import { CameraIcon } from "lucide-react"
import { createServiceSchema } from "@/actions/services/dto/create-service.input"
import { useAdmin } from "@/hooks/use-admin"
import { Switch } from "../ui/switch"

interface Props {
  onSuccess?: () => void
  onError?: () => void
}

export default function CreateServiceForm({ onSuccess, onError }: Props) {
  const { createService } = useAdmin()
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const form = useForm<z.infer<typeof createServiceSchema>>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: undefined,
      description: undefined,
      coverImage: undefined,
      value: 0,
      weight: 1,
    }
  })

  const photoRef = useRef<HTMLInputElement>(null)

  async function onSubmit(values: z.infer<typeof createServiceSchema>) {
    const coverImage = selectedFile?.name
    const imageContentType = selectedFile?.type

    try {
      const response = await createService({
        ...values,
        coverImage,
        imageContentType
      })
      if (response.data) {
        // Upload the photo to the google firebase server using the signed URL
        if (response.data.signedUrl) {
          await fetch(response.data.signedUrl, {
            method: "PUT",
            body: selectedFile,
            headers: {
              "Content-Type": selectedFile?.type || "image/jpeg",
            }
          })
        }
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

  async function handlePhotoInput(file: File) {
    setSelectedFile(file)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
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
          {!selectedFile && (
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
          {selectedFile && (
            <Image
              width={192}
              height={192}
              src={URL.createObjectURL(selectedFile)}
              alt="Foto capturada"
              className="size-48 object-cover rounded-lg aspect-square"
              onClick={() => photoRef.current?.click()}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="pt-4">
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="Digite o título do serviço"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="pt-4">
              <FormLabel>Descrição <i>(opcional)</i></FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite a descrição do serviço"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso</FormLabel>
              <FormControl>
                <Input
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-muted-foreground border-r">R$</span>
                  <Input
                    className="pl-12"
                    placeholder="Digite o valor do serviço"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="promoValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Promocional <i>(opcional)</i></FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-muted-foreground border-r">R$</span>
                  <Input
                    className="pl-12"
                    placeholder="Digite o valor do serviço"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="promoEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativar valor promocional</FormLabel>
                <FormDescription>
                  Ative para usar o valor promocional na tela de serviços
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
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
