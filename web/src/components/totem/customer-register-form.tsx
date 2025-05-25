"use client"

import { EPages } from "@/lib/pages.enum"
import { z } from "@/lib/pt-zod"
import { applyDateMask, applyPhoneMask, cn, formatPhoneToE164 } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { VirtualKeyboard } from "../ui/virtual-keyboard"
import { Button } from "../ui/button"
import { ChevronRight } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { EGender } from "@/models/customer"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
// import Image from "next/image"
import { useTotem } from "@/hooks/use-totem"
import { toast } from "sonner"
import { createCustomerSchema } from "@/actions/customers/dto/create-customer.input"

export default function CustomerRegisterForm() {
  const formSchema = createCustomerSchema

  const { registerCustomer } = useTotem()

  const searchParams = useSearchParams()
  const [activeField, setActiveField] = useState<keyof z.infer<typeof formSchema> | null>(null)
  const [keyBoardLayout, setKeyboardLayout] = useState<"qwerty" | "numpad">("qwerty")
  const router = useRouter()
  // const photoRef = useRef<HTMLInputElement>(null)
  // const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const phoneNumber = searchParams.get('tel')


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: phoneNumber ? applyPhoneMask(phoneNumber.substring(3)) : undefined,
      name: "",
      referralCodeUsed: "",
      gender: EGender.MALE,
      birthDate: "",
    },
  })

  useEffect(() => {
    const birthDate = form.getValues("birthDate")
    if (!birthDate) return
    const maskedDate = applyDateMask(birthDate)
    form.setValue("birthDate", maskedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch().birthDate])

  useEffect(() => {
    form.setFocus("name")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // const profileImage = selectedFile?.name
    // const imageContentType = selectedFile?.type

    try {
      const formattedPhone = formatPhoneToE164(values.phoneNumber)
      if (!formattedPhone) {
        form.setError("phoneNumber", { message: "Telefone inválido", type: "manual" })
        return
      }

      const normalizedValues = {
        name: values.name,
        phoneNumber: formattedPhone,
        gender: values.gender,
        referralCodeUsed: values.referralCodeUsed,
        birthDate: values.birthDate,
      }

      const response = await registerCustomer({
        ...normalizedValues,
        // profileImage,
        // imageContentType
      })

      if (response.data) {
        // Upload the photo to the google firebase server using the signed URL
        // if (response.data.signedUrl) {
        //   await fetch(response.data.signedUrl, {
        //     method: "PUT",
        //     body: selectedFile,
        //     headers: {
        //       "Content-Type": selectedFile?.type || "image/jpeg",
        //     }
        //   })
        // }

        router.push(`${EPages.TOTEM_SCHEDULE}?id=${encodeURIComponent(response.data.id)}`)
      }

      if (response.error) {
        console.error(response.error)
        toast.error(response.error)
      }

    } catch (error) {
      console.error(error)
      toast.error("Erro ao registrar cliente")
    }
  }

  // async function handlePhotoInput(file: File) {
  //   setSelectedFile(file)
  // }

  return (
    <div className="w-full flex flex-col flex-1 justify-start items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-2 md:gap-6 max-w-2xl">
          <div className="flex flex-row justify-start items-start gap-4">
            {/* <div className="size-64 pt-4">
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
                  width={256}
                  height={256}
                  src={URL.createObjectURL(selectedFile)}
                  alt="Foto capturada"
                  className="w-full h-full object-cover rounded-lg"
                  onClick={() => photoRef.current?.click()}
                />
              ) : (
                <Button
                  autoFocus={false}
                  type="button"
                  variant="outline"
                  className="w-full size-64"
                  onClick={() => photoRef.current?.click()}
                >
                  <CameraIcon className="size-24 stroke-[1.5px]" />
                  <span className="ml-2"></span>
                </Button>
              )}
            </div> */}

            <div className="flex-1 flex flex-col gap-6 md:gap-8">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-0.5 hidden">
                    <FormLabel className="sm:text-xl md:text-2xl">Telefone</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        disabled
                        className="w-full text-center sm:text-xl md:text-2xl"
                        {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="w-full flex justify-between items-start gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 w-full">
                      <FormLabel className="sm:text-xl md:text-2xl">Nome e Sobrenome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          // autoFocus
                          onFocus={() => {
                            setKeyboardLayout("qwerty")
                            setActiveField("name")
                          }}
                          className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "name" ? "border-ring ring-ring/50 ring-[3px]" : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="sm:text-xl md:text-2xl">Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        maxLength={10}
                        placeholder="dd/mm/aaaa"
                        readOnly
                        onFocus={() => {
                          setKeyboardLayout("numpad")
                          setActiveField("birthDate")
                        }}
                        className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "birthDate" ? "border-ring ring-ring/50 ring-[3px]" : "")}
                        {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3 w-full max-w-sm self-center pt-4">
                <FormLabel className="sm:text-xl md:text-2xl">Gênero</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={EGender.MALE} />
                      </FormControl>
                      <FormLabel className="sm:text-xl md:text-2xl">
                        Masculino
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={EGender.FEMALE} />
                      </FormControl>
                      <FormLabel className="sm:text-xl md:text-2xl">
                        Feminino
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referralCodeUsed"
            render={({ field }) => (
              <FormItem className="space-y-0.5 w-full max-w-sm self-center">
                <FormLabel className="sm:text-xl md:text-2xl">Possui código de indicação?</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    onFocus={() => {
                      setKeyboardLayout("qwerty")
                      setActiveField("referralCodeUsed")
                    }}
                    className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "referralCodeUsed" ? "border-ring ring-ring/50 ring-[3px]" : "")}
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
            className="w-full text-xl lg:text-2xl font-spectral tracking-wide font-semibold"
          >Continuar
            <ChevronRight />
          </Button>
        </form>
      </Form>
      <div className="flex-1"></div>
      <VirtualKeyboard
        layout={keyBoardLayout}
        enableToggle
        onKeyPress={(key) => {
          if (!activeField) return

          const value = form.getValues(activeField)
          if (key === "BACKSPACE") {
            form.setValue(activeField, value?.slice(0, -1))
          } else {
            form.setValue(activeField, value + key)
          }
        }}
        className="w-full"
      />
    </div>
  )
}