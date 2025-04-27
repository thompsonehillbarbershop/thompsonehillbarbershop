"use client"

import { EPages } from "@/lib/pages.enum"
import { z } from "@/lib/pt-zod"
import { applyDateMask, applyPhoneMask, cn, formatPhoneToE164, isDateValid } from "@/lib/utils"
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

const formSchema = z.object({
  givenName: z.string().nonempty({ message: "Obrigatório" }),
  familyName: z.string().optional(),
  phone: z.string().min(14, { message: "Telefone inválido" }).max(16, { message: "Telefone inválido" }),
  gender: z.nativeEnum(EGender),
  birthDate: z.string().refine(value => isDateValid(value), { message: "Data inválida" }),
})

export default function CustomerRegisterForm() {
  const searchParams = useSearchParams()
  const [activeField, setActiveField] = useState<keyof z.infer<typeof formSchema> | null>(null)
  const [keyBoardLayout, setKeyboardLayout] = useState<"qwerty" | "numpad">("qwerty")
  const router = useRouter()

  const phoneNumber = searchParams.get('tel')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phoneNumber ? applyPhoneMask(phoneNumber.substring(3)) : undefined,
      familyName: "",
      givenName: "",
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
        birthDate: new Date(`${year}-${month}-${day}`).toISOString(),
      }

      console.log("Normalized Values: ", normalizedValues)
      router.push(`${EPages.TOTEM_SCHEDULE}?tel=${formattedPhone}`)

    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="w-full flex flex-col flex-1 justify-start items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-2 max-w-lg lg:w-lg">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
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
                  <FormLabel className="sm:text-xl md:text-2xl">Nome</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      autoFocus
                      onFocus={() => setActiveField("givenName")}
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
                <FormItem className="space-y-0.5 w-full">
                  <FormLabel className="sm:text-xl md:text-2xl">Sobrenome</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      onFocus={() => setActiveField("familyName")}
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
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
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
          <Button
            isLoading={form.formState.isSubmitting}
            type="submit"
            size="lg"
            className="w-full text-xl lg:text-2xl"
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