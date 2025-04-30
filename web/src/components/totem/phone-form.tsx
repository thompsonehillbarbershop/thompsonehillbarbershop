"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronRight, EraserIcon, PhoneIcon } from "lucide-react"
import { useEffect } from "react"
import { applyPhoneMask, formatPhoneToE164 } from "@/lib/utils"
import { z } from "@/lib/pt-zod"
import { useRouter } from "next/navigation"
import { EPages } from "@/lib/pages.enum"
import { VirtualKeyboard } from "../ui/virtual-keyboard"

const formSchema = z.object({
  phone: z.string().min(14, { message: "Telefone inválido" }).max(16, { message: "Telefone inválido" }),
})

export default function PhoneForm() {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
    },
  })

  useEffect(() => {
    const phone = form.getValues("phone")
    if (!phone) return
    const maskedPhone = applyPhoneMask(phone)
    form.setValue("phone", maskedPhone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch().phone])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.phone.includes("(99) 9 9999-9999")) {
      router.push(EPages.LOGOUT)
      return
    }

    const formattedPhone = formatPhoneToE164(values.phone)
    try {
      if (!formattedPhone) {
        form.setError("phone", { message: "Telefone inválido", type: "manual" })
        return
      }

      router.push(`${EPages.TOTEM_REGISTER}?tel=${encodeURIComponent(formattedPhone)}`)

    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-8 max-w-md">
          <div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormControl>
                    <Input
                      Icon={PhoneIcon}
                      type="text"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      className="w-full text-3xl md:text-4xl text-center"
                      readOnly
                      onFocus={(e) => e.target.blur()}
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={form.formState.isSubmitting}
              type="button"
              size="default"
              variant="outline"
              className="w-full mt-2 font-spectral tracking-wide font-semibold"
              onClick={() => form.setValue("phone", "")}
            >Limpar campo
              <EraserIcon />
            </Button>
          </div>
          <Button
            isLoading={form.formState.isSubmitting}
            disabled={form.getValues("phone").length < 14}
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
        layout="numpad"
        onKeyPress={(key) => {
          if (key === "BACKSPACE") {
            const phone = form.getValues("phone")
            form.setValue("phone", phone.slice(0, -1))
            return
          }
          const phone = form.getValues("phone")
          form.setValue("phone", phone + key)
        }}
      />
    </div>
  )
}
