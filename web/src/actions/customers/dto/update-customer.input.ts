import { z } from "@/lib/pt-zod"
import { isDateValid } from "@/lib/utils"
import { EGender } from "@/models/customer"

export const updateCustomerSchema = z.object({
  name: z.string().nonempty("Nome é não pode estar vazio").optional(),
  phoneNumber: z.string().min(13, { message: "Telefone inválido" }).max(16, { message: "Telefone inválido" }).optional(),
  birthDate: z.string()
    .refine(value => isDateValid(value), { message: "Data inválida" })
    .optional(),
  gender: z.nativeEnum(EGender).optional(),
  referralCodeUsed: z.string().optional(),

  profileImage: z.string().optional(),
  imageContentType: z.string().optional(),

  partnershipId: z.string().optional(),
  partnershipIdentificationId: z.string().optional(),
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>