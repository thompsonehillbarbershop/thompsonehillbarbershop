import { z } from "@/lib/pt-zod"
import { EAppointmentStatuses, EPaymentMethod } from "@/models/appointment"

export const updateAppointmentSchema = z.object({
  attendantId: z.string().optional(),
  serviceIds: z.array(z.string().nonempty({ message: "Deve selecionar um serviço" })).min(1, {
    message: "Selecione pelo menos um serviço",
  }),
  productIds: z.array(z.string().nonempty({ message: "Deve selecionar um produto" })).optional(),
  redeemCoupon: z.string().optional(),
  status: z.nativeEnum(EAppointmentStatuses).optional(),
  paymentMethod: z.nativeEnum(EPaymentMethod).optional(),
  partnershipIds: z.array(z.string().nonempty({ message: "Deve selecionar uma parceria" })).optional(),
})

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>