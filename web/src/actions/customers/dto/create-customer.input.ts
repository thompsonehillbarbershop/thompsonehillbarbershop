import { z } from "@/lib/pt-zod"
import { isDateValid } from "@/lib/utils"
import { EGender } from "@/models/customer"

export const createCustomerSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  phoneNumber: z.string().min(13, { message: "Telefone inválido" }).max(16, { message: "Telefone inválido" }),
  birthDate: z.string()
    .refine(value => isDateValid(value), { message: "Data inválida" }),
  gender: z.nativeEnum(EGender),
  referralCodeUsed: z.string().optional(),

  profileImage: z.string().optional(),
  imageContentType: z.string().optional()
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>