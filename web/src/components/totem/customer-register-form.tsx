"use client"

import { EPages } from "@/lib/pages.enum"
import { z } from "@/lib/pt-zod"
import { applyDateMask, applyPhoneMask, cn, formatPhoneToE164, isDateValid } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { VirtualKeyboard } from "../ui/virtual-keyboard"
import { Button } from "../ui/button"
import { CameraIcon, ChevronRight } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { EGender } from "@/models/customer"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import Image from "next/image"

const formSchema = z.object({
  givenName: z.string().nonempty({ message: "Obrigatório" }),
  familyName: z.string().optional(),
  phone: z.string().min(14, { message: "Telefone inválido" }).max(16, { message: "Telefone inválido" }),
  gender: z.nativeEnum(EGender),
  birthDate: z.string().refine(value => isDateValid(value), { message: "Data inválida" }),
  indicationCode: z.string().optional(),
})

export default function CustomerRegisterForm() {
  const searchParams = useSearchParams()
  const [activeField, setActiveField] = useState<keyof z.infer<typeof formSchema> | null>(null)
  const [keyBoardLayout, setKeyboardLayout] = useState<"qwerty" | "numpad">("qwerty")
  const router = useRouter()
  const photoRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const phoneNumber = searchParams.get('tel')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phoneNumber ? applyPhoneMask(phoneNumber.substring(3)) : undefined,
      familyName: "",
      givenName: "",
      indicationCode: "",
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
    form.setFocus("givenName")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const [day, month, year] = values.birthDate.split("/")
      const formattedPhone = formatPhoneToE164(values.phone)
      if (!formattedPhone) {
        form.setError("phone", { message: "Telefone inválido", type: "manual" })
        return
      }

      const normalizedValues = {
        givenName: values.givenName,
        familyName: values.familyName,
        phoneNumber: formattedPhone,
        gender: values.gender,
        indicationCode: values.indicationCode,
        birthDate: new Date(`${year}-${month}-${day}`).toISOString(),
      }

      console.log("Normalized Values: ", normalizedValues)
      router.push(`${EPages.TOTEM_SCHEDULE}?tel=${formattedPhone}`)

    } catch (error) {
      console.error(error)
    }
  }

  async function handlePhotoInput(file: File) {
    setSelectedFile(file)
    console.log("Photo input", file)
  }

  return (
    <div className="w-full flex flex-col flex-1 justify-start items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-2 md:gap-6 max-w-2xl">
          <div className="flex flex-row justify-start items-start gap-4">
            <div className="size-64 pt-4">
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
            </div>

            <div className="flex-1 flex flex-col gap-6 md:gap-8">
              <FormField
                control={form.control}
                name="phone"
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
                  name="givenName"
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
                            setActiveField("givenName")
                          }}
                          className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "givenName" ? "border-ring ring-ring/50 ring-[3px]" : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="familyName"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5 w-full hidden">
                      <FormLabel className="sm:text-xl md:text-2xl">Sobrenome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          onFocus={() => {
                            setKeyboardLayout("qwerty")
                            setActiveField("familyName")
                          }}
                          className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "familyName" ? "border-ring ring-ring/50 ring-[3px]" : "")}
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
            name="indicationCode"
            render={({ field }) => (
              <FormItem className="space-y-0.5 w-full max-w-sm self-center">
                <FormLabel className="sm:text-xl md:text-2xl">Possui código de indicação?</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    onFocus={() => {
                      setKeyboardLayout("qwerty")
                      setActiveField("indicationCode")
                    }}
                    className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "indicationCode" ? "border-ring ring-ring/50 ring-[3px]" : "")}
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