"use client"

import { z } from "@/lib/pt-zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormItem, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { CheckIcon, ChevronLeftIcon, PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { useMemo, useRef, useState } from "react"
import { updateAppointmentSchema } from "@/actions/appointments/dto/update-appointment.input"
import { EAppointmentStatuses, EPaymentMethod, EPaymentMethodMapper, IAppointmentView } from "@/models/appointment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { IServiceView } from "@/models/service"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { H2 } from "../ui/typography"
import Indicator from "../ui/indicator"
import { Label } from "../ui/label"
import { IProductView } from "@/models/product"
import { useAppointments } from "@/hooks/use-appointments"
import { EPartnershipDiscountType, EPartnershipType, IPartnershipView } from "@/models/partnerships"
import LoadingIndicator from "../ui/loading-indicator"

interface Props {
  attendantId: string
  appointment: IAppointmentView
  services: IServiceView[]
  products: IProductView[]
  partnerships: IPartnershipView[]
  onSuccess?: () => void
  onError?: () => void
}

const FINAL_SUBMIT_STEP = 5

export default function AppointmentCheckoutForm({ attendantId, appointment, services, products, partnerships, onSuccess, onError }: Props) {
  const formSchema = updateAppointmentSchema

  const [step, setStep] = useState(0)

  const steps = ["Serviços Realizados", "Produtos", "Estacionamento", "Convênios", "Método de Pagamento", "Confirmação"]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendantId,
      paymentMethod: appointment.paymentMethod,
      // status: EAppointmentStatuses.ON_SERVICE,
      serviceIds: appointment.services.map((service) => service.id) || [],
      productIds: appointment.products.map((product) => product.id) || [],
      partnershipIds: appointment.partnerships?.map((partnership) => partnership.id) || [],
    },
  })

  const formRef = useRef<HTMLFormElement>(null)

  const { updateAppointment } = useAppointments()

  const [updatedAppointment, setUpdatedAppointment] = useState<IAppointmentView>(appointment)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const updatedData = await updateAppointment({
        id: appointment.id,
        data: {
          ...values,
          status: step === FINAL_SUBMIT_STEP ? EAppointmentStatuses.FINISHED : undefined,
        }
      })

      if (updatedData.data) {
        setUpdatedAppointment(updatedData.data)
      }

      if (onSuccess && step === FINAL_SUBMIT_STEP) onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar")
      if (onError) onError()
    }
  }

  const servicesOptions = useMemo(() => {
    return services.map((service) => ({
      label: `${service.name} - ${formatCurrency(service.promoEnabled && service.promoValue ? service.promoValue : service.value)}`,
      value: service.id,
    }))
  }, [services])

  const productsOptions = useMemo(() => {
    return products.map((product) => ({
      label: `${product.name} - ${formatCurrency(product.promoEnabled && product.promoValue ? product.promoValue : product.value)}`,
      value: product.id,
    }))
  }, [products])

  const parkingOptions = useMemo(() => {
    return partnerships.filter(partnership => partnership.type === EPartnershipType.PARKING).map((partnership) => ({
      label: `${partnership.name} - ${partnership.discountType === EPartnershipDiscountType.FIXED ? formatCurrency(partnership.discountValue) : formatPercentage(partnership.discountValue)}`,
      value: partnership.id,
    }))
  }, [partnerships])


  function handleAddService() {
    const serviceIds = form.getValues("serviceIds")
    // @ts-expect-error is validated
    form.setValue("serviceIds", [...serviceIds, ""])
    form.clearErrors("serviceIds")
  }

  function handleAddProduct() {
    const productIds = form.getValues("productIds") || []
    form.setValue("productIds", [...productIds, ""])
    form.clearErrors("productIds")
  }

  function handleRemoveService(index: number) {
    const serviceIds = form.getValues("serviceIds")
    const newServicesIds = serviceIds?.filter((_, i) => i !== index)
    form.reset({ ...form.getValues(), serviceIds: newServicesIds })
  }

  function handleRemoveProduct(index: number) {
    const productIds = form.getValues("productIds")
    const newProductIds = productIds?.filter((_, i) => i !== index)
    form.reset({ ...form.getValues(), productIds: newProductIds })
  }

  function handleAddPartnership(id: string) {
    const partnershipIds = form.getValues("partnershipIds") || []
    if (!partnershipIds.includes(id)) {
      form.setValue("partnershipIds", [...partnershipIds, id])
      form.clearErrors("partnershipIds")
    }
    handleNextStep()
  }

  function handleRemoveParkingPartnership() {
    const partnershipIds = form.getValues("partnershipIds") || []
    const newPartnershipIds = partnershipIds.filter((id) => !parkingOptions.some((option) => option.value === id))
    form.reset({ ...form.getValues(), partnershipIds: newPartnershipIds })
    handleNextStep()
  }

  function handleRemoveCommonPartnership() {
    const partnershipIds = form.getValues("partnershipIds") || []
    const newPartnershipIds = partnershipIds.filter((id) => id !== appointment.customer.partnershipId)
    form.reset({ ...form.getValues(), partnershipIds: newPartnershipIds })
    handleNextStep()
  }

  function handleBackStep() {
    switch (step) {
      // Skip partnership step if customer has no partnership
      case 4:
        if (appointment.customer.partnershipId) {
          setStep((prev) => prev - 1)
        } else {
          setStep((prev) => prev - 2)
        }
        break

      default:
        setStep((prev) => prev - 1)
        break
    }
  }

  function handleNextStep() {
    switch (step) {
      // Services step
      case 0:
        form.trigger("serviceIds")
          .then((isValid) => {
            if (isValid) setStep((prev) => prev + 1)
          })
        break

      // Products step
      case 1:
        form.trigger("productIds")
          .then((isValid) => {
            if (isValid) setStep((prev) => prev + 1)
          })
        break

      // Parking step
      case 2:
        // Check if customer has other partnerships and skip next if not
        if (appointment.customer.partnershipId) {
          setStep((prev) => prev + 1)
        } else {
          setStep((prev) => prev + 2)
        }
        break

      // Partnership step
      case 3:
        setStep((prev) => prev + 1)
        break

      // Payment method step && first submit 1 step
      case 4:
        formRef.current?.requestSubmit()
        setStep((prev) => prev + 1)
        break

      // Final Submit step
      case 5:
        formRef.current?.requestSubmit()
        break

      default:
        setStep((prev) => prev + 1)
        break
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full pt-6 flex flex-col gap-4"
        ref={formRef}
      >

        <H2 className="pb-4">{steps[step]}</H2>

        {/* Services */}
        {step === 0 && (
          <FormItem>
            <FormMessage>{form.getFieldState("serviceIds").error?.message}</FormMessage>
            {form.watch().serviceIds?.map((_, index) => (
              <div
                key={index}
              >
                <div
                  className="w-full flex justify-start items-center gap-1"
                >
                  <Select
                    onValueChange={(value) => {
                      form.setValue(`serviceIds.${index}`, value)
                    }}
                    defaultValue={form.getValues(`serviceIds.${index}`)}
                    value={form.getValues(`serviceIds.${index}`) || ""}
                  >
                    <SelectTrigger className="w-full text sm:text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {servicesOptions.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item.value}
                          className="text-lg sm:text-2xl"
                        >{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => handleRemoveService(index)}
                    className="h-14 w-12"
                  ><XIcon className="size-6" /></Button>
                </div>
                <FormMessage>{form.getFieldState(`serviceIds.${index}`).error?.message}</FormMessage>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleAddService}
              className="w-full border-3 border-dashed"
            ><PlusIcon /> Adicionar serviço</Button>
          </FormItem>
        )}

        {/* Products */}
        {step === 1 && (
          <FormItem>
            <FormMessage>{form.getFieldState("productIds").error?.message}</FormMessage>
            {form.watch().productIds?.map((_, index) => (
              <div
                key={index}
              >
                <div
                  className="w-full flex justify-start items-center gap-1"
                >
                  <Select
                    onValueChange={(value) => {
                      form.setValue(`productIds.${index}`, value)
                    }}
                    defaultValue={form.getValues(`productIds.${index}`)}
                    value={form.getValues(`productIds.${index}`) || ""}
                  >
                    <SelectTrigger className="w-full text sm:text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productsOptions.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item.value}
                          className="text-lg sm:text-2xl"
                        >{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => handleRemoveProduct(index)}
                    className="h-14 w-12"
                  ><XIcon className="size-6" /></Button>
                </div>
                <FormMessage>{form.getFieldState(`productIds.${index}`).error?.message}</FormMessage>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleAddProduct}
              className="w-full border-3 border-dashed"
            ><PlusIcon /> Adicionar Produto</Button>
          </FormItem>
        )}

        {/* Parking */}
        {step === 2 && (
          <FormItem>
            {parkingOptions.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="lg"
                variant={form.watch("partnershipIds")?.includes(item.value) ? "default" : "outline"}
                onClick={() => {
                  handleAddPartnership(item.value)
                }}
                className="text-lg sm:text-2xl"
              >
                {item.label}
              </Button>
            ))}
            <Button
              type="button"
              size="lg"
              // variant={form.watch("partnershipIds") === item ? "default" : "outline"}
              variant={!form.watch("partnershipIds")?.length ? "default" : "outline"}
              onClick={() => {
                handleRemoveParkingPartnership()
              }}
              className="text-lg sm:text-2xl"
            >
              {"Sem estacionamento"}
            </Button>
          </FormItem>
        )}

        {/* Partnership */}
        {step === 3 && (
          <FormItem className="flex flex-col gap-4">
            <Indicator className="text-lg sm:text-2xl md:text-2xl">

              {partnerships.find(partnership => partnership.id === appointment.customer.partnershipId)?.name || ""}
              {" - "}
              {partnerships.find(partnership => partnership.id === appointment.customer.partnershipId)?.discountType === EPartnershipDiscountType.FIXED ? formatCurrency(partnerships.find(partnership => partnership.id === appointment.customer.partnershipId)?.discountValue) : formatPercentage(partnerships.find(partnership => partnership.id === appointment.customer.partnershipId)?.discountValue)}

            </Indicator>
            <Indicator className="text-lg sm:text-2xl md:text-2xl">{appointment.customer.partnershipIdentificationId}</Indicator>
            <div className="w-full sm:flex flex-col sm:flex-row justify-start sm:justify-between items-center gap-4 space-y-2 sm:space-y-0">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  handleAddPartnership(appointment.customer.partnershipId || "")
                }}
                className="w-full text-lg sm:text-2xl sm:h-16 flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="size-6" />
                Confirmar Convênio
              </Button>
              <Button
                type="button"
                size="lg"
                variant="destructive"
                onClick={() => {
                  handleRemoveCommonPartnership()
                }}
                className="w-full text-lg sm:text-2xl sm:h-16 flex-1"
              >
                <XIcon className="size-6" />
                Negar Convênio
              </Button>
            </div>
          </FormItem>
        )}

        {/* Payment Method */}
        {step === 4 && (
          <FormItem>
            {Object.values(EPaymentMethod).map((item) => (
              <Button
                key={item}
                type="button"
                size="lg"
                variant={form.watch("paymentMethod") === item ? "default" : "outline"}
                onClick={() => {
                  form.setValue("paymentMethod", item)
                  handleNextStep()
                }}
                className="text-lg sm:text-2xl"
              >
                {EPaymentMethodMapper[item]}
              </Button>
            ))}
          </FormItem>
        )}

        {/* Checkout */}
        {step === 5 && form.formState.isSubmitting && (
          <div className="flex flex-col items-center justify-center gap-4">
            <LoadingIndicator size="lg" />
          </div>
        )}
        {step === 5 && !form.formState.isSubmitting && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row justify-between items-center gap-2">
              <Label className="flex-1 text-lg sm:text-2xl">Sub Total</Label>
              <Indicator className="flex-1 justify-end text-lg sm:text-2xl md:text-2xl text-foreground/70">{formatCurrency(updatedAppointment.totalPrice)}</Indicator>
            </div>
            <div className="flex flex-row justify-between items-center gap-2">
              <Label className="flex-1 text-lg sm:text-2xl">Descontos</Label>
              <Indicator className="flex-1 justify-end text-lg sm:text-2xl md:text-2xl text-foreground/70">{formatCurrency(updatedAppointment.discount)}</Indicator>
            </div>
            <div className="flex flex-row justify-between items-center gap-2">
              <Label className="flex-1 text-lg sm:text-2xl">Total</Label>
              <Indicator className="flex-1 justify-end text-lg sm:text-2xl md:text-2xl font-bold">{formatCurrency(updatedAppointment.finalPrice)}</Indicator>
            </div>
            <div className="flex flex-row justify-between items-center gap-2">
              <Label className="flex-1 text-lg sm:text-2xl">Método de Pagamento</Label>
              <Indicator className="flex-1 justify-end text-lg sm:text-2xl md:text-2xl text-foreground/70">{form.getValues().paymentMethod && EPaymentMethodMapper[form.getValues().paymentMethod as EPaymentMethod]}</Indicator>
            </div>
            <div className="flex flex-row justify-between items-center gap-2">
              <Label className="flex-1 text-lg sm:text-2xl">Taxa de Pagamento</Label>
              <Indicator className="flex-1 justify-end text-lg sm:text-2xl md:text-2xl text-foreground/70">{formatCurrency(updatedAppointment.paymentFee)}</Indicator>
            </div>
          </div>
        )}

        <div className="flex flex-row gap-2 w-full pt-6">
          <Button
            disabled={form.formState.isSubmitting}
            type="button"
            variant="secondary"
            size="lg"
            className="w-8"
            hidden={step === 0}
            onClick={handleBackStep}
          ><ChevronLeftIcon className="size-6" /></Button>

          <Button
            isLoading={form.formState.isSubmitting}
            type="button"
            size="lg"
            className="flex-1 text-lg sm:text-2xl"
            disabled={
              // Disable next button if on step payment method
              (step === 4)
              // Disable next button if step is parking
              || (step === 2)
              // Disable next button if step is partnership
              || (step === 3)
            }
            onClick={handleNextStep}
          >{step === FINAL_SUBMIT_STEP ? "Finalizar" : "Próximo"}</Button>
        </div>
      </form>
    </Form>
  )
}
