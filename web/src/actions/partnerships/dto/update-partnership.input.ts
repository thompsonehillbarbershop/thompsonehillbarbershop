import { z } from "@/lib/pt-zod"
import { EPartnershipDiscountType, EPartnershipType } from "@/models/partnerships"
export const updatePartnershipSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  identificationLabel: z.string().nonempty("Identificação é obrigatória"),
  type: z.nativeEnum(EPartnershipType),
  discountValue: z.union([
    z.string({ message: "Valor inválido" })
      .refine((val) => /^(\d+([.,]\d*)?|\d*[.,]\d+)$/.test(val), {
        message: "Formato inválido. Use apenas números com . ou , como separador decimal."
      })
      .transform((val) => parseFloat(val.replace(",", "."))) // Converte , para . antes do parse
      .refine((val) => !isNaN(val) && val > 0, {
        message: "O valor precisa ser positivo e maior que zero"
      }),
    z.number().positive(),
  ]),
  discountType: z.nativeEnum(EPartnershipDiscountType),
  delete: z.boolean().optional()
})

export type UpdatePartnershipInput = z.infer<typeof updatePartnershipSchema>