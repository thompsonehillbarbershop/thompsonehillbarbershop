"use client"

import { EPages } from "@/lib/pages.enum"
import { z } from "@/lib/pt-zod"
import { applyDateMask, applyPhoneMask, cn, formatPhoneToE164, isDateValid } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { VirtualKeyboard } from "../ui/virtual-keyboard"
import { Button } from "../ui/button"
import { ChevronRight } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { EGender } from "@/models/customer"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { useTotem } from "@/hooks/use-totem"
import { toast } from "sonner"
import { createCustomerSchema } from "@/actions/customers/dto/create-customer.input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { addHours } from "date-fns"

export function isDateValid2(input: string): string {
  if (input.length !== 10) {
    return `Invalid date format. Expected dd/mm/yyyy, got ${input.length} characters.`
  }

  const [day, month, year] = input.split("/").map(Number)

  const date = addHours(new Date(`${year}-${month}-${day}`), 5)

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return `Invalid date: ${input}. Response from new Date is not a valid date. day: ${day}, month: ${month}, year: ${year}`
  }

  // Check if date is valid in calendar
  if (!date || date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return `Invalid date: ${input}. Date does not match calendar. day: ${day}, month: ${month}, year: ${year}`
  }
  return "date is valid"
}

export default function CustomerRegisterForm() {
  const [normalizedValues, setNormalizedValues] = useState("not sent yet")
  const formSchema = createCustomerSchema

  const { registerCustomer, partnerships } = useTotem()

  const searchParams = useSearchParams()
  const [activeField, setActiveField] = useState<keyof z.infer<typeof formSchema> | null>(null)
  const [keyBoardLayout, setKeyboardLayout] = useState<"qwerty" | "numpad">("qwerty")
  const router = useRouter()

  const phoneNumber = searchParams.get('tel')

  const partnershipOptions = useMemo(() => {
    const dynamicOptions = partnerships?.map((partnership) => ({
      label: partnership.name,
      label2: partnership.identificationLabel || "",
      value: partnership.id,
    })) || []

    return [
      { label: 'Não', value: "none", label2: "" },
      ...dynamicOptions
    ]
  }, [partnerships])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: phoneNumber ? applyPhoneMask(phoneNumber.substring(3)) : undefined,
      name: "",
      referralCodeUsed: "",
      gender: EGender.MALE,
      birthDate: "",
      partnershipId: "",
      partnershipIdentificationId: "",
    },
  })

  useEffect(() => {
    const birthDate = form.getValues("birthDate")
    console.log("birthDate", birthDate)

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
        referralCodeUsed: values.referralCodeUsed || undefined,
        birthDate: values.birthDate,
        partnershipId: values.partnershipId === "none" ? undefined : (values.partnershipId || undefined),
        partnershipIdentificationId: values.partnershipId === "none" ? undefined : (values.partnershipIdentificationId || undefined),
      }

      setNormalizedValues(JSON.stringify(normalizedValues, null, 2))

      const response = await registerCustomer({
        ...normalizedValues
      })

      if (response.data) {
        router.push(`${EPages.TOTEM_SCHEDULE}?id=${encodeURIComponent(response.data.id)}`)
      }

      if (response.error) {
        if (response.error.includes("Partnership identification")
        ) {
          form.setError("partnershipIdentificationId", {
            message: "Identificação do convênio é obrigatória",
            type: "manual"
          })
          return
        }

        console.error(response.error)
        toast.error(response.error)
      }

    } catch (error) {
      console.error(error)
      toast.error("Erro ao registrar cliente")
    }
  }

  return (
    <div className="w-full flex flex-col flex-1 justify-start items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-2 md:gap-6 max-w-2xl">
          <div className="flex flex-row justify-start items-start gap-4">
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
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="sm:text-xl md:text-2xl">Data de Nascimento</FormLabel>
                      <FormControl>
                        <div>
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
                          <p>{form.watch().birthDate}</p>
                          <p>{applyDateMask(form.watch().birthDate)}</p>
                          <p>{isDateValid(form.watch().birthDate) ? "true" : "false"}</p>
                          <p>{isDateValid2(form.watch().birthDate)}</p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
            </div>
          </div>
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
          <div className="w-full flex flex-row justify-between items-start gap-4">
            <FormField
              control={form.control}
              name="partnershipId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="sm:text-xl md:text-2xl">Possui Convênio?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        onFocus={() => {
                          setActiveField("partnershipId")
                        }}
                        className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "partnershipId" ? "border-ring ring-ring/50 ring-[3px]" : "")}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partnershipOptions?.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          className="text-center sm:text-2xl md:text-3xl"
                        >{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("partnershipId") && form.watch("partnershipId") !== "none" && (
              <FormField
                control={form.control}
                name="partnershipIdentificationId"
                render={({ field }) => (
                  <FormItem className="space-y-0.5 w-full">
                    <FormLabel className="sm:text-xl md:text-2xl">{partnershipOptions?.find(partnership => partnership.value === form.watch().partnershipId)?.label2 || "Oi"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        // autoFocus
                        onFocus={() => {
                          setKeyboardLayout("qwerty")
                          setActiveField("partnershipIdentificationId")
                        }}
                        className={cn("w-full text-center sm:text-xl md:text-2xl", activeField === "partnershipIdentificationId" ? "border-ring ring-ring/50 ring-[3px]" : "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <pre>{normalizedValues}</pre>
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