"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CameraIcon } from "lucide-react"
import { toast } from "sonner"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { EGender, EGenderMapper, ICustomerView } from "@/models/customer"
import { updateCustomerSchema } from "@/actions/customers/dto/update-customer.input"
import { format } from "date-fns"
import { tz } from "@date-fns/tz"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { applyDateMask, applyPhoneMask, formatPhoneToE164 } from "@/lib/utils"
import { useCustomers, UseCustomersParams } from "@/hooks/use-customers"
import { useAdmin } from "@/hooks/use-admin"
import { EPartnershipType } from "@/models/partnerships"

interface Props {
  customer: ICustomerView
  params: UseCustomersParams
  onSuccess?: () => void
  onError?: () => void
}

export default function UpdateCustomerForm({ onSuccess, onError, customer, params }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const { updateCustomer } = useCustomers(params)
  const { partnerships } = useAdmin()

  const partnershipOptions = useMemo(() => {
    const dynamicOptions = partnerships?.filter(partnership => partnership.type === EPartnershipType.COMMON).map((partnership) => ({
      label: partnership.name,
      label2: partnership.identificationLabel || "",
      value: partnership.id,
    })) || []

    return [
      { label: 'Nenhum', value: "none", label2: "" },
      ...dynamicOptions
    ]
  }, [partnerships])

  const formSchema = updateCustomerSchema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer.name,
      phoneNumber: applyPhoneMask(customer.phoneNumber.substring(3)),
      birthDate: format(new Date(customer.birthDate), "dd/MM/yyyy", {
        in: tz("Etc/UTC"),
      }),
      gender: customer.gender,
      profileImage: customer.profileImage,
      partnershipId: customer.partnershipId,
      partnershipIdentificationId: customer.partnershipIdentificationId
    }
  })

  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const phone = form.getValues("phoneNumber")
    if (!phone) return
    const maskedPhone = applyPhoneMask(phone)
    form.setValue("phoneNumber", maskedPhone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch().phoneNumber])

  useEffect(() => {
    const birthDate = form.getValues("birthDate")
    if (!birthDate) return
    const maskedDate = applyDateMask(birthDate)
    form.setValue("birthDate", maskedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch().birthDate])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const profileImage = selectedFile?.name
    const imageContentType = selectedFile?.type

    if (!values.birthDate || !values.phoneNumber) return

    const [day, month, year] = values.birthDate?.split("/").map(Number)
    const birthDate = new Date(year, month - 1, day)

    const formattedPhone = formatPhoneToE164(values.phoneNumber)
    if (!formattedPhone) {
      form.setError("phoneNumber", { message: "Telefone inválido", type: "manual" })
      return
    }

    try {
      const response = await updateCustomer({
        id: customer.id,
        data: {
          ...values,
          birthDate: birthDate.toISOString(),
          phoneNumber: formattedPhone,
          profileImage,
          imageContentType,
          partnershipId: values.partnershipId === "none" ? undefined : (values.partnershipId || undefined),
          partnershipIdentificationId: values.partnershipId === "none" ? undefined : (values.partnershipIdentificationId || undefined)
        }
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
      }

      if (response.error) {
        console.error(response.error)
        toast.error(response.error)

        if (response.error.includes("Telefone já cadastrado")) {
          form.setError("phoneNumber", { message: "Telefone já cadastrado", type: "manual" })
        }

        if (onError) onError()
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
          {!selectedFile && !customer?.profileImage && (
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
          {!selectedFile && !!customer?.profileImage && (
            <div className="relative">
              <Image
                width={192}
                height={192}
                src={customer?.profileImage}
                alt="Foto capturada"
                className="size-48 object-cover rounded-lg aspect-square"
              />
              <Button
                autoFocus={false}
                type="button"
                variant="default"
                className="absolute top-2 right-2 rounded-full size-8"
                onClick={() => photoRef.current?.click()}
              >
                <CameraIcon className="stroke-[1.5px]" />
              </Button>
            </div>
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
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="pt-4">
              <FormLabel>Telefone</FormLabel>
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
          name="birthDate"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  maxLength={10}
                  placeholder="dd/mm/aaaa"
                  {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Gênero</FormLabel>
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
                  {Object.values(EGender).map((item) => (
                    <SelectItem key={item} value={item}>{EGenderMapper[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partnershipId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Convênio</FormLabel>
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
                  {partnershipOptions?.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                    >{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partnershipIdentificationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identificação Convênio</FormLabel>
              <FormControl>
                <Input
                  disabled={form.watch().partnershipId === "none" || !form.watch().partnershipId}
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
