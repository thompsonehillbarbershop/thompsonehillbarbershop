import { z } from "@/lib/pt-zod"
import { EAppointmentStatuses, EPaymentMethod } from "@/models/appointment"

export const updateAppointmentSchema = z.object({
  attendantId: z.string().optional(),
  serviceIds: z.array(z.string().nonempty({ message: "Deve selecionar um serviço" })).min(1, {
    message: "Selecione pelo menos um serviço",
  }),
  redeemCoupon: z.string().optional(),
  status: z.nativeEnum(EAppointmentStatuses),
  paymentMethod: z.nativeEnum(EPaymentMethod).optional()
})

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>