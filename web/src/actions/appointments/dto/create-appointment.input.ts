import { z } from "@/lib/pt-zod"

export const createAppointmentSchema = z.object({
  customerId: z.string(),
  attendantId: z.string().optional(),
  serviceIds: z.array(z.string()),
  redeemCoupon: z.string().optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>