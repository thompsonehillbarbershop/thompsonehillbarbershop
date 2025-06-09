"use client"

import { z } from "@/lib/pt-zod"
import { EAppointmentStatuses, EAppointmentStatusesMapper, EPaymentMethod, EPaymentMethodMapper, IAppointmentView } from "@/models/appointment"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import ReactSelect from 'react-select'
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Indicator from "../ui/indicator"
import { differenceInMinutes, format } from "date-fns"
import { IUserView } from "@/models/user"
import { IServiceView } from "@/models/service"
import { updateAppointmentSchema } from "@/actions/appointments/dto/update-appointment.input"
import { PlusIcon, XIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useAppointments, UseAppointmentsParams } from "@/hooks/use-appointments"
import { IProductView } from "@/models/product"
import { Checkbox } from "../ui/checkbox"

interface Props {
  params: UseAppointmentsParams
  appointment: IAppointmentView
  attendants: IUserView[]
  services: IServiceView[]
  products: IProductView[]
  isLoading?: boolean
  onSuccess?: () => void
}

export default function AppointmentUpdateForm({ appointment, attendants, services, products, isLoading, onSuccess, params }: Props) {
  const [enableSaveButton, setEnableSaveButton] = useState(false)
  const formSchema = updateAppointmentSchema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendantId: appointment.attendant?.id,
      redeemCoupon: appointment.redeemCoupon,
      serviceIds: appointment.services.map((service) => service.id) || [],
      productIds: appointment.products.map((product) => product.id) || [],
      status: appointment.status,
      paymentMethod: appointment.paymentMethod,
    },
  })

  const { updateAppointment } = useAppointments(params)

  const attendantsOptions = useMemo(() => {
    return attendants.map((attendant) => ({
      label: attendant.name,
      value: attendant.id,
    }))
  }, [attendants])

  const servicesOptions = useMemo(() => {
    return services.map((service) => ({
      // label: `${service.name} - ${formatCurrency(service.promoEnabled && service.promoValue ? service.promoValue : service.value)}`,
      label: service.name,
      value: service.id,
    }))
  }, [services])

  const productsOptions = useMemo(() => {
    return products.map((product) => ({
      label: product.name,
      value: product.id,
    }))
  }, [products])

  function handleAddService() {
    const serviceIds = form.getValues("serviceIds")
    form.setValue("serviceIds", [...serviceIds, ""])
    form.clearErrors("serviceIds")
  }

  function handleRemoveService(index: number) {
    const serviceIds = form.getValues("serviceIds")
    const newServicesIds = serviceIds.filter((_, i) => i !== index)
    form.reset({ ...form.getValues(), serviceIds: newServicesIds })
  }

  function handleAddProduct() {
    const productIds = form.getValues("productIds") || []
    form.setValue("productIds", [...productIds, ""])
    form.clearErrors("productIds")
  }

  function handleRemoveProduct(index: number) {
    const productIds = form.getValues("productIds") || []
    const newProductIds = productIds.filter((_, i) => i !== index)
    form.reset({ ...form.getValues(), productIds: newProductIds })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await updateAppointment({
        id: appointment.id,
        data: values
      })
      if (response.data) {
        toast.success("Registrado com sucesso")
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar")
    }
  }

  const DEFAULT_LABEL_WIDTH = "w-28"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full pt-6 flex flex-col gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(EAppointmentStatuses).map((item) => (
                    <SelectItem
                      key={item}
                      value={item}
                    >{EAppointmentStatusesMapper[item].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <Indicator>{appointment?.customer.name}</Indicator>
        </FormItem>
        <FormItem className="flex flex-row">
          <FormLabel className={DEFAULT_LABEL_WIDTH}>Entrada</FormLabel>
          <Indicator>{format(new Date(appointment.createdAt), "dd/MM/yyyy - HH:mm")}</Indicator>
        </FormItem>
        {appointment.onServiceAt && (
          <FormItem className="flex flex-row">
            <FormLabel className={DEFAULT_LABEL_WIDTH}>Iniciado</FormLabel>
            <Indicator>{format(new Date(appointment.onServiceAt), "dd/MM/yyyy - HH:mm")} | {differenceInMinutes(new Date(appointment.onServiceAt), new Date(appointment.createdAt))} minutos</Indicator>
          </FormItem>
        )}
        {appointment.finishedAt && appointment.onServiceAt && (
          <FormItem className="flex flex-row">
            <FormLabel className={DEFAULT_LABEL_WIDTH}>Concluído</FormLabel>
            <Indicator>{format(new Date(appointment.finishedAt), "dd/MM/yyyy - HH:mm")} | {differenceInMinutes(new Date(appointment.finishedAt), new Date(appointment.onServiceAt))} minutos</Indicator>
          </FormItem>
        )}
        <FormItem>
          <FormLabel>Atendente</FormLabel>
          <ReactSelect
            options={attendantsOptions}
            value={attendantsOptions.find((option) => option.value === form.watch("attendantId"))}
            onChange={(option) => {
              form.setValue("attendantId", option?.value)
            }}
            placeholder="Selecione um atendente"
            isLoading={isLoading}
            isDisabled={isLoading}
            noOptionsMessage={() => "Nenhum atendente selecionado"}
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: "transparent",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                border: "none"
              }),
              container: (provided) => ({
                ...provided,
                backgroundColor: "var(--input)",
                borderRadius: "8px",
                height: "3.5rem",
              }),
              valueContainer: (provided) => ({
                ...provided,
                backgroundColor: "transparent",
                height: "3.5rem",
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected ? "var(--primary)" : state.isFocused ? "var(--accent)" : "var(--popover)",
                color: state.isSelected ? "var(--primary-foreground)" : state.isFocused ? "var(--accent-foreground)" : "var(--popover-foreground)",
                fontSize: "0.875rem"
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "var(--popover)",
                borderRadius: "0 0 8px 8px",
                marginTop: 0,
                zIndex: 9999,
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "var(--foreground)",
                fontSize: "0.875rem"
              }),
              input: (provided) => ({
                ...provided,
                color: "var(--foreground)",
                fontSize: "0.875rem"
              }),
              clearIndicator: (provided) => ({
                ...provided,
                color: "var(--muted-foreground)",
              }),
              indicatorSeparator: (provided) => ({
                ...provided,
                display: "none"
              }),
              dropdownIndicator: (provided) => ({
                ...provided,
                color: "var(--muted-foreground)",
                strokeWidth: 1,
              }),
            }}
          />
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Serviços</FormLabel>
          <FormMessage>{form.getFieldState("serviceIds").error?.message}</FormMessage>
          {form.watch().serviceIds.map((_, index) => (
            <div
              key={index}
            >
              <div
                className="w-full flex justify-start items-center gap-1"
              >
                <ReactSelect
                  options={servicesOptions}
                  value={servicesOptions.find((option) => option.value === form.watch(`serviceIds.${index}`))}
                  onChange={(option) => {
                    if (option?.value) {
                      form.setValue(`serviceIds.${index}`, option.value)
                    }
                  }}
                  className="w-full"
                  placeholder="Selecione um serviço"
                  isLoading={isLoading}
                  isDisabled={isLoading}
                  noOptionsMessage={() => "Nenhum serviço encontrado"}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      backgroundColor: "transparent",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      border: "none"
                    }),
                    container: (provided) => ({
                      ...provided,
                      backgroundColor: "var(--input)",
                      borderRadius: "8px",
                      height: "3.5rem",
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      backgroundColor: "transparent",
                      height: "3.5rem",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected ? "var(--primary)" : state.isFocused ? "var(--accent)" : "var(--popover)",
                      color: state.isSelected ? "var(--primary-foreground)" : state.isFocused ? "var(--accent-foreground)" : "var(--popover-foreground)",
                      fontSize: "0.875rem"
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "var(--popover)",
                      borderRadius: "0 0 8px 8px",
                      marginTop: 0,
                      zIndex: 9999,
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: "var(--foreground)",
                      fontSize: "0.875rem"
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: "var(--foreground)",
                      fontSize: "0.875rem"
                    }),
                    clearIndicator: (provided) => ({
                      ...provided,
                      color: "var(--muted-foreground)",
                    }),
                    indicatorSeparator: (provided) => ({
                      ...provided,
                      display: "none"
                    }),
                    dropdownIndicator: (provided) => ({
                      ...provided,
                      color: "var(--muted-foreground)",
                      strokeWidth: 1,
                    }),
                  }}
                />
                <Button
                  type="button"
                  disabled={isLoading}
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemoveService(index)}
                  className="h-14"
                ><XIcon /></Button>
              </div>
              <FormMessage>{form.getFieldState(`serviceIds.${index}`).error?.message}</FormMessage>
            </div>
          ))}
        </FormItem>
        <Button
          isLoading={isLoading}
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAddService}
          className="w-full border-3 border-dashed"
        ><PlusIcon /> Adicionar serviço</Button>
        <FormItem>
          <FormLabel>Produtos</FormLabel>
          <FormMessage>{form.getFieldState("productIds").error?.message}</FormMessage>
          {form.watch().productIds?.map((_, index) => (
            <div
              key={index}
            >
              <div
                className="w-full flex justify-start items-center gap-1"
              >
                <ReactSelect
                  options={productsOptions}
                  value={productsOptions.find((option) => option.value === form.watch(`productIds.${index}`))}
                  onChange={(option) => {
                    if (option?.value) {
                      form.setValue(`productIds.${index}`, option.value)
                    }
                  }}
                  className="w-full"
                  placeholder="Selecione um produto"
                  isLoading={isLoading}
                  isDisabled={isLoading}
                  noOptionsMessage={() => "Nenhum produto encontrado"}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      backgroundColor: "transparent",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      border: "none"
                    }),
                    container: (provided) => ({
                      ...provided,
                      backgroundColor: "var(--input)",
                      borderRadius: "8px",
                      height: "3.5rem",
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      backgroundColor: "transparent",
                      height: "3.5rem",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected ? "var(--primary)" : state.isFocused ? "var(--accent)" : "var(--popover)",
                      color: state.isSelected ? "var(--primary-foreground)" : state.isFocused ? "var(--accent-foreground)" : "var(--popover-foreground)",
                      fontSize: "0.875rem"
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "var(--popover)",
                      borderRadius: "0 0 8px 8px",
                      marginTop: 0,
                      zIndex: 9999,
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: "var(--foreground)",
                      fontSize: "0.875rem"
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: "var(--foreground)",
                      fontSize: "0.875rem"
                    }),
                    clearIndicator: (provided) => ({
                      ...provided,
                      color: "var(--muted-foreground)",
                    }),
                    indicatorSeparator: (provided) => ({
                      ...provided,
                      display: "none"
                    }),
                    dropdownIndicator: (provided) => ({
                      ...provided,
                      color: "var(--muted-foreground)",
                      strokeWidth: 1,
                    }),
                  }}
                />
                <Button
                  type="button"
                  disabled={isLoading}
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemoveProduct(index)}
                  className="h-14"
                ><XIcon /></Button>
              </div>
              <FormMessage>{form.getFieldState(`productIds.${index}`).error?.message}</FormMessage>
            </div>
          ))}
        </FormItem>
        <Button
          isLoading={isLoading}
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAddProduct}
          className="w-full border-3 border-dashed"
        ><PlusIcon /> Adicionar produto</Button>

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Método de Pagamento</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(EPaymentMethod).map((item) => (
                    <SelectItem
                      key={item}
                      value={item}
                    >{EPaymentMethodMapper[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormDescription
          hidden={appointment.status !== EAppointmentStatuses.FINISHED}
        >
          Alterar um atendimento que já foi finalizado não é recomendado, pois pode causar inconsistências nos dados.
        </FormDescription>
        <div className="flex items-center gap-2">
          <Checkbox
            className="size-8 border-2"
            checked={enableSaveButton}
            onCheckedChange={() => setEnableSaveButton(!enableSaveButton)}
            hidden={appointment.status !== EAppointmentStatuses.FINISHED}
          />
          <Button
            isLoading={form.formState.isSubmitting}
            type="submit"
            size="lg"
            className="w-full flex-1"
            disabled={appointment.status === EAppointmentStatuses.FINISHED && !enableSaveButton}
          >Salvar</Button>
        </div>
      </form>
    </Form>
  )
}
